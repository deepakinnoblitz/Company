import frappe
frappe.init(site="erp.localhost.innoblitz:8025")
frappe.connect()
res = frappe.db.sql("SELECT parent, parenttype FROM `tabHR Remainder Selected Employee` LIMIT 1", as_dict=1)
print(res)
