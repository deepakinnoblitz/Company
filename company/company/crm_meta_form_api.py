# -*- coding: utf-8 -*-
# Copyright (c) 2026, deepak and contributors
# For license information, please see license.txt

import frappe
import json
import requests
from frappe.model.document import Document

class CRMMetaForm(Document):
    pass


@frappe.whitelist()
def fetch_meta_forms_from_graph_api(page_name=None):
    """
    Fetches Meta Lead Ads Instant Forms belonging to a CRM Meta Page from Graph API v23.0.
    Matches fetched forms against existing DB records or creates new CRM Meta Form records.
    """
    frappe.log_error(f"DEBUG: fetch_meta_forms_from_graph_api called with page_name='{page_name}'", "Meta Form Debug")
    
    if not page_name:
        page_name = frappe.db.get_value("CRM Meta Page", {"is_connected": 1, "is_active": 1}, "name")
        if not page_name:
            page_name = frappe.db.get_value("CRM Meta Page", {}, "name")

    if not page_name:
        frappe.log_error("DEBUG: No page_name provided and no CRM Meta Page found in DB.", "Meta Form Debug")
        return {"page": None, "total_forms": 0, "forms": []}

    page_doc = frappe.get_doc("CRM Meta Page", page_name)
    frappe.log_error(f"DEBUG: Selected page_doc name='{page_doc.name}', page_id='{page_doc.page_id}', is_connected={page_doc.is_connected}, is_active={page_doc.is_active}", "Meta Form Debug")
    
    if not page_doc.is_connected or not page_doc.is_active:
        frappe.log_error(f"DEBUG: Page '{page_doc.name}' is not connected or active. Skipping Graph API query.", "Meta Form Debug")
        return {"page": page_doc.name, "total_forms": 0, "forms": []}

    page_token = page_doc.get_token()
    token_source = "page_access_token"

    if not page_token and page_doc.meta_account:
        try:
            acc_doc = frappe.get_doc("CRM Meta Account", page_doc.meta_account)
            page_token = acc_doc.get_token()
            token_source = "account_user_token"
        except Exception:
            pass

    frappe.log_error(f"DEBUG: Resolved page_token present={bool(page_token)}, source='{token_source}'", "Meta Form Debug")

    if not page_token:
        db_forms = frappe.get_all(
            "CRM Meta Form",
            filters={"meta_page": page_doc.name},
            fields=["name", "form_id", "form_name", "form_status", "is_active"]
        )
        for f in db_forms:
            f["questions_count"] = 4
            f["form_status"] = f.get("form_status") or "ACTIVE"
        frappe.log_error(f"DEBUG: No page token found on page '{page_doc.name}'. Returning {len(db_forms)} DB forms.", "Meta Form Debug")
        return {"page": page_doc.name, "total_forms": len(db_forms), "forms": db_forms}

    app_doc = frappe.get_doc("CRM Meta App", page_doc.meta_app)
    graph_version = app_doc.graph_api_version or "v23.0"

    # Query Graph API /v23.0/{page_id}/leadgen_forms using Access Token
    url = f"https://graph.facebook.com/{graph_version}/{page_doc.page_id}/leadgen_forms"
    params = {
        "fields": "id,name,status,questions,locale,created_time",
        "access_token": page_token,
        "limit": 100
    }

    res = requests.get(url, params=params, timeout=15)
    frappe.log_error(f"DEBUG: Graph API response status={res.status_code}, body={res.text[:500]}", "Meta Form Debug")

    if res.status_code != 200:
        err_json = res.json().get("error", {})
        err_code = err_json.get("code")
        if err_code == 190 or "Page Access Token" in err_json.get("message", ""):
            db_forms = frappe.get_all(
                "CRM Meta Form",
                filters={"meta_page": page_doc.name},
                fields=["name", "form_id", "form_name", "form_status", "is_active"]
            )
            for f in db_forms:
                f["questions_count"] = 4
                f["form_status"] = f.get("form_status") or "ACTIVE"
            return {"page": page_doc.name, "total_forms": len(db_forms), "forms": db_forms}

        frappe.log_error(f"Failed to fetch Meta Lead Forms for page {page_doc.name}: {res.text}", "Meta Form Fetch Error")
        frappe.throw(f"Failed to fetch Meta Lead Forms: {err_json.get('message', res.text)}")

    forms_data = res.json().get("data", [])
    synced_forms = []

    if not forms_data:
        db_forms = frappe.get_all(
            "CRM Meta Form",
            filters={"meta_page": page_doc.name},
            fields=["name", "form_id", "form_name", "form_status", "is_active"]
        )
        return {
            "page": page_doc.name,
            "total_forms": len(db_forms),
            "forms": db_forms
        }

    fetched_form_ids = set()

    for form_item in forms_data:
        form_id = str(form_item.get("id"))
        form_name = form_item.get("name")
        status = form_item.get("status", "ACTIVE")
        locale = form_item.get("locale")
        questions = form_item.get("questions", [])
        fetched_form_ids.add(form_id)

        # Check existing CRM Meta Form by form_id (stable unique identifier)
        existing_name = frappe.db.get_value("CRM Meta Form", {"form_id": form_id}, "name")

        if existing_name:
            form_doc = frappe.get_doc("CRM Meta Form", existing_name)
        else:
            form_doc = frappe.new_doc("CRM Meta Form")
            form_doc.form_id = form_id

        form_doc.form_name = form_name
        form_doc.meta_page = page_doc.name
        form_doc.form_status = status
        form_doc.locale = locale
        form_doc.questions_json = json.dumps(questions, indent=2)
        form_doc.is_active = 1

        # Preserve existing CRM configuration (field mappings & duplicate rules)
        if not form_doc.field_mappings:
            for q in questions:
                key = q.get("key", "").strip()
                q_type = q.get("type", "").upper()

                if not key:
                    continue

                crm_fld = None
                transform = "None"

                if key in ("full_name", "first_name", "last_name", "name") or "FULL_NAME" in q_type or "FIRST_NAME" in q_type:
                    crm_fld = "lead_name"
                    transform = "Title Case"
                elif key in ("email", "e-mail") or "EMAIL" in q_type:
                    crm_fld = "email"
                    transform = "Lower Case"
                elif key in ("phone", "phone_number") or "PHONE" in q_type:
                    crm_fld = "phone_number"
                    transform = "Clean Phone"
                elif key in ("company_name", "company") or "COMPANY_NAME" in q_type:
                    crm_fld = "company_name"

                if crm_fld:
                    form_doc.append("field_mappings", {
                        "meta_field": key,
                        "crm_field": crm_fld,
                        "required": 0,
                        "transform_function": transform
                    })

        form_doc.save(ignore_permissions=True)
        synced_forms.append({
            "name": form_doc.name,
            "form_id": form_doc.form_id,
            "form_name": form_doc.form_name,
            "form_status": form_doc.form_status,
            "is_active": form_doc.is_active,
            "questions_count": len(questions)
        })

    # Deactivate existing Forms under this Page no longer returned by Meta Graph API
    page_forms = frappe.get_all("CRM Meta Form", filters={"meta_page": page_doc.name}, fields=["name", "form_id"])
    for existing_f in page_forms:
        if existing_f["form_id"] not in fetched_form_ids:
            frappe.db.set_value("CRM Meta Form", existing_f["name"], "is_active", 0)

    frappe.db.commit()

    return {
        "page": page_doc.name,
        "total_forms": len(synced_forms),
        "forms": synced_forms
    }


@frappe.whitelist()
def toggle_meta_form_connection(form_name, is_active):
    """
    Enable or disable lead sync ingestion for a specific CRM Meta Form.
    """
    if not frappe.db.exists("CRM Meta Form", form_name):
        frappe.throw(f"Meta Form '{form_name}' not found.")

    doc = frappe.get_doc("CRM Meta Form", form_name)
    doc.is_active = 1 if int(is_active) else 0
    doc.save(ignore_permissions=True)
    frappe.db.commit()

    return {
        "name": doc.name,
        "form_name": doc.form_name,
        "is_active": doc.is_active
    }
