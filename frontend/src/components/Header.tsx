'use client';

import React from 'react';
import { Rol } from '@/types';

interface HeaderProps {
  currentTab: 'mesero' | 'cocina';
  onSelectTab: (tab: 'mesero' | 'cocina') => void;
  currentUser: { nombre: string; rol: Rol } | null;
  onOpenLogin: () => void;
  isConnected: boolean;
  pedidosListosCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  onOpenLogin,
  isConnected,
  pedidosListosCount = 0,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-sand-200 bg-white/95 backdrop-blur-sm shadow-2xs">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
        {/* Identidad de Marca */}
        <div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-charcoal-900 leading-tight">
            La Bodega Verde
          </h1>
          <p className="text-xs sm:text-sm font-medium text-charcoal-600">Barranco, Lima</p>
        </div>

        {/* Selector de Vistas */}
        <nav className="flex items-center rounded-xl bg-sand-100 p-1.5 border border-sand-200/80">
          <button
            onClick={() => onSelectTab('mesero')}
            className={`relative flex items-center justify-center rounded-lg px-4 sm:px-5 py-2 sm:py-2.5 text-sm sm:text-base font-semibold btn-action transition-all ${
              currentTab === 'mesero'
                ? 'bg-white text-sage-800 shadow-sm'
                : 'text-charcoal-700 hover:text-charcoal-900'
            }`}
          >
            <span>Mesero</span>
            {pedidosListosCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center rounded-full bg-amberPastel-200 px-2 py-0.5 text-xs font-bold text-amberPastel-800 animate-pulse">
                {pedidosListosCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onSelectTab('cocina')}
            className={`flex items-center justify-center rounded-lg px-4 sm:px-5 py-2 sm:py-2.5 text-sm sm:text-base font-semibold btn-action transition-all ${
              currentTab === 'cocina'
                ? 'bg-white text-sage-800 shadow-sm'
                : 'text-charcoal-700 hover:text-charcoal-900'
            }`}
          >
            <span>Cocina</span>
          </button>
        </nav>

        {/* Usuario */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={onOpenLogin}
            className="flex items-center rounded-xl border border-sand-200 bg-sand-50/90 px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-charcoal-800 hover:bg-sand-100 btn-action transition-all"
          >
            <span className="max-w-[140px] truncate">
              {currentUser ? currentUser.nombre : 'Iniciar sesión'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
