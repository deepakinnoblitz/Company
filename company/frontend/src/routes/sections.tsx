import type { RouteObject } from 'react-router';

import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import LinearProgress, { linearProgressClasses } from '@mui/material/LinearProgress';

import { AuthLayout } from 'src/layouts/auth';
import { DashboardLayout } from 'src/layouts/dashboard';

import { AuthGuard } from 'src/auth/auth-guard';

// ----------------------------------------------------------------------

export const DashboardPage = lazy(() => import('src/pages/dashboard'));
export const BlogPage = lazy(() => import('src/pages/blog'));
export const UserPage = lazy(() => import('src/pages/user'));
export const ContactPage = lazy(() => import('src/pages/contact'));
export const AccountsPage = lazy(() => import('src/pages/accounts'));
export const DealsPage = lazy(() => import('src/pages/deals'));
export const EventsPage = lazy(() => import('src/pages/events'));
export const CallsPage = lazy(() => import('src/pages/calls'));
export const MeetingsPage = lazy(() => import('src/pages/meetings'));
export const SignInPage = lazy(() => import('src/pages/sign-in'));
export const ProductsPage = lazy(() => import('src/pages/products'));
export const LeadReportPage = lazy(() => import('src/pages/reports/lead'));
export const ContactReportPage = lazy(() => import('src/pages/reports/contact'));
export const AccountReportPage = lazy(() => import('src/pages/reports/account'));
export const CallsReportPage = lazy(() => import('src/pages/reports/calls'));
export const MeetingReportPage = lazy(() => import('src/pages/reports/meeting'));
export const Page404 = lazy(() => import('src/pages/page-not-found'));

const renderFallback = () => (
  <Box
    sx={{
      display: 'flex',
      flex: '1 1 auto',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <LinearProgress
      sx={{
        width: 1,
        maxWidth: 320,
        bgcolor: (theme) => varAlpha(theme.vars.palette.text.primaryChannel, 0.16),
        [`& .${linearProgressClasses.bar}`]: { bgcolor: 'text.primary' },
      }}
    />
  </Box>
);

export const routesSection: RouteObject[] = [
  {
    element: (
      <AuthGuard>
        <DashboardLayout>
          <Suspense fallback={renderFallback()}>
            <Outlet />
          </Suspense>
        </DashboardLayout>
      </AuthGuard>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'user', element: <UserPage /> },
      { path: 'contacts', element: <ContactPage /> },
      { path: 'accounts', element: <AccountsPage /> },
      { path: 'deals', element: <DealsPage /> },
      { path: 'events', element: <EventsPage /> },
      { path: 'calls', element: <CallsPage /> },
      { path: 'meetings', element: <MeetingsPage /> },
      { path: 'products', element: <ProductsPage /> },
      { path: 'blog', element: <BlogPage /> },
      {
        path: 'reports',
        children: [
          { path: 'lead', element: <LeadReportPage /> },
          { path: 'contact', element: <ContactReportPage /> },
          { path: 'account', element: <AccountReportPage /> },
          { path: 'calls', element: <CallsReportPage /> },
          { path: 'meeting', element: <MeetingReportPage /> },
        ],
      },
    ],
  },
  {
    path: 'sign-in',
    element: (
      <AuthLayout>
        <SignInPage />
      </AuthLayout>
    ),
  },
  { path: '404', element: <Page404 /> },
  { path: '*', element: <Page404 /> },
];
