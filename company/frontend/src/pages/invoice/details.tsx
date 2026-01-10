import { CONFIG } from 'src/config-global';

import { InvoiceDetailsView } from 'src/sections/invoice/view/invoice-details-view';

// ----------------------------------------------------------------------

export default function Page() {
    return (
        <>
            <title> {`Invoice Details - ${CONFIG.appName}`}</title>

            <InvoiceDetailsView />
        </>
    );
}
