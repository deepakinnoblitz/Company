import { Iconify } from 'src/components/iconify';
import { SvgColor } from 'src/components/svg-color';

// ----------------------------------------------------------------------

const icon = (name: string) => <SvgColor src={`/assets/icons/navbar/${name}.svg`} />;

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

export const navData = [
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
