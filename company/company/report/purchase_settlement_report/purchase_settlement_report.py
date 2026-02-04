import frappe
from frappe.utils import flt
import json


def execute(filters=None):

    # Convert JSON to dict (Frappe sends filters as string)
    if isinstance(filters, str):
        filters = json.loads(filters)

    filters = filters or {}

    columns = get_columns()
    data = get_data(filters)
    summary = get_summary(data)

    # Return 5 values → (columns, rows, message, chart, summary)
    return columns, data, None, None, summary


# ---------------------------------------------------
#  COLUMNS
# ---------------------------------------------------
def get_columns():
    return [
        {"label": "Purchase", "fieldname": "purchase", "fieldtype": "Link", "options": "Purchase", "width": 150},
        {"label": "Bill Date", "fieldname": "bill_date", "fieldtype": "Date", "width": 110},

        {"label": "Vendor", "fieldname": "vendor", "fieldtype": "Link", "options": "Contacts", "width": 150},
        {"label": "Vendor Name", "fieldname": "vendor_name", "fieldtype": "Data", "width": 150},

        {"label": "Grand Total", "fieldname": "grand_total", "fieldtype": "Currency", "width": 120},
        {"label": "Paid Amount", "fieldname": "amount_paid", "fieldtype": "Currency", "width": 130},
        {"label": "Pending Amount", "fieldname": "amount_pending", "fieldtype": "Currency", "width": 120},

        {"label": "Last Payment Date", "fieldname": "last_payment_date", "fieldtype": "Date", "width": 130},
        {"label": "Payment Mode", "fieldname": "payment_mode", "fieldtype": "Data", "width": 120},
    ]


# ---------------------------------------------------
#  MAIN DATA
# ---------------------------------------------------
def get_data(filters):

    conditions = "1=1"

    if filters.get("from_date"):
        conditions += f" AND p.bill_date >= '{filters['from_date']}'"

    if filters.get("to_date"):
        conditions += f" AND p.bill_date <= '{filters['to_date']}'"

    if filters.get("vendor"):
        conditions += f" AND (p.vendor_name LIKE '%%{filters['vendor']}%%' OR c.first_name LIKE '%%{filters['vendor']}%%')"

    if filters.get("purchase"):
        conditions += f" AND (p.name LIKE '%%{filters['purchase']}%%' OR p.bill_no LIKE '%%{filters['purchase']}%%')"

    purchases = frappe.db.sql(f"""
        SELECT
            p.name,
            p.bill_date,
            p.vendor_name AS vendor,
            c.first_name AS vendor_name,
            p.grand_total
        FROM `tabPurchase` p
        LEFT JOIN `tabContacts` c ON p.vendor_name = c.name
        WHERE {conditions}
        ORDER BY p.bill_date DESC
    """, as_dict=True)

    if not purchases:
        return []

    purchase_list = [p.name for p in purchases]

    # Collections (Payments)
    collections = frappe.db.sql("""
        SELECT
            pc.purchase,
            SUM(pc.amount_collected) AS paid,
            MAX(pc.collection_date) AS last_date,
            MAX(pc.mode_of_payment) AS payment_mode
        FROM `tabPurchase Collection` pc
        WHERE pc.purchase IN %(pur)s
        GROUP BY pc.purchase
    """, {"pur": purchase_list}, as_dict=True)

    paid_map = {c.purchase: c for c in collections}

    final_data = []

    for p in purchases:

        c = paid_map.get(p.name, {})

        paid = flt(c.get("paid", 0))
        pending = flt(p.grand_total) - paid

        final_data.append({
            "purchase": p.name,
            "bill_date": p.bill_date,
            "vendor": p.vendor,
            "vendor_name": p.vendor_name,

            "grand_total": p.grand_total,
            "amount_paid": paid,
            "amount_pending": pending,

            "last_payment_date": c.get("last_date"),
            "payment_mode": c.get("payment_mode"),
        })

    return final_data


# ---------------------------------------------------
#  SUMMARY CARDS
# ---------------------------------------------------
def get_summary(data):

    total_pur = sum(flt(d.get("grand_total")) for d in data)
    total_paid = sum(flt(d.get("amount_paid")) for d in data)
    total_pending = sum(flt(d.get("amount_pending")) for d in data)

    return [
        {
            "label": "Total Purchase Amount",
            "value": total_pur,
            "indicator": "blue",
            "datatype": "Currency",
        },
        {
            "label": "Total Paid",
            "value": total_paid,
            "indicator": "green",
            "datatype": "Currency",
        },
        {
            "label": "Total Pending",
            "value": total_pending,
            "indicator": "red",
            "datatype": "Currency",
        }
    ]