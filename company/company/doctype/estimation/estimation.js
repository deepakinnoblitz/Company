frappe.ui.form.on("Estimation",
{
    refresh(frm)
    {
        $('.page-icon-group .icon-btn').hide();

        // Show button only when document is saved
        if (!frm.doc.__islocal)
        {

            frm.add_custom_button("Create Invoice", function()
            {

                frappe.call(
                {
                    method: "company.company.api.convert_estimation_to_invoice",
                    args:
                    {
                        estimation: frm.doc.name
                    },
                    callback: function(r)
                    {
                        if (r.message)
                        {
                            frappe.set_route("Form", "Invoice", r.message);
                        }
                    }
                });

            });


            frm.add_custom_button("Preview PDF", function()
            {

                let doctype = "Estimation";
                let name = encodeURIComponent(frm.doc.name);
                let format = encodeURIComponent("Estimation Print Style");

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

            }, "Print Estimation"); // Under Print dropdown



            frm.add_custom_button("Download PDF", function()
            {

                let doctype = "Estimation";
                let name = encodeURIComponent(frm.doc.name);
                let format = encodeURIComponent("Estimation Print Style");

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

            }, "Print Estimation");


        }

    }
});