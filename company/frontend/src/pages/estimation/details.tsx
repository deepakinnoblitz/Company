import { useParams } from 'react-router-dom';

import { CONFIG } from 'src/config-global';

import { EstimationDetailsView } from 'src/sections/estimation/view';

// ----------------------------------------------------------------------

export default function EstimationDetailsPage() {
    const { id } = useParams();

    return (
        <>
            <title>{`Estimation details: ${id} - ${CONFIG.appName}`}</title>

            <EstimationDetailsView />
        </>
    );
}
