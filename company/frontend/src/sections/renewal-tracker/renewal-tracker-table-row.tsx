import Box from '@mui/material/Box';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
    row: {
        id: string;
        item_name: string;
        category: string;
        renewal_date: string;
        amount: number;
        status: string;
    };
    selected: boolean;
    onSelectRow: () => void;
    onView: () => void;
    onEdit: () => void;
    onDelete: () => void;
    canEdit: boolean;
    canDelete: boolean;
};

export function RenewalTrackerTableRow({
    row,
    selected,
    onSelectRow,
    onView,
    onEdit,
    onDelete,
    canEdit,
    canDelete,
}: Props) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Active':
                return 'success';
            case 'Expired':
                return 'error';
            case 'Pending':
                return 'warning';
            default:
                return 'default';
        }
    };

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
                    {row.item_name}
                </Box>
            </TableCell>

            <TableCell>{row.category}</TableCell>

            <TableCell>{row.renewal_date ? new Date(row.renewal_date).toLocaleDateString() : '-'}</TableCell>

            <TableCell align="right">₹{row.amount?.toLocaleString() || 0}</TableCell>

            <TableCell align="center">
                <Label variant="soft" color={getStatusColor(row.status)}>
                    {row.status}
                </Label>
            </TableCell>

            <TableCell align="right">
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5, alignItems: 'center' }}>
                    <IconButton onClick={onView} sx={{ color: 'info.main' }}>
                        <Iconify icon={"solar:eye-bold" as any} />
                    </IconButton>

                    {canEdit && (
                        <IconButton onClick={onEdit} sx={{ color: 'primary.main' }}>
                            <Iconify icon={"solar:pen-bold" as any} />
                        </IconButton>
                    )}

                    {canDelete && (
                        <IconButton onClick={onDelete} sx={{ color: 'error.main' }}>
                            <Iconify icon={"solar:trash-bin-trash-bold" as any} />
                        </IconButton>
                    )}
                </Box>
            </TableCell>
        </TableRow>
    );
}
