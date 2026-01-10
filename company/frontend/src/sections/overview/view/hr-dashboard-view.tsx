import { useState, useEffect } from 'react';

import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';

import { DashboardContent } from 'src/layouts/dashboard';
import {
    fetchMonthHolidays,
    fetchTodayBirthdays,
    fetchAttendanceStats,
    fetchUpcomingRenewals,
    fetchPendingLeaveCount,
    fetchTotalEmployeeCount,
    fetchRecentAnnouncements,
    fetchTodayLeaveEmployees
} from 'src/api/dashboard';

import { Iconify } from 'src/components/iconify';

import { useAuth } from 'src/auth/auth-context';

import { HRCalendar } from '../hr-calendar';
import { HRAnnouncements } from '../hr-announcements';
import { HRSummaryWidget } from '../hr-summary-widget';
import { HRDashboardTable } from '../hr-dashboard-table';

// ----------------------------------------------------------------------

export function HRDashboardView() {
    const { user } = useAuth();
    const [data, setData] = useState<any>({
        announcements: [],
        total_employees: 0,
        pending_leaves: 0,
        present_today: 0,
        missing_attendance: 0,
        todays_leaves: [],
        todays_birthdays: [],
        holidays: []
    });

    useEffect(() => {
        const loadData = async () => {
            try {
                const [
                    announcements,
                    birthdays,
                    leaves,
                    holidays,
                    stats,
                    renewals,
                    totalEmployees,
                    pendingLeaves
                ] = await Promise.all([
                    fetchRecentAnnouncements(),
                    fetchTodayBirthdays(),
                    fetchTodayLeaveEmployees(),
                    fetchMonthHolidays(),
                    fetchAttendanceStats('today'),
                    fetchUpcomingRenewals(),
                    fetchTotalEmployeeCount(),
                    fetchPendingLeaveCount()
                ]);

                setData({
                    announcements,
                    todays_birthdays: birthdays,
                    todays_leaves: leaves,
                    holidays,
                    renewals,
                    present_today: stats?.present || 0,
                    missing_attendance: stats?.missing || 0,
                    pending_leaves: pendingLeaves,
                    total_employees: totalEmployees
                });
            } catch (error) {
                console.error('Failed to load HR dashboard data:', error);
            }
        };

        loadData();
    }, []);

    const handleMonthChange = async (date: Date) => {
        try {
            const holidays = await fetchMonthHolidays(date.getMonth() + 1, date.getFullYear());
            setData((prev: any) => ({ ...prev, holidays }));
        } catch (error) {
            console.error('Failed to update holidays:', error);
        }
    };

    return (
        <DashboardContent maxWidth="xl">
            <Typography variant="h4" sx={{ mb: { xs: 3, md: 5 } }}>
                Hi, {user?.full_name || 'HR User'}, Welcome back 👋
            </Typography>

            <Grid container spacing={3}>
                {/* Announcements */}
                <Grid size={{ xs: 12 }}>
                    <HRAnnouncements
                        title="Latest Announcements"
                        list={data.announcements.map((a: any) => ({
                            title: a.announcement_name,
                            message: a.announcement,
                            posting_date: a.creation
                        }))}
                    />
                </Grid>

                {/* Summary Widgets */}
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <HRSummaryWidget
                        title="Total Employees"
                        total={data.total_employees || 0}
                        icon={<Iconify icon={"solar:users-group-rounded-bold-duotone" as any} width={32} />}
                    />
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <HRSummaryWidget
                        title="Pending Leave Applications"
                        total={data.pending_leaves || 0}
                        color="warning"
                        icon={<Iconify icon={"solar:calendar-date-bold-duotone" as any} width={32} />}
                    />
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <HRSummaryWidget
                        title="Yesterday Missing Attendance"
                        total={data.missing_attendance || 0}
                        color="error"
                        icon={<Iconify icon={"solar:close-circle-bold-duotone" as any} width={32} />}
                    />
                </Grid>

                {/* Today's Leaves */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <HRDashboardTable
                        title="Today's Leave"
                        tableData={data.todays_leaves}
                        headLabel={[
                            { id: 'index', label: '#' },
                            { id: 'employee_name', label: 'Employee Name' },
                            { id: 'leave_type', label: 'Leave Type' },
                        ]}
                    />
                </Grid>

                {/* Today's Birthdays */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <HRDashboardTable
                        title="Today's Birthdays"
                        tableData={data.todays_birthdays}
                        headLabel={[
                            { id: 'index', label: '#' },
                            { id: 'employee_name', label: 'Employee Name' },
                            { id: 'employee', label: 'Employee ID' },
                        ]}
                    />
                </Grid>

                {/* Upcoming Renewals */}
                <Grid size={{ xs: 12 }}>
                    <HRDashboardTable
                        title="Upcoming Renewals"
                        tableData={data.renewals || []}
                        headLabel={[
                            { id: 'index', label: '#' },
                            { id: 'item_name', label: 'Item Name' },
                            { id: 'category', label: 'Category' },
                            { id: 'renewal_date', label: 'Renewal Date' },
                            { id: 'amount', label: 'Amount' },
                            { id: 'status', label: 'Status' },
                        ]}
                    />
                </Grid>

                {/* Holiday Calendar */}
                <Grid size={{ xs: 12 }}>
                    <HRCalendar
                        title="Holiday Calendar"
                        subheader="Upcoming holidays for this month"
                        onDateChange={handleMonthChange}
                        events={data.holidays.map((h: any) => ({
                            title: h.description,
                            start: h.holiday_date,
                            color: '#FF4842'
                        }))}
                    />
                </Grid>
            </Grid>
        </DashboardContent>
    );
}
