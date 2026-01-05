import type { DocField } from 'src/api/meta';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Radio from '@mui/material/Radio';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Checkbox from '@mui/material/Checkbox';
import RadioGroup from '@mui/material/RadioGroup';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';

import { getDoctypeMeta } from 'src/api/meta';

import { Scrollbar } from 'src/components/scrollbar';

// ----------------------------------------------------------------------

type Props = {
    open: boolean;
    onClose: () => void;
    doctype: string;
    onExport: (selectedFields: string[], format: 'excel' | 'csv') => void;
};

export function ExportFieldsDialog({ open, onClose, doctype, onExport }: Props) {
    const [fields, setFields] = useState<DocField[]>([]);
    const [selectedFields, setSelectedFields] = useState<string[]>([]);
    const [format, setFormat] = useState<'excel' | 'csv'>('excel');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && doctype) {
            setLoading(true);
            getDoctypeMeta(doctype)
                .then((meta) => {
                    console.log('ExportFieldsDialog meta:', meta);
                    setFields(meta.fields);
                    // Default select all
                    setSelectedFields(meta.fields.map(f => f.fieldname));
                    setLoading(false);
                })
                .catch((err) => {
                    console.error(err);
                    setLoading(false);
                });
        }
    }, [open, doctype]);

    const handleToggleField = (fieldname: string) => {
        const currentIndex = selectedFields.indexOf(fieldname);
        const newSelected = [...selectedFields];

        if (currentIndex === -1) {
            newSelected.push(fieldname);
        } else {
            newSelected.splice(currentIndex, 1);
        }

        setSelectedFields(newSelected);
    };

    const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            setSelectedFields(fields.map((f) => f.fieldname));
        } else {
            setSelectedFields([]);
        }
    };

    const handleExport = () => {
        onExport(selectedFields, format);
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle>Export Data: {doctype}</DialogTitle>

            <Divider />

            <DialogContent sx={{ py: 3, height: 400 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        {/* Format Selection */}
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>Export Format</Typography>
                            <RadioGroup
                                row
                                value={format}
                                onChange={(e) => setFormat(e.target.value as 'excel' | 'csv')}
                            >
                                <FormControlLabel value="excel" control={<Radio />} label="Excel (.xlsx)" />
                                <FormControlLabel value="csv" control={<Radio />} label="CSV (.csv)" />
                            </RadioGroup>
                        </Box>

                        <Divider sx={{ mb: 2 }} />

                        <Box sx={{ mb: 2 }}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={selectedFields.length === fields.length && fields.length > 0}
                                        indeterminate={selectedFields.length > 0 && selectedFields.length < fields.length}
                                        onChange={handleSelectAll}
                                    />
                                }
                                label="Select All Fields"
                            />
                            <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                                ({selectedFields.length} selected)
                            </Typography>
                        </Box>

                        <Scrollbar>
                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
                                {fields.map((field) => (
                                    <FormControlLabel
                                        key={field.fieldname}
                                        control={
                                            <Checkbox
                                                checked={selectedFields.indexOf(field.fieldname) !== -1}
                                                onChange={() => handleToggleField(field.fieldname)}
                                                size="small"
                                            />
                                        }
                                        label={field.label || field.fieldname}
                                        sx={{
                                            '& .MuiTypography-root': { fontSize: '0.875rem' }
                                        }}
                                    />
                                ))}
                            </Box>
                        </Scrollbar>
                    </Box>
                )}
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} color="inherit">
                    Cancel
                </Button>
                <Button onClick={handleExport} variant="contained" disabled={selectedFields.length === 0 || loading}>
                    Export
                </Button>
            </DialogActions>
        </Dialog>
    );
}
