import { handleResponse } from './utils';

export interface Call {
    name: string;
    title: string;
    call_for: string;
    lead_name?: string;
    call_start_time: string;
    call_end_time?: string;
    outgoing_call_status: string;
    call_purpose?: string;
    call_agenda?: string;
    color?: string;
}

export async function fetchCalls(start?: string, end?: string): Promise<Call[]> {
    const filters: any[] = [];
    if (start && end) {
        filters.push(["Calls", "call_start_time", "between", [start, end]]);
    }

    const query = new URLSearchParams({
        doctype: "Calls",
        fields: JSON.stringify([
            "name",
            "title",
            "call_for",
            "lead_name",
            "call_start_time",
            "call_end_time",
            "outgoing_call_status",
            "call_purpose",
            "call_agenda",
            "color"
        ]),
        filters: JSON.stringify(filters),
        limit_page_length: "1000",
        order_by: "call_start_time asc"
    });

    const res = await fetch(
        `/api/method/frappe.client.get_list?${query.toString()}`,
        { credentials: 'include' }
    );

    const data = await handleResponse(res);
    return data.message;
}

export async function createCall(data: Partial<Call>): Promise<void> {
    const res = await fetch(
        `/api/method/frappe.client.insert`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                doc: {
                    doctype: "Calls",
                    ...data
                }
            }),
            credentials: 'include'
        }
    );

    await handleResponse(res);
}

export async function updateCall(name: string, data: Partial<Call>): Promise<void> {
    const res = await fetch(
        `/api/method/frappe.client.set_value`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                doctype: "Calls",
                name,
                fieldname: data
            }),
            credentials: 'include'
        }
    );

    await handleResponse(res);
}

export async function deleteCall(name: string): Promise<void> {
    const res = await fetch(
        `/api/method/frappe.client.delete`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                doctype: "Calls",
                name
            }),
            credentials: 'include'
        }
    );

    await handleResponse(res);
}

export async function getCallPermissions() {
    const res = await fetch("/api/method/company.company.frontend_api.get_doc_permissions?doctype=Calls", {
        credentials: "include"
    });

    if (!res.ok) {
        return { read: false, write: false, delete: false };
    }

    const data = await res.json();
    return data.message || { read: false, write: false, delete: false };
}

export async function getCall(name: string) {
    const res = await fetch(`/api/method/frappe.client.get?doctype=Calls&name=${name}`, {
        credentials: "include"
    });

    if (!res.ok) {
        throw new Error("Failed to fetch call details");
    }

    return (await res.json()).message;
}
