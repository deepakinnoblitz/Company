import type { CardProps } from '@mui/material/Card';

import listPlugin from '@fullcalendar/list';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

import { Box } from '@mui/material';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import { alpha, useTheme } from '@mui/material/styles';

import { Scrollbar } from 'src/components/scrollbar';

// ----------------------------------------------------------------------

type Props = CardProps & {
    title?: string;
    subheader?: string;
    events: {
        title: string;
        start: string;
        color?: string;
    }[];
    onDateChange?: (date: Date) => void;
};

export function HRCalendar({ title, subheader, events, onDateChange, ...other }: Props) {
    const theme = useTheme();

    return (
        <Card
            {...other}
            sx={{
                background: alpha(theme.palette.background.paper, 0.8),
                backdropFilter: 'blur(10px)',
                border: `1px solid ${alpha(theme.palette.grey[500], 0.12)}`,
                ...other.sx,
            }}
        >
            <CardHeader
                title={title}
                subheader={subheader}
                sx={{
                    mb: 2,
                    '& .MuiTypography-root': {
                        fontWeight: 'bold',
                    },
                }}
            />

            <Scrollbar sx={{ maxHeight: 600 }}>
                <Box
                    sx={{
                        p: 2,
                        '& .fc': {
                            '--fc-border-color': alpha(theme.palette.grey[500], 0.08),
                            '--fc-today-bg-color': alpha(theme.palette.primary.main, 0.04),
                            '--fc-page-bg-color': 'transparent',
                            '--fc-neutral-bg-color': alpha(theme.palette.grey[500], 0.02),
                            '--fc-list-event-hover-bg-color': alpha(theme.palette.primary.lighter, 0.4),
                            fontFamily: theme.typography.fontFamily,
                        },
                        '& .fc .fc-toolbar-title': {
                            fontSize: '1.25rem',
                            fontWeight: 800,
                            color: theme.palette.text.primary,
                            letterSpacing: -0.5,
                        },
                        '& .fc .fc-button': {
                            bgcolor: 'background.neutral',
                            border: 'none',
                            color: theme.palette.text.secondary,
                            fontWeight: 700,
                            textTransform: 'capitalize',
                            borderRadius: '10px',
                            px: 1.5,
                            transition: theme.transitions.duration.shorter,
                            '&:hover': {
                                bgcolor: alpha(theme.palette.primary.main, 0.08),
                                color: theme.palette.primary.main,
                            },
                            '&:disabled': {
                                bgcolor: alpha(theme.palette.grey[500], 0.05),
                                color: theme.palette.text.disabled,
                            },
                        },
                        '& .fc .fc-button-primary:not(:disabled).fc-button-active': {
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            color: theme.palette.primary.main,
                            fontWeight: 800,
                        },
                        '& .fc .fc-daygrid-day-number': {
                            color: theme.palette.text.secondary,
                            fontWeight: 600,
                            fontSize: '0.8rem',
                            p: 1.5,
                        },
                        '& .fc .fc-col-header-cell-cushion': {
                            color: theme.palette.text.disabled,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            fontSize: '0.65rem',
                            letterSpacing: 1.2,
                            py: 2,
                        },
                        '& .fc .fc-scrollgrid': {
                            border: 'none',
                        },
                        '& .fc .fc-daygrid-day': {
                            transition: theme.transitions.duration.shorter,
                            '&:hover': {
                                bgcolor: alpha(theme.palette.primary.main, 0.02),
                            },
                        },
                        '& .fc .fc-event': {
                            borderRadius: '8px',
                            border: 'none',
                            padding: '4px 8px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            boxShadow: `0 4px 12px 0 ${alpha(theme.palette.primary.main, 0.2)}`,
                            cursor: 'pointer',
                            transition: theme.transitions.duration.shorter,
                            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                            '&:hover': {
                                transform: 'scale(1.02)',
                                boxShadow: `0 6px 16px 0 ${alpha(theme.palette.primary.main, 0.3)}`,
                            },
                        },
                        '& .fc .fc-day-today': {
                            '& .fc-daygrid-day-number': {
                                color: theme.palette.primary.main,
                                fontWeight: 800,
                                fontSize: '1rem',
                                bgcolor: alpha(theme.palette.primary.main, 0.08),
                                borderRadius: '50%',
                                width: 32,
                                height: 32,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                m: 0.5,
                            },
                            bgcolor: 'transparent',
                        },
                        '& .fc .fc-list': {
                            border: 'none',
                            bgcolor: 'transparent',
                        },
                        '& .fc .fc-list-day-cushion': {
                            bgcolor: alpha(theme.palette.primary.main, 0.05),
                            borderRadius: '8px',
                            m: 1,
                        },
                        '& .fc .fc-list-event': {
                            borderRadius: '8px',
                            overflow: 'hidden',
                            '&:hover td': {
                                bgcolor: alpha(theme.palette.primary.main, 0.05),
                            },
                        },
                    }}
                >
                    <FullCalendar
                        plugins={[dayGridPlugin, listPlugin, interactionPlugin]}
                        initialView="dayGridMonth"
                        events={events}
                        headerToolbar={{
                            left: 'prev,next today',
                            center: 'title',
                            right: 'dayGridMonth,listMonth',
                        }}
                        height="auto"
                        eventColor={theme.palette.primary.main}
                        eventTextColor={theme.palette.primary.contrastText}
                        displayEventTime={false}
                        datesSet={(arg) => {
                            if (onDateChange) {
                                onDateChange(arg.view.currentStart);
                            }
                        }}
                    />
                </Box>
            </Scrollbar>
        </Card>
    );
}
