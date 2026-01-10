/**
 * Beautifies technical Frappe error messages.
 * e.g., converts snake_case field names to Title Case.
 */
function beautifyFrappeMessage(msg: string): string {
    if (!msg) return msg;

    // Remove "Error: " prefix if it exists
    const cleanMsg = msg.replace(/^Error:\s*/i, '');

    // 1. Handle MandatoryError
    // frappe.exceptions.MandatoryError: [Employee, EMP00027]: employee_id, email
    if (cleanMsg.includes('MandatoryError')) {
        const parts = cleanMsg.split(':');
        const fieldPart = parts[parts.length - 1];
        if (fieldPart) {
            const fields = fieldPart.split(',').map(f => f.trim()).filter(Boolean);
            const beautifiedFields = fields.map(f =>
                f.split('_')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ')
            );
            return `Mandatory Fields Required: ${beautifiedFields.join(', ')}`;
        }
    }

    return cleanMsg;
}

/**
 * Parses Frappe server error responses to extract human-readable messages.
 * Frappe often sends errors in `_server_messages` as stringified JSON.
 */
export function handleFrappeError(json: any, defaultMessage: string = "An error occurred"): string {
    if (!json) return defaultMessage;

    const rawMessages: string[] = [];

    // 1. Try to parse _server_messages
    if (json._server_messages) {
        try {
            const serverMsgs = JSON.parse(json._server_messages);
            if (Array.isArray(serverMsgs)) {
                serverMsgs.forEach((m: string | any) => {
                    try {
                        const inner = typeof m === 'string' ? JSON.parse(m) : m;
                        if (inner.message) rawMessages.push(inner.message);
                    } catch {
                        if (typeof m === 'string') rawMessages.push(m);
                    }
                });
            }
        } catch (e) {
            console.error("Failed to parse _server_messages", e);
        }
    }

    // 2. Include exception
    if (json.exception) {
        const excLines = json.exception.split('\n');
        if (excLines[0]) rawMessages.push(excLines[0]);
    }

    // 3. Include message
    if (json.message && typeof json.message === 'string') {
        rawMessages.push(json.message);
    }

    // Process and Deduplicate
    const processedMessages = rawMessages.map(m => beautifyFrappeMessage(m));

    // If a "Mandatory Fields Required" message exists, remove individual "Value missing" messages
    const hasMandatorySummary = processedMessages.some(m => m.startsWith('Mandatory Fields Required'));

    const finalMessages = processedMessages.filter((m, index) => {
        // Remove if it's a duplicate
        if (processedMessages.indexOf(m) !== index) return false;

        // Remove individual "Value missing" if we have a summary
        if (hasMandatorySummary && m.toLowerCase().includes('value missing')) return false;

        return true;
    });

    return finalMessages.length > 0 ? finalMessages.join('\n') : defaultMessage;
}
