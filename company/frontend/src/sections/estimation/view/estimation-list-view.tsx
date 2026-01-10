import { useState, useCallback } from 'react';

import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import TableBody from '@mui/material/TableBody';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';

import { useRouter } from 'src/routes/hooks';

import { useEstimations } from 'src/hooks/useEstimations';

import { deleteEstimation } from 'src/api/estimation';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/confirm-dialog';

import { emptyRows } from '../utils';
import { TableNoData } from '../table-no-data';
import { TableEmptyRows } from '../table-empty-rows';
import { EstimationTableRow } from '../estimation-table-row';
import { EstimationTableHead } from '../estimation-table-head';
import { EstimationTableToolbar } from '../estimation-table-toolbar';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
    { id: 'ref_no', label: 'Ref No' },
    { id: 'customer_name', label: 'Customer' },
    { id: 'estimate_date', label: 'Date' },
    { id: 'grand_total', label: 'Amount', align: 'right' },
    { id: '' },
];

// ----------------------------------------------------------------------

export function EstimationListView() {
    const table = useTable();
    const router = useRouter();

    const [confirmDelete, setConfirmDelete] = useState<{ open: boolean, id: string | null }>({ open: false, id: null });
    const [filterName, setFilterName] = useState('');
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success',
    });

    const { data, total, loading, refetch } = useEstimations(
        table.page,
        table.rowsPerPage,
        filterName
    );

    const handleFilterName = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            setFilterName(event.target.value);
            table.onResetPage();
        },
        [table]
    );

    const handleCreateNew = () => {
        router.push('/estimations/new');
    };

    const handleEditRow = (id: string) => {
        router.push(`/estimations/${encodeURIComponent(id)}/edit`);
    };

    const handleViewRow = (id: string) => {
        router.push(`/estimations/${encodeURIComponent(id)}/view`);
    };

    const handleDeleteRow = useCallback((id: string) => {
        setConfirmDelete({ open: true, id });
    }, []);

    const handleConfirmDelete = async () => {
        if (!confirmDelete.id) return;
        try {
            await deleteEstimation(confirmDelete.id);
            setSnackbar({ open: true, message: 'Estimation deleted successfully', severity: 'success' });
            await refetch();
        } catch (e) {
            console.error(e);
            setSnackbar({ open: true, message: 'Failed to delete estimation', severity: 'error' });
        } finally {
            setConfirmDelete({ open: false, id: null });
        }
    };

    const handleCloseSnackbar = () => {
        setSnackbar((prev) => ({ ...prev, open: false }));
    };

    const notFound = !loading && data.length === 0 && !!filterName;

    return (
        <DashboardContent>
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
                <Typography variant="h4">Estimations</Typography>
                <Button
                    variant="contained"
                    color="inherit"
                    startIcon={<Iconify icon="mingcute:add-line" />}
                    onClick={handleCreateNew}
                >
                    New Estimation
                </Button>
            </Stack>

            <Card>
                <EstimationTableToolbar
                    numSelected={table.selected.length}
                    filterName={filterName}
                    onFilterName={handleFilterName}
                />

                <Scrollbar>
                    <TableContainer sx={{ overflow: 'unset' }}>
                        <Table sx={{ minWidth: 800 }}>
                            <EstimationTableHead
                                order={table.order}
                                orderBy={table.orderBy}
                                rowCount={total}
                                numSelected={table.selected.length}
                                onSort={table.onSort}
                                onSelectAllRows={(checked) =>
                                    table.onSelectAllRows(
                                        checked,
                                        data.map((row) => row.name)
                                    )
                                }
                                headLabel={TABLE_HEAD}
                            />
                            <TableBody>
                                {data.map((row) => (
                                    <EstimationTableRow
                                        key={row.name}
                                        row={{
                                            id: row.name,
                                            ref_no: row.ref_no,
                                            client_name: row.customer_name || '',
                                            estimate_date: row.estimate_date,
                                            grand_total: row.grand_total || 0,
                                        }}
                                        selected={table.selected.includes(row.name)}
                                        onSelectRow={() => table.onSelectRow(row.name)}
                                        onEdit={() => handleEditRow(row.name)}
                                        onView={() => handleViewRow(row.name)}
                                        onDelete={() => handleDeleteRow(row.name)}
                                    />
                                ))}

                                <TableEmptyRows
                                    height={77}
                                    emptyRows={emptyRows(table.page, table.rowsPerPage, total)}
                                />

                                {notFound && <TableNoData searchQuery={filterName} />}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Scrollbar>

                <TablePagination
                    page={table.page}
                    component="div"
                    count={total}
                    rowsPerPage={table.rowsPerPage}
                    onPageChange={table.onChangePage}
                    rowsPerPageOptions={[5, 10, 25]}
                    onRowsPerPageChange={table.onChangeRowsPerPage}
                />
            </Card>

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
                content="Are you sure you want to delete this estimation?"
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

// ----------------------------------------------------------------------

export function useTable() {
    const [page, setPage] = useState(0);
    const [orderBy, setOrderBy] = useState('ref_no');
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [selected, setSelected] = useState<string[]>([]);
    const [order, setOrder] = useState<'asc' | 'desc'>('asc');

    const onSort = useCallback(
        (id: string) => {
            const isAsc = orderBy === id && order === 'asc';
            setOrder(isAsc ? 'desc' : 'asc');
            setOrderBy(id);
        },
        [order, orderBy]
    );

    const onSelectAllRows = useCallback((checked: boolean, ids: string[]) => {
        setSelected(checked ? ids : []);
    }, []);

    const onSelectRow = useCallback((value: string) => {
        setSelected((prev: string[]) =>
            prev.includes(value) ? prev.filter((v: string) => v !== value) : [...prev, value]
        );
    }, []);

    const onResetPage = () => setPage(0);

    const onChangePage = (_: unknown, newPage: number) => setPage(newPage);

    const onChangeRowsPerPage = (e: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(e.target.value, 10));
        onResetPage();
    };

    return {
        page,
        order,
        orderBy,
        rowsPerPage,
        selected,
        onSort,
        onSelectRow,
        onSelectAllRows,
        onResetPage,
        onChangePage,
        onChangeRowsPerPage,
    };
}
