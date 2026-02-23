// Redirection script for Employees from Desk to React Frontend
$(document).ready(function () {
    // Ensure frappe is defined and roles are available
    if (typeof frappe !== 'undefined' && frappe.user_roles) {

        // Check if the user has the 'Employee' role and is NOT an 'Administrator' or 'System Manager'
        if (frappe.user_roles.includes('Employee') &&
            !frappe.user_roles.includes('Administrator') &&
            !frappe.user_roles.includes('System Manager')) {

            // Function to check and perform redirect
            const checkRedirect = () => {
                // Redirect employees from ANY desk route to the new frontend
                window.location.href = '/';
            };

            // Check on initial load
            checkRedirect();

            // Check when route changes within the desk
            if (frappe.ui.toolbar) {
                frappe.ui.toolbar.on('route_change', function () {
                    checkRedirect();
                });
            }
        }
    }
});
