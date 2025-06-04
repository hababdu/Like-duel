import React, { useEffect, useState, useRef } from 'react';
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

// Error Boundary Component
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary xatosi:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography color="error">Xatolik yuz berdi. Iltimos, sahifani yangilang.</Typography>
        </Box>
      );
    }
    return this.props.children;
  }
}

// Modern and vibrant theme
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

const BASE_URL = 'https://hosilbek.pythonanywhere.com';
const AVAILABLE_ORDERS_API = `${BASE_URL}/api/user/available-orders-courier/`;
const OWN_ORDERS_API = `${BASE_URL}/api/user/courier-own-orders/`;
const ORDER_API = `${BASE_URL}/api/user/orders/`;
const COURIER_PROFILE_URL = `${BASE_URL}/api/user/couriers/`;
const PROFILE_URL = `${BASE_URL}/api/user/me/`;

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

  useEffect(() => {
    const storedOrders = localStorage.getItem('completed_orders');
    if (storedOrders) {
      try {
        setCompletedOrders(JSON.parse(storedOrders));
      } catch (e) {
        console.error('Failed to parse completed orders', e);
        localStorage.removeItem('completed_orders');
        setCompletedOrders([]);
      }
    }

    const sessionInterval = setInterval(() => {
      setSessionTime(prev => prev + 1);
    }, 1000);

    fetchProfile();

    return () => {
      clearInterval(sessionInterval);
      Object.keys(timerRefs.current).forEach(orderId => {
        clearInterval(timerRefs.current[orderId]);
        delete timerRefs.current[orderId];
      });
    };
  }, []);

  const fetchProfile = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Tizimga kirish talab qilinadi. Iltimos, login qiling.');
      navigate('/login', { replace: true });
      return;
    }

    try {
      const response = await axios.get(PROFILE_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userProfile = response.data;

      userProfile.courier_profile = {
        id: userProfile.courier_profile?.id || null,
        is_active: userProfile.courier_profile?.is_active ?? false,
        ...userProfile.courier_profile,
      };

      localStorage.setItem('userProfile', JSON.stringify(userProfile));
      setProfile(userProfile);

      if (!userProfile.roles?.is_courier) {
        setError('Siz kuryer sifatida ro‘yxatdan o‘tmagansiz.');
        clearLocalStorage();
        navigate('/login', { replace: true });
        return;
      }

      if (!userProfile.courier_profile.id) {
        setError('Kuryer profili ID si topilmadi.');
      }
    } catch (err) {
      handleFetchError(err, 'Profil ma’lumotlarini olishda xato yuz berdi');
    }
  };

  const handleToggleWorkStatus = async () => {
    if (!profile?.courier_profile?.id) {
      setError('Kuryer profili ID si topilmadi.');
      return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Tizimga kirish talab qilinadi.');
      navigate('/login', { replace: true });
      return;
    }

    const newStatus = !profile.courier_profile.is_active;
    const updateUrl = `${COURIER_PROFILE_URL}${profile.courier_profile.id}/`;

    try {
      setIsToggling(true);
      await axios.patch(updateUrl, { is_active: newStatus }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(prev => ({
        ...prev,
        courier_profile: { ...prev.courier_profile, is_active: newStatus },
      }));
      setSuccess(newStatus ? 'Siz ishga chiqdingiz!' : 'Siz ishni tugatdingiz!');
    } catch (err) {
      handleFetchError(err, 'Ish holatini yangilashda xato yuz berdi');
    } finally {
      setIsToggling(false);
    }
  };

  const clearLocalStorage = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userProfile');
  };

  const fetchAvailableOrders = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Autentifikatsiya talab qilinadi');
      setLoading(false);
      navigate('/login');
      return;
    }

    try {
      const response = await axios.get(AVAILABLE_ORDERS_API, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const ordersData = Array.isArray(response.data) ? response.data : [];
      setAvailableOrders(ordersData.filter(order => order.id));
    } catch (err) {
      handleFetchError(err);
    }
  };

  const fetchOwnOrders = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Autentifikatsiya talab qilinadi');
      setLoading(false);
      navigate('/login');
      return;
    }

    try {
      const response = await axios.get(OWN_ORDERS_API, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const ordersData = Array.isArray(response.data) ? response.data : [response.data];
      Object.keys(timerRefs.current).forEach(orderId => {
        if (!ordersData.some(order => order.id === parseInt(orderId))) {
          stopTimer(orderId);
        }
      });
      setOwnOrders(ordersData.filter(order => order.id));
      setLastUpdated(new Date());

      ordersData.forEach(order => {
        if (order.kitchen_time && order.status === 'kuryer_oldi') {
          startTimer(order.id, order.kitchen_time, order.kitchen_time_set_at);
        } else {
          stopTimer(order.id);
        }
      });
    } catch (err) {
      handleFetchError(err);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    await Promise.all([fetchAvailableOrders(), fetchOwnOrders()]);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    return () => {
      clearInterval(interval);
      Object.keys(timerRefs.current).forEach(orderId => {
        clearInterval(timerRefs.current[orderId]);
        delete timerRefs.current[orderId];
      });
    };
  }, []);

  const handleFetchError = (err, defaultMessage = 'Ma\'lumot olishda xatolik') => {
    let errorMessage = defaultMessage;
    if (err.response) {
      if (err.response.status === 401) {
        errorMessage = 'Sessiya muddati tugagan. Iltimos, qayta kiring';
        clearLocalStorage();
        navigate('/login');
      } else {
        errorMessage = err.response.data?.detail || err.response.data?.message || errorMessage;
      }
    } else if (err.request) {
      errorMessage = 'Tarmoq xatosi. Iltimos, ulanishingizni tekshiring';
    }
    setError(errorMessage);
  };

  const startTimer = (orderId, kitchenTime, setAt) => {
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

    setTimers(prev => ({ ...prev, [orderId]: remainingSeconds }));

    timerRefs.current[orderId] = setInterval(() => {
      setTimers(prev => {
        if (!prev[orderId]) return prev;
        const newTime = prev[orderId] - 1;
        if (newTime <= 0) {
          setError(`Buyurtma #${orderId} uchun oshxona vaqti tugadi!`);
        }
        return { ...prev, [orderId]: newTime };
      });
    }, 1000);
  };

  const stopTimer = orderId => {
    if (timerRefs.current[orderId]) {
      clearInterval(timerRefs.current[orderId]);
      delete timerRefs.current[orderId];
      setTimers(prev => {
        const newTimers = { ...prev };
        delete newTimers[orderId];
        return newTimers;
      });
      localStorage.removeItem(`timer_start_${orderId}_kuryer_oldi`);
    }
  };

  const formatTimer = seconds => {
    if (seconds === undefined || seconds === null) return 'Belgilanmagan';
    const isNegative = seconds < 0;
    const absSeconds = Math.abs(seconds);
    const hours = Math.floor(absSeconds / 3600);
    const minutes = Math.floor((absSeconds % 3600) / 60);
    const secs = absSeconds % 60;
    const timeString = `${hours > 0 ? `${String(hours).padStart(2, '0')}:` : ''}${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    return isNegative ? `Kechikish: ${timeString}` : `Qolgan: ${timeString}`;
  };

  const formatTime = kitchenTime => {
    if (!kitchenTime) return 'Belgilanmagan';
    if (typeof kitchenTime === 'string' && kitchenTime.includes(':')) {
      const [hours, minutes] = kitchenTime.split(':').map(Number);
      return `${hours > 0 ? `${hours} soat` : ''} ${minutes > 0 ? `${minutes} minut` : ''}`.trim();
    }
    const hours = Math.floor(kitchenTime / 60);
    const mins = kitchenTime % 60;
    return `${hours > 0 ? `${hours} soat` : ''} ${mins > 0 ? `${mins} minut` : ''}`.trim();
  };

  const formatSessionTime = seconds => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const formatDateTime = dateString => {
    if (!dateString) return '';
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: uz });
    } catch {
      return dateString;
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const toggleOrderExpand = orderId => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const getStatusChip = status => {
    const statusMap = {
      buyurtma_tushdi: { label: 'Yangi', color: 'primary', icon: <CheckCircle /> },
      oshxona_vaqt_belgiladi: { label: 'Oshxona tayyorlanmoqda', color: 'warning', icon: <CheckCircle /> },
      kuryer_oldi: { label: 'Qabul qilindi', color: 'info', icon: <CheckCircle /> },
      kuryer_yolda: { label: 'Yetkazilmoqda', color: 'warning', icon: <LocalShipping /> },
      buyurtma_topshirildi: { label: 'Yetkazildi', color: 'success', icon: <CheckCircle /> },
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
        sx={{ fontWeight: 'bold', bgcolor: config.color + '.light', color: config.color + '.dark' }}
      />
    );
  };

  const showConfirmation = (title, message, action) => {
    setConfirmDialog({ open: true, title, message, action });
  };

  const handleConfirmAction = async () => {
    if (confirmDialog.action) {
      setActionLoading(true);
      try {
        await confirmDialog.action();
      } catch (err) {
        setError('Amal bajarilmadi. Iltimos, qayta urinib ko\'ring');
      } finally {
        setActionLoading(false);
      }
    }
    setConfirmDialog({ ...confirmDialog, open: false });
  };

  const handleAcceptOrder = async orderId => {
    const activeOrderCount = ownOrders.filter(order =>
      ['kuryer_oldi', 'kuryer_yolda'].includes(order.status)
    ).length;

    if (activeOrderCount >= 4) {
      setError('Siz faqat 4 tagacha buyurtma olishingiz mumkin!');
      return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Autentifikatsiya talab qilinadi');
      navigate('/login');
      return;
    }

    setActionLoading(true);
    try {
      await axios.post(
        `${ORDER_API}${orderId}/assign/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Buyurtma qabul qilindi!');
      await fetchOrders();
    } catch (err) {
      let errorMessage = 'Buyurtmani qabul qilishda xatolik';
      if (err.response) {
        if (err.response.status === 404) {
          errorMessage = 'Buyurtma topilmadi';
        } else if (err.response.status === 401) {
          errorMessage = 'Sessiya muddati tugagan';
          clearLocalStorage();
          navigate('/login');
        } else if (err.response.status === 400) {
          errorMessage = err.response.data.detail || 'Buyurtma holati mos emas';
        } else {
          errorMessage = err.response.data?.detail || err.response.data?.message || errorMessage;
        }
      }
      setError(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkOnWay = async orderId => {
    await handleApiRequest(
      `${ORDER_API}${orderId}/mark-on-way/`,
      'Buyurtma yetkazilmoqda deb belgilandi!',
      orderId
    );
    stopTimer(orderId);
  };

  const handleMarkDelivered = async orderId => {
    await handleApiRequest(
      `${ORDER_API}${orderId}/mark-delivered/`,
      'Buyurtma yetkazib berildi deb belgilandi!',
      orderId
    );
    stopTimer(orderId);
  };

  const handleApiRequest = async (url, successMessage, orderId) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Autentifikatsiya talab qilinadi');
      navigate('/login');
      return;
    }

    try {
      await axios.post(url, {}, { headers: { Authorization: `Bearer ${token}` } });
      setSuccess(successMessage);

      if (url.includes('mark-delivered')) {
        const order = ownOrders.find(o => o.id === orderId);
        if (order) {
          const completedOrder = {
            ...order,
            status: 'buyurtma_topshirildi',
            completed_at: new Date().toISOString(),
          };
          const localOrders = JSON.parse(localStorage.getItem('completed_orders') || '[]')
            .filter(o => o.id !== order.id)
            .concat([completedOrder]);
          localStorage.setItem('completed_orders', JSON.stringify(localOrders));
          setCompletedOrders(localOrders);
          setSessionCompletedOrders(prev =>
            prev.filter(o => o.id !== order.id).concat([completedOrder])
          );
        }
      }

      await fetchOrders();
    } catch (err) {
      let errorMessage = 'Amal bajarilmadi';
      if (err.response) {
        errorMessage = err.response.data?.detail || err.response.data?.message || errorMessage;
        if (err.response.status === 401) {
          clearLocalStorage();
          navigate('/login');
        }
      }
      setError(errorMessage);
    }
  };

  const handleClearCompleted = () => {
    showConfirmation(
      'Tarixni tozalash',
      'Barcha yakunlangan buyurtmalar tarixini tozalashni xohlaysizmi?',
      () => {
        localStorage.removeItem('completed_orders');
        setCompletedOrders([]);
        setSessionCompletedOrders([]);
        setSuccess('Yakunlangan buyurtmalar tarixi tozalandi');
      }
    );
  };

  const handleOpenNavigation = (latitude, longitude) => {
    if (
      latitude == null || longitude == null ||
      isNaN(parseFloat(latitude)) || isNaN(parseFloat(longitude)) ||
      parseFloat(latitude) < -90 || parseFloat(latitude) > 90 ||
      parseFloat(longitude) < -180 || parseFloat(longitude) > 180
    ) {
      setError('Yaroqsiz koordinatalar. Navigatsiya ochilmadi.');
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
      setError('Navigatsiyani ochishda xatolik yuz berdi.');
      console.error('Navigation error:', err);
    }
  };

  const getTimerColor = seconds => {
    if (seconds === undefined || seconds === null) return 'text.secondary';
    return seconds <= 0 ? 'error.main' : seconds < 300 ? 'warning.main' : 'success.main';
  };

  if (loading && !availableOrders.length && !ownOrders.length) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress size={isMobile ? 40 : 60} />
      </Box>
    );
  }

  const activeOrders = ownOrders.filter(order => ['kuryer_oldi', 'kuryer_yolda'].includes(order.status));
  const hasActiveOrders = activeOrders.length > 0;
  const today = new Date().toISOString().split('T')[0];
  const todayOrders = completedOrders.filter(order => order.completed_at && order.completed_at.startsWith(today));
  const totalCompletedSalary = completedOrders.reduce((sum, order) => sum + (parseFloat(order.courier_salary) || 0), 0);
  const sessionSalary = sessionCompletedOrders.reduce((sum, order) => sum + (parseFloat(order.courier_salary) || 0), 0);
  const todaySalary = todayOrders.reduce((sum, order) => sum + (parseFloat(order.courier_salary) || 0), 0);

  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <Box sx={{ p: isMobile ? 1 : 3, maxWidth: 1200, margin: '0 auto', bgcolor: 'background.default' }}>
          {/* Header Section */}
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
                profile?.courier_profile?.is_active ? 'Ishni tugatish' : 'Ishga chiqish'
              )}
            </Button>
          </Stack>

          {/* Tabs */}
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
                  <Typography>Faol ({activeOrders.length})</Typography>
                </Stack>
              }
            />
            <Tab
              label={
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography>Yakunlangan ({completedOrders.length})</Typography>
                </Stack>
              }
            />
          </Tabs>

          {/* Orders List */}
          <Box sx={{ mb: isMobile ? 16 : 8 }}>
            {activeTab === 0 && (
              availableOrders.length > 0 ? (
                availableOrders.map(order => (
                  <OrderCard
                    key={`available-${order.id}`}
                    order={order}
                    isMobile={isMobile}
                    expanded={expandedOrder === order.id}
                    onToggleExpand={toggleOrderExpand}
                    getStatusChip={getStatusChip}
                    showConfirmation={showConfirmation}
                    handleAcceptOrder={handleAcceptOrder}
                    actionLoading={actionLoading}
                    timers={timers}
                    format PattersonTimer={formatTimer}
                    formatTime={formatTime}
                    formatDateTime={formatDateTime}
                    handleOpenNavigation={handleOpenNavigation}
                    getTimerColor={getTimerColor}
                    isAvailableOrder
                    profile={profile} // Pass profile prop
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
                activeOrders.map(order => (
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
                    profile={profile} // Pass profile prop
                  />
                ))
              ) : (
                <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                  <Typography variant="body1" color="text.secondary">
                    Faol buyurtmalar mavjud emas
                  </Typography>
                </Paper>
              )
            )}

            {activeTab === 2 && (
              <Box>
                <Paper sx={{ p: 2, mb: 2, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                  <Stack direction={isMobile ? 'column' : 'row'} spacing={2} justifyContent="space-between">
                    <Stack spacing={1}>
                      <Typography variant="subtitle1" fontWeight="bold" color="success.main">
                        <MonetizationOn fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                        Umumiy daromad: {totalCompletedSalary.toLocaleString('uz-UZ')} so'm
                      </Typography>
                      <Typography variant="subtitle2" color="text.secondary">
                        <Today fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                        Bugun: {todayOrders.length} ta buyurtma, {todaySalary.toLocaleString('uz-UZ')} so'm
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
                  completedOrders.map(order => (
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
                      profile={profile} // Pass profile prop
                    />
                  ))
                ) : (
                  <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                    <Typography variant="body1" color="text.secondary">
                      Yakunlangan buyurtmalar mavjud emas
                    </Typography>
                  </Paper>
                )}
              </Box>
            )}
          </Box>

          {/* Floating Action Button for Quick Refresh */}
          {isMobile && (
            <Fab
              color="primary"
              onClick={fetchOrders}
              sx={{ position: 'fixed', bottom: 80, right: 16 }}
            >
              <CheckCircle />
            </Fab>
          )}

          {/* Confirmation Dialog */}
          <Dialog
            open={confirmDialog.open}
            onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
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
                onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}
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

          {/* Snackbars */}
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

const OrderCard = ({
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
  const isValidCoordinates =
    order.latitude != null &&
    order.longitude != null &&
    !isNaN(parseFloat(order.latitude)) &&
    !isNaN(parseFloat(order.longitude)) &&
    parseFloat(order.latitude) >= -90 &&
    parseFloat(order.latitude) <= 90 &&
    parseFloat(order.longitude) >= -180 &&
    parseFloat(order.longitude) <= 180;

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
              Narx: {(parseFloat(order.total_amount) || 0).toLocaleString('uz-UZ')} so'm
            </Typography>
          </Stack>
        ) : (
          <>
            <Stack direction={isMobile ? 'column' : 'row'} justifyContent="space-between" sx={{ mt: 1, gap: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                {order.kitchen?.name || 'Noma\'lum oshxona'}
              </Typography>
              <Typography variant="body2" fontWeight="bold" color="text.primary">
                Oshxona: {(parseFloat(order.total_amount) || 0).toLocaleString('uz-UZ')} so'm
              </Typography>
            </Stack>

            <Stack direction={isMobile ? 'column' : 'row'} justifyContent="space-between" sx={{ mt: 1, gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Masofa: {order.full_time ? `${order.full_time} km` : 'N/A'}
              </Typography>
              <Stack direction="row" spacing={2}>
                <Typography variant="body2" fontWeight="bold" color="success.main">
                  Kuryer: {(parseFloat(order.courier_salary) || 0).toLocaleString('uz-UZ')} so'm
                </Typography>
                <Typography variant="body2" fontWeight="bold" color="primary.main">
                  Jami: {(parseFloat(order.courier_salary) + parseFloat(order.total_amount) || 0).toLocaleString('uz-UZ')} so'm
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
                    'Buyurtmani olish',
                    `Buyurtma #${order.id} ni qabul qilmoqchimisiz?`,
                    () => handleAcceptOrder(order.id)
                  )
                }
                disabled={actionLoading || !profile?.courier_profile?.is_active}
                sx={{ borderRadius: '10px', py: 1.5, fontSize: '0.9rem' }}
              >
                Olish
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
                    'Yetkazilmoqda',
                    `Buyurtma #${order.id} yetkazilmoqda deb belgilaysizmi?`,
                    () => handleMarkOnWay(order.id)
                  )
                }
                disabled={actionLoading}
                sx={{ borderRadius: '10px', py: 1.5, fontSize: '0.9rem' }}
              >
                Yolga chiqish
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
                    'Yetkazib berildi',
                    `Buyurtma #${order.id} yetkazib berildi deb belgilaysizmi?`,
                    () => handleMarkDelivered(order.id)
                  )
                }
                disabled={actionLoading}
                sx={{ borderRadius: '10px', py: 1.5, fontSize: '0.9rem' }}
              >
                Yetkazildi
              </Button>
            )}
            {isValidCoordinates && (
              <Button
                variant="contained"
                color="primary"
                fullWidth={isMobile}
                startIcon={<Directions />}
                onClick={() => handleOpenNavigation(order.latitude, order.longitude)}
                disabled={actionLoading}
                sx={{ borderRadius: '10px', py: 1.5, fontSize: '0.9rem' }}
              >
                Yo'nalishni ko'rish
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
                    {order.contact_number || 'Noma\'lum'}
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
                  To'lov: {order.payment === 'naqd' ? 'Naqd' : 'Karta'}
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
                      primary={<Typography variant="body2">{item.product?.title || 'Noma\'lum mahsulot'}</Typography>}
                      secondary={`${item.quantity} × ${(parseFloat(item.price) || 0).toLocaleString('uz-UZ')} so'm`}
                    />
                    <Typography variant="body2" fontWeight="bold">
                      {(item.quantity * (parseFloat(item.price) || 0)).toLocaleString('uz-UZ')} so'm
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
};

export default CourierDashboard;