export async function handleResponse(res: Response) {
    if (res.ok) {
        return res.json();
    }

    let errorMessage = 'Something went wrong';
    try {
        const errorData = await res.json();

        // Handle Frappe error structure
        if (errorData._server_messages) {
            const messages = JSON.parse(errorData._server_messages);
            if (messages.length > 0) {
                const firstMsg = JSON.parse(messages[0]);
                errorMessage = firstMsg.message || errorMessage;
            }
        } else if (errorData.exception) {
            // Extract message from traceback or just use the exception string
            errorMessage = errorData.exception.split(':').pop()?.trim() || errorData.exception;
        } else if (errorData.message) {
            errorMessage = errorData.message;
        }
    } catch {
        // Fallback if JSON parsing fails
        errorMessage = res.statusText || errorMessage;
    }

    throw new Error(errorMessage);
}
