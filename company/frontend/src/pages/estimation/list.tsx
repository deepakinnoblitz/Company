import { CONFIG } from 'src/config-global';

import { EstimationListView } from 'src/sections/estimation/view';

// ----------------------------------------------------------------------

export default function EstimationListPage() {
    return (
        <>
            <title>{`Estimations - ${CONFIG.appName}`}</title>

            <EstimationListView />
        </>
    );
}
