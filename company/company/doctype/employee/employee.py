import frappe
from frappe.model.document import Document

class Employee(Document):
	def on_update(self):
		if self.user:
			frappe.db.set_value("User", self.user, "user_image", self.profile_picture)
