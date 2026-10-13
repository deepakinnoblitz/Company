// Redirection script for Employees & Standalone PWA from Desk to React Frontend
(function () {
    // If opened as installed PWA (standalone window), immediately send to React SPA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || !!(window.navigator && window.navigator.standalone);
    if (isStandalone && (window.location.pathname.startsWith('/desk') || window.location.pathname.startsWith('/app'))) {
        window.location.replace('/');
        return;
    }

    if (typeof frappe !== 'undefined' && frappe.after_ajax) {
        frappe.after_ajax(function () {
            if (!frappe.user_roles) return;

            const isEmployee = frappe.user_roles.includes('Employee') || frappe.user_roles.includes('HR');
            const isAdmin = frappe.user_roles.includes('Administrator');

            if (isEmployee && !isAdmin) {
                window.location.replace('/');
            }
        });
    }
})();
