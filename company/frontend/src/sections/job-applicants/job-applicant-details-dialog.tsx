import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
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
    onClose: VoidFunction;
    applicant: any;
};

export function JobApplicantDetailsDialog({ open, onClose, applicant }: Props) {
    if (!applicant) return null;

    const renderStatus = (status: string) => {
        let color: 'default' | 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error' = 'default';

        switch (status) {
            case 'Accepted':
                color = 'success';
                break;
            case 'Rejected':
                color = 'error';
                break;
            case 'Hold':
                color = 'warning';
                break;
            case 'Open':
            case 'Received':
                color = 'info';
                break;
            case 'Replied':
                color = 'primary';
                break;
            default:
                color = 'default';
        }

        return (
            <Label variant="filled" color={color} sx={{ height: 32, px: 2, borderRadius: 1 }}>
                {status}
            </Label>
        );
    };

    const renderHeader = (
        <Box sx={{ p: 3, bgcolor: 'background.neutral', borderRadius: 2, mb: 3 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                <Box>
                    <Typography variant="h4" sx={{ mb: 1, fontWeight: 700 }}>
                        {applicant.applicant_name}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="subtitle2" color="text.secondary">
                            {applicant.job_title || 'No Job Assigned'}
                        </Typography>
                        {applicant.designation && (
                            <>
                                <Divider orientation="vertical" flexItem sx={{ height: 12, my: 'auto' }} />
                                <Typography variant="subtitle2" color="text.secondary">
                                    {applicant.designation}
                                </Typography>
                            </>
                        )}
                        <Divider orientation="vertical" flexItem sx={{ height: 12, my: 'auto' }} />
                        <Typography variant="subtitle2" color="text.secondary">
                            {applicant.city || applicant.state || applicant.country || 'Location N/A'}
                        </Typography>
                    </Stack>
                </Box>
                {renderStatus(applicant.status)}
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
            <DetailItem icon="solar:letter-bold" label="Email" value={applicant.email_id} isLink href={`mailto:${applicant.email_id}`} />
            <DetailItem icon="solar:phone-bold" label="Phone" value={applicant.phone_number || '-'} isLink href={`tel:${applicant.phone_number}`} />
            <DetailItem icon="solar:star-bold" label="Rating" value={applicant.applicant_rating?.toString() || '0'} />
            <DetailItem icon="solar:share-bold" label="Source" value={applicant.source || '-'} />
            <DetailItem icon="solar:wad-of-money-bold" label="Expected Salary" value={applicant.lower_range ? `${applicant.currency || '₹'} ${applicant.lower_range} - ${applicant.upper_range}` : 'Not Disclosed'} />
        </Box>
    );

    const renderResume = (
        <Box sx={{ mt: 2 }}>
            <SectionHeader title="Application Details" icon="solar:notes-bold" />
            <Box sx={{ display: 'grid', gap: 3, mt: 2 }}>
                <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Cover Letter</Typography>
                    <Box sx={{ p: 2, bgcolor: 'background.neutral', borderRadius: 1 }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary', whiteSpace: 'pre-wrap' }}>
                            {applicant.cover_letter || 'No cover letter provided.'}
                        </Typography>
                    </Box>
                </Box>

                {(applicant.resume_attachment || applicant.resume_link) && (
                    <Box>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>Resume / Portfolio</Typography>
                        <Stack direction="row" spacing={2}>
                            {applicant.resume_attachment && (
                                <Button
                                    variant="outlined"
                                    startIcon={<Iconify icon={"solar:download-bold" as any} />}
                                    href={applicant.resume_attachment}
                                    target="_blank"
                                >
                                    Download Resume
                                </Button>
                            )}
                            {applicant.resume_link && (
                                <Button
                                    variant="outlined"
                                    startIcon={<Iconify icon={"solar:link-bold" as any} />}
                                    href={applicant.resume_link}
                                    target="_blank"
                                >
                                    Resume Link
                                </Button>
                            )}
                        </Stack>
                    </Box>
                )}
            </Box>
        </Box>
    );

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Job Applicant Details
                <IconButton onClick={onClose}>
                    <Iconify icon="mingcute:close-line" />
                </IconButton>
            </DialogTitle>

            <Scrollbar sx={{ maxHeight: '85vh' }}>
                <DialogContent sx={{ p: 4 }}>
                    {renderHeader}
                    {renderDetails}
                    <Divider sx={{ my: 4, borderStyle: 'dashed' }} />
                    {renderResume}
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

function DetailItem({ icon, label, value, isLink, href }: { icon: string; label: string; value: string; isLink?: boolean; href?: string }) {
    return (
        <Stack direction="row" spacing={1.5} alignItems="flex-start">
            <Iconify icon={icon as any} width={20} sx={{ color: 'text.disabled', mt: 0.2 }} />
            <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                    {label}
                </Typography>
                {isLink ? (
                    <Link href={href} color="primary" variant="body2" sx={{ fontWeight: 600 }}>
                        {value}
                    </Link>
                ) : (
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {value}
                    </Typography>
                )}
            </Box>
        </Stack>
    );
}
