import type { CardProps } from '@mui/material/Card';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha, useTheme, keyframes } from '@mui/material/styles';

import { fDate } from 'src/utils/format-time';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const marqueeAnimation = keyframes`
  0% { left: 100%; transform: translateX(0); }
  100% { left: 0; transform: translateX(-100%); }
`;

type Props = CardProps & {
    title?: string;
    subheader?: string;
    list: {
        title: string;
        message: string;
        posting_date: string;
    }[];
};

export function HRAnnouncements({ title, subheader, list, ...other }: Props) {
    const theme = useTheme();

    if (list.length === 0) return null;


    return (
        <Card
            {...other}
            sx={{
                p: 1.5,
                display: 'flex',
                alignItems: 'center',
                overflow: 'hidden',
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 1)} 0%, ${alpha(theme.palette.primary.dark, 1)} 100%)`,
                color: 'primary.contrastText',
                borderRadius: 1,
                boxShadow: theme.customShadows.z8,
                position: 'relative',
                height: 52, // Fixed height for consistent bar look
                ...other.sx,
            }}
        >
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ zIndex: 1, flexShrink: 0, pr: 2, borderRight: `1px solid ${alpha(theme.palette.common.white, 0.2)}`, bgcolor: 'primary.main', height: '100%' }}>
                <Iconify icon={"solar:volume-loud-bold-duotone" as any} width={24} />
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Announcements
                </Typography>
            </Stack>

            <Box
                sx={{
                    flexGrow: 1,
                    overflow: 'hidden',
                    position: 'relative',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        position: 'absolute',
                        whiteSpace: 'nowrap',
                        animation: `${marqueeAnimation} 40s linear infinite`,
                        animationFillMode: 'backwards',
                        '&:hover': {
                            animationPlayState: 'paused',
                        },
                    }}
                >
                    {list.map((item, index) => (
                        <Stack key={index} direction="row" alignItems="center" spacing={1} sx={{ mx: 4 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                {item.title}:
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                {item.message}
                            </Typography>
                            <Typography variant="caption" sx={{ opacity: 0.6, fontSize: '0.7rem' }}>
                                ({fDate(item.posting_date)})
                            </Typography>
                        </Stack>
                    ))}
                </Box>
            </Box>
        </Card>
    );
}
