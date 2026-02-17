# Copyright (c) 2025, deepak and contributors
# For license information, please see license.txt

import frappe
from frappe import _


def execute(filters: dict | str | None = None):
	"""Return columns and data for the report."""
	import json
	if isinstance(filters, str):
		filters = json.loads(filters)
	if not filters:
		filters = {}

	columns = get_columns()
	data = get_data(filters)

	return columns, data


def get_columns() -> list[dict]:
	"""Return columns for the report."""
	return [
		{"label": _("Date"), "fieldname": "attendance_date", "fieldtype": "Date", "width": 120},
		{"label": _("Employee"), "fieldname": "employee", "fieldtype": "Link", "options": "Employee", "width": 200},
		{"label": _("Employee Name"), "fieldname": "employee_name", "fieldtype": "Data", "width": 200},
		{"label": _("Status"), "fieldname": "status", "fieldtype": "Select", "width": 100},
		{"label": _("In Time"), "fieldname": "in_time", "fieldtype": "Time", "width": 100},
		{"label": _("Out Time"), "fieldname": "out_time", "fieldtype": "Time", "width": 100},
		{"label": _("Working Hours"), "fieldname": "working_hours_display", "fieldtype": "Data", "width": 120},
		{"label": _("Overtime"), "fieldname": "overtime_display", "fieldtype": "Data", "width": 120},
		{"label": _("Manual"), "fieldname": "manual", "fieldtype": "Check", "width": 80},
		{"label": _("Name"), "fieldname": "name", "fieldtype": "Data", "width": 120},
	]


def get_data(filters: dict | None) -> list[dict]:
	"""Return data for the report."""
	conditions = get_conditions(filters)
	data = frappe.db.get_all(
		"Attendance",
		fields=[
			"attendance_date", "employee", "employee_name", "status",
			"in_time", "out_time", "working_hours_display", "overtime_display",
			"manual", "name"
		],
		filters=conditions,
		order_by="attendance_date desc"
	)
	return data


def get_conditions(filters: dict | None) -> dict:
	"""Return filters for the query."""
	conditions = {}
	if not filters:
		return conditions

	if filters.get("from_date"):
		conditions["attendance_date"] = [">=", filters.get("from_date")]
	if filters.get("to_date"):
		if "attendance_date" in conditions:
			conditions["attendance_date"] = ["between", [filters.get("from_date"), filters.get("to_date")]]
		else:
			conditions["attendance_date"] = ["<=", filters.get("to_date")]
	if filters.get("employee") and filters.get("employee") != "all":
		conditions["employee"] = filters.get("employee")
	if filters.get("status") and filters.get("status") != "all":
		conditions["status"] = filters.get("status")

	return conditions
