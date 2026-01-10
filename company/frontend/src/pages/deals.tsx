import { CONFIG } from 'src/config-global';

import { DealView } from 'src/sections/deal/view/deal-view';

// ----------------------------------------------------------------------

export default function Page() {
    return (
        <>
            <title> {`Deals - ${CONFIG.appName}`}</title>

            <DealView />
        </>
    );
}
