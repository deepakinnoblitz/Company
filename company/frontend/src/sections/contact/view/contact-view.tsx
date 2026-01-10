import { MuiTelInput } from 'mui-tel-input';
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
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';

import { useContacts } from 'src/hooks/useContacts';

import { getFriendlyErrorMessage } from 'src/utils/error-handler';

import { getDoctypeList } from 'src/api/leads';
import { DashboardContent } from 'src/layouts/dashboard';
import locationData from 'src/assets/data/location_data.json';
import { createContact, updateContact, deleteContact, getContactPermissions } from 'src/api/contacts';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { EmptyContent } from 'src/components/empty-content';
import { ConfirmDialog } from 'src/components/confirm-dialog';

import { TableNoData } from '../../user/table-no-data';
import { ContactTableRow } from '../contact-table-row';
import { TableEmptyRows } from '../../user/table-empty-rows';
import { ContactImportDialog } from '../contact-import-dialog';
import { UserTableHead as ContactTableHead } from '../../user/user-table-head';
import { ContactDetailsDialog } from '../../report/contact/contact-details-dialog';
import { UserTableToolbar as ContactTableToolbar } from '../../user/user-table-toolbar';

// ----------------------------------------------------------------------

export function ContactView() {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [filterName, setFilterName] = useState('');

    const [openCreate, setOpenCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [currentContactId, setCurrentContactId] = useState<string | null>(null);
    const [viewOnly, setViewOnly] = useState(false);
    const [openView, setOpenView] = useState(false);
    const [openImport, setOpenImport] = useState(false);

    // Form state
    const [firstName, setFirstName] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [designation, setDesignation] = useState('');
    const [address, setAddress] = useState('');
    const [notes, setNotes] = useState('');
    const [country, setCountry] = useState('');
    const [state, setState] = useState('');
    const [city, setCity] = useState('');
    const [contactType, setContactType] = useState('Customer');
    const [sourceLead, setSourceLead] = useState('');

    const [countryOptions, setCountryOptions] = useState<string[]>([]);
    const [stateOptions, setStateOptions] = useState<string[]>([]);
    const [cityOptions, setCityOptions] = useState<string[]>([]);
    const [leadOptions, setLeadOptions] = useState<{ name: string; lead_name: string }[]>([]);

    // Alert & Dialog State
    const [openDelete, setOpenDelete] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
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

    const { data, total, loading, refetch } = useContacts(
        page + 1,
        rowsPerPage,
        filterName
    );

    useEffect(() => {
        getContactPermissions().then(setPermissions);

        // Populate Country Options from local JSON (remove duplicates)
        const countries = Array.from(new Set(locationData.map((c: any) => c.country)));
        setCountryOptions(["", ...countries]);

        // Fetch Leads for dropdown
        getDoctypeList('Lead', ['name', 'lead_name']).then(setLeadOptions).catch(console.error);
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

    // Validation State
    const [validationErrors, setValidationErrors] = useState<{ [key: string]: boolean }>({});

    const handleOpenCreate = () => {
        setViewOnly(false);
        setOpenCreate(true);
    };

    const handleCloseCreate = () => {
        setOpenCreate(false);
        setValidationErrors({}); // Clear errors
        setCurrentContactId(null);
        setViewOnly(false);
        setFirstName('');
        setCompanyName('');
        setEmail('');
        setPhone('');
        setDesignation('');
        setAddress('');
        setNotes('');
        setCountry('');
        setState('');
        setCity('');
        setContactType('Customer');
        setSourceLead('');
    };

    const handleCloseSnackbar = () => {
        setSnackbar((prev) => ({ ...prev, open: false }));
    };

    const handleDeleteClick = (id: string) => {
        setDeleteId(id);
        setOpenDelete(true);
    };

    const handleConfirmDelete = async () => {
        if (!deleteId) return;
        try {
            await deleteContact(deleteId);
            setSnackbar({ open: true, message: 'Contact deleted successfully', severity: 'success' });
            await refetch();
        } catch (e) {
            console.error(e);
            setSnackbar({ open: true, message: 'Failed to delete contact', severity: 'error' });
        } finally {
            setOpenDelete(false);
            setDeleteId(null);
        }
    };

    const handleCreate = async () => {
        // Validation
        const newErrors: { [key: string]: boolean } = {};
        const missingFields: string[] = [];

        if (!firstName) {
            newErrors.firstName = true;
            missingFields.push('Name');
        }
        if (!email) {
            newErrors.email = true;
            missingFields.push('Email');
        }
        if (!phone) {
            newErrors.phone = true;
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

        try {
            setCreating(true);

            // Format phone number: remove spaces and add hyphen after dial code (e.g., +91-9876543210)
            let formattedPhone = phone.replace(/\s/g, '');
            const parts = phone.trim().split(/\s+/);
            if (parts.length > 1 && parts[0].startsWith('+')) {
                formattedPhone = `${parts[0]}-${parts.slice(1).join('')}`;
            }

            const contactData = {
                first_name: firstName,
                company_name: companyName,
                email,
                phone: formattedPhone,
                designation,
                address,
                notes,
                country,
                state,
                city,
                contact_type: contactType,
                source_lead: sourceLead,
            };

            if (currentContactId) {
                await updateContact(currentContactId, contactData);
                setSnackbar({ open: true, message: 'Contact updated successfully', severity: 'success' });
            } else {
                await createContact(contactData);
                setSnackbar({ open: true, message: 'Contact created successfully', severity: 'success' });
            }

            await refetch();
            handleCloseCreate();
            await refetch();
            handleCloseCreate();
        } catch (err: any) {
            console.error(err);
            const friendlyMsg = getFriendlyErrorMessage(err);
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

    const handleEditRow = (id: string) => {
        setViewOnly(false);
        setValidationErrors({}); // Clear errors when opening edit
        setCurrentContactId(id);

        const fullRow = data.find((item: any) => item.name === id);
        if (fullRow) {
            setFirstName(fullRow.first_name || '');
            setCompanyName(fullRow.company_name || '');
            setEmail(fullRow.email || '');
            setPhone(cleanPhoneNumber(fullRow.phone || ''));
            setDesignation(fullRow.designation || '');
            setAddress(fullRow.address || '');
            setNotes(fullRow.notes || '');
            setCountry(fullRow.country || '');
            setState(fullRow.state || '');
            setCity(fullRow.city || '');
            setContactType(fullRow.contact_type || 'Customer');
            setSourceLead(fullRow.source_lead || '');
        }
        setOpenCreate(true);
    };

    const handleViewRow = (id: string) => {
        setCurrentContactId(id);
        setOpenView(true);
    };

    const onChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const onChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const notFound = !loading && !data.length && !!filterName;
    const empty = !loading && !data.length && !filterName;

    return (
        <DashboardContent>
            <Box sx={{ mb: 5, display: 'flex', alignItems: 'center' }}>
                <Typography variant="h4" sx={{ flexGrow: 1 }}>
                    Contacts
                </Typography>

                {permissions.write && (
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                            variant="outlined"
                            startIcon={<Iconify icon={"solar:import-bold-duotone" as any} />}
                            onClick={() => setOpenImport(true)}
                            sx={{ color: '#08a3cd', borderColor: '#08a3cd', '&:hover': { borderColor: '#068fb3', bgcolor: 'rgba(8, 163, 205, 0.04)' } }}
                        >
                            Import
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<Iconify icon="mingcute:add-line" />}
                            onClick={handleOpenCreate}
                            sx={{ bgcolor: '#08a3cd', color: 'common.white', '&:hover': { bgcolor: '#068fb3' } }}
                        >
                            New Contact
                        </Button>
                    </Box>
                )}
            </Box>

            <Card>
                <ContactTableToolbar
                    numSelected={0}
                    filterName={filterName}
                    onFilterName={(e) => {
                        setFilterName(e.target.value);
                        setPage(0);
                    }}
                    searchPlaceholder="Search contacts..."
                />

                <Scrollbar>
                    <TableContainer sx={{ overflow: 'unset' }}>
                        <Table sx={{ minWidth: 800 }}>
                            <ContactTableHead
                                order="asc"
                                orderBy="name"
                                rowCount={total}
                                numSelected={0}
                                onSort={() => { }}
                                onSelectAllRows={() => { }}
                                headLabel={[
                                    { id: 'name', label: 'Name' },
                                    { id: 'company', label: 'Company' },
                                    { id: 'city', label: 'City' },
                                    { id: 'state', label: 'State' },
                                    { id: 'country', label: 'Country' },
                                    { id: 'designation', label: 'Designation' },
                                    { id: 'sourceLead', label: 'Source Lead' },
                                    { id: 'phone', label: 'Phone' },
                                    { id: 'email', label: 'Email' },
                                    { id: '' },
                                ]}
                            />

                            <TableBody>
                                {loading && (
                                    <TableEmptyRows height={68} emptyRows={rowsPerPage} />
                                )}

                                {!loading && data.map((row) => (
                                    <ContactTableRow
                                        key={row.name}
                                        row={{
                                            id: row.name,
                                            firstName: row.first_name,
                                            companyName: row.company_name || '',
                                            email: row.email || '',
                                            phone: row.phone || '',
                                            designation: row.designation || '',
                                            avatarUrl: '/assets/images/avatar/avatar-25.webp',
                                            country: row.country,
                                            state: row.state,
                                            city: row.city,
                                            sourceLead: row.source_lead ? `${row.source_lead} - ${leadOptions.find(l => l.name === row.source_lead)?.lead_name || ''}` : '',
                                        }}
                                        selected={false}
                                        onSelectRow={() => { }}
                                        onView={() => handleViewRow(row.name)}
                                        onEdit={() => handleEditRow(row.name)}
                                        onDelete={() => handleDeleteClick(row.name)}
                                        canEdit={permissions.write}
                                        canDelete={permissions.delete}
                                    />
                                ))}

                                {notFound && <TableNoData searchQuery={filterName} />}

                                {empty && (
                                    <TableRow>
                                        <TableCell colSpan={10}>
                                            <EmptyContent
                                                title="No contacts found"
                                                description="Save your business contacts to keep track of your network."
                                                icon="solar:users-group-rounded-bold-duotone"
                                            />
                                        </TableCell>
                                    </TableRow>
                                )}

                                {!empty && (
                                    <TableEmptyRows height={68} emptyRows={rowsPerPage - data.length} />
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Scrollbar>

                <TablePagination
                    component="div"
                    count={total}
                    page={page}
                    rowsPerPage={rowsPerPage}
                    onPageChange={onChangePage}
                    rowsPerPageOptions={[5, 10, 25]}
                    onRowsPerPageChange={onChangeRowsPerPage}
                />
            </Card>

            {/* CREATE/EDIT DIALOG */}
            <Dialog open={openCreate} onClose={handleCloseCreate} fullWidth maxWidth="md">
                <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {viewOnly ? 'Contact Details' : (currentContactId ? 'Edit Contact' : 'New Contact')}
                    <IconButton onClick={handleCloseCreate} sx={{ color: (theme) => theme.palette.grey[500] }}>
                        <Iconify icon="mingcute:close-line" />
                    </IconButton>
                </DialogTitle>

                <DialogContent dividers>
                    <Box
                        display="grid"
                        margin={2}
                        gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }}
                        gap={3}
                    >
                        <TextField
                            fullWidth
                            label="Name"
                            value={firstName}
                            onChange={(e) => {
                                setFirstName(e.target.value);
                                if (e.target.value) setValidationErrors(prev => ({ ...prev, firstName: false }));
                            }}
                            required
                            error={!!validationErrors.firstName}
                            slotProps={{ input: { readOnly: viewOnly } }}
                        />
                        <TextField
                            fullWidth
                            label="Email"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                if (e.target.value) setValidationErrors(prev => ({ ...prev, email: false }));
                            }}
                            required
                            error={!!validationErrors.email}
                            slotProps={{ input: { readOnly: viewOnly } }}
                        />

                        <MuiTelInput
                            fullWidth
                            defaultCountry="IN"
                            label="Phone Number"
                            name="phone_number"
                            value={phone}
                            onChange={(newValue) => {
                                setPhone(newValue);
                                if (newValue) setValidationErrors(prev => ({ ...prev, phone: false }));
                            }}
                            required
                            error={!!validationErrors.phone}
                            disabled={viewOnly}
                            sx={{
                                '& .MuiInputBase-input.Mui-disabled': {
                                    WebkitTextFillColor: 'inherit',
                                    color: 'inherit',
                                },
                            }}
                        />

                        <TextField
                            fullWidth
                            label="Company Name"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            slotProps={{ input: { readOnly: viewOnly } }}
                        />
                        <TextField
                            select
                            fullWidth
                            label="Contact Type"
                            value={contactType}
                            onChange={(e) => setContactType(e.target.value)}
                            disabled={viewOnly}
                            SelectProps={{ native: true }}
                            InputLabelProps={{ shrink: true }}
                            sx={{
                                "& .MuiInputBase-input.Mui-disabled": {
                                    WebkitTextFillColor: "inherit",
                                    color: "inherit",
                                },
                            }}
                        >
                            <option value="Sales">Sales</option>
                            <option value="Purchase">Purchase</option>
                        </TextField>
                        <TextField
                            fullWidth
                            label="Designation"
                            value={designation}
                            onChange={(e) => setDesignation(e.target.value)}
                            slotProps={{ input: { readOnly: viewOnly } }}
                        />

                        <TextField
                            select
                            fullWidth
                            label="Country"
                            name="country"
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            disabled={viewOnly}
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
                            disabled={viewOnly || !country}
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
                            disabled={viewOnly || !state}
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
                            label="Address"
                            multiline
                            rows={2}
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            sx={{ gridColumn: 'span 2' }}
                            slotProps={{ input: { readOnly: viewOnly } }}
                        />
                        <TextField
                            fullWidth
                            label="Notes"
                            multiline
                            rows={3}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            sx={{ gridColumn: 'span 2' }}
                            slotProps={{ input: { readOnly: viewOnly } }}
                        />
                    </Box>
                </DialogContent>

                <DialogActions>
                    {!viewOnly && (
                        <Button variant="contained" onClick={handleCreate} disabled={creating}>
                            {creating ? 'Saving...' : (currentContactId ? 'Update Contact' : 'Create Contact')}
                        </Button>
                    )}
                </DialogActions>
            </Dialog>

            {/* DELETE CONFIRMATION */}
            <ConfirmDialog
                open={openDelete}
                onClose={() => setOpenDelete(false)}
                title="Confirm Delete"
                content="Are you sure you want to delete this contact?"
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

            <ContactImportDialog
                open={openImport}
                onClose={() => setOpenImport(false)}
                onRefresh={refetch}
            />

            <ContactDetailsDialog
                open={openView}
                onClose={() => {
                    setOpenView(false);
                    setCurrentContactId(null);
                }}
                contactId={currentContactId}
            />
        </DashboardContent>
    );
}
