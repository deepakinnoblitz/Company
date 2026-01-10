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
        title: string;
        account: string;
        value: number;
        stage: string;
        expectedCloseDate?: string;
        avatarUrl: string;
    };
    selected: boolean;
    onEdit: VoidFunction;
    onView: VoidFunction;
    onDelete: VoidFunction;
    onSelectRow: VoidFunction;
    canEdit?: boolean;
    canDelete?: boolean;
};

export function DealTableRow({
    row,
    selected,
    onEdit,
    onView,
    onDelete,
    onSelectRow,
    canEdit = true,
    canDelete = true,
}: Props) {
    const getStageColor = (stage: string) => {
        switch (stage) {
            case 'Closed Won':
                return 'success';
            case 'Closed Lost':
                return 'error';
            case 'Proposal Sent':
            case 'Negotiation':
                return 'warning';
            default:
                return 'info';
        }
    };

    return (
        <TableRow hover tabIndex={-1} role="checkbox" selected={selected}>
            <TableCell padding="checkbox">
                <Checkbox disableRipple checked={selected} onChange={onSelectRow} />
            </TableCell>

            <TableCell component="th" scope="row">
                <Box sx={{ gap: 2, display: 'flex', alignItems: 'center' }}>
                    {row.title}
                </Box>
            </TableCell>

            <TableCell>{row.account}</TableCell>

            <TableCell>{row.value ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(row.value) : '-'}</TableCell>

            <TableCell>
                <Label color={getStageColor(row.stage)}>{row.stage}</Label>
            </TableCell>

            <TableCell>{row.expectedCloseDate || '-'}</TableCell>

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
