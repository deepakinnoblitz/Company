import frappe
frappe.init(site="erp.localhost.innoblitz:8025")
frappe.connect()
name = "e5h51l3n10"
res = frappe.db.sql(f"SELECT * FROM `tabHR Remainder Selected Employee` WHERE parent='{name}'", as_dict=1)
print(f"Employees for {name}: {res}")
all_rows = frappe.db.sql("SELECT name, parent, parenttype FROM `tabHR Remainder Selected Employee` LIMIT 10", as_dict=1)
print(f"All Rows: {all_rows}")
