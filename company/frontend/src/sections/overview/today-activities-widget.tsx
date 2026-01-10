import type { Call, Meeting } from 'src/api/dashboard';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Table from '@mui/material/Table';
import { alpha } from '@mui/material/styles';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

// ----------------------------------------------------------------------

type CallsTableProps = {
    title?: string;
    subheader?: string;
    calls: Call[];
};

type MeetingsTableProps = {
    title?: string;
    subheader?: string;
    meetings: Meeting[];
};

type TodayActivitiesWidgetProps = {
    calls: Call[];
    meetings: Meeting[];
};

// ----------------------------------------------------------------------

export function CallsTable({ title, subheader, calls }: CallsTableProps) {
    const formatTime = (datetime: string) => {
        const date = new Date(datetime);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    const getStatusColor = (status: string) => {
        if (status === 'Completed') return 'success';
        if (status === 'Scheduled') return 'info';
        return 'default';
    };

    return (
        <Card sx={{ border: (t) => `1px solid ${alpha(t.palette.grey[500], 0.08)}`, boxShadow: (t) => t.customShadows?.card }}>
            <CardHeader
                title={title}
                subheader={subheader}
                sx={{ mb: 1 }}
                titleTypographyProps={{ variant: 'h6' }}
            />

            <Scrollbar>
                <TableContainer sx={{ overflow: 'unset' }}>
                    <Table sx={{ minWidth: 400 }}>
                        <TableHead>
                            <TableRow sx={{ bgcolor: (t) => alpha(t.palette.grey[500], 0.04) }}>
                                <TableCell sx={{ color: 'text.secondary', fontWeight: 'bold' }}>Title</TableCell>
                                <TableCell sx={{ color: 'text.secondary', fontWeight: 'bold' }}>Related To</TableCell>
                                <TableCell sx={{ color: 'text.secondary', fontWeight: 'bold' }}>Time</TableCell>
                                <TableCell sx={{ color: 'text.secondary', fontWeight: 'bold' }}>Status</TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {calls.map((call) => (
                                <TableRow key={call.name} hover>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Box
                                                sx={{
                                                    width: 32,
                                                    height: 32,
                                                    borderRadius: 1,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
                                                    color: 'primary.main'
                                                }}
                                            >
                                                <Iconify icon={"solar:phone-calling-rounded-bold" as any} width={18} />
                                            </Box>
                                            <Typography variant="subtitle2" sx={{ fontWeight: '600' }}>{call.title || 'Untitled Call'}</Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                            {call.call_for} {call.lead_name ? `• ${call.lead_name}` : ''}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontWeight: '500' }}>{formatTime(call.call_start_time)}</Typography>
                                        {call.call_end_time && (
                                            <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block' }}>
                                                ends {formatTime(call.call_end_time)}
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Label
                                            color={getStatusColor(call.outgoing_call_status) as any}
                                            variant="soft"
                                            sx={{ fontWeight: 'bold' }}
                                        >
                                            {call.outgoing_call_status || 'Scheduled'}
                                        </Label>
                                    </TableCell>
                                </TableRow>
                            ))}

                            {calls.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} align="center">
                                        <Box sx={{ py: 6 }}>
                                            <Iconify icon={"solar:history-bold-duotone" as any} width={48} sx={{ color: 'text.disabled', mb: 1, opacity: 0.24 }} />
                                            <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                                                No calls scheduled for today
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Scrollbar>
        </Card>
    );
}

// ----------------------------------------------------------------------

export function MeetingsTable({ title, subheader, meetings }: MeetingsTableProps) {
    const formatTime = (datetime: string) => {
        const date = new Date(datetime);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    const getStatusColor = (status: string) => {
        if (status === 'Completed') return 'success';
        if (status === 'Scheduled') return 'info';
        return 'default';
    };

    return (
        <Card sx={{ border: (t) => `1px solid ${alpha(t.palette.grey[500], 0.08)}`, boxShadow: (t) => t.customShadows?.card }}>
            <CardHeader
                title={title}
                subheader={subheader}
                sx={{ mb: 1 }}
                titleTypographyProps={{ variant: 'h6' }}
            />

            <Scrollbar>
                <TableContainer sx={{ overflow: 'unset' }}>
                    <Table sx={{ minWidth: 400 }}>
                        <TableHead>
                            <TableRow sx={{ bgcolor: (t) => alpha(t.palette.grey[500], 0.04) }}>
                                <TableCell sx={{ color: 'text.secondary', fontWeight: 'bold' }}>Title</TableCell>
                                <TableCell sx={{ color: 'text.secondary', fontWeight: 'bold' }}>Related To</TableCell>
                                <TableCell sx={{ color: 'text.secondary', fontWeight: 'bold' }}>Time</TableCell>
                                <TableCell sx={{ color: 'text.secondary', fontWeight: 'bold' }}>Status</TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {meetings.map((meeting) => (
                                <TableRow key={meeting.name} hover>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Box
                                                sx={{
                                                    width: 32,
                                                    height: 32,
                                                    borderRadius: 1,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    bgcolor: (t) => alpha(t.palette.warning.main, 0.1),
                                                    color: 'warning.main'
                                                }}
                                            >
                                                <Iconify icon={"solar:calendar-add-bold" as any} width={18} />
                                            </Box>
                                            <Typography variant="subtitle2" sx={{ fontWeight: '600' }}>{meeting.title}</Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                            {meeting.meet_for} {meeting.lead_name ? `• ${meeting.lead_name}` : ''}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontWeight: '500' }}>{formatTime(meeting.from)}</Typography>
                                        {meeting.to && (
                                            <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block' }}>
                                                ends {formatTime(meeting.to)}
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Label
                                            color={getStatusColor(meeting.outgoing_call_status) as any}
                                            variant="soft"
                                            sx={{ fontWeight: 'bold' }}
                                        >
                                            {meeting.outgoing_call_status || 'Scheduled'}
                                        </Label>
                                    </TableCell>
                                </TableRow>
                            ))}

                            {meetings.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} align="center">
                                        <Box sx={{ py: 6 }}>
                                            <Iconify icon={"solar:calendar-mark-bold-duotone" as any} width={48} sx={{ color: 'text.disabled', mb: 1, opacity: 0.24 }} />
                                            <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                                                No meetings scheduled for today
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Scrollbar>
        </Card>
    );
}

// ----------------------------------------------------------------------

export function TodayActivitiesWidget({ calls, meetings }: TodayActivitiesWidgetProps) {
    return (
        <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
                <CallsTable
                    title="Today's Calls"
                    subheader={`${calls.length} scheduled calls`}
                    calls={calls}
                />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
                <MeetingsTable
                    title="Today's Meetings"
                    subheader={`${meetings.length} scheduled meetings`}
                    meetings={meetings}
                />
            </Grid>
        </Grid>
    );
}
