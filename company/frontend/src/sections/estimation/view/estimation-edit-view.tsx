import dayjs from 'dayjs';
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import { alpha } from '@mui/material/styles';
import MenuItem from '@mui/material/MenuItem';
import Snackbar from '@mui/material/Snackbar';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import AlertTitle from '@mui/material/AlertTitle';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import ToggleButton from '@mui/material/ToggleButton';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import TableContainer from '@mui/material/TableContainer';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import CircularProgress from '@mui/material/CircularProgress';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';

import { useRouter } from 'src/routes/hooks';

import { fCurrency } from 'src/utils/format-number';
import { handleDirectPrint } from 'src/utils/print';

import { createItem } from 'src/api/invoice';
import { uploadFile } from 'src/api/data-import';
import { getDoc, getDoctypeList } from 'src/api/leads';
import { DashboardContent } from 'src/layouts/dashboard';
import { getEstimation, updateEstimation, getEstimationPrintUrl, convertEstimationToInvoice } from 'src/api/estimation';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/confirm-dialog';

// ----------------------------------------------------------------------

const filter = createFilterOptions<any>();

type ItemRow = {
    name?: string;
    service: string;
    hsn_code: string;
    description: string;
    quantity: number;
    price: number;
    discount_type: 'Flat' | 'Percentage';
    discount: number;
    tax_type: string;
    tax_percent: number;
    tax_amount: number;
    cgst: number;
    sgst: number;
    igst: number;
    sub_total: number;
};

export function EstimationEditView() {
    const { id } = useParams();
    const router = useRouter();

    const [customerOptions, setCustomerOptions] = useState<any[]>([]);
    const [itemOptions, setItemOptions] = useState<any[]>([]);
    const [taxOptions, setTaxOptions] = useState<any[]>([]);

    const [clientName, setClientName] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [billingName, setBillingName] = useState('');
    const [estimateDate, setEstimateDate] = useState('');
    const [billingAddress, setBillingAddress] = useState('');
    const [description, setDescription] = useState('');
    const [remarks, setRemarks] = useState('');
    const [attachments, setAttachments] = useState<{ name: string; url: string }[]>([]);
    const [uploading, setUploading] = useState(false);

    const [items, setItems] = useState<ItemRow[]>([]);

    const [discountType, setDiscountType] = useState<'Flat' | 'Percentage'>('Flat');
    const [discountValue, setDiscountValue] = useState(0);

    const [fetching, setFetching] = useState(true);
    const [loading, setLoading] = useState(false);
    const [converting, setConverting] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success',
    });

    const [itemDialogOpen, setItemDialogOpen] = useState(false);
    const [newItem, setNewItem] = useState({ item_name: '', item_code: '', rate: 0 });
    const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null);
    const [creatingItem, setCreatingItem] = useState(false);

    useEffect(() => {
        getDoctypeList('Customer', ['name', 'customer_name', 'company_name', 'billing_address']).then(setCustomerOptions);
        getDoctypeList('Item', ['name', 'item_name', 'rate', 'item_code']).then(setItemOptions);
        getDoctypeList('Tax Types', ['name', 'tax_name', 'tax_percentage', 'tax_type']).then(setTaxOptions);

        if (id) {
            getEstimation(id)
                .then((data) => {
                    setClientName(data.client_name || '');
                    setCustomerName(data.customer_name || '');
                    setBillingName(data.billing_name || '');
                    setEstimateDate(data.estimate_date || '');
                    setBillingAddress(data.billing_address || '');
                    setDescription(data.description || '');
                    setRemarks(data.terms_and_conditions || '');
                    if (data.attachments) {
                        try {
                            const parsed = JSON.parse(data.attachments);
                            if (Array.isArray(parsed)) {
                                setAttachments(parsed);
                            } else {
                                // Fallback if it's JSON but not an array
                                setAttachments([{ name: data.attachments.split('/').pop() || 'Attachment', url: data.attachments }]);
                            }
                        } catch {
                            // If parsing fails, treat it as a single URL string (standard Frappe Attach field)
                            setAttachments([{ name: data.attachments.split('/').pop() || 'Attachment', url: data.attachments }]);
                        }
                    } else {
                        setAttachments([]);
                    }
                    setDiscountType(data.overall_discount_type || 'Flat');
                    setDiscountValue(data.overall_discount || 0);
                    setItems(data.table_qecz || []);
                })
                .finally(() => setFetching(false));
        }
    }, [id]);

    const handleCustomerChange = async (name: string) => {
        setClientName(name);
        if (name) {
            try {
                const customer = await getDoc('Customer', name);
                setCustomerName(customer.customer_name || '');
                setBillingName(customer.company_name || '');
                setBillingAddress(customer.billing_address || '');
            } catch (error) {
                console.error('Failed to fetch customer details:', error);
            }
        } else {
            setCustomerName('');
            setBillingName('');
            setBillingAddress('');
        }
    };

    const handleAddRow = () => {
        setItems([
            ...items,
            {
                service: '',
                hsn_code: '',
                description: '',
                quantity: 1,
                price: 0,
                discount_type: 'Percentage',
                discount: 0,
                tax_type: '',
                tax_percent: 0,
                tax_amount: 0,
                cgst: 0,
                sgst: 0,
                igst: 0,
                sub_total: 0,
            },
        ]);
    };

    const handleRemoveRow = (index: number) => {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
    };

    const handleItemChange = async (index: number, field: keyof ItemRow, value: any) => {
        const newItems = [...items];
        const item = { ...newItems[index], [field]: value };

        if (field === 'service') {
            const selectedItem = itemOptions.find((opt) => opt.name === value);
            if (selectedItem) {
                item.price = selectedItem.rate || 0;
                item.description = selectedItem.item_name || '';
                item.hsn_code = selectedItem.item_code || '';
            } else {
                item.price = 0;
                item.description = '';
                item.hsn_code = '';
                item.quantity = 1;
                item.discount = 0;
                item.tax_type = '';
                item.tax_percent = 0;
            }
        }

        let taxCategory = '';
        if (field === 'tax_type') {
            const selectedTax = taxOptions.find((opt) => opt.name === value);
            if (selectedTax) {
                item.tax_percent = selectedTax.tax_percentage || 0;
                taxCategory = selectedTax.tax_type || '';
            } else {
                item.tax_percent = 0;
                taxCategory = '';
            }
        } else if (item.tax_type) {
            const selectedTax = taxOptions.find((opt) => opt.name === item.tax_type);
            taxCategory = selectedTax?.tax_type || '';
        }

        // Calculations
        const amount = item.quantity * item.price;
        const discountAmount = item.discount_type === 'Flat' ? item.discount : (amount * item.discount) / 100;
        const taxableAmount = Math.max(0, amount - discountAmount);

        item.tax_amount = (taxableAmount * item.tax_percent) / 100;
        item.sub_total = taxableAmount + item.tax_amount;

        // GST Split
        if (taxCategory === 'GST') {
            item.cgst = item.tax_amount / 2;
            item.sgst = item.tax_amount / 2;
            item.igst = 0;
        } else if (taxCategory === 'IGST') {
            item.cgst = 0;
            item.sgst = 0;
            item.igst = item.tax_amount;
        } else {
            item.cgst = 0;
            item.sgst = 0;
            item.igst = 0;
        }

        newItems[index] = item;
        setItems(newItems);
    };

    const handleCreateItem = async () => {
        if (!newItem.item_name || !newItem.item_code) {
            setSnackbar({ open: true, message: 'Please fill in all required fields', severity: 'error' });
            return;
        }

        try {
            setCreatingItem(true);
            const createdItem = await createItem(newItem);
            setItemOptions((prev) => [...prev, createdItem]);

            if (activeRowIndex !== null) {
                handleItemChange(activeRowIndex, 'service', createdItem.name);
            }

            setItemDialogOpen(false);
            setNewItem({ item_name: '', item_code: '', rate: 0 });
            setSnackbar({ open: true, message: 'Item created successfully', severity: 'success' });
        } catch (error: any) {
            setSnackbar({ open: true, message: error.message || 'Failed to create item', severity: 'error' });
        } finally {
            setCreatingItem(false);
        }
    };

    const itemsTotalTaxable = items.reduce((sum, item) => {
        const amount = item.quantity * item.price;
        const itemDiscount = item.discount_type === 'Flat' ? item.discount : (amount * item.discount) / 100;
        return sum + (amount - itemDiscount);
    }, 0);
    const totalTax = items.reduce((sum, item) => sum + item.tax_amount, 0);
    const subTotal = itemsTotalTaxable + totalTax;

    const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);

    const discountAmount = discountType === 'Flat' ? discountValue : (subTotal * discountValue) / 100;
    const grandTotal = Math.max(0, subTotal - discountAmount);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            setUploading(true);
            const uploaded = await uploadFile(file, 'Estimation', id, 'attachments');
            setAttachments([{ name: file.name, url: uploaded.file_url }]);
            setSnackbar({ open: true, message: 'File uploaded successfully', severity: 'success' });
        } catch (error: any) {
            setSnackbar({ open: true, message: error.message || 'Upload failed', severity: 'error' });
        } finally {
            setUploading(false);
        }
    };

    const handleRemoveAttachment = (index: number) => {
        setAttachments((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        if (!id || !clientName) return;

        const validItems = items.filter((item) => item.service !== '');
        if (validItems.length === 0) {
            setSnackbar({ open: true, message: 'Please add at least one item', severity: 'error' });
            return;
        }

        try {
            setLoading(true);
            const estimationData = {
                client_name: clientName,
                customer_name: customerName,
                billing_name: billingName,
                estimate_date: estimateDate,
                billing_address: billingAddress,
                description,
                terms_and_conditions: remarks,
                attachments: attachments.length > 0 ? attachments[0].url : '',
                overall_discount_type: discountType,
                overall_discount: discountValue,
                total_qty: totalQty,
                total_amount: itemsTotalTaxable,
                grand_total: grandTotal,
                table_qecz: validItems.map((item) => ({
                    name: item.name,
                    service: item.service,
                    hsn_code: item.hsn_code,
                    description: item.description,
                    quantity: item.quantity,
                    price: item.price,
                    discount_type: item.discount_type,
                    discount: item.discount,
                    tax_type: item.tax_type,
                    tax_amount: item.tax_amount,
                    cgst: item.cgst,
                    sgst: item.sgst,
                    igst: item.igst,
                    sub_total: item.sub_total,
                })),
            };

            await updateEstimation(id, estimationData);
            setSnackbar({ open: true, message: 'Estimation updated successfully', severity: 'success' });
            setTimeout(() => router.push('/estimations'), 1500);
        } catch (err: any) {
            console.error(err);
            setSnackbar({ open: true, message: err.message || 'Failed to update estimation', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <DashboardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <CircularProgress />
            </DashboardContent>
        );
    }

    const handlePrint = () => {
        if (id) {
            handleDirectPrint(getEstimationPrintUrl(id));
        }
    };

    const handleConvertToInvoice = async () => {
        if (!id) return;
        try {
            setConverting(true);
            const invoiceName = await convertEstimationToInvoice(id);
            router.push(`/invoices/${encodeURIComponent(invoiceName)}/view`, { converted: true });
        } catch (error) {
            console.error('Failed to convert estimation:', error);
            setSnackbar({ open: true, message: 'Failed to convert estimation', severity: 'error' });
        } finally {
            setConverting(false);
            setConfirmOpen(false);
        }
    };

    return (
        <DashboardContent>
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5} className="no-print">
                <Typography variant="h4">Edit Estimation</Typography>
                <Stack direction="row" spacing={2}>
                    <Button variant="outlined" color="inherit" onClick={() => router.push('/estimations')}>
                        Cancel
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
                        color="warning"
                        onClick={() => setConfirmOpen(true)}
                        startIcon={<Iconify icon={"solar:transfer-horizontal-bold" as any} />}
                        disabled={converting}
                    >
                        {converting ? 'Converting...' : 'Convert to Invoice'}
                    </Button>
                    <Button variant="contained" color="primary" onClick={handleSave} loading={loading}>
                        Save Changes
                    </Button>
                </Stack>
            </Stack>

            <Card sx={{ p: 4 }}>
                <Box
                    sx={{
                        display: 'grid',
                        columnGap: 3,
                        rowGap: 3,
                        gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
                    }}
                >
                    <Autocomplete
                        fullWidth
                        options={customerOptions}
                        getOptionLabel={(option) => (option.customer_name ? `${option.name} - ${option.customer_name}` : option.name || '')}
                        value={customerOptions.find((opt) => opt.name === clientName) || null}
                        onChange={(_e, newValue) => handleCustomerChange(newValue?.name || '')}
                        renderInput={(params) => (
                            <TextField {...params} label="Customer ID" required />
                        )}
                    />

                    <TextField
                        fullWidth
                        label="Customer Name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                    />

                    <TextField
                        fullWidth
                        label="Billing Name"
                        value={billingName}
                        onChange={(e) => setBillingName(e.target.value)}
                    />

                    <DatePicker
                        label="Estimate Date"
                        value={estimateDate ? dayjs(estimateDate) : null}
                        onChange={(newValue) => setEstimateDate(newValue?.format('YYYY-MM-DD') || '')}
                        slotProps={{
                            textField: {
                                fullWidth: true,
                                InputLabelProps: { shrink: true },
                            },
                        }}
                    />

                    <TextField
                        fullWidth
                        label="Billing Address"
                        multiline
                        rows={2}
                        value={billingAddress}
                        onChange={(e) => setBillingAddress(e.target.value)}
                        sx={{ gridColumn: 'span 2' }}
                    />

                </Box>

                <Divider sx={{ my: 4 }} />

                <Typography variant="h6" sx={{ mb: 2 }}>
                    Items
                </Typography>

                <TableContainer sx={{
                    overflow: 'unset',
                    border: (theme) => `1px solid ${theme.palette.divider}`,
                    borderRadius: 1.5,
                    bgcolor: 'background.paper',
                    boxShadow: (theme) => theme.customShadows.z8,
                }}>
                    <Table sx={{ minWidth: 960 }}>
                        <TableHead sx={{ bgcolor: (theme) => alpha(theme.palette.grey[500], 0.08) }}>
                            <TableRow>
                                <TableCell width={180} sx={{ borderRight: (theme) => `1px solid ${theme.palette.divider}`, py: 1.5, fontWeight: 'fontWeightSemiBold' }}>Service</TableCell>
                                <TableCell width={80} sx={{ borderRight: (theme) => `1px solid ${theme.palette.divider}`, py: 1.5, fontWeight: 'fontWeightSemiBold' }}>HSN</TableCell>
                                <TableCell sx={{ borderRight: (theme) => `1px solid ${theme.palette.divider}`, py: 1.5, fontWeight: 'fontWeightSemiBold' }}>Description</TableCell>
                                <TableCell width={80} align="right" sx={{ borderRight: (theme) => `1px solid ${theme.palette.divider}`, py: 1.5, fontWeight: 'fontWeightSemiBold' }}>Qty</TableCell>
                                <TableCell width={120} align="right" sx={{ borderRight: (theme) => `1px solid ${theme.palette.divider}`, py: 1.5, fontWeight: 'fontWeightSemiBold' }}>Price</TableCell>
                                <TableCell width={140} align="right" sx={{ borderRight: (theme) => `1px solid ${theme.palette.divider}`, py: 1.5, fontWeight: 'fontWeightSemiBold' }}>Discount</TableCell>
                                <TableCell width={150} sx={{ borderRight: (theme) => `1px solid ${theme.palette.divider}`, py: 1.5, fontWeight: 'fontWeightSemiBold' }}>Tax Type</TableCell>
                                <TableCell width={120} align="right" sx={{ borderRight: (theme) => `1px solid ${theme.palette.divider}`, py: 1.5, fontWeight: 'fontWeightSemiBold' }}>Tax Amt</TableCell>
                                <TableCell width={120} align="right" sx={{ borderRight: (theme) => `1px solid ${theme.palette.divider}`, py: 1.5, fontWeight: 'fontWeightSemiBold' }}>Total</TableCell>
                                <TableCell width={40} />
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {items.map((row, index) => (
                                <TableRow
                                    key={index}
                                    sx={{
                                        verticalAlign: 'top',
                                        transition: (theme) => theme.transitions.create('background-color'),
                                        '&:hover': { bgcolor: (theme) => alpha(theme.palette.primary.main, 0.02) },
                                        '&:nth-of-type(even)': { bgcolor: (theme) => alpha(theme.palette.grey[500], 0.02) },
                                    }}
                                >
                                    {[
                                        {
                                            field: 'service', component: (
                                                <Autocomplete
                                                    fullWidth
                                                    size="small"
                                                    options={itemOptions}
                                                    getOptionLabel={(option) => {
                                                        if (typeof option === 'string') return option;
                                                        if (option.inputValue) return option.inputValue;
                                                        return option.item_name || option.name || '';
                                                    }}
                                                    filterOptions={(options, params) => {
                                                        const filtered = filter(options, params);
                                                        const { inputValue } = params;
                                                        const isExisting = options.some((option) => inputValue === option.item_name || inputValue === option.name);
                                                        if (inputValue !== '' && !isExisting) {
                                                            filtered.push({
                                                                inputValue,
                                                                item_name: `+ Create a new Item "${inputValue}"`,
                                                                isNew: true,
                                                            });
                                                        }
                                                        return filtered;
                                                    }}
                                                    value={itemOptions.find((opt) => opt.name === row.service) || null}
                                                    onChange={(_e, newValue) => {
                                                        if (typeof newValue === 'string') {
                                                            handleItemChange(index, 'service', newValue);
                                                        } else if (newValue && newValue.isNew) {
                                                            setActiveRowIndex(index);
                                                            setNewItem((prev) => ({ ...prev, item_name: newValue.inputValue }));
                                                            setItemDialogOpen(true);
                                                        } else {
                                                            handleItemChange(index, 'service', newValue?.name || '');
                                                        }
                                                    }}
                                                    renderInput={(params) => (
                                                        <TextField
                                                            {...params}
                                                            placeholder="Select Service"
                                                            variant="standard"
                                                            InputProps={{
                                                                ...params.InputProps,
                                                                disableUnderline: true,
                                                                sx: { typography: 'body2' }
                                                            }}
                                                        />
                                                    )}
                                                    renderOption={(props, option) => (
                                                        <Box component="li" {...props} sx={{
                                                            typography: 'body2',
                                                            ...(option.isNew && {
                                                                color: 'primary.main',
                                                                fontWeight: 'bold',
                                                                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                                                                '&:hover': {
                                                                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
                                                                }
                                                            })
                                                        }}>
                                                            {option.isNew ? (
                                                                <Stack direction="row" alignItems="center" spacing={1}>
                                                                    <Iconify icon={"solar:add-circle-bold" as any} />
                                                                    {option.item_name}
                                                                </Stack>
                                                            ) : (
                                                                option.item_name || option.name
                                                            )}
                                                        </Box>
                                                    )}
                                                />
                                            )
                                        },
                                        {
                                            field: 'hsn_code', component: (
                                                <TextField
                                                    fullWidth
                                                    size="small"
                                                    variant="standard"
                                                    value={row.hsn_code}
                                                    onChange={(e) => handleItemChange(index, 'hsn_code', e.target.value)}
                                                    InputProps={{ disableUnderline: true, sx: { typography: 'body2' } }}
                                                />
                                            )
                                        },
                                        {
                                            field: 'description', component: (
                                                <TextField
                                                    fullWidth
                                                    multiline
                                                    size="small"
                                                    variant="standard"
                                                    value={row.description}
                                                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                                    InputProps={{ disableUnderline: true, sx: { typography: 'body2' } }}
                                                />
                                            )
                                        },
                                        {
                                            field: 'quantity', component: (
                                                <TextField
                                                    fullWidth
                                                    size="small"
                                                    type="number"
                                                    variant="standard"
                                                    value={row.quantity === 0 ? '' : row.quantity}
                                                    onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                                                    onFocus={(e) => e.target.select()}
                                                    inputProps={{ sx: { textAlign: 'right', typography: 'body2', px: 0 } }}
                                                    InputProps={{ disableUnderline: true }}
                                                />
                                            )
                                        },
                                        {
                                            field: 'price', component: (
                                                <TextField
                                                    fullWidth
                                                    size="small"
                                                    type="number"
                                                    variant="standard"
                                                    value={row.price === 0 ? '' : row.price}
                                                    onChange={(e) => handleItemChange(index, 'price', Number(e.target.value))}
                                                    onFocus={(e) => e.target.select()}
                                                    inputProps={{ sx: { textAlign: 'right', typography: 'body2', px: 0 } }}
                                                    InputProps={{ disableUnderline: true }}
                                                />
                                            )
                                        },
                                        {
                                            field: 'discount', component: (
                                                <Stack direction="row" spacing={0.5} alignItems="center">
                                                    <ToggleButtonGroup
                                                        size="small"
                                                        value={row.discount_type}
                                                        exclusive
                                                        onChange={(e, nextView) => {
                                                            if (nextView !== null) {
                                                                handleItemChange(index, 'discount_type', nextView);
                                                            }
                                                        }}
                                                        sx={{
                                                            height: 28,
                                                            '& .MuiToggleButton-root': {
                                                                px: 1,
                                                                py: 0,
                                                                border: 'none',
                                                                typography: 'body2',
                                                                '&.Mui-selected': {
                                                                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                                                                    color: 'primary.main',
                                                                    '&:hover': {
                                                                        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.2),
                                                                    }
                                                                }
                                                            }
                                                        }}
                                                    >
                                                        <ToggleButton value="Flat">₹</ToggleButton>
                                                        <ToggleButton value="Percentage">%</ToggleButton>
                                                    </ToggleButtonGroup>
                                                    <TextField
                                                        fullWidth
                                                        size="small"
                                                        type="number"
                                                        variant="standard"
                                                        value={row.discount === 0 ? '' : row.discount}
                                                        onChange={(e) => handleItemChange(index, 'discount', Number(e.target.value))}
                                                        onFocus={(e) => e.target.select()}
                                                        inputProps={{ sx: { textAlign: 'right', typography: 'body2', px: 0 } }}
                                                        InputProps={{ disableUnderline: true }}
                                                    />
                                                </Stack>
                                            )
                                        },
                                        {
                                            field: 'tax_type', component: (
                                                <TextField
                                                    select
                                                    fullWidth
                                                    size="small"
                                                    variant="standard"
                                                    value={row.tax_type}
                                                    onChange={(e) => handleItemChange(index, 'tax_type', e.target.value)}
                                                    SelectProps={{ displayEmpty: true }}
                                                    InputProps={{ disableUnderline: true, sx: { typography: 'body2' } }}
                                                >
                                                    <MenuItem value="" disabled sx={{ typography: 'body2', color: 'text.disabled' }}>Select Tax</MenuItem>
                                                    {taxOptions.map((opt) => (
                                                        <MenuItem key={opt.name} value={opt.name} sx={{ typography: 'body2' }}>
                                                            {opt.tax_name || opt.name}
                                                        </MenuItem>
                                                    ))}
                                                </TextField>
                                            )
                                        },
                                    ].map((cell, idx) => (
                                        <TableCell
                                            key={idx}
                                            sx={{
                                                px: 1,
                                                py: 1,
                                                borderRight: (theme) => `1px solid ${theme.palette.divider}`,
                                                transition: (theme) => theme.transitions.create(['background-color', 'box-shadow']),
                                                '&:focus-within': {
                                                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
                                                }
                                            }}
                                        >
                                            {cell.component}
                                        </TableCell>
                                    ))}
                                    <TableCell align="right" sx={{ px: 1, py: 1, borderRight: (theme) => `1px solid ${theme.palette.divider}` }}>
                                        <Typography variant="body2" sx={{ fontWeight: 'fontWeightMedium' }}>{fCurrency(row.tax_amount)}</Typography>
                                    </TableCell>
                                    <TableCell align="right" sx={{ px: 1, py: 1, borderRight: (theme) => `1px solid ${theme.palette.divider}` }}>
                                        <Typography variant="subtitle2" color="primary.main">{fCurrency(row.sub_total)}</Typography>
                                    </TableCell>
                                    <TableCell sx={{ px: 1, py: 1 }}>
                                        <IconButton color="error" onClick={() => handleRemoveRow(index)} size="small" sx={{ opacity: 0.6, '&:hover': { opacity: 1 } }}>
                                            <Iconify icon="solar:trash-bin-trash-bold" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                <Button
                    startIcon={<Iconify icon="mingcute:add-line" />}
                    onClick={handleAddRow}
                    sx={{ mt: 2 }}
                >
                    Add Item
                </Button>

                <Divider sx={{ my: 4 }} />

                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Stack spacing={2} sx={{ width: 400, mt: 3 }}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                            <Stack direction="row" alignItems="center" spacing={1}>
                                <Iconify icon={"solar:box-bold-duotone" as any} sx={{ color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary">Total Quantity</Typography>
                            </Stack>
                            <Typography variant="subtitle2" sx={{ width: 120, textAlign: 'right' }}>{totalQty}</Typography>
                        </Stack>

                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                            <Stack direction="row" alignItems="center" spacing={1}>
                                <Iconify icon={"solar:bill-list-bold-duotone" as any} sx={{ color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary">Taxable Amount</Typography>
                            </Stack>
                            <Typography variant="subtitle2" sx={{ width: 120, textAlign: 'right' }}>{fCurrency(itemsTotalTaxable)}</Typography>
                        </Stack>

                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                            <Stack direction="row" alignItems="center" spacing={1}>
                                <Iconify icon={"solar:calculator-minimalistic-bold-duotone" as any} sx={{ color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary">Total Tax</Typography>
                            </Stack>
                            <Typography variant="subtitle2" sx={{ width: 120, textAlign: 'right' }}>{fCurrency(totalTax)}</Typography>
                        </Stack>

                        <Stack direction="row" spacing={2} alignItems="center" justifyContent="flex-end">
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ flexGrow: 1 }}>
                                <Iconify icon={"solar:tag-horizontal-bold-duotone" as any} sx={{ color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary">Overall Discount</Typography>
                            </Stack>
                            <ToggleButtonGroup
                                size="small"
                                value={discountType}
                                exclusive
                                onChange={(e, nextView) => {
                                    if (nextView !== null) {
                                        setDiscountType(nextView as any);
                                    }
                                }}
                                sx={{
                                    height: 32,
                                    '& .MuiToggleButton-root': {
                                        px: 1,
                                        py: 0,
                                        typography: 'body2',
                                        '&.Mui-selected': {
                                            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                                            color: 'primary.main',
                                        }
                                    }
                                }}
                            >
                                <ToggleButton value="Flat">₹</ToggleButton>
                                <ToggleButton value="Percentage">%</ToggleButton>
                            </ToggleButtonGroup>
                            <TextField
                                size="small"
                                type="number"
                                variant="standard"
                                value={discountValue === 0 ? '' : discountValue}
                                onChange={(e) => setDiscountValue(Number(e.target.value))}
                                onFocus={(e) => e.target.select()}
                                sx={{
                                    width: 100,
                                    '& .MuiInputBase-root': {
                                        bgcolor: (theme) => alpha(theme.palette.grey[500], 0.08),
                                        borderRadius: 0.75,
                                        px: 1,
                                        '&:hover': {
                                            bgcolor: (theme) => alpha(theme.palette.grey[500], 0.12),
                                        },
                                        '&.Mui-focused': {
                                            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                                        }
                                    }
                                }}
                                inputProps={{ sx: { textAlign: 'right', typography: 'body2' } }}
                            />
                        </Stack>

                        <Divider />
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                            <Stack direction="row" alignItems="center" spacing={1.5}>
                                <Iconify icon={"solar:wad-of-money-bold-duotone" as any} sx={{ color: 'primary.main', width: 24, height: 24 }} />
                                <Typography variant="subtitle1" sx={{ color: 'primary.main' }}>Grand Total</Typography>
                            </Stack>
                            <Typography variant="h6" color="primary" sx={{ width: 120, textAlign: 'right' }}>{fCurrency(grandTotal)}</Typography>
                        </Stack>
                    </Stack>
                </Box>

                <Divider sx={{ my: 4, borderStyle: 'dashed' }} />

                <Box
                    sx={{
                        display: 'grid',
                        gap: 3,
                        gridTemplateColumns: { xs: 'repeat(1, 1fr)', md: 'repeat(2, 1fr)' },
                    }}
                >
                    <Stack spacing={3}>
                        <TextField
                            fullWidth
                            label="Description"
                            multiline
                            rows={4}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />

                        <TextField
                            fullWidth
                            label="Terms & Conditions / Remarks"
                            multiline
                            rows={4}
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                        />
                    </Stack>

                    <Box
                        sx={{
                            p: 3,
                            borderRadius: 2,
                            bgcolor: (theme) => alpha(theme.palette.grey[500], 0.04),
                            border: (theme) => `1px dashed ${alpha(theme.palette.grey[500], 0.2)}`,
                        }}
                    >
                        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2.5 }}>
                            <Typography variant="h6">Attachments</Typography>

                            <Button
                                variant="contained"
                                component="label"
                                color="primary"
                                size="small"
                                startIcon={<Iconify icon={"solar:upload-bold" as any} />}
                                disabled={uploading}
                            >
                                {uploading ? 'Uploading...' : 'Upload File'}
                                <input type="file" hidden onChange={handleFileUpload} />
                            </Button>
                        </Stack>

                        <Stack spacing={1}>
                            {attachments.length === 0 ? (
                                <Stack alignItems="center" justifyContent="center" sx={{ py: 3, color: 'text.disabled' }}>
                                    <Iconify icon={"solar:file-bold" as any} width={40} height={40} sx={{ mb: 1, opacity: 0.48 }} />
                                    <Typography variant="body2">No attachments yet</Typography>
                                </Stack>
                            ) : (
                                attachments.map((file, index) => (
                                    <Stack
                                        key={index}
                                        direction="row"
                                        alignItems="center"
                                        sx={{
                                            px: 1.5,
                                            py: 0.75,
                                            borderRadius: 1.5,
                                            bgcolor: (theme) => alpha(theme.palette.grey[500], 0.08),
                                        }}
                                    >
                                        <Iconify icon={"solar:link-bold" as any} width={20} sx={{ mr: 1, color: 'text.secondary', flexShrink: 0 }} />
                                        <Typography variant="body2" noWrap sx={{ flexGrow: 1, fontWeight: 'fontWeightMedium' }}>
                                            {file.url}
                                        </Typography>
                                        <Button
                                            size="small"
                                            color="inherit"
                                            onClick={() => handleRemoveAttachment(index)}
                                            sx={{
                                                px: 1.5,
                                                py: 0,
                                                height: 26,
                                                borderRadius: 1.5,
                                                minWidth: 'auto',
                                                typography: 'caption',
                                                bgcolor: 'background.paper',
                                                border: (theme) => `1px solid ${alpha(theme.palette.grey[500], 0.24)}`,
                                                '&:hover': {
                                                    bgcolor: (theme) => alpha(theme.palette.grey[500], 0.08),
                                                }
                                            }}
                                        >
                                            Clear
                                        </Button>
                                    </Stack>
                                ))
                            )}
                        </Stack>
                    </Box>
                </Box>
            </Card>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert
                    severity={snackbar.severity}
                    sx={{
                        width: '100%',
                        boxShadow: (theme) => theme.customShadows.z20
                    }}
                >
                    <AlertTitle>{snackbar.severity === 'success' ? 'Success' : 'Error'}</AlertTitle>
                    {snackbar.message}
                </Alert>
            </Snackbar>

            <Dialog open={itemDialogOpen} onClose={() => !creatingItem && setItemDialogOpen(false)} fullWidth maxWidth="xs">
                <DialogTitle>Create New Item</DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ pt: 1 }}>
                        <TextField
                            fullWidth
                            label="Item Name"
                            value={newItem.item_name}
                            onChange={(e) => setNewItem((prev) => ({ ...prev, item_name: e.target.value }))}
                            required
                        />
                        <TextField
                            fullWidth
                            label="Item Code"
                            value={newItem.item_code}
                            onChange={(e) => setNewItem((prev) => ({ ...prev, item_code: e.target.value }))}
                            required
                        />
                        <TextField
                            fullWidth
                            label="Rate"
                            type="number"
                            value={newItem.rate}
                            onChange={(e) => setNewItem((prev) => ({ ...prev, rate: Number(e.target.value) }))}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button color="inherit" onClick={() => setItemDialogOpen(false)} disabled={creatingItem}>
                        Cancel
                    </Button>
                    <Button variant="contained" onClick={handleCreateItem} disabled={creatingItem}>
                        {creatingItem ? <CircularProgress size={24} /> : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>

            <ConfirmDialog
                open={confirmOpen}
                onClose={() => !converting && setConfirmOpen(false)}
                title="Confirm Conversion"
                content="Are you sure you want to convert this estimation into an invoice? This will create a new invoice document."
                action={
                    <Button onClick={handleConvertToInvoice} color="warning" variant="contained" disabled={converting} sx={{ borderRadius: 1.5, minWidth: 100 }}>
                        {converting ? 'Converting...' : 'Confirm'}
                    </Button>
                }
            />
        </DashboardContent>
    );
}
