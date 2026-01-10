import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';

import { getHRDoc } from 'src/api/hr-management';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
    open: boolean;
    onClose: () => void;
    leaveId: string | null;
};

export function LeavesDetailsDialog({ open, onClose, leaveId }: Props) {
    const [leave, setLeave] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && leaveId) {
            setLoading(true);
            getHRDoc('Leave Application', leaveId)
                .then(setLeave)
                .catch((err) => console.error('Failed to fetch leave details:', err))
                .finally(() => setLoading(false));
        } else {
            setLeave(null);
        }
    }, [open, leaveId]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Approved': return 'success';
            case 'Rejected': return 'error';
            case 'Pending': return 'warning';
            case 'Open': return 'info';
            default: return 'default';
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle sx={{ m: 0, p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'background.neutral' }}>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>Leave Application</Typography>
                <IconButton onClick={onClose} sx={{ color: (theme) => theme.palette.grey[500], bgcolor: 'background.paper', boxShadow: (theme) => theme.customShadows?.z1 }}>
                    <Iconify icon="mingcute:close-line" />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 4, m: 2, mt: 4 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 10 }}>
                        <Iconify icon={"svg-spinners:12-dots-scale-rotate" as any} width={40} sx={{ color: 'primary.main' }} />
                    </Box>
                ) : leave ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {/* Employee Card */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, borderRadius: 2, border: (theme) => `1px solid ${theme.palette.divider}` }}>
                            <Iconify icon={"solar:user-bold-duotone" as any} width={40} sx={{ color: 'primary.main' }} />
                            <Box>
                                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{leave.employee_name}</Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>{leave.employee}</Typography>
                            </Box>
                        </Box>

                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                            <DetailItem label="Leave Type" value={leave.leave_type} icon="solar:tag-horizontal-bold" />
                            <Box>
                                <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700, textTransform: 'uppercase', mb: 0.5, display: 'block' }}>
                                    Status
                                </Typography>
                                <Label color={getStatusColor(leave.workflow_state || leave.status)} variant="soft">
                                    {leave.workflow_state || leave.status || 'Pending'}
                                </Label>
                            </Box>
                        </Box>

                        <Divider sx={{ borderStyle: 'dashed' }} />

                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                            <DetailItem label="From Date" value={leave.from_date} icon="solar:calendar-bold" />
                            <DetailItem label="To Date" value={leave.to_date} icon="solar:calendar-bold" />
                        </Box>

                        <DetailItem label="Total Days" value={`${leave.total_days} days`} icon="solar:clock-circle-bold" />

                        <Box sx={{ p: 3, bgcolor: 'background.neutral', borderRadius: 2 }}>
                            <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700, textTransform: 'uppercase', mb: 1, display: 'block' }}>
                                Reason
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 600, whiteSpace: 'pre-wrap' }}>
                                {leave.reson || 'No reason provided'}
                            </Typography>
                        </Box>

                        {leave.attachment && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Iconify icon={"solar:link-bold" as any} width={16} sx={{ color: 'text.disabled' }} />
                                <Typography variant="body2" component="a" href={leave.attachment} target="_blank" sx={{ color: 'primary.main', fontWeight: 700, textDecoration: 'none' }}>
                                    View Attachment
                                </Typography>
                            </Box>
                        )}
                    </Box>
                ) : (
                    <Box sx={{ py: 10, textAlign: 'center' }}>
                        <Iconify icon={"solar:ghost-bold" as any} width={64} sx={{ color: 'text.disabled', mb: 2 }} />
                        <Typography variant="h6" sx={{ color: 'text.secondary' }}>No Application Found</Typography>
                    </Box>
                )}
            </DialogContent>
        </Dialog>
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
