import React, { useState, useEffect } from 'react';
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

  const PROFILE_URL = 'https://hosilbek.pythonanywhere.com/api/user/me/';
  const COURIER_PROFILE_URL = 'https://hosilbek.pythonanywhere.com/api/user/couriers/';
  const BASE_URL = 'https://hosilbek.pythonanywhere.com';

  const getAxiosConfig = (token) => ({
    headers: { Authorization: `Bearer ${token}` },
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Tizimga kirish talab qilinadi. Iltimos, login qiling.');
      navigate('/login', { replace: true });
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.get(PROFILE_URL, getAxiosConfig(token));
      const userProfile = response.data;

      userProfile.courier_profile = {
        id: userProfile.courier_profile?.id || null,
        is_active: userProfile.courier_profile?.is_active ?? false,
        ...userProfile.courier_profile,
      };

      localStorage.setItem('userProfile', JSON.stringify(userProfile));
      setProfile(userProfile);

      if (!userProfile.roles?.is_courier) {
        localStorage.setItem(
          'authError',
          'Siz kuryer sifatida ro‘yxatdan o‘tmagansiz. Tizimga kirish uchun login sahifasiga qayting.'
        );
        clearLocalStorage();
        navigate('/login', { replace: true });
        return;
      }

      if (!userProfile.courier_profile.id) {
        setError('Kuryer profili ID si topilmadi. Backend bilan bog‘laning');
      }

      setError('');
    } catch (err) {
      handleError(err, 'Profil ma’lumotlarini olishda xato yuz berdi');
    } finally {
      setIsLoading(false);
    }
  };

  const clearLocalStorage = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userProfile');
  };

  const handleError = (err, defaultMessage) => {
    let errorMessage = defaultMessage;
    if (err.response) {
      if (err.response.status === 401) {
        errorMessage = 'Sessiya tugagan. Iltimos, qayta kiring';
        clearLocalStorage();
        navigate('/login', { replace: true });
      } else if (err.response.status === 404) {
        errorMessage = 'Kuryer profili topilmadi yoki endpoint noto‘g‘ri. Backend bilan bog‘laning';
      } else {
        errorMessage = err.response.data?.detail || 'Server bilan aloqa xatosi';
      }
    } else if (err.request) {
      errorMessage = 'Internet aloqasi yo‘q';
    } else {
      errorMessage = 'Noma’lum xato: ' + err.message;
    }
    setError(errorMessage);
  };

  const handleToggleWorkStatus = async () => {
    if (!profile?.courier_profile?.id) {
      setError('Kuryer profili ID si topilmadi. Backend bilan bog‘laning');
      return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Tizimga kirish talab qilinadi. Iltimos, login qiling.');
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
      setSnackbarMessage(newStatus ? 'Siz ishga chiqdingiz!' : 'Siz ishni tugatdingiz!');
      setSnackbarOpen(true);
    } catch (err) {
      handleError(err, 'Ish holatini yangilashda xato yuz berdi');
    } finally {
      setIsToggling(false);
    }
  };

  const handleDeleteProfile = async () => {
    if (!profile?.courier_profile?.id) {
      setError('Kuryer profili ID si topilmadi. Backend bilan bog‘laning');
      setConfirmDeleteOpen(false);
      return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Tizimga kirish talab qilinadi. Iltimos, login qiling.');
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
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleConfirmDeleteClose = () => {
    setConfirmDeleteOpen(false);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress size={isMobile ? 40 : 60} />
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
        }}
      >
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
                      src={profile.courier_profile?.photo ? `${BASE_URL}/${profile.courier_profile.photo}` : undefined}
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
                          profile.courier_profile.is_active ? 'Ishni tugatish' : 'Ishga chiqish'
                        )}
                      </Button>
                    </Tooltip>
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
                        secondary={profile.courier_profile.phone_number || 'Kiritilmagan'}
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
                        secondary={profile.courier_profile.is_active ? 'Online' : 'Offline'}
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
              Yo‘q
            </Button>
            <Button
              onClick={handleDeleteProfile}
              variant="contained"
              color="error"
              startIcon={<DeleteIcon />}
              disabled={isToggling}
              sx={{ borderRadius: '10px' }}
            >
              Ha
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
            severity="success"
            sx={{ width: '100%', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
            icon={<CheckIcon fontSize="inherit" />}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
};

export default Profile;