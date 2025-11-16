import { useState, useEffect, useCallback, useRef } from 'react';
import { getErrorMessage } from '../utils/helpers';

/**
 * Custom hook for API calls with loading state, error handling, and automatic cleanup
 * @param {Function} apiFunc - The API function to call
 * @param {boolean} immediate - Whether to call the API immediately on mount
 * @returns {Object} - { data, loading, error, execute, reset }
 */
const useApi = (apiFunc, immediate = false) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);
  const cancelTokenRef = useRef(null);

  const execute = useCallback(
    async (...params) => {
      try {
        setLoading(true);
        setError(null);

        // Create cancel token
        const source = {
          cancelled: false,
          cancel: function () {
            this.cancelled = true;
          },
        };
        cancelTokenRef.current = source;

        const result = await apiFunc(...params);

        // Only update state if not cancelled
        if (!source.cancelled) {
          setData(result.data);
          setLoading(false);
          return result.data;
        }
      } catch (err) {
        // Only update state if not cancelled
        if (!cancelTokenRef.current?.cancelled) {
          const errorMessage = getErrorMessage(err);
          setError(errorMessage);
          setLoading(false);
          throw err;
        }
      }
    },
    [apiFunc]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (immediate) {
      execute();
    }

    // Cleanup function to cancel any pending requests
    return () => {
      if (cancelTokenRef.current) {
        cancelTokenRef.current.cancel();
      }
    };
  }, [execute, immediate]);

  return { data, loading, error, execute, reset };
};

export default useApi;
