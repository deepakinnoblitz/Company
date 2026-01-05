import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { getCall } from 'src/api/calls';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
    open: boolean;
    onClose: () => void;
    callId: string | null;
};

export function CallDetailsDialog({ open, onClose, callId }: Props) {
    const [call, setCall] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && callId) {
            setLoading(true);
            getCall(callId)
                .then((data) => {
                    setCall(data);
                    setLoading(false);
                })
                .catch((err) => {
                    console.error(err);
                    setLoading(false);
                });
        } else {
            setCall(null);
        }
    }, [open, callId]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Completed': return 'success';
            case 'Scheduled': return 'info';
            case 'Overdue': return 'error';
            case 'Cancelled': return 'warning';
            default: return 'default';
        }
    };


    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle sx={{ pb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Iconify icon={"solar:phone-calling-bold-duotone" as any} width={28} sx={{ color: 'primary.main' }} />
                        <Typography variant="h6">Call Details</Typography>
                    </Box>
                    {call && (
                        <Label color={getStatusColor(call.outgoing_call_status)} variant="soft">
                            {call.outgoing_call_status}
                        </Label>
                    )}
                </Box>
            </DialogTitle>

            <Divider />

            <DialogContent sx={{ py: 3 }}>
                {loading ? (
                    <Typography>Loading...</Typography>
                ) : call ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {/* General Information */}
                        <Box>
                            <SectionHeader icon="solar:info-circle-bold" title="General Information" />
                            <Box
                                sx={{
                                    display: 'grid',
                                    gap: 3,
                                    gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                                }}
                            >
                                <DetailItem label="Subject" value={call.title} fullWidth />
                                <DetailItem label="Call For" value={call.call_for} />
                                <DetailItem label="Reference" value={call.lead_name} />
                                <DetailItem label="Start Time" value={call.call_start_time ? new Date(call.call_start_time).toLocaleString() : '-'} />
                                <DetailItem label="End Time" value={call.call_end_time ? new Date(call.call_end_time).toLocaleString() : '-'} />
                                <DetailItem label="Owner" value={call.owner} />
                            </Box>
                        </Box>

                        <Divider sx={{ borderStyle: 'dashed' }} />

                        {/* Details */}
                        <Box>
                            <SectionHeader icon="solar:notebook-bold" title="Call Discussion" />
                            <Box
                                sx={{
                                    display: 'grid',
                                    gap: 3,
                                    gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
                                }}
                            >
                                <DetailItem label="Purpose" value={call.call_purpose} fullWidth />
                                <DetailItem label="Agenda" value={call.call_agenda} fullWidth />
                            </Box>
                        </Box>

                        <Divider sx={{ borderStyle: 'dashed' }} />

                        {/* Metadata */}
                        <Box>
                            <SectionHeader icon="solar:clock-circle-bold" title="System Info" />
                            <Box
                                sx={{
                                    display: 'grid',
                                    gap: 3,
                                    gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                                }}
                            >
                                <DetailItem label="Created On" value={call.creation} />
                                <DetailItem label="Modified On" value={call.modified} />
                            </Box>
                        </Box>

                    </Box>
                ) : (
                    <Typography>No data found</Typography>
                )}
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} variant="outlined" color="inherit">
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
}

// ----------------------------------------------------------------------

function SectionHeader({ icon, title }: { icon: string; title: string }) {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Iconify icon={icon as any} width={20} sx={{ color: 'text.secondary' }} />
            <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>
                {title}
            </Typography>
        </Box>
    );
}

function DetailItem({ label, value, fullWidth }: { label: string; value?: string | null; fullWidth?: boolean }) {
    return (
        <Box sx={fullWidth ? { gridColumn: '1 / -1' } : {}}>
            <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700, textTransform: 'uppercase', display: 'block', mb: 0.5 }}>
                {label}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                {value || '-'}
            </Typography>
        </Box>
    );
}
