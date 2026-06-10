import frappe
from frappe.model.document import Document

class CRMEmailSettings(Document):
	pass

@frappe.whitelist()
def daily_queue_cleanup():
	settings = frappe.get_single("CRM Email Settings")
	if settings.auto_delete_old_queue_records and settings.queue_retention_days:
		retention_days = int(settings.queue_retention_days)
		cutoff_date = frappe.utils.add_days(frappe.utils.nowdate(), -retention_days)
		
		deleted_count = frappe.db.delete(
			"CRM Email Queue",
			filters={
				"creation": ["<", cutoff_date]
			}
		)
		
		if settings.enable_debug_logs:
			frappe.log_error(
				f"CRM Email Queue cleanup processed: deleted {deleted_count} records older than {retention_days} days.",
				"CRM Email Queue Cleanup"
			)
