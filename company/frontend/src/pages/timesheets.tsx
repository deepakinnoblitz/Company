import { CONFIG } from 'src/config-global';

import { TimesheetsView } from 'src/sections/timesheets/view/timesheets-view';

export default function Page() {
    return (
        <>
            <title>{`Timesheets - ${CONFIG.appName}`}</title>
            <TimesheetsView />
        </>
    );
}
