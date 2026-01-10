import { MuiTelInput } from 'mui-tel-input';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Select from '@mui/material/Select';
import { IconButton } from '@mui/material';
import MenuItem from '@mui/material/MenuItem';
import Snackbar from '@mui/material/Snackbar';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TextField from '@mui/material/TextField';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';

import { useLeads } from 'src/hooks/useLeads';

import { getFriendlyErrorMessage } from 'src/utils/error-handler';

import { DashboardContent } from 'src/layouts/dashboard';
import locationData from 'src/assets/data/location_data.json';
import { getLead, createLead, updateLead, deleteLead, convertLead, getDoctypeList, getWorkflowStates, getWorkflowActions, type ConvertLeadResponse } from 'src/api/leads';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { EmptyContent } from 'src/components/empty-content';
import { ConfirmDialog } from 'src/components/confirm-dialog';

import { TableNoData } from '../table-no-data';
import { UserTableRow } from '../user-table-row';
import { SalesPipeline } from '../sales-pipeline';
import { UserTableHead } from '../user-table-head';
import { TableEmptyRows } from '../table-empty-rows';
import { UserTableToolbar } from '../user-table-toolbar';
import { LeadImportDialog } from '../lead-import-dialog';
import { LeadFollowupDetails } from '../lead-followup-details';
import { LeadPipelineTimeline } from '../lead-pipeline-timeline';
import { LeadDetailsDialog } from '../../report/lead-details-dialog';

// ----------------------------------------------------------------------

export function UserView() {
  const table = useTable();
  const [filterName, setFilterName] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const STATUS_OPTIONS = [
    { value: 'New Lead', label: 'New Lead' },
    { value: 'Contacted', label: 'Contacted' },
    { value: 'Qualified', label: 'Qualified' },
    { value: 'Proposal Sent', label: 'Proposal Sent' },
    { value: 'In Negotiation', label: 'In Negotiation' },
    { value: 'Follow-up Scheduled', label: 'Follow-up Scheduled' },
    { value: 'On Hold', label: 'On Hold' },
    { value: 'Not Interested', label: 'Not Interested' },
    { value: 'In Active', label: 'In Active' },
    { value: 'Closed', label: 'Closed' },
  ];

  const [openCreate, setOpenCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [currentLeadId, setCurrentLeadId] = useState<string | null>(null);
  const [viewOnly, setViewOnly] = useState(false);
  const [openView, setOpenView] = useState(false);
  const [openImport, setOpenImport] = useState(false);

  // Form state
  const [leadName, setLeadName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [gstin, setGstin] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [leadsType, setLeadsType] = useState('Incoming');
  const [leadsFrom, setLeadsFrom] = useState('');
  const [service, setService] = useState('');
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [workflowState, setWorkflowState] = useState('');
  const [status, setStatus] = useState('New Lead');
  const [billingAddress, setBillingAddress] = useState('');
  const [remarks, setRemarks] = useState('');
  const [convertedAccount, setConvertedAccount] = useState('');
  const [convertedContact, setConvertedContact] = useState('');
  const [followupDetails, setFollowupDetails] = useState<any[]>([]);
  const [pipelineTimeline, setPipelineTimeline] = useState<any[]>([]);

  // Tab State
  const [currentTab, setCurrentTab] = useState('general');

  // Dropdown Options
  const [leadsFromOptions, setLeadsFromOptions] = useState<string[]>([]);
  const [serviceOptions, setServiceOptions] = useState<string[]>([]);
  const [countryOptions, setCountryOptions] = useState<string[]>([]);
  const [stateOptions, setStateOptions] = useState<string[]>([]);
  const [cityOptions, setCityOptions] = useState<string[]>([]);
  const [workflowActions, setWorkflowActions] = useState<{ action: string; next_state: string }[]>([]);
  const [allWorkflowStates, setAllWorkflowStates] = useState<string[]>([]);
  const [pendingWorkflowChange, setPendingWorkflowChange] = useState<{ action: string; next_state: string } | null>(null);

  // Convert Lead State
  const [converting, setConverting] = useState(false);
  const [convertResult, setConvertResult] = useState<ConvertLeadResponse | null>(null);

  // Alert & Dialog State
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' | 'warning' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Permissions State
  const [permissions, setPermissions] = useState<{ read: boolean; write: boolean; delete: boolean }>({
    read: true,
    write: true,
    delete: true,
  });

  const { data, total, loading, refetch } = useLeads(
    table.page,
    table.rowsPerPage,
    filterName,
    filterStatus
  );

  useEffect(() => {
    // Fetch dropdown options on mount
    getDoctypeList('Lead From').then(setLeadsFromOptions);
    getDoctypeList('Service').then(setServiceOptions);

    // Fetch Permissions
    import('src/api/leads').then(api => {
      api.getLeadPermissions().then(setPermissions);
    });

    // Populate Country Options from local JSON (remove duplicates)
    const countries = Array.from(new Set(locationData.map((c: any) => c.country)));
    setCountryOptions(["", ...countries]);

    // Fetch workflow states
    getWorkflowStates('Lead').then(workflowData => {
      setAllWorkflowStates(workflowData.states);
    });
  }, []);

  // Fetch States when Country changes
  useEffect(() => {
    if (country) {
      const countryData = locationData.find((c: any) => c.country === country);
      if (countryData) {
        const states = countryData.states.map((s: any) => s.name);
        setStateOptions(["", ...states, "Others"]);
      } else {
        setStateOptions([]);
      }
    } else {
      setStateOptions([]);
      setCityOptions([]);
    }
  }, [country]);

  // Fetch Cities when State changes
  useEffect(() => {
    if (state && country) {
      if (state === 'Others') {
        setCityOptions(['Others']);
      } else {
        const countryData = locationData.find((c: any) => c.country === country);
        if (countryData) {
          const stateData = countryData.states.find((s: any) => s.name === state);
          if (stateData) {
            setCityOptions(["", ...stateData.cities, "Others"]);
          } else {
            setCityOptions(["Others"]);
          }
        }
      }
    } else {
      setCityOptions([]);
    }
  }, [state, country]);

  // Form state

  const handleOpenCreate = () => {
    setViewOnly(false);
    setOpenCreate(true);
  };

  const handleCloseCreate = () => {
    setOpenCreate(false);
    setValidationErrors({});// Clear errors
    setCurrentLeadId(null);
    setViewOnly(false);
    setCurrentTab('general');
    setLeadName('');
    setCompanyName('');
    setGstin('');
    setPhoneNumber('');
    setEmail('');
    setLeadsType('Incoming');
    setLeadsFrom('');
    setService('');
    setCountry('');
    setState('');
    setCity('');
    setWorkflowState('');
    setStatus('New Lead');
    setBillingAddress('');
    setRemarks('');
    setConvertedAccount('');
    setConvertedContact('');
    setFollowupDetails([]);
    setPipelineTimeline([]);
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev: any) => ({ ...prev, open: false }));
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setOpenDelete(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteLead(deleteId);
      setSnackbar({ open: true, message: 'Lead deleted successfully', severity: 'success' });
      await refetch();
    } catch (e) {
      console.error(e);
      setSnackbar({ open: true, message: 'Failed to delete lead', severity: 'error' });
    } finally {
      setOpenDelete(false);
      setDeleteId(null);
    }
  };

  // Validation State
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: boolean }>({});

  const handleCreate = async () => {
    // Validation
    const newErrors: { [key: string]: boolean } = {};
    const missingFields: string[] = [];

    if (!leadName) {
      newErrors.leadName = true;
      missingFields.push('Lead Name');
    }
    if (!companyName) {
      newErrors.companyName = true;
      missingFields.push('Company Name');
    }
    if (!leadsType) {
      newErrors.leadsType = true;
      missingFields.push('Leads Type');
    }
    if (!leadsFrom) {
      newErrors.leadsFrom = true;
      missingFields.push('Leads From');
    }
    if (!phoneNumber) {
      newErrors.phoneNumber = true;
      missingFields.push('Phone Number');
    }

    if (Object.keys(newErrors).length > 0) {
      setValidationErrors(newErrors);
      setSnackbar({
        open: true,
        message: `Please fill in mandatory fields: ${missingFields.join(', ')}`,
        severity: 'error'
      });
      return;
    }

    // Clear errors if validation passes
    setValidationErrors({});

    try {
      setCreating(true);

      // Format phone number: remove spaces and add hyphen after dial code (e.g., +91-9876543210)
      let formattedPhone = phoneNumber.replace(/\s/g, '');
      const parts = phoneNumber.trim().split(/\s+/);
      if (parts.length > 1 && parts[0].startsWith('+')) {
        formattedPhone = `${parts[0]}-${parts.slice(1).join('')}`;
      }

      const leadData = {
        lead_name: leadName,
        company_name: companyName,
        gstin,
        phone_number: formattedPhone,
        email,
        leads_type: leadsType as any,
        leads_from: leadsFrom,
        service,
        country,
        state,
        city,
        status,
        workflow_state: workflowState,
        billing_address: billingAddress,
        remarks,
      };

      if (currentLeadId) {
        await updateLead(currentLeadId, leadData);
        setSnackbar({ open: true, message: 'Lead updated successfully', severity: 'success' });
      } else {
        await createLead(leadData);
        setSnackbar({ open: true, message: 'Lead created successfully', severity: 'success' });
      }

      await refetch();
      handleCloseCreate();
    } catch (err: any) {
      console.error(err);
      if (currentLeadId) {
        setSnackbar({ open: true, message: 'Failed to update lead', severity: 'error' });
      } else {
        const friendlyMsg = getFriendlyErrorMessage(err);
        setSnackbar({ open: true, message: friendlyMsg, severity: 'error' });
      }
    } finally {
      setCreating(false);
    }
  };

  const cleanPhoneNumber = (val: string) => {
    if (!val) return '';
    // If it contains a hyphen after the plus and dial code, replace it with a space for MuiTelInput
    // e.g., +91-9876543210 -> +91 9876543210
    if (val.startsWith('+') && val.includes('-')) {
      return val.replace('-', ' ');
    }
    return val;
  };

  const handleEditRow = async (row: any) => {
    setViewOnly(false);
    setValidationErrors({}); // Clear errors when opening edit
    const leadId = row.id;
    setCurrentLeadId(leadId);

    try {
      const fullLead = await getLead(leadId);
      setLeadName(fullLead.lead_name || '');
      setCompanyName(fullLead.company_name || '');
      setGstin(fullLead.gstin || '');
      setPhoneNumber(cleanPhoneNumber(fullLead.phone_number || ''));
      setEmail(fullLead.email || '');
      setLeadsType(fullLead.leads_type || 'Incoming');
      setLeadsFrom(fullLead.leads_from || '');
      setService(fullLead.service || '');
      setCountry(fullLead.country || '');
      setState(fullLead.state || '');
      setCity(fullLead.city || '');
      setWorkflowState(fullLead.workflow_state || '');
      setStatus(fullLead.status || 'New Lead');
      setBillingAddress(fullLead.billing_address || '');
      setRemarks(fullLead.remarks || '');
      setConvertedAccount(fullLead.converted_account || '');
      setConvertedContact(fullLead.converted_contact || '');
      setFollowupDetails(fullLead.followup_details || []);
      setPipelineTimeline(fullLead.converted_pipeline_timeline || []);

      // Fetch workflow actions for current state
      if (fullLead.workflow_state) {
        const actions = await getWorkflowActions('Lead', fullLead.workflow_state);
        setWorkflowActions(actions);
      }
    } catch (error) {
      console.error("Failed to fetch full lead", error);
      // Fallback to list data if full fetch fails
      const fallbackRow = data.find((item) => item.name === leadId);
      if (fallbackRow) {
        setLeadName(fallbackRow.lead_name || '');
        setCompanyName(fallbackRow.company_name || '');
        setGstin(fallbackRow.gstin || '');
        setPhoneNumber(cleanPhoneNumber(fallbackRow.phone_number || ''));
        setEmail(fallbackRow.email || '');
        setLeadsType(fallbackRow.leads_type || 'Incoming');
        setLeadsFrom(fallbackRow.leads_from || '');
        setService(fallbackRow.service || '');
        setCountry(fallbackRow.country || '');
        setState(fallbackRow.state || '');
        setCity(fallbackRow.city || '');
        setWorkflowState(fallbackRow.workflow_state || '');
        setStatus(fallbackRow.status || 'New Lead');
        setBillingAddress(fallbackRow.billing_address || '');
        setRemarks(fallbackRow.remarks || '');
      }
    }
    setOpenCreate(true);
  };

  const handleViewRow = async (row: any) => {
    const leadId = row.id;
    setCurrentLeadId(leadId);
    setOpenView(true);
  };

  const onDeleteRow = (id: string) => {
    handleDeleteClick(id);
  };

  const notFound = !loading && data.length === 0 && (!!filterName || filterStatus !== 'all');
  const empty = !loading && data.length === 0 && !filterName && filterStatus === 'all';

  return (
    <>
      {/* CREATE LEAD DIALOG */}
      <Dialog open={openCreate} onClose={handleCloseCreate} fullWidth maxWidth="md">
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {viewOnly ? 'Lead Details' : (currentLeadId ? 'Edit Lead' : 'New Lead')}
          <IconButton
            aria-label="close"
            onClick={handleCloseCreate}
            sx={{
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <Iconify icon="mingcute:close-line" />
          </IconButton>
        </DialogTitle>

        <Box sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={currentTab}
            onChange={(e, newValue) => setCurrentTab(newValue)}
          >
            <Tab label="General" value="general" />
            {currentLeadId && <Tab label="Pipeline" value="pipeline" />}
            {currentLeadId && <Tab label="Followups" value="followups" />}
            {currentLeadId && <Tab label="Convert Lead" value="convert" disabled={viewOnly} />}
          </Tabs>
        </Box>

        <DialogContent dividers>
          {currentTab === 'general' && (
            <Box
              sx={{
                display: 'grid',
                margin: '1rem',
                columnGap: 2,
                rowGap: 3,
                gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
              }}
            >
              <TextField
                fullWidth
                label="Lead Name"
                value={leadName}
                onChange={(e) => {
                  setLeadName(e.target.value);
                  if (e.target.value) setValidationErrors(prev => ({ ...prev, leadName: false }));
                }}
                required
                error={!!validationErrors.leadName}
                slotProps={{ input: { readOnly: viewOnly } }}
              />

              <TextField
                fullWidth
                label="Company Name"
                value={companyName}
                onChange={(e) => {
                  setCompanyName(e.target.value);
                  if (e.target.value) setValidationErrors(prev => ({ ...prev, companyName: false }));
                }}
                required
                error={!!validationErrors.companyName}
                slotProps={{ input: { readOnly: viewOnly } }}
              />

              <TextField
                fullWidth
                label="GSTIN"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                slotProps={{ input: { readOnly: viewOnly } }}
              />

              <MuiTelInput
                fullWidth
                defaultCountry="IN"
                label="Phone Number"
                name="phone_number"
                value={phoneNumber}
                onChange={(newValue: string) => {
                  setPhoneNumber(newValue);
                  if (newValue) setValidationErrors(prev => ({ ...prev, phoneNumber: false }));
                }}
                required
                disabled={viewOnly}
                error={!!validationErrors.phoneNumber}
                sx={{
                  "& .MuiInputBase-input.Mui-disabled": {
                    WebkitTextFillColor: "rgba(0, 0, 0, 0.87)",
                  },
                  "& .MuiInputLabel-root.Mui-disabled": {
                    color: "rgba(0, 0, 0, 0.6)",
                  },
                }}
              />

              <TextField
                fullWidth
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                slotProps={{ input: { readOnly: viewOnly } }}
              />


              <TextField
                select
                fullWidth
                label="Leads Type"
                value={leadsType}
                onChange={(e) => {
                  setLeadsType(e.target.value as any);
                  if (e.target.value) setValidationErrors(prev => ({ ...prev, leadsType: false }));
                }}
                required
                disabled={viewOnly}
                error={!!validationErrors.leadsType}
                SelectProps={{ native: true }}
                InputLabelProps={{ shrink: true }}
                sx={{
                  "& .MuiInputBase-input.Mui-disabled": {
                    WebkitTextFillColor: "rgba(0, 0, 0, 0.87)",
                  },
                }}
              >
                <option value="" disabled>Select</option>
                <option value="Incoming">Incoming</option>
                <option value="Outgoing">Outgoing</option>
              </TextField>


              <TextField
                select
                fullWidth
                label="Leads From"
                value={leadsFrom}
                onChange={(e) => {
                  setLeadsFrom(e.target.value);
                  if (e.target.value) setValidationErrors(prev => ({ ...prev, leadsFrom: false }));
                }}
                required
                disabled={viewOnly}
                error={!!validationErrors.leadsFrom}
                SelectProps={{ native: true }}
                InputLabelProps={{ shrink: true }}
                sx={{
                  "& .MuiInputBase-input.Mui-disabled": {
                    WebkitTextFillColor: "rgba(0, 0, 0, 0.87)",
                  },
                }}
              >
                <option value="" disabled>Select</option>
                {leadsFromOptions.map((option: string) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </TextField>


              <TextField
                select
                fullWidth
                label="Service"
                value={service}
                onChange={(e) => setService(e.target.value)}
                disabled={viewOnly}
                SelectProps={{ native: true }}
                InputLabelProps={{ shrink: true }}
                sx={{
                  "& .MuiInputBase-input.Mui-disabled": {
                    WebkitTextFillColor: "rgba(0, 0, 0, 0.87)",
                  },
                }}
              >
                <option value="" disabled>Select</option>
                {serviceOptions.map((option: string) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </TextField>

              <TextField
                select
                fullWidth
                label="Country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                disabled={viewOnly}
                SelectProps={{ native: true }}
                InputLabelProps={{ shrink: true }}
                sx={{
                  "& .MuiInputBase-input.Mui-disabled": {
                    WebkitTextFillColor: "rgba(0, 0, 0, 0.87)",
                  },
                }}
              >
                <option value="" disabled>Select</option>
                {countryOptions.map((option: string) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </TextField>

              <TextField
                select
                fullWidth
                label="State"
                value={state}
                onChange={(e) => setState(e.target.value)}
                disabled={viewOnly}
                SelectProps={{ native: true }}
                InputLabelProps={{ shrink: true }}
                sx={{
                  "& .MuiInputBase-input.Mui-disabled": {
                    WebkitTextFillColor: "rgba(0, 0, 0, 0.87)",
                  },
                }}
              >
                <option value="" disabled>Select</option>
                {stateOptions.map((option: string) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </TextField>

              <TextField
                select
                fullWidth
                label="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                disabled={viewOnly}
                SelectProps={{ native: true }}
                InputLabelProps={{ shrink: true }}
                sx={{
                  "& .MuiInputBase-input.Mui-disabled": {
                    WebkitTextFillColor: "rgba(0, 0, 0, 0.87)",
                  },
                }}
              >
                <option value="" disabled>Select</option>
                {cityOptions.map((option: string) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </TextField>

              <TextField
                fullWidth
                label="Billing Address"
                multiline
                rows={3}
                value={billingAddress}
                onChange={(e) => setBillingAddress(e.target.value)}
                sx={{ gridColumn: { sm: 'span 2' } }}
                slotProps={{ input: { readOnly: viewOnly } }}
              />

              <TextField
                fullWidth
                label="Remarks"
                multiline
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                sx={{ gridColumn: { sm: 'span 2' } }}
                slotProps={{ input: { readOnly: viewOnly } }}
              />

              {(convertedAccount || convertedContact) && (
                <>
                  <TextField
                    fullWidth
                    label="Converted Account"
                    value={convertedAccount}
                    InputProps={{ readOnly: true }}
                  />
                  <TextField
                    fullWidth
                    label="Converted Contact"
                    value={convertedContact}
                    InputProps={{ readOnly: true }}
                  />
                </>
              )}
            </Box>
          )}

          {currentTab === 'pipeline' && (
            <>
              {workflowState !== 'Closed' && (
                <Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>
                    Change Workflow
                  </Typography>
                  <FormControl size="small" sx={{ minWidth: 250 }}>
                    <Select
                      value=""
                      disabled={viewOnly}
                      displayEmpty
                      renderValue={() => 'Select Action'}
                      sx={{
                        bgcolor: 'common.white',
                        '& .MuiSelect-select': {
                          color: 'text.secondary'
                        }
                      }}
                    >
                      {workflowActions.map((action) => (
                        <MenuItem
                          key={action.action}
                          value={action.action}
                          onClick={() => {
                            setPendingWorkflowChange(action);
                          }}
                        >
                          {action.action}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>
              )}
              <SalesPipeline
                currentStage={workflowState || status}
                stages={allWorkflowStates}
                leadName={leadName}
                service={service}
                disabled={viewOnly}
              />
              <LeadPipelineTimeline
                title="State History"
                list={pipelineTimeline}
              />
            </>
          )}

          {currentTab === 'followups' && (
            <LeadFollowupDetails
              title="Followup History"
              list={followupDetails}
            />
          )}

          {currentTab === 'convert' && (
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Convert Lead to Account and Contact
              </Typography>

              {/* Check if already converted */}
              {convertedAccount && convertedContact ? (
                <Box>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    This lead has already been converted.
                  </Alert>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      fullWidth
                      label="Converted Account"
                      value={convertedAccount}
                      InputProps={{ readOnly: true }}
                    />
                    <TextField
                      fullWidth
                      label="Converted Contact"
                      value={convertedContact}
                      InputProps={{ readOnly: true }}
                    />
                  </Box>
                </Box>
              ) : convertResult ? (
                <Box>
                  <Alert severity="success" sx={{ mb: 2 }}>
                    Lead converted successfully!
                  </Alert>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      fullWidth
                      label="Account Created"
                      value={convertResult.account}
                      InputProps={{ readOnly: true }}
                    />
                    <TextField
                      fullWidth
                      label="Contact Created"
                      value={convertResult.contact}
                      InputProps={{ readOnly: true }}
                    />

                    {convertResult.messages && convertResult.messages.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                          Conversion Details:
                        </Typography>
                        {convertResult.messages.map((msg, idx) => (
                          <Alert key={idx} severity={msg.type as any} sx={{ mb: 1 }}>
                            {msg.text}
                          </Alert>
                        ))}
                      </Box>
                    )}

                    <Button
                      variant="outlined"
                      onClick={() => {
                        setConvertResult(null);
                        setCurrentTab('general');
                        handleCloseCreate();
                        refetch();
                      }}
                      sx={{ mt: 2 }}
                    >
                      Close
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Box>
                  <Alert severity="info" sx={{ mb: 3 }}>
                    This will create an Account and Contact from this lead&apos;s information.
                  </Alert>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
                    <TextField
                      fullWidth
                      label="Lead Name"
                      value={leadName}
                      InputProps={{ readOnly: true }}
                    />
                    <TextField
                      fullWidth
                      label="Company Name"
                      value={companyName}
                      InputProps={{ readOnly: true }}
                      error={!companyName}
                      helperText={!companyName ? 'Company Name is required' : ''}
                    />
                    <TextField
                      fullWidth
                      label="Email"
                      value={email}
                      InputProps={{ readOnly: true }}
                    />
                    <TextField
                      fullWidth
                      label="Phone Number"
                      value={phoneNumber}
                      InputProps={{ readOnly: true }}
                    />
                    {!email && !phoneNumber && (
                      <Alert severity="warning">
                        Email or Phone Number is required to create a Contact
                      </Alert>
                    )}
                  </Box>

                  <Button
                    variant="contained"
                    onClick={async () => {
                      if (!companyName) {
                        setSnackbar({
                          open: true,
                          message: 'Company Name is required to convert lead',
                          severity: 'error'
                        });
                        return;
                      }

                      if (!email && !phoneNumber) {
                        setSnackbar({
                          open: true,
                          message: 'Email or Phone Number is required to convert lead',
                          severity: 'error'
                        });
                        return;
                      }

                      try {
                        setConverting(true);
                        const result = await convertLead(currentLeadId!);
                        setConvertResult(result);
                        setSnackbar({
                          open: true,
                          message: 'Lead converted successfully!',
                          severity: 'success'
                        });
                      } catch (error: any) {
                        console.error('Conversion error:', error);
                        setSnackbar({
                          open: true,
                          message: error.message || 'Failed to convert lead',
                          severity: 'error'
                        });
                      } finally {
                        setConverting(false);
                      }
                    }}
                    disabled={converting || !companyName || (!email && !phoneNumber)}
                    fullWidth
                  >
                    {converting ? 'Converting...' : 'Convert Lead'}
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          {!viewOnly && currentTab === 'general' && (
            <Button variant="contained" onClick={handleCreate} disabled={creating}>
              {creating ? (currentLeadId ? 'Updating...' : 'Creating...') : (currentLeadId ? 'Update Lead' : 'Create Lead')}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* MAIN CONTENT */}
      <DashboardContent>
        <Box sx={{ mb: 5, display: 'flex', alignItems: 'center' }}>
          <Typography variant="h4" sx={{ flexGrow: 1 }}>
            Leads
          </Typography>

          {permissions.write && (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<Iconify icon={"solar:import-bold-duotone" as any} />}
                onClick={() => setOpenImport(true)}
                sx={{ color: '#08a3cd', borderColor: '#08a3cd', '&:hover': { borderColor: '#068fb3', bgcolor: 'rgba(8, 163, 205, 0.04)' } }}
              >
                Import
              </Button>
              <Button
                variant="contained"
                startIcon={<Iconify icon="mingcute:add-line" />}
                onClick={handleOpenCreate}
                sx={{ bgcolor: '#08a3cd', color: 'common.white', '&:hover': { bgcolor: '#068fb3' } }}
              >
                New Lead
              </Button>
            </Box>
          )}
        </Box>

        <Card>
          <UserTableToolbar
            numSelected={table.selected.length}
            filterName={filterName}
            onFilterName={(e) => {
              setFilterName(e.target.value);
              table.onResetPage();
            }}
            filterStatus={filterStatus}
            onFilterStatus={(e) => {
              setFilterStatus(e.target.value);
              table.onResetPage();
            }}
            options={STATUS_OPTIONS}
            searchPlaceholder="Search leads..."
            filterLabel="Workflow State"
          />

          <Scrollbar>
            <TableContainer sx={{ overflow: 'unset' }}>
              <Table sx={{ minWidth: 800 }}>
                <UserTableHead
                  order={table.order}
                  orderBy={table.orderBy}
                  rowCount={total}
                  numSelected={table.selected.length}
                  onSort={table.onSort}
                  onSelectAllRows={(checked) =>
                    table.onSelectAllRows(
                      checked,
                      data.map((row) => row.name)
                    )
                  }
                  headLabel={[
                    { id: 'lead_name', label: 'Name' },
                    { id: 'company_name', label: 'Company' },
                    { id: 'country', label: 'Country' },
                    { id: 'phone_number', label: 'Phone' },
                    { id: 'email', label: 'Email' },
                    { id: 'workflow_state', label: 'Status' },
                    { id: '' },
                  ]}
                />

                <TableBody>
                  {loading && (
                    <TableEmptyRows height={68} emptyRows={table.rowsPerPage} />
                  )}

                  {!loading &&
                    data.map((row) => (
                      <UserTableRow
                        key={row.name}
                        row={{
                          id: row.name,
                          name: row.lead_name ?? '-',
                          company: row.company_name ?? '-',
                          phone: row.phone_number ?? '-',
                          email: row.email ?? '-',
                          status: row.status ?? '-',
                          workflow_state: row.workflow_state ?? '-',
                          avatarUrl: '/assets/images/avatar/avatar-25.webp',
                          isVerified: true,
                          country: row.country ?? '-',
                        }}
                        selected={table.selected.includes(row.name)}
                        onSelectRow={() => table.onSelectRow(row.name)}
                        onEdit={() => handleEditRow({ id: row.name })}
                        onDelete={() => onDeleteRow(row.name)}
                        onView={() => handleViewRow({ id: row.name })}
                        canEdit={permissions.write}
                        canDelete={permissions.delete}
                      />
                    ))}

                  {notFound && <TableNoData searchQuery={filterName} />}

                  {empty && (
                    <TableRow>
                      <TableCell colSpan={7}>
                        <EmptyContent
                          title="No leads found"
                          description="Start capturing leads to boost your sales."
                          icon="solar:flag-checkered-bold-duotone"
                        />
                      </TableCell>
                    </TableRow>
                  )}

                  {!empty && !loading && (
                    <TableEmptyRows height={68} emptyRows={table.rowsPerPage - data.length} />
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Scrollbar>

          <TablePagination
            component="div"
            page={table.page}
            count={total}
            rowsPerPage={table.rowsPerPage}
            onPageChange={table.onChangePage}
            rowsPerPageOptions={[5, 10, 25]}
            onRowsPerPageChange={table.onChangeRowsPerPage}
          />
        </Card>
      </DashboardContent>

      <ConfirmDialog
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        title="Confirm Delete"
        content="Are you sure you want to delete this lead?"
        action={
          <Button onClick={handleConfirmDelete} color="error" variant="contained" sx={{ borderRadius: 1.5, minWidth: 100 }}>
            Delete
          </Button>
        }
      />

      {/* Workflow Confirmation Dialog */}
      <ConfirmDialog
        open={!!pendingWorkflowChange}
        onClose={() => setPendingWorkflowChange(null)}
        title="Confirm Workflow Change"
        icon="solar:question-square-bold"
        iconColor="primary.main"
        content={`Are you sure you want to change the workflow status to "${pendingWorkflowChange?.action}"?`}
        action={
          <Button
            variant="contained"
            color="primary"
            sx={{ borderRadius: 1.5, minWidth: 100 }}
            onClick={async () => {
              if (!pendingWorkflowChange) return;
              try {
                const newStage = pendingWorkflowChange.next_state;
                setWorkflowState(newStage);
                if (currentLeadId) {
                  await updateLead(currentLeadId, { workflow_state: newStage });
                  const updatedLead = await getLead(currentLeadId);
                  setPipelineTimeline(updatedLead.converted_pipeline_timeline || []);
                  const newActions = await getWorkflowActions('Lead', newStage);
                  setWorkflowActions(newActions);
                  await refetch(); // Refresh table data
                  setSnackbar({ open: true, message: 'Workflow status updated successfully', severity: 'success' });
                }
                setPendingWorkflowChange(null);
              } catch (error: any) {
                console.error('Failed to update workflow status:', error);
                setSnackbar({ open: true, message: error.message || 'Failed to update workflow status', severity: 'error' });
                setPendingWorkflowChange(null);
              }
            }}
          >
            Confirm
          </Button>
        }
      />

      <LeadImportDialog
        open={openImport}
        onClose={() => setOpenImport(false)}
        onRefresh={refetch}
      />

      <LeadDetailsDialog
        open={openView}
        onClose={() => {
          setOpenView(false);
          setCurrentLeadId(null);
        }}
        leadId={currentLeadId}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}

// ----------------------------------------------------------------------

export function useTable() {
  const [page, setPage] = useState(0);
  const [orderBy, setOrderBy] = useState('name');
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [selected, setSelected] = useState<string[]>([]);
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');

  const onSort = useCallback(
    (id: string) => {
      const isAsc = orderBy === id && order === 'asc';
      setOrder(isAsc ? 'desc' : 'asc');
      setOrderBy(id);
    },
    [order, orderBy]
  );

  const onSelectAllRows = useCallback((checked: boolean, ids: string[]) => {
    setSelected(checked ? ids : []);
  }, []);

  const onSelectRow = useCallback((value: string) => {
    setSelected((prev: string[]) =>
      prev.includes(value) ? prev.filter((v: string) => v !== value) : [...prev, value]
    );
  }, []);

  const onResetPage = () => setPage(0);

  const onChangePage = (_: unknown, newPage: number) => setPage(newPage);

  const onChangeRowsPerPage = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    onResetPage();
  };

  return {
    page,
    order,
    orderBy,
    rowsPerPage,
    selected,
    onSort,
    onSelectRow,
    onSelectAllRows,
    onResetPage,
    onChangePage,
    onChangeRowsPerPage,
  };
}
