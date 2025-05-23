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
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Paper,
  Badge,
  IconButton,
  useMediaQuery,
  ThemeProvider,
  createTheme
} from '@mui/material';
import {
  Refresh,
  CheckCircle,
  LocalShipping,
  Restaurant,
  Payment,
  LocationOn,
  Phone,
  AccessTime,
  Notifications as NotificationsIcon,
  ExpandMore,
  ExpandLess,
  Check,
  Assignment,
  ArrowBack
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const BASE_URL = 'https://hosilbek.pythonanywhere.com';
const ORDERS_API = `${BASE_URL}/api/user/available-orders-couryer/`;
const ORDER_API = `${BASE_URL}/api/user/orders/`;

const CourierOrdersDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastFetch, setLastFetch] = useState(null);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const isMobile = useMediaQuery('(max-width:600px)');
  const navigate = useNavigate();

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
        headers: { Authorization: `Bearer ${token}` },
      });

      const ordersData = Array.isArray(response.data) ? response.data : [];
      const newOrders = ordersData.filter(
        newOrder => !orders.some(prevOrder => prevOrder.id === newOrder.id)
      );
      setNewOrdersCount(newOrders.length);
      setOrders(ordersData);
      setLastFetch(new Date().toISOString());
    } catch (err) {
      handleFetchError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchError = (err) => {
    let errorMessage = 'Buyurtmalarni olishda xatolik';
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
  };

  const handleAcceptOrder = async (orderId) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Autentifikatsiya talab qilinadi');
      navigate('/login');
      return;
    }

    try {
      await axios.post(
        `${ORDER_API}${orderId}/assign/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Yangilangan buyurtmalar ro'yxatini olish
      await fetchOrders();
     
    } catch (err) {
      let errorMessage = 'Buyurtmani qabul qilishda xatolik';
      if (err.response) {
        if (err.response.status === 404) {
          errorMessage = 'Buyurtma topilmadi';
        } else if (err.response.status === 401) {
          errorMessage = 'Sessiya muddati tugagan';
          localStorage.removeItem('authToken');
          navigate('/login');
        } else if (err.response.status === 400) {
          errorMessage = err.response.data.detail || 'Buyurtma holati mos emas';
        } else {
          errorMessage = err.response.data?.detail || err.response.data?.message || errorMessage;
        }
      }
      setError(errorMessage);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusChip = (status) => {
    const statusMap = {
      'buyurtma_tushdi': { label: 'Yangi', color: 'primary', icon: <AccessTime /> },
      'qabul_qilindi': { label: 'Qabul qilindi', color: 'secondary', icon: <CheckCircle /> },
      'yetkazilmoqda': { label: 'Yetkazilmoqda', color: 'warning', icon: <LocalShipping /> },
      'yetkazib_berildi': { label: 'Yetkazib berildi', color: 'success', icon: <CheckCircle /> },
      'kuryer_oldi': { label: 'Kuryer oldi', color: 'info', icon: <Check /> },
      'oshxona_vaqt_belgiladi': { label: 'Oshxona vaqt belgilaydi', color: 'warning', icon: <AccessTime /> }
    };

    const config = statusMap[status] || { label: status, color: 'default' };
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

  const toggleOrderExpand = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const theme = createTheme({
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: '12px',
            padding: '8px 16px',
            fontSize: '0.875rem'
          }
        }
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }
        }
      }
    }
  });

  if (loading && orders.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2, borderRadius: 2 }}>
        {error}
        <Button onClick={fetchOrders} sx={{ ml: 2 }} variant="contained" color="error">
          Qayta urinish
        </Button>
      </Alert>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ p: isMobile ? 1 : 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" fontWeight="bold">
            {isMobile ? (
              <IconButton onClick={() => navigate(-1)} sx={{ mr: 1 }}>
                <ArrowBack />
              </IconButton>
            ) : null}
            Mavjud buyurtmalar
            {newOrdersCount > 0 && (
              <Badge
                badgeContent={newOrdersCount}
                color="error"
                sx={{ ml: 1, verticalAlign: 'middle' }}
              >
                <NotificationsIcon fontSize="small" />
              </Badge>
            )}
          </Typography>
          <Button
            variant="contained"
            startIcon={<Refresh />}
            onClick={fetchOrders}
            size="small"
            disabled={loading}
          >
            {loading ? 'Yuklanmoqda...' : 'Yangilash'}
          </Button>
        </Stack>

        {orders.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center', mt: 2 }}>
            <Typography variant="body1">Hozircha mavjud buyurtmalar yo'q</Typography>
          </Paper>
        ) : (
          <Stack spacing={2}>
            {orders.map((order) => (
              <Card key={order.id} elevation={2}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Buyurtma #{order.id}
                    </Typography>
                   <Box sx={{ flexGrow: 1 }} />
                   Oshxona vaqti:
                   {getStatusChip(order.kitchen_time)}
                  </Stack>

                  <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                    <Restaurant fontSize="small" color="action" />
                    <Typography variant="body2">
                      {order.kitchen?.name || 'Noma\'lum oshxona'}
                    </Typography>
                  </Stack>

                  <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                    <LocationOn fontSize="small" color="action" />
                    <Typography variant="body2" noWrap>
                      {order.shipping_address}
                    </Typography>
                  </Stack>

                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2" fontWeight="bold">
                      {order.total_amount} so'm
                    </Typography>
                    <Typography variant="caption">
                      {new Date(order.created_at).toLocaleTimeString()}
                    </Typography>
                  </Stack>

                  <Stack direction="row" spacing={1} justifyContent="space-between">
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => toggleOrderExpand(order.id)}
                      endIcon={expandedOrder === order.id ? <ExpandLess /> : <ExpandMore />}
                    >
                      Batafsil
                    </Button>

                    {(order.status === 'buyurtma_tushdi' || order.status === 'oshxona_vaqt_belgiladi') && (
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        startIcon={<Check />}
                        onClick={() => handleAcceptOrder(order.id)}
                        sx={{ minWidth: '120px' }}
                        disabled={loading}
                      >
                        Olish
                      </Button>
                    )}
                  </Stack>

                  {expandedOrder === order.id && (
                    <Box sx={{ mt: 2 }}>
                      <Divider sx={{ mb: 2 }} />

                      <Typography variant="subtitle2" gutterBottom>
                        Mijoz ma'lumotlari
                      </Typography>
                      <Stack spacing={1} mb={2}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Phone fontSize="small" color="action" />
                          <Typography variant="body2">{order.contact_number}</Typography>
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
                            <Typography variant="body2">Eslatma: {order.notes}</Typography>
                          </Stack>
                        )}
                      </Stack>

                      <Typography variant="subtitle2" gutterBottom>
                        Mahsulotlar ({order.items.length})
                      </Typography>
                      <List dense disablePadding>
                        {order.items.map((item, index) => (
                          <ListItem key={index} disablePadding sx={{ py: 1 }}>
                            <ListItemAvatar>
                              <Avatar
                                variant="rounded"
                                src={item.product?.photo ? `${BASE_URL}${item.product.photo}` : undefined}
                                sx={{ width: 40, height: 40, bgcolor: 'background.default' }}
                              >
                                <Restaurant fontSize="small" />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Typography variant="body2" fontWeight="medium">
                                  {item.product?.title || 'Noma\'lum mahsulot'}
                                </Typography>
                              }
                              secondary={
                                <Stack component="span">
                                  <Typography variant="body2" component="span">
                                    {item.quantity} × {item.price} so'm
                                  </Typography>
                                </Stack>
                              }
                            />
                            <Typography variant="body2" fontWeight="bold">
                              {item.quantity * parseFloat(item.price)} so'm
                            </Typography>
                          </ListItem>
                        ))}
                      </List>

                      {order.kitchen_time && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Oshxona vaqti
                          </Typography>
                          <Chip
                            icon={<AccessTime />}
                            label={new Date(order.kitchen_time).toLocaleString()}
                            color="info"
                            variant="outlined"
                          />
                        </Box>
                      )}
                    </Box>
                  )}
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}

        {lastFetch && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              mt: 2,
              display: 'block',
              textAlign: 'center'
            }}
          >
            Oxirgi yangilanish: {new Date(lastFetch).toLocaleTimeString()}
          </Typography>
        )}
      </Box>
    </ThemeProvider>
  );
};

export default CourierOrdersDashboard;