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

import { ExportFieldsDialog } from '../../export-fields-dialog';
import { MeetingDetailsDialog } from '../meeting-details-dialog';

// ----------------------------------------------------------------------

export function MeetingReportView() {
    const [reportData, setReportData] = useState<any[]>([]);
    const [summaryData, setSummaryData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Filters
    const [fromDate, setFromDate] = useState<any>(null);
    const [toDate, setToDate] = useState<any>(null);
    const [meetFor, setMeetFor] = useState('all');
    const [status, setStatus] = useState('all');
    const [owner, setOwner] = useState('all');
    const [reminder, setReminder] = useState('all');

    // Options
    const [ownerOptions, setOwnerOptions] = useState<string[]>([]);
    const [statusOptions] = useState(['Scheduled', 'Completed', 'Overdue', 'Cancelled']);
    const [meetForOptions] = useState(['Lead', 'Contact', 'Prospect', 'Customer']);

    // Pagination
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // View Details
    const [openView, setOpenView] = useState(false);
    const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);

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
            const idsToExport = selected.length > 0 ? selected : reportData.map(r => r.name);

            if (idsToExport.length === 0) {
                setLoading(false);
                return;
            }

            const filters: any[] = [['HD Meeting Log', 'name', 'in', idsToExport]];

            const query = new URLSearchParams({
                doctype: "HD Meeting Log",
                fields: JSON.stringify(selectedFields),
                filters: JSON.stringify(filters),
                limit_page_length: "99999",
            });

            const res = await fetch(`/api/method/frappe.client.get_list?${query.toString()}`, { credentials: "include" });
            if (!res.ok) throw new Error("Failed to fetch data for export");
            const data = (await res.json()).message || [];

            // Export
            const worksheet = XLSX.utils.json_to_sheet(data);

            if (format === 'excel') {
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, "Meetings");
                XLSX.writeFile(workbook, "Meeting_Report.xlsx");
            } else {
                const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
                const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement("a");
                const url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute("download", "Meeting_Report.csv");
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewMeeting = useCallback((id: string) => {
        setSelectedMeetingId(id);
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
            if (meetFor !== 'all') filters.meet_for = meetFor;
            if (status !== 'all') filters.status = status;
            if (owner !== 'all') filters.owner = owner;
            if (reminder !== 'all') filters.enable_reminder = reminder;

            const result = await runReport('Meeting Report', filters);
            setReportData(result.result || []);
            setSummaryData(result.report_summary || []);
            setPage(0);
        } catch (error) {
            console.error('Failed to fetch meeting report:', error);
        } finally {
            setLoading(false);
        }
    }, [fromDate, toDate, meetFor, status, owner, reminder]);

    useEffect(() => {
        fetchReport();
    }, [fetchReport]);

    useEffect(() => {
        getDoctypeList('User').then(setOwnerOptions);
    }, []);

    return (
        <DashboardContent>
            <Stack spacing={4} sx={{ mt: 3, mb: 5 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography variant="h4">
                        Meeting Report
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
                                label="From"
                                value={fromDate}
                                onChange={setFromDate}
                                slotProps={{ textField: { size: 'small', fullWidth: true } }}
                            />
                            <DatePicker
                                label="To"
                                value={toDate}
                                onChange={setToDate}
                                slotProps={{ textField: { size: 'small', fullWidth: true } }}
                            />

                            <FormControl fullWidth size="small">
                                <Select
                                    value={meetFor}
                                    onChange={(e) => setMeetFor(e.target.value)}
                                    displayEmpty
                                >
                                    <MenuItem value="all">Meet For</MenuItem>
                                    {meetForOptions.map((opt) => (
                                        <MenuItem key={opt} value={opt}>
                                            {opt}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl fullWidth size="small">
                                <Select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    displayEmpty
                                >
                                    <MenuItem value="all">Status</MenuItem>
                                    {statusOptions.map((opt) => (
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
                                    {ownerOptions
                                        .filter((opt) => opt !== 'Administrator')
                                        .map((opt) => (
                                            <MenuItem key={opt} value={opt}>
                                                {opt}
                                            </MenuItem>
                                        ))}
                                </Select>
                            </FormControl>

                            <FormControl fullWidth size="small">
                                <Select
                                    value={reminder}
                                    onChange={(e) => setReminder(e.target.value)}
                                    displayEmpty
                                >
                                    <MenuItem value="all">Reminder</MenuItem>
                                    <MenuItem value="1">Enabled</MenuItem>
                                    <MenuItem value="0">Disabled</MenuItem>
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
                    {summaryData.map((card, index) => (
                        <SummaryCard
                            key={index}
                            title={card.label}
                            value={card.value}
                            color={getIndicatorColor(card.indicator)}
                        />
                    ))}
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
                                        <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Title</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Meet For</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Reference</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Status</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Start Time</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Venue</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Location</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Owner</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Reminder</TableCell>
                                        <TableCell
                                            align="center"
                                            sx={{
                                                fontWeight: 700,
                                                color: 'text.secondary',
                                                position: 'sticky',
                                                right: 0,
                                                bgcolor: '#f4f6f8',
                                                zIndex: 1,
                                                boxShadow: '-2px 0 5px rgba(0,0,0,0.05)',
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
                                                    <TableCell>{row.title}</TableCell>
                                                    <TableCell>{row.meet_for}</TableCell>
                                                    <TableCell>{row.lead_name}</TableCell>
                                                    <TableCell>{row.outgoing_call_status}</TableCell>
                                                    <TableCell>{row.from_time ? new Date(row.from_time).toLocaleString() : '-'}</TableCell>
                                                    <TableCell>{row.meeting_venue}</TableCell>
                                                    <TableCell>{row.location}</TableCell>
                                                    <TableCell>{row.owner_name}</TableCell>
                                                    <TableCell>{row.enable_reminder}</TableCell>
                                                    <TableCell
                                                        align="center"
                                                        sx={{
                                                            position: 'sticky',
                                                            right: 0,
                                                            bgcolor: 'background.paper',
                                                            boxShadow: '-2px 0 5px rgba(0,0,0,0.05)',
                                                        }}
                                                    >
                                                        <IconButton onClick={() => handleViewMeeting(row.name)} sx={{ color: 'info.main' }}>
                                                            <Iconify icon="solar:eye-bold" />
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    {reportData.length === 0 && !loading && (
                                        <TableRow>
                                            <TableCell colSpan={9} align="center" sx={{ py: 10 }}>
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

            <MeetingDetailsDialog
                open={openView}
                meetingId={selectedMeetingId}
                onClose={() => {
                    setOpenView(false);
                    setSelectedMeetingId(null);
                }}
            />

            <ExportFieldsDialog
                open={openExportFields}
                onClose={() => setOpenExportFields(false)}
                doctype="HD Meeting Log"
                onExport={handleExport}
            />
        </DashboardContent>
    );
}

// ----------------------------------------------------------------------

function SummaryCard({ title, value, color }: { title: string; value: number; color: string }) {
    const getIcon = () => {
        switch (title) {
            case 'Total Meetings': return 'solar:videocamera-record-bold-duotone';
            case 'Scheduled Meetings': return 'solar:calendar-mark-bold-duotone';
            case 'Completed Meetings': return 'solar:check-circle-bold-duotone';
            case 'Reminder Enabled': return 'solar:bell-bing-bold-duotone';
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

function getIndicatorColor(indicator: string) {
    switch (indicator) {
        case 'Green': return '#4CAF50';
        case 'Red': return '#F44336';
        case 'Blue': return '#2196F3';
        case 'Orange': return '#FF9800';
        case 'Purple': return '#9C27B0';
        default: return '#2196F3';
    }
}
