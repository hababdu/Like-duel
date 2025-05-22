import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Stack,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

const OrderNotification = ({ order }) => {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    navigate(`/order-details/${order.id}`, { state: { order } });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'buyurtma_tushdi':
        return 'primary';
      case 'tayyorlandi':
        return 'success';
      case 'yetkazildi':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Card
      sx={{
        mb: 2,
        boxShadow: 3,
        borderRadius: 2,
        bgcolor: '#f8fafc',
        transition: 'transform 0.2s',
        '&:hover': { transform: 'scale(1.02)' },
      }}
    >
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Yangi Buyurtma #{order.id}
          </Typography>
          <Chip
            label={order.status || 'Noma’lum'}
            color={getStatusColor(order.status)}
            size="small"
          />
        </Stack>
        <Typography color="text.secondary" mt={1}>
          Sana: {new Date(order.created_at).toLocaleString('uz-UZ')}
        </Typography>
        <Typography color="text.secondary">
          Yetkazish manzili: {order.shipping_address || '—'}
        </Typography>
        <Typography color="text.secondary">
          Jami narx: {parseFloat(order.total_amount || 0).toLocaleString('uz-UZ')} so'm
        </Typography>
        <Button
          variant="contained"
          onClick={handleViewDetails}
          sx={{ mt: 2, bgcolor: '#2e7d32', '&:hover': { bgcolor: '#1b5e20' } }}
        >
          Batafsil
        </Button>
      </CardContent>
    </Card>
  );
};

export default OrderNotification;