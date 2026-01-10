import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------


export type NavItem = {
  title: string;
  path: string;
  icon: React.ReactNode;
  info?: React.ReactNode;
  children?: {
    title: string;
    path: string;
  }[];
};


// ----------------------  HR NavBar ---------------------------------------------------
export const hrNavData = [
  {
    title: 'Dashboard',
    path: '/',
    icon: <Iconify icon={"solar:widget-5-bold-duotone" as any} />,
  },
  {
    title: 'Employees',
    path: '/employee',
    icon: <Iconify icon={"solar:users-group-rounded-bold-duotone" as any} />,
  },
  {
    title: 'Attendance',
    path: '/attendance',
    icon: <Iconify icon={"solar:calendar-mark-bold-duotone" as any} />,
  },
  {
    title: 'Leaves',
    path: '/leaves',
    icon: <Iconify icon={"solar:calendar-date-bold-duotone" as any} />,
  },
  {
    title: 'Request List',
    path: '/requests',
    icon: <Iconify icon={"solar:document-text-bold-duotone" as any} />,
  },
  {
    title: 'Announcements',
    path: '/announcements',
    icon: <Iconify icon={"solar:bell-bold-duotone" as any} />,
  },
  {
    title: 'Assets',
    path: '/assets',
    icon: <Iconify icon={"solar:laptop-bold-duotone" as any} />,
  },
  {
    title: 'Timesheets',
    path: '/timesheets',
    icon: <Iconify icon={"solar:clock-circle-bold-duotone" as any} />,
  },
  {
    title: 'Holidays',
    path: '/holidays',
    icon: <Iconify icon={"solar:calendar-mark-bold-duotone" as any} />,
  },
  {
    title: 'Reimbursement Claims',
    path: '/reimbursement-claims',
    icon: <Iconify icon={"solar:wallet-money-bold-duotone" as any} />,
  },
  {
    title: 'Renewals Tracker',
    path: '/renewals-tracker',
    icon: <Iconify icon={"solar:restart-bold-duotone" as any} />,
  },
  {
    title: 'Salary Slips',
    path: '/salary-slips',
    icon: <Iconify icon={"solar:bill-list-bold-duotone" as any} />,
  },
  {
    title: 'Job Openings',
    path: '/job-openings',
    icon: <Iconify icon={"solar:case-bold-duotone" as any} />,
  },
  {
    title: 'Job Applicants',
    path: '/job-applicants',
    icon: <Iconify icon={"solar:users-group-rounded-bold-duotone" as any} />,
  },
  {
    title: 'Interviews',
    path: '/interviews',
    icon: <Iconify icon={"solar:chat-round-video-bold-duotone" as any} />,
  },
];


// ----------------------  Employee NavBar ---------------------------------------------------
export const employeeNavData = [
  {
    title: 'Employee Dashboard',
    path: '/',
    icon: <Iconify icon={"solar:home-2-bold-duotone" as any} />,
  },
  {
    title: 'My Profile',
    path: '/employee',
    icon: <Iconify icon={"solar:users-group-rounded-bold-duotone" as any} />,
  },
  {
    title: 'My Attendance',
    path: '/attendance',
    icon: <Iconify icon={"solar:clock-circle-bold-duotone" as any} />,
  },
  {
    title: 'My Leave Application',
    path: '/leaves',
    icon: <Iconify icon={"solar:notes-bold-duotone" as any} />,
  },
  {
    title: 'My Request List',
    path: '/requests',
    icon: <Iconify icon={"solar:list-bold-duotone" as any} />,
  },
  {
    title: 'My Timesheet',
    path: '/timesheets',
    icon: <Iconify icon={"solar:folder-bold-duotone" as any} />,
  },
  {
    title: 'My WFH Attendance',
    path: '/attendance',
    icon: <Iconify icon={"solar:document-bold-duotone" as any} />,
  },
  {
    title: 'My Salary Slip',
    path: '/salary-slips',
    icon: <Iconify icon={"solar:bill-bold-duotone" as any} />,
  },
  {
    title: 'My Asset List',
    path: '/assets',
    icon: <Iconify icon={"solar:users-group-rounded-bold-duotone" as any} />,
  },
  {
    title: 'My Timesheet Report',
    path: '/timesheet-reports',
    icon: <Iconify icon={"solar:document-bold-duotone" as any} />,
  },
  {
    title: 'My Reimbursement Claim',
    path: '/reimbursement-claims',
    icon: <Iconify icon={"solar:wallet-money-bold-duotone" as any} />,
  },
];

// ----------------------  Sales NavBar ---------------------------------------------------
export const salesNavData = [
  {
    title: 'Dashboard',
    path: '/',
    icon: <Iconify icon={"solar:widget-5-bold-duotone" as any} />,
  },
  {
    title: 'Invoices',
    path: '/invoices',
    icon: <Iconify icon={"solar:bill-list-bold-duotone" as any} />,
  },
  {
    title: 'Estimations',
    path: '/estimations',
    icon: <Iconify icon={"solar:document-text-bold-duotone" as any} />,
  }
];


// ----------------------  CRM NavBar ---------------------------------------------------
export const crmNavData = [
  {
    title: 'Dashboard',
    path: '/',
    icon: <Iconify icon={"solar:widget-5-bold-duotone" as any} />,
  },
  {
    title: 'Leads',
    path: '/user',
    icon: <Iconify icon={"solar:target-bold-duotone" as any} />,
  },
  {
    title: 'Contacts',
    path: '/contacts',
    icon: <Iconify icon={"solar:users-group-rounded-bold-duotone" as any} />,
  },
  {
    title: 'Accounts',
    path: '/accounts',
    icon: <Iconify icon={"solar:buildings-2-bold-duotone" as any} />,
  },
  {
    title: 'Deals',
    path: '/deals',
    icon: <Iconify icon={"solar:hand-money-bold-duotone" as any} />,
  },
  {
    title: 'Events',
    path: '/events',
    icon: <Iconify icon={"solar:calendar-mark-bold-duotone" as any} />,
  },
  {
    title: 'Calls',
    path: '/calls',
    icon: <Iconify icon={"solar:phone-calling-rounded-bold-duotone" as any} />,
  },
  {
    title: 'Meetings',
    path: '/meetings',
    icon: <Iconify icon={"solar:videocamera-record-bold-duotone" as any} />,
  },
  {
    title: 'Reports',
    path: '/reports',
    icon: <Iconify icon={"solar:chart-square-bold-duotone" as any} />,
    children: [
      { title: 'Lead Report', path: '/reports/lead' },
      { title: 'Contact Report', path: '/reports/contact' },
      { title: 'Accounts Report', path: '/reports/account' },
      { title: 'Calls Report', path: '/reports/calls' },
      { title: 'Meeting Report', path: '/reports/meeting' }
    ]
  }
];

// ----------------------  CRM and Sales NavBar ---------------------------------------------------
export const crmAndSalesNavData = [
  {
    title: 'Dashboard',
    path: '/',
    icon: <Iconify icon={"solar:widget-5-bold-duotone" as any} />,
  },
  {
    title: 'Leads',
    path: '/user',
    icon: <Iconify icon={"solar:target-bold-duotone" as any} />,
  },
  {
    title: 'Contacts',
    path: '/contacts',
    icon: <Iconify icon={"solar:users-group-rounded-bold-duotone" as any} />,
  },
  {
    title: 'Accounts',
    path: '/accounts',
    icon: <Iconify icon={"solar:buildings-2-bold-duotone" as any} />,
  },
  {
    title: 'Deals',
    path: '/deals',
    icon: <Iconify icon={"solar:hand-money-bold-duotone" as any} />,
  },
  {
    title: 'Estimations',
    path: '/estimations',
    icon: <Iconify icon={"solar:document-text-bold-duotone" as any} />,
  },
  {
    title: 'Invoices',
    path: '/invoices',
    icon: <Iconify icon={"solar:bill-list-bold-duotone" as any} />,
  },
  {
    title: 'Events',
    path: '/events',
    icon: <Iconify icon={"solar:calendar-mark-bold-duotone" as any} />,
  },
  {
    title: 'Calls',
    path: '/calls',
    icon: <Iconify icon={"solar:phone-calling-rounded-bold-duotone" as any} />,
  },
  {
    title: 'Meetings',
    path: '/meetings',
    icon: <Iconify icon={"solar:videocamera-record-bold-duotone" as any} />,
  },
  {
    title: 'Reports',
    path: '/reports',
    icon: <Iconify icon={"solar:chart-square-bold-duotone" as any} />,
    children: [
      { title: 'Lead Report', path: '/reports/lead' },
      { title: 'Contact Report', path: '/reports/contact' },
      { title: 'Accounts Report', path: '/reports/account' },
      { title: 'Calls Report', path: '/reports/calls' },
      { title: 'Meeting Report', path: '/reports/meeting' }
    ]
  }
];

export const commonNavData = [
  {
    title: 'Dashboard',
    path: '/',
    icon: <Iconify icon={"solar:widget-5-bold-duotone" as any} />,
  },
];


// Helper function to check if user has any valid role
export function hasValidRole(roles: string[] = []): boolean {
  console.log('Checking roles:', roles);

  if (roles.includes('Administrator')) {
    console.log('User is Administrator');
    return true;
  }

  const validRolePatterns = ['HR', 'Employee', 'Sales', 'CRM', 'CRM And Sales'];
  const hasValid = roles.some((role) => {
    const matches = validRolePatterns.includes(role);
    if (matches) {
      console.log(`Role "${role}" matches exactly`);
    }
    return matches;
  });

  console.log('Has valid role:', hasValid);
  return hasValid;
}

export function getNavData(roles: string[] = []) {
  const mergedNav: NavItem[] = [];
  const seenPaths = new Set<string>();

  const addItems = (data: NavItem[]) => {
    data.forEach((item) => {
      if (!seenPaths.has(item.path)) {
        const newItem = { ...item };
        if (item.children) {
          newItem.children = [...item.children];
        }
        mergedNav.push(newItem);
        seenPaths.add(item.path);
      } else {
        const existingItem = mergedNav.find((i) => i.path === item.path);
        if (existingItem && item.children && existingItem.children) {
          const childPaths = new Set(existingItem.children.map((c) => c.path));
          item.children.forEach((child) => {
            if (!childPaths.has(child.path)) {
              existingItem.children!.push({ ...child });
            }
          });
        }
      }
    });
  };

  // Check if user has valid access
  const hasAccess = hasValidRole(roles);

  // If no valid role, return empty navigation with no access flag
  if (!hasAccess) {
    return { hasAccess: false, navData: [] };
  }

  // If Administrator, show EVERYTHING
  if (roles.includes('Administrator')) {
    addItems(hrNavData);
    addItems(employeeNavData);
    addItems(crmAndSalesNavData);
    return { hasAccess: true, navData: mergedNav };
  }

  let hasCustomRole = false;
  const hasRole = (pattern: string) => roles.includes(pattern);

  if (hasRole('HR')) {
    addItems(hrNavData);
    hasCustomRole = true;
  }

  if (hasRole('Employee')) {
    addItems(employeeNavData);
    hasCustomRole = true;
  }

  if (hasRole('Sales')) {
    addItems(salesNavData);
    hasCustomRole = true;
  }

  if (hasRole('CRM')) {
    addItems(crmNavData);
    hasCustomRole = true;
  }

  if (hasRole('CRM And Sales')) {
    addItems(crmAndSalesNavData);
    hasCustomRole = true;
  }

  if (!hasCustomRole) {
    return { hasAccess: true, navData: commonNavData };
  }

  return { hasAccess: true, navData: mergedNav };
}
