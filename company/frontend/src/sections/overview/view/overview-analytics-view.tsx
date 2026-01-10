import { useState, useEffect } from 'react';

import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';

import { DashboardContent } from 'src/layouts/dashboard';
import { fetchDashboardStats, type DashboardStats, fetchTodayActivities, type TodayActivities } from 'src/api/dashboard';

import { useAuth } from 'src/auth/auth-context';

import { TodayActivitiesWidget } from '../today-activities-widget';
import { AnalyticsCurrentVisits } from '../analytics-current-visits';
import { AnalyticsWidgetSummary } from '../analytics-widget-summary';

// ----------------------------------------------------------------------

export function OverviewAnalyticsView() {
  const { user } = useAuth();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<TodayActivities | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsData, activitiesData] = await Promise.all([
          fetchDashboardStats(),
          fetchTodayActivities()
        ]);
        setStats(statsData);
        setActivities(activitiesData);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      }
    };

    loadData();
  }, []);

  // Calculate daily percentage change (today vs yesterday)
  const getPercentChange = (series: number[] = []) => {
    if (series.length < 2) return 0;
    const today = series[series.length - 1];
    const yesterday = series[series.length - 2];
    if (yesterday === 0) return today > 0 ? 100 : 0;
    return Math.round(((today - yesterday) / yesterday) * 100);
  };

  return (
    <DashboardContent maxWidth="xl">
      <Typography variant="h4" sx={{ mb: { xs: 3, md: 5 } }}>
        Hi, {user?.full_name || 'User'}, Welcome back 👋
      </Typography>

      <Grid container spacing={3}>
        {/* Leads Widget */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSummary
            title="Total Leads"
            percent={getPercentChange(stats?.charts?.leads)}
            total={stats?.leads || 0}
            icon={<img alt="Leads" src={`${import.meta.env.BASE_URL}assets/icons/glass/ic-glass-users.svg`} />}
            chart={{
              categories: stats?.charts?.categories || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
              series: stats?.charts?.leads || [0, 0, 0, 0, 0, 0, 0],
            }}
          />
        </Grid>

        {/* Contacts Widget */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSummary
            title="Total Contacts"
            percent={getPercentChange(stats?.charts?.contacts)}
            total={stats?.contacts || 0}
            color="secondary"
            icon={<img alt="Contacts" src={`${import.meta.env.BASE_URL}assets/icons/glass/ic-glass-message.svg`} />}
            chart={{
              categories: stats?.charts?.categories || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
              series: stats?.charts?.contacts || [0, 0, 0, 0, 0, 0, 0],
            }}
          />
        </Grid>

        {/* Deals Widget */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSummary
            title="Total Deals"
            percent={getPercentChange(stats?.charts?.deals)}
            total={stats?.deals || 0}
            color="warning"
            icon={<img alt="Deals" src={`${import.meta.env.BASE_URL}assets/icons/glass/ic-glass-buy.svg`} />}
            chart={{
              categories: stats?.charts?.categories || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
              series: stats?.charts?.deals || [0, 0, 0, 0, 0, 0, 0],
            }}
          />
        </Grid>
        {/* Accounts Widget */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSummary
            title="Total Accounts"
            percent={getPercentChange(stats?.charts?.accounts)}
            total={stats?.accounts || 0}
            color="info"
            icon={<img alt="Accounts" src={`${import.meta.env.BASE_URL}assets/icons/glass/ic-glass-users.svg`} />}
            chart={{
              categories: stats?.charts?.categories || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
              series: stats?.charts?.accounts || [0, 0, 0, 0, 0, 0, 0],
            }}
          />
        </Grid>

        {/* Today's Activities Widget */}
        <Grid size={{ xs: 12, md: 12, lg: 12 }}>
          <TodayActivitiesWidget
            calls={activities?.calls || []}
            meetings={activities?.meetings || []}
          />
        </Grid>


        {/* Leads by Status Chart */}
        <Grid size={{ xs: 12, md: 6 }}>
          <AnalyticsCurrentVisits
            title="Leads by Status"
            chart={{
              series: (stats?.leads_by_status || []).map((item) => ({
                label: item.status,
                value: item.count,
              })),
            }}
          />
        </Grid>

        {/* Deals by Stage Chart */}
        <Grid size={{ xs: 12, md: 6 }}>
          <AnalyticsCurrentVisits
            title="Deals by Stage"
            chart={{
              series: (stats?.deals_by_stage || []).map((item) => ({
                label: item.stage,
                value: item.count,
              })),
            }}
          />
        </Grid>

      </Grid>
    </DashboardContent>
  );
}
  