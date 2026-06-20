# Copyright (c) 2026, deepak and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class CRMEmailTemplate(Document):
	pass

@frappe.whitelist()
def get_email_template_variables(template_for):
    """
    Returns available variables for the selected Template For.
    """

    doctype_map = {
        "Lead": "Lead",
        "Contact": "Contacts",
        "Account": "Accounts",
    }

    doctype = doctype_map.get(template_for)

    if not doctype:
        return []

    meta = frappe.get_meta(doctype)

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
		"status"
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

    variables = []

    for df in meta.fields:
        if (
            df.fieldname
            and df.fieldname not in exclude
            and df.fieldtype not in ignore_fieldtypes
        ):
            variables.append({
                "label": df.label,
                "fieldname": df.fieldname,
                "variable": f"{{{{{df.fieldname}}}}}",
                "fieldtype": df.fieldtype,
            })

    return sorted(variables, key=lambda x: x["label"])