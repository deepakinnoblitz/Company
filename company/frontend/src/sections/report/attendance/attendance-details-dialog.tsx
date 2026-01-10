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
    attendanceId: string | null;
};

export function AttendanceDetailsDialog({ open, onClose, attendanceId }: Props) {
    const [attendance, setAttendance] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && attendanceId) {
            setLoading(true);
            getHRDoc('Attendance', attendanceId)
                .then(setAttendance)
                .catch((err) => console.error('Failed to fetch attendance details:', err))
                .finally(() => setLoading(false));
        } else {
            setAttendance(null);
        }
    }, [open, attendanceId]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Present': return 'success';
            case 'Absent': return 'error';
            case 'On Leave': return 'warning';
            case 'Holiday': return 'info';
            case 'Half Day': return 'warning';
            default: return 'default';
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle sx={{ m: 0, p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'background.neutral' }}>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>Attendance Details</Typography>
                <IconButton onClick={onClose} sx={{ color: (theme) => theme.palette.grey[500], bgcolor: 'background.paper', boxShadow: (theme) => theme.customShadows?.z1 }}>
                    <Iconify icon="mingcute:close-line" />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 4, m: 2, mt: 4 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 10 }}>
                        <Iconify icon={"svg-spinners:12-dots-scale-rotate" as any} width={40} sx={{ color: 'primary.main' }} />
                    </Box>
                ) : attendance ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {/* Employee Card */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, borderRadius: 2, border: (theme) => `1px solid ${theme.palette.divider}` }}>
                            <Iconify icon={"solar:user-circle-bold" as any} width={40} sx={{ color: 'text.secondary' }} />
                            <Box>
                                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{attendance.employee_name}</Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>ID: {attendance.employee}</Typography>
                            </Box>
                        </Box>

                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                            <DetailItem label="Attendance Date" value={attendance.attendance_date} icon="solar:calendar-bold" />
                            <Box>
                                <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700, textTransform: 'uppercase', mb: 0.5, display: 'block' }}>
                                    Status
                                </Typography>
                                <Label color={getStatusColor(attendance.status)} variant="soft">{attendance.status}</Label>
                            </Box>
                        </Box>

                        <Divider sx={{ borderStyle: 'dashed' }} />

                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                            <DetailItem label="In Time" value={attendance.in_time} icon="solar:clock-circle-bold" />
                            <DetailItem label="Out Time" value={attendance.out_time} icon="solar:clock-circle-bold" />
                        </Box>

                        <Box sx={{ p: 2, bgcolor: 'background.neutral', borderRadius: 2 }}>
                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                                <DetailItem label="Working Hours" value={attendance.working_hours_display || '0h 0m'} icon="solar:timer-bold" />
                                <DetailItem label="Overtime" value={attendance.overtime_display || '0h 0m'} icon="solar:timer-bold" />
                            </Box>
                        </Box>

                        {attendance.leave_type && (
                            <DetailItem label="Leave Type" value={attendance.leave_type} icon="solar:leaf-bold" />
                        )}
                    </Box>
                ) : (
                    <Box sx={{ py: 10, textAlign: 'center' }}>
                        <Iconify icon={"solar:ghost-bold" as any} width={64} sx={{ color: 'text.disabled', mb: 2 }} />
                        <Typography variant="h6" sx={{ color: 'text.secondary' }}>No Record Found</Typography>
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
