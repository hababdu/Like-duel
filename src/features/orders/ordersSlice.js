import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const BASE_URL = 'https://hosilbek.pythonanywhere.com';
const AVAILABLE_ORDERS_API = `${BASE_URL}/api/user/available-orders-couryer/`;
const COURIER_ORDERS_API = `${BASE_URL}/api/user/courier-own-orders/`;
const ORDER_API = `${BASE_URL}/api/user/orders/`;

// Async thunk for fetching available orders (CourierOrdersDashboard)
export const fetchOrders = createAsyncThunk(
  'orders/fetchOrders',
  async (_, { rejectWithValue }) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      return rejectWithValue('Autentifikatsiya talab qilinadi');
    }
    try {
      const response = await axios.get(AVAILABLE_ORDERS_API, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return Array.isArray(response.data) ? response.data : [];
    } catch (err) {
      let errorMessage = 'Buyurtmalarni olishda xatolik';
      if (err.response) {
        if (err.response.status === 401) {
          errorMessage = 'Sessiya muddati tugagan. Iltimos, qayta kiring';
          localStorage.removeItem('authToken');
        } else {
          errorMessage = err.response.data?.detail || err.response.data?.message || errorMessage;
        }
      }
      return rejectWithValue(errorMessage);
    }
  }
);

// Async thunk for fetching courier's own orders (CourierOrders)
export const fetchCourierOrders = createAsyncThunk(
  'orders/fetchCourierOrders',
  async (_, { rejectWithValue }) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      return rejectWithValue('Autentifikatsiya talab qilinadi');
    }
    try {
      const response = await axios.get(COURIER_ORDERS_API, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Handle both array and single object responses
      const data = response.data;
      return Array.isArray(data) ? data : data && typeof data === 'object' ? [data] : [];
    } catch (err) {
      let errorMessage = 'Buyurtmalarni olishda xatolik';
      if (err.response) {
        if (err.response.status === 401) {
          errorMessage = 'Sessiya muddati tugagan. Iltimos, qayta kiring';
          localStorage.removeItem('authToken');
        } else {
          errorMessage = err.response.data?.detail || err.response.data?.message || errorMessage;
        }
      }
      return rejectWithValue(errorMessage);
    }
  }
);

// Async thunk for accepting an order
export const acceptOrder = createAsyncThunk(
  'orders/acceptOrder',
  async (orderId, { rejectWithValue, getState }) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      return rejectWithValue('Autentifikatsiya talab qilinadi');
    }
    try {
      const response = await axios.post(
        `${ORDER_API}${orderId}/assign/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Get the order from availableOrders to append to courierOrders
      const { availableOrders } = getState().orders;
      const acceptedOrder = availableOrders.find((order) => order.id === orderId);
      return { orderId, acceptedOrder: acceptedOrder ? { ...acceptedOrder, status: 'kuryer_oldi' } : null };
    } catch (err) {
      let errorMessage = 'Buyurtmani qabul qilishda xatolik';
      if (err.response) {
        if (err.response.status === 404) {
          errorMessage = 'Buyurtma topilmadi';
        } else if (err.response.status === 401) {
          errorMessage = 'Sessiya muddati tugagan';
          localStorage.removeItem('authToken');
        } else if (err.response.status === 400) {
          errorMessage = err.response.data.detail || 'Buyurtma holati mos emas';
        } else {
          errorMessage = err.response.data?.detail || err.response.data?.message || errorMessage;
        }
      }
      return rejectWithValue(errorMessage);
    }
  }
);

// Async thunk for marking order as on the way
export const markOnWay = createAsyncThunk(
  'orders/markOnWay',
  async (orderId, { rejectWithValue }) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      return rejectWithValue('Autentifikatsiya talab qilinadi');
    }
    try {
      await axios.post(
        `${ORDER_API}${orderId}/mark-on-way/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return orderId;
    } catch (err) {
      let errorMessage = 'Buyurtmani yetkazilmoqda deb belgilashda xatolik';
      if (err.response) {
        errorMessage = err.response.data?.detail || err.response.data?.message || errorMessage;
      }
      return rejectWithValue(errorMessage);
    }
  }
);

// Async thunk for marking order as delivered
export const markDelivered = createAsyncThunk(
  'orders/markDelivered',
  async (orderId, { rejectWithValue }) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      return rejectWithValue('Autentifikatsiya talab qilinadi');
    }
    try {
      await axios.post(
        `${ORDER_API}${orderId}/mark-delivered/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return orderId;
    } catch (err) {
      let errorMessage = 'Buyurtmani yetkazib berildi deb belgilashda xatolik';
      if (err.response) {
        errorMessage = err.response.data?.detail || err.response.data?.message || errorMessage;
      }
      return rejectWithValue(errorMessage);
    }
  }
);

const ordersSlice = createSlice({
  name: 'orders',
  initialState: {
    availableOrders: [],
    courierOrders: [],
    loading: false,
    error: '',
    lastFetch: null,
    totalOrdersCount: 0,
  },
  reducers: {
    clearError: (state) => {
      state.error = '';
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Available Orders
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
        state.error = '';
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.availableOrders = action.payload;
        state.totalOrdersCount = action.payload.length;
        state.lastFetch = new Date().toISOString();
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.totalOrdersCount = 0;
      })
      // Fetch Courier Orders
      .addCase(fetchCourierOrders.pending, (state) => {
        state.loading = true;
        state.error = '';
      })
      .addCase(fetchCourierOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.courierOrders = action.payload;
        state.lastFetch = new Date().toISOString();
      })
      .addCase(fetchCourierOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Accept Order
      .addCase(acceptOrder.pending, (state) => {
        state.loading = true;
        state.error = '';
      })
      .addCase(acceptOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.availableOrders = state.availableOrders.filter((order) => order.id !== action.payload.orderId);
        state.totalOrdersCount = state.availableOrders.length;
        if (action.payload.acceptedOrder) {
          state.courierOrders = [...state.courierOrders, action.payload.acceptedOrder];
        }
      })
      .addCase(acceptOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Mark On Way
      .addCase(markOnWay.pending, (state) => {
        state.loading = true;
        state.error = '';
      })
      .addCase(markOnWay.fulfilled, (state, action) => {
        state.loading = false;
        state.courierOrders = state.courierOrders.map((order) =>
          order.id === action.payload ? { ...order, status: 'yetkazilmoqda' } : order
        );
      })
      .addCase(markOnWay.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Mark Delivered
      .addCase(markDelivered.pending, (state) => {
        state.loading = true;
        state.error = '';
      })
      .addCase(markDelivered.fulfilled, (state, action) => {
        state.loading = false;
        state.courierOrders = state.courierOrders.map((order) =>
          order.id === action.payload ? { ...order, status: 'yetkazib_berildi' } : order
        );
      })
      .addCase(markDelivered.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = ordersSlice.actions;
export default ordersSlice.reducer;