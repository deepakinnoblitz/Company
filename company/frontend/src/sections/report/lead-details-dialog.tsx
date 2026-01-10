import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';

import { getLead, getWorkflowStates } from 'src/api/leads';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

import { SalesPipeline } from 'src/sections/user/sales-pipeline';
import { LeadFollowupDetails } from 'src/sections/user/lead-followup-details';
import { LeadPipelineTimeline } from 'src/sections/user/lead-pipeline-timeline';

// ----------------------------------------------------------------------

type Props = {
    open: boolean;
    onClose: () => void;
    leadId: string | null;
};

export function LeadDetailsDialog({ open, onClose, leadId }: Props) {
    const [lead, setLead] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [currentTab, setCurrentTab] = useState('general');
    const [allWorkflowStates, setAllWorkflowStates] = useState<string[]>([]);

    useEffect(() => {
        getWorkflowStates('Lead').then(workflowData => {
            setAllWorkflowStates(workflowData.states);
        });
    }, []);

    useEffect(() => {
        if (open && leadId) {
            setLoading(true);
            getLead(leadId)
                .then(setLead)
                .catch((err) => console.error('Failed to fetch lead details:', err))
                .finally(() => setLoading(false));
        } else {
            setLead(null);
        }
    }, [open, leadId]);

    const renderStatus = (status: string) => {
        let color: 'default' | 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error' = 'default';
        if (status === 'New Lead') color = 'info';
        if (status === 'Qualified' || status === 'Closed') color = 'success';
        if (status === 'Not Interested' || status === 'In Active') color = 'error';
        if (status === 'Contacted' || status === 'Proposal Sent' || status === 'In Negotiation') color = 'warning';

        return (
            <Label variant="soft" color={color}>
                {status}
            </Label>
        );
    };

    const renderInterest = (level: string) => {
        let color: 'default' | 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error' = 'default';
        if (level === 'High') color = 'success';
        if (level === 'Medium') color = 'warning';
        if (level === 'Low') color = 'error';

        return (
            <Label variant="outlined" color={color}>
                {level}
            </Label>
        );
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle sx={{ m: 0, p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'background.neutral' }}>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>Lead Profile</Typography>
                <IconButton onClick={onClose} sx={{ color: (theme) => theme.palette.grey[500], bgcolor: 'background.paper', boxShadow: (theme) => theme.customShadows?.z1 }}>
                    <Iconify icon="mingcute:close-line" />
                </IconButton>
            </DialogTitle>

            <Box sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Tabs
                    value={currentTab}
                    onChange={(e, newValue) => setCurrentTab(newValue)}
                >
                    <Tab label="General" value="general" />
                    <Tab label="Pipeline" value="pipeline" />
                    <Tab label="Followups" value="followups" />
                    <Tab label="Convert Lead" value="convert" />
                </Tabs>
            </Box>

            <DialogContent sx={{ p: 4, m: 2, mt: 4 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 10 }}>
                        <Iconify icon={"svg-spinners:12-dots-scale-rotate" as any} width={40} sx={{ color: 'primary.main' }} />
                    </Box>
                ) : lead ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {currentTab === 'general' && (
                            <>
                                {/* Header Info */}
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2.5 }}>
                                    <Box
                                        sx={{
                                            width: 64,
                                            height: 64,
                                            borderRadius: 2,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            bgcolor: 'primary.lighter',
                                            color: 'primary.main',
                                        }}
                                    >
                                        <Iconify icon={"solar:user-bold" as any} width={32} />
                                    </Box>
                                    <Box sx={{ flexGrow: 1 }}>
                                        <Typography variant="h5" sx={{ fontWeight: 800 }}>{lead.lead_name}</Typography>
                                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>{lead.company_name || 'Individual'}</Typography>
                                    </Box>
                                    <Box sx={{ textAlign: 'right' }}>
                                        {renderStatus(lead.workflow_state || lead.status)}
                                        <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.disabled', fontWeight: 700 }}>
                                            ID: {lead.name}
                                        </Typography>
                                    </Box>
                                </Box>

                                <Divider sx={{ borderStyle: 'dashed' }} />

                                {/* General Information */}
                                <Box>
                                    <SectionHeader title="Contact & Service" icon="solar:phone-calling-bold" />
                                    <Box
                                        sx={{
                                            display: 'grid',
                                            gap: 3,
                                            gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                                        }}
                                    >
                                        <DetailItem label="Email" value={lead.email} icon="solar:letter-bold" />
                                        <DetailItem label="Phone" value={lead.phone_number} icon="solar:phone-bold" />
                                        <DetailItem label="Service" value={lead.service} icon="solar:lightbulb-bold" color="info.main" />
                                        <DetailItem label="Leads Type" value={lead.leads_type} icon="solar:tag-horizontal-bold" />
                                        <DetailItem label="Leads From" value={lead.leads_from} icon="solar:globus-bold" />
                                        <DetailItem label="GSTIN" value={lead.gstin} icon="solar:checklist-bold" />
                                    </Box>
                                </Box>

                                {/* Location & Status */}
                                <Box>
                                    <SectionHeader title="Location & Preferences" icon="solar:map-point-bold" />
                                    <Box
                                        sx={{
                                            display: 'grid',
                                            gap: 3,
                                            gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                                        }}
                                    >
                                        <DetailItem label="Country" value={lead.country} icon="solar:earth-bold" />
                                        <DetailItem label="State" value={lead.state} icon="solar:point-on-map-bold" />
                                        <DetailItem label="City" value={lead.city} icon="solar:city-bold" />
                                        <Box>
                                            <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700, textTransform: 'uppercase', mb: 1.5, display: 'block' }}>
                                                Interest Level
                                            </Typography>
                                            {renderInterest(lead.interest_level || 'Medium')}
                                        </Box>
                                        <DetailItem label="Owner" value={lead.owner_name || lead.owner} icon="solar:user-rounded-bold" color="secondary.main" />
                                        <DetailItem label="Creation" value={new Date(lead.creation).toLocaleString()} icon="solar:calendar-bold" />
                                    </Box>
                                </Box>

                                {/* Additional Info */}
                                <Box sx={{ p: 3, bgcolor: 'background.neutral', borderRadius: 2 }}>
                                    <SectionHeader title="Additional Information" icon="solar:document-text-bold" noMargin />
                                    <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
                                        <Box>
                                            <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700, textTransform: 'uppercase', mb: 1, display: 'block' }}>
                                                Billing Address
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 600 }}>
                                                {lead.billing_address || 'No address provided'}
                                            </Typography>
                                        </Box>
                                        <Divider sx={{ borderStyle: 'dotted' }} />
                                        <Box>
                                            <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700, textTransform: 'uppercase', mb: 1, display: 'block' }}>
                                                Remarks / Notes
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 600, fontStyle: lead.remarks ? 'normal' : 'italic' }}>
                                                {lead.remarks || 'No remarks added'}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            </>
                        )}

                        {currentTab === 'pipeline' && (
                            <>
                                <SalesPipeline
                                    currentStage={lead.workflow_state || lead.status}
                                    stages={allWorkflowStates}
                                    leadName={lead.lead_name}
                                    service={lead.service}
                                    disabled
                                />
                                <LeadPipelineTimeline
                                    title="State History"
                                    list={lead.converted_pipeline_timeline || []}
                                />
                            </>
                        )}

                        {currentTab === 'followups' && (
                            <LeadFollowupDetails
                                title="Followup History"
                                list={lead.followup_details || []}
                            />
                        )}

                        {currentTab === 'convert' && (
                            <Box sx={{ p: 3 }}>
                                <Typography variant="h6" sx={{ mb: 3 }}>
                                    Convert Lead Details
                                </Typography>
                                {(lead.converted_account || lead.converted_contact) ? (
                                    <>
                                        <Alert severity="info" sx={{ mb: 2 }}>
                                            This lead has been converted.
                                        </Alert>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                            <TextField
                                                fullWidth
                                                label="Converted Account"
                                                value={lead.converted_account}
                                                InputProps={{ readOnly: true }}
                                            />
                                            <TextField
                                                fullWidth
                                                label="Converted Contact"
                                                value={lead.converted_contact}
                                                InputProps={{ readOnly: true }}
                                            />
                                        </Box>
                                    </>
                                ) : (
                                    <Alert severity="warning">
                                        This lead has not been converted yet.
                                    </Alert>
                                )}
                            </Box>
                        )}
                    </Box>
                ) : (
                    <Box sx={{ py: 10, textAlign: 'center' }}>
                        <Iconify icon={"solar:ghost-bold" as any} width={64} sx={{ color: 'text.disabled', mb: 2 }} />
                        <Typography variant="h6" sx={{ color: 'text.secondary' }}>No Profile Found</Typography>
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
}

function SectionHeader({ title, icon, noMargin = false }: { title: string; icon: string, noMargin?: boolean }) {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: noMargin ? 0 : 2.5 }}>
            <Iconify icon={icon as any} width={20} sx={{ color: 'primary.main' }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {title}
            </Typography>
        </Box>
    );
}

function DetailItem({ label, value, icon, color = 'text.primary' }: { label: string; value?: string | null; icon: string; color?: string }) {
    return (
        <Box>
            <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700, textTransform: 'uppercase', mb: 0.5, display: 'block' }}>
                {label}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Iconify icon={icon as any} width={16} sx={{ color: 'text.disabled' }} />
                <Typography variant="body2" sx={{ fontWeight: 700, color }}>
                    {value || '-'}
                </Typography>
            </Box>
        </Box>
    );
}
