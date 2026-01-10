import { CONFIG } from 'src/config-global';

import { ContactView } from '../sections/contact/view';

// ----------------------------------------------------------------------

export default function Page() {
    return (
        <>
            <title>{`Contacts - ${CONFIG.appName}`}</title>

            <ContactView />
        </>
    );
}
