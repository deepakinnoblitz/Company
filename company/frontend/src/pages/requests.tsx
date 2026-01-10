import { CONFIG } from 'src/config-global';

import { RequestsView } from 'src/sections/requests/view/requests-view';

export default function Page() {
    return (
        <>
            <title>{`Requests - ${CONFIG.appName}`}</title>
            <RequestsView />
        </>
    );
}
