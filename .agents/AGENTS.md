# Innoblitz CRM — Project Context

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + Vite, TypeScript, MUI v5 |
| Backend | Frappe Framework (Python), ERPNext-style doctypes |
| Dev Server | `npm run dev` in `apps/company/company/frontend` |
| App Server | `bench start` in `com-bench` |

---

## Workspace Paths

```
com-bench/apps/company/company/
  frontend/src/
    api/           # All API modules (one file per feature)
    sections/      # React page sections (one dir per feature)
    utils/         # Shared utilities
    components/    # Shared UI components
    routes/        # React Router config
    layouts/       # Layout wrappers (DashboardContent)
  company/
    doctype/       # Frappe Python doctypes
    frontend_api.py  # Custom whitelisted API endpoints
```

---

## API Patterns

Every API file in `src/api/*.ts` follows this pattern:

```ts
import { frappeRequest } from 'src/utils/csrf';

export interface MyDoc { name: string; field: string; modified: string; }

export async function fetchMyDocs(params) {
    const query = new URLSearchParams({
        doctype: 'Doctype Name',
        fields: JSON.stringify(['name', 'field', 'modified']),
        filters: JSON.stringify(filters),
        or_filters: JSON.stringify(or_filters),
        limit_start: String((params.page - 1) * params.page_size),
        limit_page_length: String(params.page_size),
        order_by: 'creation desc',
    });
    const [res, countRes] = await Promise.all([
        frappeRequest(`/api/method/frappe.client.get_list?${query}`),
        frappeRequest(`/api/method/company.company.frontend_api.get_permitted_count?doctype=...`),
    ]);
    return { data: data.message || [], total: countData.message || 0 };
}
```

**Key rules:**
- `modified` and `creation` are standard Frappe fields — always available, no backend changes needed
- Add `'modified'` to the `fields` array and `modified: string` to the TypeScript interface

---

## Date / Time Utilities (`src/utils/format-time.ts`)

| Function | Output | Use Case |
|----------|--------|----------|
| `fTimeDist(date)` | `"2 hours ago"` | Compact relative time in action cells |
| `fDate(date)` | `"17 Apr 2022"` | Short date |
| `fDateTime(date)` | `"17 Apr 2022 12:00 am"` | Full datetime |

Local fallback used in some list views:
```ts
function formatDatetime(val?: string) {
    if (!val) return '—';
    return new Date(val).toLocaleString();
}
```

---

## List View Pattern

All list views follow this structure:

```
TABLE_HEAD = [{ id, label, width?, align? }]
SORT_OPTIONS = [{ value: 'field_asc', label: '' }]

fetchData() → calls API, sets data[], total, loading
useEffect(() => fetchData(), [page, rowsPerPage, filterName, sortBy])

<DashboardContent>
  <Card>
    <Toolbar> Search + Sort </Toolbar>
    <Scrollbar>
      <Table>
        <ProposalTableHead headLabel={TABLE_HEAD} />
        <TableBody>
          {data.map(row => <TableRow> ... </TableRow>)}
        </TableBody>
      </Table>
    </Scrollbar>
    <TablePagination />
  </Card>
</DashboardContent>
```

**Reused shared components:**
- `TableNoData` from `src/sections/proposal/table-no-data`
- `Scrollbar`, `EmptyContent`, `Iconify` from `src/components/`
- `DashboardContent` from `src/layouts/dashboard`

---

## Filtering Pattern

### Standard Filters (From Date, To Date, Client/Vendor, Company/Account)
List views implement filter states using MUI components, mapping them to API requests:

```tsx
// State Hooks in Section Component
const [fromDate, setFromDate] = useState<dayjs.Dayjs | null>(null);
const [toDate, setToDate] = useState<dayjs.Dayjs | null>(null);
const [client, setClient] = useState<{ name: string; first_name: string } | null>(null);
const [account, setAccount] = useState<{ name: string; account_name: string } | null>(null);
```

### Owner Scoping Pattern (`has_crm_permission`)
For security and visibility control, reports must scope the records by user permissions if the user doesn't have CRM Manager roles:

```python
# Backend Python (crm_api.py / report.py)
has_permission = frappe.db.exists("User Permission", {"user": frappe.session.user})
owner_val = filters.get("owner")

if has_permission:
    owner_filter = owner_val if (owner_val and owner_val != "all") else frappe.session.user
    conditions.append("doc.owner = %(owner)s")
    params["owner"] = owner_filter
elif owner_val and owner_val != "all":
    conditions.append("doc.owner = %(owner)s")
    params["owner"] = owner_val
```

---

## Sorting Pattern

### Standard Sort Options
Sort states are managed using a shared `SORT_OPTIONS` constant:

```ts
const SORT_OPTIONS = [
    { value: 'creation_desc', label: 'Created (Latest)' },
    { value: 'creation_asc', label: 'Created (Oldest)' },
    { value: 'modified_desc', label: 'Modified (Latest)' },
    { value: 'modified_asc', label: 'Modified (Oldest)' },
    { value: 'date_desc', label: 'Date (Latest)' },
    { value: 'date_asc', label: 'Date (Oldest)' },
];
```

### Client / Server-side Handling
In client-side sorting:
```tsx
const dataFiltered = applyFilter({
    inputData: reportData,
    comparator: getComparator(order, orderBy),
    filterName,
});
```

---

## Pagination Pattern

Manage list pagination using standard MUI `TablePagination` hooks and configurations:

```tsx
const [page, setPage] = useState(0);
const [rowsPerPage, setRowsPerPage] = useState(10);

const onChangePage = useCallback((event: unknown, newPage: number) => {
    setPage(newPage);
}, []);

const onChangeRowsPerPage = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
}, []);

// Render Component
<TablePagination
    rowsPerPageOptions={[5, 10, 25]}
    component="div"
    count={totalRows}
    rowsPerPage={rowsPerPage}
    page={page}
    onPageChange={onChangePage}
    onRowsPerPageChange={onChangeRowsPerPage}
/>
```

---

## List / Table Rendering Pattern

### Checkbox Selection
```tsx
const [selected, setSelected] = useState<string[]>([]);

const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
        const newSelected = reportData.map((n) => n.name);
        setSelected(newSelected);
        return;
    }
    setSelected([]);
};

const handleClick = (event: React.MouseEvent<unknown>, name: string) => {
    const selectedIndex = selected.indexOf(name);
    let newSelected: string[] = [];

    if (selectedIndex === -1) {
        newSelected = newSelected.concat(selected, name);
    } else if (selectedIndex === 0) {
        newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
        newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
        newSelected = newSelected.concat(
            selected.slice(0, selectedIndex),
            selected.slice(selectedIndex + 1)
        );
    }
    setSelected(newSelected);
};
```

### Table Layout & Sticky Styling
Ensure table layouts keep important fields contextually anchored:

```tsx
<TableContainer sx={{ overflow: 'unset' }}>
    <Table sx={{ minWidth: 800 }}>
        {/* Sticky Headers */}
        <TableHead sx={{ position: 'sticky', top: 0, zIndex: 2 }} />
        <TableBody>
            {/* Sticky Actions column */}
            <TableCell 
                align="right" 
                sx={{ 
                    position: 'sticky', 
                    right: 0, 
                    bgcolor: 'background.paper', 
                    boxShadow: (theme) => `-4px 0 8px ${theme.palette.divider}` 
                }}
            >
                {/* Actions */}
            </TableCell>
        </TableBody>
    </Table>
</TableContainer>
```

---

## Excel Export Pattern (ExcelJS)

All detailed reports use a unified ExcelJS generation structure:
1. **Grouped Rows**: Rows grouped by Document ID, displaying line items sequentially.
2. **Merged Column Blocks**: Vertically merge repeating parent-level fields (ID, Dates, Client, Totals, Bank details, Attachments, Owner) across the group's rows.
3. **Borders**: Dark black thin borders (`#000000`) applied to *every* coordinate inside merged cell groups to avoid gaps.
4. **Colors**: Uniform white background fill (`#FFFFFF`) on all data rows, with headers styled in bold white text over a solid blue/teal background (`#0ea5e9`).
5. **No Separator Rows**: Use a `medium` black bottom border on the last row of each document group to separate records instead of empty blank rows.
6. **Attachments Hyperlink**: Point to a signed whitelisted backend download URL (e.g. `download_estimation_attachment`), displaying the exact filename as link text.
7. **Column Auto-fit**: Loop over all columns to adjust width according to content length, applying explicit minimum widths to key text areas (e.g., Description: 25, Attachments: 15, Owner: 20).

```typescript
const workbook = new ExcelJS.Workbook();
const sheet = workbook.addWorksheet('Report');

// Row Grouping, Cell Merging, and Separator Borders
invoiceIdsOrdered.forEach((id) => {
    const items = groups[id];
    const startRow = currentRow;
    const endRow = startRow + items.length - 1;
    groupEndRows.push(endRow);

    items.forEach((item, itemIdx) => {
        const rowData = { ...item };
        // Populate parent fields on first row (itemIdx === 0) only to prevent Excel merge conflicts
        if (itemIdx > 0) {
            rowData.invoice_id = '';
            rowData.grand_total = '';
            // ...
        }
        sheet.addRow(rowData);
    });

    if (items.length > 1) {
        columnsToMerge.forEach((colIndex) => {
            sheet.mergeCells(startRow, colIndex, endRow, colIndex);
        });
    }
});

// Row styling loop applying thin borders, and medium separator borders at group ends
for (let r = 1; r <= sheet.rowCount; r++) {
    const isGroupEnd = groupEndRows.includes(r);
    for (let c = 1; c <= colCount; c++) {
        const cell = sheet.getRow(r).getCell(c);
        cell.border = {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: isGroupEnd ? 'medium' : 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } }
        };
    }
}
```

---

## PDF Export Pattern

### Hook Usage
We use a custom `usePdfExport` hook to handle PDF exports with loading and status indicators:

```tsx
const { exportingPdf, handleExportPdf } = usePdfExport();

// Call hook inside report view:
handleExportPdf(async () => {
    await generateInvoicePdf({
        data: reportData,
        filters: { fromDate, toDate, client },
    });
});
```

### Generator Alignment Rule
The fields and columns displayed in the generated PDF must **exactly match** the column configuration defined in the Excel export layout for uniformity.

---

## Export Field API Pattern

### Whitelisted Metadata Retrival
Dynamically retrieve DocType fields for column construction on the frontend while excluding hidden and layout elements. **Do not exclude read_only fields** as they contain calculated metrics (e.g. Total Tax, Amount to Pay, Amount Pending):

```python
# Backend Python (crm_api.py)
@frappe.whitelist()
def get_doctype_export_fields():
    meta = frappe.get_meta("My DocType")
    valid_fields = []

    valid_fields.append({
        "fieldname": "name",
        "label": "ID"
    })

    for field in meta.fields:
        is_allowed = field.fieldname in ("owner",)
        # Exclude only hidden and structural layout fields
        if is_allowed or (not field.hidden and field.fieldtype not in ("Table", "HTML", "Section Break", "Column Break", "Button", "Tab Break")):
            valid_fields.append({
                "fieldname": field.fieldname,
                "label": field.label
            })
    return valid_fields
```

---

## Summary Cards Pattern

### Summary Cards Grid
Rendered directly above the data tables, summary cards represent key metrics in real-time.

```tsx
// Grid Layout
<Grid container spacing={3} sx={{ mb: 3 }}>
    {summaryData.map((item) => (
        <Grid item xs={12} sm={6} md={3} key={item.label}>
            <SummaryCard 
                title={item.label} 
                value={item.value} 
                icon={item.icon} 
                color={item.color} 
            />
        </Grid>
    ))}
</Grid>
```

### Summary Response Shape
The `report_summary` Python API response is represented as a structured dictionary matching:

```json
[
  {
    "label": "Total Amount",
    "value": 150000.0,
    "datatype": "Currency"
  },
  {
    "label": "Total Invoices",
    "value": 24,
    "datatype": "Int"
  }
]
```

### Icons and Colors Map
Client-side mapping parses metric labels to choose representative Iconify symbols and themed MUI accent colors:

```typescript
const getIcon = (label: string) => {
    const l = label.toLowerCase();
    if (l.includes('total') || l.includes('amount')) return 'solar:wad-of-money-bold';
    if (l.includes('pending') || l.includes('balance')) return 'solar:clock-circle-bold';
    if (l.includes('collected') || l.includes('paid')) return 'solar:check-circle-bold';
    return 'solar:document-bold';
};
```

---

## Meta Integration Module

| Doctype | Section | API |
|---------|---------|-----|
| CRM Meta App | `sections/meta-app` | `api/meta-app.ts` |
| CRM Meta Page | `sections/meta-page` | `api/meta-page.ts` |
| CRM Meta Form | `sections/meta-form` | `api/meta-form.ts` |
| CRM Meta Lead | `sections/meta-lead` | `api/meta-lead.ts` |
| CRM Meta Queue | `sections/meta-queue` | `api/meta-queue.ts` |
| CRM Meta Webhook Log | `sections/meta-webhook-log` | `api/meta-webhook-log.ts` |

### Meta Lead Fields
`name, meta_lead_id, meta_app, meta_page, meta_form, campaign_name, ad_set_name, ad_name, webhook_payload, lead_json, received_time, processed_time, processing_status, retry_count, error_message, created_lead, creation, modified`

### Meta Queue Fields
`name, meta_lead, job_id, status, attempts, started, completed, last_error, creation, modified`

### Meta Webhook Log Fields
`name, headers, payload, response, http_status, execution_time, retry_count, status, creation, modified`

### Status Badge Pattern
```ts
const STATUS_COLORS: Record<string, { bg: string; border: string; color: string }> = {
    Success:  { bg: 'rgba(34,197,94,0.15)',  border: 'rgba(34,197,94,0.35)',  color: '#15803d' },
    Failed:   { bg: 'rgba(239,68,68,0.15)',  border: 'rgba(239,68,68,0.35)',  color: '#b91c1c' },
    Pending:  { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.35)', color: '#92400e' },
    Queued:   { bg: 'rgba(156,163,175,0.15)',border: 'rgba(156,163,175,0.35)',color: '#374151' },
};
// Cell:
<Box sx={{ bgcolor: sc.bg, border: `1px solid ${sc.border}`, color: sc.color, fontWeight: 700, fontSize: 11, textTransform: 'uppercase', borderRadius: '6px', padding: '4px 10px', display: 'inline-flex', alignItems: 'center' }}>
    {row.status}
</Box>
```

### Modified Time Display Convention
Show as compact relative time next to the action icon (not as a separate column):
```tsx
import { fTimeDist } from 'src/utils/format-time';

// Inside Actions TableCell, before the IconButton:
<Box sx={{ typography: 'body2', color: 'text.secondary', fontWeight: 700, mr: 1, fontSize: 12, whiteSpace: 'nowrap', pt: 1 }}>
    {fTimeDist(row.modified)}
</Box>
```

---

## KeyValueTable (meta-lead-details-view.tsx)

Parses JSON payloads into table or raw view toggle.
- Handles `"prefix message: {...}"` — splits into Response Message row + parsed JSON rows
- Facebook `field_data` arrays extracted as flat key-value rows
- Toggle: pill-style `ToggleButtonGroup` with `bgcolor: '#00a5d1'` for active state

---

## Common Commands

```bash
# Frontend
cd apps/company/company/frontend && npm run dev
npx tsc --noEmit   # type check

# Backend
cd com-bench && bench start
```

---

## Coding Conventions

- MUI `sx` prop for all styling — no CSS files in sections
- `alpha(theme.palette.primary.main, 0.08)` for soft backgrounds
- `borderRadius: 1.5` for cards, `borderRadius: '6px'` for status badges
- Index circle: 28×28px, `borderRadius: '50%'`, primary color at 8% opacity
- Empty value fallback: `'—'` (em-dash, not dash or N/A)
- Icons: `solar:` prefix from Iconify (e.g. `solar:eye-bold`, `solar:code-bold`)
- Meta brand icon: `logos:meta-icon` width=22
- Brand color: `#08a3cd` (used for icon accents and active toggles `#00a5d1`)
