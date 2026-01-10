import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

// ----------------------------------------------------------------------

type Props = {
    open: boolean;
    onClose: () => void;
    job: any;
};

export function JobOpeningDetailsDialog({ open, onClose, job }: Props) {
    if (!job) return null;

    const formatDate = (date: string) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString();
    };

    const renderHeader = (
        <Box sx={{ p: 3, bgcolor: 'background.neutral', borderRadius: 2, mb: 3 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                    <Typography variant="h4" sx={{ mb: 1, fontWeight: 700 }}>
                        {job.job_title}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="subtitle2" color="text.secondary">
                            {job.designation}
                        </Typography>
                        <Divider orientation="vertical" flexItem sx={{ height: 12, my: 'auto' }} />
                        <Typography variant="subtitle2" color="text.secondary">
                            {job.location}
                        </Typography>
                    </Stack>
                </Box>
                <Label
                    variant="filled"
                    color={(job.status === 'Open' && 'success') || (job.status === 'Closed' && 'error') || 'default'}
                    sx={{ height: 32, px: 2, borderRadius: 1 }}
                >
                    {job.status}
                </Label>
            </Stack>
        </Box>
    );

    const renderDetails = (
        <Box
            sx={{
                display: 'grid',
                gap: 2.5,
                gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
                mb: 4,
            }}
        >
            <DetailItem icon="solar:calendar-date-bold" label="Posted On" value={formatDate(job.posted_on)} />
            <DetailItem icon="solar:calendar-add-bold" label="Closes On" value={formatDate(job.closes_on)} />
            <DetailItem icon="solar:clock-circle-bold" label="Shift" value={job.shift} />
            <DetailItem icon="solar:ranking-bold" label="Experience" value={job.experience} />
            <DetailItem
                icon="solar:wad-of-money-bold"
                label="Salary Range"
                value={job.lower_range ? `₹${job.lower_range} - ₹${job.upper_range} per ${job.salary_per}` : 'Not Disclosed'}
            />
            <DetailItem icon="solar:settings-bold" label="Skills Required" value={job.skills_required || '-'} />
        </Box>
    );

    const renderDescription = (
        <Box sx={{ mt: 2 }}>
            <SectionHeader title="Job Description" icon="solar:notes-bold" />
            <Box sx={{ mt: 2, color: 'text.secondary', whiteSpace: 'pre-wrap' }}>
                <Typography variant="body2">
                    {job.description || job.small_description || 'No description provided.'}
                </Typography>
            </Box>
        </Box>
    );

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Job Opening Details
                <IconButton onClick={onClose}>
                    <Iconify icon={"mingcute:close-line" as any} />
                </IconButton>
            </DialogTitle>

            <Scrollbar sx={{ maxHeight: '85vh' }}>
                <DialogContent sx={{ p: 4 }}>
                    {renderHeader}
                    {renderDetails}
                    <Divider sx={{ my: 4, borderStyle: 'dashed' }} />
                    {renderDescription}
                </DialogContent>
            </Scrollbar>
        </Dialog>
    );
}

// ----------------------------------------------------------------------

function SectionHeader({ title, icon }: { title: string; icon: string }) {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Iconify icon={icon as any} width={24} sx={{ mr: 1.5, color: 'primary.main' }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {title}
            </Typography>
        </Box>
    );
}

function DetailItem({ icon, label, value }: { icon: string; label: string; value: string }) {
    return (
        <Stack direction="row" spacing={1.5} alignItems="flex-start">
            <Iconify icon={icon as any} width={20} sx={{ color: 'text.disabled', mt: 0.2 }} />
            <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                    {label}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {value}
                </Typography>
            </Box>
        </Stack>
    );
}
