# Copyright (c) 2026, deepak and contributors
# For license information, please see license.txt

import re
import json
import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import now_datetime, validate_email_address, get_url
import datetime


class TaskManager(Document):

	def validate(self):
		self.validate_due_date()
		self.validate_closing_fields()

	def send_chat_notification(self, sender_email, receiver_email, content):
		"""Send a chat message via clefincode_chat. Create channel if it doesn't exist."""
		try:
			from clefincode_chat.api.api_1_2_1.api import send, create_channel, get_profile_id
			
			# Check if direct room exists
			room_name = frappe.db.sql("""
				SELECT c.name
				FROM `tabClefinCode Chat Channel` c
				JOIN `tabClefinCode Chat Channel User` u1 ON u1.parent = c.name
				JOIN `tabClefinCode Chat Channel User` u2 ON u2.parent = c.name
				WHERE c.type = 'Direct'
				AND c.is_parent = 1
				AND u1.user = %s
				AND u2.user = %s
			""", (sender_email, receiver_email), pluck=True)

			if room_name:
				room_name = room_name[0]
			else:
				# Create channel
				users = [
					{"email": sender_email, "platform": "Chat"},
					{"email": receiver_email, "platform": "Chat"}
				]
				sender_name = frappe.db.get_value("User", sender_email, "full_name") or sender_email
				res = create_channel(
					channel_name="", # Direct chats usually have empty channel_name
					users=json.dumps(users),
					type="Direct",
					last_message=content,
					creator_email=sender_email,
					creator=sender_name
				)
				if res and res.get("results"):
					room_name = res["results"][0]["room"]

			if room_name:
				sender_name = frappe.db.get_value("User", sender_email, "full_name") or sender_email
				send(
					content=content,
					user=sender_name,
					room=room_name,
					email=sender_email
				)
		except Exception as e:
			frappe.log_error(title="Task Manager Chat Notification Error", message=frappe.get_traceback())

	def before_save(self):
		# Auto-set closed_by and closed_on when status changes to Completed
		if self.status == "Completed" and not self.closed_by:
			self.closed_by = frappe.session.user
			self.closed_on = now_datetime()

		# If status changed away from Completed (Reopened), clear closing fields
		if self.status == "Reopened":
			self.closed_by = None
			self.closed_on = None

			self.append("history", {
				"event": "Reopened",
				"done_by": frappe.session.user,
				"done_on": now_datetime(),
				"remarks": _("Task reopened for further work.")
			})

	def validate_due_date(self):
		if self.due_date:
			from frappe.utils import getdate, today
			if getdate(self.due_date) < getdate(today()):
				# Just warn, don't block (task might be backlogged)
				frappe.msgprint(
					_("Due Date {0} is in the past.").format(self.due_date),
					indicator="orange",
					alert=True,
				)

	def validate_closing_fields(self):
		"""Validate required fields before marking as Completed."""
		if self.status == "Completed":
			if not self.assignees:
				frappe.throw(_("Please add at least one <b>Assignee</b> before saving."))

	def get_task_managers_emails(self):
		"""Get emails of all active users with the 'Task Manager' role."""
		manager_users = frappe.get_all(
			"Has Role",
			filters={"role": "Task Manager", "parenttype": "User"},
			pluck="parent"
		)
		if not manager_users:
			return []

		emails = [
			frappe.db.get_value("User", u, "email") or u
			for u in manager_users
		]
		return [e for e in emails if e]


	def after_insert(self):
		"""Send notification to all assignees when task is created."""
		self.notify_assignees("assigned")
		
		# Send Chat Notification from current user
		if self.assignees:
			sender = frappe.db.get_value("User", frappe.session.user, "email") or frappe.session.user
			for row in self.assignees:
				receiver = row.user or frappe.db.get_value("Employee", row.employee, "user")
				if receiver and receiver != sender:
					# Get first name for the greeting
					emp_name = row.employee_name or frappe.db.get_value("Employee", row.employee, "employee_name") or "Team"
					first_name = emp_name.split(" ")[0]
					
					formatted_date = frappe.utils.format_date(self.due_date, "dd MMM YYYY") if self.due_date else "N/A"
					project_info = f"{self.project}: " if self.project else ""
					
					content = (
						f"<b>Hi {first_name} 👋</b><br><br>"
						f"<b>New Task Assigned:</b> {project_info}{self.title}<br>"
						f"<b>Due Date:</b> {formatted_date}<br><br>"
						f"Please review the task details and proceed accordingly."
					)
					self.send_chat_notification(sender, receiver, content)

		frappe.publish_realtime(event="task_manager_updated", message={"name": self.name, "event": "insert"})

	def on_update(self):
		"""Send notifications based on status changes."""
		frappe.publish_realtime(event="task_manager_updated", message={"name": self.name, "event": "update"})
		doc_before_save = self.get_doc_before_save()
		if not doc_before_save:
			return

		old_status = doc_before_save.get("status")
		new_status = self.status

		if old_status != new_status:
			if new_status == "Completed":
				# Notify Task Manager (HR) only via email — not the assignees
				self.notify_hr("completed")
				# Send Chat Notification to the Task Creator (Owner)
				content = f"<b>Task Completed:</b> {self.title} by {frappe.session.user}"
				sender = frappe.db.get_value("User", frappe.session.user, "email") or frappe.session.user
				if self.owner and self.owner != sender:
					self.send_chat_notification(sender, self.owner, content)

			elif new_status == "Reopened":
				self.notify_assignees("reopened")
				# Send Chat Notification from Task Manager who reopened it
				if self.assignees:
					sender = frappe.db.get_value("User", frappe.session.user, "email") or frappe.session.user
					for row in self.assignees:
						receiver = row.user or frappe.db.get_value("Employee", row.employee, "user")
						if receiver and receiver != sender:
							# Get first name for the greeting
							emp_name = row.employee_name or frappe.db.get_value("Employee", row.employee, "employee_name") or "Team"
							first_name = emp_name.split(" ")[0]
							
							project_info = f"{self.project}: " if self.project else ""
							
							content = (
								f"<b>Hi {first_name} 👋</b><br><br>"
								f"<b>Task Reopened:</b> {project_info}{self.title}<br><br>"
								f"Please review the task and take necessary action."
							)
							self.send_chat_notification(sender, receiver, content)

			elif new_status == "In Progress":
				self.notify_hr("in_progress")
				# Send Chat Notification to the Task Creator (Owner)
				content = f"<b>Task In Progress:</b> {self.title} by {frappe.session.user}"
				sender = frappe.db.get_value("User", frappe.session.user, "email") or frappe.session.user
				if self.owner and self.owner != sender:
					self.send_chat_notification(sender, self.owner, content)

	def on_trash(self):
		frappe.publish_realtime(event="task_manager_updated", message={"name": self.name, "event": "trash"})


	def send_task_notification(self, subject, message, notify_assignees=True, notify_managers=True):
		"""Create in-app Notification Log entries."""
		target_users = set()

		# Collect assignee user IDs
		if notify_assignees and self.assignees:
			for row in self.assignees:
				u = row.user or frappe.db.get_value("Employee", row.employee, "user")
				if u: target_users.add(u)

		# Collect Task Manager role user IDs
		if notify_managers:
			manager_users = frappe.get_all("Has Role", filters={"role": "Task Manager", "parenttype": "User"}, pluck="parent")
			target_users.update(manager_users)

		for user in target_users:
			try:
				frappe.get_doc({
					"doctype": "Notification Log",
					"subject": subject,
					"email_content": message,
					"for_user": user,
					"type": "Alert",
					"document_type": "Task Manager",
					"document_name": self.name,
				}).insert(ignore_permissions=True)
			except Exception:
				pass



	def notify_assignees(self, event):
		"""Send an email notification to ALL assignees."""
		if not self.assignees:
			return

		subject_map = {
			"assigned": _("New Task Assigned: {0}").format(self.title),
			"completed": _("Task Completed: {0}").format(self.title),
			"reopened": _("Task Reopened: {0}").format(self.title),
		}

		content_map = {
			"assigned": {
				"header": "New Task Assigned",
				"header_color": "#0891b2",
				"body": "You have been assigned a new task. Please review it and get started.",
				"tag": "Assigned",
			},
			"completed": {
				"header": "Task Completed",
				"header_color": "#16a34a",
				"body": "Great work! The task has been marked as Completed.",
				"tag": "Completed",
			},
			"reopened": {
				"header": "Task Reopened",
				"header_color": "#ea580c",
				"body": "The task has been Reopened. Please review and take action.",
				"tag": "Reopened",
			},
		}

		ctx = content_map.get(event)
		if not ctx:
			return

		for row in self.assignees:
			user_id = row.user
			if not user_id:
				user_id = frappe.db.get_value("Employee", row.employee, "user")
			if not user_id:
				continue

			# Get email preferentially from User, then Employee
			user_email = user_id if "@" in user_id else (frappe.db.get_value("User", user_id, "email") or frappe.db.get_value("Employee", row.employee, "email"))
			if not user_email:
				continue

			greeting = "Hello, {0}".format(row.employee_name or "Team Member")
			message = get_task_email_html(
				task_name=self.name,
				task_title=self.title,
				priority=self.priority,
				due_date=self.due_date,
				project=self.project,
				department=self.department,
				greeting=greeting,
				body=ctx["body"],
				header=ctx["header"],
				header_color=ctx["header_color"],
				tag=ctx["tag"],
			)

			frappe.sendmail(
				recipients=[user_email],
				subject=subject_map.get(event, "Task Update"),
				message=message,
				delayed=False,
			)

	def notify_hr(self, event):
		"""Notify the Task Creator about task updates."""
		if not self.owner:
			return
		
		# Only notify if owner is not the current user
		if self.owner == frappe.session.user:
			return
		
		emails = [self.owner]

		assignee_names = ", ".join([r.employee_name or r.employee for r in self.assignees])

		if event == "completed":
			subject = _("Task Completed: {0}").format(self.title)
			ctx = {
				"header": "Task Completed",
				"header_color": "#16a34a",
				"body": "The task has been marked as <b>Completed</b> by {0}.".format(assignee_names),
				"tag": "Completed",
			}
		elif event == "in_progress":
			subject = _("Task In Progress: {0}").format(self.title)
			ctx = {
				"header": "Task In Progress",
				"header_color": "#0891b2",
				"body": "The task is now <b>In Progress</b> by {0}.".format(assignee_names),
				"tag": "In Progress",
			}
		else:
			return

		message = get_task_email_html(
			task_name=self.name,
			task_title=self.title,
			priority=self.priority,
			due_date=self.due_date,
			project=self.project,
			department=self.department,
			greeting="Hello, Task Manager",
			body=ctx["body"],
			header=ctx["header"],
			header_color=ctx["header_color"],
			tag=ctx["tag"],
		)

		frappe.sendmail(
			recipients=emails,
			subject=subject,
			message=message,
			delayed=False,
		)


def get_task_email_html(task_name, task_title, priority, due_date, project, department,
					   greeting, body, header, header_color, tag):
	"""Generate a premium HTML email template for task notifications."""
	base_url = frappe.utils.get_url()
	task_url = "{0}/task-manager/".format(base_url)
	logo_url = "https://erp.innoblitz.in/assets/company/crm/assets/logo/Innoblitz_logo.png"

	priority_colors = {
		"High": "#dc2626",
		"Medium": "#d97706",
		"Low": "#16a34a",
	}
	priority_color = priority_colors.get(priority or "Medium", "#d97706")

	return """<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en">
<head>
<title></title>
<meta charset="UTF-8" />
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<!--[if !mso]>-->
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<!--<![endif]-->
<meta name="x-apple-disable-message-reformatting" content="" />
<meta content="target-densitydpi=device-dpi" name="viewport" />
<meta content="true" name="HandheldFriendly" />
<meta content="width=device-width" name="viewport" />
<meta name="format-detection" content="telephone=no, date=no, address=no, email=no, url=no" />
<style type="text/css">
table {{border-collapse:separate;table-layout:fixed;mso-table-lspace:0pt;mso-table-rspace:0pt}}
table td {{border-collapse:collapse}}
.ExternalClass {{width:100%}}
.ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div {{line-height:100%}}
body,a,li,p,h1,h2,h3{{-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%}}
html{{-webkit-text-size-adjust:none!important}}
body{{min-width:100%;Margin:0px;padding:0px;background-color:#F0F0F0;}}
body,#innerTable{{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}}
img{{Margin:0;padding:0;-ms-interpolation-mode:bicubic}}
h1,h2,h3,p,a{{overflow-wrap:normal;white-space:normal;word-break:break-word}}
a{{text-decoration:none}}
h1,h2,h3,p{{min-width:100%!important;width:100%!important;max-width:100%!important;display:inline-block!important;border:0;padding:0;margin:0}}
a[x-apple-data-detectors]{{color:inherit!important;text-decoration:none!important;font-size:inherit!important;font-family:inherit!important;font-weight:inherit!important;line-height:inherit!important}}
u + #body a{{color:inherit;text-decoration:none;font-size:inherit;font-family:inherit;font-weight:inherit;line-height:inherit}}
a[href^="mailto"],a[href^="tel"],a[href^="sms"]{{color:inherit;text-decoration:none}}
</style>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;700&amp;family=Roboto:wght@400&amp;display=swap" rel="stylesheet" type="text/css" />
</head>
<body id="body" style="min-width:100%;Margin:0px;padding:0px;background-color:#F0F0F0;">
<div style="background-color:#F0F0F0;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" align="center">
<tr><td style="font-size:0;line-height:0;background-color:#F0F0F0;" valign="top" align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" align="center" id="innerTable">
<tr><td align="center">
<table role="presentation" cellpadding="0" cellspacing="0" style="Margin-left:auto;Margin-right:auto;">
<tr><td width="630" style="width:630px;">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="width:100%;">
<tr><td style="background-color:#FFFFFF;padding:40px 60px 40px 60px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100% !important;">

<!-- Logo -->
<tr><td align="center">
<table role="presentation" cellpadding="0" cellspacing="0" style="Margin-left:auto;Margin-right:auto;">
<tr><td width="250" style="width:250px;">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="width:100%;">
<tr><td><div style="font-size:0px;"><img style="display:block;border:0;height:auto;width:100%;Margin:0;max-width:100%;" width="250" height="163" alt="" src="{logo_url}"/></div></td></tr>
</table></td></tr></table>
</td></tr>

<!-- Spacer 40px -->
<tr><td><div style="mso-line-height-rule:exactly;mso-line-height-alt:40px;line-height:40px;font-size:1px;display:block;">&nbsp;&nbsp;</div></td></tr>

<!-- Header Title -->
<tr><td align="center">
<table role="presentation" cellpadding="0" cellspacing="0" style="Margin-left:auto;Margin-right:auto;">
<tr><td width="510">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="width:100%;">
<tr><td><h1 style="margin:0;Margin:0;font-family:Poppins,BlinkMacSystemFont,Segoe UI,Helvetica Neue,Arial,sans-serif;line-height:34px;font-weight:700;font-style:normal;font-size:29px;text-decoration:none;text-transform:none;direction:ltr;color:{header_color};text-align:center;mso-line-height-rule:exactly;mso-text-raise:2px;">{header}</h1></td></tr>
</table></td></tr></table>
</td></tr>

<!-- Spacer 11px -->
<tr><td><div style="mso-line-height-rule:exactly;mso-line-height-alt:11px;line-height:11px;font-size:1px;display:block;">&nbsp;&nbsp;</div></td></tr>
<!-- Spacer 21px -->
<tr><td><div style="mso-line-height-rule:exactly;mso-line-height-alt:21px;line-height:21px;font-size:1px;display:block;">&nbsp;&nbsp;</div></td></tr>

<!-- Greeting + Body -->
<tr><td align="center">
<table role="presentation" cellpadding="0" cellspacing="0" style="Margin-left:auto;Margin-right:auto;">
<tr><td>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="width:100%;">
<tr><td><p style="margin:0;Margin:0;font-family:Poppins,BlinkMacSystemFont,Segoe UI,Helvetica Neue,Arial,sans-serif;line-height:22px;font-weight:500;font-style:normal;font-size:16px;text-decoration:none;text-transform:none;direction:ltr;color:#333333;text-align:left;mso-line-height-rule:exactly;mso-text-raise:2px;">{greeting}&nbsp; {body}</p></td></tr>
</table></td></tr></table>
</td></tr>

<!-- Spacer 4px -->
<tr><td><div style="mso-line-height-rule:exactly;mso-line-height-alt:4px;line-height:4px;font-size:1px;display:block;">&nbsp;&nbsp;</div></td></tr>

<!-- Task Card Wrapper -->
<tr><td align="center">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="width:100%;">
<tr><td style="padding:30px 0 10px 0;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100% !important;">

  <!-- Task Details Header -->
  <tr><td align="center">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="width:100%;">
  <tr><td style="border:1px solid #E3E3E3;overflow:hidden;padding:30px 30px 30px 30px;border-radius:6px 6px 0 0;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100% !important;">
  <tr><td align="center">
  <table role="presentation" cellpadding="0" cellspacing="0" style="Margin-left:auto;Margin-right:auto;">
  <tr><td width="448">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="width:100%;">
  <tr><td><p style="margin:0;Margin:0;font-family:Poppins,BlinkMacSystemFont,Segoe UI,Helvetica Neue,Arial,sans-serif;line-height:22px;font-weight:bold;font-style:normal;font-size:16px;text-decoration:none;text-transform:none;direction:ltr;color:#333333;text-align:left;mso-line-height-rule:exactly;mso-text-raise:2px;">Task Details</p></td></tr>
  </table></td></tr></table>
  </td></tr></table>
  </td></tr></table>
  </td></tr>

  <!-- Task Details Body — two-column aligned table -->
  <tr><td>
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="width:100%;">
  <tr><td style="border:1px solid #E3E3E3;padding:24px 30px;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="width:100%;border-collapse:collapse;">

    <!-- Task Title -->
    <tr>
      <td width="120" valign="top" style="padding:14px 12px 14px 0;font-family:Poppins,BlinkMacSystemFont,Segoe UI,Helvetica Neue,Arial,sans-serif;font-size:13px;font-weight:700;color:#595959;white-space:nowrap;">Task Title:</td>
      <td valign="top" style="padding:14px 0;font-family:Poppins,BlinkMacSystemFont,Segoe UI,Helvetica Neue,Arial,sans-serif;font-size:14px;font-weight:700;color:#1A1A1A;">{task_title}</td>
    </tr>

    <!-- Priority -->
    <tr>
      <td width="120" valign="top" style="padding:14px 12px 14px 0;font-family:Poppins,BlinkMacSystemFont,Segoe UI,Helvetica Neue,Arial,sans-serif;font-size:13px;font-weight:700;color:#595959;white-space:nowrap;">Priority:</td>
      <td valign="top" style="padding:14px 0;font-family:Poppins,BlinkMacSystemFont,Segoe UI,Helvetica Neue,Arial,sans-serif;font-size:14px;font-weight:700;color:{priority_color};"><span>{priority}</span></td>
    </tr>

    <!-- Due Date -->
    <tr>
      <td width="120" valign="top" style="padding:14px 12px 14px 0;font-family:Poppins,BlinkMacSystemFont,Segoe UI,Helvetica Neue,Arial,sans-serif;font-size:13px;font-weight:700;color:#595959;white-space:nowrap;">Due Date:</td>
      <td valign="top" style="padding:14px 0;font-family:Poppins,BlinkMacSystemFont,Segoe UI,Helvetica Neue,Arial,sans-serif;font-size:14px;font-weight:700;color:#1A1A1A;">{due_date}</td>
    </tr>

    <!-- Project -->
    <tr>
      <td width="120" valign="top" style="padding:14px 12px 14px 0;font-family:Poppins,BlinkMacSystemFont,Segoe UI,Helvetica Neue,Arial,sans-serif;font-size:13px;font-weight:700;color:#595959;white-space:nowrap;">Project:</td>
      <td valign="top" style="padding:14px 0;font-family:Poppins,BlinkMacSystemFont,Segoe UI,Helvetica Neue,Arial,sans-serif;font-size:14px;font-weight:700;color:#1A1A1A;">{project}</td>
    </tr>

    <!-- Department -->
    <tr>
      <td width="120" valign="top" style="padding:14px 12px 14px 0;font-family:Poppins,BlinkMacSystemFont,Segoe UI,Helvetica Neue,Arial,sans-serif;font-size:13px;font-weight:700;color:#595959;white-space:nowrap;">Department:</td>
      <td valign="top" style="padding:14px 0;font-family:Poppins,BlinkMacSystemFont,Segoe UI,Helvetica Neue,Arial,sans-serif;font-size:14px;font-weight:700;color:#1A1A1A;">{department}</td>
    </tr>

  </table>
  </td></tr></table>
  </td></tr>

  <!-- Open Task Button -->
  <tr><td align="center">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="width:100%;">
  <tr><td style="border:1px solid #E3E3E3;overflow:hidden;padding:10px 10px 10px 10px;border-radius:0 0 6px 6px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100% !important;">
  <tr><td align="center">
  <table role="presentation" cellpadding="0" cellspacing="0" style="Margin-left:auto;Margin-right:auto;">
  <tr><td width="488">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="width:100%;">
  <tr><td style="overflow:hidden;background-color:{header_color};text-align:center;line-height:24px;mso-line-height-rule:exactly;mso-text-raise:2px;padding:18px 14px 18px 14px;border-radius:4px 4px 4px 4px;">
  <a href="{task_url}" target="_blank" style="display:block;margin:0;Margin:0;font-family:Poppins,BlinkMacSystemFont,Segoe UI,Helvetica Neue,Arial,sans-serif;line-height:24px;font-weight:700;font-style:normal;font-size:16px;text-decoration:none;direction:ltr;color:#FFFFFF;text-align:center;mso-line-height-rule:exactly;mso-text-raise:2px;">Open Task</a>
  </td></tr>
  </table></td></tr></table>
  </td></tr></table>
  </td></tr></table>
  </td></tr>

</table>
</td></tr></table>
</td></tr>

</table>
</td></tr></table>
</td></tr></table>
</td></tr></table>
</td></tr></table>
</td></tr></table>

</td></tr></table>

</div>
</body>
</html>""".format(
		header=header,
		header_color=header_color,
		greeting=greeting,
		body=body,
		task_title=task_title,
		priority=priority or "N/A",
		priority_color=priority_color,
		due_date=(
			__import__('datetime').datetime.strptime(str(due_date), '%Y-%m-%d').strftime('%d-%m-%Y')
			if due_date else "N/A"
		),
		project=project or "N/A",
		department=department or "N/A",
		task_url=task_url,
		logo_url=logo_url,
	)

@frappe.whitelist()
def close_task(task_name, hours_spent, remarks, attachment=None):
	"""API endpoint called from the frontend Close Task dialog."""
	doc = frappe.get_doc("Task Manager", task_name)

	if doc.status == "Completed":
		frappe.throw(_("This task is already Completed."))

	# Validate input
	if not hours_spent:
		frappe.throw(_("Please enter <b>Hours Spent</b> before closing the task."))
	if not remarks:
		frappe.throw(_("Please add <b>Remarks</b> before closing the task."))
	
	# Validate HH:MM format (HH: 1-3 digits, MM: 00-59)
	if not re.match(r"^([0-9]{1,3}):([0-5][0-9])$", hours_spent):
		frappe.throw(_("<b>Hours Spent</b> must be in <b>HH:MM</b> format (MM: 00-59). Example: 02:30"))
		
	if doc.attachment_required and not attachment:
		frappe.throw(_("This task requires an <b>Attachment</b> before it can be closed."))

	doc.status = "Completed"
	doc.append("history", {
		"event": "Closed",
		"done_by": frappe.session.user,
		"done_on": now_datetime(),
		"hours_spent": hours_spent,
		"remarks": remarks,
		"closing_attachment": attachment
	})

	doc.save()
	# Send Chat Notification to the Task Creator (Owner)
	content = f"<b>Task Closed:</b> {doc.title}<br><b>Hours Spent:</b> {hours_spent}<br><b>Remarks:</b> {remarks}"
	sender = frappe.db.get_value("User", frappe.session.user, "email") or frappe.session.user
	if doc.owner and doc.owner != sender:
		doc.send_chat_notification(sender, doc.owner, content)

	return {"message": "Task closed successfully", "status": doc.status}


@frappe.whitelist()
def reopen_task(task_name, remarks):
	"""API endpoint called from the frontend to Reopen a completed task."""
	doc = frappe.get_doc("Task Manager", task_name)

	if doc.status != "Completed":
		frappe.throw(_("Only Completed tasks can be Reopened."))

	# Check if the caller is Task Manager, HR, or System Manager
	allowed_roles = ["Task Manager", "HR", "System Manager", "Administrator"]
	user_roles = frappe.get_roles(frappe.session.user)
	if not any(r in user_roles for r in allowed_roles):
		frappe.throw(_("Access denied. Only Task Managers can Reopen a task."))

	if not remarks:
		frappe.throw(_("Please enter <b>Remarks</b> before reopening the task."))

	doc.status = "Reopened"
	doc.append("history", {
		"event": "Reopened",
		"done_by": frappe.session.user,
		"done_on": now_datetime(),
		"remarks": remarks
	})

	doc.save()
	return {"message": "Task reopened successfully", "status": doc.status}



@frappe.whitelist()
def accept_task(task_name):
	"""API endpoint to move task to In Progress status."""
	doc = frappe.get_doc("Task Manager", task_name)

	if doc.status == "In Progress":
		frappe.throw(_("This task is already In Progress."))

	doc.status = "In Progress"
	doc.append("history", {
		"event": "Accepted",
		"done_by": frappe.session.user,
		"done_on": now_datetime(),
		"remarks": _("Task accepted and work started.")
	})

	# Send Chat Notification to the Task Creator (Owner) before save triggers on_update
	content = f"<b>Task Accepted:</b> {doc.title}<br>Work has started."
	sender = frappe.db.get_value("User", frappe.session.user, "email") or frappe.session.user
	if doc.owner and doc.owner != sender:
		doc.send_chat_notification(sender, doc.owner, content)

	doc.save()

	return {"message": "Task accepted successfully", "status": doc.status}


@frappe.whitelist()
def get_my_tasks():
	"""Return tasks where the current user is one of the assignees."""
	# Get parent names where user is an assignee
	task_names = frappe.get_all(
		"Task Manager Assignee",
		filters={"user": frappe.session.user},
		pluck="parent"
	)
	
	if not task_names:
		return []

	return frappe.get_all(
		"Task Manager",
		filters={"name": ["in", task_names]},
		fields=["name", "title", "status", "priority", "due_date", "project"],
		order_by="due_date asc",
	)


@frappe.whitelist()
def get_all_tasks(status=None, assignee=None):
	"""Return all tasks. HR only."""
	allowed_roles = ["Task Manager", "System Manager"]
	user_roles = frappe.get_roles(frappe.session.user)
	if not any(r in user_roles for r in allowed_roles):
		frappe.throw(_("Access denied. Only Task Managers can view all tasks."))

	filters = {}
	if status:
		filters["status"] = status
	if assignee:
		# Filter by user in the child table
		task_names = frappe.get_all(
			"Task Manager Assignee",
			filters={"user": assignee},
			pluck="parent"
		)
		if not task_names:
			return []
		filters["name"] = ["in", task_names]

	return frappe.get_all(
		"Task Manager",
		filters=filters,
		fields=[
			"name", "title", "status", "priority", "due_date",
			"project"
		],
		order_by="creation desc",
	)


@frappe.whitelist()
def get_employees_from_department(department):
	"""Return all active employees belonging to the specified department."""
	if not department:
		return []

	return frappe.get_all(
		"Employee",
		filters={
			"department": department,
			"status": "Active"
		},
		fields=["name", "employee_name", "user", "department"],
		ignore_permissions=True
	)


@frappe.whitelist()
def get_all_active_employees():
	"""Return all active employees, bypassing user permissions.
	Used by the Task Manager assignee dropdown so Team Leads can assign
	tasks to any employee, not just those visible under their own permissions.
	"""
	return frappe.get_all(
		"Employee",
		filters={"status": "Active"},
		fields=["name", "employee_name", "user"],
		order_by="employee_name asc",
		ignore_permissions=True
	)


@frappe.whitelist()
def get_assignees(task_names):
	"""API endpoint to fetch assignees for a list of tasks."""
	if isinstance(task_names, str):
		import json
		task_names = json.loads(task_names)
	
	if not task_names:
		return []

	return frappe.db.sql("""
		SELECT 
			tma.name, tma.parent, tma.employee, tma.employee_name, tma.user,
			emp.profile_picture as profile_pic
		FROM `tabTask Manager Assignee` tma
		LEFT JOIN `tabEmployee` emp ON tma.employee = emp.name
		WHERE tma.parent IN %s
	""", (task_names,), as_dict=1)
