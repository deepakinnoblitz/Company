import dayjs from 'dayjs';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import Snackbar from '@mui/material/Snackbar';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import TableBody from '@mui/material/TableBody';
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

import { useJobOpenings } from 'src/hooks/useJobOpenings';

import { DashboardContent } from 'src/layouts/dashboard';
import {
    getJobOpening,
    createJobOpening,
    updateJobOpening,
    deleteJobOpening,
    getJobOpeningPermissions,
} from 'src/api/job-openings';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { EmptyContent } from 'src/components/empty-content';

import { TableNoData } from 'src/sections/user/table-no-data';
import { TableEmptyRows } from 'src/sections/user/table-empty-rows';
import { JobOpeningTableRow } from 'src/sections/job-openings/job-opening-table-row';
import { UserTableHead as JobOpeningTableHead } from 'src/sections/user/user-table-head';
import { UserTableToolbar as JobOpeningTableToolbar } from 'src/sections/user/user-table-toolbar';
import { JobOpeningDetailsDialog } from 'src/sections/report/job-openings/job-opening-details-dialog';

// ----------------------------------------------------------------------

export function JobOpeningsView() {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [filterName, setFilterName] = useState('');
    const [order, setOrder] = useState<'asc' | 'desc'>('desc');
    const [orderBy, setOrderBy] = useState('posted_on');
    const [selected, setSelected] = useState<string[]>([]);

    const { data, total, refetch } = useJobOpenings(
        page + 1,
        rowsPerPage,
        filterName,
        orderBy,
        order
    );

    const empty = !data.length && !filterName;

    const [permissions, setPermissions] = useState({ read: false, write: false, delete: false });

    // Dialog states
    const [openCreate, setOpenCreate] = useState(false);
    const [openView, setOpenView] = useState(false);
    const [viewJob, setViewJob] = useState<any>(null);
    const [editJob, setEditJob] = useState<any>(null);

    // Form state
    const [formData, setFormData] = useState<any>({
        job_title: '',
        designation: '',
        shift: 'General Shift',
        location: '',
        experience: '',
        status: 'Open',
        closes_on: '',
        description: '',
        skills_required: '',
    });

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

    useEffect(() => {
        const fetchPermissions = async () => {
            const perms = await getJobOpeningPermissions();
            setPermissions(perms);
        };
        fetchPermissions();
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

    const handleOpenCreate = () => {
        setEditJob(null);
        setFormData({
            job_title: '',
            designation: '',
            shift: 'General Shift',
            location: '',
            experience: '',
            status: 'Open',
            closes_on: '',
            description: '',
            skills_required: '',
        });
        setOpenCreate(true);
    };

    const handleCloseCreate = () => {
        setOpenCreate(false);
        setEditJob(null);
    };

    const handleEditRow = useCallback(async (row: any) => {
        try {
            const fullData = await getJobOpening(row.name);
            setEditJob(fullData);
            setFormData({
                job_title: fullData.job_title,
                designation: fullData.designation,
                shift: fullData.shift,
                location: fullData.location,
                experience: fullData.experience,
                status: fullData.status,
                closes_on: fullData.closes_on,
                description: fullData.description,
                skills_required: fullData.skills_required,
            });
            setOpenCreate(true);
        } catch (error: any) {
            setSnackbar({
                open: true,
                message: error.message || 'Failed to load record',
                severity: 'error',
            });
        }
    }, []);

    const handleViewRow = useCallback(async (row: any) => {
        try {
            const fullData = await getJobOpening(row.name);
            setViewJob(fullData);
            setOpenView(true);
        } catch (error: any) {
            setSnackbar({
                open: true,
                message: error.message || 'Failed to load record',
                severity: 'error',
            });
        }
    }, []);

    const handleDeleteRow = useCallback(async (name: string) => {
        try {
            await deleteJobOpening(name);
            setSnackbar({ open: true, message: 'Deleted successfully', severity: 'success' });
            refetch();
        } catch (error: any) {
            setSnackbar({ open: true, message: error.message || 'Delete failed', severity: 'error' });
        }
    }, [refetch]);

    const handleBulkDelete = async () => {
        try {
            await Promise.all(selected.map((name) => deleteJobOpening(name)));
            setSnackbar({ open: true, message: 'Deleted successfully', severity: 'success' });
            setSelected([]);
            refetch();
        } catch (error: any) {
            setSnackbar({ open: true, message: error.message || 'Bulk delete failed', severity: 'error' });
        }
    };

    const handleSubmit = async () => {
        try {
            if (editJob) {
                await updateJobOpening(editJob.name, formData);
                setSnackbar({ open: true, message: 'Updated successfully', severity: 'success' });
            } else {
                await createJobOpening(formData);
                setSnackbar({ open: true, message: 'Created successfully', severity: 'success' });
            }
            handleCloseCreate();
            refetch();
        } catch (error: any) {
            setSnackbar({ open: true, message: error.message || 'Action failed', severity: 'error' });
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

    return (
        <DashboardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 5 }}>
                <Typography variant="h4">Job Openings</Typography>
                {permissions.write && (
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<Iconify icon="mingcute:add-line" />}
                        onClick={handleOpenCreate}
                    >
                        New Job Opening
                    </Button>
                )}
            </Box>

            <Card>
                <JobOpeningTableToolbar
                    numSelected={selected.length}
                    filterName={filterName}
                    onFilterName={handleFilterByName}
                    onDelete={handleBulkDelete}
                />

                <Scrollbar>
                    <TableContainer sx={{ overflow: 'unset' }}>
                        <Table sx={{ minWidth: 800 }}>
                            <JobOpeningTableHead
                                order={order}
                                orderBy={orderBy}
                                rowCount={data.length}
                                numSelected={selected.length}
                                onSort={handleSort}
                                onSelectAllRows={(checked: boolean) => handleSelectAllRows(checked)}
                                headLabel={[
                                    { id: 'job_title', label: 'Job Title' },
                                    { id: 'location', label: 'Location' },
                                    { id: 'posted_on', label: 'Posted Date' },
                                    { id: 'status', label: 'Status' },
                                    { id: '', label: '' },
                                ]}
                            />
                            <TableBody>
                                {data.map((row) => (
                                    <JobOpeningTableRow
                                        key={row.name}
                                        row={{
                                            id: row.name,
                                            job_title: row.job_title,
                                            designation: row.designation,
                                            posted_on: row.posted_on,
                                            status: row.status,
                                            location: row.location,
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
                                                title="No job openings"
                                                description="Create your first job opening to start hiring."
                                                icon="solar:case-round-minimalistic-bold-duotone"
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
                <DialogTitle>{editJob ? 'Edit Job Opening' : 'New Job Opening'}</DialogTitle>
                <DialogContent>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <Stack spacing={3} sx={{ mt: 2 }}>
                            <TextField
                                fullWidth
                                label="Job Title"
                                value={formData.job_title}
                                onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                            />
                            <TextField
                                fullWidth
                                label="Designation"
                                value={formData.designation}
                                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                                placeholder="Manager, Developer, etc."
                            />
                            <Stack direction="row" spacing={2}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Shift"
                                    value={formData.shift}
                                    onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                                >
                                    <MenuItem value="General Shift">General Shift</MenuItem>
                                    <MenuItem value="Night Shift">Night Shift</MenuItem>
                                    <MenuItem value="WFH">WFH</MenuItem>
                                </TextField>
                                <TextField
                                    select
                                    fullWidth
                                    label="Status"
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                >
                                    <MenuItem value="Open">Open</MenuItem>
                                    <MenuItem value="Closed">Closed</MenuItem>
                                </TextField>
                            </Stack>
                            <Stack direction="row" spacing={2}>
                                <TextField
                                    fullWidth
                                    label="Location"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                />
                                <TextField
                                    fullWidth
                                    label="Experience"
                                    value={formData.experience}
                                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                                    placeholder="2-4 Years"
                                />
                            </Stack>
                            <DatePicker
                                label="Closes On"
                                value={formData.closes_on ? dayjs(formData.closes_on) : null}
                                onChange={(newValue) => setFormData({ ...formData, closes_on: newValue?.format('YYYY-MM-DD') || '' })}
                                slotProps={{
                                    textField: {
                                        fullWidth: true,
                                        InputLabelProps: { shrink: true },
                                    },
                                }}
                            />
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                label="Skills Required"
                                value={formData.skills_required}
                                onChange={(e) => setFormData({ ...formData, skills_required: e.target.value })}
                            />
                            <TextField
                                fullWidth
                                multiline
                                rows={4}
                                label="Description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </Stack>
                    </LocalizationProvider>
                </DialogContent>
                <DialogActions>
                    <Button variant="outlined" onClick={handleCloseCreate}>
                        Cancel
                    </Button>
                    <Button variant="contained" onClick={handleSubmit}>
                        {editJob ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* View Dialog */}
            <JobOpeningDetailsDialog
                open={openView}
                onClose={() => setOpenView(false)}
                job={viewJob}
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
        </DashboardContent>
    );
}
