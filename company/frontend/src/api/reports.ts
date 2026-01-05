export async function runReport(reportName: string, filters: any = {}) {
    const res = await fetch('/api/method/frappe.desk.query_report.run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
            report_name: reportName,
            filters: JSON.stringify(filters),
        }),
    });

    if (!res.ok) {
        throw new Error('Failed to run report');
    }

    const data = await res.json();
    return data.message;
}

export async function getReportFilters(reportName: string) {
    const res = await fetch(`/api/method/frappe.desk.query_report.get_script?report_name=${reportName}`, {
        credentials: 'include',
    });

    if (!res.ok) {
        throw new Error('Failed to fetch report filters');
    }

    const data = await res.json();
    return data.message;
}
