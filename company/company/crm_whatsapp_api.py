import frappe
import requests
from frappe.utils import now_datetime
from datetime import timedelta
import secrets

# --------------------------------------------------------------------
# TEST CONNECTION
# --------------------------------------------------------------------

@frappe.whitelist(allow_guest=False)
def get_monthly_message_count():
    from frappe.utils import get_first_day, today
    start_of_month = get_first_day(today())
    count = frappe.db.count(
        "CRM WhatsApp Message",
        filters={
            "creation": [">=", start_of_month],
            "message_direction": "Outgoing",
            "status": "Sent"
        }
    )
    return count


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

            frappe.logger().info(settings.last_connected_on)
            frappe.db.commit()

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


def get_temporary_file_url(file_doc):

    token = secrets.token_urlsafe(32)

    frappe.cache().set_value(
        f"wa_file:{token}",
        file_doc.name,
        expires_in_sec=300  # 5 minutes
    )

    return (
        frappe.utils.get_url()
        + f"/api/method/company.company.crm_whatsapp_api.download_file"
        + f"?token={token}"
    )

@frappe.whitelist(allow_guest=True)
def download_file(token):

    file_name = frappe.cache().get_value(
        f"wa_file:{token}"
    )

    if not file_name:
        frappe.throw(
            "Link expired",
            frappe.PermissionError
        )

    file_doc = frappe.get_doc(
        "File",
        file_name
    )

    frappe.local.response.filename = (
        file_doc.file_name
    )

    frappe.local.response.filecontent = (
        file_doc.get_content()
    )

    frappe.local.response.type = "download"


# --------------------------------------------------------------------
# SEND WHATSAPP MESSAGE
# --------------------------------------------------------------------

@frappe.whitelist()
def send_whatsapp(phone, message=None, attachment=None):

    settings = frappe.get_single(
        "CRM WhatsApp Settings"
    )

    try:
        clean_phone = "".join(filter(str.isdigit, str(phone)))
        if not clean_phone:
            return {
                "success": False,
                "error": "Invalid phone number"
            }

        # Check max success send message limit
        limit = settings.max_success_send_message_limit or 0
        if limit > 0:
            count = get_monthly_message_count()
            if count >= limit:
                return {
                    "success": False,
                    "error": f"Max success send message limit of {limit} reached."
                }

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

            if file_doc.is_private:
                file_url = get_temporary_file_url(
                    file_doc
                )
            else:
                import urllib.parse
                file_url = frappe.utils.get_url(
                    urllib.parse.quote(file_doc.file_url, safe='/')
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
                    "to": clean_phone,
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
                    "to": clean_phone,
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
                "to": clean_phone,
                "type": "text",
                "text": {
                    "body": message or ""
                }
            }

        # ----------------------------------------------------
        # SEND TEXT FIRST + DOCUMENT SECOND
        # ----------------------------------------------------

        meta_message_id = ""
        result = {}

        if (
            attachment
            and message
            and message_type == "Document"
        ):

            # Send text first

            text_payload = {
                "messaging_product": "whatsapp",
                "to": clean_phone,
                "type": "text",
                "text": {
                    "body": message
                }
            }

            text_response = requests.post(
                url,
                headers=headers,
                json=text_payload,
                timeout=30
            )

            text_result = text_response.json()

            frappe.logger().info(
                f"WhatsApp Text Response: {text_result}"
            )

            if text_response.status_code != 200:
                err_msg = text_result.get("error", {}).get("message") if isinstance(text_result, dict) else str(text_result)
                return {
                    "success": False,
                    "error": err_msg or text_result
                }

            # Send document second

            response = requests.post(
                url,
                headers=headers,
                json=payload,
                timeout=30
            )

            result = response.json()

            frappe.logger().info(
                f"WhatsApp Document Response: {result}"
            )

            if response.status_code != 200:
                err_msg = result.get("error", {}).get("message") if isinstance(result, dict) else str(result)
                return {
                    "success": False,
                    "error": err_msg or result
                }

        else:

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
                err_msg = result.get("error", {}).get("message") if isinstance(result, dict) else str(result)
                return {
                    "success": False,
                    "error": err_msg or result
                }

        # ----------------------------------------------------
        # GET META MESSAGE ID
        # ----------------------------------------------------

        if result.get("messages"):

            meta_message_id = (
                result["messages"][0]
                .get("id", "")
            )

        # ----------------------------------------------------
        # GET OR CREATE CONVERSATION
        # ----------------------------------------------------

        conversation_name = frappe.db.exists(
            "CRM WhatsApp Conversation",
            {
                "mobile_number": clean_phone
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
                    clean_phone,

                "contact_name":
                    clean_phone,

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

        # Try to find a matching lead to link
        lead_name = frappe.db.get_value("Lead", {"phone_number": ["like", f"%{clean_phone[-10:]}"]})

        msg_doc = frappe.get_doc({

            "doctype":
                "CRM WhatsApp Message",

            "conversation":
                conversation.name,

            "mobile_number":
                clean_phone,

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

            "lead":
                lead_name,

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

        update_vals = {
            "last_message_on": frappe.utils.now()
        }

        if message:
            update_vals["last_message"] = message
        elif attachment:
            update_vals["last_message"] = f"{message_type} Sent"

        frappe.db.set_value(
            "CRM WhatsApp Conversation",
            conversation.name,
            update_vals
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


# --------------------------------------------------------------------
# GET WHATSAPP MESSAGES
# --------------------------------------------------------------------

@frappe.whitelist()
def get_whatsapp_messages(phone, start=0, limit=10):
    if not phone:
        return []

    clean_phone = "".join(filter(str.isdigit, str(phone)))

    conversation_name = frappe.db.get_value(
        "CRM WhatsApp Conversation",
        {"mobile_number": clean_phone}
    )

    if not conversation_name and clean_phone != phone:
        conversation_name = frappe.db.get_value(
            "CRM WhatsApp Conversation",
            {"mobile_number": phone}
        )

    if not conversation_name:
        return []

    # Reset unread count
    frappe.db.set_value(
        "CRM WhatsApp Conversation",
        conversation_name,
        "unread_count",
        0
    )
    frappe.db.commit()

    messages = frappe.get_all(
        "CRM WhatsApp Message",
        filters={"conversation": conversation_name},
        fields=["name", "message_direction", "message_type", "message_content", "attachment", "status", "creation"],
        order_by="creation desc",
        limit_start=int(start),
        limit_page_length=int(limit)
    )

    messages.reverse()

    return messages


# --------------------------------------------------------------------
# LEAD WHATSAPP TEMPLATE PREVIEW & SEND
# --------------------------------------------------------------------

@frappe.whitelist()
def get_lead_whatsapp_template_preview(lead_id, template_name):
    """
    Renders CRM WhatsApp Template header, message_body, and footer for a specific Lead.
    """
    if not lead_id or not template_name:
        frappe.throw("Lead ID and Template Name are required")

    lead = frappe.get_doc("Lead", lead_id)
    template = frappe.get_doc("CRM WhatsApp Template", template_name)

    from company.company.doctype.crm_whatsapp_automation.crm_whatsapp_automation import replace_template_variables

    header = replace_template_variables(template.header_text or "", lead)
    body = replace_template_variables(template.message_body or "", lead)
    footer = replace_template_variables(template.footer_text or "", lead)

    lead_name = lead.get("lead_name") or lead.get("full_name") or lead.name or ""

    import re
    def cleanup_text(text):
        if not text:
            return ""
        text = text.replace("&nbsp;", " ").replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">")
        text = re.sub(r'\{\{\s*(?:doc\.)?lead_name\s*\}\}', lead_name, text, flags=re.IGNORECASE)
        text = re.sub(r'\{\{\s*(?:doc\.)?full_name\s*\}\}', lead_name, text, flags=re.IGNORECASE)
        text = re.sub(r'\{\{\s*(?:doc\.)?name\s*\}\}', lead.name or "", text, flags=re.IGNORECASE)
        text = re.sub(r'\{\{\s*(?:doc\.)?phone(?:_number)?\s*\}\}', lead.phone_number or "", text, flags=re.IGNORECASE)
        text = re.sub(r'\{\{\s*(?:doc\.)?company(?:_name)?\s*\}\}', lead.get("company_name") or "", text, flags=re.IGNORECASE)
        return text

    header = cleanup_text(header)
    body = cleanup_text(body)
    footer = cleanup_text(footer)
    full_message = "\n\n".join(part for part in [header, body, footer] if part)

    attachments = []
    if template.allow_attachment:
        if template.get("default_attachment"):
            for att in template.default_attachment:
                if att.file:
                    attachments.append({
                        "file": att.file,
                        "file_name": (att.file or "").split("/")[-1],
                        "description": getattr(att, "description", "") or "",
                        "file_size": getattr(att, "file_size", "") or "",
                    })
        if not attachments:
            child_rows = frappe.get_all(
                "CRM WhatsApp Template Attachment",
                filters={"parent": template.name},
                fields=["file", "description", "file_size"]
            )
            for att in child_rows:
                if att.file:
                    attachments.append({
                        "file": att.file,
                        "file_name": (att.file or "").split("/")[-1],
                        "description": att.description or "",
                        "file_size": att.file_size or "",
                    })

    return {
        "header": header,
        "body": body,
        "footer": footer,
        "rendered_message": full_message,
        "attachments": attachments,
        "allow_attachment": bool(template.allow_attachment),
        "phone_number": lead.phone_number,
        "lead_name": lead_name,
    }


@frappe.whitelist()
def send_lead_whatsapp_template(lead_id, template_name, custom_message=None, attachment=None):
    """
    Renders and sends a CRM WhatsApp Template to a Lead.
    """
    if not lead_id or not template_name:
        frappe.throw("Lead ID and Template Name are required")

    lead = frappe.get_doc("Lead", lead_id)
    phone_number = lead.phone_number
    if not phone_number:
        frappe.throw("Lead does not have a phone number")

    template = frappe.get_doc("CRM WhatsApp Template", template_name)

    if custom_message:
        message_to_send = custom_message
    else:
        from company.company.doctype.crm_whatsapp_automation.crm_whatsapp_automation import replace_template_variables
        header = replace_template_variables(template.header_text or "", lead)
        body = replace_template_variables(template.message_body or "", lead)
        footer = replace_template_variables(template.footer_text or "", lead)
        message_to_send = "\n\n".join(part for part in [header, body, footer] if part)

    attachment_to_send = attachment
    if not attachment_to_send and template.allow_attachment and template.get("default_attachment"):
        files = [att.file for att in template.default_attachment if att.file]
        if files:
            attachment_to_send = files[0]

    response = send_whatsapp(
        phone=phone_number,
        message=message_to_send,
        attachment=attachment_to_send,
    )

    if response.get("success") and response.get("message_doc"):
        frappe.db.set_value("CRM WhatsApp Message", response["message_doc"], "message_type", "Template")
        frappe.db.commit()

    if response.get("success") and not attachment and template.allow_attachment and template.get("default_attachment"):
        files = [att.file for att in template.default_attachment if att.file]
        if len(files) > 1:
            for extra in files[1:]:
                send_whatsapp(phone=phone_number, message=None, attachment=extra)

    return response
