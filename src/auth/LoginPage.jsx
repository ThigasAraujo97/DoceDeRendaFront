import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { login as loginService } from "./auth.service.js";
import { useAuth } from "./AuthProvider";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();
  const auth = useAuth();

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await loginService(email, password);
      // loginService saved token and user locally; update context
      const token = localStorage.getItem("auth_token");
      auth.login(token);
      navigate("/dashboard");
    } catch (err) {
      // Always show a generic authentication error to avoid exposing raw HTTP messages
      setError("Email ou senha incorreta");
    } finally {
      setLoading(false);
    }
  };

  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('theme') || 'dark'; } catch (e) { return 'dark'; }
  });

  useEffect(() => {
    try { document.documentElement.setAttribute('data-theme', theme); } catch (e) {}
  }, [theme]);

  useEffect(() => {
    const onStorage = (ev) => {
      if (ev.key === 'theme') {
        setTheme(ev.newValue || 'dark');
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const wrapperClass = theme === 'dark' ? 'min-h-screen flex items-center justify-center bg-slate-900' : 'min-h-screen flex items-center justify-center bg-pink-50';
  const formClass = theme === 'dark' ? 'w-full max-w-md bg-slate-800 p-6 rounded-lg shadow-lg text-white' : 'w-full max-w-md bg-white p-6 rounded-lg shadow';
  const inputClass = theme === 'dark' ? 'w-full px-3 py-2 border border-slate-700 rounded mb-3 bg-slate-700 text-white' : 'w-full px-3 py-2 border rounded mb-3';
  const primaryBtn = theme === 'dark' ? 'bg-blue-700 text-white' : 'bg-pink-600 text-white';

  return (
    <div className={wrapperClass}>
      <form onSubmit={submit} className={formClass}>
        <div className="mb-4">
          <h1 className={theme === 'dark' ? 'text-3xl font-bold text-white' : 'text-3xl font-bold text-pink-700'}>GRJotIt</h1>
          <h2 className={theme === 'dark' ? 'text-lg font-semibold text-white/80' : 'text-xl font-semibold text-pink-700/80'}>Entrar</h2>
        </div>
        {error && <div className={theme === 'dark' ? 'text-sm text-red-400 mb-3' : 'text-sm text-red-600 mb-3'}>{error}</div>}
        <label className={theme === 'dark' ? 'block mb-2 text-sm text-white/80' : 'block mb-2 text-sm'}>Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
        <label className={theme === 'dark' ? 'block mb-2 text-sm text-white/80' : 'block mb-2 text-sm'}>Senha</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={theme === 'dark' ? 'w-full px-3 py-2 border border-slate-700 rounded mb-4 bg-slate-700 text-white' : 'w-full px-3 py-2 border rounded mb-4'} />
        <div className="flex gap-2">
          <button disabled={loading} className={`${primaryBtn} px-4 py-2 rounded`}>{loading ? "Entrando..." : "Entrar"}</button>
          <button type="button" onClick={() => navigate('/register')} className={theme === 'dark' ? 'px-4 py-2 border border-slate-600 rounded text-white/90' : 'px-4 py-2 border rounded'}>Registrar</button>
        </div>
      </form>
    </div>
  );
}
