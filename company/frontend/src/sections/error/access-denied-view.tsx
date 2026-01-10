import { useEffect } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { useRouter } from 'src/routes/hooks';

import { logout } from 'src/api/auth';
import { hasValidRole } from 'src/layouts/nav-config-dashboard';

import { Iconify } from 'src/components/iconify';

import { useAuth } from 'src/auth/auth-context';

// ----------------------------------------------------------------------

export function AccessDeniedView() {
    const router = useRouter();
    const { user, setUser } = useAuth();

    // Redirect to dashboard if user gains valid access
    useEffect(() => {
        if (user?.roles && hasValidRole(user.roles)) {
            console.log('User now has valid access, redirecting to dashboard');
            router.push('/');
        }
    }, [user, router]);

    const handleSignOut = async () => {
        try {
            await logout();
            setUser(null);
            router.push('/sign-in');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return (
        <Container>
            <Box
                sx={{
                    py: 12,
                    maxWidth: 480,
                    mx: 'auto',
                    display: 'flex',
                    minHeight: '100vh',
                    textAlign: 'center',
                    alignItems: 'center',
                    flexDirection: 'column',
                    justifyContent: 'center',
                }}
            >
                <Box
                    component="img"
                    src="http://erp.innoblitz.in/assets/Innoblitz%20Logo%20Full.png"
                    alt="Innoblitz Logo"
                    sx={{
                        width: 200,
                        height: 'auto',
                        mb: 4,
                    }}
                />

                <Box
                    sx={{
                        width: 120,
                        height: 120,
                        mb: 3,
                        display: 'flex',
                        borderRadius: '50%',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'error.lighter',
                    }}
                >
                    <Iconify icon={"solar:lock-bold" as any} width={64} sx={{ color: 'error.main' }} />
                </Box>

                <Typography variant="h3" sx={{ mb: 2 }}>
                    Access Denied
                </Typography>

                <Typography sx={{ color: 'text.secondary', mb: 1 }}>
                    You don&apos;t have access to see this resource.
                </Typography>

                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4 }}>
                    Please contact your administrator for access.
                </Typography>

                <Button
                    size="large"
                    variant="contained"
                    onClick={handleSignOut}
                    startIcon={<Iconify icon={"solar:logout-2-bold" as any} />}
                >
                    Sign Out
                </Button>
            </Box>
        </Container>
    );
}
