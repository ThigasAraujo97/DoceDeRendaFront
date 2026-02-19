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
  const CLIENT_MAX_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours
  const EXP_KEY = 'auth_expires_at';
  const [expiresAt, setExpiresAt] = useState(() => {
    const v = localStorage.getItem(EXP_KEY);
    return v ? Number(v) : null;
  });
  const logoutTimerRef = React.useRef(null);

  useEffect(() => {
    if (token) {
      const decoded = decodeToken(token);
      setUser(decoded);
      const r = decoded?.role ? [decoded.role] : decoded?.roles || decoded?.roles || [];
      setRoles(r);
    }
  }, [token]);

  // schedule logout when token expires (client-enforced 4h or token exp claim)
  useEffect(() => {
    // clear existing timer
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
    try {
      const now = Date.now();
      let exp = expiresAt || null;
      if (!exp && token) {
        const decoded = decodeToken(token) || {};
        if (decoded.exp) exp = decoded.exp * 1000;
        // otherwise fall back to now + CLIENT_MAX_TTL_MS
        if (!exp) exp = now + CLIENT_MAX_TTL_MS;
      }
      // ensure we never exceed client max TTL
      if (exp) exp = Math.min(exp, (Date.now() + CLIENT_MAX_TTL_MS));
      if (exp && exp > now) {
        setExpiresAt(exp);
        localStorage.setItem(EXP_KEY, String(exp));
        const ms = exp - now;
        logoutTimerRef.current = setTimeout(() => {
          // perform logout when expired
          serviceLogout();
          setUser(null);
          setToken(null);
          setRoles([]);
          localStorage.removeItem(EXP_KEY);
          try { window.location.replace('/login'); } catch (e) {}
        }, ms);
      } else if (exp && exp <= now) {
        // expired already
        serviceLogout();
        setUser(null);
        setToken(null);
        setRoles([]);
        localStorage.removeItem(EXP_KEY);
        try { window.location.replace('/login'); } catch (e) {}
      }
    } catch (e) {
      // ignore scheduling errors
    }
    return () => {
      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current);
        logoutTimerRef.current = null;
      }
    };
  }, [token, expiresAt]);

  const login = (t) => {
    setToken(t);
    try {
      const decoded = decodeToken(t);
      setUser(decoded);
      const r = decoded?.role ? [decoded.role] : decoded?.roles || [];
      setRoles(r);
      localStorage.setItem("auth_token", t);
      localStorage.setItem("auth_user", JSON.stringify(decoded));
      // compute client-side expiry: 4 hours from now, but if token has exp claim use the earlier
      const now = Date.now();
      let tokenExp = decoded && decoded.exp ? decoded.exp * 1000 : null;
      let clientExp = now + CLIENT_MAX_TTL_MS;
      const finalExp = tokenExp ? Math.min(tokenExp, clientExp) : clientExp;
      setExpiresAt(finalExp);
      localStorage.setItem(EXP_KEY, String(finalExp));
    } catch (e) {
      // ignore
    }
  };

  const logout = () => {
    serviceLogout();
    setUser(null);
    setToken(null);
    setRoles([]);
    setExpiresAt(null);
    localStorage.removeItem(EXP_KEY);
    try { window.location.replace('/login'); } catch (e) {}
  };

  const value = { user, token, roles, login, logout, isAuthenticated: !!token };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
