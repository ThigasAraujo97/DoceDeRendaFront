import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { register } from "./auth.service.js";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(email, password);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Erro ao registrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-pink-50">
      <form onSubmit={submit} className="w-full max-w-md bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold text-pink-700 mb-4">Registrar</h2>
        {error && <div className="text-sm text-red-600 mb-3">{error}</div>}
        <label className="block mb-2 text-sm">Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 border rounded mb-3" />
        <label className="block mb-2 text-sm">Senha</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 border rounded mb-4" />
        <div className="flex gap-2">
          <button disabled={loading} className="bg-pink-600 text-white px-4 py-2 rounded">{loading ? 'Registrando...' : 'Registrar'}</button>
          <button type="button" onClick={() => navigate('/login')} className="px-4 py-2 border rounded">Voltar</button>
        </div>
      </form>
    </div>
  );
}
