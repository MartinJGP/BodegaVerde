'use client';

import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { api } from '@/lib/api';
import { Rol } from '@/types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: { nombre: string; rol: Rol }) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.login(email, password);
      onLoginSuccess({
        nombre: res.usuario.nombre,
        rol: res.usuario.rol as Rol,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al autenticar credenciales');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (userEmail: string) => {
    setEmail(userEmail);
    setPassword('password123');
    setLoading(true);
    setError(null);

    try {
      const res = await api.login(userEmail, 'password123');
      onLoginSuccess({
        nombre: res.usuario.nombre,
        rol: res.usuario.rol as Rol,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al autenticar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal-900/30 backdrop-blur-xs p-4">
      <div className="w-full max-w-sm rounded-xl border border-sand-200 bg-white p-6 shadow-lg animate-feedback">
        <div className="flex items-center justify-between pb-3 border-b border-sand-100">
          <h2 className="text-sm font-semibold text-charcoal-900">Control de Acceso</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-charcoal-700/60 hover:text-charcoal-900 btn-action"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mt-3 rounded-lg bg-terracotta-50 p-2.5 text-xs text-terracotta-600 border border-terracotta-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-charcoal-700 mb-1">
              Correo Electrónico
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@bodegaverde.pe"
              className="w-full rounded-lg border border-sand-200 px-3 py-2 text-xs text-charcoal-900 placeholder:text-sand-300 focus:border-sage-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-charcoal-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-sand-200 px-3 py-2 text-xs text-charcoal-900 placeholder:text-sand-300 focus:border-sage-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-sage-500 py-2 text-xs font-medium text-white hover:bg-sage-600 disabled:opacity-50 btn-action"
          >
            {loading ? 'Validando...' : 'Iniciar Sesión'}
          </button>
        </form>

        {/* Acceso Rápido para Demostración */}
        <div className="mt-5 pt-4 border-t border-sand-100">
          <p className="text-[11px] font-medium text-charcoal-700/70 mb-2">
            Acceso Rápido (Demostración):
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => handleQuickLogin('mesero@bodegaverde.pe')}
              className="rounded-md border border-sand-200 bg-sand-50 py-1.5 text-[11px] font-medium text-charcoal-800 hover:bg-sand-100 btn-action"
            >
              Mesero
            </button>
            <button
              onClick={() => handleQuickLogin('cocina@bodegaverde.pe')}
              className="rounded-md border border-sand-200 bg-sand-50 py-1.5 text-[11px] font-medium text-charcoal-800 hover:bg-sand-100 btn-action"
            >
              Cocina
            </button>
            <button
              onClick={() => handleQuickLogin('admin@bodegaverde.pe')}
              className="rounded-md border border-sand-200 bg-sand-50 py-1.5 text-[11px] font-medium text-charcoal-800 hover:bg-sand-100 btn-action"
            >
              Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
