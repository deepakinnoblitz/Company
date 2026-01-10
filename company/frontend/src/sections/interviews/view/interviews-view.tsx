import dayjs from 'dayjs';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Rating from '@mui/material/Rating';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Snackbar from '@mui/material/Snackbar';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

import { useInterviews } from 'src/hooks/useInterviews';

import { getDoctypeList } from 'src/api/leads';
import { DashboardContent } from 'src/layouts/dashboard';
import {
    getInterview,
    createInterview,
    updateInterview,
    deleteInterview,
    getInterviewPermissions,
} from 'src/api/interviews';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { EmptyContent } from 'src/components/empty-content';

import { TableNoData } from 'src/sections/user/table-no-data';
import { TableEmptyRows } from 'src/sections/user/table-empty-rows';
import { InterviewTableRow } from 'src/sections/interviews/interview-table-row';
import { UserTableHead as InterviewTableHead } from 'src/sections/user/user-table-head';
import { InterviewDetailsDialog } from 'src/sections/interviews/interview-details-dialog';
import { UserTableToolbar as InterviewTableToolbar } from 'src/sections/user/user-table-toolbar';

// ----------------------------------------------------------------------

export function InterviewsView() {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [filterName, setFilterName] = useState('');
    const [order, setOrder] = useState<'asc' | 'desc'>('desc');
    const [orderBy, setOrderBy] = useState('creation');
    const [selected, setSelected] = useState<string[]>([]);

    const { data, total, refetch } = useInterviews(
        page + 1,
        rowsPerPage,
        filterName,
        orderBy,
        order
    );

    const [permissions, setPermissions] = useState({ read: false, write: false, delete: false });
    const [applicants, setApplicants] = useState<any[]>([]);
    const [interviewTypes, setInterviewTypes] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);

    // Dialog states
    const [openCreate, setOpenCreate] = useState(false);
    const [openView, setOpenView] = useState(false);
    const [viewInterview, setViewInterview] = useState<any>(null);
    const [editInterview, setEditInterview] = useState<any>(null);

    // Form state
    const [formData, setFormData] = useState<any>({
        job_applicant: '',
        scheduled_on: dayjs().format('YYYY-MM-DD'),
        from_time: '',
        to_time: '',
        overall_status: 'Scheduled',
        overall_performance: '',
        feedbacks: [],
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
        const fetchData = async () => {
            const perms = await getInterviewPermissions();
            setPermissions(perms);

            const [applicantsList, typesList, usersList] = await Promise.all([
                getDoctypeList('Job Applicant', ['name', 'applicant_name']),
                getDoctypeList('Interview Type', ['name']),
                getDoctypeList('User', ['name', 'full_name']),
            ]);
            setApplicants(applicantsList);
            setInterviewTypes(typesList);
            setUsers(usersList);
        };
        fetchData();
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
        setEditInterview(null);
        setFormData({
            job_applicant: '',
            scheduled_on: dayjs().format('YYYY-MM-DD'),
            from_time: '',
            to_time: '',
            overall_status: 'Scheduled',
            overall_performance: '',
            feedbacks: [],
        });
        setOpenCreate(true);
    };

    const handleCloseCreate = () => {
        setOpenCreate(false);
        setEditInterview(null);
    };

    const handleEditRow = useCallback(async (row: any) => {
        try {
            const fullData = await getInterview(row.name);
            setEditInterview(fullData);
            setFormData({
                job_applicant: fullData.job_applicant,
                scheduled_on: fullData.scheduled_on,
                from_time: fullData.from_time,
                to_time: fullData.to_time,
                overall_status: fullData.overall_status,
                overall_performance: fullData.overall_performance,
                feedbacks: fullData.feedbacks || [],
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
            const fullData = await getInterview(row.name);
            setViewInterview(fullData);
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
            await deleteInterview(name);
            setSnackbar({ open: true, message: 'Deleted successfully', severity: 'success' });
            refetch();
        } catch (error: any) {
            setSnackbar({ open: true, message: error.message || 'Delete failed', severity: 'error' });
        }
    }, [refetch]);

    const handleBulkDelete = async () => {
        try {
            await Promise.all(selected.map((name) => deleteInterview(name)));
            setSnackbar({ open: true, message: 'Deleted successfully', severity: 'success' });
            setSelected([]);
            refetch();
        } catch (error: any) {
            setSnackbar({ open: true, message: error.message || 'Bulk delete failed', severity: 'error' });
        }
    };

    const handleSubmit = async () => {
        try {
            const payload = {
                ...formData,
                scheduled_on: formData.scheduled_on ? dayjs(formData.scheduled_on).format('YYYY-MM-DD') : null,
            };

            if (editInterview) {
                await updateInterview(editInterview.name, payload);
                setSnackbar({ open: true, message: 'Updated successfully', severity: 'success' });
            } else {
                await createInterview(payload);
                setSnackbar({ open: true, message: 'Created successfully', severity: 'success' });
            }
            handleCloseCreate();
            refetch();
        } catch (error: any) {
            setSnackbar({ open: true, message: error.message || 'Action failed', severity: 'error' });
        }
    };

    const handleAddFeedback = () => {
        setFormData({
            ...formData,
            feedbacks: [
                ...formData.feedbacks,
                { interview_type: '', rating: 0, interviewer: '', notes: '' },
            ],
        });
    };

    const handleRemoveFeedback = (index: number) => {
        const newFeedbacks = [...formData.feedbacks];
        newFeedbacks.splice(index, 1);
        setFormData({ ...formData, feedbacks: newFeedbacks });
    };

    const handleFeedbackChange = (index: number, field: string, value: any) => {
        const newFeedbacks = [...formData.feedbacks];
        newFeedbacks[index] = { ...newFeedbacks[index], [field]: value };
        setFormData({ ...formData, feedbacks: newFeedbacks });
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
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 5 }}>
                <Typography variant="h4">Interviews</Typography>
                {permissions.write && (
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<Iconify icon="mingcute:add-line" />}
                        onClick={handleOpenCreate}
                    >
                        Schedule Interview
                    </Button>
                )}
            </Box>

            <Card>
                <InterviewTableToolbar
                    numSelected={selected.length}
                    filterName={filterName}
                    onFilterName={handleFilterByName}
                    onDelete={handleBulkDelete}
                    searchPlaceholder="Search by applicant..."
                />

                <Scrollbar>
                    <TableContainer sx={{ overflow: 'unset' }}>
                        <Table sx={{ minWidth: 800 }}>
                            <InterviewTableHead
                                order={order}
                                orderBy={orderBy}
                                rowCount={data.length}
                                numSelected={selected.length}
                                onSort={handleSort}
                                onSelectAllRows={(checked: boolean) => handleSelectAllRows(checked)}
                                headLabel={[
                                    { id: 'job_applicant', label: 'Applicant' },
                                    { id: 'scheduled_on', label: 'Schedule' },
                                    { id: 'overall_status', label: 'Status' },
                                    { id: '', label: '' },
                                ]}
                            />
                            <TableBody>
                                {data.map((row) => (
                                    <InterviewTableRow
                                        key={row.name}
                                        row={{
                                            id: row.name,
                                            job_applicant: row.job_applicant,
                                            job_applied: row.job_applied,
                                            scheduled_on: row.scheduled_on,
                                            from_time: row.from_time,
                                            overall_status: row.overall_status,
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
                                                title="No interviews scheduled"
                                                description="Start scheduling interviews for your shortlisted candidates."
                                                icon="solar:video-library-bold-duotone"
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
            <Dialog open={openCreate} onClose={handleCloseCreate} fullWidth maxWidth="md">
                <DialogTitle>{editInterview ? 'Edit Interview' : 'Schedule Interview'}</DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ mt: 2 }}>
                        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
                            <TextField
                                select
                                fullWidth
                                label="Job Applicant"
                                value={formData.job_applicant}
                                onChange={(e) => setFormData({ ...formData, job_applicant: e.target.value })}
                                required
                            >
                                {applicants.map((app) => (
                                    <MenuItem key={app.name} value={app.name}>
                                        {app.applicant_name || app.name}
                                    </MenuItem>
                                ))}
                            </TextField>

                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    label="Scheduled On"
                                    value={formData.scheduled_on ? dayjs(formData.scheduled_on) : null}
                                    onChange={(newValue) => {
                                        setFormData({ ...formData, scheduled_on: newValue?.isValid() ? newValue.format('YYYY-MM-DD') : '' });
                                    }}
                                    slotProps={{ textField: { fullWidth: true } }}
                                />
                            </LocalizationProvider>

                            <TextField
                                fullWidth
                                label="From Time"
                                type="time"
                                value={formData.from_time}
                                onChange={(e) => setFormData({ ...formData, from_time: e.target.value })}
                                InputLabelProps={{ shrink: true }}
                            />

                            <TextField
                                fullWidth
                                label="To Time"
                                type="time"
                                value={formData.to_time}
                                onChange={(e) => setFormData({ ...formData, to_time: e.target.value })}
                                InputLabelProps={{ shrink: true }}
                            />

                            <TextField
                                select
                                fullWidth
                                label="Overall Status"
                                value={formData.overall_status}
                                onChange={(e) => setFormData({ ...formData, overall_status: e.target.value })}
                            >
                                <MenuItem value="Applied">Applied</MenuItem>
                                <MenuItem value="Screening">Screening</MenuItem>
                                <MenuItem value="Shortlisted">Shortlisted</MenuItem>
                                <MenuItem value="Scheduled">Scheduled</MenuItem>
                                <MenuItem value="In Progress">In Progress</MenuItem>
                                <MenuItem value="Completed">Completed</MenuItem>
                                <MenuItem value="No-Show">No-Show</MenuItem>
                                <MenuItem value="Cancelled">Cancelled</MenuItem>
                                <MenuItem value="Rescheduled">Rescheduled</MenuItem>
                                <MenuItem value="Selected">Selected</MenuItem>
                                <MenuItem value="Rejected">Rejected</MenuItem>
                                <MenuItem value="On Hold">On Hold</MenuItem>
                            </TextField>

                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                label="Overall Performance"
                                value={formData.overall_performance}
                                onChange={(e) => setFormData({ ...formData, overall_performance: e.target.value })}
                                sx={{ gridColumn: 'span 2' }}
                            />
                        </Box>

                        <Divider sx={{ my: 2 }}>Feedbacks</Divider>

                        <Stack spacing={2}>
                            {formData.feedbacks.map((fb: any, index: number) => (
                                <Box key={index} sx={{ p: 2, border: (theme) => `dashed 1px ${theme.vars.palette.divider}`, borderRadius: 1, position: 'relative' }}>
                                    <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => handleRemoveFeedback(index)}
                                        sx={{ position: 'absolute', top: 8, right: 8 }}
                                    >
                                        <Iconify icon={"solar:trash-bin-trash-bold" as any} />
                                    </IconButton>
                                    <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, mt: 2 }}>
                                        <TextField
                                            select
                                            fullWidth
                                            label="Interview Type"
                                            value={fb.interview_type}
                                            onChange={(e) => handleFeedbackChange(index, 'interview_type', e.target.value)}
                                        >
                                            {interviewTypes.map((type) => (
                                                <MenuItem key={type.name} value={type.name}>
                                                    {type.name}
                                                </MenuItem>
                                            ))}
                                        </TextField>

                                        <TextField
                                            select
                                            fullWidth
                                            label="Interviewer"
                                            value={fb.interviewer}
                                            onChange={(e) => handleFeedbackChange(index, 'interviewer', e.target.value)}
                                        >
                                            {users.map((user) => (
                                                <MenuItem key={user.name} value={user.name}>
                                                    {user.full_name || user.name}
                                                </MenuItem>
                                            ))}
                                        </TextField>

                                        <Box sx={{ gridColumn: 'span 2' }}>
                                            <Typography component="legend">Rating</Typography>
                                            <Rating
                                                name={`rating-${index}`}
                                                value={fb.rating}
                                                onChange={(event, newValue) => handleFeedbackChange(index, 'rating', newValue)}
                                            />
                                        </Box>

                                        <TextField
                                            fullWidth
                                            multiline
                                            rows={2}
                                            label="Notes"
                                            value={fb.notes}
                                            onChange={(e) => handleFeedbackChange(index, 'notes', e.target.value)}
                                            sx={{ gridColumn: 'span 2' }}
                                        />
                                    </Box>
                                </Box>
                            ))}
                            <Button
                                variant="outlined"
                                startIcon={<Iconify icon="mingcute:add-line" />}
                                onClick={handleAddFeedback}
                                sx={{ alignSelf: 'flex-start' }}
                            >
                                Add Feedback
                            </Button>
                        </Stack>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button variant="outlined" onClick={handleCloseCreate}>
                        Cancel
                    </Button>
                    <Button variant="contained" onClick={handleSubmit}>
                        {editInterview ? 'Update' : 'Schedule'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* View Dialog */}
            <InterviewDetailsDialog
                open={openView}
                onClose={() => setOpenView(false)}
                interview={viewInterview}
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
