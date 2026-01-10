import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Snackbar from '@mui/material/Snackbar';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TextField from '@mui/material/TextField';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';

import { useAnnouncements } from 'src/hooks/useAnnouncements';

import { DashboardContent } from 'src/layouts/dashboard';
import { createAnnouncement, updateAnnouncement, deleteAnnouncement, getAnnouncementPermissions } from 'src/api/announcements';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { EmptyContent } from 'src/components/empty-content';
import { ConfirmDialog } from 'src/components/confirm-dialog';

import { TableNoData } from 'src/sections/user/table-no-data';
import { TableEmptyRows } from 'src/sections/user/table-empty-rows';
import { AnnouncementTableRow } from 'src/sections/announcements/announcements-table-row';
import { UserTableHead as AnnouncementTableHead } from 'src/sections/user/user-table-head';
import { UserTableToolbar as AnnouncementTableToolbar } from 'src/sections/user/user-table-toolbar';
import { AnnouncementDetailsDialog } from 'src/sections/report/announcements/announcements-details-dialog';

// ----------------------------------------------------------------------

export function AnnouncementsView() {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [filterName, setFilterName] = useState('');
    const [order, setOrder] = useState<'asc' | 'desc'>('desc');
    const [orderBy, setOrderBy] = useState('creation');
    const [selected, setSelected] = useState<string[]>([]);

    const { data, total, refetch } = useAnnouncements(page + 1, rowsPerPage, filterName, orderBy, order);

    const [openCreate, setOpenCreate] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [currentAnnouncement, setCurrentAnnouncement] = useState<any>(null);
    const [confirmDelete, setConfirmDelete] = useState<{ open: boolean, id: string | null }>({ open: false, id: null });

    // Form state
    const [announcementName, setAnnouncementName] = useState('');
    const [announcement, setAnnouncement] = useState('');

    // View dialog state
    const [openView, setOpenView] = useState(false);
    const [viewAnnouncement, setViewAnnouncement] = useState<any>(null);

    // Permissions
    const [permissions, setPermissions] = useState({ read: false, write: false, delete: false });

    // Snackbar
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success',
    });

    // Load permissions
    useState(() => {
        getAnnouncementPermissions().then(setPermissions);
    });

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
            await Promise.all(selected.map((name) => deleteAnnouncement(name)));
            setSnackbar({ open: true, message: `${selected.length} announcement(s) deleted successfully`, severity: 'success' });
            setSelected([]);
            refetch();
        } catch (error: any) {
            setSnackbar({ open: true, message: error.message || 'Failed to delete announcements', severity: 'error' });
        }
    };

    const handleOpenCreate = () => {
        setIsEdit(false);
        setCurrentAnnouncement(null);
        setAnnouncementName('');
        setAnnouncement('');
        setOpenCreate(true);
    };

    const handleCloseCreate = () => {
        setOpenCreate(false);
        setIsEdit(false);
        setCurrentAnnouncement(null);
        setAnnouncementName('');
        setAnnouncement('');
    };

    const handleEditRow = useCallback((row: any) => {
        setCurrentAnnouncement(row);
        setAnnouncementName(row.announcement_name || '');
        setAnnouncement(row.announcement || '');
        setIsEdit(true);
        setOpenCreate(true);
    }, []);

    const handleViewRow = useCallback((row: any) => {
        setViewAnnouncement(row);
        setOpenView(true);
    }, []);

    const handleDeleteRow = useCallback((id: string) => {
        setConfirmDelete({ open: true, id });
    }, []);

    const handleConfirmDelete = async () => {
        if (!confirmDelete.id) return;
        try {
            await deleteAnnouncement(confirmDelete.id);
            setSnackbar({ open: true, message: 'Announcement deleted successfully', severity: 'success' });
            refetch();
        } catch (error: any) {
            setSnackbar({ open: true, message: error.message || 'Failed to delete announcement', severity: 'error' });
        } finally {
            setConfirmDelete({ open: false, id: null });
        }
    };

    const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const announcementData = {
            announcement_name: announcementName.trim(),
            announcement: announcement.trim(),
        };

        try {
            if (isEdit && currentAnnouncement) {
                await updateAnnouncement(currentAnnouncement.name, announcementData);
                setSnackbar({ open: true, message: 'Announcement updated successfully', severity: 'success' });
            } else {
                await createAnnouncement(announcementData);
                setSnackbar({ open: true, message: 'Announcement created successfully', severity: 'success' });
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
                    Announcements
                </Typography>

                {permissions.write && (
                    <Button
                        variant="contained"
                        startIcon={<Iconify icon="mingcute:add-line" />}
                        onClick={handleOpenCreate}
                        sx={{ bgcolor: '#08a3cd', color: 'common.white', '&:hover': { bgcolor: '#068fb3' } }}
                    >
                        New Announcement
                    </Button>
                )}
            </Box>

            <Card>
                <AnnouncementTableToolbar
                    numSelected={selected.length}
                    filterName={filterName}
                    onFilterName={handleFilterByName}
                    searchPlaceholder="Search announcements..."
                    onDelete={selected.length > 0 ? handleBulkDelete : undefined}
                />

                <Scrollbar>
                    <TableContainer sx={{ overflow: 'unset' }}>
                        <Table sx={{ minWidth: 800 }}>
                            <AnnouncementTableHead
                                order={order}
                                orderBy={orderBy}
                                rowCount={data.length}
                                numSelected={selected.length}
                                onSort={handleSort}
                                onSelectAllRows={(checked: boolean) => handleSelectAllRows(checked)}
                                headLabel={[
                                    { id: 'announcement_name', label: 'Title' },
                                    { id: 'announcement', label: 'Announcement' },
                                    { id: 'creation', label: 'Created On' },
                                    { id: '', label: '' },
                                ]}
                            />
                            <TableBody>
                                {data.map((row) => (
                                    <AnnouncementTableRow
                                        key={row.name}
                                        row={{
                                            id: row.name,
                                            announcement_name: row.announcement_name,
                                            announcement: row.announcement,
                                            creation: row.creation,
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
                                                title="No announcements"
                                                description="There are no announcements to display at this time."
                                                icon="solar:bell-bold-duotone"
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
                    <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        {isEdit ? 'Edit Announcement' : 'New Announcement'}
                        <IconButton onClick={handleCloseCreate}>
                            <Iconify icon="mingcute:close-line" />
                        </IconButton>
                    </DialogTitle>

                    <DialogContent dividers>
                        <Box sx={{ display: 'grid', gap: 3, margin: '1rem' }}>
                            <TextField
                                fullWidth
                                label="Title"
                                value={announcementName}
                                onChange={(e) => setAnnouncementName(e.target.value)}
                                required
                                placeholder="Enter announcement title"
                            />

                            <TextField
                                fullWidth
                                label="Announcement"
                                value={announcement}
                                onChange={(e) => setAnnouncement(e.target.value)}
                                multiline
                                rows={6}
                                placeholder="Enter announcement details"
                                required
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
            <AnnouncementDetailsDialog
                open={openView}
                onClose={() => setOpenView(false)}
                announcement={viewAnnouncement}
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
                content="Are you sure you want to delete this announcement?"
                action={
                    <Button onClick={handleConfirmDelete} color="error" variant="contained" sx={{ borderRadius: 1.5, minWidth: 100 }}>
                        Delete
                    </Button>
                }
            />
        </DashboardContent>
    );
}
