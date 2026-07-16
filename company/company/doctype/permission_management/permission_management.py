# -*- coding: utf-8 -*-
import frappe
from frappe.model.document import Document

class PermissionManagement(Document):
    def validate(self):
        # Auto populate child mapping rows if empty
        self.populate_default_permissions()

        # Validate that if any action is allowed, View is also enabled
        for perm in self.permissions:
            if (perm.add_permission or perm.edit_permission or perm.delete_permission or perm.export_permission):
                perm.view_permission = 1

    @frappe.whitelist()
    def populate_default_permissions(self):
        # Always build or sync permissions when backend_master_role is selected
        if not self.backend_master_role:
            return

        # Map backend master roles to their corresponding modules & screen registry list
        role = self.backend_master_role.strip()
        modules_list = []

        if role == "HR":
            modules_list = [
                ("dashboard", "HR Dashboard"),
                ("task_manager", "Task Manager"),
                ("employee", "Employee List"),
                ("employee", "Users List"),
                ("attendance", "Attendance List"),
                ("attendance", "Daily Log"),
                ("attendance", "WFH Attendance"),
                ("leaves", "Leave Application"),
                ("leaves", "Leave Allocate"),
                ("requests", "Request List"),
                ("timesheets", "Timesheets"),
                ("salary_slips", "Salary Slips"),
                ("holidays", "Holidays List"),
                ("announcements", "Announcements"),
                ("asset", "Asset List"),
                ("asset", "Asset Assignments"),
                ("asset", "Asset Requests"),
                ("expenses", "Company Expenses"),
                ("expenses", "Reimbursement Claim List"),
                ("employee_performance", "Employee Evaluation"),
                ("employee_performance", "Badges"),
                ("employee_performance", "Employee Monthly Award"),
                ("recruitment", "Job Opening List"),
                ("recruitment", "Job Applicant List"),
                ("recruitment", "Interview List"),
                ("recruitment", "Employee Referral List"),
                ("reports", "Attendance Report"),
                ("reports", "Daily Log Report"),
                ("reports", "Task Report"),
                ("reports", "Timesheet Report"),
                ("reports", "Leave Allocation Report"),
                ("reports", "Employee Overall Report"),
                ("reports", "Salary Slip Report"),
                ("masters", "Department"),
                ("masters", "Project"),
                ("masters", "Activity Type"),
                ("masters", "Claim Type"),
                ("masters", "Bank Account"),
                ("masters", "Asset Category"),
                ("masters", "Criteria Category"),
                ("masters", "Designation"),
                ("masters", "Salary Component"),
                ("masters", "Leave Type"),
                ("reminders", "Reminders")
            ]
        elif role == "Employee":
            modules_list = [
                ("dashboard", "Employee Dashboard"),
                ("profile", "My Profile"),
                ("tasks", "My Tasks"),
                ("attendance", "My Attendance"),
                ("daily_log", "My Daily Log"),
                ("leaves", "My Leave Application"),
                ("requests", "My Request List"),
                ("timesheets", "My Timesheet"),
                ("wfh_attendance", "My WFH Attendance"),
                ("salary_slips", "My Salary Slip"),
                ("reimbursement_claims", "My Reimbursement Claim"),
                ("asset", "My Asset List"),
                ("asset", "My Asset Requests"),
                ("recruitment", "Refer a Friend"),
                ("reports", "My Attendance Report"),
                ("reports", "My Daily Log Report"),
                ("reports", "My Timesheet Report")
            ]
        elif role in ("CRM And Sales", "Sales", "CRM User"):
            modules_list = [
                ("dashboard", "Dashboard"),
                ("lead", "Leads"),
                ("contact", "Clients"),
                ("account", "Company"),
                ("proposal", "Proposal"),
                ("deal", "Prospects"),
                ("purchase", "Purchases"),
                ("expenses", "Expense Tracker"),
                ("events", "Calendar"),
                ("mail_automation", "Email Templates"),
                ("mail_automation", "Email Campaigns"),
                ("mail_automation", "Email Automations"),
                ("mail_automation", "Email Settings"),
                ("whatsapp_automation", "WhatsApp Templates"),
                ("whatsapp_automation", "WhatsApp Campaigns"),
                ("whatsapp_automation", "WhatsApp Automation"),
                ("whatsapp_automation", "WhatsApp Settings"),
                ("lead_integration", "Meta Apps"),
                ("lead_integration", "Meta Pages"),
                ("lead_integration", "Meta Forms"),
                ("lead_integration", "Meta Leads"),
                ("lead_integration", "Webhook Logs"),
                ("lead_integration", "Meta Queue"),
                ("masters", "Lead From"),
                ("masters", "Service"),
                ("masters", "Item"),
                ("masters", "Payment Terms"),
                ("masters", "Payment Type"),
                ("masters", "Tax Types"),
                ("masters", "Company Bank Account"),
                ("masters", "Email Template Category"),
                ("masters", "WhatsApp Template Category"),
                ("reports", "Lead Report"),
                ("reports", "Clients Report"),
                ("reports", "Company Report"),
                ("reports", "Calls Report"),
                ("reports", "Meeting Report"),
                ("reports", "Proposal Report"),
                ("reports", "Prospects Report"),
                ("reports", "Estimation Report"),
                ("reports", "Invoice Report"),
                ("reports", "Purchase Report"),
                ("reports", "Invoice Collection Summary"),
                ("reports", "Purchase Settlement Report")
            ]

        # Populate rows if the child permissions table is empty
        if not self.permissions and modules_list:
            for module, screen in modules_list:
                self.append("permissions", {
                    "module_id": module,
                    "screen_id": screen,
                    "add_permission": 0,
                    "edit_permission": 0,
                    "view_permission": 1 if "Dashboard" in screen or screen == "Dashboard" else 0,
                    "delete_permission": 0,
                    "export_permission": 0
                })

