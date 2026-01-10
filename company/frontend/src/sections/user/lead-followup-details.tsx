import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';

import { fDateTime } from 'src/utils/format-time';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

// ----------------------------------------------------------------------

type Props = {
    title?: string;
    subheader?: string;
    list: {
        name: string;
        date_and_time: string;
        status: string;
        type: string;
        notes: string;
    }[];
};

export function LeadFollowupDetails({ title, subheader, list }: Props) {
    return (
        <Card>
            <CardHeader title={title} subheader={subheader} />

            <Scrollbar>
                <TableContainer sx={{ overflow: 'unset', mt: 3 }}>
                    <Table sx={{ minWidth: 600 }}>
                        <TableHead>
                            <TableRow>
                                <TableCell>Date & Time</TableCell>
                                <TableCell>Type</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Notes</TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {list.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} align="center">
                                        <Box sx={{ py: 6 }}>
                                            <Iconify icon={"solar:calendar-mark-bold-duotone" as any} width={48} sx={{ color: 'text.disabled', mb: 1, opacity: 0.24 }} />
                                            <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                                                No followup history available
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                list.map((row) => (
                                    <TableRow key={row.name}>
                                        <TableCell>{fDateTime(row.date_and_time)}</TableCell>
                                        <TableCell>
                                            <Label color={row.type === 'Call' ? 'primary' : 'info'}>
                                                {row.type}
                                            </Label>
                                        </TableCell>
                                        <TableCell>{row.status}</TableCell>
                                        <TableCell>{row.notes}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Scrollbar>
        </Card>
    );
}
