import { MuiTelInput } from 'mui-tel-input';
import { useState, useEffect, useCallback } from 'react';

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
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';

import { getFriendlyErrorMessage } from 'src/utils/error-handler';

import { DashboardContent } from 'src/layouts/dashboard';
import locationData from 'src/assets/data/location_data.json';
import { fetchAccounts, createAccount, updateAccount, deleteAccount, getAccountPermissions } from 'src/api/accounts';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { EmptyContent } from 'src/components/empty-content';
import { ConfirmDialog } from 'src/components/confirm-dialog';

import { TableNoData } from '../../user/table-no-data';
import { AccountTableRow } from '../account-table-row';
import { TableEmptyRows } from '../../user/table-empty-rows';
import { AccountImportDialog } from '../account-import-dialog';
import { UserTableHead as AccountTableHead } from '../../user/user-table-head';
import { AccountDetailsDialog } from '../../report/account/account-details-dialog';
import { UserTableToolbar as AccountTableToolbar } from '../../user/user-table-toolbar';

// ----------------------------------------------------------------------

export function AccountView() {
    const [accounts, setAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [filterName, setFilterName] = useState('');
    const [openCreate, setOpenCreate] = useState(false);
    const [openImport, setOpenImport] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [currentAccount, setCurrentAccount] = useState<any>(null);
    const [viewMode, setViewMode] = useState(false);
    const [openView, setOpenView] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState<{ open: boolean, id: string | null }>({ open: false, id: null });
    const [creating, setCreating] = useState(false);

    // Form state
    const [accountName, setAccountName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [website, setWebsite] = useState('');
    const [gstin, setGstin] = useState('');
    const [country, setCountry] = useState('');
    const [state, setState] = useState('');
    const [city, setCity] = useState('');

    const [countryOptions, setCountryOptions] = useState<string[]>([]);
    const [stateOptions, setStateOptions] = useState<string[]>([]);
    const [cityOptions, setCityOptions] = useState<string[]>([]);

    // Permissions
    const [permissions, setPermissions] = useState({ read: false, write: false, delete: false });

    // Snackbar state
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success',
    });

    // Validation State
    const [validationErrors, setValidationErrors] = useState<{ [key: string]: boolean }>({});

    const loadPermissions = useCallback(async () => {
        try {
            const perms = await getAccountPermissions();
            setPermissions(perms);
        } catch (error) {
            console.error('Failed to load permissions', error);
        }
    }, []);

    const loadAccounts = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchAccounts({
                page: page + 1,
                page_size: rowsPerPage,
                search: filterName,
            });
            setAccounts(data || []);
        } catch (error) {
            console.error('Failed to fetch accounts', error);
        } finally {
            setLoading(false);
        }
    }, [page, rowsPerPage, filterName]);

    useEffect(() => {
        loadPermissions();
    }, [loadPermissions]);

    useEffect(() => {
        loadAccounts();
    }, [loadAccounts]);

    useEffect(() => {
        // Populate Country Options from local JSON (remove duplicates)
        const countries = Array.from(new Set(locationData.map((c: any) => c.country)));
        setCountryOptions(["", ...countries]);
    }, []);

    // Fetch States when Country changes
    useEffect(() => {
        if (country) {
            const countryData = locationData.find((c: any) => c.country === country);
            if (countryData) {
                const states = countryData.states.map((s: any) => s.name);
                setStateOptions(["", ...states, "Others"]);
            } else {
                setStateOptions([]);
            }
        } else {
            setStateOptions([]);
            setCityOptions([]);
        }
    }, [country]);

    // Fetch Cities when State changes
    useEffect(() => {
        if (state && country) {
            if (state === 'Others') {
                setCityOptions(['Others']);
            } else {
                const countryData = locationData.find((c: any) => c.country === country);
                if (countryData) {
                    const stateData = countryData.states.find((s: any) => s.name === state);
                    if (stateData) {
                        setCityOptions(["", ...stateData.cities, "Others"]);
                    } else {
                        setCityOptions(["Others"]);
                    }
                }
            }
        } else {
            setCityOptions([]);
        }
    }, [state, country]);

    const handleOpenCreate = () => {
        setIsEdit(false);
        setViewMode(false);
        setCurrentAccount(null);
        setAccountName('');
        setPhoneNumber('');
        setWebsite('');
        setGstin('');
        setCountry('');
        setState('');
        setCity('');
        setOpenCreate(true);
    };

    const handleCloseCreate = () => {
        setOpenCreate(false);
        setValidationErrors({}); // Clear errors
        setIsEdit(false);
        setViewMode(false);
        setCurrentAccount(null);
        setAccountName('');
        setPhoneNumber('');
        setWebsite('');
        setGstin('');
        setCountry('');
        setState('');
        setCity('');
    };

    const handleOpenImport = () => {
        setOpenImport(true);
    };

    const handleCloseImport = () => {
        setOpenImport(false);
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const handleDeleteRow = useCallback((id: string) => {
        setConfirmDelete({ open: true, id });
    }, []);

    const handleConfirmDelete = async () => {
        if (!confirmDelete.id) return;
        try {
            await deleteAccount(confirmDelete.id);
            setSnackbar({ open: true, message: 'Account deleted successfully', severity: 'success' });
            loadAccounts();
        } catch (error: any) {
            setSnackbar({ open: true, message: error.message || 'Failed to delete account', severity: 'error' });
        } finally {
            setConfirmDelete({ open: false, id: null });
        }
    };

    const handleCreate = async () => {

        // Validation
        const newErrors: { [key: string]: boolean } = {};
        const missingFields: string[] = [];

        if (!accountName) {
            newErrors.accountName = true;
            missingFields.push('Account Name');
        }
        if (!phoneNumber) {
            newErrors.phoneNumber = true;
            missingFields.push('Phone Number');
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

        // Clear errors if validation passes
        setValidationErrors({});

        // Format phone number: remove spaces and add hyphen after dial code (e.g., +91-9876543210)
        let formattedPhone = phoneNumber.replace(/\s/g, '');
        const parts = phoneNumber.trim().split(/\s+/);
        if (parts.length > 1 && parts[0].startsWith('+')) {
            formattedPhone = `${parts[0]}-${parts.slice(1).join('')}`;
        }

        const data = {
            account_name: accountName,
            phone_number: formattedPhone,
            website,
            gstin,
            country,
            state,
            city,
        };

        try {
            setCreating(true);
            if (isEdit && currentAccount) {
                await updateAccount(currentAccount.name, data);
                setSnackbar({ open: true, message: 'Account updated successfully', severity: 'success' });
            } else {
                await createAccount(data);
                setSnackbar({ open: true, message: 'Account created successfully', severity: 'success' });
            }
            handleCloseCreate();
            loadAccounts();
        } catch (error: any) {
            const friendlyMsg = getFriendlyErrorMessage(error);
            setSnackbar({ open: true, message: friendlyMsg, severity: 'error' });
        } finally {
            setCreating(false);
        }
    };

    const cleanPhoneNumber = (val: string) => {
        if (!val) return '';
        // If it contains a hyphen after the plus and dial code, replace it with a space for MuiTelInput
        // e.g., +91-9876543210 -> +91 9876543210
        if (val.startsWith('+') && val.includes('-')) {
            return val.replace('-', ' ');
        }
        return val;
    };

    const handleEditRow = useCallback((row: any) => {
        setCurrentAccount(row);
        setValidationErrors({}); // Clear errors
        setAccountName(row.account_name || '');
        setPhoneNumber(cleanPhoneNumber(row.phone_number || ''));
        setWebsite(row.website || '');
        setGstin(row.gstin || '');
        setCountry(row.country || '');
        setState(row.state || '');
        setCity(row.city || '');
        setIsEdit(true);
        setViewMode(false);
        setOpenCreate(true);
    }, []);

    const handleViewRow = useCallback((row: any) => {
        setCurrentAccount(row);
        setOpenView(true);
    }, []);

    const onChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const onChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleFilterByName = (event: React.ChangeEvent<HTMLInputElement>) => {
        setFilterName(event.target.value);
        setPage(0);
    };

    const notFound = !loading && !accounts.length && !!filterName;
    const empty = !loading && !accounts.length && !filterName;

    return (
        <DashboardContent>
            <Box display="flex" alignItems="center" mb={5}>
                <Typography variant="h4" flexGrow={1}>
                    Accounts
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    {permissions.write && (
                        <Button
                            variant="outlined"
                            startIcon={<Iconify icon={"solar:import-bold-duotone" as any} />}
                            onClick={handleOpenImport}
                            sx={{ color: '#08a3cd', borderColor: '#08a3cd', '&:hover': { borderColor: '#068fb3', bgcolor: 'rgba(8, 163, 205, 0.04)' } }}
                        >
                            Import
                        </Button>
                    )}
                    {permissions.write && (
                        <Button
                            variant="contained"
                            startIcon={<Iconify icon="mingcute:add-line" />}
                            onClick={handleOpenCreate}
                            sx={{ bgcolor: '#08a3cd', color: 'common.white', '&:hover': { bgcolor: '#068fb3' } }}
                        >
                            New Account
                        </Button>
                    )}
                </Box>
            </Box>

            <Card>
                <AccountTableToolbar
                    numSelected={0}
                    filterName={filterName}
                    onFilterName={handleFilterByName}
                    searchPlaceholder="Search accounts..."
                />

                <Scrollbar>
                    <TableContainer sx={{ overflow: 'unset' }}>
                        <Table sx={{ minWidth: 800 }}>
                            <AccountTableHead
                                order="desc"
                                orderBy="creation"
                                rowCount={accounts.length}
                                numSelected={0}
                                onSort={() => { }}
                                onSelectAllRows={() => { }}
                                headLabel={[
                                    { id: 'account_name', label: 'Account Name' },
                                    { id: 'phone_number', label: 'Phone Number' },
                                    { id: 'gstin', label: 'GSTIN' },
                                    { id: 'city', label: 'City' },
                                    { id: 'state', label: 'State' },
                                    { id: 'country', label: 'Country' },
                                    { id: 'website', label: 'Website' },
                                    { id: '', label: '' },
                                ]}
                            />
                            <TableBody>
                                {loading && (
                                    <TableEmptyRows height={68} emptyRows={rowsPerPage} />
                                )}

                                {!loading && accounts.map((row) => (
                                    <AccountTableRow
                                        key={row.name}
                                        row={{
                                            id: row.name,
                                            account_name: row.account_name,
                                            phone_number: row.phone_number,
                                            website: row.website,
                                            gstin: row.gstin,
                                            city: row.city,
                                            state: row.state,
                                            country: row.country,
                                        }}
                                        selected={false}
                                        onSelectRow={() => { }}
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
                                        <TableCell colSpan={8}>
                                            <EmptyContent
                                                title="No accounts found"
                                                description="Create your first account to start managing your business relationships."
                                                icon="solar:buildings-bold-duotone"
                                            />
                                        </TableCell>
                                    </TableRow>
                                )}

                                {!empty && (
                                    <TableEmptyRows
                                        height={68}
                                        emptyRows={Math.max(0, rowsPerPage - accounts.length)}
                                    />
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Scrollbar>

                <TablePagination
                    component="div"
                    page={page}
                    count={accounts.length}
                    rowsPerPage={rowsPerPage}
                    onPageChange={onChangePage}
                    rowsPerPageOptions={[5, 10, 25]}
                    onRowsPerPageChange={onChangeRowsPerPage}
                />
            </Card>

            <Dialog open={openCreate} onClose={handleCloseCreate} fullWidth maxWidth="sm">
                <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {viewMode ? 'Account Details' : isEdit ? 'Edit Account' : 'New Account'}
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
                            label="Account Name"
                            name="account_name"
                            value={accountName}
                            onChange={(e) => {
                                setAccountName(e.target.value);
                                if (e.target.value) setValidationErrors(prev => ({ ...prev, accountName: false }));
                            }}
                            required
                            error={!!validationErrors.accountName}
                            disabled={viewMode}
                            placeholder="e.g. Acme Corp"
                        />

                        <MuiTelInput
                            fullWidth
                            defaultCountry="IN"
                            label="Phone Number"
                            name="phone_number"
                            value={phoneNumber}
                            disabled={viewMode}
                            onChange={(val) => {
                                setPhoneNumber(val);
                                if (val) setValidationErrors(prev => ({ ...prev, phoneNumber: false }));
                            }}
                            required
                            error={!!validationErrors.phoneNumber}
                            sx={{
                                '& .MuiInputBase-input.Mui-disabled': {
                                    WebkitTextFillColor: 'inherit',
                                    color: 'inherit',
                                },
                            }}
                        />

                        <TextField
                            fullWidth
                            label="GSTIN"
                            name="gstin"
                            value={gstin}
                            onChange={(e) => setGstin(e.target.value)}
                            disabled={viewMode}
                            placeholder="e.g. 22AAAAA0000A1Z5"
                        />

                        <TextField
                            select
                            fullWidth
                            label="Country"
                            name="country"
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            disabled={viewMode}
                            SelectProps={{ native: true }}
                            InputLabelProps={{ shrink: true }}
                            sx={{
                                "& .MuiInputBase-input.Mui-disabled": {
                                    WebkitTextFillColor: "inherit",
                                    color: "inherit",
                                },
                            }}
                        >
                            <option value="" disabled>Select</option>
                            {countryOptions.map((option: string) => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </TextField>

                        <TextField
                            select
                            fullWidth
                            label="State"
                            name="state"
                            value={state}
                            onChange={(e) => setState(e.target.value)}
                            disabled={viewMode || !country}
                            SelectProps={{ native: true }}
                            InputLabelProps={{ shrink: true }}
                            sx={{
                                "& .MuiInputBase-input.Mui-disabled": {
                                    WebkitTextFillColor: "inherit",
                                    color: "inherit",
                                },
                            }}
                        >
                            <option value="" disabled>Select</option>
                            {stateOptions.map((option: string) => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </TextField>

                        <TextField
                            select
                            fullWidth
                            label="City"
                            name="city"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            disabled={viewMode || !state}
                            SelectProps={{ native: true }}
                            InputLabelProps={{ shrink: true }}
                            sx={{
                                "& .MuiInputBase-input.Mui-disabled": {
                                    WebkitTextFillColor: "inherit",
                                    color: "inherit",
                                },
                            }}
                        >
                            <option value="" disabled>Select</option>
                            {cityOptions.map((option: string) => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </TextField>

                        <TextField
                            fullWidth
                            label="Website"
                            name="website"
                            value={website}
                            onChange={(e) => setWebsite(e.target.value)}
                            disabled={viewMode}
                            placeholder="e.g. https://www.acme.com"
                            sx={{ gridColumn: { sm: 'span 2' } }}
                        />
                    </Box>
                </DialogContent>

                <DialogActions>

                    {!viewMode && (
                        <Button variant="contained" onClick={handleCreate} disabled={creating}>
                            {creating ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update' : 'Create')}
                        </Button>
                    )}
                </DialogActions>
            </Dialog>

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

            <AccountImportDialog
                open={openImport}
                onClose={handleCloseImport}
                onRefresh={loadAccounts}
            />

            <AccountDetailsDialog
                open={openView}
                onClose={() => {
                    setOpenView(false);
                    setCurrentAccount(null);
                }}
                accountId={currentAccount?.name}
            />

            <ConfirmDialog
                open={confirmDelete.open}
                onClose={() => setConfirmDelete({ open: false, id: null })}
                title="Confirm Delete"
                content="Are you sure you want to delete this account?"
                action={
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleConfirmDelete}
                        sx={{ borderRadius: 1.5, minWidth: 100 }}
                    >
                        Delete
                    </Button>
                }
            />
        </DashboardContent>
    );
}
