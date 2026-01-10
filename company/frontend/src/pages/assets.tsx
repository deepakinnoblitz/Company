import { CONFIG } from 'src/config-global';

import { AssetsView } from 'src/sections/assets/view/assets-view';

export default function Page() {
    return (
        <>
            <title>{`Assets - ${CONFIG.appName}`}</title>
            <AssetsView />
        </>
    );
}
