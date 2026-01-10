import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
    open: boolean;
    onClose: () => void;
    timesheet: any;
};

export function TimesheetDetailsDialog({ open, onClose, timesheet }: Props) {
    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle sx={{ m: 0, p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'background.neutral' }}>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>Timesheet Details</Typography>
                <IconButton onClick={onClose} sx={{ color: (theme) => theme.palette.grey[500], bgcolor: 'background.paper', boxShadow: (theme) => theme.customShadows?.z1 }}>
                    <Iconify icon="mingcute:close-line" />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 4, m: 2, mt: 4 }}>
                {timesheet ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {/* Header Info */}
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2.5 }}>
                            <Box
                                sx={{
                                    width: 80,
                                    height: 80,
                                    borderRadius: 2,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    bgcolor: 'success.lighter',
                                    color: 'success.main',
                                }}
                            >
                                <Iconify icon={"solar:clock-circle-bold" as any} width={40} />
                            </Box>
                            <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="h5" sx={{ fontWeight: 800 }}>{timesheet.employee_name}</Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                    {timesheet.timesheet_date ? new Date(timesheet.timesheet_date).toLocaleDateString() : '-'}
                                </Typography>
                            </Box>
                            <Box sx={{ textAlign: 'right' }}>
                                <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main' }}>
                                    {timesheet.total_hours || 0} hrs
                                </Typography>
                                <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.disabled', fontWeight: 700 }}>
                                    ID: {timesheet.name}
                                </Typography>
                            </Box>
                        </Box>

                        <Divider sx={{ borderStyle: 'dashed' }} />

                        {/* Timesheet Information */}
                        <Box>
                            <SectionHeader title="Timesheet Information" icon="solar:document-bold" />
                            <Box
                                sx={{
                                    display: 'grid',
                                    gap: 3,
                                    gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
                                }}
                            >
                                <DetailItem label="Employee" value={timesheet.employee_name} icon="solar:user-bold" />
                                <DetailItem
                                    label="Date"
                                    value={timesheet.timesheet_date ? new Date(timesheet.timesheet_date).toLocaleDateString() : '-'}
                                    icon="solar:calendar-bold"
                                />
                                <DetailItem label="Total Hours" value={`${timesheet.total_hours || 0} hours`} icon="solar:clock-circle-bold" />
                            </Box>
                        </Box>

                        {/* Notes */}
                        {timesheet.notes && (
                            <Box>
                                <SectionHeader title="Notes" icon="solar:notes-bold" />
                                <Box sx={{ p: 3, bgcolor: 'background.neutral', borderRadius: 2 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 500, whiteSpace: 'pre-wrap' }}>
                                        {timesheet.notes}
                                    </Typography>
                                </Box>
                            </Box>
                        )}

                        {/* Timesheet Entries */}
                        {timesheet.timesheet_entries && timesheet.timesheet_entries.length > 0 && (
                            <Box>
                                <SectionHeader title="Timesheet Entries" icon="solar:list-bold" />
                                <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
                                    <Box sx={{ overflowX: 'auto' }}>
                                        <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <Box component="thead" sx={{ bgcolor: 'background.neutral' }}>
                                                <Box component="tr">
                                                    <Box component="th" sx={{ p: 2, textAlign: 'left', fontWeight: 700, borderBottom: '1px solid', borderColor: 'divider' }}>
                                                        Project
                                                    </Box>
                                                    <Box component="th" sx={{ p: 2, textAlign: 'left', fontWeight: 700, borderBottom: '1px solid', borderColor: 'divider' }}>
                                                        Activity Type
                                                    </Box>
                                                    <Box component="th" sx={{ p: 2, textAlign: 'left', fontWeight: 700, borderBottom: '1px solid', borderColor: 'divider' }}>
                                                        Hours
                                                    </Box>
                                                    <Box component="th" sx={{ p: 2, textAlign: 'left', fontWeight: 700, borderBottom: '1px solid', borderColor: 'divider' }}>
                                                        Description
                                                    </Box>
                                                </Box>
                                            </Box>
                                            <Box component="tbody">
                                                {timesheet.timesheet_entries.map((entry: any, index: number) => (
                                                    <Box component="tr" key={index} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                                                        <Box component="td" sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                                {entry.project}
                                                            </Typography>
                                                        </Box>
                                                        <Box component="td" sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                                                            <Typography variant="body2">
                                                                {entry.activity_type}
                                                            </Typography>
                                                        </Box>
                                                        <Box component="td" sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                                                            <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                                                {entry.hours} hrs
                                                            </Typography>
                                                        </Box>
                                                        <Box component="td" sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                                                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                                {entry.description || '-'}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                ))}
                                            </Box>
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>
                        )}
                    </Box>
                ) : (
                    <Box sx={{ py: 10, textAlign: 'center' }}>
                        <Iconify icon={"solar:ghost-bold" as any} width={64} sx={{ color: 'text.disabled', mb: 2 }} />
                        <Typography variant="h6" sx={{ color: 'text.secondary' }}>No Timesheet Found</Typography>
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

function DetailItem({ label, value, icon }: { label: string; value?: string | null; icon: string }) {
    return (
        <Box>
            <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700, textTransform: 'uppercase', mb: 0.5, display: 'block' }}>
                {label}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Iconify icon={icon as any} width={16} sx={{ color: 'text.disabled' }} />
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {value || '-'}
                </Typography>
            </Box>
        </Box>
    );
}
