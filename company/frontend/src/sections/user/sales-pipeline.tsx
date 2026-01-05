import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { Label } from 'src/components/label';

// ----------------------------------------------------------------------

const STAGES = [
    'New Lead',
    'Contacted',
    'Qualified',
    'Proposal Sent',
    'In Negotiation',
    'Follow-up Scheduled',
    'On Hold',
    'In Active',
    'Not Interested',
    'Closed',
];

const NEXT_STEPS: Record<string, string[]> = {
    'New Lead': ['Assign to sales rep', 'Initial research', 'Prepare intro email'],
    'Contacted': ['Discovery call', 'Identify pain points', 'Request requirements'],
    'Qualified': ['Prepare proposal', 'Finalize pricing', 'Technical review'],
    'Proposal Sent': ['Follow up on proposal', 'Handle objections', 'Prepare negotiation points'],
    'In Negotiation': ['Contract draft', 'Final discount approval', 'Legal review'],
    'Follow-up Scheduled': ['Prepare for follow-up', 'Address pending questions'],
    'On Hold': ['Check back in 2 weeks', 'Send monthly newsletter'],
    'In Active': ['Archive lead', 'Move to cold storage'],
    'Not Interested': ['Ask for feedback', 'Update CRM notes'],
    'Closed': ['Onboarding', 'Introduction to CSM', 'Handover to delivery'],
};

type Props = {
    currentStage: string;
    stages?: string[];  // Dynamic stages from backend
    leadName?: string;
    service?: string;
    onStageChange?: (newStage: string) => void;
    disabled?: boolean;
};

export function SalesPipeline({ currentStage, stages = STAGES, leadName, service, onStageChange, disabled = false }: Props) {
    const theme = useTheme();

    const currentIndex = stages.indexOf(currentStage);

    return (
        <Card sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
                Sales Pipeline
            </Typography>

            <Stack
                direction="row"
                sx={{
                    borderRadius: 1,
                    overflow: 'hidden',
                    bgcolor: alpha(theme.palette.grey[500], 0.04),
                    mb: 3,
                    position: 'relative',
                    height: 44,
                    border: `1px solid ${alpha(theme.palette.grey[500], 0.2)}`,
                }}
            >
                {stages.map((stage, index) => {
                    const isActive = index === currentIndex;
                    const isCompleted = index < currentIndex;

                    let color = theme.palette.text.secondary;
                    let bgcolor = 'transparent';

                    if (isActive) {
                        color = theme.palette.common.white;
                        bgcolor = '#1877F2'; // Vivid blue from image
                    } else if (isCompleted) {
                        color = '#229A16'; // Dark green text
                        bgcolor = '#E4F8DD'; // Light green bgcolor
                    } else {
                        bgcolor = '#F4f6f8';
                    }

                    return (
                        <Box
                            key={stage}
                            sx={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative',
                                bgcolor,
                                color,
                                px: 1,
                                fontSize: 11,
                                fontWeight: 'bold',
                                textAlign: 'center',
                                cursor: 'default',
                                transition: theme.transitions.create(['background-color', 'color']),
                                clipPath: index === 0
                                    ? 'polygon(0% 0%, 90% 0%, 100% 50%, 90% 100%, 0% 100%)'
                                    : index === STAGES.length - 1
                                        ? 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 10% 50%)'
                                        : 'polygon(0% 0%, 90% 0%, 100% 50%, 90% 100%, 0% 100%, 10% 50%)',
                                ml: index === 0 ? 0 : -1.2,
                                zIndex: STAGES.length - index,
                            }}
                        >
                            {stage}
                        </Box>
                    );
                })}
            </Stack>

            <Box
                sx={{
                    p: 3,
                    borderRadius: 2,
                    bgcolor: '#F0F7FF', // Soft blue from image
                    border: `1px solid #D0E9FF`,
                }}
            >
                <Stack spacing={2.5}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 'medium' }}>
                            Current Lead Stage
                        </Typography>
                        <Label color="primary" variant="filled" sx={{ borderRadius: 1, height: 28, fontSize: 13 }}>
                            {currentStage}
                        </Label>
                    </Stack>

                    <Box>
                        <Typography variant="subtitle2" sx={{ color: '#1877F2', mb: 2, fontWeight: 'bold' }}>
                            Need to do Next
                        </Typography>
                        <Stack direction="row" flexWrap="wrap" sx={{ gap: 2 }}>
                            {(NEXT_STEPS[currentStage] || []).map((step) => (
                                <Box
                                    key={step}
                                    sx={{
                                        px: 2,
                                        py: 1.2,
                                        borderRadius: 1,
                                        bgcolor: 'common.white',
                                        border: `1px solid ${alpha(theme.palette.grey[500], 0.12)}`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        boxShadow: (t) => t.customShadows?.card,
                                    }}
                                >
                                    <Typography variant="body2" sx={{ color: '#229A16', fontWeight: 'bold' }}>
                                        ✓
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>{step}</Typography>
                                </Box>
                            ))}
                        </Stack>
                    </Box>

                    <Stack
                        direction="row"
                        alignItems="center"
                        divider={<Box sx={{ width: '1px', height: 16, bgcolor: alpha(theme.palette.grey[500], 0.2), mx: 2 }} />}
                        sx={{
                            pt: 2.5,
                            borderTop: `2px dashed ${alpha(theme.palette.grey[500], 0.2)}`,
                        }}
                    >
                        <Typography variant="subtitle2" sx={{ display: 'flex', gap: 1 }}>
                            Lead: <Typography component="span" variant="body2" sx={{ color: 'text.secondary' }}>{leadName || '---'}</Typography>
                        </Typography>
                        <Typography variant="subtitle2" sx={{ display: 'flex', gap: 1 }}>
                            Service: <Typography component="span" variant="body2" sx={{ color: 'text.secondary' }}>{service || '---'}</Typography>
                        </Typography>
                    </Stack>
                </Stack>
            </Box>
        </Card>
    );
}
