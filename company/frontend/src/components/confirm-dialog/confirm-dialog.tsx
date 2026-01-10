import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
    title?: string;
    content?: React.ReactNode;
    action: React.ReactNode;
    open: boolean;
    onClose: VoidFunction;
    icon?: string;
    iconColor?: string;
};

export function ConfirmDialog({
    title = 'Confirm',
    content,
    action,
    open,
    onClose,
    icon = "solar:danger-bold",
    iconColor = 'error.main',
    ...other
}: Props) {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: { borderRadius: 2, width: '100%', maxWidth: 400 }
            }}
            {...other}
        >
            <DialogTitle sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, pt: 4, pb: 1 }}>
                <Iconify icon={icon as any} sx={{ color: iconColor, width: 48, height: 48 }} />
                <Typography variant="h6">{title}</Typography>
            </DialogTitle>

            {content && (
                <DialogContent sx={{ py: 2, textAlign: 'center' }}>
                    <Typography variant="body1" color="text.secondary">
                        {content}
                    </Typography>
                </DialogContent>
            )}

            <DialogActions sx={{ px: 3, pb: 4, justifyContent: 'center', gap: 2 }}>
                <Button variant="outlined" color="inherit" onClick={onClose} sx={{ borderRadius: 1.5, minWidth: 100 }}>
                    Cancel
                </Button>
                {action}
            </DialogActions>
        </Dialog>
    );
}
