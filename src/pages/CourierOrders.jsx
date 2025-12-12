import React, { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import {
  Box, Typography, CircularProgress, Alert, Stack, Button, Card, CardContent, Divider,
  Chip, List, ListItem, ListItemText, ListItemAvatar, Avatar, Paper, Tabs, Tab,
  IconButton, Dialog, DialogActions, DialogContent, DialogTitle, Snackbar,
  useMediaQuery, ThemeProvider, createTheme, Fab
} from '@mui/material';
import {
  CheckCircle, LocalShipping, ShoppingCart, Directions, Timer, MonetizationOn, Today,
  Close, Work as WorkIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { uz } from 'date-fns/locale';
import PropTypes from 'prop-types';
import { register } from 'register-service-worker';

const BASE_URL = 'https://hosilbek02.pythonanywhere.com';
const AVAILABLE_ORDERS_API = `${BASE_URL}/api/user/available-orders-courier/`;
const OWN_ORDERS_API = `${BASE_URL}/api/user/courier-own-orders/`;
const ORDER_API = `${BASE_URL}/api/user/orders/`;
const COURIER_PROFILE_URL = `${BASE_URL}/api/user/couriers/`;
const PROFILE_URL = `${BASE_URL}/api/user/me/`;

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography color="error">Xato yuz berdi: {this.state.error?.message}</Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => window.location.reload()}
            sx={{ mt: 2 }}
          >
            Sahifani yangilash
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}
ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};

const theme = createTheme({
  palette: {
    primary: { main: '#0288d1' },
    secondary: { main: '#7b1fa2' },
    error: { main: '#d32f2f' },
    warning: { main: '#f57c00' },
    success: { main: '#388e3c' },
    info: { main: '#0288d1' },
    background: { default: '#f4f6f8', paper: '#ffffff' },
    text: { primary: '#212121', secondary: '#757575' },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          padding: '12px 24px',
          fontSize: '0.95rem',
          fontWeight: 700,
          textTransform: 'none',
          boxShadow: '0 3px 6px rgba(0,0,0,0.1)',
          '&:hover': {
            boxShadow: '0 5px 10px rgba(0,0,0,0.15)',
          },
          minWidth: '120px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          marginBottom: '16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '10px',
          fontWeight: 600,
          padding: '6px 12px',
          fontSize: '0.85rem',
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #e0e0e0',
          backgroundColor: '#fff',
          borderRadius: '12px 12px 0 0',
          padding: '0 8px',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          padding: '12px 16px',
          fontSize: '0.9rem',
          minHeight: '48px',
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          lineHeight: 1.5,
        },
      },
    },
  },
  typography: {
    fontFamily: [
      '"Inter"',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      'sans-serif',
    ].join(','),
    h6: { fontWeight: 700, fontSize: '1.3rem' },
    subtitle1: { fontWeight: 600, fontSize: '1rem' },
    body1: { fontSize: '0.95rem' },
    body2: { fontSize: '0.85rem' },
    caption: { fontSize: '0.8rem' },
  },
});

const CourierDashboard = () => {
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width:600px)');
  const [availableOrders, setAvailableOrders] = useState([]);
  const [ownOrders, setOwnOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [sessionCompletedOrders, setSessionCompletedOrders] = useState([]);
  const [sessionTime, setSessionTime] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    action: null,
  });
  const [timers, setTimers] = useState({});
  const timerRefs = useRef({});
  const [lastUpdated, setLastUpdated] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isToggling, setIsToggling] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [newOrderNotification, setNewOrderNotification] = useState(null);
  const previousAvailableOrders = useRef([]);
  const lastAvailableNotification = useRef(null);
  const isValidCoordinates = useCallback((latitude, longitude) => {
    return (
      latitude != null &&
      longitude != null &&
      !isNaN(parseFloat(latitude)) &&
      !isNaN(parseFloat(longitude)) &&
      parseFloat(latitude) >= -90 &&
      parseFloat(latitude) <= 90 &&
      parseFloat(longitude) >= -180 &&
      parseFloat(longitude) <= 180
    );
  }, []);
  const clearLocalStorage = useCallback(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userProfile');
  }, []);
  const handleFetchError = useCallback((err, defaultMessage = 'Maʼlumotlarni olishda xato') => {
    let errorMessage = defaultMessage;
    if (err.response) {
      console.error('API error response:', err.response.data);
      if (err.response.status === 401) {
        errorMessage = 'Sessiya muddati tugadi. Iltimos, qayta kiring.';
        clearLocalStorage();
        navigate('/login', { replace: true });
      } else {
        errorMessage = err.response.data?.detail || err.response.data?.message || errorMessage;
      }
    } else if (err.request) {
      errorMessage = 'Tarmoq xatosi. Iltimos, ulanishingizni tekshiring.';
    }
    setError(errorMessage);
  }, [navigate, clearLocalStorage]);
  const startTimer = useCallback((orderId, kitchenTime, setAt) => {
    if (!kitchenTime) return;
    let totalSeconds;
    if (typeof kitchenTime === 'string' && kitchenTime.includes(':')) {
      const [hours, minutes] = kitchenTime.split(':').map(Number);
      totalSeconds = hours * 3600 + minutes * 60;
    } else {
      totalSeconds = parseInt(kitchenTime) * 60;
    }
    let remainingSeconds = totalSeconds;
    const timerKey = `timer_start_${orderId}_kuryer_oldi`;
    if (setAt) {
      const setTime = new Date(setAt).getTime();
      const now = new Date().getTime();
      const elapsedSeconds = Math.floor((now - setTime) / 1000);
      remainingSeconds = totalSeconds - elapsedSeconds;
    } else {
      let startTime = localStorage.getItem(timerKey);
      if (!startTime) {
        startTime = new Date().toISOString();
        localStorage.setItem(timerKey, startTime);
      }
      const setTime = new Date(startTime).getTime();
      const now = new Date().getTime();
      const elapsedSeconds = Math.floor((now - setTime) / 1000);
      remainingSeconds = totalSeconds - elapsedSeconds;
    }
    if (timerRefs.current[orderId]) {
      clearInterval(timerRefs.current[orderId]);
      delete timerRefs.current[orderId];
    }
    setTimers((prev) => ({ ...prev, [orderId]: remainingSeconds }));
    timerRefs.current[orderId] = setInterval(() => {
      setTimers((prev) => {
        if (!prev[orderId]) return prev;
        const newTime = prev[orderId] - 1;
        if (newTime <= 0) {
          setError(`Buyurtma #${orderId} uchun oshxona vaqti tugadi!`);
        }
        return { ...prev, [orderId]: newTime };
      });
    }, 1000);
  }, [setError]);
  const stopTimer = useCallback((orderId) => {
    if (timerRefs.current[orderId]) {
      clearInterval(timerRefs.current[orderId]);
      delete timerRefs.current[orderId];
      setTimers((prev) => {
        const newTimers = { ...prev };
        delete newTimers[orderId];
        return newTimers;
      });
      localStorage.removeItem(`timer_start_${orderId}_kuryer_oldi`);
    }
  }, []);
  // Define fetchAvailableOrders first
  const fetchAvailableOrders = useCallback(async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Autentifikatsiya talab qilinadi');
      navigate('/login', { replace: true });
      setLoading(false);
      return;
    }
    try {
      const response = await axios.get(AVAILABLE_ORDERS_API, {
        headers: { Authorization: `Token ${token}` },
        timeout: 10000,
      });
      console.log('Available Orders API response:', response.data);
      const ordersData = Array.isArray(response.data) ? response.data : [];
      setAvailableOrders(ordersData.filter((order) => order.id));
    } catch (err) {
      handleFetchError(err, 'Mavjud buyurtmalarni olishda xato');
    } finally {
      setLoading(false);
    }
  }, [navigate, handleFetchError]);
  // Define fetchOwnOrders next
  const fetchOwnOrders = useCallback(async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Autentifikatsiya talab qilinadi');
      navigate('/login', { replace: true });
      setLoading(false);
      return;
    }
    try {
      const response = await axios.get(OWN_ORDERS_API, {
        headers: { Authorization: `Token ${token}` },
        timeout: 10000,
      });
      console.log('Own Orders API response:', response.data);
      const ordersData = Array.isArray(response.data) ? response.data : [response.data];
      Object.keys(timerRefs.current).forEach((orderId) => {
        if (!ordersData.some((order) => order.id === parseInt(orderId))) {
          stopTimer(orderId);
        }
      });
      setOwnOrders(ordersData.filter((order) => order.id));
      setLastUpdated(new Date());
      ordersData.forEach((order) => {
        if (order.kitchen_time && order.status === 'kuryer_oldi') {
          startTimer(order.id, order.kitchen_time, order.kitchen_time_set_at);
        } else {
          stopTimer(order.id);
        }
      });
    } catch (err) {
      handleFetchError(err, 'O‘z buyurtmalarini olishda xato');
    } finally {
      setLoading(false);
    }
  }, [navigate, startTimer, stopTimer, handleFetchError]);
  // Define fetchOrders after its dependencies
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      await Promise.all([fetchAvailableOrders(), fetchOwnOrders()]);
    } catch (err) {
      setError('Buyurtmalarni yuklashda xato yuz berdi');
    } finally {
      setLoading(false);
    }
  }, [fetchAvailableOrders, fetchOwnOrders]);
  // Define fetchProfile after fetchOrders
  const fetchProfile = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Autentifikatsiya talab qilinadi. Iltimos, tizimga kiring.');
      navigate('/login', { replace: true });
      setLoading(false);
      return;
    }
    try {
      const response = await axios.get(PROFILE_URL, {
        headers: { Authorization: `Token ${token}` },
        timeout: 10000,
      });
      console.log('Profile API response:', response.data);
      const userProfile = {
        ...response.data,
        courier_profile: {
          id: response.data.courier_profile?.id || null,
          is_active: response.data.courier_profile?.is_active ?? false,
          ...response.data.courier_profile,
        },
      };
      localStorage.setItem('userProfile', JSON.stringify(userProfile));
      setProfile(userProfile);
      if (!userProfile.roles?.is_courier) {
        setError('Siz kuryer sifatida ro‘yxatdan o‘tmagansiz.');
        clearLocalStorage();
        navigate('/login', { replace: true });
        setLoading(false);
        return;
      }
      if (!userProfile.courier_profile.id) {
        setError('Kuryer profili ID si topilmadi.');
        setLoading(false);
        return;
      }
      await fetchOrders();
    } catch (err) {
      handleFetchError(err, 'Profil maʼlumotlarini olishda xato');
      setLoading(false);
    }
  }, [navigate, clearLocalStorage, handleFetchError, fetchOrders]);
  const showConfirmation = useCallback((title, message, action) => {
    setConfirmDialog({ open: true, title, message, action });
  }, []);
  const handleClearCompleted = useCallback(() => {
    showConfirmation(
      'Tarixni tozalash',
      'Barcha tugallangan buyurtmalar tarixini tozalashni xohlaysizmi?',
      () => {
        localStorage.removeItem('completed_orders');
        setCompletedOrders([]);
        setSessionCompletedOrders([]);
        setSuccess('Tugallangan buyurtmalar tarixi tozalandi');
      }
    );
  }, [showConfirmation]);
  const showNewOrderNotification = useCallback((newOrders) => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    const orderCount = newOrders.length;
    const title = `Yangi Buyurtma${orderCount > 1 ? 'lar' : ''}`;
    const body = orderCount > 1
      ? `${orderCount} ta yangi buyurtma mavjud`
      : `Buyurtma #${newOrders[0].id} qabul qilish uchun tayyor`;
    if (notificationPermission === 'granted') {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, {
          body,
          icon: '/icons/icon-192x192.png',
          vibrate: [200, 100, 200],
          sound: '/notification.mp3',
          data: { url: '/orders' },
        });
      });
      // Voice notification
      const utterance = new SpeechSynthesisUtterance(body);
      utterance.lang = 'uz-UZ';
      speechSynthesis.speak(utterance);
    }
    setNewOrderNotification({ title, message: body, orders: newOrders });
  }, [notificationPermission]);
  const showAvailableOrdersNotification = useCallback((orders) => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    const orderCount = orders.length;
    const title = 'Mavjud Buyurtmalar';
    const body = `${orderCount} ta buyurtma qabul qilish uchun mavjud`;
    if (notificationPermission === 'granted') {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, {
          body,
          icon: '/icons/icon-192x192.png',
          vibrate: [200, 100, 200],
          sound: '/notification.mp3',
          data: { url: '/orders' },
        });
      });
      // Voice notification
      const utterance = new SpeechSynthesisUtterance(body);
      utterance.lang = 'uz-UZ';
      speechSynthesis.speak(utterance);
    }
    setNewOrderNotification({ title, message: body, orders });
  }, [notificationPermission]);
  const showKitchenTimeNotification = useCallback((kitchenTimeOrders) => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    const orderCount = kitchenTimeOrders.length;
    const title = 'Oshxona Vaqti Belgilandi';
    const body = orderCount > 1
      ? `${orderCount} ta buyurtma uchun oshxona vaqti belgilandi`
      : `Buyurtma #${kitchenTimeOrders[0].id} oshxona vaqti: ${kitchenTimeOrders[0].kitchen_time || 'N/A'}`;
    if (notificationPermission === 'granted') {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, {
          body,
          icon: '/icons/icon-192x192.png',
          vibrate: [200, 100, 200],
          sound: '/notification.mp3',
          data: { url: '/orders' },
        });
      });
      // Voice notification
      const utterance = new SpeechSynthesisUtterance(body);
      utterance.lang = 'uz-UZ';
      speechSynthesis.speak(utterance);
    }
    setNewOrderNotification({ title, message: body, orders: kitchenTimeOrders });
  }, [notificationPermission]);
  const handleApiRequest = useCallback(async (url, successMessage, orderId) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Autentifikatsiya talab qilinadi');
      navigate('/login', { replace: true });
      return;
    }
    try {
      await axios.post(url, {}, { headers: { Authorization: `Token ${token}` }, timeout: 10000 });
      setSuccess(successMessage);
      if (url.includes('mark-delivered')) {
        const order = ownOrders.find((o) => o.id === orderId);
        if (order) {
          const completedOrder = {
            ...order,
            status: 'buyurtma_topshirildi',
            completed_at: new Date().toISOString(),
          };
          const localOrders = JSON.parse(localStorage.getItem('completed_orders') || '[]')
            .filter((o) => o.id !== order.id)
            .concat([completedOrder]);
          localStorage.setItem('completed_orders', JSON.stringify(localOrders));
          setCompletedOrders(localOrders);
          setSessionCompletedOrders((prev) =>
            prev.filter((o) => o.id !== order.id).concat([completedOrder])
          );
        }
      }
      await fetchOrders();
    } catch (err) {
      let errorMessage = 'Amal bajarilmadi';
      if (err.response) {
        console.error('API request error:', err.response.data);
        errorMessage = err.response.data?.detail || err.response.data?.message || errorMessage;
        if (err.response.status === 401) {
          clearLocalStorage();
          navigate('/login', { replace: true });
        }
      }
      setError(errorMessage);
    }
  }, [ownOrders, navigate, clearLocalStorage, fetchOrders]);
  const handleMarkOnWay = useCallback(async (orderId) => {
    await handleApiRequest(
      `${ORDER_API}${orderId}/mark-on-way/`,
      'Buyurtma yo\'lda deb belgilandi!',
      orderId
    );
    stopTimer(orderId);
  }, [stopTimer, handleApiRequest]);
  const handleMarkDelivered = useCallback(async (orderId) => {
    await handleApiRequest(
      `${ORDER_API}${orderId}/mark-delivered/`,
      'Buyurtma yetkazib berildi deb belgilandi!',
      orderId
    );
    stopTimer(orderId);
  }, [stopTimer, handleApiRequest]);
  const handleAcceptOrder = useCallback(async (orderId) => {
    const activeOrderCount = ownOrders.filter((order) =>
      ['kuryer_oldi', 'kuryer_yolda'].includes(order.status)
    ).length;
    if (activeOrderCount >= 4) {
      setError("Siz bir vaqtning o'zida faqat 4 ta buyurtma qabul qila olasiz!");
      return;
    }
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Autentifikatsiya talab qilinadi');
      navigate('/login', { replace: true });
      return;
    }
    setActionLoading(true);
    try {
      await axios.post(
        `${ORDER_API}${orderId}/assign/`,
        {},
        { headers: { Authorization: `Token ${token}` }, timeout: 10000 }
      );
      setSuccess('Buyurtma qabul qilindi!');
      await fetchOrders();
    } catch (err) {
      let errorMessage = 'Buyurtma qabul qilinmadi';
      if (err.response) {
        console.error('Accept Order error:', err.response.data);
        if (err.response.status === 404) {
          errorMessage = 'Buyurtma topilmadi';
        } else if (err.response.status === 401) {
          errorMessage = 'Sessiya muddati tugadi';
          clearLocalStorage();
          navigate('/login', { replace: true });
        } else if (err.response.status === 400) {
          errorMessage = err.response.data.detail || 'Buyurtma holati noto\'g\'ri';
        } else {
          errorMessage = err.response.data?.detail || err.response.data?.message || errorMessage;
        }
      }
      setError(errorMessage);
    } finally {
      setActionLoading(false);
    }
  }, [ownOrders, navigate, clearLocalStorage, fetchOrders]);
  const handleToggleWorkStatus = useCallback(async () => {
    if (!profile?.courier_profile?.id) {
      setError('Kuryer profili ID si topilmadi.');
      return;
    }
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Autentifikatsiya talab qilinadi.');
      navigate('/login', { replace: true });
      return;
    }
    const newStatus = !profile.courier_profile.is_active;
    const updateUrl = `${COURIER_PROFILE_URL}${profile.courier_profile.id}/`;
    try {
      setIsToggling(true);
      await axios.patch(updateUrl, { is_active: newStatus }, {
        headers: { Authorization: `Token ${token}` },
        timeout: 10000,
      });
      setProfile((prev) => ({
        ...prev,
        courier_profile: { ...prev.courier_profile, is_active: newStatus },
      }));
      setSuccess(newStatus ? 'Siz endi navbatchisiz!' : 'Siz navbatdan chiqdingiz!');
    } catch (err) {
      handleFetchError(err, 'Ish holatini yangilashda xato');
    } finally {
      setIsToggling(false);
    }
  }, [profile, navigate, clearLocalStorage, handleFetchError]);
  const handleOpenNavigation = useCallback((latitude, longitude) => {
    if (!isValidCoordinates(latitude, longitude)) {
      setError('Noto\'g\'ri koordinatalar. Navigatsiya ochilmadi.');
      return;
    }
    try {
      const lat = parseFloat(latitude).toFixed(6);
      const lon = parseFloat(longitude).toFixed(6);
      const url = isMobile
        ? `google.navigation:q=${lat},${lon}`
        : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
      window.open(url, '_blank');
    } catch (err) {
      setError('Navigatsiyani ochishda xato.');
      console.error('Navigation error:', err);
    }
  }, [isMobile, isValidCoordinates]);
  const formatTimer = useCallback((seconds) => {
    if (seconds === undefined || seconds === null) return 'Belgilangan emas';
    const isNegative = seconds < 0;
    const absSeconds = Math.abs(seconds);
    const hours = Math.floor(absSeconds / 3600);
    const minutes = Math.floor((absSeconds % 3600) / 60);
    const secs = absSeconds % 60;
    const timeString = `${hours > 0 ? `${String(hours).padStart(2, '0')}:` : ''}${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    return isNegative ? `Kechikish: ${timeString}` : `Qoldi: ${timeString}`;
  }, []);
  const formatSessionTime = useCallback((seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, []);
  const formatDateTime = useCallback((dateString) => {
    if (!dateString) return '';
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: uz });
    } catch {
      return dateString;
    }
  }, []);
  const formatTime = useCallback((time) => {
    if (!time) return 'N/A';
    return typeof time === 'string' && time.includes(':') ? time : `${time} min`;
  }, []);
  const handleTabChange = useCallback((event, newValue) => {
    setActiveTab(newValue);
  }, []);
  const toggleOrderExpand = useCallback((orderId) => {
    setExpandedOrder((prev) => (prev === orderId ? null : orderId));
  }, []);
  const getStatusChip = useCallback((status) => {
    const statusMap = {
      buyurtma_tushdi: { label: 'Yangi', color: 'primary', icon: <CheckCircle /> },
      oshxona_vaqt_belgiladi: { label: 'Oshxona tayyorlamoqda', color: 'warning', icon: <CheckCircle /> },
      kuryer_oldi: { label: 'Qabul qilindi', color: 'info', icon: <CheckCircle /> },
      kuryer_yolda: { label: 'Yo\'lda', color: 'warning', icon: <LocalShipping /> },
      buyurtma_topshirildi: { label: 'Yetkazib berildi', color: 'success', icon: <CheckCircle /> },
      qabul_qilindi: { label: 'Qabul qilindi', color: 'secondary', icon: <CheckCircle /> },
    };
    const config = statusMap[status] || { label: status, color: 'default', icon: <CheckCircle /> };
    return (
      <Chip
        label={config.label}
        color={config.color}
        icon={config.icon}
        size="small"
        variant="filled"
        sx={{ fontWeight: 'bold', bgcolor: `${config.color}.light`, color: `${config.color}.dark` }}
      />
    );
  }, []);
  const handleConfirmAction = useCallback(async () => {
    if (confirmDialog.action) {
      setActionLoading(true);
      try {
        await confirmDialog.action();
      } catch (err) {
        setError('Amal bajarilmadi. Iltimos, qayta urinib ko\'ring.');
      } finally {
        setActionLoading(false);
      }
    }
    setConfirmDialog((prev) => ({ ...prev, open: false }));
  }, [confirmDialog]);
  const getTimerColor = useCallback((seconds) => {
    if (seconds === undefined || seconds === null) return 'text.secondary';
    return seconds <= 0 ? 'error.main' : seconds < 300 ? 'warning.main' : 'success.main';
  }, []);
  useEffect(() => {
    const initializeNotifications = async () => {
      if ('Notification' in window && 'serviceWorker' in navigator) {
        try {
          const permission = await Notification.requestPermission();
          setNotificationPermission(permission);
          if (permission === 'granted') {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: 'YOUR_PUBLIC_VAPID_KEY',
            });
            const token = localStorage.getItem('authToken');
            if (token) {
              await axios.post(`${BASE_URL}/api/notifications/subscribe/`, subscription, {
                headers: { Authorization: `Token ${token}` },
                timeout: 10000,
              });
              console.log('Push subscription sent to server');
            }
          }
        } catch (error) {
          console.error('Error setting up notifications:', error);
        }
      }
      register('/service-worker.js', {
        ready() {
          console.log('Service worker is ready.');
        },
        registered() {
          console.log('Service worker registered.');
        },
        error(error) {
          console.error('Service worker registration failed:', error);
        },
      });
    };
    const loadCompletedOrders = () => {
      const storedOrders = localStorage.getItem('completed_orders');
      if (storedOrders) {
        try {
          setCompletedOrders(JSON.parse(storedOrders));
        } catch (e) {
          console.error('Failed to parse completed orders:', e);
          localStorage.removeItem('completed_orders');
          setCompletedOrders([]);
        }
      }
    };
    console.log('useEffect started, fetching profile...');
    initializeNotifications();
    loadCompletedOrders();
    const sessionInterval = setInterval(() => {
      setSessionTime((prev) => prev + 1);
    }, 1000);
    fetchProfile();
    return () => {
      clearInterval(sessionInterval);
      Object.values(timerRefs.current).forEach((timer) => clearInterval(timer));
      timerRefs.current = {};
    };
  }, [fetchProfile]);
  useEffect(() => {
    if (availableOrders.length > 0 && notificationPermission === 'granted') {
      const newOrders = availableOrders.filter(
        (order) => !previousAvailableOrders.current.some((prev) => prev.id === order.id)
      );
      if (newOrders.length > 0) {
        showNewOrderNotification(newOrders);
      }
      const now = Date.now();
      if (!lastAvailableNotification.current || now - lastAvailableNotification.current >= 10000) {
        showAvailableOrdersNotification(availableOrders);
        lastAvailableNotification.current = now;
      }
      const kitchenTimeOrders = availableOrders.filter(
        (order) => order.status === 'oshxona_vaqt_belgiladi'
      );
      if (kitchenTimeOrders.length > 0) {
        showKitchenTimeNotification(kitchenTimeOrders);
      }
    }
    previousAvailableOrders.current = [...availableOrders];
  }, [availableOrders, notificationPermission, showNewOrderNotification, showAvailableOrdersNotification, showKitchenTimeNotification]);
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <Stack spacing={2} alignItems="center">
          <CircularProgress size={isMobile ? 40 : 60} />
          <Typography variant="body1" color="text.secondary">
            Ma'lumotlar yuklanmoqda...
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={fetchOrders}
          >
            Qayta yuklash
          </Button>
        </Stack>
      </Box>
    );
  }
  const activeOrders = ownOrders.filter((order) =>
    ['kuryer_oldi', 'kuryer_yolda'].includes(order.status)
  );
  const hasActiveOrders = activeOrders.length > 0;
  const today = new Date().toISOString().split('T')[0];
  const todayOrders = completedOrders.filter((order) => order.completed_at && order.completed_at.startsWith(today));
  const totalCompletedSalary = completedOrders.reduce((sum, order) => sum + (parseFloat(order.courier_salary) || 0), 0);
  const sessionSalary = sessionCompletedOrders.reduce((sum, order) => sum + (parseFloat(order.courier_salary) || 0), 0);
  const todaySalary = todayOrders.reduce((sum, order) => sum + (parseFloat(order.courier_salary) || 0), 0);
  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <Box sx={{ p: isMobile ? 1 : 3, maxWidth: 1200, margin: '0 auto', bgcolor: 'background.default' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6" fontWeight="bold">
              Kuryer Dashboard
            </Typography>
            <Button
              variant="contained"
              color={profile?.courier_profile?.is_active ? 'secondary' : 'primary'}
              startIcon={<WorkIcon />}
              onClick={handleToggleWorkStatus}
              disabled={isToggling || hasActiveOrders}
              sx={{ borderRadius: '10px', py: 1.5 }}
            >
              {isToggling ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                profile?.courier_profile?.is_active ? 'Smenani yakunlash' : 'Smenani boshlash'
              )}
            </Button>
          </Stack>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant={isMobile ? 'scrollable' : 'fullWidth'}
            scrollButtons="auto"
            sx={{ mb: 2, bgcolor: 'white', borderRadius: '12px' }}
            indicatorColor="primary"
            textColor="primary"
          >
            <Tab
              label={
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography>Mavjud ({availableOrders.length})</Typography>
                </Stack>
              }
            />
            <Tab
              label={
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography>Aktiv ({activeOrders.length})</Typography>
                </Stack>
              }
            />
            <Tab
              label={
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography>Tugallangan ({completedOrders.length})</Typography>
                </Stack>
              }
            />
          </Tabs>
          <Box sx={{ mb: isMobile ? 16 : 8 }}>
            {activeTab === 0 && (
              availableOrders.length > 0 ? (
                availableOrders.map((order) => (
                  <OrderCard
                    key={`available-${order.id}`}
                    order={order}
                    isMobile={isMobile}
                    expanded={expandedOrder === order.id}
                    onToggleExpand={toggleOrderExpand}
                    getStatusChip={getStatusChip}
                    showConfirmation={showConfirmation}
                    handleAcceptOrder={handleAcceptOrder}
                    handleMarkOnWay={handleMarkOnWay}
                    handleMarkDelivered={handleMarkDelivered}
                    actionLoading={actionLoading}
                    timers={timers}
                    formatTimer={formatTimer}
                    formatTime={formatTime}
                    formatDateTime={formatDateTime}
                    handleOpenNavigation={handleOpenNavigation}
                    getTimerColor={getTimerColor}
                    isAvailableOrder
                    profile={profile}
                  />
                ))
              ) : (
                <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                  <Typography variant="body1" color="text.secondary">
                    Mavjud buyurtmalar yo'q
                  </Typography>
                </Paper>
              )
            )}
            {activeTab === 1 && (
              activeOrders.length > 0 ? (
                activeOrders.map((order) => (
                  <OrderCard
                    key={`active-${order.id}`}
                    order={order}
                    isMobile={isMobile}
                    expanded={expandedOrder === order.id}
                    onToggleExpand={toggleOrderExpand}
                    getStatusChip={getStatusChip}
                    showConfirmation={showConfirmation}
                    handleMarkOnWay={handleMarkOnWay}
                    handleMarkDelivered={handleMarkDelivered}
                    actionLoading={actionLoading}
                    timers={timers}
                    formatTimer={formatTimer}
                    formatTime={formatTime}
                    formatDateTime={formatDateTime}
                    handleOpenNavigation={handleOpenNavigation}
                    getTimerColor={getTimerColor}
                    profile={null}
                  />
                ))
              ) : (
                <Paper sx={{ p: 2, textAlign: 'center', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                  <Typography variant="body1" color="text.secondary">
                    Aktiv buyurtmalar yo'q
                  </Typography>
                </Paper>
              )
            )}
            {activeTab === 2 && (
              <Box>
                <Paper sx={{ p: 2, mb: 2, borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                  <Stack direction={isMobile ? 'column' : 'row'} spacing={2} justifyContent="space-between">
                    <Stack spacing={1}>
                      <Typography variant="subtitle1" fontWeight="bold" color="success.main">
                        <MonetizationOn fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                        Umumiy daromad: {totalCompletedSalary.toLocaleString('uz-UZ')} UZS
                      </Typography>
                      <Typography variant="subtitle2" color="text.secondary">
                        <Today fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                        Bugun: {todayOrders.length} buyurtma, {todaySalary.toLocaleString('uz-UZ')} UZS
                      </Typography>
                      <Typography variant="subtitle2" color="text.secondary">
                        <Timer fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                        Sessiya vaqti: {formatSessionTime(sessionTime)}
                      </Typography>
                    </Stack>
                    <Button
                      onClick={handleClearCompleted}
                      variant="outlined"
                      color="error"
                      size="small"
                      sx={{ borderRadius: '10px', alignSelf: isMobile ? 'stretch' : 'center', padding: '8px 16px' }}
                      startIcon={<ShoppingCart />}
                    >
                      Tarixni tozalash
                    </Button>
                  </Stack>
                </Paper>
                {completedOrders.length > 0 ? (
                  completedOrders.map((order) => (
                    <OrderCard
                      key={`completed-${order.id}`}
                      order={order}
                      isMobile={isMobile}
                      expanded={expandedOrder === order.id}
                      onToggleExpand={toggleOrderExpand}
                      getStatusChip={getStatusChip}
                      showConfirmation={showConfirmation}
                      handleMarkOnWay={handleMarkOnWay}
                      handleMarkDelivered={handleMarkDelivered}
                      actionLoading={actionLoading}
                      timers={timers}
                      formatTimer={formatTimer}
                      formatTime={formatTime}
                      formatDateTime={formatDateTime}
                      handleOpenNavigation={handleOpenNavigation}
                      getTimerColor={getTimerColor}
                      profile={null}
                    />
                  ))
                ) : (
                  <Paper sx={{ p: 2, textAlign: 'center', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                    <Typography variant="body1" color="text.secondary">
                      Tugallangan buyurtmalar yo'q
                    </Typography>
                  </Paper>
                )}
              </Box>
            )}
          </Box>
          {newOrderNotification && (
            <Snackbar
              open={!!newOrderNotification}
              autoHideDuration={6000}
              onClose={() => setNewOrderNotification(null)}
              anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
              <Alert
                severity="info"
                onClose={() => setNewOrderNotification(null)}
                sx={{ width: '100%', borderRadius: '10px' }}
              >
                <Typography fontWeight="bold">{newOrderNotification.title}</Typography>
                <Typography>{newOrderNotification.message}</Typography>
                <Button
                  size="small"
                  onClick={() => {
                    setActiveTab(0);
                    setNewOrderNotification(null);
                  }}
                  sx={{ mt: 1 }}
                >
                  Ko'rish
                </Button>
              </Alert>
            </Snackbar>
          )}
          {isMobile && (
            <Fab
              color="primary"
              onClick={fetchOrders}
              sx={{ position: 'fixed', bottom: 80, right: 16 }}
            >
              <CheckCircle />
            </Fab>
          )}
          <Dialog
            open={confirmDialog.open}
            onClose={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
            fullWidth
            maxWidth="xs"
            sx={{ '& .MuiDialog-paper': { borderRadius: '16px', p: 2 } }}
          >
            <DialogTitle sx={{ fontWeight: 600 }}>{confirmDialog.title}</DialogTitle>
            <DialogContent>
              <Typography>{confirmDialog.message}</Typography>
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
                color="primary"
                disabled={actionLoading}
                sx={{ fontWeight: 600 }}
              >
                Bekor qilish
              </Button>
              <Button
                onClick={handleConfirmAction}
                color="primary"
                variant="contained"
                disabled={actionLoading}
                sx={{ fontWeight: 600, borderRadius: '10px' }}
              >
                {actionLoading ? <CircularProgress size={24} /> : 'Tasdiqlash'}
              </Button>
            </DialogActions>
          </Dialog>
          <Snackbar
            open={!!error}
            autoHideDuration={6000}
            onClose={() => setError('')}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          >
            <Alert severity="error" onClose={() => setError('')} sx={{ width: '100%', borderRadius: '10px' }}>
              {error}
            </Alert>
          </Snackbar>
          <Snackbar
            open={!!success}
            autoHideDuration={6000}
            onClose={() => setSuccess('')}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          >
            <Alert severity="success" onClose={() => setSuccess('')} sx={{ width: '100%', borderRadius: '10px' }}>
              {success}
            </Alert>
          </Snackbar>
          {lastUpdated && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 2, display: 'block', textAlign: 'center' }}
            >
              Oxirgi yangilanish: {formatDateTime(lastUpdated)}
            </Typography>
          )}
        </Box>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

const OrderCard = React.memo(({
  order,
  isMobile,
  expanded,
  onToggleExpand,
  getStatusChip,
  showConfirmation,
  handleAcceptOrder,
  handleMarkOnWay,
  handleMarkDelivered,
  actionLoading,
  timers,
  formatTimer,
  formatTime,
  formatDateTime,
  handleOpenNavigation,
  getTimerColor,
  isAvailableOrder,
  profile,
}) => {
  const isValid = isValidCoordinates(order.latitude, order.longitude);
  return (
    <Card
      variant="outlined"
      sx={{
        mb: 2,
        borderLeft: `4px solid ${
          order.status === 'buyurtma_topshirildi'
            ? theme.palette.success.main
            : order.status === 'kuryer_yolda'
            ? theme.palette.warning.main
            : order.status === 'kuryer_oldi'
            ? theme.palette.info.main
            : order.status === 'oshxona_vaqt_belgiladi'
            ? theme.palette.warning.main
            : theme.palette.primary.main
        }`,
        bgcolor: 'white',
        borderRadius: '16px',
      }}
    >
      <CardContent sx={{ p: isMobile ? 2 : 3 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          onClick={() => onToggleExpand(order.id)}
          sx={{ cursor: 'pointer', mb: 1 }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Typography variant="subtitle1" fontWeight="bold" color="primary">
              #{order.id}
            </Typography>
            {order.completed_at && (
              <Typography variant="caption" color="text.secondary">
                {formatDateTime(order.completed_at)}
              </Typography>
            )}
          </Stack>
          <Stack direction="row" alignItems="center" spacing={1}>
            {getStatusChip(order.status)}
            <IconButton size="small" disabled={actionLoading}>
              {expanded ? <Close /> : <CheckCircle />}
            </IconButton>
          </Stack>
        </Stack>
        {order.status === 'oshxona_vaqt_belgiladi' ? (
          <Stack direction={isMobile ? 'column' : 'row'} justifyContent="space-between" sx={{ mt: 1, gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Masofa: {order.full_time ? `${order.full_time} km` : 'N/A'}
            </Typography>
            <Typography variant="body2" fontWeight="bold" color="text.primary">
              Narx: {(parseFloat(order.total_amount) || 0).toLocaleString('uz-UZ')} UZS
            </Typography>
            <Typography variant="body2" fontWeight="bold" color="warning.main">
              Oshxona vaqti: {formatTime(order.kitchen_time)}
            </Typography>
          </Stack>
        ) : (
          <>
            <Stack direction={isMobile ? 'column' : 'row'} justifyContent="space-between" sx={{ mt: 1, gap: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                {order.kitchen?.name || 'Nomaʼlum oshxona'}
              </Typography>
              <Typography variant="body2" fontWeight="bold" color="text.primary">
                Oshxona: {(parseFloat(order.total_amount) || 0).toLocaleString('uz-UZ')} UZS
              </Typography>
            </Stack>
            <Stack direction={isMobile ? 'column' : 'row'} justifyContent="space-between" sx={{ mt: 1, gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Masofa: {order.full_time ? `${order.full_time} km` : 'N/A'}
              </Typography>
              <Stack direction="row" spacing={2}>
                <Typography variant="body2" fontWeight="bold" color="success.main">
                  Kuryer: {(parseFloat(order.courier_salary) || 0).toLocaleString('uz-UZ')} UZS
                </Typography>
                <Typography variant="body2" fontWeight="bold" color="primary.main">
                  Jami: {(parseFloat(order.courier_salary) + parseFloat(order.total_amount) || 0).toLocaleString('uz-UZ')} UZS
                </Typography>
              </Stack>
            </Stack>
          </>
        )}
        <Stack direction={isMobile ? 'column' : 'row'} justifyContent="space-between" alignItems={isMobile ? 'stretch' : 'center'} sx={{ mt: 2, gap: 1 }}>
          <Typography
            variant="body2"
            color={getTimerColor(timers[order.id])}
            sx={{
              fontWeight: timers[order.id] <= 0 ? 'bold' : 'normal',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Timer fontSize="small" />
            {order.status === 'kuryer_oldi' && timers[order.id] !== undefined
              ? formatTimer(timers[order.id])
              : `Oshxona vaqti: ${formatTime(order.kitchen_time)}`}
          </Typography>
          <Stack direction={isMobile ? 'column' : 'row'} spacing={1} sx={{ width: isMobile ? '100%' : 'auto' }}>
            {isAvailableOrder && (order.status === 'buyurtma_tushdi' || order.status === 'oshxona_vaqt_belgiladi') && (
              <Button
                variant="contained"
                color="success"
                fullWidth={isMobile}
                startIcon={<CheckCircle />}
                onClick={() =>
                  showConfirmation(
                    'Buyurtmani qabul qilish',
                    `Buyurtma #${order.id} ni qabul qilmoqchimisiz?`,
                    () => handleAcceptOrder(order.id)
                  )
                }
                disabled={actionLoading || !profile?.courier_profile?.is_active}
                sx={{ borderRadius: '10px', py: 1.5, fontSize: '0.9rem' }}
              >
                Qabul qilish
              </Button>
            )}
            {order.status === 'kuryer_oldi' && (
              <Button
                variant="contained"
                color="warning"
                fullWidth={isMobile}
                startIcon={<LocalShipping />}
                onClick={() =>
                  showConfirmation(
                    'Yo\'lda deb belgilash',
                    `Buyurtma #${order.id} ni yo\'lda deb belgilamoqchimisiz?`,
                    () => handleMarkOnWay(order.id)
                  )
                }
                disabled={actionLoading}
                sx={{ borderRadius: '10px', py: 1.5, fontSize: '0.9rem' }}
              >
                Yo\'lda
              </Button>
            )}
            {order.status === 'kuryer_yolda' && (
              <Button
                variant="contained"
                color="success"
                fullWidth={isMobile}
                startIcon={<CheckCircle />}
                onClick={() =>
                  showConfirmation(
                    'Yetkazib berildi deb belgilash',
                    `Buyurtma #${order.id} ni yetkazib berildi deb belgilamoqchimisiz?`,
                    () => handleMarkDelivered(order.id)
                  )
                }
                disabled={actionLoading}
                sx={{ borderRadius: '10px', py: 1.5, fontSize: '0.9rem' }}
              >
                Yetkazib berildi
              </Button>
            )}
            {isValid && (
              <Button
                variant="contained"
                color="primary"
                fullWidth={isMobile}
                startIcon={<Directions />}
                onClick={() => handleOpenNavigation(order.latitude, order.longitude)}
                disabled={actionLoading}
                sx={{ borderRadius: '10px', py: 1.5, fontSize: '0.9rem' }}
              >
                Yo\'nalishni ko\'rish
              </Button>
            )}
          </Stack>
        </Stack>
        {expanded && order.status !== 'oshxona_vaqt_belgiladi' && (
          <Box sx={{ mt: 2 }}>
            <Divider sx={{ my: 2 }} />
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body2">
                  <a
                    href={`tel:${order.contact_number}`}
                    style={{ color: theme.palette.primary.main, textDecoration: 'underline' }}
                  >
                    {order.contact_number || 'Nomaʼlum'}
                  </a>
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="flex-start">
                <Typography variant="body2" sx={{ flexGrow: 1 }}>
                  {order.shipping_address || 'Manzil kiritilmagan'}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body2">
                  To\'lov: {order.payment === 'naqd' ? 'Naqd' : 'Karta'}
                </Typography>
              </Stack>
              {order.notes && (
                <Stack direction="row" spacing={1} alignItems="flex-start">
                  <Typography variant="body2">Eslatma: {order.notes}</Typography>
                </Stack>
              )}
            </Stack>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mt: 2, mb: 1 }}>
              Mahsulotlar ({order.items?.length || 0})
            </Typography>
            <List dense disablePadding>
              {order.items && order.items.length > 0 ? (
                order.items.map((item, index) => (
                  <ListItem key={`${order.id}-item-${index}`} disablePadding sx={{ py: 0.5 }}>
                    <ListItemAvatar>
                      <Avatar
                        variant="rounded"
                        src={item.product?.photo ? `${BASE_URL}${item.product.photo}` : ''}
                        sx={{ width: 36, height: 36, bgcolor: 'background.default' }}
                      >
                        <ShoppingCart fontSize="small" />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={<Typography variant="body2">{item.product?.title || 'Nomaʼlum mahsulot'}</Typography>}
                      secondary={`${item.quantity} × ${(parseFloat(item.price) || 0).toLocaleString('uz-UZ')} UZS`}
                    />
                    <Typography variant="body2" fontWeight="bold">
                      {(item.quantity * (parseFloat(item.price) || 0)).toLocaleString('uz-UZ')} UZS
                    </Typography>
                  </ListItem>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Mahsulotlar mavjud emas
                </Typography>
              )}
            </List>
          </Box>
        )}
      </CardContent>
    </Card>
  );
});

OrderCard.propTypes = {
  order: PropTypes.shape({
    id: PropTypes.number.isRequired,
    status: PropTypes.string.isRequired,
    kitchen: PropTypes.shape({
      name: PropTypes.string,
    }),
    total_amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    courier_salary: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    full_time: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    kitchen_time: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    kitchen_time_set_at: PropTypes.string,
    completed_at: PropTypes.string,
    contact_number: PropTypes.string,
    shipping_address: PropTypes.string,
    payment: PropTypes.string,
    notes: PropTypes.string,
    items: PropTypes.arrayOf(
      PropTypes.shape({
        product: PropTypes.shape({
          title: PropTypes.string,
          photo: PropTypes.string,
        }),
        quantity: PropTypes.number,
        price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      })
    ),
    latitude: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    longitude: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }).isRequired,
  isMobile: PropTypes.bool.isRequired,
  expanded: PropTypes.bool.isRequired,
  onToggleExpand: PropTypes.func.isRequired,
  getStatusChip: PropTypes.func.isRequired,
  showConfirmation: PropTypes.func.isRequired,
  handleAcceptOrder: PropTypes.func.isRequired,
  handleMarkOnWay: PropTypes.func.isRequired,
  handleMarkDelivered: PropTypes.func.isRequired,
  actionLoading: PropTypes.bool.isRequired,
  timers: PropTypes.object.isRequired,
  formatTimer: PropTypes.func.isRequired,
  formatTime: PropTypes.func.isRequired,
  formatDateTime: PropTypes.func.isRequired,
  handleOpenNavigation: PropTypes.func.isRequired,
  getTimerColor: PropTypes.func.isRequired,
  isAvailableOrder: PropTypes.bool,
  profile: PropTypes.object,
};

export default CourierDashboard;