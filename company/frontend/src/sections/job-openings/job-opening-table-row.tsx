import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
    row: {
        id: string;
        job_title: string;
        designation: string;
        posted_on: string;
        status: string;
        location: string;
    };
    selected: boolean;
    onSelectRow: () => void;
    onView: () => void;
    onEdit: () => void;
    onDelete: () => void;
    canEdit: boolean;
    canDelete: boolean;
};

export function JobOpeningTableRow({
    row,
    selected,
    onSelectRow,
    onView,
    onEdit,
    onDelete,
    canEdit,
    canDelete,
}: Props) {
    const formatDate = (date: string) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString();
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
                    {row.job_title}
                </Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                    {row.designation}
                </Typography>
            </TableCell>

            <TableCell>{row.location}</TableCell>

            <TableCell>{formatDate(row.posted_on)}</TableCell>

            <TableCell>
                <Label
                    variant="soft"
                    color={(row.status === 'Open' && 'success') || (row.status === 'Closed' && 'error') || 'default'}
                >
                    {row.status}
                </Label>
            </TableCell>

            <TableCell align="right">
                <Stack direction="row" spacing={0.5} justifyContent="flex-end">
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
                </Stack>
            </TableCell>
        </TableRow>
    );
}
