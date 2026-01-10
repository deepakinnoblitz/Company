import type { BoxProps } from '@mui/material/Box';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { Iconify } from '../iconify';

// ----------------------------------------------------------------------

type EmptyContentProps = BoxProps & {
    title?: string;
    description?: string;
    icon?: string;
};

export function EmptyContent({ title, description, icon, sx, ...other }: EmptyContentProps) {
    return (
        <Box
            sx={{
                py: 10,
                px: 3,
                display: 'flex',
                textAlign: 'center',
                alignItems: 'center',
                flexDirection: 'column',
                justifyContent: 'center',
                ...sx,
            }}
            {...other}
        >
            <Iconify
                icon={(icon || 'solar:box-minimalistic-bold-duotone') as any}
                width={100}
                sx={{ mb: 2, color: 'text.disabled', opacity: 0.12 }}
            />

            {title && (
                <Typography variant="h6" sx={{ color: 'text.disabled' }}>
                    {title}
                </Typography>
            )}

            {description && (
                <Typography variant="body2" sx={{ color: 'text.disabled', mt: 1 }}>
                    {description}
                </Typography>
            )}
        </Box>
    );
}
