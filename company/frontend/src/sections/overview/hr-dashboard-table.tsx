import type { CardProps } from '@mui/material/Card';

import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';

import { Scrollbar } from 'src/components/scrollbar';

// ----------------------------------------------------------------------

type Props = CardProps & {
    title?: string;
    subheader?: string;
    tableData: any[];
    headLabel: { id: string; label: string }[];
};

export function HRDashboardTable({ title, subheader, tableData, headLabel, ...other }: Props) {
    return (
        <Card {...other}>
            <CardHeader title={title} subheader={subheader} sx={{ mb: 3 }} />

            <TableContainer sx={{ overflow: 'unset' }}>
                <Scrollbar>
                    <Table sx={{ minWidth: 400 }}>
                        <TableHead>
                            <TableRow>
                                {headLabel.map((headCell) => (
                                    <TableCell key={headCell.id}>{headCell.label}</TableCell>
                                ))}
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {tableData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={headLabel.length} align="center" sx={{ py: 3 }}>
                                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                            No data found
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                tableData.map((row: any, index) => (
                                    <TableRow key={index}>
                                        {headLabel.map((headCell) => (
                                            <TableCell key={headCell.id}>
                                                {headCell.id === 'index' ? index + 1 : row[headCell.id]}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </Scrollbar>
            </TableContainer>
        </Card>
    );
}
