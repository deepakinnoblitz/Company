import { CONFIG } from 'src/config-global';

import { CallsView } from 'src/sections/calls/view/calls-view';

// ----------------------------------------------------------------------

export default function Page() {
    return (
        <>
            <title>{`Calls - ${CONFIG.appName}`}</title>

            <CallsView />
        </>
    );
}
