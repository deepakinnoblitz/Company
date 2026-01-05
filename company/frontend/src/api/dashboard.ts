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
