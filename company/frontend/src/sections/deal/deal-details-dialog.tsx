import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';

import { getDeal } from 'src/api/deals';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
    open: boolean;
    onClose: () => void;
    dealId: string | null;
};

export function DealDetailsDialog({ open, onClose, dealId }: Props) {
    const [deal, setDeal] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && dealId) {
            setLoading(true);
            getDeal(dealId)
                .then(setDeal)
                .catch((err) => console.error('Failed to fetch deal details:', err))
                .finally(() => setLoading(false));
        } else {
            setDeal(null);
        }
    }, [open, dealId]);

    const renderStage = (stage: string) => {
        let color: 'default' | 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error' = 'default';
        if (stage === 'Qualification') color = 'info';
        if (stage === 'Needs Analysis' || stage === 'Meeting Scheduled') color = 'warning';
        if (stage === 'Proposal Sent' || stage === 'Negotiation') color = 'primary';
        if (stage === 'Closed Won') color = 'success';
        if (stage === 'Closed Lost') color = 'error';

        return (
            <Label variant="soft" color={color}>
                {stage}
            </Label>
        );
    };

    const renderType = (type: string) => {
        let color: 'default' | 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error' = 'default';
        if (type === 'New Business') color = 'success';
        if (type === 'Existing Business') color = 'info';

        return (
            <Label variant="outlined" color={color}>
                {type}
            </Label>
        );
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle sx={{ m: 0, p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'background.neutral' }}>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>Deal Profile</Typography>
                <IconButton onClick={onClose} sx={{ color: (theme) => theme.palette.grey[500], bgcolor: 'background.paper', boxShadow: (theme) => theme.customShadows?.z1 }}>
                    <Iconify icon="mingcute:close-line" />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 4, m: 2, mt: 4 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 10 }}>
                        <Iconify icon={"svg-spinners:12-dots-scale-rotate" as any} width={40} sx={{ color: 'primary.main' }} />
                    </Box>
                ) : deal ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {/* Header Info */}
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2.5 }}>
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
                                }}
                            >
                                <Iconify icon={"solar:bag-bold" as any} width={32} />
                            </Box>
                            <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="h5" sx={{ fontWeight: 800 }}>{deal.deal_title}</Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>{deal.account}</Typography>
                            </Box>
                            <Box sx={{ textAlign: 'right' }}>
                                {renderStage(deal.stage)}
                                <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.disabled', fontWeight: 700 }}>
                                    ID: {deal.name}
                                </Typography>
                            </Box>
                        </Box>

                        <Divider sx={{ borderStyle: 'dashed' }} />

                        {/* General Information */}
                        <Box>
                            <SectionHeader title="Deal Overview" icon="solar:info-circle-bold" />
                            <Box
                                sx={{
                                    display: 'grid',
                                    gap: 3,
                                    gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                                }}
                            >
                                <DetailItem label="Value" value={deal.value ? `₹${deal.value.toLocaleString()}` : '-'} icon="solar:wad-of-money-bold" color="success.main" />
                                <DetailItem label="Expected Close" value={deal.expected_close_date} icon="solar:calendar-bold" />
                                <DetailItem label="Probability" value={deal.probability ? `${deal.probability}%` : '-'} icon="solar:chart-square-bold" />
                                <Box>
                                    <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700, textTransform: 'uppercase', mb: 1.5, display: 'block' }}>
                                        Deal Type
                                    </Typography>
                                    {renderType(deal.type || 'New Business')}
                                </Box>
                                <DetailItem label="Contact" value={deal.contact} icon="solar:user-bold" />
                                <DetailItem label="Source Lead" value={deal.source_lead} icon="solar:tag-horizontal-bold" />
                            </Box>
                        </Box>

                        {/* Additional & Tracking */}
                        <Box>
                            <SectionHeader title="Tracking & Next Steps" icon="solar:walking-bold" />
                            <Box
                                sx={{
                                    display: 'grid',
                                    gap: 3,
                                    gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                                }}
                            >
                                <DetailItem label="Next Step" value={deal.next_step} icon="solar:flag-bold" color="info.main" />
                                <DetailItem label="Owner" value={deal.deal_owner || deal.owner} icon="solar:user-rounded-bold" color="secondary.main" />
                                <DetailItem label="Creation" value={new Date(deal.creation).toLocaleString()} icon="solar:calendar-date-bold" />
                            </Box>
                        </Box>

                        {/* Notes */}
                        <Box sx={{ p: 3, bgcolor: 'background.neutral', borderRadius: 2 }}>
                            <SectionHeader title="Notes & Remarks" icon="solar:document-text-bold" noMargin />
                            <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
                                <Box>
                                    <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700, textTransform: 'uppercase', mb: 1, display: 'block' }}>
                                        Deal Notes
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 600, fontStyle: deal.notes ? 'normal' : 'italic' }}>
                                        {deal.notes || 'No notes added'}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                ) : (
                    <Box sx={{ py: 10, textAlign: 'center' }}>
                        <Iconify icon={"solar:ghost-bold" as any} width={64} sx={{ color: 'text.disabled', mb: 2 }} />
                        <Typography variant="h6" sx={{ color: 'text.secondary' }}>No Deal Found</Typography>
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

function DetailItem({ label, value, icon, color = 'text.primary' }: { label: string; value?: string | null | number; icon: string; color?: string }) {
    return (
        <Box>
            <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700, textTransform: 'uppercase', mb: 0.5, display: 'block' }}>
                {label}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Iconify icon={icon as any} width={16} sx={{ color: 'text.disabled' }} />
                <Typography variant="body2" sx={{ fontWeight: 700, color }}>
                    {value || '-'}
                </Typography>
            </Box>
        </Box>
    );
}
