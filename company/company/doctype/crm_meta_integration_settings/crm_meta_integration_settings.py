# -*- coding: utf-8 -*-
# Copyright (c) 2026, deepak and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

class CRMMetaIntegrationSettings(Document):
    def onload(self):
        self.webhook_url = frappe.utils.get_url("/api/method/company.company.crm_meta_api.webhook")
    
    def validate(self):
        self.webhook_url = frappe.utils.get_url("/api/method/company.company.crm_meta_api.webhook")

@frappe.whitelist()
def get_mandatory_lead_fields():
    """Returns a list of mandatory fieldnames and labels from the Lead DocType."""
    lead_meta = frappe.get_meta("Lead")
    mandatory_fields = []
    
    for field in lead_meta.fields:
        if field.reqd:
            mandatory_fields.append({
                "fieldname": field.fieldname,
                "label": field.label
            })
            
    return mandatory_fields

@frappe.whitelist()
def get_lead_fields():
    """Returns a list of unhidden, writable fieldnames and labels from the Lead DocType."""
    lead_meta = frappe.get_meta("Lead")
    valid_fields = []
    
    # Exclude layout/button/heading fieldtypes that don't store data
    exclude_fieldtypes = frappe.model.no_value_fields
    
    for field in lead_meta.fields:
        if not field.hidden and not field.read_only and field.fieldtype not in exclude_fieldtypes:
            if field.fieldname not in ("sales_pipeline"):
                valid_fields.append({
                    "fieldname": field.fieldname,
                    "label": field.label
                })
            
    return valid_fields
