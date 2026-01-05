import frappe
from frappe.auth import LoginManager
from frappe import _


@frappe.whitelist()
def get_doctype_list(doctype, txt=None, fields=None):
    """
    Fetch a list of documents for a given DocType.
    Useful for populating dropdowns on the frontend.
    """
    if not frappe.has_permission(doctype, "read"):
        frappe.throw("Not permitted")

    filters = {}
    if txt:
        filters["name"] = ["like", f"%{txt}%"]

    if fields:
        import json
        field_list = json.loads(fields)
        return frappe.get_list(doctype, filters=filters, fields=field_list, limit=1000)

    return frappe.get_list(doctype, filters=filters, pluck="name", limit=1000)


@frappe.whitelist(allow_guest=True)
def mobile_login(username, password):
    """
    Login API for Mobile / App
    Returns API Key + Secret per user
    """

    if not username or not password:
        frappe.throw(_("Username and password required"))

    # Authenticate user
    login_manager = LoginManager()
    login_manager.authenticate(username, password)
    login_manager.post_login()

    user = frappe.get_doc("User", username)

    # Generate API Key if missing
    if not user.api_key:
        frappe.throw(_("API Key not found for user {}".format(username)))

    # Generate API Secret if missing
    if not user.api_secret:
        frappe.throw(_("API Secret not found for user {}".format(username)))

    user.save(ignore_permissions=True)

    return {
        "user": user.name,
        "api_key": user.api_key,
        "api_secret": user.get_password("api_secret")
    }


@frappe.whitelist()
def get_lead_permissions():
    """
    Check if the current user has read, write, and delete permissions for the Lead DocType.
    """
    return get_doc_permissions("Lead")


@frappe.whitelist()
def get_deal_permissions():
    """
    Check if the current user has read, write, and delete permissions for the Deal DocType.
    """
    return get_doc_permissions("Deal")


@frappe.whitelist()
def get_doc_permissions(doctype):
    """
    Check if the current user has read, write, and delete permissions for a given DocType.
    """
    return {
        "read": bool(frappe.has_permission(doctype, "read")),
        "write": bool(frappe.has_permission(doctype, "write")),
        "delete": bool(frappe.has_permission(doctype, "delete")),
    }


@frappe.whitelist()
def get_current_user_info():
    """
    Fetch the full details of the currently logged-in user.
    """
    user = frappe.get_doc("User", frappe.session.user)
    return {
        "name": user.name,
        "full_name": user.full_name,
        "email": user.email,
        "user_image": user.user_image
    }


@frappe.whitelist()
def get_dashboard_stats():
    """
    Fetch CRM dashboard statistics including counts for Leads, Contacts, Deals, Events, Todo, Calls, and Meetings.
    """
    stats = {}
    
    # Get counts for each DocType
    doctypes = {
        "leads": "Lead",
        "contacts": "Contacts",
        "deals": "Deal",
        "accounts": "Accounts",
    }
    
    for key, doctype in doctypes.items():
        try:
            if frappe.has_permission(doctype, "read"):
                stats[key] = frappe.db.count(doctype)
            else:
                stats[key] = 0
        except Exception:
            stats[key] = 0
    
    # Get recent leads (last 7 days)
    try:
        if frappe.has_permission("Lead", "read"):
            stats["recent_leads"] = frappe.db.count("Lead", {
                "creation": [">=", frappe.utils.add_days(frappe.utils.nowdate(), -7)]
            })
        else:
            stats["recent_leads"] = 0
    except Exception:
        stats["recent_leads"] = 0
    
    # Get leads by status (workflow_state)
    try:
        if frappe.has_permission("Lead", "read"):
            stats["leads_by_status"] = frappe.db.sql("""
                SELECT workflow_state as status, COUNT(*) as count
                FROM `tabLead`
                GROUP BY workflow_state
            """, as_dict=True)
        else:
            stats["leads_by_status"] = []
    except Exception:
        stats["leads_by_status"] = []
    
    # Get deals by stage
    try:
        if frappe.has_permission("Deal", "read"):
            stats["deals_by_stage"] = frappe.db.sql("""
                SELECT stage, COUNT(*) as count
                FROM `tabDeal`
                GROUP BY stage
            """, as_dict=True)
        else:
            stats["deals_by_stage"] = []
    except Exception:
        stats["deals_by_stage"] = []
    
    # Get total deal value
    try:
        if frappe.has_permission("Deal", "read"):
            total_value = frappe.db.sql("""
                SELECT SUM(value) as total
                FROM `tabDeal`
                WHERE stage NOT IN ('Closed Lost')
            """, as_dict=True)
            stats["total_deal_value"] = total_value[0].get("total") or 0 if total_value else 0
        else:
            stats["total_deal_value"] = 0
    except Exception:
        stats["total_deal_value"] = 0

    # Get historical data for the last 7 days
    try:
        days = []
        lead_series = []
        contact_series = []
        deal_series = []
        account_series = []
        
        for i in range(6, -1, -1):
            date = frappe.utils.add_days(frappe.utils.nowdate(), -i)
            day_name = frappe.utils.get_datetime(date).strftime('%a')
            days.append(day_name)
            
            lead_series.append(frappe.db.count("Lead", {"creation": ["like", f"{date}%"]}))
            contact_series.append(frappe.db.count("Contacts", {"creation": ["like", f"{date}%"]}))
            deal_series.append(frappe.db.count("Deal", {"creation": ["like", f"{date}%"]}))
            account_series.append(frappe.db.count("Accounts", {"creation": ["like", f"{date}%"]}))
            
        stats["charts"] = {
            "categories": days,
            "leads": lead_series,
            "contacts": contact_series,
            "deals": deal_series,
            "accounts": account_series
        }
    except Exception as e:
        frappe.log_error(f"Error calculating dashboard chart data: {str(e)}")
        stats["charts"] = {
            "categories": ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            "leads": [0]*7,
            "contacts": [0]*7,
            "deals": [0]*7,
            "accounts": [0]*7
        }
    
    return stats


@frappe.whitelist()
def get_today_activities():
    """
    Fetch today's calls and meetings.
    """
    from datetime import datetime
    
    activities = {
        "calls": [],
        "meetings": []
    }
    
    # Get today's date
    today_date = frappe.utils.today()
    
    # Fetch and filter calls
    try:
        if frappe.has_permission("Calls", "read"):
            # Use SQL for calls too for consistency and to avoid field issues
            activities["calls"] = frappe.db.sql("""
                SELECT name, title, call_for, lead_name, call_start_time, call_end_time, outgoing_call_status, call_purpose
                FROM `tabCalls`
                WHERE DATE(call_start_time) = %s
                ORDER BY call_start_time ASC
                LIMIT 10
            """, (today_date,), as_dict=True)
    except Exception as e:
        frappe.log_error(f"Error fetching calls for dashboard: {str(e)}")
    
    # Fetch and filter meetings (strictly from Meeting DocType)
    try:
        if frappe.has_permission("Meeting", "read"):
            # Using direct SQL because 'from' is a reserved keyword in SQL
            activities["meetings"] = frappe.db.sql("""
                SELECT name, title, meet_for, lead_name, `from`, `to`, outgoing_call_status, meeting_venue, location
                FROM `tabMeeting`
                WHERE DATE(`from`) = %s
                ORDER BY `from` ASC
                LIMIT 10
            """, (today_date,), as_dict=True)
    except Exception as e:
        frappe.log_error(f"Error fetching meetings for dashboard: {str(e)}")
    
    return activities


@frappe.whitelist()
def update_event(name, data):
    """
    Update event data (subject, starts_on, ends_on, etc.)
    """
    if isinstance(data, str):
        import json
        data = json.loads(data)
        
    try:
        if frappe.has_permission("Event", "write", doc=name):
            doc = frappe.get_doc("Event", name)
            doc.update(data)
            doc.save()
            return {"status": "success", "message": "Event updated successfully"}
        else:
            frappe.throw("No permission to update this event", frappe.PermissionError)
    except Exception as e:
        frappe.log_error(f"Error updating event {name}: {str(e)}")
        return {"status": "error", "message": str(e)}

        
@frappe.whitelist()
def delete_event(name):
    """
    Delete an event
    """
    try:
        if frappe.has_permission("Event", "delete", doc=name):
            frappe.delete_doc("Event", name)
            return {"status": "success", "message": "Event deleted successfully"}
        else:
            frappe.throw("No permission to delete this event", frappe.PermissionError)
    except Exception as e:
        frappe.log_error(f"Error deleting event {name}: {str(e)}")
        return {"status": "error", "message": str(e)}

@frappe.whitelist()
def create_event(data):
    """
    Create a new event
    """
    if isinstance(data, str):
        import json
        data = json.loads(data)
        
    try:
        if frappe.has_permission("Event", "create"):
            doc = frappe.get_doc({
                "doctype": "Event",
                **data
            })
            doc.insert()
            return {"status": "success", "message": "Event created successfully", "name": doc.name}
        else:
            frappe.throw("No permission to create events", frappe.PermissionError)
    except Exception as e:
        frappe.log_error(f"Error creating event: {str(e)}")
        return {"status": "error", "message": str(e)}

@frappe.whitelist()
def get_events(start=None, end=None):
    """
    Fetch events for calendar view.
    """
    filters = {}
    
    if start and end:
        filters["starts_on"] = ["between", [start, end]]
    
    try:
        if frappe.has_permission("Event", "read"):
            events = frappe.get_all(
                "Event",
                filters=filters,
                fields=["name", "subject", "starts_on", "ends_on", "event_category", "event_type", "status", "description", "color", "all_day"],
                order_by="starts_on asc",
                limit=500
            )
            return events
        else:
            return []
    except Exception as e:
        frappe.log_error(f"Error fetching events: {str(e)}")
        return []

@frappe.whitelist()
def get_workflow_states(doctype="Lead", current_state=None):
    """Get workflow states and allowed transitions for a doctype and current state"""
    try:
        # Get workflow for the doctype
        workflow = frappe.get_all(
            "Workflow",
            filters={"document_type": doctype, "is_active": 1},
            fields=["name"],
            limit=1
        )
        
        if not workflow:
            return {"states": [], "transitions": [], "actions": []}
        
        workflow_name = workflow[0].name
        
        # Get all workflow states
        states = frappe.get_all(
            "Workflow Document State",
            filters={"parent": workflow_name},
            fields=["state", "doc_status", "is_optional_state"],
            order_by="idx"
        )
        
        # Get all workflow transitions
        transitions = frappe.get_all(
            "Workflow Transition",
            filters={"parent": workflow_name},
            fields=["state", "action", "next_state", "allowed"],
            order_by="idx"
        )
        
        # If current_state is provided, filter transitions for that state
        allowed_actions = []
        if current_state:
            user_roles = frappe.get_roles()
            for transition in transitions:
                if transition.state == current_state:
                    # Check if user has the required role
                    if not transition.allowed or transition.allowed in user_roles:
                        allowed_actions.append({
                            "action": transition.action,
                            "next_state": transition.next_state
                        })
        
        return {
            "states": [s.state for s in states],
            "transitions": transitions,
            "actions": allowed_actions
        }
    except Exception as e:
        frappe.log_error(f"Error fetching workflow states: {str(e)}")
        return {"states": [], "transitions": [], "actions": []}
@frappe.whitelist()
def get_doc_fields(doctype):
    """
    Fetch relevant fields for a given DocType for mapping/import purposes.
    """
    if not frappe.has_permission(doctype, "read"):
        frappe.throw(_("Not permitted"), frappe.PermissionError)

    meta = frappe.get_meta(doctype)
    fields = []

    # Add Name/ID field
    fields.append({
        "fieldname": "name",
        "label": _("ID"),
        "fieldtype": "Data",
        "reqd": 0
    })

    # Add Owner field
    fields.append({
        "fieldname": "owner",
        "label": _("Owner"),
        "fieldtype": "Link",
        "options": "User"
    })

    for df in meta.fields:
        if df.fieldtype not in ("Section Break", "Column Break", "Tab Break", "HTML", "Button"):
            fields.append({
                "fieldname": df.fieldname,
                "label": _(df.label),
                "fieldtype": df.fieldtype,
                "options": df.options,
                "reqd": df.reqd
            })
    
    return fields


@frappe.whitelist()
def download_import_template(doctype):
    """
    Generate and download a blank import template for a given DocType.
    """
    import json
    if not frappe.has_permission(doctype, "read"):
        frappe.throw(_("Not permitted"), frappe.PermissionError)

    from frappe.core.doctype.data_import.data_import import download_template
    
    meta = frappe.get_meta(doctype)
    # Get relevant fields for the template (mandatory + common)
    fields = [df.fieldname for df in meta.fields if (df.reqd or df.in_list_view) and df.fieldtype not in ("Section Break", "Column Break", "Tab Break", "HTML", "Button") and not df.hidden]
    
    if "name" not in fields:
        fields.insert(0, "name")

    export_fields = {doctype: fields}
    
    return download_template(doctype, export_fields=json.dumps(export_fields), export_records="blank_template", file_type="Excel")


@frappe.whitelist()
def update_import_file(data_import_name, data):
    """
    Save edited preview data back to a CSV file and update the Data Import record.
    """
    import json
    import csv
    import io
    from frappe.utils.file_manager import save_file

    data_import = frappe.get_doc("Data Import", data_import_name)
    data_import.check_permission("write")

    rows = json.loads(data)
    
    # Create CSV in memory
    output = io.StringIO()
    writer = csv.writer(output)
    for row in rows:
        writer.writerow(row)
    
    content = output.getvalue()
    
    # Save as a new file
    filename = f"edited_{data_import_name}.csv"
    file_doc = save_file(
        filename,
        content.encode("utf-8"),
        "Data Import",
        data_import_name,
        is_private=1,
        df="import_file"
    )

    # Update Data Import record
    data_import.import_file = file_doc.file_url
    data_import.save()
    
    return {"status": "success", "file_url": file_doc.file_url}

@frappe.whitelist()
def get_doctype_fields(doctype):
    meta = frappe.get_meta(doctype)
    fields = []
    
    for d in meta.fields:
        if d.fieldtype not in ['Section Break', 'Column Break', 'Tab Break', 'HTML', 'Button', 'Table'] and not d.hidden and not d.read_only:
             fields.append({
                "fieldname": d.fieldname,
                "label": d.label,
                "fieldtype": d.fieldtype,
                "options": d.options,
                "hidden": d.hidden
            })
            
    return {"name": doctype, "fields": fields}
