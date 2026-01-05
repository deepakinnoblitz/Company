import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Step from '@mui/material/Step';
import Table from '@mui/material/Table';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Select from '@mui/material/Select';
import Stepper from '@mui/material/Stepper';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import StepLabel from '@mui/material/StepLabel';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import { IconButton, FormControl } from '@mui/material';
import LinearProgress from '@mui/material/LinearProgress';
import TableContainer from '@mui/material/TableContainer';

import {
    uploadFile,
    getDocFields,
    getImportLogs,
    getTemplateUrl,
    startDataImport,
    getImportStatus,
    getImportPreview,
    createDataImport,
    updateDataImport,
    updateImportFile
} from 'src/api/data-import';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const STEPS = ['Upload', 'Map Columns', 'Preview', 'Import'];

type Props = {
    open: boolean;
    onClose: VoidFunction;
    onRefresh: VoidFunction;
};

export function ContactImportDialog({ open, onClose, onRefresh }: Props) {
    const [activeStep, setActiveStep] = useState(0);
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [importName, setImportName] = useState('');
    const [previewData, setPreviewData] = useState<any>(null);
    const [docFields, setDocFields] = useState<any[]>([]);
    const [mapping, setMapping] = useState<Record<string, string>>({});
    const [importStatus, setImportStatus] = useState<any>(null);
    const [logs, setLogs] = useState<any[]>([]);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState('');
    const [editedData, setEditedData] = useState<any[][]>([]);

    // 1. Initial Load of Fields
    useEffect(() => {
        if (open) {
            getDocFields('Contacts').then(setDocFields).catch(console.error);
        }
    }, [open]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files?.[0]) {
            setFile(event.target.files[0]);
            setError('');
        }
    };

    // ----------------------------------------------------------------------
    // STEP 0 -> 1: Upload & Initialize
    const handleUpload = async () => {
        if (!file) return;
        setLoading(true);
        try {
            const uploaded = await uploadFile(file);
            const di = await createDataImport({
                reference_doctype: 'Contacts',
                import_file: uploaded.file_url,
                import_type: 'Insert New Records'
            });
            setImportName(di.name);

            const preview = await getImportPreview(di.name);
            setPreviewData(preview);

            // Initialize automatic mapping based on header names
            const initialMapping: Record<string, string> = {};
            preview.columns.forEach((col: any, index: number) => {
                if (col.header_title === 'Sr. No') return;

                // 1. Priority: Use Frappe's own mapping if detected
                if (col.df?.fieldname) {
                    initialMapping[index] = col.df.fieldname;
                    return;
                }

                // 2. Fallback: Manual matching
                const header = col.header_title?.trim().toLowerCase();
                const field = docFields.find(f =>
                    f.label?.trim().toLowerCase() === header ||
                    f.fieldname?.trim().toLowerCase() === header ||
                    f.fieldname?.replace(/_/g, ' ').toLowerCase() === header
                );
                initialMapping[index] = field ? field.fieldname : "Don't Import";
            });
            setMapping(initialMapping);

            setActiveStep(1);
        } catch (e: any) {
            setError(e.message || 'Upload failed');
        } finally {
            setLoading(false);
        }
    };

    // ----------------------------------------------------------------------
    // STEP 1 -> 2: Save Mapping & Review Preview
    const handleSaveMapping = async () => {
        setLoading(true);
        try {
            // Filter mapping: explicitly mapping to "__skip__" prevents Frappe from auto-matching the header title
            // IMPORTANT: Indices in mapping state are relative to previewData.columns (including synthetic Sr.No at 0)
            // But Frappe's column_to_field_map expects indices relative to the original file row (starting at 0)
            const finalMapping: Record<string, string> = {};
            Object.entries(mapping).forEach(([idx, field]) => {
                const numericIdx = parseInt(idx, 10);
                if (numericIdx > 0) {
                    finalMapping[numericIdx - 1] = field === "Don't Import" ? "__skip__" : field;
                }
            });

            const template_options = {
                column_to_field_map: finalMapping
            };
            await updateDataImport(importName, { template_options: JSON.stringify(template_options) });

            const preview = await getImportPreview(importName);
            setPreviewData(preview);
            setEditedData(preview.data || []);
            setActiveStep(2);
        } catch (e: any) {
            setError(e.message || 'Failed to save mapping');
        } finally {
            setLoading(false);
        }
    };

    // ----------------------------------------------------------------------
    // STEP 2 -> 3: Start Import & Poll
    const handleStartImport = async () => {
        setLoading(true);
        try {
            // 1. Sync Mapping
            const finalMapping: Record<string, string> = {};
            Object.entries(mapping).forEach(([idx, field]) => {
                const numericIdx = parseInt(idx, 10);
                if (numericIdx > 0) {
                    finalMapping[numericIdx - 1] = field === "Don't Import" ? "__skip__" : field;
                }
            });
            const template_options = { column_to_field_map: finalMapping };
            await updateDataImport(importName, { template_options: JSON.stringify(template_options) });

            // 2. Sync Edited Data
            const headers = previewData.columns.map((c: any) => c.header_title);
            const fullGrid = [headers, ...editedData];
            await updateImportFile(importName, fullGrid);

            // 3. Start Import
            await startDataImport(importName);
            setActiveStep(3);
            pollStatus(importName);
        } catch (e: any) {
            setError(e.message || 'Failed to start import');
            setLoading(false);
        }
    };

    const pollStatus = async (name: string) => {
        const interval = setInterval(async () => {
            try {
                const status = await getImportStatus(name);
                setImportStatus(status);

                if (status.total_records > 0) {
                    const processed = (status.success || 0) + (status.failed || 0);
                    setProgress((processed / status.total_records) * 100);
                }

                if (['Success', 'Partial Success', 'Error', 'Timed Out'].includes(status.status)) {
                    clearInterval(interval);
                    setLoading(false);
                    const finalLogs = await getImportLogs(name);
                    setLogs(finalLogs);
                    onRefresh();
                }
            } catch (e) {
                console.error('Polling error:', e);
            }
        }, 2000);
    };

    const reset = () => {
        setActiveStep(0);
        setFile(null);
        setImportName('');
        setPreviewData(null);
        setMapping({});
        setHiddenIndices([]);
        setImportStatus(null);
        setLogs([]);
        setProgress(0);
        setError('');
        setLoading(false);
    };

    const handleClose = () => {
        if (!loading) {
            reset();
            onClose();
        }
    };

    const [hiddenIndices, setHiddenIndices] = useState<number[]>([]);

    const handleDeleteRow = (idx: number) => {
        setMapping({ ...mapping, [idx]: "Don't Import" });
        setHiddenIndices([...hiddenIndices, idx]);
    };

    const handleShowAll = () => {
        setHiddenIndices([]);
    };

    const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
        const newData = [...editedData];
        newData[rowIndex][colIndex] = value;
        setEditedData(newData);
    };

    const handleHeaderMappingChange = (colIndex: number, value: string) => {
        setMapping({ ...mapping, [colIndex]: value });
    };

    // ----------------------------------------------------------------------
    // UI RENDERERS

    const renderUpload = (
        <Box sx={{ py: 4, display: 'flex', flexFlow: 'column', alignItems: 'center' }}>
            <Box
                sx={{
                    p: 5,
                    width: '100%',
                    maxWidth: 400,
                    border: '2px dashed',
                    borderColor: 'divider',
                    borderRadius: 1.5,
                    cursor: 'pointer',
                    bgcolor: 'background.neutral',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: (theme) => theme.transitions.create('opacity'),
                    '&:hover': { opacity: 0.72 },
                    position: 'relative',
                    overflow: 'hidden'
                }}
                component="label"
            >
                <input type="file" hidden accept=".csv, .xlsx" onChange={handleFileChange} />
                <Iconify icon={"solar:cloud-upload-bold-duotone" as any} width={64} sx={{ mb: 2, color: 'primary.main', position: 'relative', zIndex: 1 }} />
                <Typography variant="h6" sx={{ position: 'relative', zIndex: 1 }}>{file ? file.name : 'Select data file'}</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', position: 'relative', zIndex: 1 }}>Drop file here or click to browse</Typography>
            </Box>
            <Button
                size="small"
                color="primary"
                startIcon={<Iconify icon={"solar:download-bold-duotone" as any} />}
                onClick={() => window.open(getTemplateUrl('Contacts'), '_blank')}
                sx={{ mt: 2 }}
            >
                Download Sample Template
            </Button>
            {error && <Alert severity="error" sx={{ mt: 2, width: '100%', maxWidth: 400 }}>{error}</Alert>}
        </Box>
    );

    const renderMapping = (
        <Box>
            {hiddenIndices.length > 0 && (
                <Box sx={{ mb: 1, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button size="small" variant="text" onClick={handleShowAll} startIcon={<Iconify icon="solar:eye-bold" />}>
                        Show {hiddenIndices.length} skipped columns
                    </Button>
                </Box>
            )}
            <TableContainer sx={{ mt: 1, maxHeight: 400 }}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>File Column</TableCell>
                            <TableCell>Contact Field</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {previewData?.columns
                            .filter((c: any) => c.header_title !== 'Sr. No')
                            .filter((c: any) => !hiddenIndices.includes(previewData.columns.indexOf(c)))
                            .map((col: any) => {
                                const actualIdx = previewData.columns.indexOf(col);
                                return (
                                    <TableRow key={actualIdx}>
                                        <TableCell>
                                            <Typography variant="subtitle2">{col.header_title || `Column ${actualIdx + 1}`}</Typography>
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                Sample: {previewData.data?.[0]?.[actualIdx] || 'N/A'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <FormControl fullWidth size="small">
                                                    <Select
                                                        value={mapping[actualIdx] || "Don't Import"}
                                                        onChange={(e) => setMapping({ ...mapping, [actualIdx]: e.target.value })}
                                                    >
                                                        <MenuItem value="Don't Import">Don&apos;t Import</MenuItem>
                                                        {docFields.map((field) => (
                                                            <MenuItem key={field.fieldname} value={field.fieldname}>
                                                                {field.label} ({field.fieldname})
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => handleDeleteRow(actualIdx)}
                                                >
                                                    <Iconify icon="solar:trash-bin-trash-bold" />
                                                </IconButton>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );

    const renderPreview = (
        <Box sx={{ mt: 2 }}>
            {(() => {
                const filteredWarnings = (previewData?.warnings || []).filter((w: any) => {
                    const message = w.message?.toLowerCase() || '';
                    // Hide technical info about skipped columns
                    if (message.includes('__skip__')) return false;
                    // Hide standard mapping info once user has manually confirmed
                    if (w.type === 'info' && (message.includes('mapping column') || message.includes('cannot match column') || message.includes('with any field'))) return false;
                    return true;
                });

                if (filteredWarnings.length === 0) return null;

                return (
                    <Stack spacing={1} sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" color="warning.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Iconify icon={"solar:danger-bold" as any} /> Warnings ({filteredWarnings.length})
                        </Typography>
                        {filteredWarnings.slice(0, 5).map((w: any, i: number) => (
                            <Alert key={i} severity={w.type === 'info' ? 'info' : 'warning'} sx={{ py: 0 }}>
                                {w.row ? `Row ${w.row}: ` : ''}
                                {w.message.replace(/<[^>]*>?/gm, '') /* Strip HTML tags */}
                            </Alert>
                        ))}
                        {filteredWarnings.length > 5 && <Typography variant="caption">...and {filteredWarnings.length - 5} more warnings</Typography>}
                    </Stack>
                );
            })()}

            <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Iconify icon={"solar:table-split-bold-duotone" as any} width={20} />
                Data Preview & Mapping (Editable)
            </Typography>
            <TableContainer
                sx={{
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    maxHeight: 450,
                    bgcolor: 'background.paper',
                    boxShadow: (theme) => theme.customShadows.dropdown
                }}
            >
                <Table size="small" stickyHeader sx={{ borderCollapse: 'separate', borderSpacing: 0 }}>
                    <TableHead>
                        <TableRow>
                            {previewData?.columns.map((col: any, i: number) => {
                                if (col.header_title === 'Sr. No') return null;
                                const isSkipped = mapping[i] === "Don't Import";
                                return (
                                    <TableCell
                                        key={i}
                                        sx={{
                                            whiteSpace: 'nowrap',
                                            bgcolor: 'background.neutral',
                                            borderRight: 1,
                                            borderBottom: 2,
                                            borderColor: 'divider',
                                            p: 1.5,
                                            opacity: isSkipped ? 0.6 : 1,
                                            transition: (theme) => theme.transitions.create('opacity'),
                                            minWidth: 160
                                        }}
                                    >
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                fontWeight: 'bold',
                                                display: 'block',
                                                mb: 1,
                                                color: isSkipped ? 'text.disabled' : 'text.primary',
                                                textTransform: 'uppercase',
                                                letterSpacing: 0.5
                                            }}
                                        >
                                            {col.header_title}
                                        </Typography>
                                        <FormControl fullWidth size="small">
                                            <Select
                                                value={mapping[i] || "Don't Import"}
                                                onChange={(e) => handleHeaderMappingChange(i, e.target.value)}
                                                sx={{
                                                    height: 32,
                                                    fontSize: '0.75rem',
                                                    bgcolor: isSkipped ? 'transparent' : 'background.paper',
                                                    '& .MuiOutlinedInput-notchedOutline': {
                                                        borderColor: isSkipped ? 'transparent' : 'primary.light',
                                                    }
                                                }}
                                            >
                                                <MenuItem value="Don't Import" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
                                                    Don&apos;t Import
                                                </MenuItem>
                                                {docFields.map((field) => (
                                                    <MenuItem key={field.fieldname} value={field.fieldname} sx={{ fontSize: '0.75rem' }}>
                                                        {field.label}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </TableCell>
                                );
                            })}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {editedData.map((row: any, i: number) => (
                            <TableRow
                                key={i}
                                sx={{
                                    '&:hover': { bgcolor: 'action.hover' }
                                }}
                            >
                                {row.map((val: any, j: number) => {
                                    if (j === 0) return null;
                                    const isSkipped = mapping[j] === "Don't Import";
                                    return (
                                        <TableCell
                                            key={j}
                                            sx={{
                                                p: 0,
                                                borderRight: 1,
                                                borderColor: 'divider',
                                                bgcolor: isSkipped ? 'action.hover' : 'inherit',
                                                opacity: isSkipped ? 0.5 : 1
                                            }}
                                        >
                                            <TextField
                                                fullWidth
                                                size="small"
                                                value={val || ''}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleCellChange(i, j, e.target.value)}
                                                variant="standard"
                                                slotProps={{
                                                    input: {
                                                        disableUnderline: true,
                                                        sx: {
                                                            fontSize: '0.875rem',
                                                            px: 1.5,
                                                            py: 1,
                                                            height: '100%',
                                                            '&:focus-within': {
                                                                bgcolor: 'background.paper',
                                                                boxShadow: (theme) => `inset 0 0 0 2px ${theme.palette.primary.main}`,
                                                            }
                                                        }
                                                    }
                                                }}
                                            />
                                        </TableCell>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );

    const renderImport = (
        <Box sx={{ py: 4 }}>
            <Stack spacing={3}>
                <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="subtitle1">Importing...</Typography>
                        <Typography variant="body2">{Math.round(progress)}%</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={progress} sx={{ height: 10, borderRadius: 5 }} />
                </Box>

                {importStatus && (
                    <Box sx={{ p: 2, bgcolor: 'background.neutral', borderRadius: 1, display: 'flex', gap: 4 }}>
                        <Box>
                            <Typography variant="caption" display="block" color="text.secondary">Total</Typography>
                            <Typography variant="h6">{importStatus.total_records}</Typography>
                        </Box>
                        <Box>
                            <Typography variant="caption" display="block" color="success.main">Success</Typography>
                            <Typography variant="h6" color="success.main">{importStatus.success || 0}</Typography>
                        </Box>
                        <Box>
                            <Typography variant="caption" display="block" color="error.main">Failed</Typography>
                            <Typography variant="h6" color="error.main">{importStatus.failed || 0}</Typography>
                        </Box>
                    </Box>
                )}

                {logs.length > 0 && (
                    <Box>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>Detailed Error Logs</Typography>
                        <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 1, maxHeight: 300 }}>
                            <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Row(s)</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell>Message / Exception</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {logs.map((log, i) => (
                                        <TableRow key={i}>
                                            <TableCell>{JSON.parse(log.row_indexes).join(', ')}</TableCell>
                                            <TableCell>
                                                <Iconify
                                                    icon={(log.success ? "solar:check-circle-bold" : "solar:close-circle-bold") as any}
                                                    color={log.success ? "success.main" : "error.main"}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ fontSize: '0.75rem', maxWidth: 400 }}>
                                                {log.success ? `Created: ${log.docname}` : (
                                                    <Box>
                                                        <Typography variant="caption" color="error" component="pre" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                                                            {log.messages !== "[]" ? JSON.parse(log.messages).join('\n') : log.exception}
                                                        </Typography>
                                                    </Box>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                )}
            </Stack>
        </Box>
    );

    return (
        <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
            <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Import Contacts
                <IconButton onClick={handleClose} disabled={loading}>
                    <Iconify icon="mingcute:close-line" />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{ pb: 4 }}>
                <Stepper activeStep={activeStep} sx={{ py: 2 }}>
                    {STEPS.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

                {activeStep === 0 && renderUpload}
                {activeStep === 1 && renderMapping}
                {activeStep === 2 && renderPreview}
                {activeStep === 3 && renderImport}
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
                {activeStep > 0 && activeStep < 3 && (
                    <Button variant="outlined" onClick={() => setActiveStep(activeStep - 1)} disabled={loading}>
                        Back
                    </Button>
                )}

                <Box sx={{ flexGrow: 1 }} />

                {activeStep === 0 && (
                    <Button variant="contained" onClick={handleUpload} disabled={!file || loading}>
                        {loading ? 'Processing...' : 'Next: Mapping'}
                    </Button>
                )}

                {activeStep === 1 && (
                    <Button variant="contained" onClick={handleSaveMapping} disabled={loading}>
                        {loading ? 'Saving...' : 'Next: Preview'}
                    </Button>
                )}

                {activeStep === 2 && (
                    <Button variant="contained" onClick={handleStartImport} disabled={loading}>
                        Start Import
                    </Button>
                )}

                {activeStep === 3 && !loading && (
                    <Button variant="contained" onClick={handleClose}>
                        Finish
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
}
