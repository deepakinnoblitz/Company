import frappe
frappe.init(site="erp.localhost.innoblitz:8025")
frappe.connect()
res = frappe.db.sql("SELECT name, parent, parenttype, employee FROM `tabHR Remainder Selected Employee` LIMIT 20", as_dict=1)
print(f"ROWS: {res}")
# Also check parent names in Configuration table
config_rows = frappe.db.sql("SELECT name, message FROM `tabHR Remainder Configuration` LIMIT 20", as_dict=1)
print(f"CONFIG ROWS: {config_rows}")
