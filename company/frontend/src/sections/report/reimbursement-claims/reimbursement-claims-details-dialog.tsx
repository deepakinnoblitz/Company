import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
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
    claim: any;
};

export function ReimbursementClaimDetailsDialog({ open, onClose, claim }: Props) {
    if (!claim) return null;

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
                <Iconify icon={"solar:wallet-money-bold-duotone" as any} width={32} />
            </Box>

            <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h6">{claim.employee_name}</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {claim.claim_type} • {new Date(claim.date_of_expense).toLocaleDateString()}
                </Typography>
            </Box>

            <Stack spacing={1} alignItems="flex-end">
                <Typography variant="h5" sx={{ color: 'primary.main', fontWeight: 700 }}>
                    ₹{claim.amount?.toLocaleString() || 0}
                </Typography>
                <Label variant="soft" color={claim.paid === 1 ? 'success' : 'warning'}>
                    {claim.paid === 1 ? 'Paid' : 'Pending'}
                </Label>
            </Stack>
        </Box>
    );

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Claim Details
                <IconButton onClick={onClose}>
                    <Iconify icon={"mingcute:close-line" as any} />
                </IconButton>
            </DialogTitle>

            <Scrollbar sx={{ maxHeight: '80vh' }}>
                <DialogContent sx={{ p: 0 }}>
                    {renderHeader}

                    <Box sx={{ p: 3 }}>
                        <Stack spacing={3}>
                            {/* Claim Information */}
                            <Box>
                                <SectionHeader title="Claim Information" icon="solar:document-bold" />
                                <Box
                                    sx={{
                                        display: 'grid',
                                        gap: 3,
                                        gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
                                    }}
                                >
                                    <DetailItem label="Claim Type" value={claim.claim_type} icon="solar:tag-bold" />
                                    <DetailItem label="Date of Expense" value={new Date(claim.date_of_expense).toLocaleDateString()} icon="solar:calendar-bold" />
                                    <DetailItem label="Amount" value={`₹${claim.amount?.toLocaleString() || 0}`} icon="solar:wad-of-money-bold" />
                                    <DetailItem label="Status" value={claim.paid === 1 ? 'Paid' : 'Pending'} icon="solar:info-circle-bold" />
                                </Box>
                            </Box>

                            {/* Settlement Details */}
                            {(claim.paid === 1 || claim.approved_by || claim.paid_by) && (
                                <Box>
                                    <SectionHeader title="Settlement Details" icon="solar:checklist-bold" />
                                    <Box
                                        sx={{
                                            display: 'grid',
                                            gap: 3,
                                            gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
                                        }}
                                    >
                                        <DetailItem label="Approved By" value={claim.approved_by || '-'} icon="solar:user-bold" />
                                        <DetailItem label="Paid By" value={claim.paid_by || '-'} icon="solar:user-bold" />
                                        <DetailItem label="Paid Date" value={claim.paid_date ? new Date(claim.paid_date).toLocaleDateString() : '-'} icon="solar:calendar-bold" />
                                        <DetailItem label="Payment Reference" value={claim.payment_reference || '-'} icon="solar:bill-bold" />
                                    </Box>
                                </Box>
                            )}

                            {/* Claim Details / Notes */}
                            {claim.claim_details && (
                                <Box>
                                    <SectionHeader title="Details & Notes" icon="solar:notes-bold" />
                                    <Box sx={{ p: 3, bgcolor: 'background.neutral', borderRadius: 2 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 500, whiteSpace: 'pre-wrap' }}>
                                            {claim.claim_details}
                                        </Typography>
                                    </Box>
                                </Box>
                            )}

                            {/* Attachments */}
                            {(claim.receipt || claim.payment_proof) && (
                                <Box>
                                    <SectionHeader
                                        title="Attachments"
                                        icon="solar:link-bold"
                                        action={
                                            <Stack direction="row" spacing={1}>
                                                {claim.receipt && (
                                                    <Button
                                                        variant="text"
                                                        size="small"
                                                        color="primary"
                                                        startIcon={<Iconify icon={"solar:paperclip-bold" as any} />}
                                                        href={claim.receipt}
                                                        target="_blank"
                                                        sx={{ fontSize: '0.75rem', fontWeight: 700 }}
                                                    >
                                                        Expense Receipt
                                                    </Button>
                                                )}
                                                {claim.payment_proof && (
                                                    <Button
                                                        variant="text"
                                                        size="small"
                                                        color="success"
                                                        startIcon={<Iconify icon={"solar:check-read-bold" as any} />}
                                                        href={claim.payment_proof}
                                                        target="_blank"
                                                        sx={{ fontSize: '0.75rem', fontWeight: 700 }}
                                                    >
                                                        Payment Proof
                                                    </Button>
                                                )}
                                            </Stack>
                                        }
                                    />
                                </Box>
                            )}

                            {/* Metadata */}
                            <Box sx={{ p: 3, bgcolor: 'background.neutral', borderRadius: 2 }}>
                                <SectionHeader title="Record Information" icon="solar:info-circle-bold" noMargin />
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
                                        <Typography variant="body2">{new Date(claim.creation).toLocaleString()}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Last Modified</Typography>
                                        <Typography variant="body2">{new Date(claim.modified).toLocaleString()}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Record ID</Typography>
                                        <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 600 }}>{claim.name}</Typography>
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
