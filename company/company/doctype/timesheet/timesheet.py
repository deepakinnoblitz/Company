# Copyright (c) 2025, deepak and contributors
# For license information, please see license.txt
 
# import frappe
from frappe.model.document import Document
 
 
class Timesheet(Document):
    def validate(self):
        self.calculate_total_hours()
 
    def calculate_total_hours(self):
        self.total_hours = sum([d.hours for d in self.timesheet_entries or []])