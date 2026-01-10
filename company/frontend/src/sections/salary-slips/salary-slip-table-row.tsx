import Box from '@mui/material/Box';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
    row: {
        id: string;
        employee_name: string;
        pay_period_start: string;
        pay_period_end: string;
        gross_pay: number;
        net_pay: number;
    };
    selected: boolean;
    onSelectRow: () => void;
    onView: () => void;
};

export function SalarySlipTableRow({
    row,
    selected,
    onSelectRow,
    onView,
}: Props) {
    const formatDate = (date: string) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    };

    const periodLabel = `${formatDate(row.pay_period_start)} - ${formatDate(row.pay_period_end)}`;

    return (
        <TableRow hover selected={selected}>
            <TableCell padding="checkbox">
                <Checkbox checked={selected} onClick={onSelectRow} />
            </TableCell>

            <TableCell>
                <Box
                    onClick={onView}
                    sx={{
                        color: 'primary.main',
                        fontWeight: 600,
                        cursor: 'pointer',
                        '&:hover': { textDecoration: 'underline' },
                    }}
                >
                    {row.employee_name}
                </Box>
            </TableCell>

            <TableCell>{periodLabel}</TableCell>

            <TableCell align="right">₹{row.gross_pay?.toLocaleString() || 0}</TableCell>

            <TableCell align="right">
                <Typography variant="subtitle2" sx={{ color: 'success.main', fontWeight: 700 }}>
                    ₹{row.net_pay?.toLocaleString() || 0}
                </Typography>
            </TableCell>

            <TableCell align="right">
                <IconButton onClick={onView} sx={{ color: 'info.main' }}>
                    <Iconify icon={"solar:eye-bold" as any} />
                </IconButton>
            </TableCell>
        </TableRow>
    );
}

import Typography from '@mui/material/Typography';
