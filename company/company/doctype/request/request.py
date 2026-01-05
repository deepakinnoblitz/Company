import frappe
from frappe.model.document import Document

class Request(Document):
    def on_submit(self):
        """Triggered when an Employee submits the Request"""
        self.notify_hr_on_submission()

    def on_update_after_submit(self):
        """Triggered automatically after document is submitted or updated post-submission."""
        # When HR approves after submission
        if self.workflow_state == "Approved":
            current_user = frappe.session.user
            approver_full_name = frappe.db.get_value("User", current_user, "full_name")
            approver_email = frappe.db.get_value("User", current_user, "email")

            frappe.db.set_value(
                self.doctype,
                self.name,
                "approved_by",
                current_user,
                update_modified=False
            )

            # Send approval mail with HR details
            self.notify_employee_on_approval(approver_full_name, approver_email)

    def on_cancel(self):
        """Triggered when HR rejects the request"""
        if self.workflow_state == "Rejected":
            current_user = frappe.session.user
            rejector_full_name = frappe.db.get_value("User", current_user, "full_name")
            rejector_email = frappe.db.get_value("User", current_user, "email")

            frappe.db.set_value(
                self.doctype,
                self.name,
                "approved_by",
                current_user,
                update_modified=False
            )

            # Send rejection mail with HR details
            self.notify_employee_on_rejection(rejector_full_name, rejector_email)

    # ----------------------------------------------------------------------
    # ✅ Notify HR when Employee Submits (Sky Blue Theme)
    # ----------------------------------------------------------------------
    def notify_hr_on_submission(self):
        """Send mail to HR when Employee submits a new Request"""
        hr_settings = frappe.get_all(
            "Company Email Settings",
            fields=["hr_email", "hr_cc_emails"],
            limit=1
        )

        if not hr_settings:
            frappe.msgprint("⚠️ No HR Email Settings found in 'Company Email Settings'.")
            return

        hr_email = hr_settings[0].get("hr_email")
        cc_emails = hr_settings[0].get("hr_cc_emails")
        if not hr_email:
            frappe.msgprint("⚠️ HR Email (To) is not configured in 'Company Email Settings'.")
            return

        recipients = [hr_email]
        cc_list = []
        if cc_emails:
            cc_list = [email.strip() for email in cc_emails.replace("\n", ",").split(",") if email.strip()]

        message = f"""
        <div style="font-family:'Poppins','Segoe UI',Arial,sans-serif;background:#e6f3ff;padding:40px;">
            <div style="max-width:600px;margin:auto;background:white;border-radius:14px;
                        box-shadow:0 4px 12px rgba(0,128,255,0.15);overflow:hidden;">

                <div style="background:#0d6efd;color:white;padding:20px 26px;font-size:18px;font-weight:600;">
                    📨 New Request Submitted
                </div>

                <div style="padding:26px;color:#333;font-size:14px;line-height:1.6;">
                    <p>Dear HR,</p>
                    <p><b>{self.employee_name}</b> has submitted a new request for your review.</p>

                    <table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:18px;border-radius:8px;overflow:hidden;">
                        <tr style="background:#e8f3ff;">
                            <td style="padding:10px 12px;font-weight:600;width:160px;">Subject</td>
                            <td style="padding:10px 12px;">{self.subject or '-'}</td>
                        </tr>
                        <tr style="background:#f5faff;">
                            <td style="padding:10px 12px;font-weight:600;">Message</td>
                            <td style="padding:10px 12px;">{self.message or '-'}</td>
                        </tr>
                    </table>

                    <div style="text-align:center;margin-top:28px;">
                        <a href="{frappe.utils.get_url('/app/request/' + self.name)}"
                        style="background:#0d6efd;color:white;padding:12px 24px;text-decoration:none;
                                border-radius:8px;font-size:14px;font-weight:500;">View in ERP</a>
                    </div>
                </div>

                <div style="background:#d0e7ff;padding:12px 20px;text-align:center;
                            font-size:12px;color:#084298;">
                    This is an automated message from your ERP system.
                </div>
            </div>
        </div>
        """

        frappe.sendmail(
            recipients=recipients,
            cc=cc_list,
            subject=f"📨 New Request Submitted - {self.employee_name}",
            message=message,
            reference_doctype=self.doctype,
            reference_name=self.name,
        )

    # ----------------------------------------------------------------------
    # 💚 Notify Employee when HR Approves (Green Theme, Same Layout)
    # ----------------------------------------------------------------------
    def notify_employee_on_approval(self, approver_name=None, approver_email=None):
        """Send mail to employee when HR approves"""
        if not self.employee_id:
            return

        emp = frappe.get_doc("Employee", self.employee_id)
        recipients = [r for r in [emp.email, emp.personal_email] if r]
        if not recipients:
            return

        message = f"""
        <div style="font-family:'Poppins','Segoe UI',Arial,sans-serif;background:#f1fff4;padding:40px;">
            <div style="max-width:600px;margin:auto;background:white;border-radius:14px;
                        box-shadow:0 4px 12px rgba(0,128,0,0.15);overflow:hidden;">

                <div style="background:#28a745;color:white;padding:20px 26px;font-size:18px;font-weight:600;">
                    ✅ Request Approved
                </div>

                <div style="padding:26px;color:#333;font-size:14px;line-height:1.6;">
                    <p>Dear <b>{self.employee_name}</b>,</p>
                    <p>Your request has been <b style="color:#28a745;">approved</b> by HR.</p>

                    <p><b>Approved By:</b> {approver_name or '-'} ({approver_email or ''})</p>

                    <table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:18px;border-radius:8px;overflow:hidden;">
                        <tr style="background:#e8f9ee;">
                            <td style="padding:10px 12px;font-weight:600;width:160px;">Subject</td>
                            <td style="padding:10px 12px;">{self.subject or '-'}</td>
                        </tr>
                        <tr style="background:#f5fff7;">
                            <td style="padding:10px 12px;font-weight:600;">Message</td>
                            <td style="padding:10px 12px;">{self.message or '-'}</td>
                        </tr>
                    </table>

                    <div style="text-align:center;margin-top:28px;">
                        <a href="{frappe.utils.get_url('/app/request/' + self.name)}"
                        style="background:#28a745;color:white;padding:12px 24px;text-decoration:none;
                                border-radius:8px;font-size:14px;font-weight:500;">View in ERP</a>
                    </div>
                </div>

                <div style="background:#d4edda;padding:12px 20px;text-align:center;
                            font-size:12px;color:#155724;">
                    This is an automated message from your ERP system.
                </div>
            </div>
        </div>
        """

        frappe.sendmail(
            recipients=recipients,
            subject=f"✅ Request Approved - {self.subject or ''}",
            message=message,
            reference_doctype=self.doctype,
            reference_name=self.name,
        )

    # ----------------------------------------------------------------------
    # ❤️ Notify Employee when HR Rejects (Red Theme, Same Layout)
    # ----------------------------------------------------------------------
    def notify_employee_on_rejection(self, rejector_name=None, rejector_email=None):
        """Send mail to employee when HR rejects"""
        if not self.employee_id:
            return

        emp = frappe.get_doc("Employee", self.employee_id)
        recipients = [r for r in [emp.email, emp.personal_email] if r]
        if not recipients:
            return

        message = f"""
        <div style="font-family:'Poppins','Segoe UI',Arial,sans-serif;background:#fff0f0;padding:40px;">
            <div style="max-width:600px;margin:auto;background:white;border-radius:14px;
                        box-shadow:0 4px 12px rgba(255,0,0,0.15);overflow:hidden;">

                <div style="background:#dc3545;color:white;padding:20px 26px;font-size:18px;font-weight:600;">
                    ❌ Request Rejected
                </div>

                <div style="padding:26px;color:#333;font-size:14px;line-height:1.6;">
                    <p>Dear <b>{self.employee_name}</b>,</p>
                    <p>Your request has been <b style="color:#dc3545;">rejected</b> by HR.</p>

                    <p><b>Rejected By:</b> {rejector_name or '-'} ({rejector_email or ''})</p>

                    <table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:18px;border-radius:8px;overflow:hidden;">
                        <tr style="background:#ffe8e8;">
                            <td style="padding:10px 12px;font-weight:600;width:160px;">Subject</td>
                            <td style="padding:10px 12px;">{self.subject or '-'}</td>
                        </tr>
                        <tr style="background:#fff5f5;">
                            <td style="padding:10px 12px;font-weight:600;">Message</td>
                            <td style="padding:10px 12px;">{self.message or '-'}</td>
                        </tr>
                    </table>

                    <div style="text-align:center;margin-top:28px;">
                        <a href="{frappe.utils.get_url('/app/request/' + self.name)}"
                        style="background:#dc3545;color:white;padding:12px 24px;text-decoration:none;
                                border-radius:8px;font-size:14px;font-weight:500;">View in ERP</a>
                    </div>
                </div>

                <div style="background:#f8d7da;padding:12px 20px;text-align:center;
                            font-size:12px;color:#721c24;">
                    This is an automated message from your ERP system.
                </div>
            </div>
        </div>
        """

        frappe.sendmail(
            recipients=recipients,
            subject=f"❌ Request Rejected - {self.subject or ''}",
            message=message,
            reference_doctype=self.doctype,
            reference_name=self.name,
        )
