import { CONFIG } from 'src/config-global';

import { ReimbursementClaimsView } from 'src/sections/reimbursement-claims/view/reimbursement-claims-view';

export default function Page() {
    return (
        <>
            <title>{`Reimbursement Claims - ${CONFIG.appName}`}</title>
            <ReimbursementClaimsView />
        </>
    );
}
