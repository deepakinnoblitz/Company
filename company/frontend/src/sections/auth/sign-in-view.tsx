import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Snackbar from '@mui/material/Snackbar';
import TextField from '@mui/material/TextField';
import AlertTitle from '@mui/material/AlertTitle';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';

import { useRouter } from 'src/routes/hooks';

import { login, getCurrentUserInfo } from 'src/api/auth';

import { Iconify } from 'src/components/iconify';

import { useAuth } from 'src/auth/auth-context';


// ----------------------------------------------------------------------

export function SignInView() {
  const router = useRouter();
  const { setUser } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const handleSignIn = useCallback(async () => {
    setError(null);
    setSnackbarOpen(false);
    setLoading(true);

    try {
      await login(email, password);

      // Fetch full user info including roles
      const userInfo = await getCurrentUserInfo();

      // Save logged-in user in context
      setUser(userInfo);

      // Redirect to dashboard
      router.push('/');
    } catch {
      setError('Invalid email or password');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  }, [email, password, router, setUser]);

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const renderForm = (
    <Box
      component="form"
      onSubmit={(e) => {
        e.preventDefault();
        handleSignIn();
      }}
      sx={{
        display: 'flex',
        alignItems: 'flex-end',
        flexDirection: 'column',
      }}
    >
      <TextField
        fullWidth
        name="email"
        label="Email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        sx={{ mb: 3 }}
        slotProps={{ inputLabel: { shrink: true } }}
      />

      <Link variant="body2" color="inherit" sx={{ mb: 1.5 }}>
        Forgot password?
      </Link>

      <TextField
        fullWidth
        name="password"
        label="Password"
        type={showPassword ? 'text' : 'password'}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        slotProps={{
          inputLabel: { shrink: true },
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                >
                  <Iconify
                    icon={showPassword ? 'solar:eye-bold' : 'solar:eye-closed-bold'}
                  />
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
        sx={{ mb: 3 }}
      />

      <Button
        fullWidth
        size="large"
        color="inherit"
        variant="contained"
        loading={loading}
        type="submit"
      >
        Sign in
      </Button>
    </Box>
  );

  return (
    <>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{ mt: 2, mr: 2 }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity="error"
          variant="outlined"
          sx={{
            width: '100%',
            bgcolor: 'rgba(255, 255, 255, 0.6)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <AlertTitle>Error</AlertTitle>
          {error}
        </Alert>
      </Snackbar>
      <Box
        sx={{
          gap: 1.5,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          mb: 5,
        }}
      >
        <Box
          component="img"
          src="http://erp.innoblitz.in/assets/Innoblitz%20Logo%20Full.png"
          alt="Innoblitz Logo"
          sx={{
            width: 180,
            maxHeight: 180,
            objectFit: 'contain',
            display: 'block',
            mb: 0.5,
            mt: -4,
          }}
        />

        <Typography variant="h5" sx={{ mt: -3 }}>Sign in</Typography>

        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Don’t have an account?
          <Link variant="subtitle2" sx={{ ml: 0.5 }}>
            Contact admin
          </Link>
        </Typography>
      </Box>

      {renderForm}

      <Divider sx={{ my: 3, '&::before, &::after': { borderTopStyle: 'dashed' } }}>
        <Typography
          variant="overline"
          sx={{ color: 'text.secondary', fontWeight: 'fontWeightMedium' }}
        >
          OR
        </Typography>
      </Divider>

      <Box sx={{ gap: 1, display: 'flex', justifyContent: 'center' }}>
        <IconButton color="inherit">
          <Iconify width={22} icon="socials:google" />
        </IconButton>
        <IconButton color="inherit">
          <Iconify width={22} icon="socials:github" />
        </IconButton>
        <IconButton color="inherit">
          <Iconify width={22} icon="socials:twitter" />
        </IconButton>
      </Box>
    </>
  );
}

