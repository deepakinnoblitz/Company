import frappe
import requests


# --------------------------------------------------------------------
# TEST CONNECTION
# --------------------------------------------------------------------

@frappe.whitelist()
def test_connection():

    settings = frappe.get_single(
        "CRM WhatsApp Settings"
    )

    try:

        url = (
            f"https://graph.facebook.com/v23.0/"
            f"{settings.phone_number_id}"
        )

        headers = {
            "Authorization":
                f"Bearer {settings.get_password('access_token')}"
        }

        response = requests.get(
            url,
            headers=headers,
            timeout=30
        )

        if response.status_code == 200:

            settings.connection_status = "Connected"
            settings.last_connected_on = frappe.utils.now()
            settings.save(ignore_permissions=True)

            return {
                "success": True,
                "message": "Connected Successfully"
            }

        return {
            "success": False,
            "error": response.text
        }

    except Exception:

        frappe.log_error(
            frappe.get_traceback(),
            "WhatsApp Test Connection Error"
        )

        return {
            "success": False,
            "error": str(frappe.get_traceback())
        }


# --------------------------------------------------------------------
# SEND WHATSAPP MESSAGE
# --------------------------------------------------------------------

@frappe.whitelist()
def send_whatsapp(phone, message=None, attachment=None):

    settings = frappe.get_single(
        "CRM WhatsApp Settings"
    )

    try:

        url = (
            f"https://graph.facebook.com/v23.0/"
            f"{settings.phone_number_id}/messages"
        )

        headers = {
            "Authorization":
                f"Bearer {settings.get_password('access_token')}",
            "Content-Type":
                "application/json"
        }

        payload = None
        message_type = "Text"

        # ----------------------------------------------------
        # ATTACHMENT MESSAGE
        # ----------------------------------------------------

        if attachment:

            file_doc = frappe.get_doc(
                "File",
                {
                    "file_url": attachment
                }
            )

            file_url = frappe.utils.get_url(
                file_doc.file_url
            )

            extension = (
                file_doc.file_name.split(".")[-1]
                .lower()
            )

            image_extensions = [
                "jpg",
                "jpeg",
                "png",
                "gif",
                "webp"
            ]

            if extension in image_extensions:

                payload = {
                    "messaging_product": "whatsapp",
                    "to": str(phone),
                    "type": "image",
                    "image": {
                        "link": file_url,
                        "caption": message or ""
                    }
                }

                message_type = "Image"

            else:

                payload = {
                    "messaging_product": "whatsapp",
                    "to": str(phone),
                    "type": "document",
                    "document": {
                        "link": file_url,
                        "filename": file_doc.file_name
                    }
                }

                message_type = "Document"

        # ----------------------------------------------------
        # TEXT MESSAGE
        # ----------------------------------------------------

        else:

            payload = {
                "messaging_product": "whatsapp",
                "to": str(phone),
                "type": "text",
                "text": {
                    "body": message or ""
                }
            }

        # ----------------------------------------------------
        # SEND PRIMARY MESSAGE
        # ----------------------------------------------------

        response = requests.post(
            url,
            headers=headers,
            json=payload,
            timeout=30
        )

        result = response.json()

        frappe.logger().info(
            f"WhatsApp Response: {result}"
        )

        if response.status_code != 200:

            return {
                "success": False,
                "error": result
            }

        meta_message_id = ""

        if result.get("messages"):

            meta_message_id = (
                result["messages"][0]
                .get("id", "")
            )

        # ----------------------------------------------------
        # DOCUMENT + TEXT
        # ----------------------------------------------------

        if (
            attachment
            and message
            and message_type == "Document"
        ):

            text_payload = {
                "messaging_product": "whatsapp",
                "to": str(phone),
                "type": "text",
                "text": {
                    "body": message
                }
            }

            requests.post(
                url,
                headers=headers,
                json=text_payload,
                timeout=30
            )

        # ----------------------------------------------------
        # GET OR CREATE CONVERSATION
        # ----------------------------------------------------

        conversation_name = frappe.db.exists(
            "CRM WhatsApp Conversation",
            {
                "mobile_number": str(phone)
            }
        )

        if conversation_name:

            conversation = frappe.get_doc(
                "CRM WhatsApp Conversation",
                conversation_name
            )

        else:

            conversation = frappe.get_doc({

                "doctype":
                    "CRM WhatsApp Conversation",

                "mobile_number":
                    str(phone),

                "contact_name":
                    str(phone),

                "status":
                    "Open",

                "unread_count":
                    0

            })

            conversation.insert(
                ignore_permissions=True
            )

        # ----------------------------------------------------
        # STORE MESSAGE
        # ----------------------------------------------------

        msg_doc = frappe.get_doc({

            "doctype":
                "CRM WhatsApp Message",

            "conversation":
                conversation.name,

            "mobile_number":
                str(phone),

            "message_direction":
                "Outgoing",

            "message_type":
                message_type,

            "message_content":
                message or "",

            "attachment":
                attachment or "",

            "meta_message_id":
                meta_message_id,

            "status":
                "Sent",

            "raw_payload":
                frappe.as_json(
                    result,
                    indent=2
                )

        })

        msg_doc.insert(
            ignore_permissions=True
        )

        # ----------------------------------------------------
        # UPDATE CONVERSATION
        # ----------------------------------------------------

        if message:

            conversation.last_message = message

        elif attachment:

            conversation.last_message = (
                f"{message_type} Sent"
            )

        conversation.last_message_on = (
            frappe.utils.now()
        )

        conversation.save(
            ignore_permissions=True
        )

        frappe.db.commit()

        return {

            "success": True,

            "message":
                "WhatsApp Message Sent Successfully",

            "conversation":
                conversation.name,

            "message_doc":
                msg_doc.name,

            "meta_message_id":
                meta_message_id,

            "data":
                result

        }

    except Exception:

        frappe.log_error(
            frappe.get_traceback(),
            "WhatsApp Send Message Error"
        )

        return {

            "success": False,

            "error":
                frappe.get_traceback()

        }