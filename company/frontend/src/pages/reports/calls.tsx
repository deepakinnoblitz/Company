import { CONFIG } from 'src/config-global';

import { CallsReportView } from 'src/sections/report/calls/view/calls-report-view';

// ----------------------------------------------------------------------

export default function CallsReportPage() {
    return (
        <>
            <title>{`Calls Report - ${CONFIG.appName}`}</title>
            <CallsReportView />
        </>
    );
}
