import { CONFIG } from 'src/config-global';

import { LeavesView } from 'src/sections/leaves/view/leaves-view';

export default function Page() {
    return (
        <>
            <title>{`Leaves - ${CONFIG.appName}`}</title>
            <LeavesView />
        </>
    );
}
