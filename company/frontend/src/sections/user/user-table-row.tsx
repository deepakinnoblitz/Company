
import Box from '@mui/material/Box';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const getStatusStyle = (status: string) => {
  const styles: Record<string, { bgcolor: string; border: string; color: string }> = {
    'New Lead': {
      bgcolor: 'rgba(234, 179, 8, 0.22)',
      border: '1px solid rgba(234, 179, 8, 0.45)',
      color: '#92400e'
    },
    'Contacted': {
      bgcolor: 'rgba(251, 146, 60, 0.24)',
      border: '1px solid rgba(251, 146, 60, 0.45)',
      color: '#9a3412'
    },
    'Qualified': {
      bgcolor: 'rgba(34, 197, 94, 0.25)',
      border: '1px solid rgba(34, 197, 94, 0.45)',
      color: '#15803d'
    },
    'Proposal Sent': {
      bgcolor: 'rgba(99, 102, 241, 0.25)',
      border: '1px solid rgba(99, 102, 241, 0.45)',
      color: '#4338ca'
    },
    'In Negotiation': {
      bgcolor: 'rgba(249, 115, 22, 0.25)',
      border: '1px solid rgba(249, 115, 22, 0.45)',
      color: '#c2410c'
    },
    'Follow-up Scheduled': {
      bgcolor: 'rgba(245, 158, 11, 0.25)',
      border: '1px solid rgba(245, 158, 11, 0.45)',
      color: '#92400e'
    },
    'On Hold': {
      bgcolor: 'rgba(156, 163, 175, 0.25)',
      border: '1px solid rgba(156, 163, 175, 0.45)',
      color: '#374151'
    },
    'Not Interested': {
      bgcolor: 'rgba(239, 68, 68, 0.25)',
      border: '1px solid rgba(239, 68, 68, 0.45)',
      color: '#991b1b'
    },
    'In Active': {
      bgcolor: 'rgba(139, 92, 246, 0.22)',
      border: '1px solid rgba(139, 92, 246, 0.45)',
      color: '#4c1d95'
    },
    'Closed': {
      bgcolor: 'rgba(220, 38, 38, 0.25)',   // red background
      border: '1px solid rgba(220, 38, 38, 0.45)',
      color: '#7f1d1d'                     // dark red text
    },
    'Pending': {
      bgcolor: 'rgba(249, 115, 22, 0.25)',
      border: '1px solid rgba(249, 115, 22, 0.45)',
      color: '#c2410c'
    }
  };

  return styles[status] || {
    bgcolor: 'rgba(156, 163, 175, 0.25)',
    border: '1px solid rgba(156, 163, 175, 0.45)',
    color: '#374151'
  };
};

// ----------------------------------------------------------------------

export type UserProps = {
  id: string;
  name: string;
  phone: string;
  email: string;
  status: string;
  workflow_state: string;
  company: string;
  avatarUrl: string;
  isVerified: boolean;
  country?: string;
};

type UserTableRowProps = {
  row: UserProps;
  selected: boolean;
  onSelectRow: () => void;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
};

export function UserTableRow({
  row,
  selected,
  onSelectRow,
  onView,
  onEdit,
  onDelete,
  canEdit = true,
  canDelete = true,
}: UserTableRowProps) {
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

          {row.name}
        </Box>
      </TableCell>

      <TableCell>{row.company}</TableCell>

      <TableCell>{row.country || '-'}</TableCell>

      <TableCell>{row.phone}</TableCell>

      <TableCell>{row.email}</TableCell>

      <TableCell>
        <Label
          sx={{
            ...getStatusStyle(row.workflow_state || row.status),
            fontWeight: 500,
            borderRadius: '6px',
            padding: '4px 12px'
          }}
        >
          {row.workflow_state || row.status}
        </Label>
      </TableCell>

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
