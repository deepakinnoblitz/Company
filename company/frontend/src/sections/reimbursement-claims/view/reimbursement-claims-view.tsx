import dayjs from 'dayjs';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Select from '@mui/material/Select';
import Snackbar from '@mui/material/Snackbar';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TextField from '@mui/material/TextField';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

import { useReimbursementClaims } from 'src/hooks/useReimbursementClaims';

import { fetchEmployees } from 'src/api/hr-management';
import { DashboardContent } from 'src/layouts/dashboard';
import {
    getReimbursementClaim,
    createReimbursementClaim,
    updateReimbursementClaim,
    deleteReimbursementClaim,
    getReimbursementClaimPermissions,
} from 'src/api/reimbursement-claims';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { EmptyContent } from 'src/components/empty-content';

import { TableNoData } from 'src/sections/user/table-no-data';
import { TableEmptyRows } from 'src/sections/user/table-empty-rows';
import { UserTableHead as ClaimTableHead } from 'src/sections/user/user-table-head';
import { UserTableToolbar as ClaimTableToolbar } from 'src/sections/user/user-table-toolbar';
import { ReimbursementClaimTableRow } from 'src/sections/reimbursement-claims/reimbursement-claims-table-row';
import { ReimbursementClaimDetailsDialog } from 'src/sections/report/reimbursement-claims/reimbursement-claims-details-dialog';

// ----------------------------------------------------------------------

export function ReimbursementClaimsView() {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [filterName, setFilterName] = useState('');
    const [order, setOrder] = useState<'asc' | 'desc'>('desc');
    const [orderBy, setOrderBy] = useState('date_of_expense');
    const [selected, setSelected] = useState<string[]>([]);

    const { data, total, refetch } = useReimbursementClaims(
        page + 1,
        rowsPerPage,
        filterName,
        orderBy,
        order
    );

    const [openCreate, setOpenCreate] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [currentClaim, setCurrentClaim] = useState<any>(null);

    // View state
    const [openView, setOpenView] = useState(false);
    const [viewClaim, setViewClaim] = useState<any>(null);

    // Form state
    const [employee, setEmployee] = useState('');
    const [claimType, setClaimType] = useState('');
    const [dateOfExpense, setDateOfExpense] = useState('');
    const [amount, setAmount] = useState('');
    const [claimDetails, setClaimDetails] = useState('');

    // Employees for dropdown
    const [employees, setEmployees] = useState<any[]>([]);

    // Permissions
    const [permissions, setPermissions] = useState({ read: false, write: false, delete: false });

    // Snackbar
    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        severity: 'success' | 'error';
    }>({
        open: false,
        message: '',
        severity: 'success',
    });

    // Load permissions and employees
    useEffect(() => {
        getReimbursementClaimPermissions().then(setPermissions);
        fetchEmployees({ page: 1, page_size: 1000, search: '' }).then((res) => {
            setEmployees(res.data || []);
        });
    }, []);

    const handleSort = (property: string) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const handleSelectAllRows = (checked: boolean) => {
        if (checked) {
            setSelected(data.map((row) => row.name));
        } else {
            setSelected([]);
        }
    };

    const handleSelectRow = (name: string) => {
        setSelected((prev) =>
            prev.includes(name) ? prev.filter((id) => id !== name) : [...prev, name]
        );
    };

    const handleBulkDelete = async () => {
        try {
            await Promise.all(selected.map((name) => deleteReimbursementClaim(name)));
            setSnackbar({
                open: true,
                message: `${selected.length} claim(s) deleted successfully`,
                severity: 'success',
            });
            setSelected([]);
            refetch();
        } catch (error: any) {
            setSnackbar({
                open: true,
                message: error.message || 'Failed to delete claims',
                severity: 'error',
            });
        }
    };

    const handleOpenCreate = () => {
        setIsEdit(false);
        setCurrentClaim(null);
        setEmployee('');
        setClaimType('');
        setDateOfExpense('');
        setAmount('');
        setClaimDetails('');
        setOpenCreate(true);
    };

    const handleCloseCreate = () => {
        setOpenCreate(false);
        setIsEdit(false);
        setCurrentClaim(null);
        setEmployee('');
        setClaimType('');
        setDateOfExpense('');
        setAmount('');
        setClaimDetails('');
    };

    const handleEditRow = useCallback(async (row: any) => {
        try {
            const fullData = await getReimbursementClaim(row.name);
            setCurrentClaim(fullData);
            setEmployee(fullData.employee || '');
            setClaimType(fullData.claim_type || '');
            setDateOfExpense(fullData.date_of_expense || '');
            setAmount(fullData.amount?.toString() || '');
            setClaimDetails(fullData.claim_details || '');
            setIsEdit(true);
            setOpenCreate(true);
        } catch (error: any) {
            setSnackbar({
                open: true,
                message: error.message || 'Failed to load claim',
                severity: 'error',
            });
        }
    }, []);

    const handleViewRow = useCallback(async (row: any) => {
        try {
            const fullData = await getReimbursementClaim(row.name);
            setViewClaim(fullData);
            setOpenView(true);
        } catch (error: any) {
            setSnackbar({
                open: true,
                message: error.message || 'Failed to load claim',
                severity: 'error',
            });
        }
    }, []);

    const handleDeleteRow = useCallback(
        async (name: string) => {
            try {
                await deleteReimbursementClaim(name);
                setSnackbar({
                    open: true,
                    message: 'Claim deleted successfully',
                    severity: 'success',
                });
                refetch();
            } catch (error: any) {
                setSnackbar({
                    open: true,
                    message: error.message || 'Failed to delete claim',
                    severity: 'error',
                });
            }
        },
        [refetch]
    );

    const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const claimData = {
            employee: employee.trim(),
            claim_type: claimType.trim(),
            date_of_expense: dateOfExpense,
            amount: parseFloat(amount) || 0,
            claim_details: claimDetails.trim(),
        };

        try {
            if (isEdit && currentClaim) {
                await updateReimbursementClaim(currentClaim.name, claimData);
                setSnackbar({
                    open: true,
                    message: 'Claim updated successfully',
                    severity: 'success',
                });
            } else {
                await createReimbursementClaim(claimData);
                setSnackbar({
                    open: true,
                    message: 'Claim created successfully',
                    severity: 'success',
                });
            }
            handleCloseCreate();
            refetch();
        } catch (error: any) {
            setSnackbar({
                open: true,
                message: error.message || 'Operation failed',
                severity: 'error',
            });
        }
    };

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleFilterByName = (event: React.ChangeEvent<HTMLInputElement>) => {
        setFilterName(event.target.value);
        setPage(0);
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const notFound = !data.length && !!filterName;
    const empty = !data.length && !filterName;

    return (
        <DashboardContent>
            <Box sx={{ mb: 5, display: 'flex', alignItems: 'center' }}>
                <Typography variant="h4" sx={{ flexGrow: 1 }}>
                    Reimbursement Claims
                </Typography>

                {permissions.write && (
                    <Button
                        variant="contained"
                        startIcon={<Iconify icon="mingcute:add-line" />}
                        onClick={handleOpenCreate}
                        sx={{
                            bgcolor: '#08a3cd',
                            color: 'common.white',
                            '&:hover': { bgcolor: '#068fb3' },
                        }}
                    >
                        New Claim
                    </Button>
                )}
            </Box>

            <Card>
                <ClaimTableToolbar
                    numSelected={selected.length}
                    filterName={filterName}
                    onFilterName={handleFilterByName}
                    searchPlaceholder="Search claims..."
                    onDelete={selected.length > 0 ? handleBulkDelete : undefined}
                />

                <Scrollbar>
                    <TableContainer sx={{ overflow: 'unset' }}>
                        <Table sx={{ minWidth: 800 }}>
                            <ClaimTableHead
                                order={order}
                                orderBy={orderBy}
                                rowCount={data.length}
                                numSelected={selected.length}
                                onSort={handleSort}
                                onSelectAllRows={(checked: boolean) => handleSelectAllRows(checked)}
                                headLabel={[
                                    { id: 'employee_name', label: 'Employee' },
                                    { id: 'claim_type', label: 'Claim Type' },
                                    { id: 'date_of_expense', label: 'Date' },
                                    { id: 'amount', label: 'Amount' },
                                    { id: 'paid', label: 'Status' },
                                    { id: '', label: '' },
                                ]}
                            />
                            <TableBody>
                                {data.map((row) => (
                                    <ReimbursementClaimTableRow
                                        key={row.name}
                                        row={{
                                            id: row.name,
                                            employee_name: row.employee_name,
                                            claim_type: row.claim_type,
                                            date_of_expense: row.date_of_expense,
                                            amount: row.amount,
                                            paid: row.paid,
                                        }}
                                        selected={selected.includes(row.name)}
                                        onSelectRow={() => handleSelectRow(row.name)}
                                        onView={() => handleViewRow(row)}
                                        onEdit={() => handleEditRow(row)}
                                        onDelete={() => handleDeleteRow(row.name)}
                                        canEdit={permissions.write}
                                        canDelete={permissions.delete}
                                    />
                                ))}

                                {notFound && <TableNoData searchQuery={filterName} />}

                                {empty && (
                                    <TableRow>
                                        <TableCell colSpan={6}>
                                            <EmptyContent
                                                title="No claims found"
                                                description="You haven't submitted any reimbursement claims yet."
                                                icon="solar:money-bag-bold-duotone"
                                            />
                                        </TableCell>
                                    </TableRow>
                                )}

                                {!empty && (
                                    <TableEmptyRows
                                        height={68}
                                        emptyRows={Math.max(0, rowsPerPage - data.length)}
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
                    onPageChange={handleChangePage}
                    rowsPerPageOptions={[5, 10, 25]}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </Card>

            {/* Create/Edit Dialog */}
            <Dialog open={openCreate} onClose={handleCloseCreate} fullWidth maxWidth="sm">
                <form onSubmit={handleCreate}>
                    <DialogTitle
                        sx={{
                            m: 0,
                            p: 2,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}
                    >
                        {isEdit ? 'Edit Claim' : 'New Claim'}
                        <IconButton onClick={handleCloseCreate}>
                            <Iconify icon="mingcute:close-line" />
                        </IconButton>
                    </DialogTitle>

                    <DialogContent dividers>
                        <Box sx={{ display: 'grid', gap: 3, margin: '1rem' }}>
                            <FormControl fullWidth required>
                                <InputLabel>Employee</InputLabel>
                                <Select
                                    value={employee}
                                    onChange={(e) => setEmployee(e.target.value)}
                                    label="Employee"
                                >
                                    {employees.map((emp) => (
                                        <MenuItem key={emp.name} value={emp.name}>
                                            {emp.employee_name} ({emp.employee_id})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <TextField
                                fullWidth
                                label="Claim Type"
                                value={claimType}
                                onChange={(e) => setClaimType(e.target.value)}
                                required
                                placeholder="e.g., Travel, Medical, Food"
                            />

                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    label="Date of Expense"
                                    value={dateOfExpense ? dayjs(dateOfExpense) : null}
                                    onChange={(newValue) => setDateOfExpense(newValue?.format('YYYY-MM-DD') || '')}
                                    slotProps={{
                                        textField: {
                                            fullWidth: true,
                                            required: true,
                                            InputLabelProps: { shrink: true },
                                        },
                                    }}
                                />
                            </LocalizationProvider>

                            <TextField
                                fullWidth
                                label="Amount"
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                required
                                placeholder="Enter amount"
                                inputProps={{ step: '0.01', min: '0' }}
                            />

                            <TextField
                                fullWidth
                                label="Claim Details"
                                value={claimDetails}
                                onChange={(e) => setClaimDetails(e.target.value)}
                                multiline
                                rows={4}
                                placeholder="Enter claim details"
                            />
                        </Box>
                    </DialogContent>

                    <DialogActions>
                        <Button type="submit" variant="contained">
                            {isEdit ? 'Update' : 'Create'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* View Dialog */}
            <ReimbursementClaimDetailsDialog
                open={openView}
                onClose={() => setOpenView(false)}
                claim={viewClaim}
            />

            {/* Snackbar */}
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
        </DashboardContent>
    );
}
