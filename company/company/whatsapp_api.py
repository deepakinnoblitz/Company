import frappe
import requests

# --------------------------------------------------------------------
# TEST CONNECTION
# --------------------------------------------------------------------

@frappe.whitelist()
def test_connection():

    settings = frappe.get_single("CRM WhatsApp Settings")

    try:

        url = f"https://graph.facebook.com/v23.0/{settings.phone_number_id}"

        headers = {
            "Authorization": f"Bearer {settings.get_password('access_token')}"
        }

        response = requests.get(url, headers=headers)

        if response.status_code == 200:

            settings.connection_status = "Connected"
            settings.last_connected_on = frappe.utils.now()
            settings.save(ignore_permissions=True)

            frappe.msgprint(
                "WhatsApp Connected Successfully ✅",
                title="Success",
                indicator="green"
            )

            return {
                "success": True,
                "message": "Connected Successfully"
            }

        settings.connection_status = "Disconnected"
        settings.save(ignore_permissions=True)

        frappe.throw(response.text)

    except Exception:
        frappe.log_error(
            frappe.get_traceback(),
            "WhatsApp Test Connection Error"
        )
        raise


# --------------------------------------------------------------------
# SEND TEST MESSAGE
# --------------------------------------------------------------------

@frappe.whitelist()
def send_test_message(phone):

    settings = frappe.get_single("CRM WhatsApp Settings")

    try:

        url = f"https://graph.facebook.com/v23.0/{settings.phone_number_id}/messages"

        headers = {
            "Authorization": f"Bearer {settings.get_password('access_token')}",
            "Content-Type": "application/json"
        }

        payload = {
            "messaging_product": "whatsapp",
            "to": str(phone),
            "type": "text",
            "text": {
                "body": "Hello from Innoblitz CRM 🚀"
            }
        }

        response = requests.post(
            url,
            headers=headers,
            json=payload,
            timeout=30
        )

        result = response.json()

        frappe.logger().info(
            f"WhatsApp Status Code: {response.status_code}"
        )

        frappe.logger().info(
            f"WhatsApp Response: {result}"
        )

        if response.status_code == 200:

            frappe.msgprint(
                "WhatsApp Message Sent Successfully ✅",
                title="Success",
                indicator="green"
            )

            return {
                "success": True,
                "message": "Message Sent Successfully",
                "data": result
            }

        error_message = (
            result.get("error", {})
            .get("message", response.text)
        )

        frappe.throw(
            f"WhatsApp Error: {error_message}"
        )

    except requests.exceptions.RequestException as e:

        frappe.throw(
            f"Request Error: {str(e)}"
        )

    except Exception:

        frappe.log_error(
            frappe.get_traceback(),
            "WhatsApp Send Message Error"
        )

        raise