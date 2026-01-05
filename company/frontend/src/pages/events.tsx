import { CONFIG } from 'src/config-global';

import { EventsView } from 'src/sections/events/view';

// ----------------------------------------------------------------------

export default function Page() {
    return (
        <>
            <title>{`Events - ${CONFIG.appName}`}</title>

            <EventsView />
        </>
    );
}
