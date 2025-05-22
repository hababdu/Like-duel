import React, { useEffect, useState } from 'react';
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
  Snackbar
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
  Notifications
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const BASE_URL = 'https://hosilbek.pythonanywhere.com';
const ORDERS_API = `${BASE_URL}/api/user/courier-own-orders/`;
const MARK_ON_WAY_API = `${BASE_URL}/api/user/orders/`;
const MARK_DELIVERED_API = `${BASE_URL}/api/user/orders/`;

// Mobil uchun mos tema
const theme = createTheme({
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          padding: '8px 12px',
          fontSize: '0.875rem',
          margin: '4px 0'
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          marginBottom: '12px'
        }
      }
    }
  }
});

const OrderDetails = () => {
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width:600px)');
  const [orders, setOrders] = useState([]);
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
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000); // 30 sekundda bir yangilash
    return () => clearInterval(interval);
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const toggleOrderExpand = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const getStatusChip = (status) => {
    const statusMap = {
      'kuryer_oldi': { label: 'Kuryer oldi', color: 'info', icon: <CheckCircle /> },
      'yetkazilmoqda': { label: 'Yetkazilmoqda', color: 'warning', icon: <LocalShipping /> },
      'yetkazib_berildi': { label: 'Yetkazib berildi', color: 'success', icon: <CheckCircle /> },
      'buyurtma_tushdi': { label: 'Yangi', color: 'primary', icon: <AccessTime /> },
      'oshxona_vaqt_belgiladi': { label: 'Oshxona vaqt belgilaydi', color: 'warning', icon: <AccessTime /> }
    };    const config = statusMap[status] || { label: status, color: 'default', icon: <AccessTime /> };
    return (
      <Chip
        label={config.label}
        color={config.color}
        icon={config.icon}
        size="small"
        variant="filled"
        sx={{ fontWeight: 'bold', borderRadius: '8px' }}
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
      await confirmDialog.action();
      setActionLoading(false);
    }
    setConfirmDialog({ ...confirmDialog, open: false });
  };

  const handleApiRequest = async (url, successMessage) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Autentifikatsiya talab qilinadi');
      localStorage.removeItem('authToken');
      navigate('/login');
      return;
    }

    try {
      await axios.post(url, {}, { headers: { Authorization: `Bearer ${token}` } });
      setSuccess(successMessage);
      fetchOrders();
    } catch (err) {
      let errorMessage = 'Xatolik yuz berdi';
      if (err.response) {
        errorMessage = err.response.data?.detail || err.response.data?.message || errorMessage;
      }
      setError(errorMessage);
    }
  };

  const handleMarkOnWay = async (orderId) => {
    await handleApiRequest(
      `${MARK_ON_WAY_API}${orderId}/mark-on-way/`,
      'Buyurtma yetkazilmoqda deb belgilandi!'
    );
  };

  const handleMarkDelivered = async (orderId) => {
    await handleApiRequest(
      `${MARK_DELIVERED_API}${orderId}/mark-delivered/`,
      'Buyurtma yetkazib berildi deb belgilandi!'
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress size={isMobile ? 40 : 60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2, borderRadius: 2 }}>
        {error}
        <Button onClick={fetchOrders} sx={{ ml: 2 }} variant="contained" color="error" size="small">
          Qayta urinish
        </Button>
      </Alert>
    );
  }

  const activeOrders = orders.filter(order =>
    ['kuryer_oldi', 'yetkazilmoqda'].includes(order.status)
  );
  const completedOrders = orders.filter(order =>
    order.status === 'yetkazib_berildi'
  );

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ p: isMobile ? 1 : 2 }}>
        {/* Sarlavha va orqaga tugmasi */}
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <IconButton onClick={() => navigate('/')} size="small">
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" fontWeight="bold" sx={{ flexGrow: 1 }}>
            Mening buyurtmalarim
          </Typography>
        </Stack>

        {/* Tablar */}
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ mb: 2 }}
        >
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
          <Tab
            label={
              <Stack direction="row" alignItems="center" spacing={1}>
                <Notifications fontSize="small" />
                <span>Barcha ({orders.length})</span>
              </Stack>
            }
          />
        </Tabs>        {/* Buyurtmalar ro'yxati */}
        <Box sx={{ mb: 8 }}>
          {activeTab === 0 && (
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
                />
              ))
            ) : (
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2">Faol buyurtmalar mavjud emas</Typography>
              </Paper>
            )
          )}

          {activeTab === 1 && (
            completedOrders.length > 0 ? (
              completedOrders.map((order) => (
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
                />
              ))
            ) : (
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2">Yakunlangan buyurtmalar mavjud emas</Typography>
              </Paper>
            )
          )}

          {activeTab === 2 && (
            orders.length > 0 ? (
              orders.map((order) => (
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
                />
              ))
            ) : (
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2">Buyurtmalar mavjud emas</Typography>
              </Paper>
            )
          )}
        </Box>

        {/* Tasdiqlash dialogi */}
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
        </Dialog>        {/* Xato va muvaffaqiyat xabarlari uchun Snackbar */}
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError('')}
        >
          <Alert severity="error" onClose={() => setError('')}>
            {error}
          </Alert>
        </Snackbar>
        <Snackbar
          open={!!success}
          autoHideDuration={6000}
          onClose={() => setSuccess('')}
        >
          <Alert severity="success" onClose={() => setSuccess('')}>
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
  actionLoading
}) => {
  const navigate = useNavigate();

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

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent sx={{ p: isMobile ? 1 : 2 }}>
        {/* Sarlavha qismi */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          onClick={() => onToggleExpand(order.id)}
          sx={{ cursor: 'pointer' }}
        >
          <Typography variant="subtitle1" fontWeight="bold">
            #{order.id}
          </Typography>
          <Stack direction="row" alignItems="center" spacing={1}>
            {getStatusChip(order.status)}
            <IconButton size="small" disabled={actionLoading}>
              {expanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Stack>
        </Stack>

        {/* Qisqacha ma'lumotlar */}
        <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
          <Typography variant="body2">
            {order.kitchen?.name || 'Noma\'lum oshxona'}
          </Typography>
          <Typography variant="body2" fontWeight="bold">
            {order.total_amount} so'm
          </Typography>
        </Stack>

        {/* Kengaytirilgan ma'lumotlar */}
        {expanded && (
          <Box sx={{ mt: 2 }}>
            <Divider sx={{ mb: 2 }} />

            {/* Asosiy ma'lumotlar */}
            <Stack spacing={1.5} sx={{ mb: 2 }}>
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
                >
                  Qo'ng'iroq
                </Button>
              </Stack>

              <Stack direction="row" spacing={1} alignItems="flex-start">
                <LocationOn fontSize="small" color="action" />
                <Typography variant="body2" sx={{ flexGrow: 1 }}>
                  {order.shipping_address || 'Noma\'lum manzil'}
                </Typography>
                {order.latitude && order.longitude && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleOpenMaps}
                    startIcon={<LocationOn />}
                    disabled={actionLoading}
                  >
                    Xarita
                  </Button>
                )}
              </Stack>              <Stack direction="row" spacing={1} alignItems="center">
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

            {/* Mahsulotlar ro'yxati */}
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
                      secondary={`${item.quantity} × ${item.price} so'm`}
                    />
                    <Typography variant="body2" fontWeight="bold">
                      {(item.quantity * parseFloat(item.price)).toLocaleString('uz-UZ')} so'm
                    </Typography>
                  </ListItem>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Mahsulotlar mavjud emas
                </Typography>
              )}
            </List>

            {/* Amallar */}
            <Stack direction={isMobile ? 'column' : 'row'} spacing={1} sx={{ mt: 2 }}>
              {order.status === 'kuryer_oldi' && (
                <Button
                  variant="contained"
                  color="warning"
                  fullWidth={isMobile}
                  startIcon={<LocalShipping />}
                  onClick={() => showConfirmation(
                    'Yetkazilmoqda',
                    'Buyurtmani yetkazilmoqda deb belgilaysizmi?',
                    () => handleMarkOnWay(order.id)
                  )}
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
                  onClick={() => showConfirmation(
                    'Yetkazib berildi',
                    'Buyurtmani yetkazib berildi deb belgilaysizmi?',
                    () => handleMarkDelivered(order.id)
                  )}
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