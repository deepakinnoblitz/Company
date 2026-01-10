
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
import { type Meeting, fetchMeetings, updateMeeting, deleteMeeting, createMeeting } from 'src/api/meetings';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/confirm-dialog';

// ----------------------------------------------------------------------

const INITIAL_MEETING_STATE: Partial<Meeting> = {
    title: '',
    meet_for: 'Lead',
    outgoing_call_status: 'Scheduled',
    from: '',
    to: '',
    meeting_venue: 'In Office',
    location: '',
    completed_meet_notes: '',
};

export function MeetingsView() {
    const theme = useTheme();
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [meetingData, setMeetingData] = useState<Partial<Meeting>>(INITIAL_MEETING_STATE);
    const [confirmDelete, setConfirmDelete] = useState<{ open: boolean, id: string | null }>({ open: false, id: null });
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success',
    });

    const loadMeetings = useCallback(async (start?: Date, end?: Date) => {
        try {
            const startStr = start?.toISOString();
            const endStr = end?.toISOString();
            const data = await fetchMeetings(startStr, endStr);
            setMeetings(data);
        } catch (error) {
            console.error('Failed to load meetings:', error);
        }
    }, []);

    useEffect(() => {
        loadMeetings();
    }, [loadMeetings]);

    const handleDatesSet = (arg: any) => {
        loadMeetings(arg.start, arg.end);
    };

    const handleEventClick = (info: any) => {
        const meetingId = info.event.id;
        const meeting = meetings.find(m => m.name === meetingId);
        if (meeting) {
            setSelectedMeeting(meeting);
            setMeetingData({
                title: meeting.title,
                meet_for: meeting.meet_for || 'Lead',
                outgoing_call_status: meeting.outgoing_call_status || 'Scheduled',
                from: meeting.from.replace(' ', 'T'),
                to: meeting.to?.replace(' ', 'T') || '',
                meeting_venue: meeting.meeting_venue || 'In Office',
                location: meeting.location || '',
                completed_meet_notes: stripHtml(meeting.completed_meet_notes || ''),
            });
            setOpenDialog(true);
        }
    };

    const handleNewMeeting = () => {
        setSelectedMeeting(null);
        setMeetingData({
            ...INITIAL_MEETING_STATE,
            from: new Date().toISOString().slice(0, 16),
            to: new Date(Date.now() + 3600000).toISOString().slice(0, 16), // 1 hour later
        });
        setOpenDialog(true);
    };

    const handleEventDrop = async (info: any) => {
        const { event } = info;
        try {
            await updateMeeting(event.id, {
                from: event.start.toISOString().replace('T', ' ').split('.')[0],
                to: event.end ? event.end.toISOString().replace('T', ' ').split('.')[0] : undefined
            });
            loadMeetings();
        } catch (error: any) {
            console.error('Failed to update meeting position:', error);
            setSnackbar({ open: true, message: error.message || 'Failed to update meeting position', severity: 'error' });
            info.revert();
        }
    };

    const handleEventResize = async (info: any) => {
        const { event } = info;
        try {
            await updateMeeting(event.id, {
                from: event.start.toISOString().replace('T', ' ').split('.')[0],
                to: event.end ? event.end.toISOString().replace('T', ' ').split('.')[0] : undefined
            });
            loadMeetings();
        } catch (error: any) {
            console.error('Failed to update meeting duration:', error);
            setSnackbar({ open: true, message: error.message || 'Failed to update meeting duration', severity: 'error' });
            info.revert();
        }
    };

    const handleSaveMeeting = async () => {
        try {
            const formattedData = {
                ...meetingData,
                from: meetingData.from?.replace('T', ' '),
                to: meetingData.to?.replace('T', ' ') || undefined,
            };

            if (selectedMeeting) {
                await updateMeeting(selectedMeeting.name, formattedData);
            } else {
                await createMeeting(formattedData);
            }
            setOpenDialog(false);
            loadMeetings();
            setSnackbar({ open: true, message: selectedMeeting ? 'Meeting updated successfully' : 'Meeting created successfully', severity: 'success' });
        } catch (error: any) {
            console.error('Failed to save meeting:', error);
            setSnackbar({ open: true, message: error.message || 'Failed to save meeting', severity: 'error' });
        }
    };

    const handleConfirmDelete = async () => {
        if (!selectedMeeting) return;
        try {
            await deleteMeeting(selectedMeeting.name);
            setOpenDialog(false);
            setConfirmDelete({ open: false, id: null });
            loadMeetings();
            setSnackbar({ open: true, message: 'Meeting deleted successfully', severity: 'success' });
        } catch (error: any) {
            console.error('Failed to delete meeting:', error);
            setSnackbar({ open: true, message: error.message || 'Failed to delete meeting', severity: 'error' });
        }
    };

    const calendarEvents = meetings.map(meeting => ({
        id: meeting.name,
        title: meeting.title || 'Untitled Meeting',
        start: meeting.from,
        end: meeting.to,
        color: meeting.outgoing_call_status === 'Completed' ? theme.palette.success.main : theme.palette.warning.main,
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
                    title="Meetings Calendar"
                    subheader="Manage your scheduled meetings"
                    action={
                        <Button variant="contained" onClick={handleNewMeeting} startIcon={<Iconify icon="mingcute:add-line" />}>
                            New Meeting
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
                            setSelectedMeeting(null);
                            setMeetingData({
                                ...INITIAL_MEETING_STATE,
                                from: info.startStr.slice(0, 16),
                                to: info.endStr.slice(0, 16),
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
                    {selectedMeeting ? 'Edit Meeting' : 'New Meeting'}
                    <IconButton onClick={() => setOpenDialog(false)} sx={{ color: 'text.secondary' }}>
                        <Iconify icon="mingcute:close-line" />
                    </IconButton>
                </DialogTitle>

                <DialogContent dividers>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                    <Iconify icon="solar:pen-bold" sx={{ color: 'warning.main' }} />
                                    <Typography variant="subtitle2">General Information</Typography>
                                </Box>
                                <TextField
                                    onClick={(e) => e.stopPropagation()}
                                    fullWidth
                                    label="Title"
                                    value={meetingData.title}
                                    onChange={(e) => setMeetingData({ ...meetingData, title: e.target.value })}
                                />
                            </Box>

                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <FormControl fullWidth>
                                        <InputLabel>Meet For</InputLabel>
                                        <Select
                                            label="Meet For"
                                            value={meetingData.meet_for}
                                            onChange={(e) => setMeetingData({ ...meetingData, meet_for: e.target.value as string })}
                                        >
                                            <MenuItem value="Lead">Lead</MenuItem>
                                            <MenuItem value="Contact">Contact</MenuItem>
                                            <MenuItem value="Account">Account</MenuItem>
                                            <MenuItem value="Others">Others</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <FormControl fullWidth>
                                        <InputLabel>Status</InputLabel>
                                        <Select
                                            label="Status"
                                            value={meetingData.outgoing_call_status}
                                            onChange={(e) => setMeetingData({ ...meetingData, outgoing_call_status: e.target.value as string })}
                                        >
                                            <MenuItem value="Scheduled">Scheduled</MenuItem>
                                            <MenuItem value="Completed">Completed</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                            </Grid>

                            <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                    <Iconify icon="solar:clock-circle-outline" sx={{ color: 'warning.main' }} />
                                    <Typography variant="subtitle2">Time Schedule</Typography>
                                </Box>
                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <DateTimePicker
                                            label="From"
                                            value={meetingData.from ? dayjs(meetingData.from) : null}
                                            onChange={(newValue) => setMeetingData({ ...meetingData, from: newValue ? newValue.format('YYYY-MM-DD HH:mm:ss') : '' })}
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
                                            label="To"
                                            value={meetingData.to ? dayjs(meetingData.to) : null}
                                            onChange={(newValue) => setMeetingData({ ...meetingData, to: newValue ? newValue.format('YYYY-MM-DD HH:mm:ss') : '' })}
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
                                    <Iconify icon={"solar:chat-round-dots-bold" as any} sx={{ color: 'warning.main' }} />
                                    <Typography variant="subtitle2">Location & Venue</Typography>
                                </Box>
                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <FormControl fullWidth>
                                            <InputLabel>Venue</InputLabel>
                                            <Select
                                                label="Venue"
                                                value={meetingData.meeting_venue}
                                                onChange={(e) => setMeetingData({ ...meetingData, meeting_venue: e.target.value as string })}
                                            >
                                                <MenuItem value="In Office">In Office</MenuItem>
                                                <MenuItem value="Client Location">Client Location</MenuItem>
                                                <MenuItem value="Online">Online</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <TextField
                                            fullWidth
                                            label="Location"
                                            value={meetingData.location}
                                            onChange={(e) => setMeetingData({ ...meetingData, location: e.target.value })}
                                        />
                                    </Grid>
                                </Grid>
                            </Box>

                            <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                    <Iconify icon={"solar:document-text-bold" as any} sx={{ color: 'warning.main' }} />
                                    <Typography variant="subtitle2">Meeting Notes</Typography>
                                </Box>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={4}
                                    label="Notes"
                                    value={meetingData.completed_meet_notes}
                                    onChange={(e) => setMeetingData({ ...meetingData, completed_meet_notes: e.target.value })}
                                />
                            </Box>
                        </Box>
                    </LocalizationProvider>
                </DialogContent>
                <DialogActions sx={{ p: 2, gap: 1 }}>
                    {selectedMeeting && (
                        <Button color="error" variant="outlined" onClick={() => setConfirmDelete({ open: true, id: selectedMeeting.name })} sx={{ mr: 'auto' }}>
                            Delete
                        </Button>
                    )}
                    <Button color="inherit" variant="outlined" onClick={() => setOpenDialog(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleSaveMeeting}>{selectedMeeting ? 'Save Changes' : 'Create Meeting'}</Button>
                </DialogActions>
            </Dialog>

            <ConfirmDialog
                open={confirmDelete.open}
                onClose={() => setConfirmDelete({ open: false, id: null })}
                title="Confirm Delete"
                content="Are you sure you want to delete this meeting?"
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
