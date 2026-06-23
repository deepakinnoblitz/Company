# Copyright (c) 2026, Deepak and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class CRMWhatsAppTemplate(Document):
    pass


@frappe.whitelist()
def get_whatsapp_template_variables(used_for):
    """
    Returns template variables.
    Shows normal fields.
    Expands only selected linked doctypes.
    """

    doctype_map = {
        "Lead": "Lead",
        "Contacts": "Contacts",
        "Accounts": "Accounts",
        "Deal": "Deal",
        "Proposal": "Proposal",
        "Invoice": "Invoice",
        "Estimation": "Estimation",
    }

    doctype = doctype_map.get(used_for)

    if not doctype:
        return []

    exclude = {
        "name",
        "owner",
        "creation",
        "modified",
        "modified_by",
        "docstatus",
        "idx",
        "_user_tags",
        "_comments",
        "_assign",
        "_liked_by",
        "amended_from",
        "parent",
        "parentfield",
        "parenttype",
        "activity_score",
        "converted_account",
        "converted_contact",
        "converted_deal",
        "interest_level",
        "sales_pipeline",
        "lead_score",
        "date_and_time",
        "status",
    }

    ignore_fieldtypes = {
        "Section Break",
        "Column Break",
        "Tab Break",
        "Button",
        "HTML",
        "Table",
        "Table MultiSelect",
        "Image",
        "Attach",
        "Attach Image",
        "Fold",
        "Heading",
    }

    # Only expand these doctypes
    allowed_link_doctypes = {
        "Lead",
        "Contacts",
        "Accounts",
        "Deal",
        "Proposal",
        "Invoice",
        "Estimation",
    }

    variables = []
    visited = set()

    meta = frappe.get_meta(doctype)

    for df in meta.fields:

        if (
            not df.fieldname
            or df.fieldname in exclude
            or df.fieldtype in ignore_fieldtypes
			or df.hidden
        ):
            continue

        # Normal field
        if df.fieldname not in visited:

            visited.add(df.fieldname)

            variables.append({
                "label": df.label,
                "fieldname": df.fieldname,
                "variable": f"{{{{{df.fieldname}}}}}",
                "fieldtype": df.fieldtype,
            })

        # Expand only business link doctypes
        if (
            df.fieldtype == "Link"
            and df.options
            and df.options in allowed_link_doctypes
        ):

            try:

                link_meta = frappe.get_meta(df.options)

                for link_df in link_meta.fields:

                    if (
                        not link_df.fieldname
                        or link_df.fieldname in exclude
                        or link_df.fieldtype in ignore_fieldtypes
						or link_df.hidden
                    ):
                        continue

                    variable = f"{df.fieldname}.{link_df.fieldname}"

                    if variable in visited:
                        continue

                    visited.add(variable)

                    variables.append({
                        "label": f"{df.label} → {link_df.label}",
                        "fieldname": variable,
                        "variable": f"{{{{{variable}}}}}",
                        "fieldtype": link_df.fieldtype,
                    })

            except Exception:
                pass

    return sorted(
        variables,
        key=lambda x: x["label"].lower()
    )