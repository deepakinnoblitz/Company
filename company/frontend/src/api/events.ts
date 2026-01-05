import { handleResponse } from './utils';

export interface CalendarEvent {
    name: string;
    subject: string;
    starts_on: string;
    ends_on?: string;
    event_category?: string;
    event_type?: string;
    status?: string;
    description?: string;
    color?: string;
    all_day?: number;
}

export async function fetchEvents(start?: string, end?: string): Promise<CalendarEvent[]> {
    const filters: any[] = [];
    if (start && end) {
        filters.push(["Event", "starts_on", "between", [start, end]]);
    }

    const query = new URLSearchParams({
        doctype: "Event",
        fields: JSON.stringify([
            "name",
            "subject",
            "starts_on",
            "ends_on",
            "event_category",
            "event_type",
            "status",
            "description",
            "color",
            "all_day"
        ]),
        filters: JSON.stringify(filters),
        limit_page_length: "1000",
        order_by: "starts_on asc"
    });

    const res = await fetch(
        `/api/method/frappe.client.get_list?${query.toString()}`,
        { credentials: 'include' }
    );

    const data = await handleResponse(res);
    return data.message;
}

export async function createEvent(data: Partial<CalendarEvent>): Promise<void> {
    const res = await fetch(
        `/api/method/frappe.client.insert`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                doc: {
                    doctype: "Event",
                    ...data
                }
            }),
            credentials: 'include'
        }
    );

    await handleResponse(res);
}

export async function updateEvent(name: string, data: Partial<CalendarEvent>): Promise<void> {
    const res = await fetch(
        `/api/method/frappe.client.set_value`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                doctype: "Event",
                name,
                fieldname: data
            }),
            credentials: 'include'
        }
    );

    await handleResponse(res);
}

export async function deleteEvent(name: string): Promise<void> {
    const res = await fetch(
        `/api/method/frappe.client.delete`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                doctype: "Event",
                name
            }),
            credentials: 'include'
        }
    );

    await handleResponse(res);
}

export async function getEventPermissions() {
    const res = await fetch("/api/method/company.company.frontend_api.get_doc_permissions?doctype=Event", {
        credentials: "include"
    });

    if (!res.ok) {
        return { read: false, write: false, delete: false };
    }

    const data = await res.json();
    return data.message || { read: false, write: false, delete: false };
}
