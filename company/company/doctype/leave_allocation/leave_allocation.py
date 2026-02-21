# Copyright (c) 2025, deepak and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import flt

class LeaveAllocation(Document):
	def validate(self):
		self.validate_balance()
		self.validate_overlap()

	def validate_balance(self):
		if flt(self.total_leaves_allocated) < flt(self.total_leaves_taken):
			frappe.throw(_("Total Leaves Allocated ({0}) cannot be less than Total Leaves Taken ({1})")
						 .format(self.total_leaves_allocated, self.total_leaves_taken))

	def validate_overlap(self):
		if not self.from_date or not self.to_date:
			return

		overlapping_allocation = frappe.db.sql("""
			SELECT name
			FROM `tabLeave Allocation`
			WHERE employee = %s
			AND leave_type = %s
			AND docstatus < 2
			AND name != %s
			AND (
				(%s BETWEEN from_date AND to_date) OR
				(%s BETWEEN from_date AND to_date) OR
				(from_date BETWEEN %s AND %s)
			)
		""", (self.employee, self.leave_type, self.name or "New", 
			  self.from_date, self.to_date, self.from_date, self.to_date), as_dict=True)

		if overlapping_allocation:
			frappe.throw(_("Employee {0} already has a {1} allocation for an overlapping period: {2}")
						 .format(self.employee, self.leave_type, overlapping_allocation[0].name))

	def on_update(self):
		self.sync_manual_changes()

	def sync_manual_changes(self):
		# We only care about Paid Leave carry-forward sync
		if self.leave_type != "Paid Leave":
			return

		before = self.get_doc_before_save()
		if not before:
			return

		# Detect changes
		delta_alloc = flt(self.total_leaves_allocated) - flt(before.total_leaves_allocated)
		delta_taken = flt(self.total_leaves_taken) - flt(before.total_leaves_taken)

		# Net delta for future carry-forward:
		# Increase in allocated = more to carry forward (+)
		# Increase in taken = less to carry forward (-)
		total_delta = delta_alloc - delta_taken

		if total_delta != 0:
			from company.company.api import sync_future_leave_allocations
			# sync_future_leave_allocations handles the recursion and reset points
			sync_future_leave_allocations(self.employee, self.leave_type, self.from_date, -total_delta)
			# Note: sync_future_leave_allocations subtracts the delta from future months
			# So if total_delta is +1 (increase in balance), we pass -1 so it subtracts -1 (meaning adds 1).
			# Let's double check sync_future_leave_allocations implementation.

