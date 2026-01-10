export interface DashboardStats {
    leads: number;
    contacts: number;
    deals: number;
    accounts: number;
    recent_leads: number;
    total_deal_value: number;
    leads_by_status: Array<{ status: string; count: number }>;
    deals_by_stage: Array<{ stage: string; count: number }>;
    charts: {
        categories: string[];
        leads: number[];
        contacts: number[];
        deals: number[];
        accounts: number[];
    };
}

export interface Call {
    name: string;
    title: string;
    call_for: string;
    lead_name?: string;
    call_start_time: string;
    call_end_time?: string;
    outgoing_call_status: string;
    call_purpose?: string;
}

export interface Meeting {
    name: string;
    title: string;
    meet_for: string;
    lead_name?: string;
    from: string;
    to?: string;
    outgoing_call_status: string;
    meeting_venue?: string;
    location?: string;
}

export interface TodayActivities {
    calls: Call[];
    meetings: Meeting[];
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
    const res = await fetch(
        '/api/method/company.company.frontend_api.get_dashboard_stats',
        { credentials: 'include' }
    );

    if (!res.ok) {
        throw new Error('Failed to fetch dashboard stats');
    }

    const data = await res.json();
    return data.message;
}

export async function fetchTodayActivities(): Promise<TodayActivities> {
    const res = await fetch(
        '/api/method/company.company.frontend_api.get_today_activities',
        { credentials: 'include' }
    );

    if (!res.ok) {
        throw new Error('Failed to fetch today activities');
    }

    const data = await res.json();
    return data.message;
}

export interface HRDashboardData {
    announcements: Array<{ title: string; message: string; posting_date: string }>;
    total_employees: number;
    pending_leaves: number;
    present_today: number;
    missing_attendance: number;
    todays_leaves: Array<{ employee_name: string; employee: string }>;
    todays_birthdays: Array<{ employee_name: string; employee: string }>;
    holidays: Array<{ date: string; description: string }>;
}

export async function fetchRecentAnnouncements(): Promise<any[]> {
    const res = await fetch('/api/method/company.company.api.get_recent_announcements', { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch announcements');
    const data = await res.json();
    return data.message || [];
}

export async function fetchUpcomingRenewals(): Promise<any[]> {
    const res = await fetch('/api/method/company.company.api.get_upcoming_and_expired_renewals', { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch upcoming renewals');
    const data = await res.json();
    return data.message || [];
}

export async function fetchMonthHolidays(month?: number, year?: number): Promise<any[]> {
    let url = '/api/method/company.company.api.get_month_holidays';
    const params = new URLSearchParams();
    if (month) params.append('month', month.toString());
    if (year) params.append('year', year.toString());
    if (params.toString()) url += `?${params.toString()}`;

    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch month holidays');
    const data = await res.json();
    return data.message || [];
}

export async function fetchTodayBirthdays(): Promise<any[]> {
    const res = await fetch('/api/method/company.company.api.get_today_birthdays', { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch birthdays');
    const data = await res.json();
    return data.message || [];
}

export async function fetchTodayLeaveEmployees(): Promise<any[]> {
    const res = await fetch('/api/method/company.company.api.get_today_leave_employees', { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch today leave employees');
    const data = await res.json();
    return data.message || [];
}

export async function fetchAttendanceStats(range: string = 'today'): Promise<any> {
    const res = await fetch(`/api/method/company.company.api.get_attendance_stats?range=${range}`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch attendance stats');
    const data = await res.json();
    return data.message;
}

export async function fetchHRDashboardData(): Promise<HRDashboardData> {
    const res = await fetch(
        '/api/method/company.company.frontend_api.get_hr_dashboard_data',
        { credentials: 'include' }
    );

    if (!res.ok) {
        throw new Error('Failed to fetch HR dashboard data');
    }

    const data = await res.json();
    return data.message;
}

// Get total employee count
export async function fetchTotalEmployeeCount(): Promise<number> {
    const res = await fetch(
        `/api/method/frappe.client.get_count?doctype=Employee&filters=${encodeURIComponent(JSON.stringify([]))}`,
        { credentials: 'include' }
    );
    if (!res.ok) throw new Error('Failed to fetch employee count');
    const data = await res.json();
    return data.message || 0;
}

// Get pending leave applications count
export async function fetchPendingLeaveCount(): Promise<number> {
    const filters = [['Leave Application', 'workflow_state', '=', 'Pending']];
    const res = await fetch(
        `/api/method/frappe.client.get_count?doctype=Leave Application&filters=${encodeURIComponent(JSON.stringify(filters))}`,
        { credentials: 'include' }
    );
    if (!res.ok) throw new Error('Failed to fetch pending leave count');
    const data = await res.json();
    return data.message || 0;
}
