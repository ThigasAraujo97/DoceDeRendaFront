import React, { useState } from "react";
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

  const wrapperClass = 'min-h-screen flex items-center justify-center bg-slate-900';
  const formClass = 'w-full max-w-md bg-slate-800 p-6 rounded-lg shadow-lg text-white';
  const inputClass = 'w-full px-3 py-2 border border-slate-700 rounded mb-3 bg-slate-700 text-white';
  const primaryBtn = 'bg-blue-700 text-white';

  return (
    <div className={wrapperClass}>
      <form onSubmit={submit} className={formClass}>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">GRJotIt</h1>
            <h2 className="text-lg font-semibold text-white/80">Entrar</h2>
          </div>
          {/* tema removido — página usa azul escuro por padrão */}
        </div>
        {error && <div className="text-sm text-red-400 mb-3">{error}</div>}
        <label className="block mb-2 text-sm text-white/80">Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
        <label className="block mb-2 text-sm text-white/80">Senha</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 border border-slate-700 rounded mb-4 bg-slate-700 text-white" />
        <div className="flex gap-2">
          <button disabled={loading} className={`${primaryBtn} px-4 py-2 rounded`}>{loading ? "Entrando..." : "Entrar"}</button>
          <button type="button" onClick={() => navigate('/register')} className="px-4 py-2 border border-slate-600 rounded text-white/90">Registrar</button>
        </div>
      </form>
    </div>
  );
}
