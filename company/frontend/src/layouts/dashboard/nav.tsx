import type { Theme, SxProps, Breakpoint } from '@mui/material/styles';

import { varAlpha } from 'minimal-shared/utils';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import List from '@mui/material/List';
import Collapse from '@mui/material/Collapse';
import ListItem from '@mui/material/ListItem';
import { useTheme } from '@mui/material/styles';
import ListItemButton from '@mui/material/ListItemButton';
import Drawer, { drawerClasses } from '@mui/material/Drawer';

import { usePathname } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { Logo } from 'src/components/logo';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

import type { NavItem } from '../nav-config-dashboard';

// ----------------------------------------------------------------------

export type NavContentProps = {
  data: NavItem[];
  slots?: {
    topArea?: React.ReactNode;
    bottomArea?: React.ReactNode;
  };
  sx?: SxProps<Theme>;
};

export function NavDesktop({
  sx,
  data,
  slots,
  layoutQuery,
}: Omit<NavContentProps, 'workspaces'> & { layoutQuery: Breakpoint }) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        pt: 2.5,
        px: 2.5,
        top: 0,
        left: 0,
        height: 1,
        display: 'none',
        position: 'fixed',
        flexDirection: 'column',
        zIndex: 'var(--layout-nav-zIndex)',
        width: 'var(--layout-nav-vertical-width)',
        borderRight: `1px solid ${varAlpha(theme.vars.palette.grey['500Channel'], 0.12)}`,
        [theme.breakpoints.up(layoutQuery)]: {
          display: 'flex',
        },
        ...sx,
      }}
    >
      <NavContent data={data} slots={slots} />
    </Box>
  );
}

// ----------------------------------------------------------------------

export function NavMobile({
  sx,
  data,
  open,
  slots,
  onClose,
}: Omit<NavContentProps, 'workspaces'> & { open: boolean; onClose: () => void }) {
  const pathname = usePathname();

  useEffect(() => {
    if (open) {
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      sx={{
        [`& .${drawerClasses.paper}`]: {
          pt: 2.5,
          px: 2.5,
          overflow: 'unset',
          width: 'var(--layout-nav-mobile-width)',
          ...sx,
        },
      }}
    >
      <NavContent data={data} slots={slots} />
    </Drawer>
  );
}

// ----------------------------------------------------------------------

export function NavContent({ data, slots, sx }: Omit<NavContentProps, 'workspaces'>) {
  const pathname = usePathname();

  return (
    <>
      <Logo />

      {slots?.topArea}

      <Scrollbar fillContent>
        <Box
          component="nav"
          sx={[
            {
              display: 'flex',
              flex: '1 1 auto',
              flexDirection: 'column',
              pb: 3,
            },
            ...(Array.isArray(sx) ? sx : [sx]),
          ]}
        >
          <List disablePadding sx={{ px: 2, gap: 1, display: 'flex', flexDirection: 'column', py: 1 }}>
            {data.map((item) => (
              <NavListItem key={item.title} item={item} pathname={pathname} />
            ))}
          </List>
        </Box>
      </Scrollbar>

      {slots?.bottomArea}
    </>
  );
}

// ----------------------------------------------------------------------

function NavListItem({ item, pathname }: { item: NavItem; pathname: string }) {
  const [open, setOpen] = useState(false);

  const handleToggle = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  const isActived = item.path === pathname || (item.children && item.children.some(child => child.path === pathname));

  const renderContent = (
    <ListItemButton
      disableGutters
      {...(item.children
        ? { onClick: handleToggle }
        : { component: RouterLink, href: item.path })}
      sx={[
        (theme) => ({
          pl: 2,
          py: 1.25,
          gap: 2,
          pr: 1.5,
          borderRadius: 1.25,
          typography: 'body2',
          fontWeight: 'fontWeightMedium',
          color: theme.vars.palette.text.secondary,
          minHeight: 48,
          position: 'relative',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&::before': {
            content: '""',
            position: 'absolute',
            left: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 3,
            height: 0,
            borderRadius: '0 4px 4px 0',
            bgcolor: theme.vars.palette.primary.main,
            transition: 'height 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          },
          '&:hover': {
            bgcolor: varAlpha(theme.vars.palette.grey['500Channel'], 0.08),
            transform: 'translateX(4px)',
          },
          ...(isActived && {
            fontWeight: 'fontWeightSemiBold',
            color: theme.vars.palette.primary.main,
            bgcolor: varAlpha(theme.vars.palette.primary.mainChannel, 0.12),
            '&::before': {
              height: '70%',
            },
            '&:hover': {
              bgcolor: varAlpha(theme.vars.palette.primary.mainChannel, 0.16),
              transform: 'translateX(4px)',
            },
          }),
        }),
      ]}
    >
      <Box component="span" sx={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {item.icon}
      </Box>

      <Box component="span" sx={{ flexGrow: 1, fontSize: '0.9375rem' }}>
        {item.title}
      </Box>

      {item.children && (
        <Iconify
          width={18}
          icon={open ? 'eva:arrow-ios-downward-fill' : 'eva:arrow-ios-forward-fill'}
          sx={{
            ml: 1,
            flexShrink: 0,
            transition: 'transform 0.2s',
            ...(open && { transform: 'rotate(0deg)' })
          }}
        />
      )}

      {item.info && item.info}
    </ListItemButton>
  );

  return (
    <ListItem disableGutters disablePadding sx={{ display: 'block' }}>
      {renderContent}

      {item.children && (
        <Collapse in={open} timeout="auto" unmountOnExit>
          <List disablePadding sx={{
            pl: 4,
            mt: 0.5,
            gap: 0.5,
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              left: 16,
              top: 0,
              bottom: 0,
              width: 2,
              bgcolor: (theme) => varAlpha(theme.vars.palette.grey['500Channel'], 0.12),
              borderRadius: 1,
            }
          }}>
            {item.children.map((child) => {
              const isChildActived = child.path === pathname;

              return (
                <ListItemButton
                  key={child.title}
                  component={RouterLink}
                  href={child.path}
                  sx={[
                    (theme) => ({
                      pl: 2,
                      py: 0.875,
                      borderRadius: 1,
                      typography: 'body2',
                      fontSize: '0.875rem',
                      color: theme.vars.palette.text.secondary,
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        bgcolor: varAlpha(theme.vars.palette.grey['500Channel'], 0.08),
                        transform: 'translateX(4px)',
                      },
                      ...(isChildActived && {
                        fontWeight: 'fontWeightSemiBold',
                        color: theme.vars.palette.primary.main,
                        bgcolor: varAlpha(theme.vars.palette.primary.mainChannel, 0.08),
                      }),
                    }),
                  ]}
                >
                  <Box
                    component="span"
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      bgcolor: 'currentColor',
                      mr: 2,
                      opacity: 0.4,
                      transition: 'all 0.2s',
                      ...(isChildActived && {
                        opacity: 1,
                        transform: 'scale(1.3)',
                        boxShadow: (theme) => `0 0 0 3px ${varAlpha(theme.vars.palette.primary.mainChannel, 0.2)}`,
                      }),
                    }}
                  />
                  {child.title}
                </ListItemButton>
              );
            })}
          </List>
        </Collapse>
      )}
    </ListItem>
  );
}
