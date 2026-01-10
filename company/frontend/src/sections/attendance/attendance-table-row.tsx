import Box from '@mui/material/Box';
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
        employee: string;
        employeeName: string;
        attendanceDate: string;
        status: string;
        inTime?: string;
        out_time?: string;
    };
    selected: boolean;
    onSelectRow: VoidFunction;
    onView: VoidFunction;
    onEdit: VoidFunction;
    onDelete: VoidFunction;
    canEdit?: boolean;
    canDelete?: boolean;
};

export function AttendanceTableRow({
    row,
    selected,
    onSelectRow,
    onView,
    onEdit,
    onDelete,
    canEdit,
    canDelete
}: Props) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Present': return 'success';
            case 'Absent': return 'error';
            case 'On Leave': return 'warning';
            case 'Holiday': return 'info';
            case 'Half Day': return 'warning';
            default: return 'default';
        }
    };

    return (
        <TableRow hover tabIndex={-1} role="checkbox" selected={selected}>
            <TableCell padding="checkbox">
                <Checkbox disableRipple checked={selected} onChange={onSelectRow} />
            </TableCell>

            <TableCell>
                <Box>
                    <Typography variant="subtitle2" noWrap>
                        {row.employeeName}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {row.employee}
                    </Typography>
                </Box>
            </TableCell>

            <TableCell>
                <Typography variant="body2" noWrap>
                    {row.attendanceDate}
                </Typography>
            </TableCell>

            <TableCell>
                <Label color={getStatusColor(row.status)}>{row.status}</Label>
            </TableCell>

            <TableCell>
                <Typography variant="body2" noWrap>
                    {row.inTime || '-'}
                </Typography>
            </TableCell>
            <TableCell>
                <Typography variant="body2" noWrap>
                    {row.out_time || '-'}
                </Typography>
            </TableCell>

            <TableCell align="right">
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                    <IconButton size="small" onClick={onView} sx={{ color: 'info.main' }}>
                        <Iconify icon="solar:eye-bold" />
                    </IconButton>
                    {canEdit && (
                        <IconButton size="small" onClick={onEdit} sx={{ color: 'primary.main' }}>
                            <Iconify icon="solar:pen-bold" />
                        </IconButton>
                    )}
                    {canDelete && (
                        <IconButton size="small" onClick={onDelete} sx={{ color: 'error.main' }}>
                            <Iconify icon="solar:trash-bin-trash-bold" />
                        </IconButton>
                    )}
                </Box>
            </TableCell>
        </TableRow>
    );
}
