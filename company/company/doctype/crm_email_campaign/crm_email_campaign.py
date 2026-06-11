# Copyright (c) 2026, deepak and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


import re
from urllib.parse import quote
from frappe.model.document import Document

class CRMEmailCampaign(Document):
	pass

def get_actual_field_name(doctype, filter_field):
	field_map = {
		"workflow_status": "workflow_state",
		"source": "leads_from" if doctype == "Lead" else ("source_lead" if doctype == "Contacts" else "source"),
		"lead_name": "lead_name" if doctype == "Lead" else ("first_name" if doctype == "Contacts" else "account_name"),
		"email": "email",
		"mobile_no": "phone_number" if doctype in ["Lead", "Accounts"] else "phone",
		"city": "city",
		"state": "state",
		"country": "country",
		"owner": "owner_name"
	}
	return field_map.get(filter_field, filter_field)

def get_recipients(campaign):
	doctype_map = {
		"Lead": "Lead",
		"Contact": "Contacts",
		"Account": "Accounts"
	}
	doctype = doctype_map.get(campaign.target_type)
	if not doctype:
		return []

	db_filters = []
	for row in campaign.filters:
		actual_field = get_actual_field_name(doctype, row.field_name)
		meta = frappe.get_meta(doctype)
		if not meta.has_field(actual_field) and meta.has_field(row.field_name):
			actual_field = row.field_name
		
		# If the operator is Like or Not Like, format the value for SQL
		val = row.value
		if row.operator in ["Like", "Not Like"]:
			if not val.startswith("%") and not val.endswith("%"):
				val = f"%{val}%"

		db_filters.append([doctype, actual_field, row.operator, val])

	try:
		records = frappe.get_all(
			doctype,
			filters=db_filters,
			fields=["name", "email", get_actual_field_name(doctype, "lead_name")]
		)
	except Exception as e:
		frappe.log_error(f"Error querying campaign recipients: {str(e)}", "CRM Campaign Filter")
		return []

	recipients = []
	name_field = get_actual_field_name(doctype, "lead_name")
	for rec in records:
		email = rec.get("email")
		if doctype == "Accounts":
			# Search for contacts linked to this Account
			account_name = rec.get("account_name")
			linked_contacts = frappe.db.sql("""
				SELECT email, first_name
				FROM `tabContacts` c
				JOIN `tabContact Company` cc ON cc.parent = c.name
				WHERE cc.company_name = %s
			""", (account_name,), as_dict=True)
			
			if linked_contacts:
				for contact in linked_contacts:
					if contact.get("email"):
						recipients.append({
							"name": contact.get("first_name") or rec.get(name_field) or rec.get("name"),
							"email": contact.get("email"),
							"doctype": doctype,
							"docname": rec.get("name")
						})
			else:
				# Fallback to owner_name if it contains @
				owner_email = rec.get("owner_name") or rec.get("owner")
				if owner_email and "@" in owner_email:
					recipients.append({
						"name": rec.get(name_field) or rec.get("name"),
						"email": owner_email,
						"doctype": doctype,
						"docname": rec.get("name")
					})
		else:
			if email:
				recipients.append({
					"name": rec.get(name_field) or rec.get("name"),
					"email": email,
					"doctype": doctype,
					"docname": rec.get("name")
				})
	return recipients

def render_template(template_doc, recipient_info):
	ref_doc = None
	if recipient_info.get("doctype") and recipient_info.get("docname"):
		try:
			ref_doc = frappe.get_doc(recipient_info["doctype"], recipient_info["docname"])
		except Exception:
			pass

	context = {
		"lead_name": recipient_info.get("name", ""),
		"first_name": "",
		"last_name": "",
		"company_name": "",
		"email": recipient_info.get("email", ""),
		"mobile_no": "",
		"owner": "",
		"current_date": frappe.utils.formatdate(frappe.utils.nowdate(), "yyyy-MM-dd")
	}

	if context["lead_name"]:
		parts = context["lead_name"].split(" ", 1)
		context["first_name"] = parts[0]
		context["last_name"] = parts[1] if len(parts) > 1 else ""

	if ref_doc:
		context["owner"] = ref_doc.get("owner_name") or ref_doc.get("owner") or ""
		if ref_doc.doctype == "Lead":
			context["lead_name"] = ref_doc.get("lead_name") or context["lead_name"]
			if context["lead_name"]:
				parts = context["lead_name"].split(" ", 1)
				context["first_name"] = parts[0]
				context["last_name"] = parts[1] if len(parts) > 1 else ""
			context["company_name"] = ref_doc.get("company_name") or ""
			context["mobile_no"] = ref_doc.get("phone_number") or ""
		elif ref_doc.doctype == "Contacts":
			context["lead_name"] = ref_doc.get("first_name") or context["lead_name"]
			context["first_name"] = ref_doc.get("first_name") or context["first_name"]
			context["last_name"] = ""
			if ref_doc.company_name:
				context["company_name"] = ref_doc.company_name[0].company_name or ""
			context["mobile_no"] = ref_doc.get("phone") or ""
		elif ref_doc.doctype == "Accounts":
			context["lead_name"] = ref_doc.get("account_name") or context["lead_name"]
			context["first_name"] = ref_doc.get("account_name") or context["first_name"]
			context["company_name"] = ref_doc.get("account_name") or ""
			context["mobile_no"] = ref_doc.get("phone_number") or ""

	subject = template_doc.subject or ""
	content = template_doc.email_content or ""
	footer = template_doc.footer_content or ""

	try:
		subject = frappe.render_template(subject, context)
		content = frappe.render_template(content, context)
		if footer:
			footer = frappe.render_template(footer, context)
	except Exception:
		for key, val in context.items():
			placeholder = "{{" + key + "}}"
			subject = subject.replace(placeholder, str(val))
			content = content.replace(placeholder, str(val))
			if footer:
				footer = footer.replace(placeholder, str(val))

	full_html = content
	if footer:
		full_html += "<br><br>" + footer

	return subject, full_html

def inject_tracking(content, queue_id, enable_open=True, enable_click=True):
	if enable_click:
		def replace_link(match):
			url = match.group(2)
			if url.startswith("#") or url.startswith("mailto:") or url.startswith("tel:"):
				return match.group(0)
			tracking_url = f"/api/method/company.company.doctype.crm_email_campaign.crm_email_campaign.track_click?id={queue_id}&url={quote(url)}"
			return f'{match.group(1)}="{tracking_url}"'

		content = re.sub(r'(href)\s*=\s*["\']([^"\']*)["\']', replace_link, content, flags=re.IGNORECASE)

	if enable_open:
		pixel_url = f"/api/method/company.company.doctype.crm_email_campaign.crm_email_campaign.track_open?id={queue_id}"
		pixel_tag = f'<img src="{pixel_url}" width="1" height="1" style="display:none;" alt="" />'
		if "</body>" in content:
			content = content.replace("</body>", f"{pixel_tag}</body>")
		else:
			content += pixel_tag

	return content

@frappe.whitelist(allow_guest=True)
def track_open(id):
	if id:
		try:
			queue = frappe.get_doc("CRM Email Queue", id)
			if not queue.opened:
				queue.opened = 1
				queue.opened_on = frappe.utils.now()
				queue.save(ignore_permissions=True)
				if queue.campaign:
					campaign = frappe.get_doc("CRM Email Campaign", queue.campaign)
					campaign.open_count = frappe.db.count("CRM Email Queue", {"campaign": campaign.name, "opened": 1})
					campaign.save(ignore_permissions=True)
		except Exception as e:
			frappe.log_error(f"Error tracking open: {str(e)}", "CRM Email Open Tracking")

	frappe.response["type"] = "binary"
	frappe.response["filename"] = "pixel.gif"
	frappe.response["filecontent"] = b'\x47\x49\x46\x38\x39\x61\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00\x21\xf9\x04\x01\x00\x00\x00\x00\x2c\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02\x44\x01\x00\x3b'

@frappe.whitelist(allow_guest=True)
def track_click(id, url):
	if id:
		try:
			queue = frappe.get_doc("CRM Email Queue", id)
			if not queue.clicked:
				queue.clicked = 1
				queue.clicked_on = frappe.utils.now()
				queue.save(ignore_permissions=True)
				if queue.campaign:
					campaign = frappe.get_doc("CRM Email Campaign", queue.campaign)
					campaign.click_count = frappe.db.count("CRM Email Queue", {"campaign": campaign.name, "clicked": 1})
					campaign.save(ignore_permissions=True)
		except Exception as e:
			frappe.log_error(f"Error tracking click: {str(e)}", "CRM Email Click Tracking")

	frappe.local.response["type"] = "redirect"
	frappe.local.response["location"] = url

@frappe.whitelist(allow_guest=True)
def unsubscribe(email):
	return "<h3>You have been successfully unsubscribed from our mailing list.</h3>"

@frappe.whitelist()
def get_filter_value_options(target_type, field_name):
	doctype_map = {
		"Lead": "Lead",
		"Contact": "Contacts",
		"Account": "Accounts"
	}
	doctype = doctype_map.get(target_type)
	if not doctype:
		return []

	actual_field = get_actual_field_name(doctype, field_name)

	# Handle Workflow Status specifically by querying active workflow states
	if field_name == "workflow_status" or actual_field == "workflow_state":
		workflow_name = frappe.db.get_value("Workflow", {"document_type": doctype, "is_active": 1}, "name")
		if workflow_name:
			states = frappe.get_all("Workflow Document State", filters={"parent": workflow_name}, fields=["state"])
			options = [s.get("state") for s in states if s.get("state")]
			if options:
				return sorted(list(set(options)))

	meta = frappe.get_meta(doctype)
	if not meta.has_field(actual_field):
		if meta.has_field(field_name):
			actual_field = field_name
		else:
			return []

	try:
		values = frappe.get_all(
			doctype,
			fields=[actual_field],
			distinct=True,
			filters=[[actual_field, "is", "set"]]
		)
	except Exception:
		try:
			values = frappe.get_all(
				doctype,
				fields=[actual_field],
				distinct=True,
				filters=[[actual_field, "!=", ""]]
			)
		except Exception:
			return []

	options = []
	for val in values:
		v = val.get(actual_field)
		if v:
			options.append(str(v))

	return sorted(list(set(options)))

@frappe.whitelist()
def calculate_recipients(campaign_name):
	campaign = frappe.get_doc("CRM Email Campaign", campaign_name)
	recipients = get_recipients(campaign)
	campaign.total_recipients = len(recipients)
	campaign.save(ignore_permissions=True)
	return campaign.total_recipients

@frappe.whitelist()
def get_campaign_recipients(campaign_name):
	campaign = frappe.get_doc("CRM Email Campaign", campaign_name)
	if campaign.status != "Draft":
		queue_records = frappe.get_all(
			"CRM Email Queue",
			filters={"campaign": campaign.name},
			fields=["recipient_name", "recipient_email", "status", "opened", "clicked", "error_message"]
		)
		return {
			"source": "queue",
			"recipients": queue_records
		}
	else:
		recipients = get_recipients(campaign)
		# format to match return structure
		formatted = []
		for r in recipients:
			formatted.append({
				"recipient_name": r["name"],
				"recipient_email": r["email"],
				"status": "Pending",
				"opened": 0,
				"clicked": 0
			})
		return {
			"source": "filters",
			"recipients": formatted
		}

def process_campaign(campaign_name):
	campaign = frappe.get_doc("CRM Email Campaign", campaign_name)
	import time

	max_batch_size = 100
	batch_delay = 5
	max_retries = 3
	auto_retry = True

	try:
		settings = frappe.get_single("CRM Email Settings")
		max_batch_size = int(settings.max_emails_per_batch or 100)
		batch_delay = int(settings.batch_delay or 5)
		max_retries = int(settings.maximum_retry_count or 3)
		auto_retry = bool(settings.auto_retry_failed_emails)
	except Exception:
		pass

	while True:
		campaign.reload()
		if campaign.status in ["Paused", "Cancelled"]:
			break

		db_filters = [
			["campaign", "=", campaign.name],
			["status", "in", ["Pending", "Failed"]]
		]
		
		if not auto_retry:
			db_filters = [
				["campaign", "=", campaign.name],
				["status", "=", "Pending"]
			]

		queues = frappe.get_all(
			"CRM Email Queue",
			filters=db_filters,
			fields=["name", "status", "retry_count"],
			limit=max_batch_size
		)

		if not queues:
			break

		processed_any = False
		for row in queues:
			campaign.reload()
			if campaign.status in ["Paused", "Cancelled"]:
				break

			if row.status == "Failed" and (row.retry_count or 0) >= max_retries:
				continue

			queue_doc = frappe.get_doc("CRM Email Queue", row.name)
			processed_any = True

			try:
				queue_doc.status = "Processing"
				queue_doc.retry_count = (queue_doc.retry_count or 0) + 1
				queue_doc.save(ignore_permissions=True)

				send_campaign_email(queue_doc)

				queue_doc.status = "Sent"
				queue_doc.sent_on = frappe.utils.now()
				queue_doc.save(ignore_permissions=True)
			except Exception as e:
				queue_doc.status = "Failed"
				queue_doc.error_message = str(e)
				queue_doc.save(ignore_permissions=True)

			campaign.sent_count = frappe.db.count("CRM Email Queue", {"campaign": campaign.name, "status": "Sent"})
			campaign.failed_count = frappe.db.count("CRM Email Queue", {"campaign": campaign.name, "status": "Failed"})
			campaign.save(ignore_permissions=True)

		if not processed_any:
			break

		time.sleep(batch_delay)

	remaining = frappe.db.count(
		"CRM Email Queue",
		{
			"campaign": campaign.name,
			"status": ["in", ["Pending", "Processing"]]
		}
	)

	if remaining == 0 and campaign.status == "Running":
		campaign.status = "Completed"
		campaign.save(ignore_permissions=True)

@frappe.whitelist()
def start_campaign(campaign_name):
	campaign = frappe.get_doc("CRM Email Campaign", campaign_name)

	if campaign.status not in ["Draft", "Scheduled", "Paused"]:
		frappe.throw("Campaign cannot be started")

	if campaign.status == "Draft":
		recipients = get_recipients(campaign)
		campaign.total_recipients = len(recipients)
		if not recipients:
			frappe.throw("No recipients match the filter criteria")

		template = frappe.get_doc("CRM Email Template", campaign.email_template)
		for rec in recipients:
			subj, body = render_template(template, rec)
			queue_doc = frappe.new_doc("CRM Email Queue")
			queue_doc.campaign = campaign.name
			queue_doc.email_template = campaign.email_template
			queue_doc.recipient_name = rec["name"]
			queue_doc.recipient_email = rec["email"]
			queue_doc.reference_doctype = rec["doctype"]
			queue_doc.reference_name = rec["docname"]
			queue_doc.subject = subj
			queue_doc.email_content = body
			queue_doc.status = "Pending"
			queue_doc.queued_on = frappe.utils.now()
			queue_doc.insert(ignore_permissions=True)

	campaign.status = "Running"
	campaign.save(ignore_permissions=True)

	frappe.enqueue(
		"company.company.doctype.crm_email_campaign.crm_email_campaign.process_campaign",
		campaign_name=campaign.name,
		queue="long"
	)

	return {
		"message": "Campaign started"
	}

@frappe.whitelist()
def pause_campaign(campaign_name):
	campaign = frappe.get_doc("CRM Email Campaign", campaign_name)

	if campaign.status != "Running":
		frappe.throw("Only running campaigns can be paused")

	campaign.status = "Paused"
	campaign.save(ignore_permissions=True)

	return {
		"message": "Campaign paused"
	}

@frappe.whitelist()
def cancel_campaign(campaign_name):
	campaign = frappe.get_doc("CRM Email Campaign", campaign_name)

	if campaign.status == "Completed":
		frappe.throw("Completed campaign cannot be cancelled")

	campaign.status = "Cancelled"
	campaign.save(ignore_permissions=True)

	return {
		"message": "Campaign cancelled"
	}

@frappe.whitelist()
def send_campaign_email(queue_doc):
	attachments = []
	if queue_doc.email_template:
		template = frappe.get_cached_doc("CRM Email Template", queue_doc.email_template)
		for att in template.attachments:
			if att.file:
				attachments.append(att.file)

	sender = None
	reply_to = None
	enable_open = True
	enable_click = True

	if queue_doc.email_template:
		template = frappe.get_cached_doc("CRM Email Template", queue_doc.email_template)
		if template.sender_name:
			if template.reply_to_email:
				sender = f"{template.sender_name} <{template.reply_to_email}>"
			else:
				sender = template.sender_name
		if template.reply_to_email:
			reply_to = template.reply_to_email
		enable_open = bool(template.enable_open_tracking)
		enable_click = bool(template.enable_click_tracking)

	# Override tracking & default email settings from CRM Email Settings if defined
	try:
		settings = frappe.get_single("CRM Email Settings")
		if not settings.enable_open_tracking:
			enable_open = False
		if not settings.enable_click_tracking:
			enable_click = False
		if settings.default_email_account and not sender:
			email_account = frappe.get_cached_doc("Email Account", settings.default_email_account)
			if email_account.email_id:
				sender = f"{email_account.name or email_account.email_id} <{email_account.email_id}>"
	except Exception:
		pass

	content = queue_doc.email_content
	content = inject_tracking(content, queue_doc.name, enable_open, enable_click)

	if queue_doc.email_template:
		template = frappe.get_cached_doc("CRM Email Template", queue_doc.email_template)
		if template.enable_unsubscribe:
			unsub_link = f'<br><br><div style="text-align: center; font-size: 12px; color: #888888;"><a href="/api/method/company.company.doctype.crm_email_campaign.crm_email_campaign.unsubscribe?email={quote(queue_doc.recipient_email)}">Unsubscribe</a></div>'
			content += unsub_link

	mail_args = {
		"recipients": [queue_doc.recipient_email],
		"subject": queue_doc.subject,
		"content": content,
		"delayed": False
	}
	if sender:
		mail_args["sender"] = sender
	if reply_to:
		mail_args["reply_to"] = reply_to
	if attachments:
		mail_args["attachments"] = attachments

	frappe.sendmail(**mail_args)