import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { adminAPI } from '../../services/api';

// Async thunks
export const fetchMembers = createAsyncThunk(
  'admin/fetchMembers',
  async ({ q = '', page = 1, limit = 25 }, { rejectWithValue }) => {
    try {
      const response = await adminAPI.listMembers({ q, page, limit });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch members');
    }
  }
);

export const fetchMemberDetails = createAsyncThunk(
  'admin/fetchMemberDetails',
  async (id, { rejectWithValue }) => {
    try {
      const response = await adminAPI.getMember(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch member details');
    }
  }
);

const adminSlice = createSlice({
  name: 'admin',
  initialState: {
    members: [],
    membersPagination: { page: 1, totalPages: 1 },
    currentMember: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearCurrentMember: (state) => {
      state.currentMember = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Members
      .addCase(fetchMembers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMembers.fulfilled, (state, action) => {
        state.loading = false;
        state.members = action.payload.members;
        state.membersPagination = action.payload.pagination;
      })
      .addCase(fetchMembers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Member Details
      .addCase(fetchMemberDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMemberDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.currentMember = action.payload;
      })
      .addCase(fetchMemberDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearCurrentMember, clearError } = adminSlice.actions;

// Selectors
export const selectMembers = (state) => state.admin.members;
export const selectMembersPagination = (state) => state.admin.membersPagination;
export const selectCurrentMember = (state) => state.admin.currentMember;
export const selectAdminLoading = (state) => state.admin.loading;
export const selectAdminError = (state) => state.admin.error;

export default adminSlice.reducer;
