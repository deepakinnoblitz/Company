import dayjs from 'dayjs';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Snackbar from '@mui/material/Snackbar';
import Checkbox from '@mui/material/Checkbox';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import FormControlLabel from '@mui/material/FormControlLabel';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

import { useHolidayLists } from 'src/hooks/useHolidayLists';

import { DashboardContent } from 'src/layouts/dashboard';
import { getHolidayList, createHolidayList, updateHolidayList, deleteHolidayList, getHolidayListPermissions } from 'src/api/holiday-lists';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { EmptyContent } from 'src/components/empty-content';
import { ConfirmDialog } from 'src/components/confirm-dialog';

import { TableNoData } from 'src/sections/user/table-no-data';
import { TableEmptyRows } from 'src/sections/user/table-empty-rows';
import { HolidayListTableRow } from 'src/sections/holidays/holidays-table-row';
import { UserTableHead as HolidayTableHead } from 'src/sections/user/user-table-head';
import { HolidayDetailsDialog } from 'src/sections/report/holidays/holidays-details-dialog';
import { UserTableToolbar as HolidayTableToolbar } from 'src/sections/user/user-table-toolbar';

// ----------------------------------------------------------------------

interface Holiday {
    idx?: number;
    holiday_date: string;
    description: string;
    is_working_day: number;
}

export function HolidaysView() {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [filterName, setFilterName] = useState('');
    const [order, setOrder] = useState<'asc' | 'desc'>('desc');
    const [orderBy, setOrderBy] = useState('year');
    const [selected, setSelected] = useState<string[]>([]);

    const { data, total, refetch } = useHolidayLists(page + 1, rowsPerPage, filterName, orderBy, order);

    const [openCreate, setOpenCreate] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [currentHoliday, setCurrentHoliday] = useState<any>(null);
    const [confirmDelete, setConfirmDelete] = useState<{ open: boolean, id: string | null }>({ open: false, id: null });

    // View state
    const [openView, setOpenView] = useState(false);
    const [viewHoliday, setViewHoliday] = useState<any>(null);

    // Form state
    const [holidayListName, setHolidayListName] = useState('');
    const [year, setYear] = useState('');
    const [month, setMonth] = useState('');
    const [workingDays, setWorkingDays] = useState('');
    const [holidays, setHolidays] = useState<Holiday[]>([]);

    // Holiday entry dialog state
    const [openHolidayDialog, setOpenHolidayDialog] = useState(false);
    const [editingHolidayIndex, setEditingHolidayIndex] = useState<number | null>(null);
    const [holidayDate, setHolidayDate] = useState('');
    const [holidayDescription, setHolidayDescription] = useState('');
    const [isWorkingDay, setIsWorkingDay] = useState(false);

    // Permissions
    const [permissions, setPermissions] = useState({ read: false, write: false, delete: false });

    // Snackbar
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success',
    });

    // Load permissions
    useEffect(() => {
        getHolidayListPermissions().then(setPermissions);
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
            await Promise.all(selected.map((name) => deleteHolidayList(name)));
            setSnackbar({ open: true, message: `${selected.length} holiday list(s) deleted successfully`, severity: 'success' });
            setSelected([]);
            refetch();
        } catch (error: any) {
            setSnackbar({ open: true, message: error.message || 'Failed to delete holiday lists', severity: 'error' });
        }
    };

    const handleOpenCreate = () => {
        setIsEdit(false);
        setCurrentHoliday(null);
        setHolidayListName('');
        setYear('');
        setMonth('');
        setWorkingDays('');
        setHolidays([]);
        setOpenCreate(true);
    };

    const handleCloseCreate = () => {
        setOpenCreate(false);
        setIsEdit(false);
        setCurrentHoliday(null);
        setHolidayListName('');
        setYear('');
        setMonth('');
        setWorkingDays('');
        setHolidays([]);
    };

    const handleEditRow = useCallback(async (row: any) => {
        try {
            // Fetch full holiday list data with child tables
            const fullData = await getHolidayList(row.name);
            setCurrentHoliday(fullData);
            setHolidayListName(fullData.holiday_list_name || '');
            setYear(fullData.year?.toString() || '');
            setMonth(fullData.month || '');
            setWorkingDays(fullData.working_days?.toString() || '');
            setHolidays(fullData.holidays || []);
            setIsEdit(true);
            setOpenCreate(true);
        } catch (error: any) {
            setSnackbar({ open: true, message: error.message || 'Failed to load holiday list', severity: 'error' });
        }
    }, []);

    const handleViewRow = useCallback(async (row: any) => {
        try {
            // Fetch full holiday list data with child tables
            const fullData = await getHolidayList(row.name);
            setViewHoliday(fullData);
            setOpenView(true);
        } catch (error: any) {
            setSnackbar({ open: true, message: error.message || 'Failed to load holiday list', severity: 'error' });
        }
    }, []);

    const handleDeleteRow = useCallback((id: string) => {
        setConfirmDelete({ open: true, id });
    }, []);

    const handleConfirmDelete = async () => {
        if (!confirmDelete.id) return;
        try {
            await deleteHolidayList(confirmDelete.id);
            setSnackbar({ open: true, message: 'Holiday list deleted successfully', severity: 'success' });
            refetch();
        } catch (error: any) {
            setSnackbar({ open: true, message: error.message || 'Failed to delete holiday list', severity: 'error' });
        } finally {
            setConfirmDelete({ open: false, id: null });
        }
    };

    // Holiday entry management functions
    const handleOpenHolidayDialog = () => {
        setEditingHolidayIndex(null);
        setHolidayDate('');
        setHolidayDescription('');
        setIsWorkingDay(false);
        setOpenHolidayDialog(true);
    };

    const handleEditHoliday = (index: number) => {
        const holiday = holidays[index];
        setEditingHolidayIndex(index);
        setHolidayDate(holiday.holiday_date);
        setHolidayDescription(holiday.description);
        setIsWorkingDay(holiday.is_working_day === 1);
        setOpenHolidayDialog(true);
    };

    const handleDeleteHoliday = (index: number) => {
        setHolidays((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSaveHoliday = () => {
        const newHoliday: Holiday = {
            holiday_date: holidayDate,
            description: holidayDescription,
            is_working_day: isWorkingDay ? 1 : 0,
        };

        if (editingHolidayIndex !== null) {
            setHolidays((prev) => prev.map((holiday, i) => (i === editingHolidayIndex ? newHoliday : holiday)));
        } else {
            setHolidays((prev) => [...prev, newHoliday]);
        }

        setOpenHolidayDialog(false);
    };

    const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const holidayData = {
            holiday_list_name: holidayListName.trim(),
            year: parseInt(year, 10),
            month: month.trim(),
            working_days: parseInt(workingDays, 10) || 0,
            holidays,
        };

        try {
            if (isEdit && currentHoliday) {
                await updateHolidayList(currentHoliday.name, holidayData);
                setSnackbar({ open: true, message: 'Holiday list updated successfully', severity: 'success' });
            } else {
                await createHolidayList(holidayData);
                setSnackbar({ open: true, message: 'Holiday list created successfully', severity: 'success' });
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
                    Holidays
                </Typography>

                {permissions.write && (
                    <Button
                        variant="contained"
                        startIcon={<Iconify icon="mingcute:add-line" />}
                        onClick={handleOpenCreate}
                        sx={{ bgcolor: '#08a3cd', color: 'common.white', '&:hover': { bgcolor: '#068fb3' } }}
                    >
                        New Holiday List
                    </Button>
                )}
            </Box>

            <Card>
                <HolidayTableToolbar
                    numSelected={selected.length}
                    filterName={filterName}
                    onFilterName={handleFilterByName}
                    searchPlaceholder="Search holiday lists..."
                    onDelete={selected.length > 0 ? handleBulkDelete : undefined}
                />

                <Scrollbar>
                    <TableContainer sx={{ overflow: 'unset' }}>
                        <Table sx={{ minWidth: 800 }}>
                            <HolidayTableHead
                                order={order}
                                orderBy={orderBy}
                                rowCount={data.length}
                                numSelected={selected.length}
                                onSort={handleSort}
                                onSelectAllRows={(checked: boolean) => handleSelectAllRows(checked)}
                                headLabel={[
                                    { id: 'holiday_list_name', label: 'Holiday List Name' },
                                    { id: 'year', label: 'Year' },
                                    { id: 'month', label: 'Month' },
                                    { id: 'working_days', label: 'Working Days' },
                                    { id: '', label: '' },
                                ]}
                            />
                            <TableBody>
                                {data.map((row) => (
                                    <HolidayListTableRow
                                        key={row.name}
                                        row={{
                                            id: row.name,
                                            holiday_list_name: row.holiday_list_name,
                                            year: row.year,
                                            month: row.month,
                                            working_days: row.working_days,
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
                                        <TableCell colSpan={5}>
                                            <EmptyContent
                                                title="No holiday lists found"
                                                description="You haven't created any holiday lists yet."
                                                icon="solar:calendar-mark-bold-duotone"
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
                        {isEdit ? 'Edit Holiday List' : 'New Holiday List'}
                        <IconButton onClick={handleCloseCreate}>
                            <Iconify icon="mingcute:close-line" />
                        </IconButton>
                    </DialogTitle>

                    <DialogContent dividers>
                        <Box sx={{ display: 'grid', gap: 3, p: 2 }}>
                            <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
                                <TextField
                                    fullWidth
                                    label="Holiday List Name"
                                    value={holidayListName}
                                    onChange={(e) => setHolidayListName(e.target.value)}
                                    required
                                    placeholder="e.g., Public Holidays 2024"
                                />

                                <TextField
                                    fullWidth
                                    label="Year"
                                    type="number"
                                    value={year}
                                    onChange={(e) => setYear(e.target.value)}
                                    required
                                    placeholder="e.g., 2024"
                                    inputProps={{ min: '2020', max: '2100' }}
                                />
                            </Box>

                            <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
                                <TextField
                                    fullWidth
                                    label="Month"
                                    value={month}
                                    onChange={(e) => setMonth(e.target.value)}
                                    placeholder="e.g., January, February"
                                />

                                <TextField
                                    fullWidth
                                    label="Working Days"
                                    type="number"
                                    value={workingDays}
                                    onChange={(e) => setWorkingDays(e.target.value)}
                                    placeholder="Number of working days"
                                    inputProps={{ min: '0', max: '31' }}
                                />
                            </Box>

                            {/* Holidays Child Table */}
                            <Box sx={{ mt: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                        Holidays
                                        <Typography component="span" variant="body2" sx={{ ml: 2, color: 'primary.main', fontWeight: 600 }}>
                                            Total: {holidays.length} holiday(s)
                                        </Typography>
                                    </Typography>
                                    <Button
                                        size="small"
                                        variant="contained"
                                        startIcon={<Iconify icon="mingcute:add-line" />}
                                        onClick={handleOpenHolidayDialog}
                                    >
                                        Add Holiday
                                    </Button>
                                </Box>

                                <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: 'background.neutral' }}>
                                                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Working Day</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {holidays.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                                        No holidays added yet. Click &quot;Add Holiday&quot; to begin.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                holidays.map((holiday, index) => (
                                                    <TableRow key={index} hover>
                                                        <TableCell>{new Date(holiday.holiday_date).toLocaleDateString()}</TableCell>
                                                        <TableCell>{holiday.description}</TableCell>
                                                        <TableCell>
                                                            {holiday.is_working_day ? (
                                                                <Iconify icon="solar:check-circle-bold" width={20} sx={{ color: 'success.main' }} />
                                                            ) : (
                                                                <Typography variant="body2" sx={{ color: 'error.main', fontWeight: 700 }}>✗</Typography>
                                                            )}
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            <IconButton size="small" onClick={() => handleEditHoliday(index)} color="info">
                                                                <Iconify icon="solar:pen-bold" width={18} />
                                                            </IconButton>
                                                            <IconButton size="small" onClick={() => handleDeleteHoliday(index)} color="error">
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

            {/* Holiday Entry Dialog */}
            <Dialog open={openHolidayDialog} onClose={() => setOpenHolidayDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editingHolidayIndex !== null ? 'Edit Holiday' : 'Add Holiday'}
                </DialogTitle>
                <DialogContent>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <Box sx={{ display: 'grid', gap: 3, pt: 2 }}>
                            <DatePicker
                                label="Holiday Date"
                                value={holidayDate ? dayjs(holidayDate) : null}
                                onChange={(newValue) => setHolidayDate(newValue?.format('YYYY-MM-DD') || '')}
                                slotProps={{
                                    textField: {
                                        fullWidth: true,
                                        required: true,
                                        InputLabelProps: { shrink: true },
                                    },
                                }}
                            />
                            <TextField
                                fullWidth
                                label="Description"
                                value={holidayDescription}
                                onChange={(e) => setHolidayDescription(e.target.value)}
                                required
                                placeholder="e.g., New Year's Day, Independence Day"
                            />
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={isWorkingDay}
                                        onChange={(e) => setIsWorkingDay(e.target.checked)}
                                    />
                                }
                                label="Is Working Day"
                            />
                        </Box>
                    </LocalizationProvider>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenHolidayDialog(false)}>Cancel</Button>
                    <Button
                        onClick={handleSaveHoliday}
                        variant="contained"
                        disabled={!holidayDate || !holidayDescription}
                    >
                        {editingHolidayIndex !== null ? 'Update' : 'Add'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* View Dialog */}
            <HolidayDetailsDialog
                open={openView}
                onClose={() => setOpenView(false)}
                holidayList={viewHoliday}
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

            <ConfirmDialog
                open={confirmDelete.open}
                onClose={() => setConfirmDelete({ open: false, id: null })}
                title="Confirm Delete"
                content="Are you sure you want to delete this holiday list?"
                action={
                    <Button onClick={handleConfirmDelete} color="error" variant="contained" sx={{ borderRadius: 1.5, minWidth: 100 }}>
                        Delete
                    </Button>
                }
            />
        </DashboardContent>
    );
}
