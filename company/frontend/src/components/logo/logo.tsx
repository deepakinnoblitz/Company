import type { LinkProps } from '@mui/material/Link';

import { mergeClasses } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import { styled } from '@mui/material/styles';

import { RouterLink } from 'src/routes/components';

import { logoClasses } from './classes';

// ----------------------------------------------------------------------

export type LogoProps = LinkProps & {
  isSingle?: boolean;
  disabled?: boolean;
};

export function Logo({
  sx,
  disabled,
  className,
  href = '/',
  isSingle = true,
  ...other
}: LogoProps) {
  const logoUrl = 'http://erp.innoblitz.in/assets/Innoblitz%20Logo%20Full.png';

  const singleLogo = (
    <Box
      component="img"
      src={logoUrl}
      alt="Single logo"
      sx={{ width: 1, height: 180, objectFit: 'contain' }}
    />
  );

  const fullLogo = (
    <Box
      component="img"
      src={logoUrl}
      alt="Full logo"
      sx={{ width: 1, height: 1, objectFit: 'contain' }}
    />
  );

  return (
    <LogoRoot
      component={RouterLink}
      href={href}
      aria-label="Logo"
      underline="none"
      className={mergeClasses([logoClasses.root, className])}
      sx={[
        {
          width: 1,
          height: 170,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginLeft: -1,
          marginTop: -2,
          marginBottom: -4,
          mb: 3,
          ...(disabled && { pointerEvents: 'none' }),
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      {isSingle ? singleLogo : fullLogo}
    </LogoRoot>
  );
}

// ----------------------------------------------------------------------

const LogoRoot = styled(Link)(() => ({
  flexShrink: 0,
  color: 'transparent',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));
