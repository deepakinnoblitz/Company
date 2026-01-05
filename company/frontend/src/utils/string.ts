/**
 * Strips HTML tags from a string.
 * This is useful for displaying rich text as plain text.
 */
export function stripHtml(html: string): string {
    if (!html) return '';

    // Replace block-level tags and <br> with newlines to preserve formatting
    let text = html.replace(/<br\s*\/?>/gi, '\n');
    text = text.replace(/<\/p>/gi, '\n');
    text = text.replace(/<\/div>/gi, '\n');

    // Remove remains of any other HTML tags
    text = text.replace(/<[^>]*>?/gm, '');

    // Fix alignment: trim each line and remove redundant whitespace/newlines
    return text
        .split('\n')
        .map((line) => line.trim())
        .join('\n')
        .replace(/\n{2,}/g, '\n') // Collapse excessive newlines
        .trim();
}
