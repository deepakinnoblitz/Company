import { CONFIG } from 'src/config-global';

import { PayrollView } from 'src/sections/payroll/view/payroll-view';

export default function Page() {
    return (
        <>
            <title>{`Payroll - ${CONFIG.appName}`}</title>
            <PayrollView />
        </>
    );
}
