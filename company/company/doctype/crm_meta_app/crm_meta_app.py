# -*- coding: utf-8 -*-
# Copyright (c) 2026, deepak and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

class CRMMetaApp(Document):
    def onload(self):
        self.webhook_url = frappe.utils.get_url("/api/method/company.company.crm_meta_api.webhook")
        
    def validate(self):
        self.webhook_url = frappe.utils.get_url("/api/method/company.company.crm_meta_api.webhook")
        
        # Enforce single default app rule
        if self.is_default:
            # Unset is_default on other active apps
            frappe.db.sql("""
                UPDATE `tabCRM Meta App`
                SET is_default = 0
                WHERE name != %s AND is_default = 1
            """, (self.name,))

@frappe.whitelist()
def get_mandatory_lead_fields():
    """Returns a list of mandatory fieldnames and labels from the Lead DocType."""
    lead_meta = frappe.get_meta("Lead")
    mandatory_fields = []
    
    # Identify non-optional, writable fields
    for field in lead_meta.fields:
        if field.reqd and not field.read_only and field.fieldname not in ("naming_series",):
            mandatory_fields.append({
                "fieldname": field.fieldname,
                "label": field.label
            })
            
    return mandatory_fields

@frappe.whitelist()
def get_lead_fields():
    """Returns a list of writable, non-hidden, non-child-table fields from the Lead DocType."""
    lead_meta = frappe.get_meta("Lead")
    valid_fields = []
    
    for field in lead_meta.fields:
        if not field.read_only and not field.hidden and field.fieldtype not in ("Table", "HTML", "Section Break", "Column Break", "Button", "Tab Break"):
            # Exclude special/unneeded fields by name if necessary
            if field.fieldname != "sales_pipeline":
                valid_fields.append({
                    "fieldname": field.fieldname,
                    "label": field.label
                })
                
    return valid_fields
