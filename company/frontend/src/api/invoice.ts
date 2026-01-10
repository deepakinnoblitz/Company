import { handleFrappeError } from 'src/utils/api-error-handler';

export interface InvoiceItem {
    name?: string;
    service?: string;
    hsn_code?: string;
    description?: string;
    quantity: number;
    price: number;
    discount_type?: 'Flat' | 'Percentage';
    discount?: number;
    tax_type?: string;
    tax_amount?: number;
    sub_total?: number;
    cgst?: number;
    sgst?: number;
    igst?: number;
}

export interface Item {
    name: string;
    item_name: string;
    item_code: string;
    rate: number;
}

export interface Invoice {
    name: string;
    ref_no: string;
    customer_id: string;
    customer_name?: string;
    billing_name?: string;
    billing_address?: string;
    phone_number?: string;
    invoice_date: string;
    due_date?: string;
    payment_terms?: string;
    po_no?: string;
    po_date?: string;
    total_qty?: number;
    total_amount?: number;
    overall_discount_type?: 'Flat' | 'Percentage';
    overall_discount?: number;
    grand_total?: number;
    received_amount?: number;
    balance_amount?: number;
    bank_account?: string;
    terms_and_conditions?: string;
    description?: string;
    attachments?: string;
    table_qecz?: InvoiceItem[]; // Invoice Items
}

export async function fetchInvoices(params: {
    page: number;
    page_size: number;
    search?: string;
}) {
    const filters: any[] = [];

    if (params.search) {
        filters.push([
            ["Invoice", "ref_no", "like", `%${params.search}%`],
            ["or", ["Invoice", "customer_name", "like", `%${params.search}%`]]
        ]);
    }

    const query = new URLSearchParams({
        doctype: "Invoice",
        fields: JSON.stringify([
            "name",
            "ref_no",
            "customer_id",
            "customer_name",
            "invoice_date",
            "grand_total",
            "received_amount",
            "balance_amount",
            "creation"
        ]),
        filters: JSON.stringify(filters),
        limit_start: String((params.page - 1) * params.page_size),
        limit_page_length: String(params.page_size),
        order_by: "creation desc"
    });

    const [res, countRes] = await Promise.all([
        fetch(`/api/method/frappe.client.get_list?${query.toString()}`, { credentials: "include" }),
        fetch(`/api/method/frappe.client.get_count?doctype=Invoice&filters=${encodeURIComponent(JSON.stringify(filters))}`, { credentials: "include" })
    ]);

    if (!res.ok) throw new Error("Failed to fetch invoices");

    const data = await res.json();
    const countData = await countRes.json();

    return {
        data: data.message || [],
        total: countData.message || 0
    };
}

export async function createInvoice(data: Partial<Invoice>) {
    const res = await fetch("/api/method/frappe.client.insert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
            doc: {
                doctype: "Invoice",
                ...data
            }
        })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(handleFrappeError(json, "Failed to create invoice"));
    return json.message;
}

export async function updateInvoice(name: string, data: Partial<Invoice>) {
    const res = await fetch("/api/method/frappe.client.set_value", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
            doctype: "Invoice",
            name,
            fieldname: data
        })
    });

    const json = await res.json();
    if (!res.ok) throw new Error(handleFrappeError(json, "Failed to update invoice"));
    return json.message;
}

export async function deleteInvoice(name: string) {
    const res = await fetch("/api/method/frappe.client.delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
            doctype: "Invoice",
            name
        })
    });

    const json = await res.json();
    if (!res.ok) throw new Error(handleFrappeError(json, "Failed to delete invoice"));
    return json.message;
}

export async function getInvoice(name: string) {
    const res = await fetch(`/api/method/frappe.client.get?doctype=Invoice&name=${encodeURIComponent(name)}`, {
        credentials: "include"
    });

    if (!res.ok) {
        throw new Error("Failed to fetch invoice details");
    }

    return (await res.json()).message;
}

export async function getInvoicePermissions() {
    const res = await fetch("/api/method/company.company.frontend_api.get_doc_permissions?doctype=Invoice", {
        credentials: "include"
    });

    if (!res.ok) {
        return { read: false, write: false, delete: false };
    }

    return (await res.json()).message || { read: false, write: false, delete: false };
}

export function getInvoicePrintUrl(name: string) {
    return `/api/method/frappe.utils.print_format.download_pdf?doctype=Invoice&name=${encodeURIComponent(name)}&format=Invoice%20Print%20Style&no_letterhead=1&letterhead=NoLetterhead&settings=%7B%7D&trigger_print=0`;
}

export async function createItem(data: { item_name: string; item_code: string; rate: number }) {
    const res = await fetch("/api/method/frappe.client.insert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
            doc: {
                doctype: "Item",
                ...data
            }
        })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(handleFrappeError(json, "Failed to create item"));
    return json.message;
}
