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
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography color="error">Xato yuz berdi. Sahifani yangilang.</Typography>
          <Button variant="contained" onClick={() => window.location.reload()}>Yangilash</Button>
        </Box>
      );
    }
    return this.props.children;
  }
}
ErrorBoundary.propTypes = { children: PropTypes.node.isRequired };

const theme = createTheme({
  palette: {
    primary: { main: '#0288d1' },
    secondary: { main: '#7b1fa2' },
    error: { main: '#d32f2f' },
    warning: { main: '#f57c00' },
    success: { main: '#388e3c' },
    background: { default: '#f4f6f8', paper: '#ffffff' },
  },
  components: {
    MuiButton: { styleOverrides: { root: { borderRadius: '12px', padding: '8px 16px', fontWeight: 600 } } },
    MuiCard: { styleOverrides: { root: { borderRadius: '16px', mb: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' } } },
    MuiChip: { styleOverrides: { root: { borderRadius: '8px', fontWeight: 600 } } },
    MuiTabs: { styleOverrides: { root: { bgcolor: '#fff', borderRadius: '12px 12px 0 0' } } },
    MuiTab: { styleOverrides: { root: { textTransform: 'none', fontWeight: 600 } } },
  },
  typography: { fontFamily: '"Inter", Roboto, sans-serif', h6: { fontWeight: 700 }, body2: { fontSize: '0.9rem' } },
});

const CourierDashboard = () => {
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width:600px)');
  const [availableOrders, setAvailableOrders] = useState([]);
  const [ownOrders, setOwnOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [sessionTime, setSessionTime] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', action: null });
  const [timers, setTimers] = useState({});
  const timerRefs = useRef({});
  const [lastUpdated, setLastUpdated] = useState(null);
  const [profile, setProfile] = useState(null);
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [newOrderNotification, setNewOrderNotification] = useState(null);
  const previousAvailableOrders = useRef([]);

  const getToken = () => localStorage.getItem('authToken');
  const clearLocalStorage = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userProfile');
    localStorage.removeItem('completed_orders');
    navigate('/login');
  };

  const handleError = useCallback((err, defaultMessage = 'Xato yuz berdi') => {
    let message = defaultMessage;
    if (err.response) {
      if (err.response.status === 401) {
        message = 'Sessiya tugadi. Iltimos, qayta kiring.';
        clearLocalStorage();
      } else {
        message = err.response.data?.detail || err.response.data?.message || defaultMessage;
      }
    } else if (err.request) {
      message = 'Tarmoq xatosi. Ulanishni tekshiring.';
    }
    setError(message);
  }, []);

  const startTimer = useCallback((orderId, kitchenTime, setAt) => {
    if (!kitchenTime) return;
    const totalSeconds = typeof kitchenTime === 'string' && kitchenTime.includes(':')
      ? kitchenTime.split(':').reduce((acc, val, idx) => acc + Number(val) * (idx === 0 ? 3600 : 60), 0)
      : parseInt(kitchenTime) * 60;
    let remainingSeconds = totalSeconds;
    const timerKey = `timer_${orderId}`;
    if (setAt) {
      const elapsed = Math.floor((Date.now() - new Date(setAt).getTime()) / 1000);
      remainingSeconds = totalSeconds - elapsed;
    } else {
      let startTime = localStorage.getItem(timerKey);
      if (!startTime) {
        startTime = new Date().toISOString();
        localStorage.setItem(timerKey, startTime);
      }
      const elapsed = Math.floor((Date.now() - new Date(startTime).getTime()) / 1000);
      remainingSeconds = totalSeconds - elapsed;
    }
    if (timerRefs.current[orderId]) clearInterval(timerRefs.current[orderId]);
    setTimers((prev) => ({ ...prev, [orderId]: remainingSeconds }));
    timerRefs.current[orderId] = setInterval(() => {
      setTimers((prev) => {
        const newTime = prev[orderId] - 1;
        if (newTime <= 0) setError(`Buyurtma #${orderId} vaqti tugadi!`);
        return { ...prev, [orderId]: newTime };
      });
    }, 1000);
  }, []);

  const stopTimer = useCallback((orderId) => {
    if (timerRefs.current[orderId]) {
      clearInterval(timerRefs.current[orderId]);
      delete timerRefs.current[orderId];
      setTimers((prev) => {
        const newTimers = { ...prev };
        delete newTimers[orderId];
        return newTimers;
      });
      localStorage.removeItem(`timer_${orderId}`);
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setError('Tizimga kiring.');
      navigate('/login');
      return;
    }
    try {
      const response = await axios.get(PROFILE_URL, { headers: { Authorization: `Token ${token}` } });
      const profileData = {
        ...response.data,
        courier_profile: { id: response.data.courier_profile?.id, is_active: response.data.courier_profile?.is_active ?? false },
      };
      setProfile(profileData);
      localStorage.setItem('userProfile', JSON.stringify(profileData));
      if (!profileData.roles?.is_courier) {
        setError('Siz kuryer emassiz.');
        clearLocalStorage();
      }
      await fetchOrders();
    } catch (err) {
      handleError(err, 'Profilni yuklashda xato');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAvailableOrders = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const response = await axios.get(AVAILABLE_ORDERS_API, { headers: { Authorization: `Token ${token}` } });
      const ordersData = response.data?.data || [];
      setAvailableOrders(Array.isArray(ordersData) ? ordersData.filter((order) => order.id) : []);
    } catch (err) {
      handleError(err, 'Mavjud buyurtmalarni yuklashda xato');
    }
  }, []);

  const fetchOwnOrders = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const response = await axios.get(OWN_ORDERS_API, { headers: { Authorization: `Token ${token}` } });
      const ordersData = response.data?.data || [];
      const orders = Array.isArray(ordersData) ? ordersData : [ordersData];
      setOwnOrders(orders.filter((order) => order.id));
      setLastUpdated(new Date());
      orders.forEach((order) => {
        if (order.status === 'kuryer_oldi' && order.kitchen_time) {
          startTimer(order.id, order.kitchen_time, order.kitchen_time_set_at);
        } else {
          stopTimer(order.id);
        }
      });
    } catch (err) {
      handleError(err, 'Aktiv buyurtmalarni yuklashda xato');
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([fetchAvailableOrders(), fetchOwnOrders()]);
    } catch {
      setError('Buyurtmalarni yuklashda xato');
    } finally {
      setLoading(false);
    }
  }, [fetchAvailableOrders, fetchOwnOrders]);

  const handleToggleWorkStatus = useCallback(async () => {
    const token = getToken();
    if (!profile?.courier_profile?.id || !token) {
      setError('Kuryer profili yoki token topilmadi.');
      return;
    }
    try {
      await axios.patch(
        `${COURIER_PROFILE_URL}${profile.courier_profile.id}/`,
        { is_active: !profile.courier_profile.is_active },
        { headers: { Authorization: `Token ${token}` } }
      );
      setProfile((prev) => ({
        ...prev,
        courier_profile: { ...prev.courier_profile, is_active: !prev.courier_profile.is_active },
      }));
      setSuccess(profile.courier_profile.is_active ? 'Smenani yakunladingiz!' : 'Smenani boshladingiz!');
    } catch (err) {
      handleError(err, 'Smenani o‘zgartirishda xato');
    }
  }, [profile]);

  const handleAcceptOrder = useCallback(async (orderId) => {
    if (ownOrders.filter((o) => ['kuryer_oldi', 'kuryer_yolda'].includes(o.status)).length >= 4) {
      setError('Bir vaqtda faqat 4 ta buyurtma qabul qilishingiz mumkin!');
      return;
    }
    const token = getToken();
    if (!token) return;
    try {
      await axios.post(`${ORDER_API}${orderId}/assign/`, {}, { headers: { Authorization: `Token ${token}` } });
      setSuccess('Buyurtma qabul qilindi!');
      await fetchOrders();
    } catch (err) {
      handleError(err, 'Buyurtma qabul qilinmadi');
    }
  }, [ownOrders, fetchOrders]);

  const handleMarkOnWay = useCallback(async (orderId) => {
    const token = getToken();
    if (!token) return;
    try {
      await axios.post(`${ORDER_API}${orderId}/mark-on-way/`, {}, { headers: { Authorization: `Token ${token}` } });
      setSuccess('Buyurtma yo‘lda!');
      stopTimer(orderId);
      await fetchOrders();
    } catch (err) {
      handleError(err, 'Yo‘lda belgilashda xato');
    }
  }, [fetchOrders, stopTimer]);

  const handleMarkDelivered = useCallback(async (orderId) => {
    const token = getToken();
    if (!token) return;
    try {
      await axios.post(`${ORDER_API}${orderId}/mark-delivered/`, {}, { headers: { Authorization: `Token ${token}` } });
      const order = ownOrders.find((o) => o.id === orderId);
      if (order) {
        const completedOrder = { ...order, status: 'buyurtma_topshirildi', completed_at: new Date().toISOString() };
        const updatedCompleted = [...completedOrders.filter((o) => o.id !== orderId), completedOrder];
        setCompletedOrders(updatedCompleted);
        localStorage.setItem('completed_orders', JSON.stringify(updatedCompleted));
      }
      setSuccess('Buyurtma yetkazildi!');
      stopTimer(orderId);
      await fetchOrders();
    } catch (err) {
      handleError(err, 'Yetkazildi belgilashda xato');
    }
  }, [ownOrders, completedOrders, fetchOrders, stopTimer]);

  const handleClearCompleted = useCallback(() => {
    setConfirmDialog({
      open: true,
      title: 'Tarixni tozalash',
      message: 'Barcha tugallangan buyurtmalarni o‘chirishni xohlaysizmi?',
      action: () => {
        setCompletedOrders([]);
        localStorage.removeItem('completed_orders');
        setSuccess('Tarix tozalandi!');
      },
    });
  }, []);

  const showConfirmation = useCallback((title, message, action) => {
    setConfirmDialog({ open: true, title, message, action });
  }, []);

  const handleOpenNavigation = useCallback((latitude, longitude) => {
    if (!latitude || !longitude || isNaN(parseFloat(latitude)) || isNaN(parseFloat(longitude))) {
      setError('Noto‘g‘ri koordinatalar.');
      return;
    }
    const lat = parseFloat(latitude).toFixed(6);
    const lon = parseFloat(longitude).toFixed(6);
    const url = isMobile ? `google.navigation:q=${lat},${lon}` : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
    window.open(url, '_blank');
  }, [isMobile]);

  const formatTimer = useCallback((seconds) => {
    if (!seconds) return 'Belgilangan emas';
    const isNegative = seconds < 0;
    const absSeconds = Math.abs(seconds);
    const hours = Math.floor(absSeconds / 3600);
    const minutes = Math.floor((absSeconds % 3600) / 60);
    const secs = absSeconds % 60;
    return `${isNegative ? 'Kechikish: ' : 'Qoldi: '}${hours > 0 ? `${hours}:` : ''}${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, []);

  const formatSessionTime = useCallback((seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, []);

  const formatDateTime = useCallback((date) => (date ? formatDistanceToNow(new Date(date), { addSuffix: true, locale: uz }) : ''), []);

  const getStatusChip = useCallback((status) => {
    const statusMap = {
      buyurtma_tushdi: { label: 'Yangi', color: 'primary', icon: <CheckCircle /> },
      oshxona_vaqt_belgiladi: { label: 'Oshxona tayyorlamoqda', color: 'warning', icon: <CheckCircle /> },
      kuryer_oldi: { label: 'Qabul qilindi', color: 'info', icon: <CheckCircle /> },
      kuryer_yolda: { label: 'Yo‘lda', color: 'warning', icon: <LocalShipping /> },
      buyurtma_topshirildi: { label: 'Yetkazildi', color: 'success', icon: <CheckCircle /> },
    };
    const { label, color, icon } = statusMap[status] || { label: status, color: 'default', icon: <CheckCircle /> };
    return <Chip label={label} color={color} icon={icon} size="small" sx={{ fontWeight: 600 }} />;
  }, []);

  const getTimerColor = useCallback((seconds) => {
    if (!seconds) return 'text.secondary';
    return seconds <= 0 ? 'error.main' : seconds < 300 ? 'warning.main' : 'success.main';
  }, []);

  useEffect(() => {
    const loadCompletedOrders = () => {
      const stored = localStorage.getItem('completed_orders');
      if (stored) setCompletedOrders(JSON.parse(stored) || []);
    };
    loadCompletedOrders();
    fetchProfile();
    const sessionInterval = setInterval(() => setSessionTime((prev) => prev + 1), 1000);
    const orderInterval = setInterval(fetchOrders, 30000);
    return () => {
      clearInterval(sessionInterval);
      clearInterval(orderInterval);
      Object.values(timerRefs.current).forEach(clearInterval);
    };
  }, [fetchProfile, fetchOrders]);

  useEffect(() => {
    if (availableOrders.length && notificationPermission === 'granted') {
      const newOrders = availableOrders.filter((order) => !previousAvailableOrders.current.some((prev) => prev.id === order.id));
      if (newOrders.length) {
        navigator.serviceWorker.ready.then((reg) =>
          reg.showNotification(`Yangi buyurtma${newOrders.length > 1 ? 'lar' : ''}`, {
            body: newOrders.length > 1 ? `${newOrders.length} ta yangi buyurtma` : `Buyurtma #${newOrders[0].id}`,
            icon: '/icons/icon-192x192.png',
          })
        );
        setNewOrderNotification({ title: `Yangi buyurtma${newOrders.length > 1 ? 'lar' : ''}`, message: newOrders.length > 1 ? `${newOrders.length} ta yangi buyurtma` : `Buyurtma #${newOrders[0].id}` });
      }
      previousAvailableOrders.current = [...availableOrders];
    }
  }, [availableOrders, notificationPermission]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={isMobile ? 40 : 60} />
          <Button variant="contained" onClick={fetchOrders}>Qayta yuklash</Button>
        </Stack>
      </Box>
    );
  }

  const activeOrders = ownOrders.filter((o) => ['kuryer_oldi', 'kuryer_yolda'].includes(o.status));
  const today = new Date().toISOString().split('T')[0];
  const todayOrders = completedOrders.filter((o) => o.completed_at?.startsWith(today));
  const totalEarnings = completedOrders.reduce((sum, o) => sum + (parseFloat(o.courier_salary) || 0), 0);
  const todayEarnings = todayOrders.reduce((sum, o) => sum + (parseFloat(o.courier_salary) || 0), 0);

  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <Box sx={{ p: isMobile ? 1 : 3, maxWidth: 1200, mx: 'auto', bgcolor: 'background.default' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight="bold">Kuryer Dashboard</Typography>
            <Button
              variant="contained"
              color={profile?.courier_profile?.is_active ? 'secondary' : 'primary'}
              startIcon={<WorkIcon />}
              onClick={handleToggleWorkStatus}
              disabled={activeOrders.length > 0}
            >
              {profile?.courier_profile?.is_active ? 'Smenani yakunlash' : 'Smenani boshlash'}
            </Button>
          </Stack>
          <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} variant={isMobile ? 'scrollable' : 'fullWidth'} sx={{ mb: 2 }}>
            <Tab label={`Mavjud (${availableOrders.length})`} />
            <Tab label={`Aktiv (${activeOrders.length})`} />
            <Tab label={`Tugallangan (${completedOrders.length})`} />
          </Tabs>
          <Box mb={isMobile ? 16 : 8}>
            {activeTab === 0 && (
              availableOrders.length ? availableOrders.map((order) => (
                <OrderCard
                  key={`available-${order.id}`}
                  order={order}
                  isMobile={isMobile}
                  expanded={expandedOrder === order.id}
                  onToggleExpand={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                  getStatusChip={getStatusChip}
                  showConfirmation={showConfirmation}
                  handleAcceptOrder={handleAcceptOrder}
                  handleMarkOnWay={handleMarkOnWay}
                  handleMarkDelivered={handleMarkDelivered}
                  timers={timers}
                  formatTimer={formatTimer}
                  formatTime={() => order.kitchen_time ? `${order.kitchen_time} min` : 'N/A'}
                  formatDateTime={formatDateTime}
                  handleOpenNavigation={handleOpenNavigation}
                  getTimerColor={getTimerColor}
                  isAvailableOrder
                  profile={profile}
                />
              )) : (
                <Paper sx={{ p: 2, textAlign: 'center' }}><Typography>Mavjud buyurtmalar yo‘q</Typography></Paper>
              )
            )}
            {activeTab === 1 && (
              activeOrders.length ? activeOrders.map((order) => (
                <OrderCard
                  key={`active-${order.id}`}
                  order={order}
                  isMobile={isMobile}
                  expanded={expandedOrder === order.id}
                  onToggleExpand={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                  getStatusChip={getStatusChip}
                  showConfirmation={showConfirmation}
                  handleAcceptOrder={handleAcceptOrder}
                  handleMarkOnWay={handleMarkOnWay}
                  handleMarkDelivered={handleMarkDelivered}
                  timers={timers}
                  formatTimer={formatTimer}
                  formatTime={() => order.kitchen_time ? `${order.kitchen_time} min` : 'N/A'}
                  formatDateTime={formatDateTime}
                  handleOpenNavigation={handleOpenNavigation}
                  getTimerColor={getTimerColor}
                />
              )) : (
                <Paper sx={{ p: 2, textAlign: 'center' }}><Typography>Aktiv buyurtmalar yo‘q</Typography></Paper>
              )
            )}
            {activeTab === 2 && (
              <Box>
                <Paper sx={{ p: 2, mb: 2 }}>
                  <Stack direction={isMobile ? 'column' : 'row'} justifyContent="space-between" spacing={2}>
                    <Stack spacing={1}>
                      <Typography color="success.main"><MonetizationOn sx={{ verticalAlign: 'middle', mr: 1 }} />Umumiy: {totalEarnings.toLocaleString('uz-UZ')} UZS</Typography>
                      <Typography color="text.secondary"><Today sx={{ verticalAlign: 'middle', mr: 1 }} />Bugun: {todayOrders.length} buyurtma, {todayEarnings.toLocaleString('uz-UZ')} UZS</Typography>
                      <Typography color="text.secondary"><Timer sx={{ verticalAlign: 'middle', mr: 1 }} />Sessiya: {formatSessionTime(sessionTime)}</Typography>
                    </Stack>
                    <Button variant="outlined" color="error" onClick={handleClearCompleted}>Tarixni tozalash</Button>
                  </Stack>
                </Paper>
                {completedOrders.length ? completedOrders.map((order) => (
                  <OrderCard
                    key={`completed-${order.id}`}
                    order={order}
                    isMobile={isMobile}
                    expanded={expandedOrder === order.id}
                    onToggleExpand={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                    getStatusChip={getStatusChip}
                    showConfirmation={showConfirmation}
                    handleAcceptOrder={handleAcceptOrder}
                    handleMarkOnWay={handleMarkOnWay}
                    handleMarkDelivered={handleMarkDelivered}
                    timers={timers}
                    formatTimer={formatTimer}
                    formatTime={() => order.kitchen_time ? `${order.kitchen_time} min` : 'N/A'}
                    formatDateTime={formatDateTime}
                    handleOpenNavigation={handleOpenNavigation}
                    getTimerColor={getTimerColor}
                  />
                )) : (
                  <Paper sx={{ p: 2, textAlign: 'center' }}><Typography>Tugallangan buyurtmalar yo‘q</Typography></Paper>
                )}
              </Box>
            )}
          </Box>
          <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError('')}>
            <Alert severity="error" onClose={() => setError('')}>{error}</Alert>
          </Snackbar>
          <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess('')}>
            <Alert severity="success" onClose={() => setSuccess('')}>{success}</Alert>
          </Snackbar>
          {newOrderNotification && (
            <Snackbar open autoHideDuration={6000} onClose={() => setNewOrderNotification(null)}>
              <Alert severity="info" onClose={() => setNewOrderNotification(null)}>
                <Typography fontWeight="bold">{newOrderNotification.title}</Typography>
                <Typography>{newOrderNotification.message}</Typography>
                <Button size="small" onClick={() => { setActiveTab(0); setNewOrderNotification(null); }}>Ko‘rish</Button>
              </Alert>
            </Snackbar>
          )}
          {isMobile && <Fab color="primary" onClick={fetchOrders} sx={{ position: 'fixed', bottom: 80, right: 16 }}><CheckCircle /></Fab>}
          <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ ...confirmDialog, open: false })} maxWidth="xs" fullWidth>
            <DialogTitle>{confirmDialog.title}</DialogTitle>
            <DialogContent><Typography>{confirmDialog.message}</Typography></DialogContent>
            <DialogActions>
              <Button onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}>Bekor qilish</Button>
              <Button variant="contained" onClick={() => { confirmDialog.action(); setConfirmDialog({ ...confirmDialog, open: false }); }}>Tasdiqlash</Button>
            </DialogActions>
          </Dialog>
          {lastUpdated && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block', textAlign: 'center' }}>
              Oxirgi yangilanish: {formatDateTime(lastUpdated)}
            </Typography>
          )}
        </Box>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

const OrderCard = React.memo(({ order, isMobile, expanded, onToggleExpand, getStatusChip, showConfirmation, handleAcceptOrder, handleMarkOnWay, handleMarkDelivered, timers, formatTimer, formatTime, formatDateTime, handleOpenNavigation, getTimerColor, isAvailableOrder, profile }) => {
  const isValidCoordinates = order.latitude && order.longitude && !isNaN(parseFloat(order.latitude)) && !isNaN(parseFloat(order.longitude));
  return (
    <Card sx={{ borderLeft: `4px solid ${order.status === 'buyurtma_topshirildi' ? '#388e3c' : order.status === 'kuryer_yolda' ? '#f57c00' : order.status === 'kuryer_oldi' ? '#0288d1' : '#f57c00'}`, mb: 2 }}>
      <CardContent sx={{ p: isMobile ? 2 : 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" onClick={onToggleExpand} sx={{ cursor: 'pointer', mb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="subtitle1" fontWeight="bold" color="primary">#{order.id}</Typography>
            <Typography variant="caption">{formatDateTime(order.created_at)}</Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={1}>
            {getStatusChip(order.status)}
            <IconButton size="small">{expanded ? <Close /> : <CheckCircle />}</IconButton>
          </Stack>
        </Stack>
        <Stack direction={isMobile ? 'column' : 'row'} spacing={1} mt={1}>
          <Typography>Mijoz: {order.user || 'Noma‘lum'}</Typography>
          <Typography>Kitchen: {order.kitchen?.name || 'Noma‘lum'}</Typography>
          <Typography>Narx: {(parseFloat(order.total_amount) || 0).toLocaleString('uz-UZ')} UZS</Typography>
        </Stack>
        <Stack direction={isMobile ? 'column' : 'row'} spacing={1} mt={1}>
          <Typography>Kuryer maoshi: {(parseFloat(order.courier_salary) || 0).toLocaleString('uz-UZ')} UZS</Typography>
          <Typography>Jami maosh: {(parseFloat(order.full_salary) || 0).toLocaleString('uz-UZ')} UZS</Typography>
          <Typography>Kitchen maoshi: {(parseFloat(order.kitchen_salary) || 0).toLocaleString('uz-UZ')} UZS</Typography>
        </Stack>
        <Stack direction={isMobile ? 'column' : 'row'} spacing={1} mt={1}>
          <Typography>Masofa: {order.full_time ? `${order.full_time} km` : 'N/A'}</Typography>
          <Typography>Kuryer vaqti: {order.courier_time || 'N/A'}</Typography>
          <Typography color={getTimerColor(timers[order.id])} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Timer fontSize="small" />
            {order.status === 'kuryer_oldi' && timers[order.id] !== undefined ? formatTimer(timers[order.id]) : `Oshxona vaqti: ${formatTime()}`}
          </Typography>
        </Stack>
        <Stack direction={isMobile ? 'column' : 'row'} justifyContent="space-between" alignItems={isMobile ? 'stretch' : 'center'} mt={2} spacing={1}>
          <Stack direction={isMobile ? 'column' : 'row'} spacing={1}>
            {isAvailableOrder && (order.status === 'buyurtma_tushdi' || order.status === 'oshxona_vaqt_belgiladi') && (
              <Button
                variant="contained"
                color="success"
                fullWidth={isMobile}
                startIcon={<CheckCircle />}
                onClick={() => showConfirmation(`Buyurtma #${order.id} qabul qilish`, 'Qabul qilmoqchimisiz?', () => handleAcceptOrder(order.id))}
                disabled={!profile?.courier_profile?.is_active}
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
                onClick={() => showConfirmation(`Buyurtma #${order.id} yo‘lda`, 'Yo‘lda belgilamoqchimisiz?', () => handleMarkOnWay(order.id))}
              >
                Yo‘lda
              </Button>
            )}
            {order.status === 'kuryer_yolda' && (
              <Button
                variant="contained"
                color="success"
                fullWidth={isMobile}
                startIcon={<CheckCircle />}
                onClick={() => showConfirmation(`Buyurtma #${order.id} yetkazildi`, 'Yetkazildi belgilamoqchimisiz?', () => handleMarkDelivered(order.id))}
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
              >
                Yo‘nalish
              </Button>
            )}
          </Stack>
        </Stack>
        {expanded && (
          <Box mt={2}>
            <Divider sx={{ my: 2 }} />
            <Stack spacing={1}>
              <Typography><a href={`tel:${order.contact_number}`}>{order.contact_number || 'Noma‘lum'}</a></Typography>
              <Typography>Manzil: {order.shipping_address || 'N/A'}</Typography>
              <Typography>To‘lov: {order.payment === 'naqd' ? 'Naqd' : 'Karta'}</Typography>
              <Typography>Eslatma: {order.notes || 'Yo‘q'}</Typography>
              <Typography>Tashxis topildi: {order.detected_at ? formatDateTime(order.detected_at) : 'N/A'}</Typography>
              <Typography fontWeight="bold">Mahsulotlar ({order.items?.length || 0})</Typography>
              <List dense>
                {order.items?.length ? order.items.map((item, idx) => (
                  <ListItem key={`${order.id}-item-${idx}`}>
                    <ListItemAvatar>
                      <Avatar src={item.product?.photo ? `${BASE_URL}${item.product.photo}` : ''}><ShoppingCart /></Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={item.product?.title || 'Noma‘lum'}
                      secondary={`${item.quantity} × ${(parseFloat(item.price) || 0).toLocaleString('uz-UZ')} UZS`}
                    />
                    <Typography fontWeight="bold">{(item.quantity * (parseFloat(item.price) || 0)).toLocaleString('uz-UZ')} UZS</Typography>
                  </ListItem>
                )) : <Typography>Mahsulotlar yo‘q</Typography>}
              </List>
            </Stack>
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
    user: PropTypes.string,
    kitchen: PropTypes.shape({ name: PropTypes.string }),
    total_amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    courier_salary: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    full_salary: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    kitchen_salary: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    full_time: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    courier_time: PropTypes.any,
    kitchen_time: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    kitchen_time_set_at: PropTypes.string,
    created_at: PropTypes.string,
    detected_at: PropTypes.string,
    contact_number: PropTypes.string,
    shipping_address: PropTypes.string,
    payment: PropTypes.string,
    notes: PropTypes.string,
    items: PropTypes.arrayOf(PropTypes.shape({
      product: PropTypes.shape({ title: PropTypes.string, photo: PropTypes.string }),
      quantity: PropTypes.number,
      price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    })),
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