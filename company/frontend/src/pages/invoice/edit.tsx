import { CONFIG } from 'src/config-global';

import { InvoiceEditView } from 'src/sections/invoice/view';

// ----------------------------------------------------------------------

export default function InvoiceEditPage() {
    return (
        <>
            <title>{`Edit Invoice - ${CONFIG.appName}`}</title>

            <InvoiceEditView />
        </>
    );
}
