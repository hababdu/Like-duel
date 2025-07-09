import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box, Typography, CircularProgress, Alert, Avatar, Button, Card, CardContent,
  Divider, Grid, Paper, List, ListItem, ListItemText, ListItemAvatar,
  Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Tooltip,
  ThemeProvider, createTheme, useMediaQuery, IconButton, Stack
} from '@mui/material';
import {
  ExitToApp as LogoutIcon, Phone as PhoneIcon, Badge as BadgeIcon,
  Person as PersonIcon, Check as CheckIcon, Close as CloseIcon, Work as WorkIcon,
  Delete as DeleteIcon, ArrowBack as ArrowBackIcon
} from '@mui/icons-material';

// Modern and vibrant theme consistent with CourierDashboard
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
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          transition: 'transform 0.2s ease',
          '&:hover': {
            transform: 'scale(1.05)',
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: '16px',
          padding: '16px',
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
    h4: { fontWeight: 700, fontSize: '1.8rem' },
    h6: { fontWeight: 700, fontSize: '1.3rem' },
    subtitle1: { fontWeight: 600, fontSize: '1rem' },
    body1: { fontSize: '0.95rem' },
    body2: { fontSize: '0.85rem' },
    caption: { fontSize: '0.8rem' },
  },
});

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width:600px)');

  const PROFILE_URL = 'https://hosilbek02.pythonanywhere.com/api/user/me/';
  const COURIER_PROFILE_URL = 'https://hosilbek02.pythonanywhere.com/api/user/couriers/';
  const BASE_URL = 'https://hosilbek02.pythonanywhere.com';

  const getAxiosConfig = (token) => ({
    headers: { Authorization: `Token ${token}` },
    timeout: 10000, // Consistent with CourierDashboard
  });

  const clearLocalStorage = useCallback(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userProfile');
  }, []);

  const handleError = useCallback((err, defaultMessage) => {
    let errorMessage = defaultMessage;
    if (err.response) {
      console.error('API error response:', err.response.data);
      if (err.response.status === 401) {
        errorMessage = 'Sessiya muddati tugadi. Iltimos, qayta kiring.';
        clearLocalStorage();
        navigate('/login', { replace: true });
      } else if (err.response.status === 404) {
        errorMessage = 'Kuryer profili topilmadi yoki endpoint noto‘g‘ri. Backend bilan bog‘laning.';
      } else {
        errorMessage = err.response.data?.detail || err.response.data?.message || defaultMessage;
      }
    } else if (err.request) {
      errorMessage = 'Tarmoq xatosi. Iltimos, ulanishingizni tekshiring.';
    } else {
      errorMessage = 'Noma’lum xato: ' + err.message;
    }
    setError(errorMessage);
    setSnackbarOpen(true);
    setSnackbarMessage(errorMessage);
  }, [navigate, clearLocalStorage]);

  const fetchProfile = useCallback(async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Autentifikatsiya talab qilinadi. Iltimos, login qiling.');
      setSnackbarMessage('Autentifikatsiya talab qilinadi. Iltimos, login qiling.');
      setSnackbarOpen(true);
      navigate('/login', { replace: true });
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.get(PROFILE_URL, getAxiosConfig(token));
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
        setSnackbarMessage('Siz kuryer sifatida ro‘yxatdan o‘tmagansiz.');
        setSnackbarOpen(true);
        clearLocalStorage();
        navigate('/login', { replace: true });
        return;
      }

      if (!userProfile.courier_profile.id) {
        setError('Kuryer profili ID si topilmadi.');
        setSnackbarMessage('Kuryer profili ID si topilmadi.');
        setSnackbarOpen(true);
      }
    } catch (err) {
      handleError(err, 'Profil ma’lumotlarini olishda xato yuz berdi');
    } finally {
      setIsLoading(false);
    }
  }, [navigate, clearLocalStorage, handleError]);

  const handleToggleWorkStatus = useCallback(async () => {
    if (!profile?.courier_profile?.id) {
      setError('Kuryer profili ID si topilmadi.');
      setSnackbarMessage('Kuryer profili ID si topilmadi.');
      setSnackbarOpen(true);
      return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Autentifikatsiya talab qilinadi. Iltimos, login qiling.');
      setSnackbarMessage('Autentifikatsiya talab qilinadi. Iltimos, login qiling.');
      setSnackbarOpen(true);
      navigate('/login', { replace: true });
      return;
    }

    const newStatus = !profile.courier_profile.is_active;
    const updateUrl = `${COURIER_PROFILE_URL}${profile.courier_profile.id}/`;

    try {
      setIsToggling(true);
      await axios.patch(updateUrl, { is_active: newStatus }, getAxiosConfig(token));
      setProfile((prev) => ({
        ...prev,
        courier_profile: { ...prev.courier_profile, is_active: newStatus },
      }));
      setSnackbarMessage(newStatus ? 'Siz navbatchisiz!' : 'Siz navbatdan chiqdingiz!');
      setSnackbarOpen(true);
    } catch (err) {
      handleError(err, 'Ish holatini yangilashda xato yuz berdi');
    } finally {
      setIsToggling(false);
    }
  }, [profile, navigate, clearLocalStorage, handleError]);

  const handleDeleteProfile = useCallback(async () => {
    if (!profile?.courier_profile?.id) {
      setError('Kuryer profili ID si topilmadi.');
      setSnackbarMessage('Kuryer profili ID si topilmadi.');
      setSnackbarOpen(true);
      setConfirmDeleteOpen(false);
      return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Autentifikatsiya talab qilinadi. Iltimos, login qiling.');
      setSnackbarMessage('Autentifikatsiya talab qilinadi. Iltimos, login qiling.');
      setSnackbarOpen(true);
      navigate('/login', { replace: true });
      setConfirmDeleteOpen(false);
      return;
    }

    const deleteUrl = `${COURIER_PROFILE_URL}${profile.courier_profile.id}/`;

    try {
      setIsToggling(true);
      await axios.delete(deleteUrl, getAxiosConfig(token));
      setSnackbarMessage('Kuryer profili o‘chirildi!');
      setSnackbarOpen(true);
      clearLocalStorage();
      navigate('/login', { replace: true });
    } catch (err) {
      handleError(err, 'Profilni o‘chirishda xato yuz berdi');
    } finally {
      setIsToggling(false);
      setConfirmDeleteOpen(false);
    }
  }, [profile, navigate, clearLocalStorage, handleError]);

  const handleSnackbarClose = useCallback(() => {
    setSnackbarOpen(false);
    setSnackbarMessage('');
    setError('');
  }, []);

  const handleConfirmDeleteClose = useCallback(() => {
    setConfirmDeleteOpen(false);
  }, []);

  const handleLogout = useCallback(() => {
    clearLocalStorage();
    setSnackbarMessage('Tizimdan chiqdingiz!');
    setSnackbarOpen(true);
    navigate('/login', { replace: true });
  }, [navigate, clearLocalStorage]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (isLoading) {
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
            onClick={fetchProfile}
            sx={{ borderRadius: '10px' }}
          >
            Qayta yuklash
          </Button>
        </Stack>
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          bgcolor: 'background.default',
          py: isMobile ? 2 : 4,
          px: isMobile ? 2 : 4,
          maxWidth: 1200,
          margin: '0 auto',
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="h4" fontWeight="bold" color="primary">
            Profil
          </Typography>
          <Button
            variant="contained"
            color="error"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            sx={{ borderRadius: '10px', py: 1.5 }}
          >
            Chiqish
          </Button>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }}>
            {error}
          </Alert>
        )}

        {profile && (
          <Grid container spacing={isMobile ? 2 : 3} justifyContent="center">
            <Grid item xs={12} md={8} lg={6}>
              <Card>
                <CardContent sx={{ p: isMobile ? 2 : 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar
                      src={profile.courier_profile?.photo ? `${BASE_URL}${profile.courier_profile.photo}` : undefined}
                      sx={{
                        width: 80,
                        height: 80,
                        mr: 2,
                        bgcolor: 'primary.main',
                        fontSize: '2rem',
                      }}
                    >
                      <PersonIcon fontSize="large" />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight="bold" color="primary">
                        {profile.username || 'Foydalanuvchi nomi yo‘q'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Ro‘yxatdan o‘tgan sana: {new Date(profile.date_joined || Date.now()).toLocaleDateString('uz-UZ')}
                      </Typography>
                    </Box>
                  </Box>
                  <Stack
                    direction={isMobile ? 'column' : 'row'}
                    spacing={2}
                    sx={{ mt: 2, justifyContent: 'center' }}
                  >
                    <Tooltip title="Uzoq bosib turing profilni o‘chirish uchun">
                      <span>
                        <Button
                          variant="contained"
                          color={profile.courier_profile.is_active ? 'secondary' : 'primary'}
                          startIcon={<WorkIcon />}
                          onClick={handleToggleWorkStatus}
                          disabled={isToggling}
                          fullWidth={isMobile}
                          sx={{ py: 1.5 }}
                        >
                          {isToggling ? (
                            <CircularProgress size={24} color="inherit" />
                          ) : (
                            profile.courier_profile.is_active ? 'Smenani yakunlash' : 'Smenani boshlash'
                          )}
                        </Button>
                      </span>
                    </Tooltip>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => setConfirmDeleteOpen(true)}
                      disabled={isToggling}
                      fullWidth={isMobile}
                      sx={{ py: 1.5 }}
                    >
                      Profilni o‘chirish
                    </Button>
                  </Stack>
                </CardContent>
              </Card>

              <Card sx={{ mt: 2 }}>
                <CardContent sx={{ p: isMobile ? 2 : 3 }}>
                  <Typography variant="h6" fontWeight="600" color="primary" mb={2}>
                    Kuryer Ma'lumotlari
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <List disablePadding>
                    <ListItem disableGutters sx={{ py: 1 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'secondary.light', width: 36, height: 36 }}>
                          <BadgeIcon fontSize="small" />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={<Typography variant="body1" fontWeight="600">Pasport Raqami</Typography>}
                        secondary={profile.courier_profile.passport_number || 'Kiritilmagan'}
                        secondaryTypographyProps={{ color: 'text.primary' }}
                      />
                    </ListItem>
                    <ListItem disableGutters sx={{ py: 1 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'secondary.light', width: 36, height: 36 }}>
                          <PhoneIcon fontSize="small" />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={<Typography variant="body1" fontWeight="600">Telefon Raqami</Typography>}
                        secondary={
                          profile.courier_profile.phone_number ? (
                            <a
                              href={`tel:${profile.courier_profile.phone_number}`}
                              style={{ color: theme.palette.primary.main, textDecoration: 'underline' }}
                            >
                              {profile.courier_profile.phone_number}
                            </a>
                          ) : (
                            'Kiritilmagan'
                          )
                        }
                        secondaryTypographyProps={{ color: 'text.primary' }}
                      />
                    </ListItem>
                    <ListItem disableGutters sx={{ py: 1 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'secondary.light', width: 36, height: 36 }}>
                          <WorkIcon fontSize="small" />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={<Typography variant="body1" fontWeight="600">Ish Holati</Typography>}
                        secondary={profile.courier_profile.is_active ? 'Navbatchi' : 'Navbatda emas'}
                        secondaryTypographyProps={{
                          color: profile.courier_profile.is_active ? 'success.main' : 'text.primary',
                          fontWeight: 'bold',
                        }}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        <Dialog
          open={confirmDeleteOpen}
          onClose={handleConfirmDeleteClose}
          fullWidth
          maxWidth="xs"
        >
          <DialogTitle sx={{ bgcolor: 'error.main', color: 'white', fontWeight: 600 }}>
            Kuryer Profilini O‘chirish
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <Typography variant="body1">
              Haqiqatan ham kuryer profilini o‘chirmoqchimisiz? Bu amal qaytarilmaydi va tizimdan chiqasiz.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button
              onClick={handleConfirmDeleteClose}
              variant="outlined"
              color="secondary"
              startIcon={<CloseIcon />}
              sx={{ borderRadius: '10px' }}
            >
              Bekor qilish
            </Button>
            <Button
              onClick={handleDeleteProfile}
              variant="contained"
              color="error"
              startIcon={<DeleteIcon />}
              disabled={isToggling}
              sx={{ borderRadius: '10px' }}
            >
              Tasdiqlash
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert
            onClose={handleSnackbarClose}
            severity={error ? 'error' : 'success'}
            sx={{ width: '100%', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
            icon={error ? <CloseIcon fontSize="inherit" /> : <CheckIcon fontSize="inherit" />}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
};

export default Profile;