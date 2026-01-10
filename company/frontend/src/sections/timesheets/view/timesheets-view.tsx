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
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
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

import { useTimesheets } from 'src/hooks/useTimesheets';

import { fetchEmployees } from 'src/api/hr-management';
import { DashboardContent } from 'src/layouts/dashboard';
import { getTimesheet, createTimesheet, updateTimesheet, deleteTimesheet, getTimesheetPermissions } from 'src/api/timesheets';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { EmptyContent } from 'src/components/empty-content';

import { TableNoData } from 'src/sections/user/table-no-data';
import { TableEmptyRows } from 'src/sections/user/table-empty-rows';
import { TimesheetTableRow } from 'src/sections/timesheets/timesheets-table-row';
import { UserTableHead as TimesheetTableHead } from 'src/sections/user/user-table-head';
import { UserTableToolbar as TimesheetTableToolbar } from 'src/sections/user/user-table-toolbar';
import { TimesheetDetailsDialog } from 'src/sections/report/timesheets/timesheets-details-dialog';

// ----------------------------------------------------------------------

interface TimesheetEntry {
    idx?: number;
    project: string;
    activity_type: string;
    hours: number;
    description: string;
}

export function TimesheetsView() {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [filterName, setFilterName] = useState('');
    const [order, setOrder] = useState<'asc' | 'desc'>('desc');
    const [orderBy, setOrderBy] = useState('timesheet_date');
    const [selected, setSelected] = useState<string[]>([]);

    const { data, total, refetch } = useTimesheets(page + 1, rowsPerPage, filterName, orderBy, order);

    const [openCreate, setOpenCreate] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [currentTimesheet, setCurrentTimesheet] = useState<any>(null);

    // View state
    const [openView, setOpenView] = useState(false);
    const [viewTimesheet, setViewTimesheet] = useState<any>(null);

    // Form state
    const [employee, setEmployee] = useState('');
    const [timesheetDate, setTimesheetDate] = useState('');
    const [notes, setNotes] = useState('');
    const [entries, setEntries] = useState<TimesheetEntry[]>([]);

    // Entry dialog state
    const [openEntryDialog, setOpenEntryDialog] = useState(false);
    const [editingEntryIndex, setEditingEntryIndex] = useState<number | null>(null);
    const [entryProject, setEntryProject] = useState('');
    const [entryActivityType, setEntryActivityType] = useState('');
    const [entryHours, setEntryHours] = useState('');
    const [entryDescription, setEntryDescription] = useState('');

    // Employees for dropdown
    const [employees, setEmployees] = useState<any[]>([]);

    // Permissions
    const [permissions, setPermissions] = useState({ read: false, write: false, delete: false });

    // Snackbar
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success',
    });

    // Load permissions and employees
    useEffect(() => {
        getTimesheetPermissions().then(setPermissions);
        fetchEmployees({ page: 1, page_size: 1000, search: '' }).then((res) => {
            setEmployees(res.data || []);
        });
    }, []);

    // Calculate total hours whenever entries change
    const totalHours = entries.reduce((sum, entry) => sum + (entry.hours || 0), 0);

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
            await Promise.all(selected.map((name) => deleteTimesheet(name)));
            setSnackbar({ open: true, message: `${selected.length} timesheet(s) deleted successfully`, severity: 'success' });
            setSelected([]);
            refetch();
        } catch (error: any) {
            setSnackbar({ open: true, message: error.message || 'Failed to delete timesheets', severity: 'error' });
        }
    };

    const handleOpenCreate = () => {
        setIsEdit(false);
        setCurrentTimesheet(null);
        setEmployee('');
        setTimesheetDate('');
        setNotes('');
        setEntries([]);
        setOpenCreate(true);
    };

    const handleCloseCreate = () => {
        setOpenCreate(false);
        setIsEdit(false);
        setCurrentTimesheet(null);
        setEmployee('');
        setTimesheetDate('');
        setNotes('');
        setEntries([]);
    };

    const handleEditRow = useCallback(async (row: any) => {
        try {
            // Fetch full timesheet data with child tables
            const fullData = await getTimesheet(row.name);
            setCurrentTimesheet(fullData);
            setEmployee(fullData.employee || '');
            setTimesheetDate(fullData.timesheet_date || '');
            setNotes(fullData.notes || '');
            setEntries(fullData.timesheet_entries || []);
            setIsEdit(true);
            setOpenCreate(true);
        } catch (error: any) {
            setSnackbar({ open: true, message: error.message || 'Failed to load timesheet', severity: 'error' });
        }
    }, []);

    const handleViewRow = useCallback(async (row: any) => {
        try {
            // Fetch full timesheet data with child tables
            const fullData = await getTimesheet(row.name);
            setViewTimesheet(fullData);
            setOpenView(true);
        } catch (error: any) {
            setSnackbar({ open: true, message: error.message || 'Failed to load timesheet', severity: 'error' });
        }
    }, []);

    const handleDeleteRow = useCallback(
        async (name: string) => {
            try {
                await deleteTimesheet(name);
                setSnackbar({ open: true, message: 'Timesheet deleted successfully', severity: 'success' });
                refetch();
            } catch (error: any) {
                setSnackbar({ open: true, message: error.message || 'Failed to delete timesheet', severity: 'error' });
            }
        },
        [refetch]
    );

    // Entry management functions
    const handleOpenEntryDialog = () => {
        setEditingEntryIndex(null);
        setEntryProject('');
        setEntryActivityType('');
        setEntryHours('');
        setEntryDescription('');
        setOpenEntryDialog(true);
    };

    const handleEditEntry = (index: number) => {
        const entry = entries[index];
        setEditingEntryIndex(index);
        setEntryProject(entry.project);
        setEntryActivityType(entry.activity_type);
        setEntryHours(entry.hours.toString());
        setEntryDescription(entry.description);
        setOpenEntryDialog(true);
    };

    const handleDeleteEntry = (index: number) => {
        setEntries((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSaveEntry = () => {
        const newEntry: TimesheetEntry = {
            project: entryProject,
            activity_type: entryActivityType,
            hours: parseFloat(entryHours) || 0,
            description: entryDescription,
        };

        if (editingEntryIndex !== null) {
            setEntries((prev) => prev.map((entry, i) => (i === editingEntryIndex ? newEntry : entry)));
        } else {
            setEntries((prev) => [...prev, newEntry]);
        }

        setOpenEntryDialog(false);
    };

    const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const timesheetData = {
            employee: employee.trim(),
            timesheet_date: timesheetDate,
            notes: notes.trim(),
            timesheet_entries: entries,
        };

        try {
            if (isEdit && currentTimesheet) {
                await updateTimesheet(currentTimesheet.name, timesheetData);
                setSnackbar({ open: true, message: 'Timesheet updated successfully', severity: 'success' });
            } else {
                await createTimesheet(timesheetData);
                setSnackbar({ open: true, message: 'Timesheet created successfully', severity: 'success' });
            }
            handleCloseCreate();
            refetch();
        } catch (error: any) {
            setSnackbar({ open: true, message: error.message || 'Operation failed', severity: 'error' });
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
                    Timesheets
                </Typography>

                {permissions.write && (
                    <Button
                        variant="contained"
                        startIcon={<Iconify icon="mingcute:add-line" />}
                        onClick={handleOpenCreate}
                        sx={{ bgcolor: '#08a3cd', color: 'common.white', '&:hover': { bgcolor: '#068fb3' } }}
                    >
                        New Timesheet
                    </Button>
                )}
            </Box>

            <Card>
                <TimesheetTableToolbar
                    numSelected={selected.length}
                    filterName={filterName}
                    onFilterName={handleFilterByName}
                    searchPlaceholder="Search timesheets..."
                    onDelete={selected.length > 0 ? handleBulkDelete : undefined}
                />

                <Scrollbar>
                    <TableContainer sx={{ overflow: 'unset' }}>
                        <Table sx={{ minWidth: 800 }}>
                            <TimesheetTableHead
                                order={order}
                                orderBy={orderBy}
                                rowCount={data.length}
                                numSelected={selected.length}
                                onSort={handleSort}
                                onSelectAllRows={(checked: boolean) => handleSelectAllRows(checked)}
                                headLabel={[
                                    { id: 'employee_name', label: 'Employee' },
                                    { id: 'timesheet_date', label: 'Date' },
                                    { id: 'total_hours', label: 'Total Hours' },
                                    { id: '', label: '' },
                                ]}
                            />
                            <TableBody>
                                {data.map((row) => (
                                    <TimesheetTableRow
                                        key={row.name}
                                        row={{
                                            id: row.name,
                                            employee_name: row.employee_name,
                                            timesheet_date: row.timesheet_date,
                                            total_hours: row.total_hours,
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
                                        <TableCell colSpan={4}>
                                            <EmptyContent
                                                title="No timesheets found"
                                                description="You haven't recorded any timesheets yet."
                                                icon="solar:clock-circle-bold-duotone"
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
            <Dialog open={openCreate} onClose={handleCloseCreate} fullWidth maxWidth="lg">
                <form onSubmit={handleCreate}>
                    <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        {isEdit ? 'Edit Timesheet' : 'New Timesheet'}
                        <IconButton onClick={handleCloseCreate}>
                            <Iconify icon="mingcute:close-line" />
                        </IconButton>
                    </DialogTitle>

                    <DialogContent dividers>
                        <Box sx={{ display: 'grid', gap: 3, p: 2 }}>
                            <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
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

                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <DatePicker
                                        label="Timesheet Date"
                                        value={timesheetDate ? dayjs(timesheetDate) : null}
                                        onChange={(newValue) => setTimesheetDate(newValue?.format('YYYY-MM-DD') || '')}
                                        slotProps={{
                                            textField: {
                                                fullWidth: true,
                                                required: true,
                                                InputLabelProps: { shrink: true },
                                            },
                                        }}
                                    />
                                </LocalizationProvider>
                            </Box>

                            <TextField
                                fullWidth
                                label="Notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                multiline
                                rows={2}
                                placeholder="Enter timesheet notes"
                            />

                            {/* Timesheet Entries Child Table */}
                            <Box sx={{ mt: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                        Timesheet Entries
                                        <Typography component="span" variant="body2" sx={{ ml: 2, color: 'primary.main', fontWeight: 600 }}>
                                            Total: {totalHours.toFixed(1)} hours
                                        </Typography>
                                    </Typography>
                                    <Button
                                        size="small"
                                        variant="contained"
                                        startIcon={<Iconify icon="mingcute:add-line" />}
                                        onClick={handleOpenEntryDialog}
                                    >
                                        Add Entry
                                    </Button>
                                </Box>

                                <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: 'background.neutral' }}>
                                                <TableCell sx={{ fontWeight: 700 }}>Project</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Activity Type</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Hours</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {entries.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                                        No entries added yet. Click &quot;Add Entry&quot; to begin.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                entries.map((entry, index) => (
                                                    <TableRow key={index} hover>
                                                        <TableCell>{entry.project}</TableCell>
                                                        <TableCell>{entry.activity_type}</TableCell>
                                                        <TableCell>{entry.hours} hrs</TableCell>
                                                        <TableCell>{entry.description || '-'}</TableCell>
                                                        <TableCell align="right">
                                                            <IconButton size="small" onClick={() => handleEditEntry(index)} color="info">
                                                                <Iconify icon="solar:pen-bold" width={18} />
                                                            </IconButton>
                                                            <IconButton size="small" onClick={() => handleDeleteEntry(index)} color="error">
                                                                <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                                                            </IconButton>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Box>
                        </Box>
                    </DialogContent>

                    <DialogActions>
                        <Button type="submit" variant="contained">
                            {isEdit ? 'Update' : 'Create'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Entry Dialog */}
            <Dialog open={openEntryDialog} onClose={() => setOpenEntryDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editingEntryIndex !== null ? 'Edit Entry' : 'Add Entry'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'grid', gap: 3, pt: 2 }}>
                        <TextField
                            fullWidth
                            label="Project"
                            value={entryProject}
                            onChange={(e) => setEntryProject(e.target.value)}
                            required
                            placeholder="Enter project name"
                        />
                        <TextField
                            fullWidth
                            label="Activity Type"
                            value={entryActivityType}
                            onChange={(e) => setEntryActivityType(e.target.value)}
                            required
                            placeholder="e.g., Development, Testing, Meeting"
                        />
                        <TextField
                            fullWidth
                            label="Hours"
                            type="number"
                            value={entryHours}
                            onChange={(e) => setEntryHours(e.target.value)}
                            required
                            inputProps={{ step: '0.5', min: '0' }}
                            placeholder="Enter hours worked"
                        />
                        <TextField
                            fullWidth
                            label="Description"
                            value={entryDescription}
                            onChange={(e) => setEntryDescription(e.target.value)}
                            multiline
                            rows={3}
                            placeholder="Enter task description"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenEntryDialog(false)}>Cancel</Button>
                    <Button
                        onClick={handleSaveEntry}
                        variant="contained"
                        disabled={!entryProject || !entryActivityType || !entryHours}
                    >
                        {editingEntryIndex !== null ? 'Update' : 'Add'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* View Dialog */}
            <TimesheetDetailsDialog
                open={openView}
                onClose={() => setOpenView(false)}
                timesheet={viewTimesheet}
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
