import * as XLSX from 'xlsx';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import FormControl from '@mui/material/FormControl';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

import { runReport } from 'src/api/reports';
import { getDoctypeList } from 'src/api/leads';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

import { LeadDetailsDialog } from '../lead-details-dialog';
import { ExportFieldsDialog } from '../export-fields-dialog';

// ----------------------------------------------------------------------

export function LeadReportView() {
    const [reportData, setReportData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Filters
    const [fromDate, setFromDate] = useState<any>(null);
    const [toDate, setToDate] = useState<any>(null);
    const [leadsType, setLeadsType] = useState('all');
    const [leadsFrom, setLeadsFrom] = useState('all');
    const [owner, setOwner] = useState('all');

    // Options
    const [leadsFromOptions, setLeadsFromOptions] = useState<string[]>([]);
    const [ownerOptions, setOwnerOptions] = useState<string[]>([]);

    // Pagination
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // View Details
    const [openView, setOpenView] = useState(false);
    const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

    // Selection
    const [selected, setSelected] = useState<string[]>([]);


    const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            const newSelected = reportData.map((n) => n.name);
            setSelected(newSelected);
            return;
        }
        setSelected([]);
    };

    const handleClick = (event: React.MouseEvent<unknown>, name: string) => {
        const selectedIndex = selected.indexOf(name);
        let newSelected: string[] = [];

        if (selectedIndex === -1) {
            newSelected = newSelected.concat(selected, name);
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

    // Export Fields Dialog
    const [openExportFields, setOpenExportFields] = useState(false);

    const handleExport = async (selectedFields: string[], format: 'excel' | 'csv') => {
        setLoading(true);
        try {
            // Construct filters for get_list
            const filters: any[] = [];

            if (selected.length > 0) {
                filters.push(['Lead', 'name', 'in', selected]);
            } else {
                // Replicate report filters
                if (fromDate) filters.push(['Lead', 'creation', '>=', fromDate.format('YYYY-MM-DD')]);
                if (toDate) filters.push(['Lead', 'creation', '<=', toDate.format('YYYY-MM-DD')]);
                if (leadsType !== 'all') filters.push(['Lead', 'leads_type', '=', leadsType]);
                if (leadsFrom !== 'all') filters.push(['Lead', 'leads_from', '=', leadsFrom]);
                if (owner !== 'all') {
                    if (owner === 'empty') filters.push(['Lead', 'owner', '=', '']);
                    else filters.push(['Lead', 'owner', '=', owner]);
                }
            }

            // Build query params
            const query = new URLSearchParams({
                doctype: "Lead",
                fields: JSON.stringify(selectedFields),
                filters: JSON.stringify(filters),
                limit_page_length: "99999", // Fetch all
            });

            const res = await fetch(`/api/method/frappe.client.get_list?${query.toString()}`, { credentials: "include" });
            if (!res.ok) throw new Error("Failed to fetch data for export");
            const data = (await res.json()).message || [];

            // Export
            const worksheet = XLSX.utils.json_to_sheet(data);

            if (format === 'excel') {
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");
                XLSX.writeFile(workbook, "Lead_Report.xlsx");
            } else {
                const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
                const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement("a");
                const url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute("download", "Lead_Report.csv");
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }

        } catch (error) {
            console.error(error);
            // Maybe show a snackbar error?
        } finally {
            setLoading(false);
        }
    };

    const handleViewLead = useCallback((id: string) => {
        setSelectedLeadId(id);
        setOpenView(true);
    }, []);

    const onChangePage = useCallback((event: unknown, newPage: number) => {
        setPage(newPage);
    }, []);

    const onChangeRowsPerPage = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    }, []);

    const fetchReport = useCallback(async () => {
        setLoading(true);
        try {
            const filters: any = {};
            if (fromDate) filters.from_date = fromDate.format('YYYY-MM-DD');
            if (toDate) filters.to_date = toDate.format('YYYY-MM-DD');
            if (leadsType !== 'all') filters.leads_type = leadsType;
            if (leadsFrom !== 'all') filters.leads_from = leadsFrom;
            if (owner !== 'all') filters.owner = owner;

            const result = await runReport('Lead', filters);
            setReportData(result.result || []);
            setPage(0);
        } catch (error) {
            console.error('Failed to fetch lead report:', error);
        } finally {
            setLoading(false);
        }
    }, [fromDate, toDate, leadsType, leadsFrom, owner]);

    useEffect(() => {
        fetchReport();
    }, [fetchReport]);

    useEffect(() => {
        getDoctypeList('Lead From').then(setLeadsFromOptions);
        getDoctypeList('User').then(setOwnerOptions);
    }, []);

    const totalLeads = reportData.length;
    const incomingLeads = reportData.filter((l: any) => l.leads_type === 'Incoming').length;
    const outgoingLeads = reportData.filter((l: any) => l.leads_type === 'Outgoing').length;

    return (
        <DashboardContent>
            <Stack spacing={4} sx={{ mt: 3, mb: 5 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography variant="h4">
                        Lead Report
                    </Typography>
                    <Box>
                        <Button
                            variant="contained"
                            color="inherit"
                            startIcon={<Iconify icon={"solar:export-bold" as any} />}
                            onClick={() => setOpenExportFields(true)}
                        >
                            Export
                        </Button>
                    </Box>
                </Stack>

                {/* Filters */}
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <Card
                        sx={{
                            p: 2.5,
                            boxShadow: '0 0 2px 0 rgba(145, 158, 171, 0.2), 0 12px 24px -4px rgba(145, 158, 171, 0.12)',
                        }}
                    >
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
                            <DatePicker
                                label="From Date"
                                value={fromDate}
                                onChange={setFromDate}
                                slotProps={{ textField: { size: 'small', fullWidth: true } }}
                            />
                            <DatePicker
                                label="To Date"
                                value={toDate}
                                onChange={setToDate}
                                slotProps={{ textField: { size: 'small', fullWidth: true } }}
                            />

                            <FormControl fullWidth size="small">
                                <Select
                                    value={leadsType}
                                    onChange={(e) => setLeadsType(e.target.value)}
                                    displayEmpty
                                >
                                    <MenuItem value="all">Leads Type</MenuItem>
                                    <MenuItem value="Incoming">Incoming</MenuItem>
                                    <MenuItem value="Outgoing">Outgoing</MenuItem>
                                </Select>
                            </FormControl>

                            <FormControl fullWidth size="small">
                                <Select
                                    value={leadsFrom}
                                    onChange={(e) => setLeadsFrom(e.target.value)}
                                    displayEmpty
                                >
                                    <MenuItem value="all">Leads From</MenuItem>
                                    {leadsFromOptions.map((opt) => (
                                        <MenuItem key={opt} value={opt}>
                                            {opt}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl fullWidth size="small">
                                <Select
                                    value={owner}
                                    onChange={(e) => setOwner(e.target.value)}
                                    displayEmpty
                                >
                                    <MenuItem value="all">Owner</MenuItem>
                                    <MenuItem value="Administrator">Administrator</MenuItem>
                                    <MenuItem value="empty">Empty</MenuItem>
                                    {ownerOptions
                                        .filter((opt) => opt !== 'Administrator')
                                        .map((opt) => (
                                            <MenuItem key={opt} value={opt}>
                                                {opt}
                                            </MenuItem>
                                        ))}
                                </Select>
                            </FormControl>
                        </Stack>
                    </Card>
                </LocalizationProvider>

                {/* Summary Stats */}
                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={3}
                    justifyContent="center"
                    sx={{ py: 2 }}
                >
                    <SummaryCard title="Total Leads" value={totalLeads} color="#2196F3" />
                    <SummaryCard title="Incoming Leads" value={incomingLeads} color="#4CAF50" />
                    <SummaryCard title="Outgoing Leads" value={outgoingLeads} color="#FF9800" />
                </Stack>

                {/* Data Table */}
                <Card
                    sx={{
                        boxShadow: '0 0 2px 0 rgba(145, 158, 171, 0.2), 0 12px 24px -4px rgba(145, 158, 171, 0.12)',
                    }}
                >
                    <Scrollbar>
                        <TableContainer sx={{ minWidth: 900, maxHeight: 440, overflowY: 'auto' }}>
                            <Table size="medium" stickyHeader>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#f4f6f8' }}>
                                        <TableCell padding="checkbox">
                                            <Checkbox
                                                indeterminate={selected.length > 0 && selected.length < reportData.length}
                                                checked={reportData.length > 0 && selected.length === reportData.length}
                                                onChange={handleSelectAllClick}
                                            />
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Lead Name</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Company</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Phone</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Email</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Service</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Leads Type</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Leads From</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Owner</TableCell>
                                        <TableCell
                                            align="right"
                                            sx={{
                                                fontWeight: 700,
                                                color: 'text.secondary',
                                                position: 'sticky',
                                                right: 0,
                                                bgcolor: '#f4f6f8',
                                                zIndex: 11,
                                                boxShadow: '-2px 0 4px rgba(145, 158, 171, 0.08)',
                                            }}
                                        >
                                            Actions
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {reportData
                                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                        .map((row, index) => {
                                            const isSelected = selected.indexOf(row.name) !== -1;
                                            return (
                                                <TableRow
                                                    key={index}
                                                    hover
                                                    role="checkbox"
                                                    aria-checked={isSelected}
                                                    selected={isSelected}
                                                >
                                                    <TableCell padding="checkbox">
                                                        <Checkbox
                                                            checked={isSelected}
                                                            onClick={(event) => handleClick(event, row.name)}
                                                        />
                                                    </TableCell>
                                                    <TableCell>{row.lead_name}</TableCell>
                                                    <TableCell>{row.company_name}</TableCell>
                                                    <TableCell>{row.phone_number}</TableCell>
                                                    <TableCell>{row.email}</TableCell>
                                                    <TableCell>{row.service}</TableCell>
                                                    <TableCell>{row.leads_type}</TableCell>
                                                    <TableCell>{row.leads_from}</TableCell>
                                                    <TableCell>{row.owner_name}</TableCell>
                                                    <TableCell
                                                        align="right"
                                                        sx={{
                                                            position: 'sticky',
                                                            right: 0,
                                                            bgcolor: 'background.paper',
                                                            boxShadow: '-2px 0 4px rgba(145, 158, 171, 0.08)',
                                                        }}
                                                    >
                                                        <IconButton onClick={() => handleViewLead(row.name)} sx={{ color: 'info.main' }}>
                                                            <Iconify icon="solar:eye-bold" />
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    {reportData.length === 0 && !loading && (
                                        <TableRow>
                                            <TableCell colSpan={8} align="center" sx={{ py: 10 }}>
                                                <Stack spacing={1} alignItems="center">
                                                    <Iconify icon={"eva:slash-outline" as any} width={48} sx={{ color: 'text.disabled' }} />
                                                    <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                                                        No data found
                                                    </Typography>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Scrollbar>
                    <TablePagination
                        component="div"
                        count={reportData.length}
                        page={page}
                        onPageChange={onChangePage}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={onChangeRowsPerPage}
                        rowsPerPageOptions={[5, 10, 25]}
                    />
                </Card>
            </Stack>

            <LeadDetailsDialog
                open={openView}
                leadId={selectedLeadId}
                onClose={() => {
                    setOpenView(false);
                    setSelectedLeadId(null);
                }}
            />

            <ExportFieldsDialog
                open={openExportFields}
                onClose={() => setOpenExportFields(false)}
                doctype="Lead"
                onExport={handleExport}
            />
        </DashboardContent >
    );
}

// ----------------------------------------------------------------------

function SummaryCard({ title, value, color }: { title: string; value: number; color: string }) {
    const getIcon = () => {
        switch (title) {
            case 'Total Leads': return 'solar:target-bold-duotone';
            case 'Incoming Leads': return 'solar:inbox-in-bold-duotone';
            case 'Outgoing Leads': return 'solar:inbox-out-bold-duotone';
            default: return 'solar:chart-bold-duotone';
        }
    };

    return (
        <Card
            sx={{
                py: 2.5,
                px: 3,
                width: { xs: 1, sm: 220 },
                boxShadow: '0 0 2px 0 rgba(145, 158, 171, 0.2), 0 12px 24px -4px rgba(145, 158, 171, 0.12)',
                borderRadius: 2,
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    bgcolor: color,
                },
            }}
        >
            <Stack direction="row" spacing={2} alignItems="center">
                <Box
                    sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: `${color}15`,
                        flexShrink: 0,
                    }}
                >
                    <Iconify icon={getIcon() as any} width={24} sx={{ color }} />
                </Box>
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography variant="h2" sx={{ color: 'text.primary', fontWeight: 800, mb: 0.25 }}>
                        {value}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.8125rem' }}>
                        {title}
                    </Typography>
                </Box>
            </Stack>
        </Card>
    );
}
