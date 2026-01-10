import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';

import { fDate } from 'src/utils/format-time';
import { fCurrency } from 'src/utils/format-number';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export type InvoiceProps = {
    id: string;
    ref_no: string;
    customer_name: string;
    invoice_date: string;
    grand_total: number;
    received_amount: number;
    balance_amount: number;
};

type InvoiceTableRowProps = {
    row: InvoiceProps;
    selected: boolean;
    onSelectRow: () => void;
    onView: () => void;
    onEdit: () => void;
    onDelete: () => void;
    canEdit?: boolean;
    canDelete?: boolean;
};

export function InvoiceTableRow({
    row,
    selected,
    onSelectRow,
    onView,
    onEdit,
    onDelete,
    canEdit = true,
    canDelete = true,
}: InvoiceTableRowProps) {
    return (
        <TableRow hover tabIndex={-1} role="checkbox" selected={selected}>
            <TableCell padding="checkbox">
                <Checkbox disableRipple checked={selected} onChange={onSelectRow} />
            </TableCell>

            <TableCell component="th" scope="row">
                <Box sx={{ gap: 2, display: 'flex', alignItems: 'center' }}>
                    {row.ref_no}
                </Box>
            </TableCell>

            <TableCell>{row.customer_name}</TableCell>

            <TableCell>{fDate(row.invoice_date)}</TableCell>

            <TableCell align="right">{fCurrency(row.grand_total)}</TableCell>

            <TableCell align="right">{fCurrency(row.received_amount)}</TableCell>

            <TableCell align="right">{fCurrency(row.balance_amount)}</TableCell>

            <TableCell align="right">
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    {canEdit && (
                        <IconButton onClick={onEdit} sx={{ color: 'primary.main' }}>
                            <Iconify icon="solar:pen-bold" />
                        </IconButton>
                    )}
                    {canDelete && (
                        <IconButton onClick={onDelete} sx={{ color: 'error.main' }}>
                            <Iconify icon="solar:trash-bin-trash-bold" />
                        </IconButton>
                    )}
                    <IconButton onClick={onView} sx={{ color: 'info.main' }}>
                        <Iconify icon="solar:eye-bold" />
                    </IconButton>
                </Box>
            </TableCell>
        </TableRow>
    );
}
