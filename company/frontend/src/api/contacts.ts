export interface Contact {
    name: string;
    first_name: string;
    company_name?: string;
    email?: string;
    phone?: string;
    designation?: string;
    source_lead?: string;
    address?: string;
    notes?: string;
    country?: string;
    state?: string;
    city?: string;
    customer_type?: string;
}

export async function fetchContacts(params: {
    page: number;
    page_size: number;
    search?: string;
}) {
    const filters: any[] = params.search ? [
        [
            ["Contacts", "first_name", "like", `%${params.search}%`],
            ["or", ["Contacts", "email", "like", `%${params.search}%`]]
        ]
    ] : [];

    const query = new URLSearchParams({
        doctype: "Contacts",
        fields: JSON.stringify([
            "name",
            "first_name",
            "company_name",
            "email",
            "phone",
            "designation",
            "source_lead",
            "address",
            "notes",
            "country",
            "state",
            "city",
            "customer_type",
            "owner",
            "creation"
        ]),
        filters: JSON.stringify(filters),
        limit_start: String((params.page - 1) * params.page_size),
        limit_page_length: String(params.page_size),
        order_by: "creation desc"
    });

    const res = await fetch(
        `/api/method/frappe.client.get_list?${query.toString()}`,
        { credentials: "include" }
    );

    return (await res.json()).message;
}

export async function createContact(data: Partial<Contact>) {
    const res = await fetch("/api/method/frappe.client.insert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
            doc: {
                doctype: "Contacts",
                ...data
            }
        })
    });

    return (await res.json()).message;
}

export async function updateContact(name: string, data: Partial<Contact>) {
    const res = await fetch("/api/method/frappe.client.set_value", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
            doctype: "Contacts",
            name,
            fieldname: data
        })
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.exception || error.message || "Failed to update contact");
    }

    return (await res.json()).message;
}

export async function deleteContact(name: string) {
    const res = await fetch("/api/method/frappe.client.delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
            doctype: "Contacts",
            name
        })
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.exception || error.message || "Failed to delete contact");
    }

    return (await res.json()).message;
}

export async function getContactPermissions() {
    const res = await fetch("/api/method/company.company.frontend_api.get_doc_permissions?doctype=Contacts", {
        credentials: "include"
    });

    // We might need to genericize get_lead_permissions to get_doc_permissions in the backend
    // Or just use get_lead_permissions if it's already generic enough or create a new one.
    // For now assuming get_lead_permissions was specifically for Lead.

    if (!res.ok) {
        return { read: false, write: false, delete: false };
    }

    return (await res.json()).message || { read: false, write: false, delete: false };
}

export async function getContact(name: string) {
    const res = await fetch(`/api/method/frappe.client.get?doctype=Contacts&name=${name}`, {
        credentials: "include"
    });

    if (!res.ok) {
        throw new Error("Failed to fetch contact details");
    }

    return (await res.json()).message;
}
