import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
    open: boolean;
    onClose: () => void;
    asset: any;
};

export function AssetDetailsDialog({ open, onClose, asset }: Props) {
    const renderStatus = (status: string) => (
        <Label
            variant="soft"
            color={
                (status === 'Available' && 'success') ||
                (status === 'Assigned' && 'info') ||
                (status === 'Maintenance' && 'warning') ||
                (status === 'Disposed' && 'error') ||
                'default'
            }
        >
            {status || 'Unknown'}
        </Label>
    );

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle sx={{ m: 0, p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'background.neutral' }}>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>Asset Details</Typography>
                <IconButton onClick={onClose} sx={{ color: (theme) => theme.palette.grey[500], bgcolor: 'background.paper', boxShadow: (theme) => theme.customShadows?.z1 }}>
                    <Iconify icon="mingcute:close-line" />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 4, m: 2, mt: 4 }}>
                {asset ? (
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
                                    bgcolor: 'info.lighter',
                                    color: 'info.main',
                                }}
                            >
                                <Iconify icon={"solar:laptop-bold" as any} width={40} />
                            </Box>
                            <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="h5" sx={{ fontWeight: 800 }}>{asset.asset_name}</Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                    {asset.asset_tag}
                                </Typography>
                            </Box>
                            <Box sx={{ textAlign: 'right' }}>
                                {renderStatus(asset.current_status)}
                                <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.disabled', fontWeight: 700 }}>
                                    ID: {asset.name}
                                </Typography>
                            </Box>
                        </Box>

                        <Divider sx={{ borderStyle: 'dashed' }} />

                        {/* Asset Information */}
                        <Box>
                            <SectionHeader title="Asset Information" icon="solar:document-bold" />
                            <Box
                                sx={{
                                    display: 'grid',
                                    gap: 3,
                                    gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
                                }}
                            >
                                <DetailItem label="Asset Name" value={asset.asset_name} icon="solar:tag-bold" />
                                <DetailItem label="Asset Tag" value={asset.asset_tag} icon="solar:hashtag-bold" />
                                <DetailItem label="Category" value={asset.category} icon="solar:folder-bold" />
                                <DetailItem label="Status" value={asset.current_status} icon="solar:flag-bold" />
                            </Box>
                        </Box>

                        {/* Purchase Details */}
                        <Box sx={{ p: 3, bgcolor: 'background.neutral', borderRadius: 2 }}>
                            <SectionHeader title="Purchase Details" icon="solar:wallet-bold" noMargin />
                            <Box sx={{ mt: 3, display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
                                <DetailItem
                                    label="Purchase Date"
                                    value={asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString() : '-'}
                                    icon="solar:calendar-bold"
                                />
                                <DetailItem
                                    label="Purchase Cost"
                                    value={asset.purchase_cost ? `₹${asset.purchase_cost.toLocaleString()}` : '-'}
                                    icon="solar:dollar-bold"
                                />
                            </Box>
                        </Box>

                        {/* Description */}
                        {asset.description && (
                            <Box>
                                <SectionHeader title="Description" icon="solar:notes-bold" />
                                <Box sx={{ p: 3, bgcolor: 'background.neutral', borderRadius: 2 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                        {asset.description}
                                    </Typography>
                                </Box>
                            </Box>
                        )}
                    </Box>
                ) : (
                    <Box sx={{ py: 10, textAlign: 'center' }}>
                        <Iconify icon={"solar:ghost-bold" as any} width={64} sx={{ color: 'text.disabled', mb: 2 }} />
                        <Typography variant="h6" sx={{ color: 'text.secondary' }}>No Asset Found</Typography>
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
