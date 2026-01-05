export interface Meeting {
    name: string;
    title: string;
    meet_for: string;
    lead_name?: string;
    from: string;
    to?: string;
    outgoing_call_status: string;
    meeting_venue?: string;
    location?: string;
    completed_meet_notes?: string;
}

import { handleResponse } from './utils';

export async function fetchMeetings(start?: string, end?: string): Promise<Meeting[]> {
    const filters: any[] = [];
    if (start && end) {
        filters.push(["Meeting", "from", "between", [start, end]]);
    }

    const query = new URLSearchParams({
        doctype: "Meeting",
        fields: JSON.stringify([
            "name",
            "title",
            "meet_for",
            "lead_name",
            "from",
            "to",
            "outgoing_call_status",
            "meeting_venue",
            "location",
            "completed_meet_notes"
        ]),
        filters: JSON.stringify(filters),
        limit_page_length: "1000",
        order_by: "`from` asc"
    });

    const res = await fetch(
        `/api/method/frappe.client.get_list?${query.toString()}`,
        { credentials: 'include' }
    );

    const data = await handleResponse(res);
    return data.message;
}

export async function createMeeting(data: Partial<Meeting>): Promise<void> {
    const res = await fetch(
        `/api/method/frappe.client.insert`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                doc: {
                    doctype: "Meeting",
                    ...data
                }
            }),
            credentials: 'include'
        }
    );

    await handleResponse(res);
}

export async function updateMeeting(name: string, data: Partial<Meeting>): Promise<void> {
    const res = await fetch(
        `/api/method/frappe.client.set_value`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                doctype: "Meeting",
                name,
                fieldname: data
            }),
            credentials: 'include'
        }
    );

    await handleResponse(res);
}

export async function deleteMeeting(name: string): Promise<void> {
    const res = await fetch(
        `/api/method/frappe.client.delete`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                doctype: "Meeting",
                name
            }),
            credentials: 'include'
        }
    );

    await handleResponse(res);
}

export async function getMeetingPermissions() {
    const res = await fetch("/api/method/company.company.frontend_api.get_doc_permissions?doctype=Meeting", {
        credentials: "include"
    });

    if (!res.ok) {
        return { read: false, write: false, delete: false };
    }

    const data = await res.json();
    return data.message || { read: false, write: false, delete: false };
}

export async function getMeeting(name: string) {
    const res = await fetch(`/api/method/frappe.client.get?doctype=Meeting&name=${name}`, {
        credentials: "include"
    });

    if (!res.ok) {
        throw new Error("Failed to fetch meeting details");
    }

    return (await res.json()).message;
}
