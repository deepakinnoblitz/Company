frappe.ui.form.on("Leave Application", {
    from_date: function (frm) { frm.trigger("calculate_total_days"); },
    to_date: function (frm) { frm.trigger("calculate_total_days"); },
    half_day: function (frm) { frm.trigger("calculate_total_days"); },
    leave_type: function (frm) { frm.trigger("calculate_total_days"); },
    employee: function (frm) { frm.trigger("calculate_total_days"); },
    permission_hours: function (frm) { frm.trigger("calculate_total_days"); },

    calculate_total_days: function (frm) {

        if (!frm.doc.employee || !frm.doc.leave_type || !frm.doc.from_date || !frm.doc.to_date) {
            frm.set_value("total_days", 0);
            return;
        }

        // ---------- Permission Hours Validation ----------
        if (frm.doc.permission_hours && frm.doc.permission_hours < 10) {
            frappe.msgprint(__('Permission hours should be entered in minutes only.'));
            frm.set_value("permission_hours", 0);
            return;
        }

        // ---------- Total Days Calculation ----------
        let days = frappe.datetime.get_diff(frm.doc.to_date, frm.doc.from_date) + 1;

        // Apply half-day correctly: subtract 0.5 from total
        if (frm.doc.half_day) {
            days -= 0.5;   // <-- Correct behaviour
        }

        frm.set_value("total_days", days);

        // ---------- Check Leave Balance ----------
        frappe.call({
            method: "company.company.api.check_leave_balance",
            args: {
                employee: frm.doc.employee,
                leave_type: frm.doc.leave_type,
                from_date: frm.doc.from_date,
                to_date: frm.doc.to_date,
                half_day: frm.doc.half_day ? 1 : 0,
                permission_hours: frm.doc.permission_hours
            },
            callback: function (r) {
                const res = r.message || {};

                if (res.allowed === false) {
                    frappe.msgprint(
                        __('Not enough leave balance.<br>Available: '
                            + res.remaining + ' ' + res.unit + '<br>Requested: '
                            + res.requested + ' ' + res.unit)
                    );
                    frm.set_value("total_days", 0);
                }
            }
        });
    }
});
