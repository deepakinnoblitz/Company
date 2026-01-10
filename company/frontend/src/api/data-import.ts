export async function uploadFile(file: File, doctype?: string, docname?: string, fieldname?: string) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("is_private", "1");
    formData.append("folder", "Home");

    if (doctype) formData.append("doctype", doctype);
    if (docname) formData.append("docname", docname);
    if (fieldname) formData.append("fieldname", fieldname);

    const res = await fetch("/api/method/upload_file", {
        method: "POST",
        credentials: "include",
        body: formData
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.exception || error.message || "Failed to upload file");
    }

    return (await res.json()).message;
}

export async function createDataImport(data: any) {
    const res = await fetch("/api/method/frappe.client.insert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
            doc: {
                doctype: "Data Import",
                ...data
            }
        })
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.exception || error.message || "Failed to create data import");
    }

    return (await res.json()).message;
}

export async function startDataImport(name: string) {
    const res = await fetch("/api/method/frappe.core.doctype.data_import.data_import.form_start_import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
            data_import: name
        })
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.exception || error.message || "Failed to start data import");
    }

    return (await res.json()).message;
}

export async function getImportStatus(name: string) {
    const res = await fetch(`/api/method/frappe.core.doctype.data_import.data_import.get_import_status?data_import_name=${name}`, {
        credentials: "include"
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.exception || error.message || "Failed to get import status");
    }

    return (await res.json()).message;
}

export async function getImportPreview(name: string) {
    const res = await fetch(`/api/method/frappe.core.doctype.data_import.data_import.get_preview_from_template?data_import=${name}`, {
        credentials: "include"
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.exception || error.message || "Failed to get import preview");
    }

    return (await res.json()).message;
}

export async function getImportLogs(name: string) {
    const res = await fetch(`/api/method/frappe.core.doctype.data_import.data_import.get_import_logs?data_import=${name}`, {
        credentials: "include"
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.exception || error.message || "Failed to get import logs");
    }

    return (await res.json()).message;
}

export async function updateDataImport(name: string, data: any) {
    const res = await fetch("/api/method/frappe.client.set_value", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
            doctype: "Data Import",
            name,
            fieldname: data
        })
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.exception || error.message || "Failed to update data import");
    }

    return (await res.json()).message;
}

export async function getDocFields(doctype: string) {
    const res = await fetch(`/api/method/company.company.frontend_api.get_doc_fields?doctype=${doctype}`, {
        credentials: "include"
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.exception || error.message || `Failed to fetch ${doctype} fields`);
    }

    return (await res.json()).message;
}

export function getTemplateUrl(doctype: string) {
    return `/api/method/company.company.frontend_api.download_import_template?doctype=${doctype}`;
}

export async function updateImportFile(name: string, data: any[][]) {
    const res = await fetch(`/api/method/company.company.frontend_api.update_import_file`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            data_import_name: name,
            data: JSON.stringify(data)
        }),
        credentials: "include"
    });

    return (await res.json()).message;
}
