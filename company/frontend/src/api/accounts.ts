export interface Account {
    name: string;
    account_name: string;
    phone_number?: string;
    website?: string;
    account_owner?: string;
    gstin?: string;
    country?: string;
    state?: string;
    city?: string;
}

export async function fetchAccounts(params: {
    page: number;
    page_size: number;
    search?: string;
}) {
    const filters: any[] = params.search ? [
        [
            ["Accounts", "account_name", "like", `%${params.search}%`],
            ["or", ["Accounts", "account_owner", "like", `%${params.search}%`]]
        ]
    ] : [];

    const query = new URLSearchParams({
        doctype: "Accounts",
        fields: JSON.stringify([
            "name",
            "account_name",
            "phone_number",
            "website",
            "account_owner",
            "gstin",
            "country",
            "state",
            "city",
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

export async function createAccount(data: Partial<Account>) {
    const res = await fetch("/api/method/frappe.client.insert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
            doc: {
                doctype: "Accounts",
                ...data
            }
        })
    });

    return (await res.json()).message;
}

export async function updateAccount(name: string, data: Partial<Account>) {
    const res = await fetch("/api/method/frappe.client.set_value", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
            doctype: "Accounts",
            name,
            fieldname: data
        })
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.exception || error.message || "Failed to update account");
    }

    return (await res.json()).message;
}

export async function deleteAccount(name: string) {
    const res = await fetch("/api/method/frappe.client.delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
            doctype: "Accounts",
            name
        })
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.exception || error.message || "Failed to delete account");
    }

    return (await res.json()).message;
}

export async function getAccountPermissions() {
    const res = await fetch("/api/method/company.company.frontend_api.get_doc_permissions?doctype=Accounts", {
        credentials: "include"
    });

    if (!res.ok) {
        return { read: false, write: false, delete: false };
    }

    return (await res.json()).message || { read: false, write: false, delete: false };
}


export async function getAccount(name: string) {
    const res = await fetch(`/api/method/frappe.client.get?doctype=Accounts&name=${name}`, {
        credentials: "include"
    });

    if (!res.ok) {
        throw new Error("Failed to fetch account details");
    }

    return (await res.json()).message;
}
