import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';

import { getSalarySlipDownloadUrl } from 'src/api/salary-slips';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

// ----------------------------------------------------------------------

type Props = {
    open: boolean;
    onClose: () => void;
    slip: any;
};

export function SalarySlipDetailsDialog({ open, onClose, slip }: Props) {
    if (!slip) return null;

    const handleDownload = () => {
        const url = getSalarySlipDownloadUrl(slip.name);
        window.open(url, '_blank');
    };

    const formatDate = (date: string) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const renderHeader = (
        <Box sx={{ p: 3, textAlign: 'center', bgcolor: 'background.neutral', borderRadius: 2, mb: 3 }}>
            <Typography variant="h5" sx={{ mb: 1, fontWeight: 700, color: 'primary.main' }}>
                SALARY SLIP
            </Typography>
            <Typography variant="subtitle2" sx={{ color: 'text.secondary', textTransform: 'uppercase' }}>
                For the period: {formatDate(slip.pay_period_start)} to {formatDate(slip.pay_period_end)}
            </Typography>
        </Box>
    );

    const renderEmployeeDetails = (
        <Box sx={{ mb: 4 }}>
            <SectionHeader title="Employee Details" icon="solar:user-id-bold" />
            <Box
                sx={{
                    display: 'grid',
                    gap: 2,
                    gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
                }}
            >
                <InfoRow label="Employee ID" value={slip.employee} />
                <InfoRow label="Employee Name" value={slip.employee_name} />
                <InfoRow label="Department" value={slip.department || '-'} />
                <InfoRow label="Designation" value={slip.designation || '-'} />
                <InfoRow label="Bank Name" value={slip.bank_name || '-'} />
                <InfoRow label="Account No" value={slip.account_no || '-'} />
            </Box>
        </Box>
    );

    const renderSalaryBreakdown = (
        <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 4 }}>
                {/* Earnings */}
                <Box>
                    <SectionHeader title="Earnings" icon="solar:wad-of-money-bold" color="success.main" />
                    <Stack spacing={1.5}>
                        <AmountRow label="Basic Pay" amount={slip.basic_pay} />
                        <AmountRow label="HRA" amount={slip.hra} />
                        <AmountRow label="Conveyance" amount={slip.conveyance_allowances} />
                        <AmountRow label="Medical" amount={slip.medical_allowances} />
                        <AmountRow label="Other Allowances" amount={slip.other_allowances} />
                        <Divider sx={{ my: 1 }} />
                        <AmountRow label="Gross Earnings" amount={slip.gross_pay} isTotal />
                    </Stack>
                </Box>

                {/* Deductions */}
                <Box>
                    <SectionHeader title="Deductions" icon="solar:hand-money-bold" color="error.main" />
                    <Stack spacing={1.5}>
                        <AmountRow label="EPF" amount={slip.pf} />
                        <AmountRow label="ESI/Health Insurance" amount={slip.health_insurance} />
                        <AmountRow label="Professional Tax" amount={slip.professional_tax} />
                        <AmountRow label="Loan Recovery" amount={slip.loan_recovery} />
                        <AmountRow label="LOP" amount={slip.lop} />
                        <Divider sx={{ my: 1 }} />
                        <AmountRow label="Total Deductions" amount={slip.total_deduction} isTotal />
                    </Stack>
                </Box>
            </Box>
        </Box>
    );

    const renderNetPay = (
        <Box
            sx={{
                p: 3,
                borderRadius: 2,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}
        >
            <Box>
                <Typography variant="subtitle1" sx={{ opacity: 0.8, fontWeight: 600 }}>
                    NET SALARY PAYABLE
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.6 }}>
                    (Gross Earnings - Total Deductions)
                </Typography>
            </Box>
            <Typography variant="h3" sx={{ fontWeight: 800 }}>
                ₹{slip.net_pay?.toLocaleString() || 0}
            </Typography>
        </Box>
    );

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Salary Slip Details
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        size="small"
                        variant="contained"
                        color="primary"
                        startIcon={<Iconify icon={"solar:download-bold" as any} />}
                        onClick={handleDownload}
                    >
                        Download PDF
                    </Button>
                    <IconButton onClick={onClose}>
                        <Iconify icon={"mingcute:close-line" as any} />
                    </IconButton>
                </Box>
            </DialogTitle>

            <Scrollbar sx={{ maxHeight: '85vh' }}>
                <DialogContent sx={{ p: 4 }}>
                    {renderHeader}
                    {renderEmployeeDetails}
                    <Divider sx={{ my: 4, borderStyle: 'dashed' }} />
                    {renderSalaryBreakdown}
                    {renderNetPay}

                    <Box sx={{ mt: 4, textAlign: 'center' }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            This is a computer generated salary slip and does not require a signature.
                        </Typography>
                    </Box>
                </DialogContent>
            </Scrollbar>
        </Dialog>
    );
}

// ----------------------------------------------------------------------

function SectionHeader({ title, icon, color = 'text.secondary' }: { title: string; icon: string; color?: string }) {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Iconify icon={icon as any} width={22} sx={{ mr: 1.5, color }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {title}
            </Typography>
        </Box>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                {label}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {value}
            </Typography>
        </Box>
    );
}

function AmountRow({ label, amount, isTotal = false }: { label: string; amount: number; isTotal?: boolean }) {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant={isTotal ? 'subtitle2' : 'body2'} sx={{ color: isTotal ? 'text.primary' : 'text.secondary', fontWeight: isTotal ? 700 : 500 }}>
                {label}
            </Typography>
            <Typography variant={isTotal ? 'subtitle1' : 'body2'} sx={{ fontWeight: isTotal ? 700 : 600 }}>
                ₹{amount?.toLocaleString() || 0}
            </Typography>
        </Box>
    );
}
