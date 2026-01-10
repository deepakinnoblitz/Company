import { CONFIG } from 'src/config-global';

import { EmployeeView } from 'src/sections/employee/view/employee-view';

export default function Page() {
    return (
        <>
            <title>{`Employees - ${CONFIG.appName}`}</title>
            <EmployeeView />
        </>
    );
}
