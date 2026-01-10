
import dayjs from 'dayjs';
import listPlugin from '@fullcalendar/list';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import { useState, useEffect, useCallback } from 'react';
import interactionPlugin from '@fullcalendar/interaction';

import Dialog from '@mui/material/Dialog';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import { useTheme } from '@mui/material/styles';
import InputLabel from '@mui/material/InputLabel';
import CardHeader from '@mui/material/CardHeader';
import FormControl from '@mui/material/FormControl';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { Box, Card, Grid, Alert, Button, Snackbar, IconButton, Typography } from '@mui/material';

import { stripHtml } from 'src/utils/string';

import { DashboardContent } from 'src/layouts/dashboard';
import { type Call, fetchCalls, updateCall, deleteCall, createCall } from 'src/api/calls';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/confirm-dialog';

// ----------------------------------------------------------------------

const INITIAL_CALL_STATE: Partial<Call> = {
    title: '',
    call_purpose: '',
    call_agenda: '',
    call_for: 'Lead',
    outgoing_call_status: 'Scheduled',
    call_start_time: '',
    call_end_time: '',
};

export function CallsView() {
    const theme = useTheme();
    const [calls, setCalls] = useState<Call[]>([]);
    const [selectedCall, setSelectedCall] = useState<Call | null>(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [callData, setCallData] = useState<Partial<Call>>(INITIAL_CALL_STATE);
    const [confirmDelete, setConfirmDelete] = useState<{ open: boolean, id: string | null }>({ open: false, id: null });
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success',
    });

    const loadCalls = useCallback(async (start?: Date, end?: Date) => {
        try {
            const startStr = start?.toISOString();
            const endStr = end?.toISOString();
            const data = await fetchCalls(startStr, endStr);
            setCalls(data);
        } catch (error) {
            console.error('Failed to load calls:', error);
        }
    }, []);

    useEffect(() => {
        loadCalls();
    }, [loadCalls]);

    const handleDatesSet = (arg: any) => {
        loadCalls(arg.start, arg.end);
    };

    const handleEventClick = (info: any) => {
        const callId = info.event.id;
        const call = calls.find(c => c.name === callId);
        if (call) {
            setSelectedCall(call);
            setCallData({
                title: call.title,
                call_purpose: call.call_purpose || '',
                call_agenda: stripHtml(call.call_agenda || ''),
                call_for: call.call_for || 'Lead',
                outgoing_call_status: call.outgoing_call_status || 'Scheduled',
                call_start_time: call.call_start_time.replace(' ', 'T'),
                call_end_time: call.call_end_time?.replace(' ', 'T') || '',
            });
            setOpenDialog(true);
        }
    };

    const handleNewCall = () => {
        setSelectedCall(null);
        setCallData({
            ...INITIAL_CALL_STATE,
            call_start_time: new Date().toISOString().slice(0, 16),
            call_end_time: new Date(Date.now() + 1800000).toISOString().slice(0, 16), // 30 mins later
        });
        setOpenDialog(true);
    };

    const handleEventDrop = async (info: any) => {
        const { event } = info;
        try {
            await updateCall(event.id, {
                call_start_time: event.start.toISOString().replace('T', ' ').split('.')[0],
                call_end_time: event.end ? event.end.toISOString().replace('T', ' ').split('.')[0] : undefined
            });
            loadCalls();
        } catch (error: any) {
            console.error('Failed to update call position:', error);
            setSnackbar({ open: true, message: error.message || 'Failed to update call position', severity: 'error' });
            info.revert();
        }
    };

    const handleEventResize = async (info: any) => {
        const { event } = info;
        try {
            await updateCall(event.id, {
                call_start_time: event.start.toISOString().replace('T', ' ').split('.')[0],
                call_end_time: event.end ? event.end.toISOString().replace('T', ' ').split('.')[0] : undefined
            });
            loadCalls();
        } catch (error: any) {
            console.error('Failed to update call duration:', error);
            setSnackbar({ open: true, message: error.message || 'Failed to update call duration', severity: 'error' });
            info.revert();
        }
    };

    const handleSaveCall = async () => {
        try {
            const formattedData = {
                ...callData,
                call_start_time: callData.call_start_time?.replace('T', ' '),
                call_end_time: callData.call_end_time?.replace('T', ' ') || undefined,
            };

            if (selectedCall) {
                await updateCall(selectedCall.name, formattedData);
            } else {
                await createCall(formattedData);
            }
            setOpenDialog(false);
            loadCalls();
            setSnackbar({ open: true, message: selectedCall ? 'Call updated successfully' : 'Call created successfully', severity: 'success' });
        } catch (error: any) {
            console.error('Failed to save call:', error);
            setSnackbar({ open: true, message: error.message || 'Failed to save call', severity: 'error' });
        }
    };

    const handleConfirmDelete = async () => {
        if (!selectedCall) return;
        try {
            await deleteCall(selectedCall.name);
            setOpenDialog(false);
            setConfirmDelete({ open: false, id: null });
            loadCalls();
            setSnackbar({ open: true, message: 'Call deleted successfully', severity: 'success' });
        } catch (error: any) {
            console.error('Failed to delete call:', error);
            setSnackbar({ open: true, message: error.message || 'Failed to delete call', severity: 'error' });
        }
    };

    const calendarEvents = calls.map(call => ({
        id: call.name,
        title: call.title || 'Untitled Call',
        start: call.call_start_time,
        end: call.call_end_time,
        color: call.color || (call.outgoing_call_status === 'Completed' ? theme.palette.success.main : theme.palette.warning.main),
    }));

    return (
        <DashboardContent>
            <Card
                sx={{
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                <CardHeader
                    title="Calls Calendar"
                    subheader="Manage your scheduled calls"
                    action={
                        <Button variant="contained" onClick={handleNewCall} startIcon={<Iconify icon="mingcute:add-line" />}>
                            New Call
                        </Button>
                    }
                    sx={{ mb: 1 }}
                />

                <Box
                    sx={{
                        p: 3,
                        pt: 0,
                        '& .fc': {
                            '--fc-border-color': theme.palette.divider,
                            '--fc-daygrid-event-dot-width': '8px',
                            '--fc-list-event-dot-width': '10px',
                            '--fc-today-bg-color': theme.palette.primary.lighter,
                        },
                        // ToolBar
                        '& .fc .fc-toolbar': {
                            mb: 3,
                            gap: 1.5,
                            flexDirection: { xs: 'column', md: 'row' },
                            '& .fc-toolbar-title': {
                                fontSize: '1.25rem',
                                fontWeight: 700,
                            },
                        },
                        // Buttons
                        '& .fc .fc-button': {
                            border: 'none',
                            py: '8px',
                            px: '12px',
                            borderRadius: '8px',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            textTransform: 'capitalize',
                            backgroundColor: theme.palette.background.neutral,
                            color: theme.palette.text.primary,
                            transition: theme.transitions.create(['background-color', 'color', 'box-shadow']),
                            '&:hover': {
                                backgroundColor: theme.palette.action.hover,
                            },
                            '&:focus': {
                                boxShadow: 'none',
                            },
                            '&.fc-button-active': {
                                backgroundColor: '#08a3cd',
                                color: theme.palette.common.white,
                                '&:hover': {
                                    backgroundColor: '#068eb1',
                                },
                            },
                            '&.fc-today-button': {
                                border: `1px solid #08a3cd`,
                                '&:disabled': {
                                    opacity: 0.48,
                                },
                            },
                        },
                        // Table Head
                        '& .fc .fc-col-header-cell': {
                            py: 1.5,
                            backgroundColor: '#08a3cd',
                            color: theme.palette.common.white,
                            '&:first-of-type': {
                                borderTopLeftRadius: '12px',
                            },
                            '&:last-of-type': {
                                borderTopRightRadius: '12px',
                            },
                            '& .fc-col-header-cell-cushion': {
                                textDecoration: 'none',
                                fontSize: '0.875rem',
                                fontWeight: 700,
                            },
                        },
                        // Calendar Border Radius
                        '& .fc-view-harness': {
                            borderRadius: '12px',
                            overflow: 'hidden',
                            border: `1px solid ${theme.palette.divider}`,
                        },
                        '& .fc-scrollgrid': {
                            border: 'none',
                        },
                        // Day Cells
                        '& .fc .fc-daygrid-day': {
                            '&:hover': {
                                backgroundColor: theme.palette.action.hover,
                            },
                        },
                        '& .fc .fc-daygrid-day-number': {
                            p: 1.5,
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            color: theme.palette.text.primary,
                        },
                        // Events
                        '& .fc .fc-event': {
                            border: 'none',
                            borderRadius: '6px',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            mx: '4px',
                            my: '1px',
                            p: '2px 4px',
                            cursor: 'pointer',
                        },
                        '& .fc .fc-daygrid-event': {
                            boxShadow: 'none',
                        },
                        // List View
                        '& .fc .fc-list': {
                            border: 'none',
                            '& .fc-list-day-cushion': {
                                backgroundColor: theme.palette.background.neutral,
                            },
                        },
                    }}
                >
                    <FullCalendar
                        plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
                        headerToolbar={{
                            left: 'prev,next today',
                            center: 'title',
                            right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
                        }}
                        initialView="dayGridMonth"
                        editable
                        selectable
                        selectMirror
                        dayMaxEvents={3}
                        weekends
                        events={calendarEvents}
                        datesSet={handleDatesSet}
                        eventClick={handleEventClick}
                        eventDrop={handleEventDrop}
                        eventResize={handleEventResize}
                        select={(info) => {
                            setSelectedCall(null);
                            setCallData({
                                ...INITIAL_CALL_STATE,
                                call_start_time: info.startStr.slice(0, 16),
                                call_end_time: info.endStr.slice(0, 16),
                            });
                            setOpenDialog(true);
                        }}
                        height="auto"
                        eventDisplay="block"
                        eventTimeFormat={{
                            hour: 'numeric',
                            minute: '2-digit',
                            meridiem: 'short',
                        }}
                        views={{
                            dayGridMonth: {
                                titleFormat: { year: 'numeric', month: 'long' },
                            },
                            timeGridWeek: {
                                titleFormat: { year: 'numeric', month: 'short', day: 'numeric' },
                            },
                            timeGridDay: {
                                titleFormat: { year: 'numeric', month: 'long', day: 'numeric' },
                            },
                        }}
                    />
                </Box>
            </Card>

            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth maxWidth="sm">
                <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {selectedCall ? 'Edit Call' : 'New Call'}
                    <IconButton onClick={() => setOpenDialog(false)} sx={{ color: 'text.secondary' }}>
                        <Iconify icon="mingcute:close-line" />
                    </IconButton>
                </DialogTitle>

                <DialogContent dividers>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                    <Iconify icon="solar:pen-bold" sx={{ color: 'primary.main' }} />
                                    <Typography variant="subtitle2">General Information</Typography>
                                </Box>
                                <TextField
                                    onClick={(e) => e.stopPropagation()}
                                    fullWidth
                                    label="Title"
                                    value={callData.title}
                                    onChange={(e) => setCallData({ ...callData, title: e.target.value })}
                                />
                            </Box>

                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <FormControl fullWidth>
                                        <InputLabel>Call For</InputLabel>
                                        <Select
                                            label="Call For"
                                            value={callData.call_for}
                                            onChange={(e) => setCallData({ ...callData, call_for: e.target.value as string })}
                                        >
                                            <MenuItem value="Lead">Lead</MenuItem>
                                            <MenuItem value="Contact">Contact</MenuItem>
                                            <MenuItem value="Accounts">Accounts</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <FormControl fullWidth>
                                        <InputLabel>Status</InputLabel>
                                        <Select
                                            label="Status"
                                            value={callData.outgoing_call_status}
                                            onChange={(e) => setCallData({ ...callData, outgoing_call_status: e.target.value as string })}
                                        >
                                            <MenuItem value="Scheduled">Scheduled</MenuItem>
                                            <MenuItem value="Completed">Completed</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                            </Grid>

                            <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                    <Iconify icon="solar:clock-circle-outline" sx={{ color: 'primary.main' }} />
                                    <Typography variant="subtitle2">Time Schedule</Typography>
                                </Box>
                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <DateTimePicker
                                            label="Start Time"
                                            value={callData.call_start_time ? dayjs(callData.call_start_time) : null}
                                            onChange={(newValue) => setCallData({ ...callData, call_start_time: newValue ? newValue.format('YYYY-MM-DD HH:mm:ss') : '' })}
                                            slotProps={{
                                                textField: {
                                                    fullWidth: true,
                                                    size: 'small',
                                                    sx: {
                                                        '& .MuiInputBase-root': {
                                                            fontSize: '0.813rem',
                                                            height: '36px'
                                                        },
                                                        '& .MuiInputLabel-root': {
                                                            fontSize: '0.813rem'
                                                        }
                                                    }
                                                }
                                            }}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <DateTimePicker
                                            label="End Time"
                                            value={callData.call_end_time ? dayjs(callData.call_end_time) : null}
                                            onChange={(newValue) => setCallData({ ...callData, call_end_time: newValue ? newValue.format('YYYY-MM-DD HH:mm:ss') : '' })}
                                            slotProps={{
                                                textField: {
                                                    fullWidth: true,
                                                    size: 'small',
                                                    sx: {
                                                        '& .MuiInputBase-root': {
                                                            fontSize: '0.813rem',
                                                            height: '36px'
                                                        },
                                                        '& .MuiInputLabel-root': {
                                                            fontSize: '0.813rem'
                                                        }
                                                    }
                                                }
                                            }}
                                        />
                                    </Grid>
                                </Grid>
                            </Box>

                            <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                    <Iconify icon={"solar:chat-round-dots-bold" as any} sx={{ color: 'primary.main' }} />
                                    <Typography variant="subtitle2">Details & Agenda</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <TextField
                                        fullWidth
                                        label="Purpose"
                                        value={callData.call_purpose}
                                        onChange={(e) => setCallData({ ...callData, call_purpose: e.target.value })}
                                    />
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={4}
                                        label="Agenda"
                                        value={callData.call_agenda}
                                        onChange={(e) => setCallData({ ...callData, call_agenda: e.target.value })}
                                    />
                                </Box>
                            </Box>
                        </Box>
                    </LocalizationProvider>
                </DialogContent>
                <DialogActions sx={{ p: 2, gap: 1 }}>
                    {selectedCall && (
                        <Button color="error" variant="outlined" onClick={() => setConfirmDelete({ open: true, id: selectedCall.name })} sx={{ mr: 'auto' }}>
                            Delete
                        </Button>
                    )}
                    <Button color="inherit" variant="outlined" onClick={() => setOpenDialog(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleSaveCall}>{selectedCall ? 'Save Changes' : 'Create Call'}</Button>
                </DialogActions>
            </Dialog>

            <ConfirmDialog
                open={confirmDelete.open}
                onClose={() => setConfirmDelete({ open: false, id: null })}
                title="Confirm Delete"
                content="Are you sure you want to delete this call?"
                action={
                    <Button onClick={handleConfirmDelete} color="error" variant="contained" sx={{ borderRadius: 1.5, minWidth: 100 }}>
                        Delete
                    </Button>
                }
            />

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
                    severity={snackbar.severity}
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </DashboardContent>
    );
}
