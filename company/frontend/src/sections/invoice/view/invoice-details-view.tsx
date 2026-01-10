import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import { alpha } from '@mui/material/styles';
import TableRow from '@mui/material/TableRow';
import Snackbar from '@mui/material/Snackbar';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import AlertTitle from '@mui/material/AlertTitle';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { useRouter } from 'src/routes/hooks';

import { fCurrency } from 'src/utils/format-number';
import { handleDirectPrint } from 'src/utils/print';

import { DashboardContent } from 'src/layouts/dashboard';
import { getInvoice, deleteInvoice, getInvoicePrintUrl } from 'src/api/invoice';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/confirm-dialog';

// ----------------------------------------------------------------------

export function InvoiceDetailsView() {
    const { id } = useParams();
    const router = useRouter();
    const location = useLocation() as any;

    const [invoice, setInvoice] = useState<any>(null);
    const [fetching, setFetching] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [showConvertedMessage, setShowConvertedMessage] = useState(false);

    useEffect(() => {
        if (id) {
            getInvoice(id)
                .then(setInvoice)
                .finally(() => setFetching(false));
        }
    }, [id]);

    useEffect(() => {
        if (location.state?.converted) {
            setShowConvertedMessage(true);
            // Clear navigation state to prevent re-showing on refresh
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    if (fetching) {
        return (
            <DashboardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <CircularProgress />
            </DashboardContent>
        );
    }

    if (!invoice) {
        return (
            <DashboardContent>
                <Typography variant="h4">Invoice not found</Typography>
                <Button onClick={() => router.push('/invoices')} sx={{ mt: 3 }}>
                    Go back to list
                </Button>
            </DashboardContent>
        );
    }

    const {
        customer_id,
        invoice_date,
        billing_address,
        description,
        terms_and_conditions,
        attachments,
        overall_discount_type,
        overall_discount,
        total_amount,
        grand_total,
        received_amount,
        balance_amount,
        table_qecz = [],
    } = invoice;

    let parsedAttachments: { name: string; url: string }[] = [];
    if (attachments) {
        try {
            const parsed = JSON.parse(attachments);
            if (Array.isArray(parsed)) {
                parsedAttachments = parsed;
            } else {
                parsedAttachments = [{ name: attachments.split('/').pop() || 'Attachment', url: attachments }];
            }
        } catch {
            parsedAttachments = [{ name: attachments.split('/').pop() || 'Attachment', url: attachments }];
        }
    }

    const totalTax = table_qecz.reduce((sum: number, item: any) => sum + (item.tax_amount || 0), 0);
    const subTotal = total_amount + totalTax;
    const discountAmount = overall_discount_type === 'Flat' ? overall_discount : (subTotal * overall_discount) / 100;

    const handlePrint = () => {
        if (id) {
            handleDirectPrint(getInvoicePrintUrl(id));
        }
    };

    const handleDelete = async () => {
        if (!id) return;
        try {
            setDeleting(true);
            await deleteInvoice(id);
            router.push('/invoices');
        } catch (error) {
            console.error('Failed to delete invoice:', error);
        } finally {
            setDeleting(false);
            setConfirmDeleteOpen(false);
        }
    };

    return (
        <DashboardContent>
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5} className="no-print">
                <Typography variant="h4">Invoice: {id}</Typography>
                <Stack direction="row" spacing={2}>
                    <Button
                        variant="outlined"
                        color="inherit"
                        onClick={() => router.push('/invoices')}
                        startIcon={<Iconify icon={"solar:arrow-left-bold" as any} />}
                    >
                        Back to List
                    </Button>
                    <Button
                        variant="outlined"
                        color="primary"
                        onClick={handlePrint}
                        startIcon={<Iconify icon={"solar:printer-bold" as any} />}
                    >
                        Print
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={() => setConfirmDeleteOpen(true)}
                        startIcon={<Iconify icon={"solar:trash-bin-trash-bold" as any} />}
                    >
                        Delete
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => router.push(`/invoices/${encodeURIComponent(id || '')}/edit`)}
                        startIcon={<Iconify icon={"solar:pen-bold" as any} />}
                    >
                        Edit Invoice
                    </Button>
                </Stack>
            </Stack>

            <Card sx={{ p: 4, borderRadius: 2 }}>
                <Stack spacing={4}>
                    {/* Header Info Sections */}
                    <Box
                        sx={{
                            display: 'grid',
                            columnGap: 4,
                            rowGap: 3,
                            gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                        }}
                    >
                        {/* Customer Section */}
                        <Stack spacing={1.5}>
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ color: 'text.secondary' }}>
                                <Iconify icon={"solar:user-rounded-bold-duotone" as any} width={20} />
                                <Typography variant="subtitle2" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>Customer Details</Typography>
                            </Stack>
                            <Box sx={{ p: 2, borderRadius: 1.5, bgcolor: (theme) => alpha(theme.palette.grey[500], 0.04), border: (theme) => `1px solid ${alpha(theme.palette.grey[500], 0.08)}` }}>
                                <Typography variant="subtitle1" color="primary.main">{customer_id}</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>{billing_address || 'No address provided'}</Typography>
                            </Box>
                        </Stack>

                        {/* Document Logistics Section */}
                        <Stack spacing={1.5}>
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ color: 'text.secondary' }}>
                                <Iconify icon={"solar:calendar-bold-duotone" as any} width={20} />
                                <Typography variant="subtitle2" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>Doc Logistics</Typography>
                            </Stack>
                            <Stack spacing={2} sx={{ p: 2, borderRadius: 1.5, bgcolor: (theme) => alpha(theme.palette.grey[500], 0.04), border: (theme) => `1px solid ${alpha(theme.palette.grey[500], 0.08)}` }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Typography variant="caption" color="text.disabled">Invoice Date</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 'fontWeightSemiBold' }}>{invoice_date}</Typography>
                                </Stack>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Typography variant="caption" color="text.disabled">Reference</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 'fontWeightSemiBold' }}>#{id}</Typography>
                                </Stack>
                            </Stack>
                        </Stack>

                        {/* Summary Stats Section */}
                        <Stack spacing={1.5}>
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ color: 'text.secondary' }}>
                                <Iconify icon={"solar:wad-of-money-bold-duotone" as any} width={20} />
                                <Typography variant="subtitle2" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>Financial Status</Typography>
                            </Stack>
                            <Stack spacing={2} sx={{ p: 2, borderRadius: 1.5, bgcolor: (theme) => alpha((balance_amount || 0) > 0 ? theme.palette.error.main : theme.palette.success.main, 0.04), border: (theme) => `1px solid ${alpha((balance_amount || 0) > 0 ? theme.palette.error.main : theme.palette.success.main, 0.12)}` }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Typography variant="caption" color="text.secondary">Grand Total</Typography>
                                    <Typography variant="subtitle1" color="primary.main">{fCurrency(grand_total)}</Typography>
                                </Stack>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Typography variant="caption" color="text.secondary">Balance Due</Typography>
                                    <Typography variant="h6" color={(balance_amount || 0) > 0 ? "error.main" : "success.main"}>{fCurrency(balance_amount)}</Typography>
                                </Stack>
                            </Stack>
                        </Stack>
                    </Box>

                    {/* Table Section */}
                    <Box>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2, color: 'text.secondary' }}>
                            <Iconify icon={"solar:list-bold-duotone" as any} width={20} />
                            <Typography variant="subtitle2" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>Invoice Items</Typography>
                        </Stack>
                        <TableContainer sx={{
                            overflow: 'unset',
                            border: (theme) => `1px solid ${alpha(theme.palette.grey[500], 0.12)}`,
                            borderRadius: 1.5,
                        }}>
                            <Table sx={{ minWidth: 800 }}>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: (theme) => alpha(theme.palette.grey[500], 0.04) }}>
                                        <TableCell sx={{ fontWeight: 'fontWeightBold', py: 2 }}>Service</TableCell>
                                        <TableCell sx={{ fontWeight: 'fontWeightBold', py: 2 }}>HSN</TableCell>
                                        <TableCell sx={{ fontWeight: 'fontWeightBold', py: 2 }}>Description</TableCell>
                                        <TableCell width={60} align="center" sx={{ fontWeight: 'fontWeightBold', py: 2 }}>Qty</TableCell>
                                        <TableCell width={100} align="right" sx={{ fontWeight: 'fontWeightBold', py: 2 }}>Price</TableCell>
                                        <TableCell width={100} align="right" sx={{ fontWeight: 'fontWeightBold', py: 2 }}>Discount</TableCell>
                                        <TableCell width={100} align="right" sx={{ fontWeight: 'fontWeightBold', py: 2 }}>Tax Type</TableCell>
                                        <TableCell width={100} align="right" sx={{ fontWeight: 'fontWeightBold', py: 2 }}>Tax Amt</TableCell>
                                        <TableCell width={120} align="right" sx={{ fontWeight: 'fontWeightBold', py: 2 }}>Total</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {table_qecz.map((row: any, index: number) => (
                                        <TableRow key={index} sx={{ '&:hover': { bgcolor: (theme) => alpha(theme.palette.primary.main, 0.02) } }}>
                                            <TableCell sx={{ py: 2 }}>
                                                <Typography variant="subtitle2">{row.service}</Typography>
                                            </TableCell>
                                            <TableCell sx={{ py: 2 }}>
                                                <Typography variant="body2">{row.hsn_code || '-'}</Typography>
                                            </TableCell>
                                            <TableCell sx={{ py: 2 }}>
                                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', maxWidth: 200 }}>{row.description}</Typography>
                                            </TableCell>
                                            <TableCell align="center" sx={{ py: 2 }}>{row.quantity}</TableCell>
                                            <TableCell align="right" sx={{ py: 2 }}>{fCurrency(row.price)}</TableCell>
                                            <TableCell align="right" sx={{ py: 2 }}>
                                                {row.discount > 0 ? (
                                                    <Typography variant="caption" color="success.main">
                                                        -{row.discount_type === 'Flat' ? fCurrency(row.discount) : `${row.discount}%`}
                                                    </Typography>
                                                ) : '-'}
                                            </TableCell>
                                            <TableCell align="right" sx={{ py: 2 }}>
                                                <Typography variant="caption" color="text.secondary">{row.tax_type || '-'}</Typography>
                                            </TableCell>
                                            <TableCell align="right" sx={{ py: 2 }}>{fCurrency(row.tax_amount)}</TableCell>
                                            <TableCell align="right" sx={{ py: 2 }}>
                                                <Typography variant="subtitle2" color="primary">{fCurrency(row.sub_total)}</Typography>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>

                    {/* Footer Row */}
                    <Box
                        sx={{
                            display: 'grid',
                            columnGap: 4,
                            rowGap: 3,
                            gridTemplateColumns: { xs: 'repeat(1, 1fr)', md: 'repeat(2, 1fr)' },
                            alignItems: 'start'
                        }}
                    >
                        {/* Terms, Description & Attachments Group */}
                        <Stack spacing={3}>
                            {description && (
                                <Stack spacing={1}>
                                    <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>Scope & Description</Typography>
                                    <Typography variant="body2" sx={{
                                        p: 2,
                                        borderRadius: 1.5,
                                        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
                                        border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                                        whiteSpace: 'pre-wrap',
                                        minHeight: 80,
                                        color: 'text.secondary'
                                    }}>
                                        {description}
                                    </Typography>
                                </Stack>
                            )}

                            <Stack spacing={1}>
                                <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>Terms & Conditions</Typography>
                                <Typography variant="body2" sx={{
                                    p: 2,
                                    borderRadius: 1.5,
                                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
                                    border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                                    whiteSpace: 'pre-wrap',
                                    minHeight: 80
                                }}>
                                    {terms_and_conditions || 'No specific terms provided.'}
                                </Typography>
                            </Stack>

                            {parsedAttachments.length > 0 && (
                                <Stack spacing={1}>
                                    <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>Attachments</Typography>
                                    <Stack spacing={1}>
                                        {parsedAttachments.map((file, index) => (
                                            <Stack
                                                key={index}
                                                direction="row"
                                                alignItems="center"
                                                component="a"
                                                href={file.url}
                                                target="_blank"
                                                sx={{
                                                    px: 2,
                                                    py: 1,
                                                    borderRadius: 1.5,
                                                    textDecoration: 'none',
                                                    color: 'inherit',
                                                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
                                                    border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                                                    transition: (theme) => theme.transitions.create(['background-color', 'transform']),
                                                    '&:hover': {
                                                        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                                                        transform: 'translateY(-1px)'
                                                    },
                                                }}
                                            >
                                                <Iconify icon={"solar:link-bold" as any} width={18} sx={{ mr: 1, color: 'primary.main', flexShrink: 0 }} />
                                                <Typography variant="body2" noWrap sx={{ flexGrow: 1, fontWeight: 'fontWeightMedium' }}>{file.name || file.url.split('/').pop()}</Typography>
                                                <Iconify icon={"solar:download-bold" as any} width={16} sx={{ ml: 1, color: 'text.disabled' }} />
                                            </Stack>
                                        ))}
                                    </Stack>
                                </Stack>
                            )}
                        </Stack>

                        {/* Totals Breakdown */}
                        <Stack spacing={2} sx={{ p: 3, borderRadius: 2, bgcolor: (theme) => alpha(theme.palette.grey[500], 0.04), border: (theme) => `1px solid ${alpha(theme.palette.grey[500], 0.08)}` }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Typography variant="body2" color="text.secondary">Taxable Amount</Typography>
                                <Typography variant="subtitle2">{fCurrency(table_qecz.reduce((sum: number, row: any) => sum + (row.sub_total - row.tax_amount), 0))}</Typography>
                            </Stack>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Typography variant="body2" color="text.secondary">Total Tax</Typography>
                                <Typography variant="subtitle2" color="error.main">+{fCurrency(totalTax)}</Typography>
                            </Stack>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Typography variant="body2" color="text.secondary">Discount ({overall_discount_type === 'Flat' ? 'Flat' : `${overall_discount}%`})</Typography>
                                <Typography variant="subtitle2" color="success.main">-{fCurrency(discountAmount)}</Typography>
                            </Stack>
                            <Divider sx={{ borderStyle: 'dashed' }} />
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Typography variant="subtitle1">Grand Total</Typography>
                                <Typography variant="h6">{fCurrency(grand_total)}</Typography>
                            </Stack>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <Iconify icon={"solar:hand-money-bold-duotone" as any} width={16} sx={{ color: 'success.main' }} />
                                    <Typography variant="body2" color="text.secondary">Received Amount</Typography>
                                </Stack>
                                <Typography variant="subtitle2" color="success.main">{fCurrency(received_amount)}</Typography>
                            </Stack>
                            <Divider sx={{ borderStyle: 'dashed' }} />
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <Iconify icon={"solar:wallet-2-bold-duotone" as any} width={20} sx={{ color: (balance_amount || 0) > 0 ? 'error.main' : 'success.main' }} />
                                    <Typography variant="subtitle1" sx={{ color: (balance_amount || 0) > 0 ? 'error.main' : 'success.main' }}>Balance Due</Typography>
                                </Stack>
                                <Typography variant="h5" color={(balance_amount || 0) > 0 ? "error.main" : "success.main"}>{fCurrency(balance_amount)}</Typography>
                            </Stack>
                        </Stack>
                    </Box>
                </Stack>
            </Card >

            <Snackbar
                open={showConvertedMessage}
                autoHideDuration={5000}
                onClose={() => setShowConvertedMessage(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert
                    severity="success"
                    sx={{
                        width: '100%',
                        boxShadow: (theme) => theme.customShadows.z20
                    }}
                >
                    <AlertTitle>Success</AlertTitle>
                    Converted from estimation successfully!
                </Alert>
            </Snackbar>

            <ConfirmDialog
                open={confirmDeleteOpen}
                onClose={() => !deleting && setConfirmDeleteOpen(false)}
                title="Confirm Delete"
                content="Are you sure you want to delete this invoice?"
                action={
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleDelete}
                        disabled={deleting}
                        sx={{ borderRadius: 1.5, minWidth: 100 }}
                    >
                        {deleting ? 'Deleting...' : 'Delete'}
                    </Button>
                }
            />
        </DashboardContent >
    );
}
