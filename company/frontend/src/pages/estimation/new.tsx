import { CONFIG } from 'src/config-global';

import { EstimationCreateView } from 'src/sections/estimation/view';

// ----------------------------------------------------------------------

export default function EstimationCreatePage() {
    return (
        <>
            <title>{`Create a new estimation - ${CONFIG.appName}`}</title>

            <EstimationCreateView />
        </>
    );
}
