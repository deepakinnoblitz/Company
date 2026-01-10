import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export type AssetTableRowProps = {
    row: {
        id: string;
        asset_name: string;
        asset_tag: string;
        category: string;
        current_status: string;
        purchase_cost: number;
        purchase_date: string;
    };
    selected: boolean;
    onSelectRow: () => void;
    onView: () => void;
    onEdit: () => void;
    onDelete: () => void;
    canEdit: boolean;
    canDelete: boolean;
};

export function AssetTableRow({
    row,
    selected,
    onSelectRow,
    onView,
    onEdit,
    onDelete,
    canEdit,
    canDelete,
}: AssetTableRowProps) {
    return (
        <TableRow hover tabIndex={-1} role="checkbox" selected={selected}>
            <TableCell padding="checkbox">
                <Checkbox disableRipple checked={selected} onChange={onSelectRow} />
            </TableCell>

            <TableCell>{row.asset_name || '-'}</TableCell>

            <TableCell>{row.asset_tag || '-'}</TableCell>

            <TableCell>{row.category || '-'}</TableCell>

            <TableCell>
                <Label
                    color={
                        (row.current_status === 'Available' && 'success') ||
                        (row.current_status === 'Assigned' && 'info') ||
                        (row.current_status === 'Maintenance' && 'warning') ||
                        (row.current_status === 'Disposed' && 'error') ||
                        'default'
                    }
                >
                    {row.current_status || 'Unknown'}
                </Label>
            </TableCell>

            <TableCell>
                {row.purchase_cost ? `₹${row.purchase_cost.toLocaleString()}` : '-'}
            </TableCell>

            <TableCell>
                {row.purchase_date ? new Date(row.purchase_date).toLocaleDateString() : '-'}
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
