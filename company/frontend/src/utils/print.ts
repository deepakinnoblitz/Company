export function handleDirectPrint(url: string) {
    // Create a hidden iframe
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = url;

    // Append to document
    document.body.appendChild(iframe);

    // Wait for iframe to load and trigger print
    iframe.onload = () => {
        iframe.contentWindow?.print();
        // Remove iframe after small delay to allow print dialog to open
        setTimeout(() => {
            document.body.removeChild(iframe);
        }, 1000);
    };
}
