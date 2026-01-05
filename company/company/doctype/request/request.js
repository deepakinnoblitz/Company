// Copyright (c) 2025, deepak and contributors
// For license information, please see license.txt

// frappe.ui.form.on("Request", {
// 	refresh(frm) {

// 	},
// });

frappe.ui.form.on("Request", {
    subject(frm) {
        const field = frm.doc.subject || "";
        if (field.length > 130) {
            frappe.msgprint({
                title: "Character Limit Exceeded",
                indicator: "red",
                message: `Subject exceeds 140 characters. Currently ${field.length} characters.`
            });
        }
    },

    after_save: function(frm) {
        if (frm.doc.docstatus === 0) {
            frappe.call({
                method: "frappe.client.submit",
                args: {
                    doc: frm.doc  // ✅ pass the full document, not just name
                },
                callback: function(r) {
                    if (!r.exc) {
                        frappe.msgprint("✅ Request submitted.");
                        frappe.set_route("Form", frm.doc.doctype, frm.doc.name);
                    }
                }
            });
        }
    }
});



