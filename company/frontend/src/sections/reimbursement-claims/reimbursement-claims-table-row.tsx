import type { MouseEvent } from 'react';

import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
    row: {
        id: string;
        employee_name: string;
        claim_type: string;
        date_of_expense: string;
        amount: number;
        paid: number;
    };
    selected: boolean;
    onSelectRow: () => void;
    onView: () => void;
    onEdit: () => void;
    onDelete: () => void;
    canEdit: boolean;
    canDelete: boolean;
};

export function ReimbursementClaimTableRow({
    row,
    selected,
    onSelectRow,
    onView,
    onEdit,
    onDelete,
    canEdit,
    canDelete,
}: Props) {
    const handleClick = (event: MouseEvent<HTMLButtonElement>, action: () => void) => {
        event.stopPropagation();
        action();
    };

    return (
        <TableRow hover tabIndex={-1} role="checkbox" selected={selected}>
            <TableCell padding="checkbox">
                <Checkbox disableRipple checked={selected} onChange={onSelectRow} />
            </TableCell>

            <TableCell>{row.employee_name}</TableCell>

            <TableCell>{row.claim_type}</TableCell>

            <TableCell>{new Date(row.date_of_expense).toLocaleDateString()}</TableCell>

            <TableCell>₹{row.amount?.toLocaleString() || 0}</TableCell>

            <TableCell>
                <Label
                    variant="soft"
                    color={row.paid === 1 ? 'success' : 'warning'}
                >
                    {row.paid === 1 ? 'Paid' : 'Pending'}
                </Label>
            </TableCell>

            <TableCell align="right">
                <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                    <IconButton onClick={(e) => handleClick(e, onView)} color="info">
                        <Iconify icon="solar:eye-bold" />
                    </IconButton>

                    {canEdit && (
                        <IconButton onClick={(e) => handleClick(e, onEdit)} color="primary">
                            <Iconify icon="solar:pen-bold" />
                        </IconButton>
                    )}

                    {canDelete && (
                        <IconButton onClick={(e) => handleClick(e, onDelete)} color="error">
                            <Iconify icon="solar:trash-bin-trash-bold" />
                        </IconButton>
                    )}
                </Box>
            </TableCell>
        </TableRow>
    );
}
