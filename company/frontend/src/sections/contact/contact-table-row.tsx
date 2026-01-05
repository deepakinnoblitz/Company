import Box from '@mui/material/Box';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export type ContactProps = {
    id: string;
    firstName: string;
    companyName: string;
    email: string;
    phone: string;
    designation: string;
    avatarUrl: string;
    country?: string;
    state?: string;
    city?: string;
    sourceLead?: string;
};

type ContactTableRowProps = {
    row: ContactProps;
    selected: boolean;
    onSelectRow: () => void;
    onView: () => void;
    onEdit: () => void;
    onDelete: () => void;
    canEdit?: boolean;
    canDelete?: boolean;
};

export function ContactTableRow({
    row,
    selected,
    onSelectRow,
    onView,
    onEdit,
    onDelete,
    canEdit = true,
    canDelete = true,
}: ContactTableRowProps) {
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
                    {row.firstName}
                </Box>
            </TableCell>

            <TableCell>{row.companyName}</TableCell>

            <TableCell>{row.city || '-'}</TableCell>

            <TableCell>{row.state || '-'}</TableCell>

            <TableCell>{row.country || '-'}</TableCell>

            <TableCell>{row.designation}</TableCell>

            <TableCell>{row.sourceLead || '-'}</TableCell>

            <TableCell>{row.phone}</TableCell>

            <TableCell>{row.email}</TableCell>

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
