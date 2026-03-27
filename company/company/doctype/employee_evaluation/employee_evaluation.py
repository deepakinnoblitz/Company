# Copyright (c) 2026, Innoblitz and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import now_datetime

class EmployeeEvaluation(Document):
	def autoname(self):
		count = frappe.db.count("Employee Evaluation", {"employee": self.employee})
		self.name = f"EE-{self.employee}-{count + 1}"

	def before_insert(self):
		if not self.hr_user:
			self.hr_user = frappe.session.user

	def validate(self):
		self.calculate_score_change()

	def on_submit(self):
		frappe.log_error(f"On Submit Triggered for {self.name}", "Employee Evaluation Debug")
		self.update_employee_score()

	def on_cancel(self):
		self.revert_employee_score()

	def calculate_score_change(self):
		if not self.trait or not self.evaluation_type:
			return
			
		trait = frappe.get_doc("Evaluation Trait", self.trait)
		
		# 1. Check for trait-specific override in child table
		score = None
		for row in trait.evaluation_scores:
			if row.evaluation_point == self.evaluation_type:
				score = row.score
				break
		
		# 2. Fall back to master default score if no override exists
		if score is None:
			point = frappe.get_doc("Evaluation Point", self.evaluation_type)
			score = point.default_score or 0
			
		self.score_change = score

	def update_employee_score(self):
		if getattr(self, "_score_log_created", False):
			return
		
		# Robust database check to prevent duplicate logs for the same event
		if frappe.db.exists("Employee Evaluation Score Log", {"employee_evaluation": self.name}):
			return

		employee = frappe.get_doc("Employee", self.employee)
		current_score = employee.evaluation_score if employee.evaluation_score is not None else 100
		new_score = current_score + (self.score_change or 0)

		if new_score > 100:
			new_score = 100
		if new_score < 0:
			new_score = 0

		# Update Employee
		frappe.db.set_value("Employee", self.employee, {
			"evaluation_score": new_score,
			"evaluation_status": self.get_status_for_score(new_score)
		})

		# Create Log
		log = frappe.get_doc({
			"doctype": "Employee Evaluation Score Log",
			"employee": self.employee,
			"previous_score": current_score,
			"change": self.score_change,
			"new_score": new_score,
			"reason": f"{self.evaluation_type} on {self.trait}{': ' + self.remarks if self.remarks else ''}",
			"employee_evaluation": self.name,
			"date": now_datetime()
		})
		log.insert(ignore_permissions=True)
		self._score_log_created = True

	def revert_employee_score(self):
		employee = frappe.get_doc("Employee", self.employee)
		current_score = employee.evaluation_score if employee.evaluation_score is not None else 100
		
		# Revert the change (subtract what was added, add what was subtracted)
		new_score = current_score - (self.score_change or 0)

		if new_score > 100:
			new_score = 100
		if new_score < 0:
			new_score = 0

		# Update Employee
		frappe.db.set_value("Employee", self.employee, {
			"evaluation_score": new_score,
			"evaluation_status": self.get_status_for_score(new_score)
		})

		# Create Log
		log = frappe.get_doc({
			"doctype": "Employee Evaluation Score Log",
			"employee": self.employee,
			"previous_score": current_score,
			"change": -(self.score_change or 0),
			"new_score": new_score,
			"reason": f"CANCELLED: {self.evaluation_type} on {self.trait}{': ' + self.remarks if self.remarks else ''}",
			"employee_evaluation": self.name,
			"date": now_datetime()
		})
		log.insert(ignore_permissions=True)

	def get_status_for_score(self, score):
		if score >= 90:
			return "Excellent"
		elif score >= 75:
			return "Good"
		elif score >= 60:
			return "Average"
		else:
			return "Needs Improvement"

@frappe.whitelist()
def reset_all_employee_scores(password):
	# Verify against Administrator password
	from frappe.utils.password import check_password
	try:
		check_password("Administrator", password)
	except frappe.AuthenticationError:
		frappe.throw("Incorrect Administrator Password")
	
	employees = frappe.get_all("Employee", filters={"status": "Active"}, fields=["name", "employee_name", "evaluation_score"])
	
	results = []
	for emp in employees:
		prev_score = emp.evaluation_score if emp.evaluation_score is not None else 100
		if prev_score == 100:
			continue
			
		# Update Employee
		frappe.db.set_value("Employee", emp.name, {
			"evaluation_score": 100,
			"evaluation_status": "Excellent"
		})
		
		# Create Log
		log = frappe.get_doc({
			"doctype": "Employee Evaluation Score Log",
			"employee": emp.name,
			"previous_score": prev_score,
			"change": 100 - prev_score,
			"new_score": 100,
			"reason": "Administrative Reset to 100",
			"date": now_datetime()
		})
		log.insert(ignore_permissions=True)
		
		results.append({
			"employee": emp.name,
			"employee_name": emp.employee_name,
			"previous_score": prev_score,
			"new_score": 100
		})
	
	return results
	
	return "Successfully reset all employee scores to 100"
