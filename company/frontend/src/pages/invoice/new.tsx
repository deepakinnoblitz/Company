import { CONFIG } from 'src/config-global';

import { InvoiceCreateView } from 'src/sections/invoice/view';

// ----------------------------------------------------------------------

export default function InvoiceCreatePage() {
    return (
        <>
            <title>{`New Invoice - ${CONFIG.appName}`}</title>

            <InvoiceCreateView />
        </>
    );
}
