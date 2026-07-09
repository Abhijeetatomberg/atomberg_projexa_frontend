import { createContext, useContext, useEffect, useState } from 'react';
import { login as apiLogin } from '@/api/resources';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('projexa_user') || 'null'); } catch { return null; }
  });

  useEffect(() => {
    if (user) localStorage.setItem('projexa_user', JSON.stringify(user));
    else localStorage.removeItem('projexa_user');
  }, [user]);

  const login = async (username, password) => {
    const res = await apiLogin(username, password);
    setUser(res.user);
    return res;
  };

  const logout = () => setUser(null);
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
