import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

// ----------------------------------------------------------------------

type Props = {
    open: boolean;
    onClose: () => void;
    renewal: any;
};

export function RenewalDetailsDialog({ open, onClose, renewal }: Props) {
    if (!renewal) return null;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Active':
                return 'success';
            case 'Expired':
                return 'error';
            case 'Pending':
                return 'warning';
            default:
                return 'default';
        }
    };

    const renderHeader = (
        <Box sx={{ p: 3, display: 'flex', alignItems: 'center', bgcolor: 'background.neutral' }}>
            <Box
                sx={{
                    width: 64,
                    height: 64,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'primary.lighter',
                    color: 'primary.main',
                    mr: 3,
                }}
            >
                <Iconify icon={"solar:restart-bold-duotone" as any} width={32} />
            </Box>

            <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h6">{renewal.item_name}</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {renewal.category} • {renewal.vendor || 'Unknown Vendor'}
                </Typography>
            </Box>

            <Stack spacing={1} alignItems="flex-end">
                <Typography variant="h5" sx={{ color: 'primary.main', fontWeight: 700 }}>
                    ₹{renewal.amount?.toLocaleString() || 0}
                </Typography>
                <Label variant="soft" color={getStatusColor(renewal.status)}>
                    {renewal.status}
                </Label>
            </Stack>
        </Box>
    );

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Renewal Details
                <IconButton onClick={onClose}>
                    <Iconify icon={"mingcute:close-line" as any} />
                </IconButton>
            </DialogTitle>

            <Scrollbar sx={{ maxHeight: '80vh' }}>
                <DialogContent sx={{ p: 0 }}>
                    {renderHeader}

                    <Box sx={{ p: 3 }}>
                        <Stack spacing={3}>
                            {/* Basic Information */}
                            <Box>
                                <SectionHeader title="Renewal Information" icon="solar:info-circle-bold" />
                                <Box
                                    sx={{
                                        display: 'grid',
                                        gap: 3,
                                        gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
                                    }}
                                >
                                    <DetailItem label="Item Name" value={renewal.item_name} icon="solar:tag-bold" />
                                    <DetailItem label="Category" value={renewal.category} icon="solar:checklist-bold" />
                                    <DetailItem label="Vendor / Provider" value={renewal.vendor || '-'} icon="solar:shop-bold" />
                                    <DetailItem label="Amount" value={`₹${renewal.amount?.toLocaleString() || 0}`} icon="solar:wad-of-money-bold" />
                                </Box>
                            </Box>

                            {/* Timing Details */}
                            <Box>
                                <SectionHeader title="Dates & Periods" icon="solar:calendar-bold" />
                                <Box
                                    sx={{
                                        display: 'grid',
                                        gap: 3,
                                        gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
                                    }}
                                >
                                    <DetailItem label="Purchase Date" value={renewal.purchase_date ? new Date(renewal.purchase_date).toLocaleDateString() : '-'} icon="solar:calendar-add-bold" />
                                    <DetailItem label="Renewal Date" value={renewal.renewal_date ? new Date(renewal.renewal_date).toLocaleDateString() : '-'} icon="solar:calendar-mark-bold" />
                                    <DetailItem label="Renewal Period" value={renewal.renewal_period || '-'} icon="solar:clock-circle-bold" />
                                    <DetailItem label="Status" value={renewal.status || '-'} icon="solar:info-circle-bold" />
                                </Box>
                            </Box>

                            {/* Remarks */}
                            {renewal.remarks && (
                                <Box>
                                    <SectionHeader title="Remarks" icon="solar:notes-bold" />
                                    <Box sx={{ p: 3, bgcolor: 'background.neutral', borderRadius: 2 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 500, whiteSpace: 'pre-wrap' }}>
                                            {renewal.remarks}
                                        </Typography>
                                    </Box>
                                </Box>
                            )}

                            {/* Metadata */}
                            <Box sx={{ p: 3, bgcolor: 'background.neutral', borderRadius: 2 }}>
                                <SectionHeader title="Record Information" icon="solar:document-bold" noMargin />
                                <Box
                                    sx={{
                                        display: 'grid',
                                        gap: 2,
                                        gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
                                        mt: 2
                                    }}
                                >
                                    <Box>
                                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Created On</Typography>
                                        <Typography variant="body2">{new Date(renewal.creation).toLocaleString()}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Last Modified</Typography>
                                        <Typography variant="body2">{new Date(renewal.modified).toLocaleString()}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Record ID</Typography>
                                        <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 600 }}>{renewal.name}</Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </Stack>
                    </Box>
                </DialogContent>
            </Scrollbar>
        </Dialog>
    );
}

// ----------------------------------------------------------------------

function SectionHeader({ title, icon, action, noMargin = false }: { title: string; icon: string; action?: React.ReactNode; noMargin?: boolean }) {
    return (
        <>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: noMargin ? 0 : 2, gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Iconify icon={icon as any} width={20} sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="subtitle2" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
                        {title}
                    </Typography>
                </Box>

                {action && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Divider orientation="vertical" flexItem sx={{ height: 16, my: 'auto', borderStyle: 'dashed' }} />
                        {action}
                    </Box>
                )}
            </Box>
            {!noMargin && <Divider sx={{ mb: 3 }} />}
        </>
    );
}

function DetailItem({ label, value, icon }: { label: string; value: string; icon: string }) {
    return (
        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
            <Box
                sx={{
                    p: 1,
                    mr: 2,
                    borderRadius: 1,
                    bgcolor: 'background.neutral',
                    color: 'text.secondary',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <Iconify icon={icon as any} width={20} />
            </Box>
            <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                    {label}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {value || '-'}
                </Typography>
            </Box>
        </Box>
    );
}
