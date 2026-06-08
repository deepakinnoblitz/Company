import frappe

@frappe.whitelist()
def update_lead_workflow():
    """
    Programmatically update the Lead Workflow to allow transitions between any two states.
    Ensures that 'Move to [State]' actions exist in Workflow Action Master.
    """
    try:
        # 1. Get all documented states for Lead Workflow
        states = frappe.db.get_all("Workflow Document State", {"parent": "Lead Workflow"}, pluck="state")
        
        if not states:
            print("No states found for Lead Workflow")
            return

        # 2. Ensure all actions exist in Workflow Action Master
        for ns in states:
            action_name = f"Move to {ns}"
            if not frappe.db.exists("Workflow Action Master", action_name):
                frappe.get_doc({
                    "doctype": "Workflow Action Master",
                    "workflow_action_name": action_name
                }).insert(ignore_permissions=True)
        
        # 3. Clear existing transitions and add all possible combinations
        frappe.db.delete("Workflow Transition", {"parent": "Lead Workflow"})
        
        idx = 0
        for s in states:
            for ns in states:
                if s == ns: continue
                idx += 1
                doc = frappe.new_doc("Workflow Transition")
                doc.parent = "Lead Workflow"
                doc.parenttype = "Workflow"
                doc.parentfield = "transitions"
                doc.state = s
                doc.action = f"Move to {ns}"
                doc.next_state = ns
                doc.allowed = "All"
                doc.idx = idx
                doc.insert(ignore_permissions=True)
        
        frappe.db.commit()
        print(f"Workflow transitions updated successfully. Total transitions: {idx}")
        return {"status": "success", "transitions": idx}
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Lead Workflow Update Error")
        print(f"Error: {str(e)}")
        return {"status": "error", "message": str(e)}


@frappe.whitelist()
def update_lead_workflow_v2():

    workflow_name = "Lead Workflow"

    states = [
        "New Lead",
        "Contacted",
        "Qualified",
        "Proposal Sent",
        "In Negotiation",
        "Follow-up Scheduled",
        "On Hold",
        "Proposal Approved",
        "Proposal Rejected",
        "In Active",
        "Not Interested"
    ]

    # Create Workflow Action Master records
    for state in states:
        action_name = f"Move to {state}"

        if not frappe.db.exists(
            "Workflow Action Master",
            action_name
        ):
            frappe.get_doc({
                "doctype": "Workflow Action Master",
                "workflow_action_name": action_name
            }).insert(
                ignore_permissions=True
            )

    # Remove existing transitions
    frappe.db.delete(
        "Workflow Transition",
        {
            "parent": workflow_name
        }
    )

    idx = 1

    # Create all possible transitions
    for current_state in states:
        for next_state in states:

            if current_state == next_state:
                continue

            frappe.get_doc({
                "doctype": "Workflow Transition",
                "parent": workflow_name,
                "parenttype": "Workflow",
                "parentfield": "transitions",
                "state": current_state,
                "action": f"Move to {next_state}",
                "next_state": next_state,
                "allowed": "All",
                "idx": idx
            }).insert(
                ignore_permissions=True
            )

            idx += 1

    frappe.db.commit()

    return {
        "status": "success",
        "states": len(states),
        "transitions": idx - 1
    }