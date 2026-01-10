import { CONFIG } from 'src/config-global';

import { HRDashboardView, OverviewAnalyticsView as DashboardView } from 'src/sections/overview/view';

import { useAuth } from 'src/auth/auth-context';

// ----------------------------------------------------------------------

export default function Page() {
  const { user } = useAuth();

  const isHR = user?.roles?.some(role => role.toLowerCase().includes('hr'));
  const isAdmin = user?.roles?.some(role => ['administrator', 'system manager'].includes(role.toLowerCase()));

  // Admin sees CRM dashboard by default, HR sees HR dashboard
  const renderDashboard = () => {
    if (isHR && !isAdmin) {
      return <HRDashboardView />;
    }
    return <DashboardView />;
  };

  return (
    <>
      <title>{`Dashboard - ${CONFIG.appName}`}</title>
      <meta
        name="description"
        content="The starting point for your next project with Minimal UI Kit, built on the newest version of Material-UI ©, ready to be customized to your style"
      />
      <meta name="keywords" content="react,material,kit,application,dashboard,admin,template" />

      {renderDashboard()}
    </>
  );
}
