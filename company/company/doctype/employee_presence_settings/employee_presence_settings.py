import frappe
from frappe.model.document import Document

class EmployeePresenceSettings(Document):
    def validate(self):
        # Ensure thresholds are logical
        if self.enable_auto_status:
            if self.offline_threshold <= self.break_threshold:
                frappe.throw("Auto-Offline threshold must be greater than Break threshold.")
            if self.break_threshold <= self.away_threshold:
                frappe.throw("Break threshold must be greater than Away threshold.")
            if self.away_threshold <= self.idle_threshold:
                frappe.throw("Away threshold must be greater than Idle threshold.")

    def on_update(self):
        # Broadcast to all users via socket whenever saved (even from Desk)
        frappe.publish_realtime("presence_settings_update", {
            "enable_auto_status": self.enable_auto_status,
            "idle_threshold": self.idle_threshold,
            "away_threshold": self.away_threshold,
            "break_threshold": self.break_threshold,
            "offline_threshold": self.offline_threshold,
            "enable_auto_resume_break": self.enable_auto_resume_break,
            "event_mousemove": self.event_mousemove,
            "event_keydown": self.event_keydown,
            "event_scroll": self.event_scroll,
            "event_click": self.event_click,
            "event_touchstart": self.event_touchstart,
            "enable_location_tracking": self.enable_location_tracking,
            "track_on_login": self.track_on_login,
            "track_on_logout": self.track_on_logout,
            "track_on_status_change": self.track_on_status_change,
            "tracking_interval_minutes": self.tracking_interval_minutes,
            "minimum_gps_accuracy": self.minimum_gps_accuracy
        })

@frappe.whitelist()
def get_presence_settings():
    settings = frappe.get_single("Employee Presence Settings")
    return {
        "enable_auto_status": settings.enable_auto_status,
        "idle_threshold": settings.idle_threshold,
        "away_threshold": settings.away_threshold,
        "break_threshold": settings.break_threshold,
        "offline_threshold": settings.offline_threshold,
        "enable_auto_resume_break": settings.enable_auto_resume_break,
        "event_mousemove": settings.event_mousemove,
        "event_keydown": settings.event_keydown,
        "event_scroll": settings.event_scroll,
        "event_click": settings.event_click,
        "event_touchstart": settings.event_touchstart,
        "enable_location_tracking": settings.enable_location_tracking,
        "track_on_login": settings.track_on_login,
        "track_on_logout": settings.track_on_logout,
        "track_on_status_change": settings.track_on_status_change,
        "tracking_interval_minutes": settings.tracking_interval_minutes,
        "minimum_gps_accuracy": settings.minimum_gps_accuracy
    }

@frappe.whitelist()
def set_presence_settings(enable_auto_status, idle_threshold=60, away_threshold=300, break_threshold=900, enable_auto_resume_break=1, **kwargs):
    # Only HR or System Manager can change settings
    roles = frappe.get_roles(frappe.session.user)
    if "HR" not in roles and "System Manager" not in roles and "Administrator" not in roles:
        frappe.throw("Not permitted to change presence settings", frappe.PermissionError)
        
    settings = frappe.get_single("Employee Presence Settings")
    settings.enable_auto_status = frappe.parse_json(enable_auto_status)
    settings.idle_threshold = frappe.parse_json(idle_threshold)
    settings.away_threshold = frappe.parse_json(away_threshold)
    settings.break_threshold = frappe.parse_json(break_threshold)
    if "offline_threshold" in kwargs:
        settings.offline_threshold = frappe.parse_json(kwargs["offline_threshold"])
    settings.enable_auto_resume_break = frappe.parse_json(enable_auto_resume_break)
    
    # Update checkboxes
    for field in [
        "event_mousemove", "event_keydown", "event_scroll", "event_click", "event_touchstart",
        "enable_location_tracking", "track_on_login", "track_on_logout", "track_on_status_change"
    ]:
        if field in kwargs:
            setattr(settings, field, frappe.parse_json(kwargs[field]))
        else:
            setattr(settings, field, 0)

    if "tracking_interval_minutes" in kwargs:
        settings.tracking_interval_minutes = frappe.parse_json(kwargs["tracking_interval_minutes"])
    if "minimum_gps_accuracy" in kwargs:
        settings.minimum_gps_accuracy = frappe.parse_json(kwargs["minimum_gps_accuracy"])
            
    settings.save()
    
    return {"status": "success"}
