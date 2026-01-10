import type { Dayjs } from 'dayjs';

import dayjs from 'dayjs';
import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import { IconButton } from '@mui/material';
import Snackbar from '@mui/material/Snackbar';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TextField from '@mui/material/TextField';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import Autocomplete from '@mui/material/Autocomplete';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TableContainer from '@mui/material/TableContainer';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import TablePagination from '@mui/material/TablePagination';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

import { useDeals } from 'src/hooks/useDeals';

import { getFriendlyErrorMessage } from 'src/utils/error-handler';

import { getDoctypeList } from 'src/api/leads';
import { DashboardContent } from 'src/layouts/dashboard';
import { createDeal, updateDeal, deleteDeal, getDealPermissions } from 'src/api/deals';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { EmptyContent } from 'src/components/empty-content';
import { ConfirmDialog } from 'src/components/confirm-dialog';

import { DealTableRow } from '../deal-table-row';
import { TableNoData } from '../../user/table-no-data';
import { DealDetailsDialog } from '../deal-details-dialog';
import { TableEmptyRows } from '../../user/table-empty-rows';
import { UserTableHead as DealTableHead } from '../../user/user-table-head';
import { UserTableToolbar as DealTableToolbar } from '../../user/user-table-toolbar';

// ----------------------------------------------------------------------

export function DealView() {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [filterName, setFilterName] = useState('');
    const [filterStage, setFilterStage] = useState('all');

    const STAGE_OPTIONS = [
        { value: 'Qualification', label: 'Qualification' },
        { value: 'Needs Analysis', label: 'Needs Analysis' },
        { value: 'Meeting Scheduled', label: 'Meeting Scheduled' },
        { value: 'Proposal Sent', label: 'Proposal Sent' },
        { value: 'Negotiation', label: 'Negotiation' },
        { value: 'Closed Won', label: 'Closed Won' },
        { value: 'Closed Lost', label: 'Closed Lost' },
    ];

    const [openCreate, setOpenCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [currentDealId, setCurrentDealId] = useState<string | null>(null);
    const [viewOnly, setViewOnly] = useState(false);
    const [openView, setOpenView] = useState(false);

    // Form state
    const [dealTitle, setDealTitle] = useState('');
    const [account, setAccount] = useState('');
    const [contact, setContact] = useState('');
    const [value, setValue] = useState<number | string>('');
    const [expectedCloseDate, setExpectedCloseDate] = useState<Dayjs | null>(null);
    const [stage, setStage] = useState('Qualification');
    const [probability, setProbability] = useState<number | string>('');
    const [dealType, setDealType] = useState('New Business');
    const [sourceLead, setSourceLead] = useState('');
    const [nextStep, setNextStep] = useState('');
    const [notes, setNotes] = useState('');

    // Dropdown Options
    const [accountOptions, setAccountOptions] = useState<string[]>([]);
    const [contactOptions, setContactOptions] = useState<string[]>([]);
    const [leadOptions, setLeadOptions] = useState<string[]>([]);

    // Alert & Dialog State
    const [confirmDelete, setConfirmDelete] = useState<{ open: boolean, id: string | null }>({ open: false, id: null });
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' | 'warning' }>({
        open: false,
        message: '',
        severity: 'success',
    });

    // Permissions State
    const [permissions, setPermissions] = useState<{ read: boolean; write: boolean; delete: boolean }>({
        read: true,
        write: true,
        delete: true,
    });

    // Validation State
    const [validationErrors, setValidationErrors] = useState<{ [key: string]: boolean }>({});

    const { data, total, loading, refetch } = useDeals(
        page,
        rowsPerPage,
        filterName,
        filterStage
    );

    useEffect(() => {
        // Fetch dropdown options on mount
        getDoctypeList('Accounts').then(setAccountOptions);
        getDoctypeList('Contacts').then(setContactOptions);
        getDoctypeList('Lead').then(setLeadOptions);

        // Fetch Permissions
        getDealPermissions().then(setPermissions);
    }, []);

    const handleOpenCreate = () => {
        setViewOnly(false);
        setOpenCreate(true);
    };

    const handleCloseCreate = () => {
        setOpenCreate(false);
        setCurrentDealId(null);
        setViewOnly(false);
        setDealTitle('');
        setAccount('');
        setContact('');
        setValue('');
        setExpectedCloseDate(null);
        setStage('Qualification');
        setProbability('');
        setDealType('New Business');
        setSourceLead('');
        setNextStep('');
        setNotes('');
        setValidationErrors({}); // Clear errors on close
    };

    const handleCloseSnackbar = () => {
        setSnackbar((prev) => ({ ...prev, open: false }));
    };

    const handleDeleteClick = (id: string) => {
        setConfirmDelete({ open: true, id });
    };

    const handleConfirmDelete = async () => {
        if (!confirmDelete.id) return;
        try {
            await deleteDeal(confirmDelete.id);
            setSnackbar({ open: true, message: 'Deal deleted successfully', severity: 'success' });
            await refetch();
        } catch (e) {
            console.error(e);
            setSnackbar({ open: true, message: 'Failed to delete deal', severity: 'error' });
        } finally {
            setConfirmDelete({ open: false, id: null });
        }
    };

    const handleCreate = async () => {
        // Validation
        const newErrors: { [key: string]: boolean } = {};
        const missingFields: string[] = [];

        if (!dealTitle) {
            newErrors.dealTitle = true;
            missingFields.push('Deal Title');
        }
        if (!account) {
            newErrors.account = true;
            missingFields.push('Account');
        }
        if (!value) {
            newErrors.value = true;
            missingFields.push('Deal Value');
        }
        if (!stage) {
            newErrors.stage = true;
            missingFields.push('Stage');
        }

        if (Object.keys(newErrors).length > 0) {
            setValidationErrors(newErrors);
            setSnackbar({
                open: true,
                message: `Please fill in mandatory fields: ${missingFields.join(', ')}`,
                severity: 'error'
            });
            return;
        }

        try {
            setCreating(true);

            const dealData = {
                deal_title: dealTitle,
                account,
                contact,
                value: Number(value),
                expected_close_date: expectedCloseDate ? expectedCloseDate.format('YYYY-MM-DD') : '',
                stage: stage as any,
                probability: probability ? Number(probability) : undefined,
                type: dealType as any,
                source_lead: sourceLead,
                next_step: nextStep,
                notes,
            };

            if (currentDealId) {
                await updateDeal(currentDealId, dealData);
                setSnackbar({ open: true, message: 'Deal updated successfully', severity: 'success' });
            } else {
                await createDeal(dealData);
                setSnackbar({ open: true, message: 'Deal created successfully', severity: 'success' });
            }

            await refetch();
            handleCloseCreate();
        } catch (err: any) {
            console.error(err);
            const friendlyMsg = getFriendlyErrorMessage(err);
            setSnackbar({ open: true, message: friendlyMsg || (currentDealId ? 'Failed to update deal' : 'Failed to create deal'), severity: 'error' });
        } finally {
            setCreating(false);
        }
    };

    const handleEditRow = (id: string) => {
        setViewOnly(false);
        setCurrentDealId(id);

        const fullRow = data.find((item) => item.name === id);
        if (fullRow) {
            setDealTitle(fullRow.deal_title || '');
            setAccount(fullRow.account || '');
            setContact(fullRow.contact || '');
            setValue(fullRow.value || '');
            setExpectedCloseDate(fullRow.expected_close_date ? dayjs(fullRow.expected_close_date) : null);
            setStage(fullRow.stage || 'Qualification');
            setProbability(fullRow.probability || '');
            setDealType(fullRow.type || 'New Business');
            setSourceLead(fullRow.source_lead || '');
            setNextStep(fullRow.next_step || '');
            setNotes(fullRow.notes || '');
        }
        setOpenCreate(true);
    };

    const handleViewRow = (id: string) => {
        setCurrentDealId(id);
        setOpenView(true);
    };

    const onChangePage = (_: unknown, newPage: number) => setPage(newPage);

    const onChangeRowsPerPage = (e: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(e.target.value, 10));
        setPage(0);
    };

    const notFound = !loading && data.length === 0 && (!!filterName || filterStage !== 'all');
    const empty = !loading && data.length === 0 && !filterName && filterStage === 'all';

    return (
        <>
            {/* CREATE DEAL DIALOG */}
            <Dialog open={openCreate} onClose={handleCloseCreate} fullWidth maxWidth="md">
                <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {viewOnly ? 'Deal Details' : (currentDealId ? 'Edit Deal' : 'New Deal')}
                    <IconButton
                        aria-label="close"
                        onClick={handleCloseCreate}
                        sx={{
                            color: (theme) => theme.palette.grey[500],
                        }}
                    >
                        <Iconify icon="mingcute:close-line" />
                    </IconButton>
                </DialogTitle>

                <DialogContent dividers>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <Box
                            sx={{
                                display: 'grid',
                                margin: '1rem',
                                columnGap: 2,
                                rowGap: 3,
                                gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
                            }}
                        >
                            <TextField
                                fullWidth
                                label="Deal Title"
                                value={dealTitle}
                                onChange={(e) => {
                                    setDealTitle(e.target.value);
                                    if (e.target.value) setValidationErrors(prev => ({ ...prev, dealTitle: false }));
                                }}
                                required
                                error={!!validationErrors.dealTitle}
                                slotProps={{ input: { readOnly: viewOnly } }}
                            />

                            <Autocomplete
                                fullWidth
                                options={accountOptions}
                                value={account}
                                onChange={(event, newValue) => {
                                    setAccount(newValue || '');
                                    if (newValue) setValidationErrors((prev) => ({ ...prev, account: false }));
                                }}
                                disabled={viewOnly}
                                slotProps={{
                                    paper: {
                                        sx: {
                                            bgcolor: '#F0F8FF',
                                            '& .MuiAutocomplete-listbox': {
                                                bgcolor: '#F0F8FF',
                                            },
                                        }
                                    }
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Account"
                                        required
                                        error={!!validationErrors.account}
                                    />
                                )}
                            />

                            <Autocomplete
                                fullWidth
                                options={contactOptions}
                                value={contact}
                                onChange={(event, newValue) => setContact(newValue || '')}
                                disabled={viewOnly}
                                slotProps={{
                                    paper: {
                                        sx: {
                                            bgcolor: '#F0F8FF',
                                            '& .MuiAutocomplete-listbox': {
                                                bgcolor: '#F0F8FF',
                                            },
                                        }
                                    }
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Contact"
                                    />
                                )}
                            />

                            <TextField
                                fullWidth
                                label="Deal Value"
                                type="number"
                                value={value}
                                onChange={(e) => {
                                    setValue(e.target.value);
                                    if (e.target.value) setValidationErrors(prev => ({ ...prev, value: false }));
                                }}
                                required
                                error={!!validationErrors.value}
                                slotProps={{ input: { readOnly: viewOnly } }}
                            />

                            <DatePicker
                                label="Expected Close Date"
                                value={expectedCloseDate}
                                onChange={(newValue) => setExpectedCloseDate(newValue)}
                                disabled={viewOnly}
                                slotProps={{
                                    textField: {
                                        fullWidth: true
                                    }
                                }}
                            />

                            <TextField
                                select
                                fullWidth
                                label="Stage"
                                value={stage}
                                onChange={(e) => {
                                    setStage(e.target.value);
                                    if (e.target.value) setValidationErrors(prev => ({ ...prev, stage: false }));
                                }}
                                required
                                error={!!validationErrors.stage}
                                disabled={viewOnly}
                                SelectProps={{ native: true }}
                                InputLabelProps={{ shrink: true }}
                                sx={{
                                    "& .MuiInputBase-input.Mui-disabled": {
                                        WebkitTextFillColor: "rgba(0, 0, 0, 0.87)",
                                    },
                                }}
                            >
                                <option value="Qualification">Qualification</option>
                                <option value="Needs Analysis">Needs Analysis</option>
                                <option value="Meeting Scheduled">Meeting Scheduled</option>
                                <option value="Proposal Sent">Proposal Sent</option>
                                <option value="Negotiation">Negotiation</option>
                                <option value="Closed Won">Closed Won</option>
                                <option value="Closed Lost">Closed Lost</option>
                            </TextField>

                            <TextField
                                fullWidth
                                label="Probability (%)"
                                type="number"
                                value={probability}
                                onChange={(e) => setProbability(e.target.value)}
                                slotProps={{ input: { readOnly: viewOnly } }}
                            />

                            <TextField
                                select
                                fullWidth
                                label="Type"
                                value={dealType}
                                onChange={(e) => setDealType(e.target.value)}
                                disabled={viewOnly}
                                SelectProps={{ native: true }}
                                InputLabelProps={{ shrink: true }}
                                sx={{
                                    "& .MuiInputBase-input.Mui-disabled": {
                                        WebkitTextFillColor: "rgba(0, 0, 0, 0.87)",
                                    },
                                }}
                            >
                                <option value="New Business">New Business</option>
                                <option value="Existing Business">Existing Business</option>
                            </TextField>

                            <TextField
                                select
                                fullWidth
                                label="Source Lead"
                                value={sourceLead}
                                onChange={(e) => setSourceLead(e.target.value)}
                                disabled={viewOnly}
                                SelectProps={{ native: true }}
                                InputLabelProps={{ shrink: true }}
                                sx={{
                                    "& .MuiInputBase-input.Mui-disabled": {
                                        WebkitTextFillColor: "rgba(0, 0, 0, 0.87)",
                                    },
                                }}
                            >
                                <option value="">Select Source Lead</option>
                                {leadOptions.map((option) => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </TextField>

                            <TextField
                                fullWidth
                                label="Next Step"
                                value={nextStep}
                                onChange={(e) => setNextStep(e.target.value)}
                                slotProps={{ input: { readOnly: viewOnly } }}
                            />

                            <TextField
                                fullWidth
                                label="Notes"
                                multiline
                                rows={3}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                sx={{ gridColumn: { sm: 'span 2' } }}
                                slotProps={{ input: { readOnly: viewOnly } }}
                            />
                        </Box>
                    </LocalizationProvider>
                </DialogContent>

                <DialogActions>
                    {!viewOnly && (
                        <Button variant="contained" onClick={handleCreate} disabled={creating}>
                            {creating ? (currentDealId ? 'Updating...' : 'Creating...') : (currentDealId ? 'Update Deal' : 'Create Deal')}
                        </Button>
                    )}
                </DialogActions>
            </Dialog>

            {/* MAIN CONTENT */}
            <DashboardContent>
                <Box sx={{ mb: 5, display: 'flex', alignItems: 'center' }}>
                    <Typography variant="h4" sx={{ flexGrow: 1 }}>
                        Deals
                    </Typography>

                    {permissions.write && (
                        <Button
                            variant="contained"
                            startIcon={<Iconify icon="mingcute:add-line" />}
                            onClick={handleOpenCreate}
                            sx={{ bgcolor: '#08a3cd', color: 'common.white', '&:hover': { bgcolor: '#068fb3' } }}
                        >
                            New Deal
                        </Button>
                    )}
                </Box>

                <Card>
                    <DealTableToolbar
                        numSelected={0}
                        filterName={filterName}
                        onFilterName={(e) => {
                            setFilterName(e.target.value);
                            setPage(0);
                        }}
                        filterStatus={filterStage}
                        onFilterStatus={(e) => {
                            setFilterStage(e.target.value);
                            setPage(0);
                        }}
                        options={STAGE_OPTIONS}
                        searchPlaceholder="Search deals..."
                        filterLabel="Stage"
                    />

                    <Scrollbar>
                        <TableContainer sx={{ overflow: 'unset' }}>
                            <Table sx={{ minWidth: 800 }}>
                                <DealTableHead
                                    order="desc"
                                    orderBy="creation"
                                    rowCount={total}
                                    numSelected={0}
                                    onSort={() => { }}
                                    onSelectAllRows={() => { }}
                                    headLabel={[
                                        { id: 'deal_title', label: 'Title' },
                                        { id: 'account', label: 'Account' },
                                        { id: 'value', label: 'Value' },
                                        { id: 'stage', label: 'Stage' },
                                        { id: 'expected_close_date', label: 'Expected Close' },
                                        { id: '' },
                                    ]}
                                />

                                <TableBody>
                                    {loading && (
                                        <TableEmptyRows height={68} emptyRows={rowsPerPage} />
                                    )}

                                    {!loading &&
                                        data.map((row) => (
                                            <DealTableRow
                                                key={row.name}
                                                row={{
                                                    id: row.name,
                                                    title: row.deal_title ?? '-',
                                                    account: row.account ?? '-',
                                                    value: row.value ?? 0,
                                                    stage: row.stage ?? '-',
                                                    expectedCloseDate: row.expected_close_date ?? '-',
                                                    avatarUrl: '/assets/images/avatar/avatar-25.webp',
                                                }}
                                                selected={false}
                                                onSelectRow={() => { }}
                                                onEdit={() => handleEditRow(row.name)}
                                                onDelete={() => handleDeleteClick(row.name)}
                                                onView={() => handleViewRow(row.name)}
                                                canEdit={permissions.write}
                                                canDelete={permissions.delete}
                                            />
                                        ))}

                                    {notFound && <TableNoData searchQuery={filterName} />}

                                    {empty && (
                                        <TableRow>
                                            <TableCell colSpan={6}>
                                                <EmptyContent
                                                    title="No deals found"
                                                    description="Create a new deal to track your sales pipeline."
                                                    icon="solar:hand-stars-bold-duotone"
                                                />
                                            </TableCell>
                                        </TableRow>
                                    )}

                                    {!empty && !loading && data.length < rowsPerPage && (
                                        <TableEmptyRows
                                            height={68}
                                            emptyRows={rowsPerPage - data.length}
                                        />
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Scrollbar>

                    <TablePagination
                        component="div"
                        page={page}
                        count={total}
                        rowsPerPage={rowsPerPage}
                        onPageChange={onChangePage}
                        rowsPerPageOptions={[5, 10, 25]}
                        onRowsPerPageChange={onChangeRowsPerPage}
                    />
                </Card>

                <DealDetailsDialog
                    open={openView}
                    onClose={() => {
                        setOpenView(false);
                        setCurrentDealId(null);
                    }}
                    dealId={currentDealId}
                />
            </DashboardContent>

            <ConfirmDialog
                open={confirmDelete.open}
                onClose={() => setConfirmDelete({ open: false, id: null })}
                title="Confirm Delete"
                content="Are you sure you want to delete this deal?"
                action={
                    <Button onClick={handleConfirmDelete} color="error" variant="contained" sx={{ borderRadius: 1.5, minWidth: 100 }}>
                        Delete
                    </Button>
                }
            />

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
}
