import React from "react";
import {
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
  type PamUser,
} from "./authStore";

type AuthContextValue = {
  user: PamUser | null;
  loading: boolean;
  login: typeof loginUser;
  register: typeof registerUser;
  logout: () => Promise<void>;
};

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<PamUser | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .finally(() => setLoading(false));
  }, []);

  const login = React.useCallback(async (input: Parameters<typeof loginUser>[0]) => {
    const nextUser = await loginUser(input);
    setUser(nextUser);
    return nextUser;
  }, []);

  const register = React.useCallback(async (input: Parameters<typeof registerUser>[0]) => {
    const nextUser = await registerUser(input);
    setUser(nextUser);
    return nextUser;
  }, []);

  const logout = React.useCallback(async () => {
    await logoutUser();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = React.useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider.");
  return value;
}
