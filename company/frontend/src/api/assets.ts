export interface Asset {
    name: string;
    asset_name: string;
    asset_tag: string;
    category: string;
    purchase_date: string;
    purchase_cost: number;
    current_status: string;
    description: string;
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
        filters.push([
            ['Asset', 'asset_name', 'like', `%${params.search}%`],
            ['or', ['Asset', 'asset_tag', 'like', `%${params.search}%`]]
        ]);
    }

    const orderByParam = params.orderBy && params.order ? `${params.orderBy} ${params.order}` : "creation desc";

    const query = new URLSearchParams({
        doctype: 'Asset',
        fields: JSON.stringify(["*"]),
        filters: JSON.stringify(filters),
        limit_start: String((params.page - 1) * params.page_size),
        limit_page_length: String(params.page_size),
        order_by: orderByParam
    });

    const [res, countRes] = await Promise.all([
        fetch(`/api/method/frappe.client.get_list?${query.toString()}`, { credentials: "include" }),
        fetch(`/api/method/frappe.client.get_count?doctype=Asset&filters=${encodeURIComponent(JSON.stringify(filters))}`, { credentials: "include" })
    ]);

    if (!res.ok) throw new Error("Failed to fetch assets");

    const data = await res.json();
    const countData = await countRes.json();

    return {
        data: data.message || [],
        total: countData.message || 0
    };
}

export const fetchAssets = (params: any) => fetchFrappeList(params);

export async function createAsset(data: Partial<Asset>) {
    const res = await fetch("/api/method/frappe.client.insert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ doc: { doctype: "Asset", ...data } })
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.exception || error.message || "Failed to create asset");
    }

    return (await res.json()).message;
}

export async function updateAsset(name: string, data: Partial<Asset>) {
    const res = await fetch("/api/method/frappe.client.set_value", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
            doctype: "Asset",
            name,
            fieldname: data
        })
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.exception || error.message || "Failed to update asset");
    }

    return (await res.json()).message;
}

export async function deleteAsset(name: string) {
    const res = await fetch("/api/method/frappe.client.delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ doctype: "Asset", name })
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.exception || error.message || "Failed to delete asset");
    }

    return true;
}

export async function getAsset(name: string) {
    const res = await fetch(`/api/method/frappe.client.get?doctype=Asset&name=${name}`, {
        credentials: "include"
    });

    if (!res.ok) {
        throw new Error("Failed to fetch asset details");
    }

    return (await res.json()).message;
}

export async function getAssetPermissions() {
    const res = await fetch("/api/method/company.company.frontend_api.get_doc_permissions?doctype=Asset", {
        credentials: "include"
    });

    if (!res.ok) {
        return { read: false, write: false, delete: false };
    }

    return (await res.json()).message || { read: false, write: false, delete: false };
}
