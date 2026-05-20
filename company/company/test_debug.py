import frappe
from frappe.utils import getdate, add_days, now_datetime
from company.company.doctype.task_manager.task_manager import close_task

def run_debug():
    frappe.db.rollback()
    
    unique = "debug123"
    
    # 1. Create User
    user_email = f"test_task_{unique}@example.com"
    if frappe.db.exists("User", user_email):
        frappe.delete_doc("User", user_email, force=True)
    
    user = frappe.get_doc({
        "doctype": "User",
        "email": user_email,
        "first_name": "Test Task User",
        "enabled": 1
    }).insert(ignore_permissions=True)
    
    # 2. Create Employee
    emp_id = f"TEST-T-{unique}"
    existing_emp = frappe.db.get_value("Employee", {"employee_id": emp_id})
    if existing_emp:
        frappe.delete_doc("Employee", existing_emp, force=True)
        
    emp = frappe.get_doc({
        "doctype": "Employee",
        "employee_id": emp_id,
        "employee_name": "Test Task Employee",
        "email": user.email,
        "user": user.name,
        "date_of_joining": "2025-01-01",
        "status": "Active",
        "company": "_Test Company",
        "evaluation_score": 100
    }).insert(ignore_permissions=True)
    
    employee_id = emp.name
    print(f"Created Employee: {employee_id}, initial score: {emp.evaluation_score}")

    # 3. Ensure Evaluation Point "Disagree" exists with -5 score
    if frappe.db.exists("Evaluation Point", "Disagree"):
        frappe.db.set_value("Evaluation Point", "Disagree", "default_score", -5)
    else:
        frappe.get_doc({
            "doctype": "Evaluation Point",
            "point_name": "Disagree",
            "default_score": -5
        }).insert(ignore_permissions=True)

    # 4. Ensure Evaluation Trait "Attendance" exists
    if not frappe.db.exists("Evaluation Trait", "Attendance"):
        frappe.get_doc({
            "doctype": "Evaluation Trait",
            "trait_name": "Attendance"
        }).insert(ignore_permissions=True)

    # Clear trait-specific score overrides for Disagree
    trait = frappe.get_doc("Evaluation Trait", "Attendance")
    trait.evaluation_scores = []
    trait.save(ignore_permissions=True)

    # 5. Create Evaluation Automation Rule for "Task Delayed"
    frappe.db.delete("Evaluation Automation Rule", {"event_type": "Task Delayed"})
    rule = frappe.get_doc({
        "doctype": "Evaluation Automation Rule",
        "rule_name": f"Task Delayed Rule {unique}",
        "event_type": "Task Delayed",
        "enabled": 1,
        "trait": "Attendance",
        "evaluation_point": "Disagree"
    }).insert(ignore_permissions=True)

    # 6. Ensure Project exists
    if not frappe.db.exists("Project", "Test Project"):
        frappe.get_doc({
            "doctype": "Project",
            "project": "Test Project"
        }).insert(ignore_permissions=True)

    # Create task
    task = frappe.get_doc({
        "doctype": "Task Manager",
        "title": "Delayed Task Test",
        "project": "Test Project",
        "due_date": add_days(getdate(), 5),
        "estimated_time": 1.0,
        "status": "Open",
        "assignees": [{
            "employee": employee_id,
            "user": user.name
        }]
    })
    task.insert(ignore_permissions=True)
    print(f"Created Task: {task.name}")

    score_before = frappe.db.get_value("Employee", employee_id, "evaluation_score")
    print(f"Score before close: {score_before}")

    # Close task
    close_task(task.name, "02:00", "Took longer than expected")
    print("Closed task.")

    score_after = frappe.db.get_value("Employee", employee_id, "evaluation_score")
    print(f"Score after close: {score_after}")

    evals = frappe.get_all("Employee Evaluation", filters={"employee": employee_id}, fields=["*"])
    print(f"Evals: {evals}")

    logs = frappe.get_all("Employee Evaluation Score Log", filters={"employee": employee_id}, fields=["*"])
    print(f"get_all Logs: {logs}")
    
    db_logs = frappe.db.sql("select name, employee, `change`, new_score from `tabEmployee Evaluation Score Log` where employee = %s", employee_id, as_dict=True)
    print(f"Direct SQL Logs: {db_logs}")
    
    frappe.db.rollback()
