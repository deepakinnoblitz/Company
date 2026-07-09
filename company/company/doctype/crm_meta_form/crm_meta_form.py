# -*- coding: utf-8 -*-
# Copyright (c) 2026, deepak and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document

class CRMMetaForm(Document):
    def validate(self):
        self.validate_page()
        self.validate_form_id()
        self.validate_mappings()

    def validate_page(self):
        """Ensure linked Meta Page is active."""
        if self.meta_page:
            is_active = frappe.db.get_value("CRM Meta Page", self.meta_page, "is_active")
            if not is_active:
                frappe.throw(
                    _("The linked Meta Page '{0}' is inactive. Please activate it first.").format(self.meta_page),
                    title=_("Inactive Page")
                )

    def validate_form_id(self):
        """Ensure Form ID is a valid numeric string."""
        if self.form_id:
            form_id_str = str(self.form_id).strip()
            if not form_id_str.isdigit():
                frappe.throw(
                    _("Form ID must contain only numbers. '{0}' is invalid.").format(form_id_str),
                    title=_("Invalid Form ID")
                )

    def validate_mappings(self):
        """Ensure all mappings have a valid CRM field and Meta key."""
        if self.field_mappings:
            for row in self.field_mappings:
                if not row.crm_field:
                    frappe.throw(
                        _("Row #{0}: CRM Field is mandatory in Field Mappings table.").format(row.idx),
                        title=_("Missing CRM Field")
                    )
                if not row.meta_field and not row.default_value:
                    frappe.throw(
                        _("Row #{0}: You must specify either a Meta Field key or a Default Value.").format(row.idx),
                        title=_("Incomplete Mapping")
                    )
