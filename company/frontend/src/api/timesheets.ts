export interface Timesheet {
    name: string;
    employee: string;
    employee_name: string;
    timesheet_date: string;
    total_hours: number;
    notes: string;
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
            ['Timesheet', 'employee_name', 'like', `%${params.search}%`]
        ]);
    }

    const orderByParam = params.orderBy && params.order ? `${params.orderBy} ${params.order}` : "timesheet_date desc";

    const query = new URLSearchParams({
        doctype: 'Timesheet',
        fields: JSON.stringify(["*"]),
        filters: JSON.stringify(filters),
        limit_start: String((params.page - 1) * params.page_size),
        limit_page_length: String(params.page_size),
        order_by: orderByParam
    });

    const [res, countRes] = await Promise.all([
        fetch(`/api/method/frappe.client.get_list?${query.toString()}`, { credentials: "include" }),
        fetch(`/api/method/frappe.client.get_count?doctype=Timesheet&filters=${encodeURIComponent(JSON.stringify(filters))}`, { credentials: "include" })
    ]);

    if (!res.ok) throw new Error("Failed to fetch timesheets");

    const data = await res.json();
    const countData = await countRes.json();

    return {
        data: data.message || [],
        total: countData.message || 0
    };
}

export const fetchTimesheets = (params: any) => fetchFrappeList(params);

export async function createTimesheet(data: Partial<Timesheet>) {
    const res = await fetch("/api/method/frappe.client.insert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ doc: { doctype: "Timesheet", ...data } })
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.exception || error.message || "Failed to create timesheet");
    }

    return (await res.json()).message;
}

export async function updateTimesheet(name: string, data: Partial<Timesheet>) {
    const res = await fetch("/api/method/frappe.client.set_value", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
            doctype: "Timesheet",
            name,
            fieldname: data
        })
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.exception || error.message || "Failed to update timesheet");
    }

    return (await res.json()).message;
}

export async function deleteTimesheet(name: string) {
    const res = await fetch("/api/method/frappe.client.delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ doctype: "Timesheet", name })
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.exception || error.message || "Failed to delete timesheet");
    }

    return true;
}

export async function getTimesheet(name: string) {
    const res = await fetch(`/api/method/frappe.client.get?doctype=Timesheet&name=${name}`, {
        credentials: "include"
    });

    if (!res.ok) {
        throw new Error("Failed to fetch timesheet details");
    }

    return (await res.json()).message;
}

export async function getTimesheetPermissions() {
    const res = await fetch("/api/method/company.company.frontend_api.get_doc_permissions?doctype=Timesheet", {
        credentials: "include"
    });

    if (!res.ok) {
        return { read: false, write: false, delete: false };
    }

    return (await res.json()).message || { read: false, write: false, delete: false };
}
