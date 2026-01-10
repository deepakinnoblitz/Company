import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Dialog from '@mui/material/Dialog';
import Rating from '@mui/material/Rating';
import Divider from '@mui/material/Divider';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import TableContainer from '@mui/material/TableContainer';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

// ----------------------------------------------------------------------

type Props = {
    open: boolean;
    onClose: VoidFunction;
    interview: any;
};

export function InterviewDetailsDialog({ open, onClose, interview }: Props) {
    if (!interview) return null;

    const renderStatus = (status: string) => {
        let color: 'default' | 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error' = 'default';

        switch (status) {
            case 'Selected':
            case 'Completed':
                color = 'success';
                break;
            case 'Rejected':
            case 'Cancelled':
            case 'No-Show':
                color = 'error';
                break;
            case 'On Hold':
            case 'Rescheduled':
                color = 'warning';
                break;
            case 'Scheduled':
            case 'In Progress':
                color = 'info';
                break;
            default:
                color = 'primary';
        }

        return (
            <Label variant="filled" color={color} sx={{ height: 32, px: 2, borderRadius: 1 }}>
                {status}
            </Label>
        );
    };

    const renderHeader = (
        <Box sx={{ p: 3, bgcolor: 'background.neutral', borderRadius: 2, mb: 3 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                <Box>
                    <Typography variant="h4" sx={{ mb: 1, fontWeight: 700 }}>
                        {interview.job_applicant}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="subtitle2" color="text.secondary">
                            {interview.job_applied || 'No Job Assigned'}
                        </Typography>
                        {interview.designation && (
                            <>
                                <Divider orientation="vertical" flexItem sx={{ height: 12, my: 'auto' }} />
                                <Typography variant="subtitle2" color="text.secondary">
                                    {interview.designation}
                                </Typography>
                            </>
                        )}
                    </Stack>
                </Box>
                {renderStatus(interview.overall_status)}
            </Stack>
        </Box>
    );

    const renderSchedule = (
        <Box sx={{ mb: 4 }}>
            <SectionHeader title="Interview Schedule" icon="solar:calendar-date-bold" />
            <Box
                sx={{
                    display: 'grid',
                    gap: 2.5,
                    gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
                }}
            >
                <DetailItem icon="solar:calendar-bold" label="Date" value={interview.scheduled_on ? new Date(interview.scheduled_on).toLocaleDateString() : '-'} />
                <DetailItem icon="solar:clock-circle-bold" label="Time" value={`${interview.from_time || ''} - ${interview.to_time || ''}`} />
            </Box>
        </Box>
    );

    const renderFeedback = (
        <Box sx={{ mt: 2 }}>
            <SectionHeader title="Interviewer Feedback" icon="solar:ranking-bold" />
            <TableContainer sx={{ mt: 2, borderRadius: 1, border: (theme) => `solid 1px ${theme.vars.palette.divider}` }}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Interviewer</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Rating</TableCell>
                            <TableCell>Notes</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {interview.feedbacks?.length ? (
                            interview.feedbacks.map((fb: any, index: number) => (
                                <TableRow key={index}>
                                    <TableCell>{fb.interviewer}</TableCell>
                                    <TableCell>{fb.interview_type}</TableCell>
                                    <TableCell>
                                        <Rating value={fb.rating} readOnly size="small" />
                                    </TableCell>
                                    <TableCell>{fb.notes}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                    No feedback recorded yet.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {interview.overall_performance && (
                <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Overall Performance Summary</Typography>
                    <Box sx={{ p: 2, bgcolor: 'background.neutral', borderRadius: 1 }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary', whiteSpace: 'pre-wrap' }}>
                            {interview.overall_performance}
                        </Typography>
                    </Box>
                </Box>
            )}
        </Box>
    );

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Interview Details
                <IconButton onClick={onClose}>
                    <Iconify icon="mingcute:close-line" />
                </IconButton>
            </DialogTitle>

            <Scrollbar sx={{ maxHeight: '85vh' }}>
                <DialogContent sx={{ p: 4 }}>
                    {renderHeader}
                    {renderSchedule}
                    <Divider sx={{ my: 4, borderStyle: 'dashed' }} />
                    {renderFeedback}
                </DialogContent>
            </Scrollbar>
        </Dialog>
    );
}

// ----------------------------------------------------------------------

function SectionHeader({ title, icon }: { title: string; icon: string }) {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Iconify icon={icon as any} width={24} sx={{ mr: 1.5, color: 'primary.main' }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {title}
            </Typography>
        </Box>
    );
}

function DetailItem({ icon, label, value }: { icon: string; label: string; value: string }) {
    return (
        <Stack direction="row" spacing={1.5} alignItems="flex-start">
            <Iconify icon={icon as any} width={20} sx={{ color: 'text.disabled', mt: 0.2 }} />
            <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                    {label}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {value}
                </Typography>
            </Box>
        </Stack>
    );
}
