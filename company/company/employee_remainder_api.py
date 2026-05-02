import frappe
import json
from frappe import _
from frappe.utils import (
    now_datetime, 
    getdate, 
    get_time, 
    add_to_date, 
    nowdate, 
    get_datetime,
    get_link_to_form
)
from datetime import datetime

@frappe.whitelist()
def get_my_reminders():
    """Fetch manual reminders for the current employee."""
    user = frappe.session.user
    employee = frappe.db.get_value("Employee", {"user": user}, "name")
    
    if not employee:
        return []

    return frappe.get_all(
        "Employee Remainder",
        filters={"employee": employee},
        fields=["name", "type", "message", "repeat", "date", "time", "day", "status"],
        order_by="creation desc"
    )

@frappe.whitelist()
def save_remainder(data):
    """Save or update a manual reminder."""
    if isinstance(data, str):
        data = frappe.parse_json(data)

    user = frappe.session.user
    employee = frappe.db.get_value("Employee", {"user": user}, "name")
    
    if not employee:
        frappe.throw(_("Employee record not found for the current user."))

    if data.get("time") and len(data["time"].split(":")) >= 2:
        parts = data["time"].split(":")
        data["time"] = f"{parts[0]}:{parts[1]}:00"

    if data.get("name"):
        doc = frappe.get_doc("Employee Remainder", data["name"])
        doc.update(data)
        doc.save(ignore_permissions=True)
    else:
        data["employee"] = employee
        data["doctype"] = "Employee Remainder"
        doc = frappe.get_doc(data)
        doc.insert(ignore_permissions=True)
        
        # Enqueue immediately for "Single" reminders
        if doc.repeat == "Single":
            queue_name = enqueue_remainder(doc.name, doc.employee, doc.message or f"Reminder: {doc.type}")
            
            # If the scheduled time is now or in the past, trigger it immediately
            # to avoid waiting for the next scheduler tick (the "one minute later" issue)
            rem_date = doc.date or nowdate()
            scheduled_dt = get_datetime(f"{rem_date} {doc.time}")
            if scheduled_dt <= now_datetime():
                frappe.enqueue("company.company.employee_remainder_api.send_remainder_notification", queue_name=queue_name)
    
    frappe.db.commit()
    return doc

def check_and_enqueue_reminders():
    """Scheduler function to enqueue active recurring reminders and HR reminders."""
    now = now_datetime()
    current_date = nowdate()
    current_day = now.strftime("%A")

    # 1. Process Recurring Individual (Manual) Reminders
    active_reminders = frappe.get_all(
        "Employee Remainder",
        filters={"status": "Active", "repeat": ["in", ["Daily", "Weekly"]]},
        fields=["name", "employee", "message", "repeat", "date", "time", "day", "type"]
    )

    for r in active_reminders:
        should_enqueue = False
        
        if r.repeat == "Daily":
            should_enqueue = True
        elif r.repeat == "Weekly":
            if r.day == current_day:
                should_enqueue = True

        if should_enqueue:
            if not is_already_enqueued_today(r.name, r.employee):
                enqueue_remainder(r.name, r.employee, r.message or f"Reminder: {r.type}")

    # 2. Process HR Organizational Reminders
    settings = frappe.get_single("Employee Remainder Settings")
    if settings.enable_hr_reminders:
        for hr_rem in settings.hr_remainders:
            if hr_rem.is_global:
                employees = frappe.get_all("Employee", filters={"status": "Active"}, pluck="name")
            else:
                employees = [d.employee for d in hr_rem.selected_employees]

            for emp in employees:
                hr_rem_id = f"HR-{hr_rem.name}"
                if not is_already_enqueued_today(None, emp, hr_rem_id):
                    enqueue_remainder(None, emp, hr_rem.message, hr_rem_id)
    
    frappe.db.commit()

def is_already_enqueued_today(remainder_name, employee, hr_id=None):
    """Check if already in queue for today."""
    filters = {
        "employee": employee,
        "scheduled_time": [">=", getdate(nowdate())],
    }
    if hr_id:
        filters["hr_reminder_id"] = hr_id
    else:
        filters["remainder"] = remainder_name
        
    return frappe.db.exists("Employee Remainder Queue", filters)

def enqueue_remainder(remainder_name, employee, content, hr_id=None):
    """Add a reminder to the queue with its scheduled time."""
    scheduled_dt = now_datetime() 
    
    if remainder_name:
        rem_doc = frappe.get_doc("Employee Remainder", remainder_name)
        rem_time = rem_doc.time
        rem_date = rem_doc.date or nowdate()
        scheduled_dt = get_datetime(f"{rem_date} {rem_time}")
    
    elif hr_id:
        settings = frappe.get_single("Employee Remainder Settings")
        hr_rem_name = hr_id.replace("HR-", "")
        trigger_time = "09:00:00"
        for r in settings.hr_remainders:
            if r.name == hr_rem_name:
                trigger_time = r.trigger_time
                break
        scheduled_dt = get_datetime(f"{nowdate()} {trigger_time}")

    queue_doc = frappe.get_doc({
        "doctype": "Employee Remainder Queue",
        "remainder": remainder_name,
        "hr_reminder_id": hr_id,
        "employee": employee,
        "content": content,
        "status": "Pending",
        "scheduled_time": scheduled_dt
    })
    queue_doc.insert(ignore_permissions=True)
    return queue_doc.name

def process_remainder_queue():
    """Send notifications from the queue ONLY IF scheduled_time <= now."""
    now = now_datetime()
    
    pending = frappe.get_all(
        "Employee Remainder Queue",
        filters={
            "status": "Pending",
            "scheduled_time": ["<=", now]
        },
        fields=["name", "employee", "content", "remainder", "hr_reminder_id", "scheduled_time"]
    )

    if pending:
        frappe.logger().info(f"Processing {len(pending)} pending reminders at {now}")
    
    for item in pending:
        try:
            success = send_remainder_notification(item.name)
            if success:
                log_trigger(item.remainder, item.employee, "Success", item.hr_reminder_id)
            else:
                log_trigger(item.remainder, item.employee, "Error", item.hr_reminder_id)
        except Exception as e:
            frappe.log_error(title="process_remainder_queue item error", message=frappe.get_traceback())

@frappe.whitelist()
def manual_trigger_remainder(queue_name):
    """Manually trigger a reminder from the queue."""
    return send_remainder_notification(queue_name)

def send_remainder_notification(queue_name):
    """Send a chat message for a specific queue entry. Logic based on Task Manager."""
    from company.company.api import get_chatbot_user
    
    queue_item = frappe.get_doc("Employee Remainder Queue", queue_name)
    receiver_email = frappe.db.get_value("Employee", queue_item.employee, "user")
    sender_email = get_chatbot_user()
    
    if not receiver_email or not sender_email:
        frappe.logger().warning(f"Reminder failed: No receiver ({receiver_email}) or sender ({sender_email}) for queue {queue_name}")
        frappe.db.set_value("Employee Remainder Queue", queue_name, "status", "Failed")
        return False

    try:
        from clefincode_chat.api.api_1_2_1.api import send, create_channel
        
        # 1. Generate Rich Content (Premium Formatting with both <br> and \n for notification alignment)
        user_name = frappe.db.get_value("User", receiver_email, "first_name") or "there"
        
        content = f"""🔔 Reminder:<br>
<br>
Hi {user_name}! 👋<br>
<b>{queue_item.content}</b>"""

        # 2. Check if direct room exists (Robust SQL)
        room_name = frappe.db.sql("""
            SELECT c.name
            FROM `tabClefinCode Chat Channel` c
            JOIN `tabClefinCode Chat Channel User` u1 ON u1.parent = c.name
            JOIN `tabClefinCode Chat Channel User` u2 ON u2.parent = c.name
            WHERE c.type = 'Direct'
            AND c.is_parent = 1
            AND u1.user = %s
            AND u2.user = %s
        """, (sender_email, receiver_email), pluck=True)

        if room_name:
            room_name = room_name[0]
        else:
            # Create channel
            users = [
                {"email": sender_email, "platform": "Chat"},
                {"email": receiver_email, "platform": "Chat"}
            ]
            sender_name = frappe.db.get_value("User", sender_email, "full_name") or sender_email
            res = create_channel(
                channel_name="",
                users=json.dumps(users),
                type="Direct",
                last_message=content,
                creator_email=sender_email,
                creator=sender_name
            )
            if res and res.get("results"):
                room_name = res["results"][0]["room"]

        if room_name:
            sender_name = frappe.db.get_value("User", sender_email, "full_name") or sender_email
            send(
                content=content,
                user=sender_name,
                room=room_name,
                email=sender_email,
                skip_notification=0 # IMPORTANT: Enable push notification
            )
            
            frappe.db.set_value("Employee Remainder Queue", queue_name, "status", "Sent")
            
            # If manual reminder, mark as Completed
            if queue_item.remainder:
                repeat = frappe.db.get_value("Employee Remainder", queue_item.remainder, "repeat")
                if repeat == "Single":
                    frappe.db.set_value("Employee Remainder", queue_item.remainder, "status", "Completed")
            
            return True
        else:
            frappe.db.set_value("Employee Remainder Queue", queue_name, "status", "Failed")
            return False

    except Exception as e:
        frappe.log_error(title="Reminder Chat Notification Error", message=frappe.get_traceback())
        frappe.db.set_value("Employee Remainder Queue", queue_name, "status", "Failed")
        return False

def log_trigger(remainder_name, employee, status, hr_id=None):
    """Log the trigger attempt."""
    frappe.get_doc({
        "doctype": "Employee Remainder Log",
        "remainder": remainder_name,
        "employee": employee,
        "hr_reminder_id": hr_id,
        "triggered_at": now_datetime(),
        "status": status
    }).insert(ignore_permissions=True)
    frappe.db.commit()
