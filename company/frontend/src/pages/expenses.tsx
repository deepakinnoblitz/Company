import { CONFIG } from 'src/config-global';

import { ExpensesView } from 'src/sections/expenses/view/expenses-view';

export default function Page() {
    return (
        <>
            <title>{`Company Expenses - ${CONFIG.appName}`}</title>
            <ExpensesView />
        </>
    );
}
