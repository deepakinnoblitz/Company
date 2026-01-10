import { CONFIG } from 'src/config-global';

import { MeetingReportView } from 'src/sections/report/meeting/view/meeting-report-view';

// ----------------------------------------------------------------------

export default function MeetingReportPage() {
    return (
        <>
            <title>{`Meeting Report - ${CONFIG.appName}`}</title>
            <MeetingReportView />
        </>
    );
}
