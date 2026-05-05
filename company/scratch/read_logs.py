import frappe
import json
frappe.init(site="erp.localhost.innoblitz:8025")
frappe.connect()
logs = frappe.get_all("Error Log", fields=["title", "message", "creation"], order_by="creation desc", limit=5)
for log in logs:
    print(f"TITLE: {log.title}")
    print(f"CREATION: {log.creation}")
    print(f"MESSAGE: {log.message[:500]}...")
    print("-" * 50)
