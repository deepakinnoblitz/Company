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
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

import { useLeaveApplications } from 'src/hooks/useLeaveApplications';

import { getDoctypeList } from 'src/api/leads';
import { DashboardContent } from 'src/layouts/dashboard';
import { getHRPermissions, createLeaveApplication, updateLeaveApplication, deleteLeaveApplication } from 'src/api/hr-management';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { EmptyContent } from 'src/components/empty-content';
import { ConfirmDialog } from 'src/components/confirm-dialog';

import { LeavesTableRow } from '../leaves-table-row';
import { TableNoData } from '../../user/table-no-data';
import { TableEmptyRows } from '../../user/table-empty-rows';
import { UserTableHead as LeavesTableHead } from '../../user/user-table-head';
import { LeavesDetailsDialog } from '../../report/leaves/leaves-details-dialog';
import { UserTableToolbar as LeavesTableToolbar } from '../../user/user-table-toolbar';

// ----------------------------------------------------------------------

export function LeavesView() {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [filterName, setFilterName] = useState('');

    const [openCreate, setOpenCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [currentLeaveId, setCurrentLeaveId] = useState<string | null>(null);

    // Form state
    const [employee, setEmployee] = useState('');
    const [leaveType, setLeaveType] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [reason, setReason] = useState('');

    const [employeeOptions, setEmployeeOptions] = useState<any[]>([]);
    const [leaveTypeOptions, setLeaveTypeOptions] = useState<any[]>([]);

    // Alert & Dialog State
    const [confirmDelete, setConfirmDelete] = useState<{ open: boolean, id: string | null }>({ open: false, id: null });
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' | 'warning' }>({
        open: false,
        message: '',
        severity: 'success',
    });

    const [openDetails, setOpenDetails] = useState(false);
    const [detailsId, setDetailsId] = useState<string | null>(null);

    // Permissions State
    const [permissions, setPermissions] = useState<{ read: boolean; write: boolean; delete: boolean }>({
        read: true,
        write: true,
        delete: true,
    });

    const { data, total, loading, refetch } = useLeaveApplications(
        page + 1,
        rowsPerPage,
        filterName
    );

    const notFound = !data.length && !!filterName;
    const empty = !data.length && !filterName && !loading;

    useEffect(() => {
        getHRPermissions('Leave Application').then(setPermissions);
        getDoctypeList('Employee', ['name', 'employee_name']).then(setEmployeeOptions).catch(console.error);
        getDoctypeList('Leave Type', ['name']).then(setLeaveTypeOptions).catch(console.error);
    }, []);

    const handleOpenCreate = () => {
        setOpenCreate(true);
    };

    const handleCloseCreate = () => {
        setOpenCreate(false);
        setCurrentLeaveId(null);
        setEmployee('');
        setLeaveType('');
        setFromDate('');
        setToDate('');
        setReason('');
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
            await deleteLeaveApplication(confirmDelete.id);
            setSnackbar({ open: true, message: 'Leave application deleted successfully', severity: 'success' });
            await refetch();
        } catch (e) {
            console.error(e);
            setSnackbar({ open: true, message: 'Failed to delete record', severity: 'error' });
        } finally {
            setConfirmDelete({ open: false, id: null });
        }
    };

    const handleCreate = async () => {
        try {
            setCreating(true);

            const leaveData = {
                employee,
                leave_type: leaveType,
                from_date: fromDate,
                to_date: toDate,
                reson: reason,
            };

            if (currentLeaveId) {
                await updateLeaveApplication(currentLeaveId, leaveData);
                setSnackbar({ open: true, message: 'Leave application updated successfully', severity: 'success' });
            } else {
                await createLeaveApplication(leaveData);
                setSnackbar({ open: true, message: 'Leave application submitted successfully', severity: 'success' });
            }

            await refetch();
            handleCloseCreate();
        } catch (err: any) {
            console.error(err);
            setSnackbar({ open: true, message: err.message || 'Error saving leave application', severity: 'error' });
        } finally {
            setCreating(false);
        }
    };

    const handleEditRow = (id: string) => {
        setCurrentLeaveId(id);
        const fullRow = data.find((item: any) => item.name === id);
        if (fullRow) {
            setEmployee(fullRow.employee || '');
            setLeaveType(fullRow.leave_type || '');
            setFromDate(fullRow.from_date || '');
            setToDate(fullRow.to_date || '');
            setReason(fullRow.reson || '');
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

    const onChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const onChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    return (
        <DashboardContent>
            <Box sx={{ mb: 5, display: 'flex', alignItems: 'center' }}>
                <Typography variant="h4" sx={{ flexGrow: 1 }}>
                    Leave Applications
                </Typography>

                {permissions.write && (
                    <Button
                        variant="contained"
                        startIcon={<Iconify icon="mingcute:add-line" />}
                        onClick={handleOpenCreate}
                        sx={{ bgcolor: '#08a3cd', color: 'common.white', '&:hover': { bgcolor: '#068fb3' } }}
                    >
                        New Application
                    </Button>
                )}
            </Box>

            <Card>
                <LeavesTableToolbar
                    numSelected={0}
                    filterName={filterName}
                    onFilterName={(e) => {
                        setFilterName(e.target.value);
                        setPage(0);
                    }}
                    searchPlaceholder="Search leaves..."
                />

                <Scrollbar>
                    <TableContainer sx={{ overflow: 'unset' }}>
                        <Table sx={{ minWidth: 800 }}>
                            <LeavesTableHead
                                order="asc"
                                orderBy="name"
                                rowCount={total}
                                numSelected={0}
                                onSort={() => { }}
                                onSelectAllRows={() => { }}
                                headLabel={[
                                    { id: 'employee', label: 'Employee', minWidth: 180 },
                                    { id: 'leaveType', label: 'Leave Type', minWidth: 150 },
                                    { id: 'period', label: 'Period', minWidth: 200 },
                                    { id: 'days', label: 'Days', minWidth: 80 },
                                    { id: 'reason', label: 'Reason', minWidth: 200 },
                                    { id: 'status', label: 'Status', minWidth: 100 },
                                    { id: '', label: 'Actions', align: 'right' },
                                ]}
                            />

                            <TableBody>
                                {data.map((row) => (
                                    <LeavesTableRow
                                        key={row.name}
                                        row={{
                                            id: row.name,
                                            employee: row.employee,
                                            employeeName: row.employee_name,
                                            leaveType: row.leave_type,
                                            fromDate: row.from_date,
                                            toDate: row.to_date,
                                            totalDays: row.total_days,
                                            reason: row.reson,
                                            status: row.workflow_state || row.status || 'Pending',
                                        }}
                                        selected={false}
                                        onSelectRow={() => { }}
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
                                                title="No leave applications"
                                                description="You haven't submitted any leave requests yet."
                                                icon="solar:calendar-add-bold-duotone"
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
                    onPageChange={onChangePage}
                    rowsPerPageOptions={[5, 10, 25]}
                    onRowsPerPageChange={onChangeRowsPerPage}
                />
            </Card>

            {/* CREATE/EDIT DIALOG */}
            <Dialog open={openCreate} onClose={handleCloseCreate} fullWidth maxWidth="sm">
                <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {currentLeaveId ? 'Edit Leave Application' : 'New Leave Application'}
                    <IconButton onClick={handleCloseCreate} sx={{ color: (theme) => theme.palette.grey[500] }}>
                        <Iconify icon="mingcute:close-line" />
                    </IconButton>
                </DialogTitle>

                <DialogContent dividers>
                    <Box
                        display="grid"
                        margin={2}
                        gridTemplateColumns="1fr"
                        gap={3}
                    >
                        <TextField
                            select
                            fullWidth
                            label="Employee"
                            value={employee}
                            onChange={(e) => setEmployee(e.target.value)}
                            SelectProps={{ native: true }}
                            InputLabelProps={{ shrink: true }}
                            required
                        >
                            <option value="">Select Employee</option>
                            {employeeOptions.map((option) => (
                                <option key={option.name} value={option.name}>{option.employee_name} ({option.name})</option>
                            ))}
                        </TextField>

                        <TextField
                            select
                            fullWidth
                            label="Leave Type"
                            value={leaveType}
                            onChange={(e) => setLeaveType(e.target.value)}
                            SelectProps={{ native: true }}
                            InputLabelProps={{ shrink: true }}
                            required
                        >
                            <option value="">Select Leave Type</option>
                            {leaveTypeOptions.map((option) => (
                                <option key={option.name} value={option.name}>{option.name}</option>
                            ))}
                        </TextField>

                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
                                <DatePicker
                                    label="From Date"
                                    value={fromDate ? dayjs(fromDate) : null}
                                    onChange={(newValue) => setFromDate(newValue?.format('YYYY-MM-DD') || '')}
                                    slotProps={{
                                        textField: {
                                            fullWidth: true,
                                            required: true,
                                            InputLabelProps: { shrink: true },
                                        },
                                    }}
                                />
                                <DatePicker
                                    label="To Date"
                                    value={toDate ? dayjs(toDate) : null}
                                    onChange={(newValue) => setToDate(newValue?.format('YYYY-MM-DD') || '')}
                                    slotProps={{
                                        textField: {
                                            fullWidth: true,
                                            required: true,
                                            InputLabelProps: { shrink: true },
                                        },
                                    }}
                                />
                            </Box>
                        </LocalizationProvider>

                        <TextField
                            fullWidth
                            label="Reason"
                            multiline
                            rows={3}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            required
                        />
                    </Box>
                </DialogContent>

                <DialogActions>
                    <Button variant="contained" onClick={handleCreate} disabled={creating} sx={{ bgcolor: '#08a3cd', '&:hover': { bgcolor: '#068fb3' } }}>
                        {creating ? 'Submitting...' : (currentLeaveId ? 'Update Application' : 'Submit Application')}
                    </Button>
                </DialogActions>
            </Dialog>

            <ConfirmDialog
                open={confirmDelete.open}
                onClose={() => setConfirmDelete({ open: false, id: null })}
                title="Confirm Delete"
                content="Are you sure you want to delete this leave application?"
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

            <LeavesDetailsDialog
                open={openDetails}
                onClose={handleCloseDetails}
                leaveId={detailsId}
            />
        </DashboardContent>
    );
}
