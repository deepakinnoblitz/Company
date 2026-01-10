import { useParams } from 'react-router-dom';

import { CONFIG } from 'src/config-global';

import { EstimationEditView } from 'src/sections/estimation/view';

// ----------------------------------------------------------------------

export default function EstimationEditPage() {
    const { id } = useParams();

    return (
        <>
            <title>{`Edit estimation: ${id} - ${CONFIG.appName}`}</title>

            <EstimationEditView />
        </>
    );
}
