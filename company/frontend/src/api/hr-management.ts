import { handleFrappeError } from 'src/utils/api-error-handler';

export interface Employee {
    // ... rest of the file
    name: string;
    employee_id: string;
    employee_name: string;
    email: string;
    phone?: string;
    department?: string;
    designation?: string;
    status: 'Active' | 'Inactive';
    date_of_joining?: string;
    personal_email?: string;
    dob?: string;
}

export interface Attendance {
    name: string;
    employee: string;
    employee_name: string;
    attendance_date: string;
    status: 'Present' | 'Absent' | 'On Leave' | 'Holiday' | 'Half Day' | 'Missing';
    in_time?: string;
    out_time?: string;
    leave_type?: string;
}

export interface LeaveApplication {
    name: string;
    employee: string;
    employee_name: string;
    leave_type: string;
    from_date: string;
    to_date: string;
    total_days: number;
    reson: string;
    workflow_state?: string;
}

// Generic fetch function for Frappe list
async function fetchFrappeList(doctype: string, params: {
    page: number;
    page_size: number;
    search?: string;
    searchField?: string;
    filters?: any[];
    orderBy?: string;
    order?: 'asc' | 'desc';
}) {
    const filters: any[] = params.filters || [];

    if (params.search && params.searchField) {
        filters.push([doctype, params.searchField, "like", `%${params.search}%`]);
    }

    const orderByParam = params.orderBy && params.order ? `${params.orderBy} ${params.order}` : "creation desc";

    const query = new URLSearchParams({
        doctype,
        fields: JSON.stringify(["*"]),
        filters: JSON.stringify(filters),
        limit_start: String((params.page - 1) * params.page_size),
        limit_page_length: String(params.page_size),
        order_by: orderByParam
    });

    // Fetch data and count in parallel
    const [res, countRes] = await Promise.all([
        fetch(`/api/method/frappe.client.get_list?${query.toString()}`, { credentials: "include" }),
        fetch(`/api/method/frappe.client.get_count?doctype=${doctype}&filters=${encodeURIComponent(JSON.stringify(filters))}`, { credentials: "include" })
    ]);

    if (!res.ok) throw new Error(`Failed to fetch ${doctype}`);
    const data = await res.json();
    const countData = await countRes.json();

    return {
        data: data.message || [],
        total: countData.message || 0
    };
}

// Employee APIs
export const fetchEmployees = (params: any) => fetchFrappeList("Employee", { ...params, searchField: "employee_name" });

export async function createEmployee(data: Partial<Employee>) {
    const res = await fetch("/api/method/frappe.client.insert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ doc: { doctype: "Employee", ...data } })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(handleFrappeError(json, "Failed to create employee"));
    return json.message;
}

export async function updateEmployee(name: string, data: Partial<Employee>) {
    const res = await fetch("/api/method/frappe.client.set_value", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ doctype: "Employee", name, fieldname: data })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(handleFrappeError(json, "Failed to update employee"));
    return json.message;
}

export async function deleteEmployee(name: string) {
    const res = await fetch("/api/method/frappe.client.delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ doctype: "Employee", name })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(handleFrappeError(json, "Failed to delete employee"));
    return true;
}

// Attendance APIs
export const fetchAttendance = (params: any) => fetchFrappeList("Attendance", { ...params, searchField: "employee_name" });

export async function createAttendance(data: Partial<Attendance>) {
    const res = await fetch("/api/method/frappe.client.insert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ doc: { doctype: "Attendance", ...data } })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(handleFrappeError(json, "Failed to create attendance record"));
    return json.message;
}

export async function updateAttendance(name: string, data: Partial<Attendance>) {
    const res = await fetch("/api/method/frappe.client.set_value", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ doctype: "Attendance", name, fieldname: data })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(handleFrappeError(json, "Failed to update attendance record"));
    return json.message;
}

export async function deleteAttendance(name: string) {
    const res = await fetch("/api/method/frappe.client.delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ doctype: "Attendance", name })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(handleFrappeError(json, "Failed to delete attendance record"));
    return true;
}

// Leave Application APIs
export const fetchLeaveApplications = (params: any) => fetchFrappeList("Leave Application", { ...params, searchField: "employee_name" });

export async function createLeaveApplication(data: Partial<LeaveApplication>) {
    const res = await fetch("/api/method/frappe.client.insert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ doc: { doctype: "Leave Application", ...data } })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(handleFrappeError(json, "Failed to create leave application"));
    return json.message;
}

export async function updateLeaveApplication(name: string, data: Partial<LeaveApplication>) {
    const res = await fetch("/api/method/frappe.client.set_value", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ doctype: "Leave Application", name, fieldname: data })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(handleFrappeError(json, "Failed to update leave application"));
    return json.message;
}

export async function deleteLeaveApplication(name: string) {
    const res = await fetch("/api/method/frappe.client.delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ doctype: "Leave Application", name })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(handleFrappeError(json, "Failed to delete leave application"));
    return true;
}

// Generic fetch for a single document
export async function getHRDoc(doctype: string, name: string) {
    const res = await fetch(`/api/method/frappe.client.get?doctype=${doctype}&name=${name}`, {
        credentials: "include"
    });

    if (!res.ok) {
        throw new Error(`Failed to fetch ${doctype} details`);
    }

    return (await res.json()).message;
}

// DocType Metadata API
export async function getDocTypeMetadata(doctype: string) {
    const res = await fetch(`/api/method/frappe.desk.form.load.getdoctype?doctype=${doctype}`, {
        credentials: "include"
    });
    if (!res.ok) throw new Error(`Failed to fetch metadata for ${doctype}`);
    const json = await res.json();
    return json.docs?.[0] || json.message;
}

// Salary Component API
export async function fetchSalaryComponents() {
    const res = await fetch(`/api/method/frappe.client.get_list?doctype=Salary Structure Component&fields=${JSON.stringify(["component_name", "field_name", "type", "percentage", "static_amount"])}&limit_page_length=100`, {
        credentials: "include"
    });
    const json = await res.json();
    if (!res.ok) throw new Error(handleFrappeError(json, "Failed to fetch salary components"));
    return json.message || [];
}

// Generic Permission API
export async function getHRPermissions(doctype: string) {
    const res = await fetch(`/api/method/company.company.frontend_api.get_doc_permissions?doctype=${doctype}`, {
        credentials: "include"
    });
    if (!res.ok) return { read: false, write: false, delete: false };
    const json = await res.json();
    return json.message || { read: false, write: false, delete: false };
}

