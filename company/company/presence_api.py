import frappe
from frappe import _
from frappe.utils import now_datetime, time_diff_in_seconds, flt, today

DEFAULT_STATUS_MESSAGES = {
    "Busy": "In a meeting",
    "Do Not Disturb": "Do not disturb",
    "Break": "On a break",
    "Away": "Stepped away",
}

@frappe.whitelist()
def update_presence(status, employee=None, status_message=None):
    """
    Update employee presence and handle session/break logic.
    """
    if not employee:
        employee = frappe.db.get_value("Employee", {"user": frappe.session.user}, "name")
    
    if not employee:
        frappe.throw(_("Employee not found for current user"))

    now = now_datetime()
    
    # Get or create current presence record
    if not frappe.db.exists("Employee Presence", employee):
        presence = frappe.get_doc({
            "doctype": "Employee Presence",
            "employee": employee,
            "status": "Offline",
            "last_updated": now
        })
        presence.insert(ignore_permissions=True)
    else:
        presence = frappe.get_doc("Employee Presence", employee)
    
    old_status = presence.status
    
    if old_status == status:
        return {"status": "No change"}

    # Handle Session Logic
    active_session = get_active_session(employee)
    
    if status == "Offline":
        if active_session:
            close_session(active_session, now)
    else:
        if not active_session:
            create_session(employee, now)
        else:
            active_session.last_seen = now
            active_session.save()

    # Handle Break Logic
    if status == "Break":
        if active_session:
            create_break(active_session.name, now)
    else:
        if old_status == "Break":
            close_active_break(active_session.name if active_session else None, now)

    # Resolve status message
    final_status_message = ""
    if status in ("Available", "Offline"):
        final_status_message = ""
    elif status_message is not None:
        final_status_message = status_message
    else:
        final_status_message = DEFAULT_STATUS_MESSAGES.get(status, "")

    # Update Presence
    presence.status = status
    presence.last_updated = now
    presence.status_message = final_status_message
    presence.save()
    
    # Publish real-time update for Chat UI
    user_id = frappe.db.get_value("Employee", employee, "user")
    if user_id:
        frappe.publish_realtime('presence_update', {
            "user_id": user_id,
            "status": status,
            "status_message": final_status_message,
            "last_active": now.isoformat()
        }, after_commit=True)

    frappe.db.commit()

    return {"status": "success", "message": f"Status updated to {status}"}

@frappe.whitelist()
def check_today_timesheet(employee=None):
    """
    Check if the employee has a timesheet for today.
    """
    if not employee:
        employee = frappe.db.get_value("Employee", {"user": frappe.session.user}, "name")
    
    if not employee:
        return {"has_timesheet": False}

    has_timesheet = frappe.db.exists("Timesheet", {
        "employee": employee,
        "timesheet_date": frappe.utils.today()
    })

    return {"has_timesheet": bool(has_timesheet)}

@frappe.whitelist()
def ping_presence(employee=None):
    """
    Periodic ping to keep session alive.
    """
    if not employee:
        employee = frappe.db.get_value("Employee", {"user": frappe.session.user}, "name")
    
    if not employee:
        return {"status": "error", "message": "Employee not found"}

    now = now_datetime()
    
    # Update Presence last_updated
    frappe.db.set_value("Employee Presence", employee, "last_updated", now)
    
    # Update Active Session last_seen
    active_session = get_active_session(employee)
    if active_session:
        active_session.last_seen = now
        active_session.save()
        frappe.db.commit()
        return {"status": "success", "session": active_session.name}
    
    return {"status": "no_active_session"}

@frappe.whitelist()
def get_presence(employee=None):
    """
    Get current presence and session info.
    """
    if not employee:
        employee = frappe.db.get_value("Employee", {"user": frappe.session.user}, "name")
    
    if not employee:
        return {"status": "error", "message": "Employee not found"}

    presence = frappe.db.get_value("Employee Presence", employee, ["status", "last_updated", "status_message"], as_dict=True)
    if not presence:
        presence = {"status": "Offline", "last_updated": None, "status_message": ""}
    
    active_session = get_active_session(employee)
    
    active_break = None
    total_active_seconds = 0
    if active_session:
        total_active_seconds = get_live_active_seconds(active_session)
        active_break = frappe.db.get_value("Employee Break", 
            {"session": active_session.name, "break_end": ["is", "not set"]}, 
            ["name", "break_start"], as_dict=True)

    return {
        "presence": presence,
        "session": {
            "name": active_session.name if active_session else None,
            "login_time": active_session.login_time if active_session else None,
            "total_active_seconds": total_active_seconds
        },
        "break": active_break
    }

@frappe.whitelist()
def get_all_presences():
    """
    Get current presence status for all employees, mapped by user email.
    """
    data = frappe.db.sql("""
        SELECT 
            e.user as user_id,
            p.status,
            p.status_message,
            p.last_updated
        FROM `tabEmployee Presence` p
        JOIN `tabEmployee` e ON p.employee = e.name
    """, as_dict=True)
    
    return { d.user_id: d for d in data if d.user_id }

def get_live_active_seconds(session):
    if not session:
        return 0
    
    now = now_datetime()
    # 1. Sum up all completed intervals
    total_seconds = sum(flt(i.duration_seconds) for i in session.intervals if i.to_time)
    
    # 2. Add current interval if it's open
    if session.intervals and not session.intervals[-1].to_time:
        total_seconds += time_diff_in_seconds(now, session.intervals[-1].from_time)
    
    # 3. Subtract all breaks
    breaks = frappe.get_all("Employee Break", 
        filters={"session": session.name}, 
        fields=["break_duration", "break_start", "break_end"])
    
    for b in breaks:
        if b.break_end:
            total_seconds -= flt(b.break_duration) * 60.0
        else:
            # Current active break
            total_seconds -= time_diff_in_seconds(now, b.break_start)
    
    return max(0, total_seconds)

def get_active_session(employee):
    session_name = frappe.db.get_value("Employee Session", {"employee": employee, "status": "Active"}, "name")
    if session_name:
        return frappe.get_doc("Employee Session", session_name)
    return None

def create_session(employee, now):
    today_date = today()
    existing_session_name = frappe.db.get_value("Employee Session", {"employee": employee, "login_date": today_date}, "name")
    
    if existing_session_name:
        doc = frappe.get_doc("Employee Session", existing_session_name)
        doc.status = "Active"
        doc.logout_time = None
        doc.last_seen = now
    else:
        doc = frappe.get_doc({
            "doctype": "Employee Session",
            "employee": employee,
            "login_time": now,
            "login_date": today_date,
            "last_seen": now,
            "status": "Active",
            "intervals": []
        })
    
    doc.append("intervals", {
        "from_time": now
    })
    doc.save(ignore_permissions=True)
    
    # Publish session update
    user_id = frappe.db.get_value("Employee", employee, "user")
    if user_id:
        frappe.publish_realtime('session_update', {"user_id": user_id, "name": doc.name}, after_commit=True)
        
    return doc

def close_session(session, now):
    # Close any open breaks first
    close_active_break(session.name, now)
    
    session.logout_time = now
    session.status = "Inactive"
    
    # Update the last interval
    if session.intervals:
        last_interval = session.intervals[-1]
        if not last_interval.to_time:
            last_interval.to_time = now
            last_interval.duration_seconds = time_diff_in_seconds(now, last_interval.from_time)
    
    # Calculate Total Working Hours based on all segments
    total_active_seconds = sum(flt(i.duration_seconds) for i in session.intervals)
    
    # Sum up all breaks for this session
    breaks = frappe.get_all("Employee Break", 
        filters={"session": session.name}, 
        fields=["break_duration"])
    
    total_break_mins = sum(flt(b.break_duration) for b in breaks)
    
    # Working hours = (Total Active Seconds / 3600) - (Total Break Mins / 60)
    working_hours = (total_active_seconds / 3600.0) - (total_break_mins / 60.0)
    
    session.total_work_hours = max(0, working_hours)
    session.save(ignore_permissions=True)
    
    # Publish session update
    user_id = frappe.db.get_value("Employee", session.employee, "user")
    if user_id:
        frappe.publish_realtime('session_update', {"user_id": user_id, "name": session.name}, after_commit=True)

def create_break(session_name, now):
    # Ensure no other active break exists
    existing = frappe.db.get_value("Employee Break", {"session": session_name, "break_end": ["is", "not set"]}, "name")
    if not existing:
        doc = frappe.get_doc({
            "doctype": "Employee Break",
            "session": session_name,
            "break_start": now
        })
        doc.insert(ignore_permissions=True)
        
        # Publish session update (for break tracking)
        user_id = frappe.db.get_value("Employee", frappe.db.get_value("Employee Session", session_name, "employee"), "user")
        if user_id:
            frappe.publish_realtime('session_update', {"user_id": user_id, "name": session_name}, after_commit=True)

def close_active_break(session_name, now):
    if not session_name:
        return
    
    active_break_name = frappe.db.get_value("Employee Break", 
        {"session": session_name, "break_end": ["is", "not set"]}, "name")
    
    if active_break_name:
        brk = frappe.get_doc("Employee Break", active_break_name)
        brk.break_end = now
        
        # Calculate duration in minutes
        diff_seconds = time_diff_in_seconds(now, brk.break_start)
        brk.break_duration = diff_seconds / 60.0
        brk.save(ignore_permissions=True)
        
        # Publish session update (for break tracking)
        user_id = frappe.db.get_value("Employee", frappe.db.get_value("Employee Session", session_name, "employee"), "user")
        if user_id:
            frappe.publish_realtime('session_update', {"user_id": user_id, "name": session_name}, after_commit=True)

@frappe.whitelist()
def get_detailed_sessions(employee=None, limit_start=0, limit_page_length=20, date_search="", status="all", sort_by="login_date_desc"):
    """
    Fetch sessions with their child intervals and related breaks.
    """
    if not employee:
        employee = frappe.db.get_value("Employee", {"user": frappe.session.user}, "name")
    
    if not employee:
        return {"data": [], "total_count": 0}

    filters = {"employee": employee}
    
    if date_search:
        filters["login_date"] = ["like", f"%{date_search}%"]
        
    if status and status != "all":
        filters["status"] = status
        
    order_by = "login_date desc"
    if sort_by == "login_date_desc":
        order_by = "login_date desc"
    elif sort_by == "login_date_asc":
        order_by = "login_date asc"
    elif sort_by == "working_hours_desc":
        order_by = "total_work_hours desc"
    elif sort_by == "working_hours_asc":
        order_by = "total_work_hours asc"

    sessions = frappe.get_all("Employee Session", 
        filters=filters,
        fields=["name", "login_time", "login_date", "logout_time", "total_work_hours", "status"],
        order_by=order_by,
        limit_start=int(limit_start),
        limit_page_length=int(limit_page_length)
    )
    
    total_count = frappe.db.count("Employee Session", filters=filters)

    for s in sessions:
        # Get intervals (child table of Session)
        s.intervals = frappe.get_all("Employee Session Interval",
            filters={"parent": s.name},
            fields=["from_time", "to_time", "duration_seconds"],
            order_by="from_time asc"
        )
        # Get breaks (separate DocType linked to Session)
        s.breaks = frappe.get_all("Employee Break",
            filters={"session": s.name},
            fields=["break_start", "break_end", "break_duration"],
            order_by="break_start asc"
        )

    return {"data": sessions, "total_count": total_count}

def daily_reset():
    """
    Force close all active sessions and reset all statuses to Offline.
    To be called by a daily cron job at midnight.
    """
    now = now_datetime()
    
    # 1. Close all active sessions
    active_sessions = frappe.get_all("Employee Session", filters={"status": "Active"}, fields=["name"])
    for s in active_sessions:
        doc = frappe.get_doc("Employee Session", s.name)
        close_session(doc, now)
    
    # 2. Reset all presence records to Offline
    frappe.db.sql("UPDATE `tabEmployee Presence` SET status = 'Offline', last_updated = %s", now)
    
    frappe.db.commit()
