import { handleFrappeError } from 'src/utils/api-error-handler';

export interface JobApplicant {
    name: string;
    applicant_name: string;
    email_id: string;
    phone_number: string;
    job_title: string;
    designation: string;
    status: string;
    applicant_rating: number;
    source: string;
    cover_letter: string;
    resume_attachment: string;
    resume_link: string;
    lower_range: string;
    upper_range: string;
    currency: string;
    creation?: string;
}

export async function fetchJobApplicants(
    page: number = 1,
    page_size: number = 10,
    search: string = '',
    orderBy: string = 'creation',
    order: 'asc' | 'desc' = 'desc'
) {
    const filters: any[] = [];
    if (search) {
        filters.push(['Job Applicant', 'applicant_name', 'like', `%${search}%`]);
    }

    const orderByParam = `${orderBy} ${order}`;

    const query = new URLSearchParams({
        doctype: 'Job Applicant',
        fields: JSON.stringify(['*']),
        filters: JSON.stringify(filters),
        limit_start: String((page - 1) * page_size),
        limit_page_length: String(page_size),
        order_by: orderByParam
    });

    const [res, countRes] = await Promise.all([
        fetch(`/api/method/frappe.client.get_list?${query.toString()}`, { credentials: "include" }),
        fetch(`/api/method/frappe.client.get_count?doctype=Job Applicant&filters=${encodeURIComponent(JSON.stringify(filters))}`, { credentials: "include" })
    ]);

    if (!res.ok) throw new Error("Failed to fetch job applicants");

    const data = await res.json();
    const countData = await countRes.json();

    return {
        data: data.message || [],
        total: countData.message || 0,
    };
}

export async function getJobApplicant(name: string) {
    const res = await fetch(`/api/method/frappe.client.get?doctype=Job Applicant&name=${encodeURIComponent(name)}`, {
        credentials: "include"
    });

    if (!res.ok) {
        throw new Error("Failed to fetch job applicant details");
    }

    return (await res.json()).message;
}

export async function createJobApplicant(data: Partial<JobApplicant>) {
    const res = await fetch("/api/method/frappe.client.insert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ doc: { doctype: "Job Applicant", ...data } })
    });

    const json = await res.json();
    if (!res.ok) throw new Error(handleFrappeError(json, "Failed to create job applicant"));
    return json.message;
}

export async function updateJobApplicant(name: string, data: Partial<JobApplicant>) {
    const res = await fetch("/api/method/frappe.client.set_value", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
            doctype: "Job Applicant",
            name,
            fieldname: data
        })
    });

    const json = await res.json();
    if (!res.ok) throw new Error(handleFrappeError(json, "Failed to update job applicant"));
    return json.message;
}

export async function deleteJobApplicant(name: string) {
    const res = await fetch("/api/method/frappe.client.delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ doctype: "Job Applicant", name })
    });

    const json = await res.json();
    if (!res.ok) throw new Error(handleFrappeError(json, "Failed to delete job applicant"));
    return json.message;
}

export async function getJobApplicantPermissions() {
    const res = await fetch("/api/method/company.company.frontend_api.get_doc_permissions?doctype=Job Applicant", {
        credentials: "include"
    });

    if (!res.ok) {
        return { read: false, write: false, delete: false };
    }

    return (await res.json()).message || { read: false, write: false, delete: false };
}
