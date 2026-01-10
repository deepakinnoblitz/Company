import Box from '@mui/material/Box';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export type AccountProps = {
    id: string;
    account_name: string;
    phone_number: string;
    website: string;
    gstin?: string;
    country?: string;
    state?: string;
    city?: string;
};

type AccountTableRowProps = {
    row: AccountProps;
    selected: boolean;
    onSelectRow: () => void;
    onView: () => void;
    onEdit: () => void;
    onDelete: () => void;
    canEdit?: boolean;
    canDelete?: boolean;
};

export function AccountTableRow({
    row,
    selected,
    onSelectRow,
    onView,
    onEdit,
    onDelete,
    canEdit = true,
    canDelete = true,
}: AccountTableRowProps) {
    return (
        <TableRow hover tabIndex={-1} role="checkbox" selected={selected}>
            <TableCell padding="checkbox">
                <Checkbox disableRipple checked={selected} onChange={onSelectRow} />
            </TableCell>

            <TableCell component="th" scope="row">
                <Box
                    sx={{
                        gap: 2,
                        display: 'flex',
                        alignItems: 'center',
                    }}
                >
                    {row.account_name}
                </Box>
            </TableCell>

            <TableCell>{row.phone_number}</TableCell>

            <TableCell>{row.gstin}</TableCell>

            <TableCell>{row.city}</TableCell>

            <TableCell>{row.state}</TableCell>

            <TableCell>{row.country}</TableCell>

            <TableCell>{row.website}</TableCell>

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
