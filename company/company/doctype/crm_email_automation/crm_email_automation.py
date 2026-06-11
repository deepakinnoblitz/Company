import frappe
from frappe.model.document import Document
from datetime import datetime, timedelta
import calendar

class CRMEmailAutomation(Document):
	def validate(self):
		# Sync is_active check with status
		if self.is_active:
			if self.status in ["Draft", "Paused"]:
				self.status = "Active"
		else:
			if self.status == "Active":
				self.status = "Paused"

		# If active, calculate next run on
		if self.status == "Active" and self.start_date and self.run_time:
			self.next_run_on = calculate_next_run(
				self.frequency,
				self.start_date,
				self.run_time,
				self.week_day,
				self.day_of_month,
				self.last_run_on
			)
		else:
			self.next_run_on = None

def add_months(sourcedate, months):
	month = sourcedate.month - 1 + months
	year = sourcedate.year + month // 12
	month = month % 12 + 1
	day = min(sourcedate.day, calendar.monthrange(year, month)[1])
	return datetime(year, month, day, sourcedate.hour, sourcedate.minute, sourcedate.second)

def set_day_of_month(sourcedate, day):
	max_days = calendar.monthrange(sourcedate.year, sourcedate.month)[1]
	target_day = min(day, max_days)
	return sourcedate.replace(day=target_day)

def calculate_next_run(frequency, start_date, run_time_str, week_day=None, day_of_month=None, last_run=None):
	current_time = frappe.utils.now_datetime()
	
	# Parse run_time
	time_parts = [int(p) for p in str(run_time_str).split(":")]
	run_hour = time_parts[0]
	run_minute = time_parts[1] if len(time_parts) > 1 else 0
	run_second = time_parts[2] if len(time_parts) > 2 else 0

	base_date = frappe.utils.getdate(start_date)
	if last_run:
		base_date = max(base_date, frappe.utils.getdate(last_run))

	next_run = datetime.combine(base_date, datetime.min.time()).replace(
		hour=run_hour, minute=run_minute, second=run_second
	)

	# Adjust if next_run falls in past or matches last run
	iterations = 0
	while next_run <= current_time and iterations < 1000:
		iterations += 1
		if frequency == "Once":
			break
		elif frequency == "Daily":
			next_run += timedelta(days=1)
		elif frequency == "Weekly":
			next_run += timedelta(days=1)
			wd_map = {
				"Monday": 0, "Tuesday": 1, "Wednesday": 2, "Thursday": 3,
				"Friday": 4, "Saturday": 5, "Sunday": 6
			}
			target_wd = wd_map.get(week_day, 0)
			while next_run.weekday() != target_wd:
				next_run += timedelta(days=1)
		elif frequency == "Monthly":
			next_run = add_months(next_run, 1)
			target_day = int(day_of_month) if day_of_month else 1
			next_run = set_day_of_month(next_run, target_day)
		elif frequency == "Yearly":
			next_run = next_run.replace(year=next_run.year + 1)

	return next_run

@frappe.whitelist()
def process_email_automations():
	# Check if email automation is globally enabled
	try:
		settings = frappe.get_single("CRM Email Settings")
		if not settings.enable_email_automation:
			return
	except Exception:
		pass

	now = frappe.utils.now_datetime()
	
	# Fetch active automations whose schedule has reached
	active_automations = frappe.get_all(
		"CRM Email Automation",
		filters={
			"status": "Active",
			"next_run_on": ["<=", now]
		},
		fields=["name"]
	)

	for row in active_automations:
		auto_doc = frappe.get_doc("CRM Email Automation", row.name)
		
		try:
			# 1. Create separate Campaign if enabled
			campaign_name = f"{auto_doc.automation_name} - {frappe.utils.nowdate()}"
			
			campaign = frappe.new_doc("CRM Email Campaign")
			campaign.campaign_name = campaign_name
			campaign.email_template = auto_doc.email_template
			campaign.target_type = auto_doc.target_type
			campaign.subject = auto_doc.subject_override or ""
			campaign.status = "Draft"
			campaign.send_immediately = auto_doc.send_immediately
			campaign.insert(ignore_permissions=True)

			# Copy filters
			for f in auto_doc.filters:
				campaign.append("filters", {
					"field_name": f.field_name,
					"operator": f.operator,
					"value": f.value
				})
			campaign.save(ignore_permissions=True)

			# 2. Calculate recipients & trigger Campaign Sending
			from company.company.doctype.crm_email_campaign.crm_email_campaign import calculate_recipients, start_campaign
			recipients_count = calculate_recipients(campaign.name)
			
			if recipients_count > 0:
				start_campaign(campaign.name)
			else:
				# Campaign will mark itself completed/empty
				campaign.status = "Completed"
				campaign.save(ignore_permissions=True)

			# 3. Update Automation metrics
			auto_doc.last_campaign = campaign.name
			auto_doc.total_runs = (auto_doc.total_runs or 0) + 1
			auto_doc.last_run_on = now
			auto_doc.total_recipients = (auto_doc.total_recipients or 0) + recipients_count

			# 4. Schedule next run or complete automation
			if auto_doc.frequency == "Once":
				auto_doc.status = "Completed"
				auto_doc.is_active = 0
				auto_doc.next_run_on = None
			else:
				# Calculate new next run time
				auto_doc.next_run_on = calculate_next_run(
					auto_doc.frequency,
					auto_doc.start_date,
					auto_doc.run_time,
					auto_doc.week_day,
					auto_doc.day_of_month,
					now
				)
			
			auto_doc.save(ignore_permissions=True)
			
		except Exception as e:
			frappe.log_error(f"Error processing email automation {auto_doc.name}: {str(e)}", "CRM Email Automation Error")
			
			if auto_doc.auto_pause_on_error:
				auto_doc.status = "Failed"
				auto_doc.is_active = 0
				auto_doc.next_run_on = None
				auto_doc.save(ignore_permissions=True)
