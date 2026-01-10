import { useState, useEffect, useContext, createContext } from 'react';

import { getCurrentUserInfo } from 'src/api/auth';

type UserType = {
  name: string;
  full_name: string;
  email: string;
  user_image?: string;
  roles: string[];
};

type AuthContextType = {
  user: UserType | null;
  loading: boolean;
  setUser: (u: UserType | null) => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  setUser: () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUserInfo()
      .then(setUser)
      .finally(() => setLoading(false));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
