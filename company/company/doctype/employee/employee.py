import frappe
from frappe.model.document import Document

class Employee(Document):
	def validate(self):
		self.validate_duplicate_components()

	def validate_duplicate_components(self):
		components = []
		for table in ["earnings", "deductions"]:
			for row in self.get(table):
				if row.component_name in components:
					frappe.throw(f"Duplicate component name: {row.component_name}")
				components.append(row.component_name)

	def on_update(self):
		if self.user:
			frappe.db.set_value("User", self.user, "user_image", self.profile_picture)
