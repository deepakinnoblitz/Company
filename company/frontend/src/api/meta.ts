export interface DocField {
    fieldname: string;
    label: string;
    fieldtype: string;
    options?: string;
    hidden?: number;
}

export interface DocTypeMeta {
    name: string;
    fields: DocField[];
}

export async function getDoctypeMeta(doctype: string): Promise<DocTypeMeta> {
    const res = await fetch(`/api/method/company.company.frontend_api.get_doctype_fields?doctype=${doctype}`, {
        credentials: "include"
    });

    if (!res.ok) {
        throw new Error(`Failed to fetch doctype meta: ${res.status} ${res.statusText}`);
    }

    const json = await res.json();
    console.log('getDoctypeMeta raw response:', json);
    const doc = json.message;
    console.log('getDoctypeMeta raw doc:', doc);

    return {
        name: doc.name,
        fields: doc.fields
    };
}
