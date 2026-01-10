import { useMemo } from 'react';
import { useNavigate } from 'react-router';

// ----------------------------------------------------------------------

export function useRouter() {
  const navigate = useNavigate();

  const router = useMemo(
    () => ({
      back: () => navigate(-1),
      forward: () => navigate(1),
      refresh: () => navigate(0),
      push: (href: string, state?: any) => navigate(href, { state }),
      replace: (href: string, state?: any) => navigate(href, { replace: true, state }),
    }),
    [navigate]
  );

  return router;
}
