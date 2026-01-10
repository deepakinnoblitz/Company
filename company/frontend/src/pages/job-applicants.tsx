import { CONFIG } from 'src/config-global';

import { JobApplicantsView } from 'src/sections/job-applicants/view/job-applicants-view';

// ----------------------------------------------------------------------

export default function JobApplicantsPage() {
    return (
        <>
            <title>{`Job Applicants - ${CONFIG.appName}`}</title>

            <JobApplicantsView />
        </>
    );
}
