import dayjs from 'dayjs';
import { useState, useCallback } from 'react';

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
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';
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

import { useAssets } from 'src/hooks/useAssets';

import { DashboardContent } from 'src/layouts/dashboard';
import { createAsset, updateAsset, deleteAsset, getAssetPermissions } from 'src/api/assets';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { EmptyContent } from 'src/components/empty-content';
import { ConfirmDialog } from 'src/components/confirm-dialog';

import { TableNoData } from 'src/sections/user/table-no-data';
import { TableEmptyRows } from 'src/sections/user/table-empty-rows';
import { AssetTableRow } from 'src/sections/assets/assets-table-row';
import { UserTableHead as AssetTableHead } from 'src/sections/user/user-table-head';
import { AssetDetailsDialog } from 'src/sections/report/assets/assets-details-dialog';
import { UserTableToolbar as AssetTableToolbar } from 'src/sections/user/user-table-toolbar';

// ----------------------------------------------------------------------

export function AssetsView() {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [filterName, setFilterName] = useState('');
    const [order, setOrder] = useState<'asc' | 'desc'>('desc');
    const [orderBy, setOrderBy] = useState('creation');
    const [selected, setSelected] = useState<string[]>([]);

    const { data, total, refetch } = useAssets(page + 1, rowsPerPage, filterName, orderBy, order);

    const [openCreate, setOpenCreate] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [currentAsset, setCurrentAsset] = useState<any>(null);
    const [confirmDelete, setConfirmDelete] = useState<{ open: boolean, id: string | null }>({ open: false, id: null });

    // View state
    const [openView, setOpenView] = useState(false);
    const [viewAsset, setViewAsset] = useState<any>(null);

    // Form state
    const [assetName, setAssetName] = useState('');
    const [assetTag, setAssetTag] = useState('');
    const [category, setCategory] = useState('');
    const [purchaseDate, setPurchaseDate] = useState('');
    const [purchaseCost, setPurchaseCost] = useState('');
    const [currentStatus, setCurrentStatus] = useState('Available');
    const [description, setDescription] = useState('');

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
        getAssetPermissions().then(setPermissions);
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
            await Promise.all(selected.map((name) => deleteAsset(name)));
            setSnackbar({ open: true, message: `${selected.length} asset(s) deleted successfully`, severity: 'success' });
            setSelected([]);
            refetch();
        } catch (error: any) {
            setSnackbar({ open: true, message: error.message || 'Failed to delete assets', severity: 'error' });
        }
    };

    const handleOpenCreate = () => {
        setIsEdit(false);
        setCurrentAsset(null);
        setAssetName('');
        setAssetTag('');
        setCategory('');
        setPurchaseDate('');
        setPurchaseCost('');
        setCurrentStatus('Available');
        setDescription('');
        setOpenCreate(true);
    };

    const handleCloseCreate = () => {
        setOpenCreate(false);
        setIsEdit(false);
        setCurrentAsset(null);
        setAssetName('');
        setAssetTag('');
        setCategory('');
        setPurchaseDate('');
        setPurchaseCost('');
        setCurrentStatus('Available');
        setDescription('');
    };

    const handleEditRow = useCallback((row: any) => {
        setCurrentAsset(row);
        setAssetName(row.asset_name || '');
        setAssetTag(row.asset_tag || '');
        setCategory(row.category || '');
        setPurchaseDate(row.purchase_date || '');
        setPurchaseCost(row.purchase_cost?.toString() || '');
        setCurrentStatus(row.current_status || 'Available');
        setDescription(row.description || '');
        setIsEdit(true);
        setOpenCreate(true);
    }, []);

    const handleViewRow = useCallback((row: any) => {
        setViewAsset(row);
        setOpenView(true);
    }, []);

    const handleDeleteRow = useCallback((id: string) => {
        setConfirmDelete({ open: true, id });
    }, []);

    const handleConfirmDelete = async () => {
        if (!confirmDelete.id) return;
        try {
            await deleteAsset(confirmDelete.id);
            setSnackbar({ open: true, message: 'Asset deleted successfully', severity: 'success' });
            refetch();
        } catch (error: any) {
            setSnackbar({ open: true, message: error.message || 'Failed to delete asset', severity: 'error' });
        } finally {
            setConfirmDelete({ open: false, id: null });
        }
    };

    const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const assetData = {
            asset_name: assetName.trim(),
            asset_tag: assetTag.trim(),
            category: category.trim(),
            purchase_date: purchaseDate,
            purchase_cost: parseFloat(purchaseCost) || 0,
            current_status: currentStatus,
            description: description.trim(),
        };

        try {
            if (isEdit && currentAsset) {
                await updateAsset(currentAsset.name, assetData);
                setSnackbar({ open: true, message: 'Asset updated successfully', severity: 'success' });
            } else {
                await createAsset(assetData);
                setSnackbar({ open: true, message: 'Asset created successfully', severity: 'success' });
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
                    Assets
                </Typography>

                {permissions.write && (
                    <Button
                        variant="contained"
                        startIcon={<Iconify icon="mingcute:add-line" />}
                        onClick={handleOpenCreate}
                        sx={{ bgcolor: '#08a3cd', color: 'common.white', '&:hover': { bgcolor: '#068fb3' } }}
                    >
                        New Asset
                    </Button>
                )}
            </Box>

            <Card>
                <AssetTableToolbar
                    numSelected={selected.length}
                    filterName={filterName}
                    onFilterName={handleFilterByName}
                    searchPlaceholder="Search assets..."
                    onDelete={selected.length > 0 ? handleBulkDelete : undefined}
                />

                <Scrollbar>
                    <TableContainer sx={{ overflow: 'unset' }}>
                        <Table sx={{ minWidth: 800 }}>
                            <AssetTableHead
                                order={order}
                                orderBy={orderBy}
                                rowCount={data.length}
                                numSelected={selected.length}
                                onSort={handleSort}
                                onSelectAllRows={(checked: boolean) => handleSelectAllRows(checked)}
                                headLabel={[
                                    { id: 'asset_name', label: 'Asset Name' },
                                    { id: 'asset_tag', label: 'Tag' },
                                    { id: 'category', label: 'Category' },
                                    { id: 'current_status', label: 'Status' },
                                    { id: 'purchase_cost', label: 'Cost' },
                                    { id: 'purchase_date', label: 'Purchase Date' },
                                    { id: '', label: '' },
                                ]}
                            />
                            <TableBody>
                                {data.map((row) => (
                                    <AssetTableRow
                                        key={row.name}
                                        row={{
                                            id: row.name,
                                            asset_name: row.asset_name,
                                            asset_tag: row.asset_tag,
                                            category: row.category,
                                            current_status: row.current_status,
                                            purchase_cost: row.purchase_cost,
                                            purchase_date: row.purchase_date,
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

                                {!empty && (
                                    <TableEmptyRows
                                        height={68}
                                        emptyRows={Math.max(0, rowsPerPage - data.length)}
                                    />
                                )}

                                {notFound && <TableNoData searchQuery={filterName} />}

                                {empty && (
                                    <TableRow>
                                        <TableCell colSpan={7}>
                                            <EmptyContent
                                                title="No assets found"
                                                description="You haven't added any assets yet. Click 'New Asset' to get started."
                                                icon="solar:laptop-bold-duotone"
                                            />
                                        </TableCell>
                                    </TableRow>
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
                <form onSubmit={handleCreate}>
                    <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        {isEdit ? 'Edit Asset' : 'New Asset'}
                        <IconButton onClick={handleCloseCreate}>
                            <Iconify icon="mingcute:close-line" />
                        </IconButton>
                    </DialogTitle>

                    <DialogContent dividers>
                        <Box sx={{ display: 'grid', gap: 3, margin: '1rem', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
                            <TextField
                                fullWidth
                                label="Asset Name"
                                value={assetName}
                                onChange={(e) => setAssetName(e.target.value)}
                                required
                                placeholder="Enter asset name"
                            />

                            <TextField
                                fullWidth
                                label="Asset Tag"
                                value={assetTag}
                                onChange={(e) => setAssetTag(e.target.value)}
                                required
                                placeholder="Enter asset tag/ID"
                            />

                            <TextField
                                fullWidth
                                label="Category"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                placeholder="e.g., Laptop, Furniture"
                            />

                            <FormControl fullWidth required>
                                <InputLabel>Status</InputLabel>
                                <Select
                                    value={currentStatus}
                                    onChange={(e) => setCurrentStatus(e.target.value)}
                                    label="Status"
                                >
                                    <MenuItem value="Available">Available</MenuItem>
                                    <MenuItem value="Assigned">Assigned</MenuItem>
                                    <MenuItem value="Maintenance">Maintenance</MenuItem>
                                    <MenuItem value="Disposed">Disposed</MenuItem>
                                </Select>
                            </FormControl>

                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    label="Purchase Date"
                                    value={purchaseDate ? dayjs(purchaseDate) : null}
                                    onChange={(newValue) => setPurchaseDate(newValue?.format('YYYY-MM-DD') || '')}
                                    slotProps={{
                                        textField: {
                                            fullWidth: true,
                                            InputLabelProps: { shrink: true },
                                        },
                                    }}
                                />
                            </LocalizationProvider>

                            <TextField
                                fullWidth
                                label="Purchase Cost"
                                type="number"
                                value={purchaseCost}
                                onChange={(e) => setPurchaseCost(e.target.value)}
                                placeholder="Enter cost"
                                inputProps={{ step: '0.01', min: '0' }}
                            />

                            <TextField
                                fullWidth
                                label="Description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                multiline
                                rows={3}
                                placeholder="Enter asset description"
                                sx={{ gridColumn: { xs: '1', sm: '1 / -1' } }}
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
            <AssetDetailsDialog
                open={openView}
                onClose={() => setOpenView(false)}
                asset={viewAsset}
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
                content="Are you sure you want to delete this asset?"
                action={
                    <Button onClick={handleConfirmDelete} color="error" variant="contained" sx={{ borderRadius: 1.5, minWidth: 100 }}>
                        Delete
                    </Button>
                }
            />
        </DashboardContent>
    );
}
