# Copyright (c) 2026, Innoblitz and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import now_datetime

class PersonalityEvent(Document):
	def autoname(self):
		count = frappe.db.count("Personality Event", {"employee": self.employee})
		self.name = f"PE-{self.employee}-{count + 1}"

	def before_insert(self):
		if not self.hr_user:
			self.hr_user = frappe.session.user

	def validate(self):
		self.calculate_score_change()

	def on_submit(self):
		frappe.log_error(f"On Submit Triggered for {self.name}", "Personality Event Debug")
		self.update_employee_score()

	def on_cancel(self):
		self.revert_employee_score()

	def calculate_score_change(self):
		if not self.trait:
			return
			
		trait = frappe.get_doc("Personality Trait", self.trait)
		if self.evaluation_type == "Agree":
			self.score_change = trait.reward_score or 2
		elif self.evaluation_type == "Disagree":
			# Ensure penalty is negative
			penalty = trait.penalty_score or 5
			self.score_change = -abs(penalty)
		else:
			self.score_change = 0

	def update_employee_score(self):
		if getattr(self, "_score_log_created", False):
			return
		
		# Robust database check to prevent duplicate logs for the same event
		if frappe.db.exists("Personality Score Log", {"personality_event": self.name}):
			return

		employee = frappe.get_doc("Employee", self.employee)
		current_score = employee.personality_score if employee.personality_score is not None else 100
		new_score = current_score + (self.score_change or 0)

		if new_score > 100:
			new_score = 100
		if new_score < 0:
			new_score = 0

		# Update Employee
		frappe.db.set_value("Employee", self.employee, {
			"personality_score": new_score,
			"personality_status": self.get_status_for_score(new_score)
		})

		# Create Log
		log = frappe.get_doc({
			"doctype": "Personality Score Log",
			"employee": self.employee,
			"previous_score": current_score,
			"change": self.score_change,
			"new_score": new_score,
			"reason": f"{self.evaluation_type} on {self.trait}",
			"personality_event": self.name,
			"date": now_datetime()
		})
		log.insert(ignore_permissions=True)
		self._score_log_created = True

	def revert_employee_score(self):
		employee = frappe.get_doc("Employee", self.employee)
		current_score = employee.personality_score if employee.personality_score is not None else 100
		
		# Revert the change (subtract what was added, add what was subtracted)
		new_score = current_score - (self.score_change or 0)

		if new_score > 100:
			new_score = 100
		if new_score < 0:
			new_score = 0

		# Update Employee
		frappe.db.set_value("Employee", self.employee, {
			"personality_score": new_score,
			"personality_status": self.get_status_for_score(new_score)
		})

		# Create Log
		log = frappe.get_doc({
			"doctype": "Personality Score Log",
			"employee": self.employee,
			"previous_score": current_score,
			"change": -(self.score_change or 0),
			"new_score": new_score,
			"reason": f"CANCELLED: {self.evaluation_type} on {self.trait}",
			"personality_event": self.name,
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
