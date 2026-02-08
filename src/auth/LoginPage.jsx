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

  return (
    <div className="min-h-screen flex items-center justify-center bg-pink-50">
      <form onSubmit={submit} className="w-full max-w-md bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold text-pink-700 mb-4">Entrar</h2>
        {error && <div className="text-sm text-red-600 mb-3">{error}</div>}
        <label className="block mb-2 text-sm">Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 border rounded mb-3" />
        <label className="block mb-2 text-sm">Senha</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 border rounded mb-4" />
        <div className="flex gap-2">
          <button disabled={loading} className="bg-pink-600 text-white px-4 py-2 rounded">{loading ? "Entrando..." : "Entrar"}</button>
          <button type="button" onClick={() => navigate('/register')} className="px-4 py-2 border rounded">Registrar</button>
        </div>
      </form>
    </div>
  );
}
