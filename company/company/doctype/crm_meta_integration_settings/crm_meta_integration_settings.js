// Copyright (c) 2026, deepak and contributors
// For license information, please see license.txt

frappe.ui.form.on("CRM Meta Integration Settings", {
    refresh(frm) {
        frm.trigger("show_mandatory_fields_alert");
        frm.trigger("setup_lead_field_options");
        
        // Auto-populate mandatory rows if this is a new document and the table is empty
        if (frm.is_new() && (!frm.doc.field_mappings || frm.doc.field_mappings.length === 0)) {
            frm.trigger("auto_populate_mandatory_fields");
        }

        // Dynamically set webhook URL in JS so it renders immediately even for new docs
        let webhook_path = "/api/method/company.company.crm_meta_api.webhook";
        frm.set_value("webhook_url", frappe.urllib.get_base_url() + webhook_path);

        // Add Copy Webhook URL button
        frm.add_custom_button(__("Copy Webhook URL"), function() {
            if (frm.doc.webhook_url) {
                let url = frm.doc.webhook_url;
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(url).then(() => {
                        frappe.show_alert({
                            message: __("Webhook URL copied to clipboard!"),
                            indicator: "green"
                        });
                    });
                } else {
                    // Fallback for HTTP connections
                    let textarea = document.createElement("textarea");
                    textarea.value = url;
                    textarea.style.position = "fixed";  // Avoid scrolling to bottom
                    document.body.appendChild(textarea);
                    textarea.select();
                    try {
                        document.execCommand("copy");
                        frappe.show_alert({
                            message: __("Webhook URL copied to clipboard!"),
                            indicator: "green"
                        });
                    } catch (err) {
                        frappe.show_alert({
                            message: __("Failed to copy URL. Please copy manually."),
                            indicator: "red"
                        });
                    }
                    document.body.removeChild(textarea);
                }
            }
        });
    },
    
    setup_lead_field_options(frm) {
        frappe.call({
            method: "company.company.doctype.crm_meta_integration_settings.crm_meta_integration_settings.get_lead_fields",
            callback: function(r) {
                if (r.message && r.message.length > 0) {
                    let options = r.message.map(f => f.fieldname).sort();
                    let options_str = ["", ...options].join("\n");
                    
                    // Set select options dynamically directly on the Child DocType's field
                    let field = frappe.meta.get_docfield("Meta Field Mapping", "lead_field", frm.doc.name);
                    if (field) {
                        field.options = options_str;
                    }
                    frm.refresh_field("field_mappings");
                }
            }
        });
    },
    
    auto_populate_mandatory_fields(frm) {
        frappe.call({
            method: "company.company.doctype.crm_meta_integration_settings.crm_meta_integration_settings.get_mandatory_lead_fields",
            callback: function(r) {
                if (r.message && r.message.length > 0) {
                    // Mapping defaults for common keys
                    const default_meta_keys = {
                        "lead_name": "full_name",
                        "email": "email",
                        "phone_number": "phone_number"
                    };

                    r.message.forEach(f => {
                        let row = frm.add_child("field_mappings");
                        row.lead_field = f.fieldname;
                        row.meta_label = f.label;
                        row.meta_key = default_meta_keys[f.fieldname] || "";
                        
                        // Set standard default fallback values for CRM lead properties
                        if (f.fieldname === "leads_from") {
                            row.default_value = "Meta Lead Ads";
                        } else if (f.fieldname === "leads_type") {
                            row.default_value = "Incoming";
                        }
                    });
                    
                    frm.refresh_field("field_mappings");
                }
            }
        });
    },
    
    show_mandatory_fields_alert(frm) {
        frappe.call({
            method: "company.company.doctype.crm_meta_integration_settings.crm_meta_integration_settings.get_mandatory_lead_fields",
            callback: function(r) {
                if (r.message && r.message.length > 0) {
                    let fields_list = r.message.map(f => `<li><b>${f.label}</b> (<code>${f.fieldname}</code>)</li>`).join("");
                    let alert_html = `
                        <div style="padding: 12px; background-color: var(--light-red, #fff3f3); border-left: 4px solid var(--red, #ff5858); border-radius: 4px; margin-bottom: 5px; color: var(--text-color, #333);">
                            <span style="font-weight: bold; color: var(--red, #d2322d);">Mandatory Lead Fields:</span>
                            <p style="margin: 5px 0 0 0; font-size: 0.9em;">
                                Please ensure the following mandatory fields from the Lead DocType are configured in your field mapping table below (as mapped fields or static defaults) to prevent webhook processing failures:
                            </p>
                            <ul style="margin: 8px 0 0 15px; padding: 0; font-size: 0.9em; line-height: 1.4em;">
                                ${fields_list}
                            </ul>
                        </div>
                    `;
                    
                    frm.fields_dict.mandatory_fields_alert.html(alert_html);
                }
            }
        });
    }
});
