import { CONFIG } from 'src/config-global';

import { MeetingsView } from 'src/sections/meetings/view/meetings-view';

// ----------------------------------------------------------------------

export default function Page() {
    return (
        <>
            <title>{`Meetings - ${CONFIG.appName}`}</title>

            <MeetingsView />
        </>
    );
}
