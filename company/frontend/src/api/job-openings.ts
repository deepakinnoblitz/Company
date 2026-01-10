export interface JobOpening {
    name: string;
    job_title: string;
    designation: string;
    shift: string;
    location: string;
    experience: string;
    posted_on?: string;
    closes_on?: string;
    status: 'Open' | 'Closed';
    description?: string;
    small_description?: string;
    skills_required?: string;
    currency?: string;
    salary_per?: 'Month' | 'Year';
    lower_range?: number;
    upper_range?: number;
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
        filters.push(['Job Opening', 'job_title', 'like', `%${params.search}%`]);
    }

    const orderByParam = params.orderBy && params.order ? `${params.orderBy} ${params.order}` : "posted_on desc";

    const query = new URLSearchParams({
        doctype: 'Job Opening',
        fields: JSON.stringify(["*"]),
        filters: JSON.stringify(filters),
        limit_start: String((params.page - 1) * params.page_size),
        limit_page_length: String(params.page_size),
        order_by: orderByParam
    });

    const [res, countRes] = await Promise.all([
        fetch(`/api/method/frappe.client.get_list?${query.toString()}`, { credentials: "include" }),
        fetch(`/api/method/frappe.client.get_count?doctype=Job Opening&filters=${encodeURIComponent(JSON.stringify(filters))}`, { credentials: "include" })
    ]);

    if (!res.ok) throw new Error("Failed to fetch job openings");

    const data = await res.json();
    const countData = await countRes.json();

    return {
        data: data.message || [],
        total: countData.message || 0
    };
}

export const fetchJobOpenings = (params: any) => fetchFrappeList(params);

export async function createJobOpening(data: Partial<JobOpening>) {
    const res = await fetch("/api/method/frappe.client.insert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ doc: { doctype: "Job Opening", ...data } })
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.exception || error.message || "Failed to create job opening");
    }

    return (await res.json()).message;
}

export async function updateJobOpening(name: string, data: Partial<JobOpening>) {
    const res = await fetch("/api/method/frappe.client.set_value", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
            doctype: "Job Opening",
            name,
            fieldname: data
        })
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.exception || error.message || "Failed to update job opening");
    }

    return (await res.json()).message;
}

export async function deleteJobOpening(name: string) {
    const res = await fetch("/api/method/frappe.client.delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ doctype: "Job Opening", name })
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.exception || error.message || "Failed to delete job opening");
    }

    return true;
}

export async function getJobOpening(name: string) {
    const res = await fetch(`/api/method/frappe.client.get?doctype=Job Opening&name=${encodeURIComponent(name)}`, {
        credentials: "include"
    });

    if (!res.ok) {
        throw new Error("Failed to fetch job opening details");
    }

    return (await res.json()).message;
}

export async function getJobOpeningPermissions() {
    const res = await fetch("/api/method/company.company.frontend_api.get_doc_permissions?doctype=Job Opening", {
        credentials: "include"
    });

    if (!res.ok) {
        return { read: false, write: false, delete: false };
    }

    return (await res.json()).message || { read: false, write: false, delete: false };
}
