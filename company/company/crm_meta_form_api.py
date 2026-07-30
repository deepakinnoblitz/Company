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
    Auto-populates field_mappings child table with default heuristics (full_name -> lead_name, email -> email, phone -> phone_number).
    """
    if not page_name:
        page_name = frappe.db.get_value("CRM Meta Page", {"is_connected": 1, "is_active": 1}, "name")

    if not page_name:
        frappe.throw("No active/connected Facebook Page selected. Please connect a Page first.")

    page_doc = frappe.get_doc("CRM Meta Page", page_name)
    page_token = page_doc.get_token()

    if not page_token:
        frappe.throw(f"Page Access Token is missing for Facebook Page '{page_doc.page_name}'. Please reconnect Facebook.")

    app_doc = frappe.get_doc("CRM Meta App", page_doc.meta_app)
    graph_version = app_doc.graph_api_version or "v23.0"

    # Query Graph API /v23.0/{page_id}/leadgen_forms
    url = f"https://graph.facebook.com/{graph_version}/{page_doc.page_id}/leadgen_forms"
    params = {
        "fields": "id,name,status,questions,locale,created_time",
        "limit": 100
    }
    headers = {"Authorization": f"Bearer {page_token}"}

    res = requests.get(url, headers=headers, params=params, timeout=15)
    if res.status_code != 200:
        frappe.throw(f"Failed to fetch Meta Lead Forms: {res.json().get('error', {}).get('message', res.text)}")

    forms_data = res.json().get("data", [])
    synced_forms = []

    for form_item in forms_data:
        form_id = str(form_item.get("id"))
        form_name = form_item.get("name")
        status = form_item.get("status", "ACTIVE")
        locale = form_item.get("locale")
        questions = form_item.get("questions", [])

        # Check existing CRM Meta Form
        existing_name = frappe.db.get_value("CRM Meta Form", {"form_id": form_id}, "name")

        if existing_name:
            form_doc = frappe.get_doc("CRM Meta Form", existing_name)
        else:
            form_doc = frappe.new_doc("CRM Meta Form")
            form_doc.form_id = form_id
            form_doc.meta_page = page_doc.name
            form_doc.is_active = 1

        form_doc.form_name = form_name
        form_doc.meta_page = page_doc.name
        form_doc.form_status = status
        form_doc.locale = locale
        form_doc.questions_json = json.dumps(questions, indent=2)

        # Auto-populate field_mappings if child table is empty
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
            "questions_count": len(questions),
            "is_active": form_doc.is_active
        })

    frappe.db.commit()

    return {
        "page_name": page_doc.page_name,
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
