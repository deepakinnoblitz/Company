import { CONFIG } from 'src/config-global';

import { InvoiceListView } from 'src/sections/invoice/view';

// ----------------------------------------------------------------------

export default function InvoiceListPage() {
    return (
        <>
            <title>{`Invoices - ${CONFIG.appName}`}</title>

            <InvoiceListView />
        </>
    );
}
