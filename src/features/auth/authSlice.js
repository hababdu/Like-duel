import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const PROFILE_URL = 'https://hosilbek.pythonanywhere.com/api/user/me/';

// Async thunk for verifying token
export const verifyToken = createAsyncThunk(
  'auth/verifyToken',
  async (_, { rejectWithValue }) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      return rejectWithValue('Sessiya muddati tugagan yoki token yaroqsiz');
    }
    try {
      const response = await axios.get(PROFILE_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (err) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userProfile');
      return rejectWithValue('Sessiya muddati tugagan yoki token yaroqsiz. Iltimos, qayta kiring.');
    }
  }
);

// Async thunk for logging in
export const login = createAsyncThunk(
  'auth/login',
  async ({ username, password }, { rejectWithValue }) => {
    try {
      const response = await axios.post('https://hosilbek.pythonanywhere.com/api/user/login/', {
        username,
        password,
      });
      const { access_token, refresh_token } = response.data;
      localStorage.setItem('authToken', access_token);
      localStorage.setItem('refreshToken', refresh_token);
      const profileResponse = await axios.get(PROFILE_URL, {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      localStorage.setItem('userProfile', JSON.stringify(profileResponse.data));
      return profileResponse.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.detail || 'Login yoki parol xato. Iltimos, qayta urinib ko‘ring.'
      );
    }
  }
);

// Async thunk for logging out
export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userProfile');
      return null;
    } catch (err) {
      return rejectWithValue('Chiqishda xato yuz berdi');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    isAuthenticated: !!localStorage.getItem('authToken'),
    isLoading: true,
    error: '',
    user: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = '';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(verifyToken.pending, (state) => {
        state.isLoading = true;
        state.error = '';
      })
      .addCase(verifyToken.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(verifyToken.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.error = action.payload;
        state.user = null;
      })
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = '';
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.error = action.payload;
      })
      .addCase(logout.fulfilled, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.error = '';
      })
      .addCase(logout.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;