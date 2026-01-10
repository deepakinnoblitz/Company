
export const getFriendlyErrorMessage = (error: any): string => {
    const message = error.message || error.toString();

    // Handle Duplicate Entry Error (IntegrityError)
    // Example: Duplicate entry 'deepakkjc088@gmail.com' for key 'email'
    if (message.includes("Duplicate entry")) {
        const match = message.match(/Duplicate entry '([^']+)' for key '([^']+)'/);
        if (match) {
            const value = match[1];
            const key = match[2];
            // Format: "Email 'foo@bar.com' already exists."
            // Capitalize first letter of key
            const formattedKey = key.charAt(0).toUpperCase() + key.slice(1);
            return `${formattedKey} '${value}' already exists.`;
        }
    }

    // Handle Frappe Exceptions (strip technical prefix)
    // Example: frappe.exceptions.ValidationError: Some message (Some details)
    if (message.includes("frappe.exceptions.")) {
        // 1. Remove the "frappe.exceptions.X:" prefix
        // 2. Remove purely technical tuple wrappers if present like ('DocType', 'Name', ...)
        // This simple regex cleans up the common prefix
        const cleanMessage = message.replace(/frappe\.exceptions\.[a-zA-Z0-9]+:\s*/, '');

        // If it looks like a python tuple/list string, try to extract the message inside
        // Not perfect but handles common "('Title', 'ID', Error(...))" patterns by just returning the cleaned string or a generic error
        // Ideally we'd just want the inner message.

        // For now, let's just return the cleaned prefix version, possibly truncated at ' (' if it's an IntegrityError wrapper
        if (cleanMessage.includes("IntegrityError")) {
            return "Database integrity error. Please check for duplicates or invalid references.";
        }

        return cleanMessage;
    }

    return message;
};
