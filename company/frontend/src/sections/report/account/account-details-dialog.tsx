import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';

import { getAccount } from 'src/api/accounts';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
    open: boolean;
    onClose: () => void;
    accountId: string | null;
};

export function AccountDetailsDialog({ open, onClose, accountId }: Props) {
    const [account, setAccount] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && accountId) {
            setLoading(true);
            getAccount(accountId)
                .then(setAccount)
                .catch((err) => console.error('Failed to fetch account details:', err))
                .finally(() => setLoading(false));
        } else {
            setAccount(null);
        }
    }, [open, accountId]);

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle sx={{ m: 0, p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'background.neutral' }}>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>Account Profile</Typography>
                <IconButton onClick={onClose} sx={{ color: (theme) => theme.palette.grey[500], bgcolor: 'background.paper', boxShadow: (theme) => theme.customShadows?.z1 }}>
                    <Iconify icon="mingcute:close-line" />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 4, m: 2, mt: 4 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 10 }}>
                        <Iconify icon={"svg-spinners:12-dots-scale-rotate" as any} width={40} sx={{ color: 'primary.main' }} />
                    </Box>
                ) : account ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {/* Header Info */}
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2.5 }}>
                            <Box
                                sx={{
                                    width: 64,
                                    height: 64,
                                    borderRadius: 2,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    bgcolor: 'primary.lighter',
                                    color: 'primary.main',
                                }}
                            >
                                <Iconify icon={"solar:buildings-bold" as any} width={32} />
                            </Box>
                            <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="h5" sx={{ fontWeight: 800 }}>{account.account_name}</Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>{account.website || 'No website provided'}</Typography>
                            </Box>
                            <Box sx={{ textAlign: 'right' }}>
                                <Label variant="soft" color="info">Account</Label>
                                <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.disabled', fontWeight: 700 }}>
                                    ID: {account.name}
                                </Typography>
                            </Box>
                        </Box>

                        <Divider sx={{ borderStyle: 'dashed' }} />

                        {/* General Information */}
                        <Box>
                            <SectionHeader title="Account Details" icon="solar:info-circle-bold" />
                            <Box
                                sx={{
                                    display: 'grid',
                                    gap: 3,
                                    gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                                }}
                            >
                                <DetailItem label="Account Name" value={account.account_name} icon="solar:buildings-bold" />
                                <DetailItem label="Phone" value={account.phone_number} icon="solar:phone-bold" />
                                <DetailItem label="Website" value={account.website} icon="solar:globus-bold" />
                                <DetailItem label="GSTIN" value={account.gstin} icon="solar:checklist-bold" />
                                <DetailItem label="Owner" value={account.owner} icon="solar:user-bold" />
                            </Box>
                        </Box>

                        {/* Location */}
                        <Box>
                            <SectionHeader title="Location" icon="solar:map-point-bold" />
                            <Box
                                sx={{
                                    display: 'grid',
                                    gap: 3,
                                    gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                                }}
                            >
                                <DetailItem label="City" value={account.city} icon="solar:city-bold" />
                                <DetailItem label="State" value={account.state} icon="solar:point-on-map-bold" />
                                <DetailItem label="Country" value={account.country} icon="solar:earth-bold" />
                            </Box>
                        </Box>

                        {/* System Information */}
                        <Box sx={{ p: 3, bgcolor: 'background.neutral', borderRadius: 2 }}>
                            <SectionHeader title="System Information" icon="solar:clock-circle-bold" noMargin />
                            <Box sx={{ mt: 3, display: 'grid', gap: 3, gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' } }}>
                                <DetailItem label="Created On" value={new Date(account.creation).toLocaleString()} icon="solar:calendar-date-bold" />
                                <DetailItem label="Modified On" value={new Date(account.modified).toLocaleString()} icon="solar:calendar-minimalistic-bold" />
                            </Box>
                        </Box>
                    </Box>
                ) : (
                    <Box sx={{ py: 10, textAlign: 'center' }}>
                        <Iconify icon={"solar:ghost-bold" as any} width={64} sx={{ color: 'text.disabled', mb: 2 }} />
                        <Typography variant="h6" sx={{ color: 'text.secondary' }}>No Profile Found</Typography>
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
}

function SectionHeader({ title, icon, noMargin = false }: { title: string; icon: string, noMargin?: boolean }) {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: noMargin ? 0 : 2.5 }}>
            <Iconify icon={icon as any} width={20} sx={{ color: 'primary.main' }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {title}
            </Typography>
        </Box>
    );
}

function DetailItem({ label, value, icon, color = 'text.primary' }: { label: string; value?: string | null; icon: string; color?: string }) {
    return (
        <Box>
            <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700, textTransform: 'uppercase', mb: 0.5, display: 'block' }}>
                {label}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Iconify icon={icon as any} width={16} sx={{ color: 'text.disabled' }} />
                <Typography variant="body2" sx={{ fontWeight: 700, color }}>
                    {value || '-'}
                </Typography>
            </Box>
        </Box>
    );
}

