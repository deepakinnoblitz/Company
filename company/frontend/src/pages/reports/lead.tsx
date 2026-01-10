import { CONFIG } from 'src/config-global';

import { LeadReportView } from 'src/sections/report/view/lead-report-view';

// ----------------------------------------------------------------------

export default function LeadReportPage() {
    return (
        <>
            <title>{`Lead Report - ${CONFIG.appName}`}</title>
            <LeadReportView />
        </>
    );
}
