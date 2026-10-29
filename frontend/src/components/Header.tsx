'use client';

import React from 'react';
import { ChefHat, ClipboardList, Receipt, User } from 'lucide-react';
import { Rol } from '@/types';

interface HeaderProps {
  currentTab: 'mesero' | 'cocina' | 'checkout';
  onSelectTab: (tab: 'mesero' | 'cocina' | 'checkout') => void;
  currentUser: { nombre: string; rol: Rol } | null;
  onOpenLogin: () => void;
  isConnected: boolean;
  pedidosListosCount?: number;
  cuentasPendientesCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  onOpenLogin,
  isConnected,
  pedidosListosCount = 0,
  cuentasPendientesCount = 0,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-sand-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Identidad de Marca */}
        <div className="flex items-center space-x-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sage-100 text-sage-600">
            <span className="font-semibold text-sm tracking-tight text-sage-700">BV</span>
          </div>
          <div>
            <h1 className="text-base font-medium tracking-tight text-charcoal-900 leading-tight">
              La Bodega Verde
            </h1>
            <p className="text-xs text-charcoal-700/70">Barranco, Lima</p>
          </div>
        </div>

        {/* Selector de Vistas: Mesero, Cocina KDS y Caja / Checkout */}
        <nav className="flex items-center rounded-lg bg-sand-100 p-1 border border-sand-200/80">
          <button
            onClick={() => onSelectTab('mesero')}
            className={`relative flex items-center space-x-2 rounded-md px-3 py-1.5 text-xs font-medium btn-action ${
              currentTab === 'mesero'
                ? 'bg-white text-sage-700 shadow-sm'
                : 'text-charcoal-700 hover:text-charcoal-900'
            }`}
          >
            <ClipboardList className="h-3.5 w-3.5" />
            <span>Mesero</span>
            {pedidosListosCount > 0 && (
              <span className="ml-1 inline-flex items-center justify-center rounded-full bg-amberPastel-200 px-1.5 py-0.5 text-[10px] font-bold text-amberPastel-700 animate-pulse">
                {pedidosListosCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onSelectTab('cocina')}
            className={`flex items-center space-x-2 rounded-md px-3 py-1.5 text-xs font-medium btn-action ${
              currentTab === 'cocina'
                ? 'bg-white text-sage-700 shadow-sm'
                : 'text-charcoal-700 hover:text-charcoal-900'
            }`}
          >
            <ChefHat className="h-3.5 w-3.5" />
            <span>Cocina KDS</span>
          </button>

          <button
            onClick={() => onSelectTab('checkout')}
            className={`relative flex items-center space-x-2 rounded-md px-3 py-1.5 text-xs font-medium btn-action ${
              currentTab === 'checkout'
                ? 'bg-white text-sage-700 shadow-sm'
                : 'text-charcoal-700 hover:text-charcoal-900'
            }`}
          >
            <Receipt className="h-3.5 w-3.5" />
            <span>Caja / Checkout</span>
            {cuentasPendientesCount > 0 && (
              <span className="ml-1 inline-flex items-center justify-center rounded-full bg-sage-200 px-1.5 py-0.5 text-[10px] font-bold text-sage-800">
                {cuentasPendientesCount}
              </span>
            )}
          </button>
        </nav>

        {/* Usuario */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={onOpenLogin}
            className="flex items-center space-x-2 rounded-lg border border-sand-200 bg-sand-50/80 px-2.5 py-1.5 text-xs font-medium text-charcoal-800 hover:bg-sand-100 btn-action"
          >
            <User className="h-3.5 w-3.5 text-charcoal-700" />
            <span className="max-w-[120px] truncate">
              {currentUser ? currentUser.nombre : 'Iniciar sesión'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
