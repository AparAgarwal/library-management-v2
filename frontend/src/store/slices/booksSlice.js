import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { booksAPI } from '../../services/api';

// Async thunks
export const fetchBooks = createAsyncThunk(
  'books/fetchBooks',
  async ({ page = 1, limit = 12 }, { rejectWithValue }) => {
    try {
      const response = await booksAPI.getAll(page, limit);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch books');
    }
  }
);

export const fetchBookById = createAsyncThunk(
  'books/fetchBookById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await booksAPI.getById(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch book');
    }
  }
);

export const searchBooks = createAsyncThunk(
  'books/searchBooks',
  async (query, { rejectWithValue }) => {
    try {
      const response = await booksAPI.search(query);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Search failed');
    }
  }
);

const booksSlice = createSlice({
  name: 'books',
  initialState: {
    list: [],
    currentBook: null,
    pagination: { page: 1, totalPages: 1 },
    loading: false,
    error: null,
  },
  reducers: {
    clearCurrentBook: (state) => {
      state.currentBook = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Books
      .addCase(fetchBooks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBooks.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.books;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchBooks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Book By ID
      .addCase(fetchBookById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBookById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentBook = action.payload;
      })
      .addCase(fetchBookById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Search Books
      .addCase(searchBooks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchBooks.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.books;
        state.pagination = { page: 1, totalPages: 1 };
      })
      .addCase(searchBooks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearCurrentBook, clearError } = booksSlice.actions;

// Selectors
export const selectBooks = (state) => state.books.list;
export const selectCurrentBook = (state) => state.books.currentBook;
export const selectBooksPagination = (state) => state.books.pagination;
export const selectBooksLoading = (state) => state.books.loading;
export const selectBooksError = (state) => state.books.error;

export default booksSlice.reducer;
