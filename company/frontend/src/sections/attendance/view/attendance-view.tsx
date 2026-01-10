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
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

import { useAttendance } from 'src/hooks/useAttendance';

import { getDoctypeList } from 'src/api/leads';
import { DashboardContent } from 'src/layouts/dashboard';
import { fetchAttendance, createAttendance, updateAttendance, deleteAttendance, getHRPermissions } from 'src/api/hr-management';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { EmptyContent } from 'src/components/empty-content';
import { ConfirmDialog } from 'src/components/confirm-dialog';

import { TableNoData } from '../../user/table-no-data';
import { TableEmptyRows } from '../../user/table-empty-rows';
import { AttendanceTableRow } from '../attendance-table-row';
import { UserTableHead as AttendanceTableHead } from '../../user/user-table-head';
import { UserTableToolbar as AttendanceTableToolbar } from '../../user/user-table-toolbar';
import { AttendanceDetailsDialog } from '../../report/attendance/attendance-details-dialog';

// ----------------------------------------------------------------------

export function AttendanceView() {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [filterName, setFilterName] = useState('');
    const [order, setOrder] = useState<'asc' | 'desc'>('desc');
    const [orderBy, setOrderBy] = useState('attendance_date');
    const [selected, setSelected] = useState<string[]>([]);

    const [openCreate, setOpenCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [currentAttendanceId, setCurrentAttendanceId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Record<string, any>>({
        status: 'Present',
        attendance_date: dayjs().format('YYYY-MM-DD'),
    });

    const [employeeOptions, setEmployeeOptions] = useState<any[]>([]);

    // Alert & Dialog State
    const [confirmDelete, setConfirmDelete] = useState<{ open: boolean, id: string | null }>({ open: false, id: null });
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' | 'warning' }>({
        open: false,
        message: '',
        severity: 'success',
    });

    const [serverAlert, setServerAlert] = useState<{ message: string, severity: 'success' | 'error' | 'warning' | 'info' }>({
        message: '',
        severity: 'info'
    });

    const [openDetails, setOpenDetails] = useState(false);
    const [detailsId, setDetailsId] = useState<string | null>(null);

    // Permissions State
    const [permissions, setPermissions] = useState<{ read: boolean; write: boolean; delete: boolean }>({
        read: true,
        write: true,
        delete: true,
    });

    const { data, total, loading, refetch } = useAttendance(
        page + 1,
        rowsPerPage,
        filterName,
        orderBy,
        order
    );

    const notFound = !data.length && !!filterName;
    const empty = !data.length && !filterName && !loading;

    useEffect(() => {
        getHRPermissions('Attendance').then(setPermissions);
        getDoctypeList('Employee', ['name', 'employee_name']).then(setEmployeeOptions).catch(console.error);
    }, []);

    const handleOpenCreate = () => {
        setFormData({
            status: 'Present',
            attendance_date: dayjs().format('YYYY-MM-DD'),
        });
        setOpenCreate(true);
    };

    const handleCloseCreate = () => {
        setOpenCreate(false);
        setCurrentAttendanceId(null);
    };

    const handleInputChange = (fieldname: string, value: any) => {
        setFormData((prev: Record<string, any>) => {
            const next = { ...prev, [fieldname]: value };

            // Calculate working hours
            if (fieldname === 'in_time' || fieldname === 'out_time') {
                if (next.in_time && next.out_time) {
                    const start = dayjs(`2000-01-01 ${next.in_time}`);
                    const end = dayjs(`2000-01-01 ${next.out_time}`);
                    if (end.isAfter(start)) {
                        const diffMs = end.diff(start);
                        const diffHrs = diffMs / (1000 * 60 * 60);
                        next.working_hours_decimal = diffHrs.toFixed(2);
                        const h = Math.floor(diffHrs);
                        const m = Math.round((diffHrs - h) * 60);
                        next.working_hours_display = `${h}h ${m}m`;
                    } else {
                        next.working_hours_decimal = 0;
                        next.working_hours_display = '0h 0m';
                    }
                }
            }
            return next;
        });
    };

    const handleCloseSnackbar = () => {
        setSnackbar((prev: any) => ({ ...prev, open: false }));
    };

    const handleDeleteClick = (id: string) => {
        setConfirmDelete({ open: true, id });
    };

    const handleConfirmDelete = async () => {
        if (!confirmDelete.id) return;
        try {
            await deleteAttendance(confirmDelete.id);
            setSnackbar({ open: true, message: 'Attendance record deleted successfully', severity: 'success' });
            await refetch();
        } catch (e: any) {
            console.error(e);
            setSnackbar({ open: true, message: e.message || 'Failed to delete record', severity: 'error' });
        } finally {
            setConfirmDelete({ open: false, id: null });
        }
    };

    const validateForm = () => {
        if (!formData.employee) return 'Employee is required';
        if (!formData.attendance_date) return 'Attendance Date is required';
        if (!formData.status) return 'Status is required';

        // Check future date
        const selectedDate = dayjs(formData.attendance_date);
        const today = dayjs().startOf('day');
        if (selectedDate.isAfter(today)) {
            return 'Attendance cannot be marked for future dates';
        }

        // Time validation for Present/Half Day
        if (formData.status === 'Present' || formData.status === 'Half Day') {
            if (!formData.in_time) return 'In Time is required for ' + formData.status;
            if (!formData.out_time) return 'Out Time is required for ' + formData.status;
        }

        // Logical time check
        if (formData.in_time && formData.out_time) {
            const start = dayjs(`2000-01-01 ${formData.in_time}`);
            const end = dayjs(`2000-01-01 ${formData.out_time}`);
            if (!end.isAfter(start)) {
                return 'Out Time must be after In Time';
            }
        }

        return null;
    };

    const handleCreate = async () => {
        const error = validateForm();
        if (error) {
            setSnackbar({ open: true, message: error, severity: 'error' });
            return;
        }

        try {
            setCreating(true);
            setServerAlert({ message: '', severity: 'info' });

            // Duplicate Check: Check if attendance already exists for this employee on this date
            const existing = await fetchAttendance({
                page: 1,
                page_size: 1,
                filters: [
                    ['Attendance', 'employee', '=', formData.employee],
                    ['Attendance', 'attendance_date', '=', formData.attendance_date]
                ]
            });

            if (existing.data.length > 0 && existing.data[0].name !== currentAttendanceId) {
                setSnackbar({ open: true, message: `Attendance already marked for ${formData.employee} on ${formData.attendance_date}`, severity: 'error' });
                setCreating(false);
                return;
            }

            if (currentAttendanceId) {
                await updateAttendance(currentAttendanceId, formData as any);
                setSnackbar({ open: true, message: 'Attendance updated successfully', severity: 'success' });
            } else {
                await createAttendance(formData as any);
                setSnackbar({ open: true, message: 'Attendance marked successfully', severity: 'success' });
            }

            await refetch();
            handleCloseCreate();
        } catch (err: any) {
            console.error(err);
            setServerAlert({ message: err.message || 'Error saving attendance', severity: 'error' });
        } finally {
            setCreating(false);
        }
    };

    const handleEditRow = (id: string) => {
        setCurrentAttendanceId(id);
        const fullRow = data.find((item: any) => item.name === id);
        if (fullRow) {
            setFormData({ ...fullRow });
        }
        setOpenCreate(true);
    };

    const handleOpenDetails = (id: string) => {
        setDetailsId(id);
        setOpenDetails(true);
    };

    const handleCloseDetails = () => {
        setOpenDetails(false);
        setDetailsId(null);
    };

    const handleSort = (id: string) => {
        const isAsc = orderBy === id && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(id);
    };

    const handleSelectAllRows = (checked: boolean) => {
        if (checked) {
            const newSelected = data.map((n) => n.name);
            setSelected(newSelected);
            return;
        }
        setSelected([]);
    };

    const handleSelectRow = (id: string) => {
        const selectedIndex = selected.indexOf(id);
        let newSelected: string[] = [];

        if (selectedIndex === -1) {
            newSelected = newSelected.concat(selected, id);
        } else if (selectedIndex === 0) {
            newSelected = newSelected.concat(selected.slice(1));
        } else if (selectedIndex === selected.length - 1) {
            newSelected = newSelected.concat(selected.slice(0, -1));
        } else if (selectedIndex > 0) {
            newSelected = newSelected.concat(
                selected.slice(0, selectedIndex),
                selected.slice(selectedIndex + 1)
            );
        }
        setSelected(newSelected);
    };

    const handleBulkDelete = async () => {
        try {
            await Promise.all(selected.map((id) => deleteAttendance(id)));
            setSnackbar({ open: true, message: `${selected.length} records deleted successfully`, severity: 'success' });
            setSelected([]);
            await refetch();
        } catch (e: any) {
            setSnackbar({ open: true, message: e.message || 'Error during bulk delete', severity: 'error' });
        }
    };

    const renderField = (fieldname: string, label: string, type: string = 'text', options: any[] = [], extraProps: any = {}, required: boolean = false) => {
        const commonProps = {
            fullWidth: true,
            label,
            value: formData[fieldname] || '',
            onChange: (e: any) => handleInputChange(fieldname, e.target.value),
            InputLabelProps: { shrink: true },
            required,
            ...extraProps,
            sx: {
                '& .MuiFormLabel-asterisk': {
                    color: 'red',
                },
                ...extraProps.sx
            }
        };

        if (type === 'select' || type === 'link') {
            return (
                <TextField {...commonProps} select SelectProps={{ native: true }}>
                    <option value="">Select {label}</option>
                    {options.map((opt: any) => (
                        <option key={opt.name || opt} value={opt.name || opt}>
                            {opt.employee_name ? `${opt.employee_name} (${opt.name})` : (opt.name || opt)}
                        </option>
                    ))}
                </TextField>
            );
        }

        if (type === 'date') {
            return (
                <DatePicker
                    label={label}
                    value={formData[fieldname] ? dayjs(formData[fieldname]) : null}
                    onChange={(newValue) => handleInputChange(fieldname, newValue?.format('YYYY-MM-DD') || '')}
                    slotProps={{
                        textField: {
                            fullWidth: true,
                            required,
                            InputLabelProps: { shrink: true },
                            sx: commonProps.sx
                        }
                    }}
                />
            );
        }

        if (type === 'time') {
            return (
                <TimePicker
                    label={label}
                    value={formData[fieldname] ? dayjs(`2000-01-01 ${formData[fieldname]}`) : null}
                    onChange={(newValue) => handleInputChange(fieldname, newValue?.format('HH:mm:ss') || '')}
                    slotProps={{
                        textField: {
                            fullWidth: true,
                            required,
                            InputLabelProps: { shrink: true },
                            sx: commonProps.sx
                        }
                    }}
                />
            );
        }

        return <TextField {...commonProps} />;
    };

    return (
        <DashboardContent>
            <Box sx={{ mb: 5, display: 'flex', alignItems: 'center' }}>
                <Typography variant="h4" sx={{ flexGrow: 1 }}>
                    Attendance
                </Typography>

                {permissions.write && (
                    <Button
                        variant="contained"
                        startIcon={<Iconify icon="mingcute:add-line" />}
                        onClick={handleOpenCreate}
                        sx={{ bgcolor: '#08a3cd', color: 'common.white', '&:hover': { bgcolor: '#068fb3' } }}
                    >
                        Mark Attendance
                    </Button>
                )}
            </Box>

            <Card>
                <AttendanceTableToolbar
                    numSelected={selected.length}
                    filterName={filterName}
                    onFilterName={(e) => {
                        setFilterName(e.target.value);
                        setPage(0);
                    }}
                    onDelete={handleBulkDelete}
                    searchPlaceholder="Search attendance..."
                />

                <Scrollbar>
                    <TableContainer sx={{ overflow: 'unset' }}>
                        <Table sx={{ minWidth: 800 }}>
                            <AttendanceTableHead
                                order={order}
                                orderBy={orderBy}
                                rowCount={total}
                                numSelected={selected.length}
                                onSort={handleSort}
                                onSelectAllRows={(checked) => handleSelectAllRows(checked)}
                                headLabel={[
                                    { id: 'employee_name', label: 'Employee', minWidth: 180 },
                                    { id: 'attendance_date', label: 'Date', minWidth: 120 },
                                    { id: 'status', label: 'Status', minWidth: 100 },
                                    { id: 'in_time', label: 'In Time', minWidth: 120 },
                                    { id: 'out_time', label: 'Out Time', minWidth: 120 },
                                    { id: '', label: 'Actions', align: 'right' },
                                ]}
                            />

                            <TableBody>
                                {data.map((row) => (
                                    <AttendanceTableRow
                                        key={row.name}
                                        row={{
                                            id: row.name,
                                            employee: row.employee,
                                            employeeName: row.employee_name,
                                            attendanceDate: row.attendance_date,
                                            status: row.status,
                                            inTime: row.in_time,
                                            out_time: row.out_time,
                                        }}
                                        selected={selected.includes(row.name)}
                                        onSelectRow={() => handleSelectRow(row.name)}
                                        onView={() => handleOpenDetails(row.name)}
                                        onEdit={() => handleEditRow(row.name)}
                                        onDelete={() => handleDeleteClick(row.name)}
                                        canEdit={permissions.write}
                                        canDelete={permissions.delete}
                                    />
                                ))}

                                {notFound && <TableNoData searchQuery={filterName} />}

                                {empty && (
                                    <TableRow>
                                        <TableCell colSpan={6}>
                                            <EmptyContent
                                                title="No attendance records"
                                                description="You haven't marked any attendance yet."
                                                icon="solar:calendar-date-bold-duotone"
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
                    count={total}
                    page={page}
                    rowsPerPage={rowsPerPage}
                    onPageChange={(_e, newPage) => setPage(newPage)}
                    rowsPerPageOptions={[5, 10, 25]}
                    onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                />
            </Card>

            {/* CREATE/EDIT DIALOG */}
            <Dialog open={openCreate} onClose={handleCloseCreate} fullWidth maxWidth="sm">
                <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {currentAttendanceId ? 'Edit Attendance' : 'Mark Attendance'}
                    <IconButton onClick={handleCloseCreate} sx={{ color: (theme) => theme.palette.grey[500] }}>
                        <Iconify icon="mingcute:close-line" />
                    </IconButton>
                </DialogTitle>

                <DialogContent dividers>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <Box
                            display="grid"
                            margin={2}
                            gridTemplateColumns="1fr"
                            gap={3}
                        >
                            {renderField('employee', 'Employee', 'select', employeeOptions, {}, true)}
                            {renderField('attendance_date', 'Attendance Date', 'date', [], {}, true)}
                            {renderField('status', 'Status', 'select', ['Present', 'Absent', 'Half Day', 'On Leave', 'Holiday'], {}, true)}

                            <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
                                {renderField('in_time', 'In Time', 'time')}
                                {renderField('out_time', 'Out Time', 'time')}
                            </Box>

                            {formData.working_hours_display && (
                                <TextField
                                    fullWidth
                                    label="Working Hours"
                                    value={formData.working_hours_display}
                                    InputProps={{ readOnly: true }}
                                    InputLabelProps={{ shrink: true }}
                                    variant="filled"
                                />
                            )}
                        </Box>
                    </LocalizationProvider>
                </DialogContent>

                <DialogActions>
                    <Button variant="contained" onClick={handleCreate} disabled={creating} sx={{ bgcolor: '#08a3cd', '&:hover': { bgcolor: '#068fb3' } }}>
                        {creating ? 'Saving...' : (currentAttendanceId ? 'Update Record' : 'Save Record')}
                    </Button>
                </DialogActions>
            </Dialog>

            <ConfirmDialog
                open={confirmDelete.open}
                onClose={() => setConfirmDelete({ open: false, id: null })}
                title="Confirm Delete"
                content="Are you sure you want to delete this attendance record?"
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

            <AttendanceDetailsDialog
                open={openDetails}
                onClose={handleCloseDetails}
                attendanceId={detailsId}
            />

            <Snackbar
                open={!!serverAlert.message}
                autoHideDuration={6000}
                onClose={() => setServerAlert({ ...serverAlert, message: '' })}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert
                    onClose={() => setServerAlert({ ...serverAlert, message: '' })}
                    severity={serverAlert.severity}
                    sx={{ width: '100%', whiteSpace: 'pre-line' }}
                >
                    {serverAlert.message}
                </Alert>
            </Snackbar>
        </DashboardContent>
    );
}
