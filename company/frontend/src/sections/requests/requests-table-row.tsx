
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export type RequestTableRowProps = {
    row: {
        id: string;
        employee_name: string;
        subject: string;
        workflow_state?: string;
        creation?: string;
    };
    selected: boolean;
    onSelectRow: () => void;
    onView: () => void;
    onEdit: () => void;
    onDelete: () => void;
    canEdit: boolean;
    canDelete: boolean;
};

export function RequestTableRow({
    row,
    selected,
    onSelectRow,
    onView,
    onEdit,
    onDelete,
    canEdit,
    canDelete,
}: RequestTableRowProps) {
    return (
        <TableRow hover tabIndex={-1} role="checkbox" selected={selected}>
            <TableCell padding="checkbox">
                <Checkbox disableRipple checked={selected} onChange={onSelectRow} />
            </TableCell>

            <TableCell>{row.employee_name || '-'}</TableCell>

            <TableCell>{row.subject || '-'}</TableCell>

            <TableCell>
                <Label
                    color={
                        (row.workflow_state === 'Approved' && 'success') ||
                        (row.workflow_state === 'Rejected' && 'error') ||
                        'warning'
                    }
                >
                    {row.workflow_state || 'Pending'}
                </Label>
            </TableCell>

            <TableCell>
                {row.creation ? new Date(row.creation).toLocaleDateString() : '-'}
            </TableCell>

            <TableCell align="right">
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                    <IconButton size="small" color="primary" onClick={onView}>
                        <Iconify icon="solar:eye-bold" />
                    </IconButton>

                    {canEdit && (
                        <IconButton size="small" color="info" onClick={onEdit}>
                            <Iconify icon="solar:pen-bold" />
                        </IconButton>
                    )}

                    {canDelete && (
                        <IconButton size="small" color="error" onClick={onDelete}>
                            <Iconify icon="solar:trash-bin-trash-bold" />
                        </IconButton>
                    )}
                </Box>
            </TableCell>
        </TableRow>
    );
}
