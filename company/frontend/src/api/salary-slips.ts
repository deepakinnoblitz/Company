export interface SalarySlip {
    name: string;
    employee: string;
    employee_name: string;
    department?: string;
    designation?: string;
    pay_period_start: string;
    pay_period_end: string;
    gross_pay: number;
    net_pay: number;
    grand_net_pay: number;
    total_deduction: number;
    basic_pay?: number;
    hra?: number;
    conveyance_allowances?: number;
    medical_allowances?: number;
    other_allowances?: number;
    pf?: number;
    professional_tax?: number;
    health_insurance?: number;
    loan_recovery?: number;
    lop?: number;
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
        filters.push(['Salary Slip', 'employee_name', 'like', `%${params.search}%`]);
    }

    const orderByParam = params.orderBy && params.order ? `${params.orderBy} ${params.order}` : "pay_period_start desc";

    const query = new URLSearchParams({
        doctype: 'Salary Slip',
        fields: JSON.stringify(["*"]),
        filters: JSON.stringify(filters),
        limit_start: String((params.page - 1) * params.page_size),
        limit_page_length: String(params.page_size),
        order_by: orderByParam
    });

    const [res, countRes] = await Promise.all([
        fetch(`/api/method/frappe.client.get_list?${query.toString()}`, { credentials: "include" }),
        fetch(`/api/method/frappe.client.get_count?doctype=Salary Slip&filters=${encodeURIComponent(JSON.stringify(filters))}`, { credentials: "include" })
    ]);

    if (!res.ok) throw new Error("Failed to fetch salary slips");

    const data = await res.json();
    const countData = await countRes.json();

    return {
        data: data.message || [],
        total: countData.message || 0
    };
}

export const fetchSalarySlips = (params: any) => fetchFrappeList(params);

export async function getSalarySlip(name: string) {
    const res = await fetch(`/api/method/frappe.client.get?doctype=Salary Slip&name=${encodeURIComponent(name)}`, {
        credentials: "include"
    });

    if (!res.ok) {
        throw new Error("Failed to fetch salary slip details");
    }

    return (await res.json()).message;
}

export async function getSalarySlipPermissions() {
    const res = await fetch("/api/method/company.company.frontend_api.get_doc_permissions?doctype=Salary Slip", {
        credentials: "include"
    });

    if (!res.ok) {
        return { read: false, write: false, delete: false };
    }

    return (await res.json()).message || { read: false, write: false, delete: false };
}

export function getSalarySlipDownloadUrl(name: string) {
    return `/api/method/frappe.utils.print_format.download_pdf?doctype=Salary%20Slip&name=${encodeURIComponent(name)}`;
}
