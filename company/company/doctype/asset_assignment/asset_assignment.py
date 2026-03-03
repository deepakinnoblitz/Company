# Copyright (c) 2025, deepak and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

class AssetAssignment(Document):
    def validate(self):
        self.check_asset_availability()

    def check_asset_availability(self):
        """
        Check if the Asset is already assigned and not yet returned
        """
        if self.asset:
            existing = frappe.db.get_value(
                "Asset Assignment",
                {
                    "asset": self.asset,
                    "returned_on": ["is", "not set"],
                    "name": ["!=", self.name]
                },
                ["name", "assigned_to", "employee_name"],
                as_dict=True
            )
            if existing:
                frappe.throw(
                    msg=f"Asset <b>{self.asset}</b> is already assigned to <b>{existing.employee_name} ({existing.assigned_to})</b> and has not been returned yet.",
                    title="Asset Already Assigned"
                )