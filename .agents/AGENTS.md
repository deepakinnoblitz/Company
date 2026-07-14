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
