export interface RenewalTracker {
    name: string;
    item_name: string;
    category: string;
    vendor?: string;
    purchase_date?: string;
    renewal_date?: string;
    amount?: number;
    renewal_period?: string;
    status: string;
    remarks?: string;
    creation?: string;
    modified?: string;
}

async function fetchFrappeList(params: {
    page: number;
    page_size: number;
    search?: string;
    orderBy?: string;
    order?: 'asc' | 'desc';
}) {
    const filters: any[] = [];

    if (params.search) {
        filters.push(['Renewal Tracker', 'item_name', 'like', `%${params.search}%`]);
    }

    const orderByParam = params.orderBy && params.order ? `${params.orderBy} ${params.order}` : "renewal_date desc";

    const query = new URLSearchParams({
        doctype: 'Renewal Tracker',
        fields: JSON.stringify(["*"]),
        filters: JSON.stringify(filters),
        limit_start: String((params.page - 1) * params.page_size),
        limit_page_length: String(params.page_size),
        order_by: orderByParam
    });

    const [res, countRes] = await Promise.all([
        fetch(`/api/method/frappe.client.get_list?${query.toString()}`, { credentials: "include" }),
        fetch(`/api/method/frappe.client.get_count?doctype=Renewal Tracker&filters=${encodeURIComponent(JSON.stringify(filters))}`, { credentials: "include" })
    ]);

    if (!res.ok) throw new Error("Failed to fetch renewals");

    const data = await res.json();
    const countData = await countRes.json();

    return {
        data: data.message || [],
        total: countData.message || 0
    };
}

export const fetchRenewals = (params: any) => fetchFrappeList(params);

export async function createRenewal(data: Partial<RenewalTracker>) {
    const res = await fetch("/api/method/frappe.client.insert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ doc: { doctype: "Renewal Tracker", ...data } })
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.exception || error.message || "Failed to create renewal");
    }

    return (await res.json()).message;
}

export async function updateRenewal(name: string, data: Partial<RenewalTracker>) {
    const res = await fetch("/api/method/frappe.client.set_value", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
            doctype: "Renewal Tracker",
            name,
            fieldname: data
        })
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.exception || error.message || "Failed to update renewal");
    }

    return (await res.json()).message;
}

export async function deleteRenewal(name: string) {
    const res = await fetch("/api/method/frappe.client.delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ doctype: "Renewal Tracker", name })
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.exception || error.message || "Failed to delete renewal");
    }

    return true;
}

export async function getRenewal(name: string) {
    const res = await fetch(`/api/method/frappe.client.get?doctype=Renewal Tracker&name=${encodeURIComponent(name)}`, {
        credentials: "include"
    });

    if (!res.ok) {
        throw new Error("Failed to fetch renewal details");
    }

    return (await res.json()).message;
}

export async function getRenewalPermissions() {
    const res = await fetch("/api/method/company.company.frontend_api.get_doc_permissions?doctype=Renewal Tracker", {
        credentials: "include"
    });

    if (!res.ok) {
        return { read: false, write: false, delete: false };
    }

    return (await res.json()).message || { read: false, write: false, delete: false };
}
