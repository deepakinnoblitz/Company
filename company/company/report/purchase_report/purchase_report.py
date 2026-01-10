import frappe
import json

def execute(filters=None):

    # Convert JSON to dict
    if isinstance(filters, str):
        filters = json.loads(filters)

    filters = filters or {}

    columns = get_columns()
    data = get_data(filters)
    summary = get_summary(filters)

    # MUST RETURN 5 VALUES!
    return columns, data, None, None, summary



# ----------------------------------
#  TABLE COLUMNS
# ----------------------------------
def get_columns():
    return [
        {"label": "Purchase ID", "fieldname": "name", "fieldtype": "Link", "options": "Purchase", "width": 120},
        {"label": "Vendor Name", "fieldname": "vendor_name", "fieldtype": "Link", "options": "Customer", "width": 140},
        {"label": "Bill No", "fieldname": "bill_no", "fieldtype": "Data", "width": 120},
        {"label": "Bill Date", "fieldname": "bill_date", "fieldtype": "Date", "width": 110},
        {"label": "Payment Type", "fieldname": "payment_type", "fieldtype": "Link", "options": "Payment Type", "width": 120},

        {"label": "Item", "fieldname": "service", "fieldtype": "Link", "options": "Item", "width": 150},
        {"label": "HSN Code", "fieldname": "hsn_code", "fieldtype": "Data", "width": 100},
        {"label": "Description", "fieldname": "description", "fieldtype": "Data", "width": 150},
        {"label": "Qty", "fieldname": "quantity", "fieldtype": "Float", "width": 80},
        {"label": "Price", "fieldname": "price", "fieldtype": "Currency", "width": 100},
        {"label": "Discount", "fieldname": "discount", "fieldtype": "Currency", "width": 100},
        {"label": "Tax Type", "fieldname": "tax_type", "fieldtype": "Data", "width": 120},
        {"label": "Tax Amount", "fieldname": "tax_amount", "fieldtype": "Currency", "width": 110},
        {"label": "Subtotal", "fieldname": "sub_total", "fieldtype": "Currency", "width": 120},

        {"label": "Grand Total", "fieldname": "grand_total", "fieldtype": "Currency", "width": 130},
    ]


# ----------------------------------
#  MAIN TABLE DATA
# ----------------------------------
def get_data(filters):
    conditions = []

    if filters.get("vendor"):
        conditions.append(f"p.vendor_name = '{filters['vendor']}'")

    if filters.get("from_date"):
        conditions.append(f"p.bill_date >= '{filters['from_date']}'")

    if filters.get("to_date"):
        conditions.append(f"p.bill_date <= '{filters['to_date']}'")

    where = " AND ".join(conditions)
    if where:
        where = "WHERE " + where

    query = f"""
        SELECT
            p.name,
            p.vendor_name,
            p.bill_no,
            p.bill_date,
            p.payment_type,
            p.grand_total,

            c.service,
            c.hsn_code,
            c.description,
            c.quantity,
            c.price,
            c.discount,
            c.tax_type,
            c.tax_amount,
            c.sub_total

        FROM `tabPurchase` p
        LEFT JOIN `tabPurchase Items` c ON c.parent = p.name
        {where}
        ORDER BY p.bill_date DESC
    """

    return frappe.db.sql(query, as_dict=True)


# ----------------------------------
#  SUMMARY CARDS (ONLY THIS YOU WANT)
# ----------------------------------
def get_summary(filters):
    conditions = []

    if filters.get("vendor"):
        conditions.append(f"vendor_name = '{filters['vendor']}'")

    if filters.get("from_date"):
        conditions.append(f"bill_date >= '{filters['from_date']}'")

    if filters.get("to_date"):
        conditions.append(f"bill_date <= '{filters['to_date']}'")

    where = " AND ".join(conditions)
    if where:
        where = "WHERE " + where

    totals = frappe.db.sql(f"""
        SELECT
            SUM(grand_total) AS total_purchase,
            SUM(total_qty) AS total_qty
        FROM `tabPurchase`
        {where}
    """, as_dict=True)[0]

    total_purchase = totals.total_purchase or 0
    total_qty = totals.total_qty or 0

    # Safe count
    count_filters = {}

    if filters.get("vendor"):
        count_filters["vendor_name"] = filters["vendor"]

    if filters.get("from_date"):
        count_filters["bill_date"] = (">=", filters["from_date"])

    if filters.get("to_date"):
        count_filters["bill_date"] = ("<=", filters["to_date"])

    purchase_count = frappe.db.count("Purchase", filters=count_filters)

    return [
        {
            "label": "Total Purchase Amount",
            "value": total_purchase,
            "indicator": "blue",
            "datatype": "Currency"
        },
        {
            "label": "Total Quantity Purchased",
            "value": total_qty,
            "indicator": "green",
            "datatype": "Float"
        },
        {
            "label": "Purchase Records",
            "value": purchase_count,
            "indicator": "orange"
        }
    ]
