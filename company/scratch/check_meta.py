import frappe
frappe.init(site="erp.localhost.innoblitz:8025")
frappe.connect()
meta = frappe.get_meta("HR Remainder Configuration")
print(f"Fields in HR Remainder Configuration: {[f.fieldname for f in meta.fields]}")
print(f"Has selected_employees: {meta.get_field('selected_employees') is not None}")
