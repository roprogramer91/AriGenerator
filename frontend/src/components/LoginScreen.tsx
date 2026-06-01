import { useState } from 'react';
import axios from 'axios';

interface LoginScreenProps {
  onLogin: (token: string) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username || !password) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.post<{ token: string }>(
        `${import.meta.env.VITE_API_URL || ''}/api/auth/login`,
        { username, password },
      );
      localStorage.setItem('ari_token', data.token);
      onLogin(data.token);
    } catch {
      setError('Usuario o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-[#0e0e0e] flex items-center justify-center px-6">
      <div className="w-full max-w-sm flex flex-col gap-8">

        {/* Logo */}
        <div className="text-center">
          <h1 className="text-3xl font-black tracking-tight text-white">
            ARI<span className="text-[#3b82f6]"> STUDIO</span>
          </h1>
          <p className="text-[12px] text-white/30 mt-1 uppercase tracking-widest">Acceso privado</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-white/40 font-bold uppercase tracking-widest px-1">
              Usuario
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
              className="w-full h-12 bg-[#141414] border border-[#2a2a2a] focus:border-[#3b82f6] rounded-xl px-4 text-[14px] text-white outline-none transition-colors"
              placeholder="usuario"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-white/40 font-bold uppercase tracking-widest px-1">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full h-12 bg-[#141414] border border-[#2a2a2a] focus:border-[#3b82f6] rounded-xl px-4 text-[14px] text-white outline-none transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-[12px] text-red-400 bg-red-400/10 rounded-xl px-4 py-3 text-center">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !username || !password}
            className="h-14 bg-[#3b82f6] hover:bg-blue-500 disabled:opacity-40 rounded-xl text-white font-bold text-[14px] tracking-wide transition-all mt-2"
          >
            {loading ? 'Ingresando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
