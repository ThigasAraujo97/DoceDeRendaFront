import React, { createContext, useContext, useEffect, useState } from "react";
import { getToken, getUser, decodeToken, logout as serviceLogout } from "./auth.service";

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getUser());
  const [token, setToken] = useState(() => getToken());
  const [roles, setRoles] = useState(() => (getUser()?.role ? [getUser().role] : getUser()?.roles || []));

  useEffect(() => {
    if (token) {
      const decoded = decodeToken(token);
      setUser(decoded);
      const r = decoded?.role ? [decoded.role] : decoded?.roles || decoded?.roles || [];
      setRoles(r);
    }
  }, [token]);

  const login = (t) => {
    setToken(t);
    try {
      const decoded = decodeToken(t);
      setUser(decoded);
      const r = decoded?.role ? [decoded.role] : decoded?.roles || [];
      setRoles(r);
      localStorage.setItem("auth_token", t);
      localStorage.setItem("auth_user", JSON.stringify(decoded));
    } catch (e) {
      // ignore
    }
  };

  const logout = () => {
    serviceLogout();
    setUser(null);
    setToken(null);
    setRoles([]);
  };

  const value = { user, token, roles, login, logout, isAuthenticated: !!token };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
