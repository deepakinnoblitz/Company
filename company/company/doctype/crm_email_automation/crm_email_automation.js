frappe.ui.form.on('CRM Email Automation', {
    onload: function(frm) {
        if (frm.doc.filters) {
            frm.doc.filters.forEach(row => {
                setup_value_suggestions(frm, row.doctype, row.name);
            });
        }
    },
    refresh(frm) {
        // Validation messages
    },
    frequency: function(frm) {
        if (frm.doc.frequency !== 'Weekly') {
            frm.set_value('week_day', '');
        }
        if (frm.doc.frequency !== 'Monthly') {
            frm.set_value('day_of_month', 0);
        }
    },
    validate: function(frm) {
        if (frm.doc.frequency === 'Weekly' && !frm.doc.week_day) {
            frappe.msgprint(__('Please specify the Week Day for Weekly automation.'));
            frappe.validated = false;
        }
        if (frm.doc.frequency === 'Monthly' && (!frm.doc.day_of_month || frm.doc.day_of_month < 1 || frm.doc.day_of_month > 31)) {
            frappe.msgprint(__('Please specify a valid Day of Month (1-31) for Monthly automation.'));
            frappe.validated = false;
        }
    }
});

frappe.ui.form.on('CRM Campaign Filter', {
    field_name: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        frappe.model.set_value(cdt, cdn, 'value', '');
        setup_value_suggestions(frm, cdt, cdn);
    },
    filters_add: function(frm, cdt, cdn) {
        setup_value_suggestions(frm, cdt, cdn);
    },
    value: function(frm, cdt, cdn) {
        setup_value_suggestions(frm, cdt, cdn);
    }
});

function setup_value_suggestions(frm, cdt, cdn) {
    let row = locals[cdt][cdn];
    if (!row || !row.field_name || !frm.doc.target_type) {
        return;
    }
    
    frappe.call({
        method: 'company.company.doctype.crm_email_campaign.crm_email_campaign.get_filter_value_options',
        args: {
            target_type: frm.doc.target_type,
            field_name: row.field_name
        },
        callback: function(r) {
            if (r.message) {
                let grid_row = frm.fields_dict['filters'].grid.get_row(cdn);
                if (grid_row) {
                    let field = grid_row.fields_dict['value'];
                    if (field) {
                        field.df.options = r.message;
                        if (field.awesomplete) {
                            field.awesomplete.list = r.message;
                        }
                    }
                }
            }
        }
    });
}
