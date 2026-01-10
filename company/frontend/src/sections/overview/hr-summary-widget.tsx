import type { CardProps } from '@mui/material/Card';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { fNumber } from 'src/utils/format-number';

// ----------------------------------------------------------------------

type Props = CardProps & {
    title: string;
    total: number;
    icon: React.ReactNode;
    color?: string;
};

export function HRSummaryWidget({ title, total, icon, color = 'primary', sx, ...other }: Props) {
    const theme = useTheme();

    return (
        <Card
            sx={[
                {
                    p: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                },
                ...(Array.isArray(sx) ? sx : [sx]),
            ]}
            {...other}
        >
            <Box>
                <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>
                    {title}
                </Typography>
                <Typography variant="h3">{fNumber(total)}</Typography>
            </Box>

            <Box
                sx={{
                    width: 64,
                    height: 64,
                    lineHeight: 0,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: `${color}.main`,
                    bgcolor: alpha(theme.palette.grey[500], 0.08),
                }}
            >
                {icon}
            </Box>
        </Card>
    );
}
