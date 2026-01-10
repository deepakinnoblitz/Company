import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';

import { useSalarySlips } from 'src/hooks/useSalarySlips';

import { DashboardContent } from 'src/layouts/dashboard';
import {
    getSalarySlip,
} from 'src/api/salary-slips';

import { Scrollbar } from 'src/components/scrollbar';
import { EmptyContent } from 'src/components/empty-content';

import { TableNoData } from 'src/sections/user/table-no-data';
import { TableEmptyRows } from 'src/sections/user/table-empty-rows';
import { SalarySlipTableRow } from 'src/sections/salary-slips/salary-slip-table-row';
import { UserTableHead as SalarySlipTableHead } from 'src/sections/user/user-table-head';
import { UserTableToolbar as SalarySlipTableToolbar } from 'src/sections/user/user-table-toolbar';
import { SalarySlipDetailsDialog } from 'src/sections/report/salary-slips/salary-slip-details-dialog';

// ----------------------------------------------------------------------

export function SalarySlipsView() {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [filterName, setFilterName] = useState('');
    const [order, setOrder] = useState<'asc' | 'desc'>('desc');
    const [orderBy, setOrderBy] = useState('pay_period_start');
    const [selected, setSelected] = useState<string[]>([]);

    const { data, total } = useSalarySlips(
        page + 1,
        rowsPerPage,
        filterName,
        orderBy,
        order
    );

    // View state
    const [openView, setOpenView] = useState(false);
    const [viewSlip, setViewSlip] = useState<any>(null);

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

    const handleViewRow = useCallback(async (row: any) => {
        try {
            const fullData = await getSalarySlip(row.name);
            setViewSlip(fullData);
            setOpenView(true);
        } catch (error: any) {
            setSnackbar({
                open: true,
                message: error.message || 'Failed to load record',
                severity: 'error',
            });
        }
    }, []);

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
            <Box sx={{ mb: 5 }}>
                <Typography variant="h4">Salary Slips</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    View and download your monthly salary statements.
                </Typography>
            </Box>

            <Card>
                <SalarySlipTableToolbar
                    numSelected={selected.length}
                    filterName={filterName}
                    onFilterName={handleFilterByName}
                    searchPlaceholder="Search employee name..."
                />

                <Scrollbar>
                    <TableContainer sx={{ overflow: 'unset' }}>
                        <Table sx={{ minWidth: 800 }}>
                            <SalarySlipTableHead
                                order={order}
                                orderBy={orderBy}
                                rowCount={data.length}
                                numSelected={selected.length}
                                onSort={handleSort}
                                onSelectAllRows={(checked: boolean) => handleSelectAllRows(checked)}
                                headLabel={[
                                    { id: 'employee_name', label: 'Employee Name' },
                                    { id: 'pay_period_start', label: 'Pay Period' },
                                    { id: 'gross_pay', label: 'Gross Pay', align: 'right' },
                                    { id: 'net_pay', label: 'Net Pay', align: 'right' },
                                    { id: '', label: '', align: 'right' },
                                ]}
                            />
                            <TableBody>
                                {data.map((row) => (
                                    <SalarySlipTableRow
                                        key={row.name}
                                        row={{
                                            id: row.name,
                                            employee_name: row.employee_name,
                                            pay_period_start: row.pay_period_start,
                                            pay_period_end: row.pay_period_end,
                                            gross_pay: row.gross_pay,
                                            net_pay: row.net_pay,
                                        }}
                                        selected={selected.includes(row.name)}
                                        onSelectRow={() => handleSelectRow(row.name)}
                                        onView={() => handleViewRow(row)}
                                    />
                                ))}

                                {notFound && <TableNoData searchQuery={filterName} />}

                                {empty && (
                                    <TableRow>
                                        <TableCell colSpan={5}>
                                            <EmptyContent
                                                title="No salary slips"
                                                description="You haven't received any salary slips yet."
                                                icon="solar:wallet-bold-duotone"
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

            {/* View Dialog */}
            <SalarySlipDetailsDialog
                open={openView}
                onClose={() => setOpenView(false)}
                slip={viewSlip}
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
