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
export const InvoiceListPage = lazy(() => import('src/pages/invoice/list'));
export const InvoiceCreatePage = lazy(() => import('src/pages/invoice/new'));
export const InvoiceEditPage = lazy(() => import('src/pages/invoice/edit'));
export const InvoiceDetailsPage = lazy(() => import('src/pages/invoice/details'));
export const EstimationListPage = lazy(() => import('src/pages/estimation/list'));
export const EstimationCreatePage = lazy(() => import('src/pages/estimation/new'));
export const EstimationEditPage = lazy(() => import('src/pages/estimation/edit'));
export const EstimationDetailsPage = lazy(() => import('src/pages/estimation/details'));
export const ProductsPage = lazy(() => import('src/pages/products'));

export const LeadReportPage = lazy(() => import('src/pages/reports/lead'));
export const ContactReportPage = lazy(() => import('src/pages/reports/contact'));
export const AccountReportPage = lazy(() => import('src/pages/reports/account'));
export const CallsReportPage = lazy(() => import('src/pages/reports/calls'));
export const MeetingReportPage = lazy(() => import('src/pages/reports/meeting'));
export const EmployeePage = lazy(() => import('src/pages/employee'));
export const AttendancePage = lazy(() => import('src/pages/attendance'));
export const LeavesPage = lazy(() => import('src/pages/leaves'));
export const PayrollPage = lazy(() => import('src/pages/payroll'));
export const RequestsPage = lazy(() => import('src/pages/requests'));
export const AnnouncementsPage = lazy(() => import('src/pages/announcements'));
export const AssetsPage = lazy(() => import('src/pages/assets'));
export const TimesheetsPage = lazy(() => import('src/pages/timesheets'));
export const ExpensesPage = lazy(() => import('src/pages/expenses'));
export const HolidaysPage = lazy(() => import('src/pages/holidays'));
export const ReimbursementClaimsPage = lazy(() => import('src/pages/reimbursement-claims'));
const RenewalTrackerPage = lazy(() => import('src/pages/renewals-tracker'));
const SalarySlipsPage = lazy(() => import('src/pages/salary-slips'));
const JobOpeningsPage = lazy(() => import('src/pages/job-openings'));
const JobApplicantsPage = lazy(() => import('src/pages/job-applicants'));
const InterviewPage = lazy(() => import('src/pages/interviews'));
export const AccessDeniedPage = lazy(() => import('src/pages/access-denied'));
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
      {
        path: 'invoices',
        children: [
          { index: true, element: <InvoiceListPage /> },
          { path: 'new', element: <InvoiceCreatePage /> },
          { path: ':id/edit', element: <InvoiceEditPage /> },
          { path: ':id/view', element: <InvoiceDetailsPage /> },
        ],
      },
      {
        path: 'estimations',
        children: [
          { index: true, element: <EstimationListPage /> },
          { path: 'new', element: <EstimationCreatePage /> },
          { path: ':id/edit', element: <EstimationEditPage /> },
          { path: ':id/view', element: <EstimationDetailsPage /> },
        ],
      },
      { path: 'blog', element: <BlogPage /> },

      { path: 'employee', element: <EmployeePage /> },
      { path: 'attendance', element: <AttendancePage /> },
      { path: 'leaves', element: <LeavesPage /> },
      { path: 'payroll', element: <PayrollPage /> },
      { path: 'requests', element: <RequestsPage /> },
      { path: 'announcements', element: <AnnouncementsPage /> },
      { path: 'assets', element: <AssetsPage /> },
      { path: 'timesheets', element: <TimesheetsPage /> },
      { path: 'timesheet-reports', element: <TimesheetsPage /> }, // Placeholder until module is implemented
      { path: 'expenses', element: <ExpensesPage /> },
      { path: 'holidays', element: <HolidaysPage /> },
      { path: 'reimbursement-claims', element: <ReimbursementClaimsPage /> },
      { path: 'renewals-tracker', element: <RenewalTrackerPage /> },
      { path: 'salary-slips', element: <SalarySlipsPage /> },
      { path: 'job-openings', element: <JobOpeningsPage /> },
      { path: 'job-applicants', element: <JobApplicantsPage /> },
      { path: 'interviews', element: <InterviewPage /> },
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
  {
    path: 'access-denied',
    element: (
      <Suspense fallback={renderFallback()}>
        <AccessDeniedPage />
      </Suspense>
    ),
  },
  { path: '404', element: <Page404 /> },
  { path: '*', element: <Page404 /> },
];
