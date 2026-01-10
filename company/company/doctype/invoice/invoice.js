// Copyright (c) 2025, deepak and contributors
// For license information, please see license.txt

// frappe.ui.form.on("Invoice", {
// 	refresh(frm) {

// 	},
// });

frappe.ui.form.on("Invoice", {
    refresh(frm) {
        toggle_conversion_section(frm);

        if (!frm.doc.__islocal)
        {

            frm.add_custom_button("Preview PDF", function()
            {

                let doctype = "Invoice";
                let name = encodeURIComponent(frm.doc.name);
                let format = encodeURIComponent("Invoice Print Format");

                // Preview PDF (open in browser)
                let url = `/api/method/frappe.utils.print_format.download_pdf?
                doctype=${doctype}
                &name=${name}
                &format=${format}
                &no_letterhead=1
                &letterhead=No Letterhead
                &settings={}
                &trigger_print=0
            `.replace(/\s+/g, "");

                window.open(url, "_blank");

            }, "Print Invoice"); // Under Print dropdown



            frm.add_custom_button("Download PDF", function()
            {

                let doctype = "Invoice";
                let name = encodeURIComponent(frm.doc.name);
                let format = encodeURIComponent("Invoice Print Format");

                // ⬇️ Force Download URL
                let url = `/api/method/frappe.utils.print_format.download_pdf?
                doctype=${doctype}
                &name=${name}
                &format=${format}
                &no_letterhead=1
                &letterhead=No Letterhead
                &settings={}
                &download=1
            `.replace(/\s+/g, "");

                // === FORCE DOWNLOAD ===
                let a = document.createElement("a");
                a.href = url;
                a.download = `${frm.doc.name}.pdf`;
                document.body.appendChild(a);
                a.click();
                a.remove();

            }, "Print Invoice");


        }
    },
    converted_from_estimation(frm) {
        toggle_conversion_section(frm);
    },
    client_name(frm) {
        if (!frm.doc.client_name) return;

        frappe.db.get_value("Contacts", frm.doc.client_name, 
        ["phone"], 
        (r) => {
            if (r) {
                frm.set_value("phone_number", r.phone || "");
            }
        });
    },
});
 
function toggle_conversion_section(frm) {
    if (frm.doc.converted_from_estimation == 1) {
        // Show the section
        frm.set_df_property("converted_from_estimation", "hidden", 0);
        frm.set_df_property("converted_estimation_id", "hidden", 0);
    } else {
        // Hide the section
        frm.set_df_property("converted_from_estimation", "hidden", 1);
        frm.set_df_property("converted_estimation_id", "hidden", 1);
    }
}

