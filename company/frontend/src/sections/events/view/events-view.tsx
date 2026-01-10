
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
import InputLabel from '@mui/material/InputLabel';
import CardHeader from '@mui/material/CardHeader';
import FormControl from '@mui/material/FormControl';
import DialogTitle from '@mui/material/DialogTitle';
import { alpha, useTheme } from '@mui/material/styles';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { Box, Card, Grid, Alert, Button, Snackbar, IconButton, Typography } from '@mui/material';

import { stripHtml } from 'src/utils/string';

import { DashboardContent } from 'src/layouts/dashboard';
import { fetchEvents, updateEvent, createEvent, deleteEvent, type CalendarEvent } from 'src/api/events';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/confirm-dialog';

// ----------------------------------------------------------------------

const INITIAL_EVENT_STATE: Partial<CalendarEvent> = {
    subject: '',
    description: '',
    event_category: 'Event',
    event_type: 'Private',
    starts_on: '',
    ends_on: '',
    status: 'Open',
};

export function EventsView() {
    const theme = useTheme();
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [eventData, setEventData] = useState<Partial<CalendarEvent>>(INITIAL_EVENT_STATE);
    const [confirmDelete, setConfirmDelete] = useState<{ open: boolean, id: string | null }>({ open: false, id: null });
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success',
    });

    const loadEvents = useCallback(async (start?: Date, end?: Date) => {
        try {
            const startStr = start?.toISOString();
            const endStr = end?.toISOString();
            const data = await fetchEvents(startStr, endStr);

            setEvents(data);
        } catch (error) {
            console.error('Failed to load events:', error);
        }
    }, []);

    useEffect(() => {
        loadEvents();
    }, [loadEvents]);

    const handleDatesSet = (arg: any) => {
        loadEvents(arg.start, arg.end);
    };

    const handleEventClick = (info: any) => {
        const eventId = info.event.id;
        const event = events.find(e => e.name === eventId);
        if (event) {
            setSelectedEvent(event);
            setEventData({
                subject: event.subject,
                description: stripHtml(event.description || ''),
                event_category: event.event_category || 'Event',
                event_type: event.event_type || 'Private',
                starts_on: event.starts_on.replace(' ', 'T'),
                ends_on: event.ends_on?.replace(' ', 'T') || '',
                status: event.status || 'Open',
            });
            setOpenDialog(true);
        }
    };


    const handleEventDrop = async (info: any) => {
        const { event } = info;
        try {
            await updateEvent(event.id, {
                starts_on: event.start.toISOString().replace('T', ' ').split('.')[0],
                ends_on: event.end ? event.end.toISOString().replace('T', ' ').split('.')[0] : undefined
            });
            // Refresh events
            loadEvents();
        } catch (error: any) {
            console.error('Failed to update event position:', error);
            setSnackbar({ open: true, message: error.message || 'Failed to update event position', severity: 'error' });
            info.revert();
        }
    };

    const handleEventResize = async (info: any) => {
        const { event } = info;
        try {
            await updateEvent(event.id, {
                starts_on: event.start.toISOString().replace('T', ' ').split('.')[0],
                ends_on: event.end ? event.end.toISOString().replace('T', ' ').split('.')[0] : undefined
            });
            // Refresh events
            loadEvents();
        } catch (error: any) {
            console.error('Failed to update event duration:', error);
            setSnackbar({ open: true, message: error.message || 'Failed to update event duration', severity: 'error' });
            info.revert();
        }
    };

    const handleSaveEvent = async () => {
        const formattedData = {
            ...eventData,
            starts_on: eventData.starts_on?.replace('T', ' '),
            ends_on: eventData.ends_on?.replace('T', ' '),
        };

        try {
            if (selectedEvent) {
                await updateEvent(selectedEvent.name, formattedData);
            } else {
                await createEvent(formattedData);
            }
            setOpenDialog(false);
            loadEvents();
            setSnackbar({ open: true, message: selectedEvent ? 'Event updated successfully' : 'Event created successfully', severity: 'success' });
        } catch (error: any) {
            console.error('Failed to save event:', error);
            setSnackbar({ open: true, message: error.message || 'Failed to save event', severity: 'error' });
        }
    };

    const handleConfirmDelete = async () => {
        if (!selectedEvent) return;
        try {
            await deleteEvent(selectedEvent.name);
            setOpenDialog(false);
            setConfirmDelete({ open: false, id: null });
            loadEvents();
            setSnackbar({ open: true, message: 'Event deleted successfully', severity: 'success' });
        } catch (error: any) {
            console.error('Failed to delete event:', error);
            setSnackbar({ open: true, message: error.message || 'Failed to delete event', severity: 'error' });
        }
    };


    const calendarEvents = events.map((event) => {
        let eventColor = event.color || '#08a3cd';

        if (!event.color) {
            switch (event.status) {
                case 'Completed':
                case 'Closed':
                    eventColor = theme.palette.success.main;
                    break;
                case 'Cancelled':
                    eventColor = theme.palette.error.main;
                    break;
                case 'Scheduled':
                    eventColor = '#08a3cd';
                    break;
                case 'Open':
                    eventColor = theme.palette.warning.main;
                    break;
                default:
                    eventColor = '#08a3cd';
            }
        }

        return {
            id: event.name,
            title: event.subject,
            start: event.starts_on,
            end: event.ends_on || event.starts_on,
            allDay: event.all_day === 1,
            color: eventColor,
            extendedProps: {
                eventType: event.event_type,
                status: event.status,
                category: event.event_category,
            },
        };
    });

    return (
        <DashboardContent maxWidth="xl">
            <Card
                sx={{
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                <CardHeader
                    title="Events Calendar"
                    subheader="Manage your schedule and important events"
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
                                    backgroundColor: '#068eb1', // Slightly darker for hover
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
                            backgroundColor: '#08a3cd', // Custom theme color
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
                            setSelectedEvent(null);
                            setEventData({
                                ...INITIAL_EVENT_STATE,
                                starts_on: info.startStr.slice(0, 16),
                                ends_on: info.endStr.slice(0, 16),
                            });
                            setOpenDialog(true);
                        }}
                        eventContent={(eventInfo) => {
                            const { category } = eventInfo.event.extendedProps;
                            let icon = "solar:notes-bold";

                            if (category === 'Call') icon = "solar:phone-bold";
                            else if (category === 'Meeting') icon = "solar:calendar-add-bold";

                            return (
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.5,
                                        width: 1,
                                        px: 0.5,
                                        overflow: 'hidden',
                                    }}
                                >
                                    <Iconify icon={icon as any} width={14} sx={{ flexShrink: 0 }} />
                                    <Box
                                        component="span"
                                        sx={{
                                            flexGrow: 1,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                        }}
                                    >
                                        {eventInfo.timeText && (
                                            <Box component="span" sx={{ mr: 0.5, fontWeight: 600 }}>
                                                {eventInfo.timeText}
                                            </Box>
                                        )}
                                        {eventInfo.event.title}
                                    </Box>
                                </Box>
                            );
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

            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth maxWidth="md">
                <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {selectedEvent ? 'Edit Event' : 'New Event'}
                    <IconButton
                        aria-label="close"
                        onClick={() => setOpenDialog(false)}
                        sx={{
                            color: (themeValue) => themeValue.palette.grey[500],
                        }}
                    >
                        <Iconify icon="mingcute:close-line" />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
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
                                        <Iconify icon="solar:pen-bold" width={20} />
                                    </Box>
                                    <Typography variant="subtitle1" sx={{ fontWeight: '600' }}>Event Overview</Typography>
                                </Box>
                                <TextField
                                    fullWidth
                                    label="Subject"
                                    value={eventData.subject}
                                    onChange={(e) => setEventData({ ...eventData, subject: e.target.value })}
                                />
                            </Box>

                            <Grid container spacing={3}>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <FormControl fullWidth>
                                        <InputLabel>Event Category</InputLabel>
                                        <Select
                                            label="Event Category"
                                            value={eventData.event_category}
                                            onChange={(e) => setEventData({ ...eventData, event_category: e.target.value as string })}
                                        >
                                            <MenuItem value="Event">Event</MenuItem>
                                            <MenuItem value="Meeting">Meeting</MenuItem>
                                            <MenuItem value="Call">Call</MenuItem>
                                            <MenuItem value="Email">Email</MenuItem>
                                            <MenuItem value="Other">Other</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <FormControl fullWidth>
                                        <InputLabel>Status</InputLabel>
                                        <Select
                                            label="Status"
                                            value={eventData.status}
                                            onChange={(e) => setEventData({ ...eventData, status: e.target.value as string })}
                                        >
                                            <MenuItem value="Open">Open</MenuItem>
                                            <MenuItem value="Scheduled">Scheduled</MenuItem>
                                            <MenuItem value="Completed">Completed</MenuItem>
                                            <MenuItem value="Closed">Closed</MenuItem>
                                            <MenuItem value="Cancelled">Cancelled</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                            </Grid>

                            <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                                    <Box
                                        sx={{
                                            width: 32,
                                            height: 32,
                                            borderRadius: 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            bgcolor: (t) => alpha(t.palette.info.main, 0.1),
                                            color: 'info.main'
                                        }}
                                    >
                                        <Iconify icon="solar:clock-circle-outline" width={20} />
                                    </Box>
                                    <Typography variant="subtitle1" sx={{ fontWeight: '600' }}>Schedule Details</Typography>
                                </Box>
                                <Grid container spacing={3}>
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <DateTimePicker
                                            label="Starts On"
                                            value={eventData.starts_on ? dayjs(eventData.starts_on) : null}
                                            onChange={(newValue) => setEventData({ ...eventData, starts_on: newValue ? newValue.format('YYYY-MM-DD HH:mm:ss') : '' })}
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
                                            label="Ends On"
                                            value={eventData.ends_on ? dayjs(eventData.ends_on) : null}
                                            onChange={(newValue) => setEventData({ ...eventData, ends_on: newValue ? newValue.format('YYYY-MM-DD HH:mm:ss') : '' })}
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
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
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
                                        <Iconify icon="solar:chat-round-dots-bold" width={20} />
                                    </Box>
                                    <Typography variant="subtitle1" sx={{ fontWeight: '600' }}>Description</Typography>
                                </Box>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={4}
                                    label="Details"
                                    value={eventData.description}
                                    onChange={(e) => setEventData({ ...eventData, description: e.target.value })}
                                />
                            </Box>
                        </Box>
                    </LocalizationProvider>
                </DialogContent>
                <DialogActions sx={{ p: 2, gap: 1 }}>
                    {selectedEvent && (
                        <Button color="error" variant="outlined" onClick={() => setConfirmDelete({ open: true, id: selectedEvent.name })} sx={{ mr: 'auto' }}>
                            Delete
                        </Button>
                    )}
                    <Button color="inherit" variant="outlined" onClick={() => setOpenDialog(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleSaveEvent}>{selectedEvent ? 'Save Changes' : 'Create Event'}</Button>
                </DialogActions>
            </Dialog>

            <ConfirmDialog
                open={confirmDelete.open}
                onClose={() => setConfirmDelete({ open: false, id: null })}
                title="Confirm Delete"
                content="Are you sure you want to delete this event?"
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
