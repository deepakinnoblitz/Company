import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';

import { getContact } from 'src/api/contacts';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
    open: boolean;
    onClose: () => void;
    contactId: string | null;
};

export function ContactDetailsDialog({ open, onClose, contactId }: Props) {
    const [contact, setContact] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && contactId) {
            setLoading(true);
            getContact(contactId)
                .then(setContact)
                .catch((err) => console.error('Failed to fetch contact details:', err))
                .finally(() => setLoading(false));
        } else {
            setContact(null);
        }
    }, [open, contactId]);

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle sx={{ m: 0, p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'background.neutral' }}>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>Contact Profile</Typography>
                <IconButton onClick={onClose} sx={{ color: (theme) => theme.palette.grey[500], bgcolor: 'background.paper', boxShadow: (theme) => theme.customShadows?.z1 }}>
                    <Iconify icon="mingcute:close-line" />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 4, m: 2, mt: 4 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 10 }}>
                        <Iconify icon={"svg-spinners:12-dots-scale-rotate" as any} width={40} sx={{ color: 'primary.main' }} />
                    </Box>
                ) : contact ? (
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
                                <Iconify icon={"solar:user-circle-bold" as any} width={32} />
                            </Box>
                            <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="h5" sx={{ fontWeight: 800 }}>{contact.first_name} {contact.last_name}</Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>{contact.designation || 'Contact'} at {contact.company_name}</Typography>
                            </Box>
                            <Box sx={{ textAlign: 'right' }}>
                                <Label variant="soft" color="secondary">Contact</Label>
                                <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.disabled', fontWeight: 700 }}>
                                    ID: {contact.name}
                                </Typography>
                            </Box>
                        </Box>

                        <Divider sx={{ borderStyle: 'dashed' }} />

                        {/* General Information */}
                        <Box>
                            <SectionHeader title="Contact Details" icon="solar:info-circle-bold" />
                            <Box
                                sx={{
                                    display: 'grid',
                                    gap: 3,
                                    gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                                }}
                            >
                                <DetailItem label="Name" value={contact.first_name} icon="solar:user-bold" />
                                <DetailItem label="Company Name" value={contact.company_name} icon="solar:buildings-bold" />
                                <DetailItem label="Email" value={contact.email} icon="solar:letter-bold" color="primary.main" />
                                <DetailItem label="Phone" value={contact.phone} icon="solar:phone-bold" color="success.main" />
                                <DetailItem label="Designation" value={contact.designation} icon="solar:letter-bold" />
                                <DetailItem label="Contact Type" value={contact.customer_type} icon="solar:users-group-rounded-bold" />
                                <DetailItem label="Owner" value={contact.owner} icon="solar:user-rounded-bold" />
                                <DetailItem label="Notes" value={contact.notes} icon="solar:notebook-bold" fullWidth />
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
                                <DetailItem label="Address" value={contact.address} icon="solar:home-bold" fullWidth />
                                <DetailItem label="City" value={contact.city} icon="solar:city-bold" />
                                <DetailItem label="State" value={contact.state} icon="solar:point-on-map-bold" />
                                <DetailItem label="Country" value={contact.country} icon="solar:earth-bold" />
                            </Box>
                        </Box>

                        {/* System Information */}
                        <Box sx={{ p: 3, bgcolor: 'background.neutral', borderRadius: 2 }}>
                            <SectionHeader title="System Information" icon="solar:clock-circle-bold" noMargin />
                            <Box sx={{ mt: 3, display: 'grid', gap: 3, gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' } }}>
                                <DetailItem label="Created On" value={new Date(contact.creation).toLocaleString()} icon="solar:calendar-date-bold" />
                                <DetailItem label="Modified On" value={new Date(contact.modified).toLocaleString()} icon="solar:calendar-minimalistic-bold" />
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

function DetailItem({ label, value, icon, color = 'text.primary', fullWidth }: { label: string; value?: string | null; icon: string; color?: string, fullWidth?: boolean }) {
    return (
        <Box sx={fullWidth ? { gridColumn: '1 / -1' } : {}}>
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

