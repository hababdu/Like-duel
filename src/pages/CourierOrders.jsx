import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Stack,
  Button,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Paper,
  Tabs,
  Tab,
  Chip,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  useMediaQuery,
  ThemeProvider,
  createTheme,
  Snackbar,
  Badge,
  Tooltip
} from '@mui/material';
import {
  Restaurant,
  Payment,
  LocationOn,
  Phone,
  AccessTime,
  Assignment,
  ArrowBack,
  LocalShipping,
  CheckCircle,
  Close,
  ExpandMore,
  ExpandLess,
  Timer,
  MonetizationOn,
  Today,
  History,
  Directions,
  Map
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { uz } from 'date-fns/locale';

const BASE_URL = 'https://hosilbek.pythonanywhere.com';
const ORDERS_API = `${BASE_URL}/api/user/courier-own-orders/`;
const MARK_ON_WAY_API = `${BASE_URL}/api/user/orders/`;
const MARK_DELIVERED_API = `${BASE_URL}/api/user/orders/`;

const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#9c27b0' },
    error: { main: '#d32f2f' },
    warning: { main: '#ed6c02' },
    success: { main: '#2e7d32' },
    info: { main: '#0288d1' }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          padding: '8px 16px',
          fontSize: '0.875rem',
          margin: '4px 0',
          textTransform: 'none',
          fontWeight: 500
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          marginBottom: '16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          transition: 'box-shadow 0.3s ease',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          fontWeight: 500
        }
      }
    }
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
    h6: {
      fontWeight: 600
    },
    subtitle1: {
      fontWeight: 500
    }
  }
});

const OrderDetails = () => {
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width:600px)');
  const [orders, setOrders] = useState([]);
  const [completedOrdersLocal, setCompletedOrdersLocal] = useState([]);
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
    action: null
  });
  const [timers, setTimers] = useState({});
  const timerRefs = useRef({});
  const [soundEnabled] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const notificationSound = new Audio('/sounds/notification.mp3');

  useEffect(() => {
    const storedOrders = localStorage.getItem('completed_orders');
    if (storedOrders) {
      try {
        setCompletedOrdersLocal(JSON.parse(storedOrders));
      } catch (e) {
        console.error('Failed to parse completed orders', e);
        localStorage.removeItem('completed_orders');
        setCompletedOrdersLocal([]);
      }
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setSessionTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    setError('');

    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Autentifikatsiya talab qilinadi');
      setLoading(false);
      navigate('/login');
      return;
    }

    try {
      const response = await axios.get(ORDERS_API, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const ordersData = Array.isArray(response.data) ? response.data : [response.data];
      setOrders(ordersData);
      setLastUpdated(new Date());

      ordersData.forEach(order => {
        if (order.kitchen_time && order.status === 'oshxona_vaqt_belgiladi') {
          startTimer(order.id, order.kitchen_time, order.kitchen_time_set_at, 'oshxona');
        } else if (order.kitchen_time && order.status === 'kuryer_oldi') {
          startTimer(order.id, order.kitchen_time, null, 'kuryer_oldi');
        } else if (['kuryer_yolda', 'buyurtma_topshirildi'].includes(order.status)) {
          stopTimer(order.id);
        }
      });
    } catch (err) {
      let errorMessage = 'Buyurtma ma\'lumotlarini olishda xatolik';
      if (err.response) {
        if (err.response.status === 401) {
          errorMessage = 'Sessiya muddati tugagan. Iltimos, qayta kiring';
          localStorage.removeItem('authToken');
          navigate('/login');
        } else {
          errorMessage = err.response.data?.detail || err.response.data?.message || errorMessage;
        }
      } else if (err.request) {
        errorMessage = 'Tarmoq xatosi. Iltimos, ulanishingizni tekshiring';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    return () => {
      clearInterval(interval);
      Object.values(timerRefs.current).forEach(clearInterval);
    };
  }, []);

  const startTimer = (orderId, kitchenTime, setAt, timerType) => {
    let totalSeconds;
    if (typeof kitchenTime === 'string' && kitchenTime.includes(':')) {
      const [hours, minutes] = kitchenTime.split(':').map(Number);
      totalSeconds = (hours * 3600) + (minutes * 60);
    } else {
      totalSeconds = parseInt(kitchenTime) * 60;
    }

    let remainingSeconds = totalSeconds;
    const timerKey = timerType === 'oshxona' ? `timer_start_${orderId}` : `timer_start_kuryer_oldi_${orderId}`;

    if (setAt) {
      const setTime = new Date(setAt).getTime();
      const now = new Date().getTime();
      const elapsedSeconds = Math.floor((now - setTime) / 1000);
      remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);
    } else {
      let startTime = localStorage.getItem(timerKey);
      if (!startTime) {
        startTime = new Date().toISOString();
        localStorage.setItem(timerKey, startTime);
      }
      const setTime = new Date(startTime).getTime();
      const now = new Date().getTime();
      const elapsedSeconds = Math.floor((now - setTime) / 1000);
      remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);
    }

    if (timerRefs.current[orderId]) {
      clearInterval(timerRefs.current[orderId]);
    }

    setTimers(prev => ({ ...prev, [orderId]: remainingSeconds }));

    timerRefs.current[orderId] = setInterval(() => {
      setTimers(prev => {
        const newTime = prev[orderId] - 1;
        if (newTime < 0 && soundEnabled && prev[orderId] === 0) {
          notificationSound.play().catch(err => console.error('Timer ovoz xatosi:', err));
        }
        return { ...prev, [orderId]: Math.max(-3600, newTime) };
      });
    }, 1000);
  };

  const stopTimer = (orderId) => {
    if (timerRefs.current[orderId]) {
      clearInterval(timerRefs.current[orderId]);
      delete timerRefs.current[orderId];
      setTimers(prev => {
        const newTimers = { ...prev };
        delete newTimers[orderId];
        return newTimers;
      });
      localStorage.removeItem(`timer_start_${orderId}`);
      localStorage.removeItem(`timer_start_kuryer_oldi_${orderId}`);
    }
  };

  const formatTimer = (seconds) => {
    if (seconds === undefined || seconds === null) return 'Belgilanmagan';
    const isNegative = seconds < 0;
    const absSeconds = Math.abs(seconds);
    const hours = Math.floor(absSeconds / 3600);
    const minutes = Math.floor((absSeconds % 3600) / 60);
    const secs = absSeconds % 60;
    const timeString = `${hours > 0 ? `${String(hours).padStart(2, '0')}:` : ''}${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    return isNegative ? `-${timeString}` : timeString;
  };

  const formatTime = (kitchenTime) => {
    if (!kitchenTime) return 'Belgilanmagan';
    if (typeof kitchenTime === 'string' && kitchenTime.includes(':')) {
      const [hours, minutes] = kitchenTime.split(':').map(Number);
      return `${hours > 0 ? `${hours} soat` : ''} ${minutes > 0 ? `${minutes} minut` : ''}`.trim();
    }
    const hours = Math.floor(kitchenTime / 60);
    const mins = kitchenTime % 60;
    return `${hours > 0 ? `${hours} soat` : ''} ${mins > 0 ? `${mins} minut` : ''}`.trim();
  };

  const formatSessionTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const formatDateTime = (dateString) => {
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

  const toggleOrderExpand = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const getStatusChip = (status) => {
    const statusMap = {
      'buyurtma_tushdi': { label: 'Yangi', color: 'primary', icon: <AccessTime /> },
      'oshxona_vaqt_belgiladi': { label: 'Oshxona vaqt belgilaydi', color: 'warning', icon: <AccessTime /> },
      'kuryer_oldi': { label: 'Kuryer oldi', color: 'info', icon: <CheckCircle /> },
      'kuryer_yolda': { label: 'Yetkazilmoqda', color: 'warning', icon: <LocalShipping /> },
      'buyurtma_topshirildi': { label: 'Yetkazib berildi', color: 'success', icon: <CheckCircle /> }
    };
    const config = statusMap[status] || { label: status, color: 'default', icon: <AccessTime /> };
    return (
      <Chip
        label={config.label}
        color={config.color}
        icon={config.icon}
        size="small"
        variant="filled"
        sx={{ fontWeight: 'bold' }}
      />
    );
  };

  const showConfirmation = (title, message, action) => {
    setConfirmDialog({
      open: true,
      title,
      message,
      action
    });
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

  const handleApiRequest = async (url, successMessage, orderId) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Autentifikatsiya talab qilinadi');
      localStorage.removeItem('authToken');
      navigate('/login');
      return;
    }

    try {
      const response = await axios.post(url, {}, { headers: { Authorization: `Bearer ${token}` } });
      setSuccess(successMessage);

      if (url.includes('mark-delivered')) {
        const order = orders.find(o => o.id === orderId);
        if (order) {
          const completedOrder = {
            ...order,
            status: 'buyurtma_topshirildi',
            completed_at: new Date().toISOString()
          };
          const localOrders = JSON.parse(localStorage.getItem('completed_orders') || '[]')
            .filter(o => o.id !== order.id)
            .concat([completedOrder]);
          localStorage.setItem('completed_orders', JSON.stringify(localOrders));
          setCompletedOrdersLocal(localOrders);

          setSessionCompletedOrders(prev =>
            prev.filter(o => o.id !== order.id).concat([completedOrder])
          );
        }
      }

      fetchOrders();
    } catch (err) {
      let errorMessage = 'Amal bajarilmadi';
      if (err.response) {
        errorMessage = err.response.data?.detail || err.response.data?.message || errorMessage;
        if (err.response.status === 401) {
          localStorage.removeItem('authToken');
          navigate('/login');
        }
      }
      setError(errorMessage);
    }
  };

  const handleMarkOnWay = async (orderId) => {
    await handleApiRequest(
      `${MARK_ON_WAY_API}${orderId}/mark-on-way/`,
      'Buyurtma yetkazilmoqda deb belgilandi!',
      orderId
    );
    stopTimer(orderId);
  };

  const handleMarkDelivered = async (orderId) => {
    await handleApiRequest(
      `${MARK_DELIVERED_API}${orderId}/mark-delivered/`,
      'Buyurtma yetkazib berildi deb belgilandi!',
      orderId
    );
    stopTimer(orderId);
  };

  const handleRefresh = () => {
    fetchOrders();
  };

  const handleClearCompleted = () => {
    showConfirmation(
      'Tarixni tozalash',
      'Barcha yakunlangan buyurtmalar tarixini tozalashni xohlaysizmi?',
      () => {
        localStorage.removeItem('completed_orders');
        setCompletedOrdersLocal([]);
        setSuccess('Yakunlangan buyurtmalar tarixi tozalandi');
      }
    );
  };

  if (loading && !orders.length) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress size={isMobile ? 40 : 60} />
      </Box>
    );
  }

  const newOrders = orders.filter(order => ['kuryer_oldi'].includes(order.status));
  const activeOrders = orders.filter(order => ['kuryer_yolda'].includes(order.status));
  const completedOrders = completedOrdersLocal;

  const today = new Date().toISOString().split('T')[0];
  const todayOrders = completedOrders.filter(order =>
    order.completed_at && order.completed_at.startsWith(today)
  );

  const totalCompletedSalary = completedOrders.reduce((sum, order) => sum + (parseFloat(order.courier_salary) || 0), 0);
  const sessionSalary = sessionCompletedOrders.reduce((sum, order) => sum + (parseFloat(order.courier_salary) || 0), 0);
  const todaySalary = todayOrders.reduce((sum, order) => sum + (parseFloat(order.courier_salary) || 0), 0);

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ p: isMobile ? 1 : 2, maxWidth: 800, margin: '0 auto' }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <IconButton onClick={() => navigate('/')} size="small" sx={{ color: 'primary.main' }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" fontWeight="bold" sx={{ flexGrow: 1 }}>
            Mening buyurtmalarim
          </Typography>
          <Tooltip title="Yangilash">
            <IconButton onClick={handleRefresh} size="small" disabled={loading}>
              <Badge
                color="primary"
                invisible={!lastUpdated}
                badgeContent={
                  <Typography variant="caption">
                    {lastUpdated && formatDateTime(lastUpdated)}
                  </Typography>
                }
              >
                <History fontSize="small" />
              </Badge>
            </IconButton>
          </Tooltip>
        </Stack>

        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ mb: 2 }}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab
            label={
              <Stack direction="row" alignItems="center" spacing={1}>
                <AccessTime fontSize="small" />
                <span>Yangi ({newOrders.length})</span>
              </Stack>
            }
          />
          <Tab
            label={
              <Stack direction="row" alignItems="center" spacing={1}>
                <LocalShipping fontSize="small" />
                <span>Faol ({activeOrders.length})</span>
              </Stack>
            }
          />
          <Tab
            label={
              <Stack direction="row" alignItems="center" spacing={1}>
                <CheckCircle fontSize="small" />
                <span>Yakunlangan ({completedOrders.length})</span>
              </Stack>
            }
          />
        </Tabs>

        <Box sx={{ mb: 8 }}>
          {activeTab === 0 && (
            newOrders.length > 0 ? (
              newOrders.map((order) => (
                <OrderCard
                  key={order.id}
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
                />
              ))
            ) : (
              <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
                <Typography variant="body1" color="text.secondary">
                  Yangi buyurtmalar mavjud emas
                </Typography>
                <Button
                  onClick={handleRefresh}
                  variant="outlined"
                  size="small"
                  sx={{ mt: 1 }}
                  startIcon={<History />}
                >
                  Yangilash
                </Button>
              </Paper>
            )
          )}

          {activeTab === 1 && (
            activeOrders.length > 0 ? (
              activeOrders.map((order) => (
                <OrderCard
                  key={order.id}
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
                />
              ))
            ) : (
              <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
                <Typography variant="body1" color="text.secondary">
                  Faol buyurtmalar mavjud emas
                </Typography>
              </Paper>
            )
          )}

          {activeTab === 2 && (
            <Box>
              <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
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
                  </Stack>
                  <Stack spacing={1}>
                    <Typography variant="subtitle2" fontWeight="bold" color="primary.main">
                      <Timer fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                      Seans vaqti: {formatSessionTime(sessionTime)}
                    </Typography>
                    <Typography variant="subtitle2" color="primary.main">
                      <MonetizationOn fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                      Seans daromadi: {sessionSalary.toLocaleString('uz-UZ')} so'm
                    </Typography>
                  </Stack>
                </Stack>
              </Paper>

              {completedOrders.length > 0 ? (
                <>
                  <Button
                    onClick={handleClearCompleted}
                    variant="outlined"
                    color="error"
                    size="small"
                    sx={{ mb: 2 }}
                    startIcon={<Close />}
                  >
                    Tarixni tozalash
                  </Button>
                  {completedOrders.map((order) => (
                    <OrderCard
                      key={order.id}
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
                    />
                  ))}
                </>
              ) : (
                <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
                  <Typography variant="body1" color="text.secondary">
                    Yakunlangan buyurtmalar mavjud emas
                  </Typography>
                </Paper>
              )}
            </Box>
          )}
        </Box>

        <Dialog
          open={confirmDialog.open}
          onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
          fullWidth
          maxWidth="xs"
        >
          <DialogTitle>{confirmDialog.title}</DialogTitle>
          <DialogContent>
            <Typography>{confirmDialog.message}</Typography>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}
              color="primary"
              disabled={actionLoading}
            >
              Bekor qilish
            </Button>
            <Button
              onClick={handleConfirmAction}
              color="primary"
              variant="contained"
              disabled={actionLoading}
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
          <Alert severity="error" onClose={() => setError('')} sx={{ width: '100%' }}>
            {error}
          </Alert>
        </Snackbar>
        <Snackbar
          open={!!success}
          autoHideDuration={6000}
          onClose={() => setSuccess('')}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert severity="success" onClose={() => setSuccess('')} sx={{ width: '100%' }}>
            {success}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
};

const OrderCard = ({
  order,
  isMobile,
  expanded,
  onToggleExpand,
  getStatusChip,
  showConfirmation,
  handleMarkOnWay,
  handleMarkDelivered,
  actionLoading,
  timers,
  formatTimer,
  formatTime,
  formatDateTime
}) => {
  const handleCallCustomer = () => {
    window.location.href = `tel:${order.contact_number}`;
  };

  const handleOpenMaps = () => {
    if (isMobile) {
      window.open(`geo:${order.latitude},${order.longitude}?q=${order.latitude},${order.longitude}`);
    } else {
      window.open(`https://www.google.com/maps?q=${order.latitude},${order.longitude}`);
    }
  };

  const handleOpenNavigation = () => {
    if (isMobile) {
      window.open(`google.navigation:q=${order.latitude},${order.longitude}`);
    } else {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${order.latitude},${order.longitude}`);
    }
  };

  const getTimerColor = (seconds) => {
    if (seconds === undefined || seconds === null) return 'text.secondary';
    if (seconds < 0) return 'error.main';
    if (seconds < 300) return 'warning.main';
    return 'success.main';
  };

  return (
    <Card
      variant="outlined"
      sx={{
        mb: 2,
        borderLeft: `4px solid ${
          order.status === 'buyurtma_topshirildi' ?
            theme.palette.success.main :
            order.status === 'kuryer_yolda' ?
              theme.palette.warning.main :
              theme.palette.primary.main
        }`
      }}
    >
      <CardContent sx={{ p: isMobile ? 2 : 3 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          onClick={() => onToggleExpand(order.id)}
          sx={{ cursor: 'pointer' }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
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
              {expanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Stack>
        </Stack>

        <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {order.kitchen?.name || 'Noma\'lum oshxona'}
          </Typography>
          <Typography variant="body2" fontWeight="bold" color="text.primary">
            Umumiy: {(parseFloat(order.total_amount) || 0).toLocaleString('uz-UZ')} so'm
          </Typography>
        </Stack>

        <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Masofa: {order.full_time ? `${order.full_time} km` : 'N/A'}
          </Typography>
          <Typography variant="body2" fontWeight="bold" color="success.main">
            Daromad: {(parseFloat(order.courier_salary) || 0).toLocaleString('uz-UZ')} so'm
          </Typography>
        </Stack>

        <Typography
          variant="body2"
          color={getTimerColor(timers[order.id])}
          sx={{
            mt: 1,
            fontWeight: timers[order.id] < 0 ? 'bold' : 'normal',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <Timer fontSize="small" />
          {(order.status === 'oshxona_vaqt_belgiladi' || order.status === 'kuryer_oldi') && timers[order.id] !== undefined
            ? `Qolgan vaqt: ${formatTimer(timers[order.id])}`
            : `Oshxona vaqti: ${formatTime(order.kitchen_time)}`}
        </Typography>

        {expanded && (
          <Box sx={{ mt: 2 }}>
            <Divider sx={{ mb: 2 }} />

            <Stack spacing={2} sx={{ mb: 2 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Phone fontSize="small" color="action" />
                <Typography variant="body2">
                  {order.contact_number || 'Noma\'lum'}
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleCallCustomer}
                  sx={{ ml: 'auto' }}
                  disabled={actionLoading || !order.contact_number}
                  startIcon={<Phone />}
                >
                  Qo'ng'iroq
                </Button>
              </Stack>

              <Stack direction="row" spacing={1} alignItems="flex-start">
                <LocationOn fontSize="small" color="action" />
                <Typography variant="body2" sx={{ flexGrow: 1 }}>
                  {order.shipping_address || 'Manzil kiritilmagan'}
                </Typography>
                {order.latitude && order.longitude && (
                  <Stack direction={isMobile ? 'column' : 'row'} spacing={1}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={handleOpenMaps}
                      startIcon={<Map />}
                      disabled={actionLoading}
                    >
                      Xarita
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={handleOpenNavigation}
                      startIcon={<Directions />}
                      disabled={actionLoading}
                    >
                      Navigatsiya
                    </Button>
                  </Stack>
                )}
              </Stack>

              <Stack direction="row" spacing={1} alignItems="center">
                <Payment fontSize="small" color="action" />
                <Typography variant="body2">
                  To'lov: {order.payment === 'naqd' ? 'Naqd' : 'Karta'}
                </Typography>
              </Stack>

              {order.notes && (
                <Stack direction="row" spacing={1} alignItems="flex-start">
                  <Assignment fontSize="small" color="action" />
                  <Typography variant="body2">
                    Eslatma: {order.notes}
                  </Typography>
                </Stack>
              )}
            </Stack>

            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              Mahsulotlar ({order.items?.length || 0})
            </Typography>
            <List dense disablePadding>
              {order.items && order.items.length > 0 ? (
                order.items.map((item, index) => (
                  <ListItem key={index} disablePadding sx={{ py: 0.5 }}>
                    <ListItemAvatar>
                      <Avatar
                        variant="rounded"
                        src={item.product?.photo ? `${BASE_URL}${item.product.photo}` : undefined}
                        sx={{ width: 32, height: 32, bgcolor: 'background.default' }}
                      >
                        <Restaurant fontSize="small" />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="body2">
                          {item.product?.title || 'Noma\'lum mahsulot'}
                        </Typography>
                      }
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

            <Stack direction={isMobile ? 'column' : 'row'} spacing={1} sx={{ mt: 2 }}>
              {order.status === 'kuryer_oldi' && (
                <Button
                  variant="contained"
                  color="warning"
                  fullWidth={isMobile}
                  startIcon={<LocalShipping />}
                  onClick={() =>
                    showConfirmation(
                      'Yetkazilmoqda',
                      'Buyurtmani yetkazilmoqda deb belgilaysizmi?',
                      () => handleMarkOnWay(order.id)
                    )
                  }
                  disabled={actionLoading}
                >
                  Yetkazilmoqda
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
                      'Buyurtmani yetkazib berildi deb belgilaysizmi?',
                      () => handleMarkDelivered(order.id)
                    )
                  }
                  disabled={actionLoading}
                >
                  Yetkazib berildi
                </Button>
              )}
            </Stack>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default OrderDetails;