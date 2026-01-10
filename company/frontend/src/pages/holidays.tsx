import { CONFIG } from 'src/config-global';

import { HolidaysView } from 'src/sections/holidays/view/holidays-view';

export default function Page() {
    return (
        <>
            <title>{`Holidays - ${CONFIG.appName}`}</title>
            <HolidaysView />
        </>
    );
}
