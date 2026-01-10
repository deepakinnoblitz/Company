import { handleFrappeError } from 'src/utils/api-error-handler';

export interface EstimationItem {
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

export interface Estimation {
    name: string;
    ref_no: string;
    client_name: string;
    customer_name?: string;
    billing_name?: string;
    billing_address?: string;
    phone_number?: string;
    estimate_date: string;
    total_qty?: number;
    total_amount?: number;
    overall_discount_type?: 'Flat' | 'Percentage';
    overall_discount?: number;
    grand_total?: number;
    bank_account?: string;
    terms_and_conditions?: string;
    description?: string;
    attachments?: string;
    table_qecz?: EstimationItem[]; // Estimation Items
}

export async function fetchEstimations(params: {
    page: number;
    page_size: number;
    search?: string;
}) {
    const filters: any[] = [];

    if (params.search) {
        filters.push([
            ["Estimation", "ref_no", "like", `%${params.search}%`],
            ["or", ["Estimation", "customer_name", "like", `%${params.search}%`]]
        ]);
    }

    const query = new URLSearchParams({
        doctype: "Estimation",
        fields: JSON.stringify([
            "name",
            "ref_no",
            "client_name",
            "customer_name",
            "estimate_date",
            "grand_total",
            "creation"
        ]),
        filters: JSON.stringify(filters),
        limit_start: String((params.page - 1) * params.page_size),
        limit_page_length: String(params.page_size),
        order_by: "creation desc"
    });

    const [res, countRes] = await Promise.all([
        fetch(`/api/method/frappe.client.get_list?${query.toString()}`, { credentials: "include" }),
        fetch(`/api/method/frappe.client.get_count?doctype=Estimation&filters=${encodeURIComponent(JSON.stringify(filters))}`, { credentials: "include" })
    ]);

    if (!res.ok) throw new Error("Failed to fetch estimations");

    const data = await res.json();
    const countData = await countRes.json();

    return {
        data: data.message || [],
        total: countData.message || 0
    };
}

export async function createEstimation(data: Partial<Estimation>) {
    const res = await fetch("/api/method/frappe.client.insert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
            doc: {
                doctype: "Estimation",
                ...data
            }
        })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(handleFrappeError(json, "Failed to create estimation"));
    return json.message;
}

export async function updateEstimation(name: string, data: Partial<Estimation>) {
    const res = await fetch("/api/method/frappe.client.set_value", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
            doctype: "Estimation",
            name,
            fieldname: data
        })
    });

    const json = await res.json();
    if (!res.ok) throw new Error(handleFrappeError(json, "Failed to update estimation"));
    return json.message;
}

export async function deleteEstimation(name: string) {
    const res = await fetch("/api/method/frappe.client.delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
            doctype: "Estimation",
            name
        })
    });

    const json = await res.json();
    if (!res.ok) throw new Error(handleFrappeError(json, "Failed to delete estimation"));
    return json.message;
}

export async function getEstimation(name: string) {
    const res = await fetch(`/api/method/frappe.client.get?doctype=Estimation&name=${encodeURIComponent(name)}`, {
        credentials: "include"
    });

    if (!res.ok) {
        throw new Error("Failed to fetch estimation details");
    }

    return (await res.json()).message;
}

export async function getEstimationPermissions() {
    const res = await fetch("/api/method/company.company.frontend_api.get_doc_permissions?doctype=Estimation", {
        credentials: "include"
    });

    if (!res.ok) {
        return { read: false, write: false, delete: false };
    }

    return (await res.json()).message || { read: false, write: false, delete: false };
}

export function getEstimationPrintUrl(name: string) {
    return `/api/method/frappe.utils.print_format.download_pdf?doctype=Estimation&name=${encodeURIComponent(name)}&format=Estimation%20Print%20Style&no_letterhead=1&letterhead=NoLetterhead&settings=%7B%7D&trigger_print=0`;
}

export async function convertEstimationToInvoice(name: string) {
    const res = await fetch("/api/method/company.company.frontend_api.convert_estimation_to_invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ estimation: name })
    });

    const json = await res.json();
    if (!res.ok) throw new Error(handleFrappeError(json, "Failed to convert estimation"));
    return json.message;
}
