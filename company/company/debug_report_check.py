import frappe
from frappe.desk.query_report import run
import json

def check_report():
    try:
        # Simulate the API call
        res = run("Attendance Report", "{}")
        print(f"KEYS: {list(res.keys())}")
        result = res.get("result", [])
        print(f"RESULT_COUNT: {len(result)}")
        if result:
            print(f"FIRST_ROW: {result[0]}")
    except Exception as e:
        print(f"ERROR: {str(e)}")
        import traceback
        print(traceback.format_exc())

if __name__ == "__main__":
    frappe.init(site="erp.localhost.innoblitz")
    frappe.connect()
    check_report()
    frappe.destroy()
