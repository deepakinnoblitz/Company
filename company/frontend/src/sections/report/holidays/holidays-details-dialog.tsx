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
    holidayList: any;
};

export function HolidayDetailsDialog({ open, onClose, holidayList }: Props) {
    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle sx={{ m: 0, p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'background.neutral' }}>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>Holiday List Details</Typography>
                <IconButton onClick={onClose} sx={{ color: (theme) => theme.palette.grey[500], bgcolor: 'background.paper', boxShadow: (theme) => theme.customShadows?.z1 }}>
                    <Iconify icon="mingcute:close-line" />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 4, m: 2, mt: 4 }}>
                {holidayList ? (
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
                                    bgcolor: 'error.lighter',
                                    color: 'error.main',
                                }}
                            >
                                <Iconify icon={"solar:calendar-mark-bold" as any} width={40} />
                            </Box>
                            <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="h5" sx={{ fontWeight: 800 }}>{holidayList.holiday_list_name}</Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                    {holidayList.year} - {holidayList.month || 'All Months'}
                                </Typography>
                            </Box>
                            <Box sx={{ textAlign: 'right' }}>
                                <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main' }}>
                                    {holidayList.working_days || 0}
                                </Typography>
                                <Typography variant="caption" sx={{ display: 'block', color: 'text.disabled', fontWeight: 700 }}>
                                    Working Days
                                </Typography>
                            </Box>
                        </Box>

                        <Divider sx={{ borderStyle: 'dashed' }} />

                        {/* Holiday List Information */}
                        <Box>
                            <SectionHeader title="Holiday List Information" icon="solar:document-bold" />
                            <Box
                                sx={{
                                    display: 'grid',
                                    gap: 3,
                                    gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
                                }}
                            >
                                <DetailItem label="List Name" value={holidayList.holiday_list_name} icon="solar:list-bold" />
                                <DetailItem label="Year" value={holidayList.year?.toString()} icon="solar:calendar-bold" />
                                <DetailItem label="Month" value={holidayList.month || 'All Months'} icon="solar:calendar-minimalistic-bold" />
                                <DetailItem label="Working Days" value={`${holidayList.working_days || 0} days`} icon="solar:clock-circle-bold" />
                            </Box>
                        </Box>

                        {/* Holidays */}
                        {holidayList.holidays && holidayList.holidays.length > 0 && (
                            <Box>
                                <SectionHeader title="Holidays" icon="solar:calendar-mark-bold" />
                                <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
                                    <Box sx={{ overflowX: 'auto' }}>
                                        <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <Box component="thead" sx={{ bgcolor: 'background.neutral' }}>
                                                <Box component="tr">
                                                    <Box component="th" sx={{ p: 2, textAlign: 'left', fontWeight: 700, borderBottom: '1px solid', borderColor: 'divider' }}>
                                                        Date
                                                    </Box>
                                                    <Box component="th" sx={{ p: 2, textAlign: 'left', fontWeight: 700, borderBottom: '1px solid', borderColor: 'divider' }}>
                                                        Description
                                                    </Box>
                                                    <Box component="th" sx={{ p: 2, textAlign: 'center', fontWeight: 700, borderBottom: '1px solid', borderColor: 'divider' }}>
                                                        Working Day
                                                    </Box>
                                                </Box>
                                            </Box>
                                            <Box component="tbody">
                                                {holidayList.holidays.map((holiday: any, index: number) => (
                                                    <Box component="tr" key={index} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                                                        <Box component="td" sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                                                            <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                                                {new Date(holiday.holiday_date).toLocaleDateString('en-US', {
                                                                    weekday: 'short',
                                                                    year: 'numeric',
                                                                    month: 'short',
                                                                    day: 'numeric'
                                                                })}
                                                            </Typography>
                                                        </Box>
                                                        <Box component="td" sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                                {holiday.description}
                                                            </Typography>
                                                        </Box>
                                                        <Box component="td" sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
                                                            {holiday.is_working_day ? (
                                                                <Iconify icon={"solar:check-circle-bold" as any} width={24} sx={{ color: 'success.main' }} />
                                                            ) : (
                                                                <Typography variant="body2" sx={{ color: 'error.main', fontWeight: 700, fontSize: '1.2rem' }}>✗</Typography>
                                                            )}
                                                        </Box>
                                                    </Box>
                                                ))}
                                            </Box>
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>
                        )}

                        {/* Metadata */}
                        <Box sx={{ p: 3, bgcolor: 'background.neutral', borderRadius: 2 }}>
                            <SectionHeader title="Record Information" icon="solar:info-circle-bold" noMargin />
                            <Box sx={{ mt: 3, display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
                                <DetailItem
                                    label="Created On"
                                    value={holidayList.creation ? new Date(holidayList.creation).toLocaleString() : '-'}
                                    icon="solar:calendar-bold"
                                />
                                <DetailItem
                                    label="Last Modified"
                                    value={holidayList.modified ? new Date(holidayList.modified).toLocaleString() : '-'}
                                    icon="solar:calendar-bold"
                                />
                                <DetailItem label="ID" value={holidayList.name} icon="solar:hashtag-bold" />
                            </Box>
                        </Box>
                    </Box>
                ) : (
                    <Box sx={{ py: 10, textAlign: 'center' }}>
                        <Iconify icon={"solar:ghost-bold" as any} width={64} sx={{ color: 'text.disabled', mb: 2 }} />
                        <Typography variant="h6" sx={{ color: 'text.secondary' }}>No Holiday List Found</Typography>
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
