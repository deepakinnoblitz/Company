frappe.ui.form.on('CRM WhatsApp Settings', {
    refresh(frm) {

        frm.add_custom_button('Test Connection', () => {
            frappe.call({
                method: 'company.company.whatsapp_api.test_connection',
                callback(r) {
                    frappe.msgprint('✅ Connected Successfully');
                }
            });
        });

        frm.add_custom_button('Send Test Message', () => {
            frappe.prompt(
                [
                    {
                        label: 'Phone Number',
                        fieldname: 'phone',
                        fieldtype: 'Data',
                        reqd: 1
                    }
                ],
                (values) => {
                    frappe.call({
                        method: 'company.company.whatsapp_api.send_test_message',
                        args: {
                            phone: values.phone
                        }
                    });
                },
                'Send Test Message',
                'Send'
            );
        });

        frm.add_custom_button('Copy Webhook URL', () => {
            navigator.clipboard.writeText(frm.doc.webhook_url);
            frappe.show_alert({
                message: 'Webhook URL Copied',
                indicator: 'green'
            });
        });
    }
});