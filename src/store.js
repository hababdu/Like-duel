import { configureStore } from '@reduxjs/toolkit';
import ordersReducer from './features/auth/authSlice';
import authReducer from './features/orders/ordersSlice';

export const store = configureStore({
  reducer: {
    orders: ordersReducer,
    auth: authReducer,
  },
});