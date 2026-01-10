import { CONFIG } from 'src/config-global';

import { InterviewsView } from 'src/sections/interviews/view/interviews-view';

// ----------------------------------------------------------------------

export default function InterviewPage() {
    return (
        <>
            <title>{`Interviews - ${CONFIG.appName}`}</title>

            <InterviewsView />
        </>
    );
}
