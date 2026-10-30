'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/Header';
import { LoginModal } from '@/components/LoginModal';
import { NotificationToast } from '@/components/NotificationToast';
import { MeseroView } from '@/components/views/MeseroView';
import { CocinaView } from '@/components/views/CocinaView';
// import { CheckoutView } from '@/components/views/CheckoutView';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { soundManager } from '@/lib/audio';
import {
  Mesa,
  Categoria,
  Plato,
  Pedido,
  Rol,
  EstadoPedido,
} from '@/types';

export default function Home() {
  const [currentTab, setCurrentTab] = useState<'mesero' | 'cocina'>('mesero');
  const [currentUser, setCurrentUser] = useState<{ nombre: string; rol: Rol } | null>({
    nombre: 'Carlos Mesero',
    rol: 'MESERO',
  });
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [platos, setPlatos] = useState<Plato[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);

  const [loading, setLoading] = useState(true);

  const [toast, setToast] = useState<{
    message: string;
    type?: 'success' | 'alert' | 'error';
  } | null>(null);

  const showToast = useCallback(
    (message: string, type: 'success' | 'alert' | 'error' = 'success') => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 4000);
    },
    []
  );

  // desbloqueo de audio al primer gesto del usuario
  useEffect(() => {
    const handleUnlock = () => {
      soundManager.unlockAudio();
      window.removeEventListener('pointerdown', handleUnlock);
      window.removeEventListener('keydown', handleUnlock);
    };

    window.addEventListener('pointerdown', handleUnlock);
    window.addEventListener('keydown', handleUnlock);

    return () => {
      window.removeEventListener('pointerdown', handleUnlock);
      window.removeEventListener('keydown', handleUnlock);
    };
  }, []);

  const loadInitialData = useCallback(async () => {
    try {
      const [
        resMesas,
        resCategorias,
        resPlatos,
        resPedidos,
      ] = await Promise.allSettled([
        api.getMesas(),
        api.getCategorias(),
        api.getPlatos(),
        api.getPedidos(),
      ]);

      if (resMesas.status === 'fulfilled') setMesas(resMesas.value);
      if (resCategorias.status === 'fulfilled') setCategorias(resCategorias.value);
      if (resPlatos.status === 'fulfilled') setPlatos(resPlatos.value);
      if (resPedidos.status === 'fulfilled') setPedidos(resPedidos.value);
    } catch (err: any) {
      console.error('Error cargando datos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();

    // Configuración de WebSockets para sincronización en tiempo real
    const socket = getSocket();

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('nuevo_pedido_cocina', (nuevoPedido: Pedido) => {
      setPedidos((prev) => {
        if (prev.some((p) => p.id === nuevoPedido.id)) return prev;
        return [nuevoPedido, ...prev];
      });
      setMesas((prev) =>
        prev.map((m) => (m.id === nuevoPedido.mesaId ? { ...m, estado: 'OCUPADA' } : m))
      );
    });

    socket.on('pedido_actualizado', (actualizado: any) => {
      setPedidos((prev) =>
        prev.map((p) => (p.id === actualizado.id ? { ...p, ...actualizado } : p))
      );
    });

    // notificacion sonora y toast cuando cocina despacha pedido
    socket.on(
      'notificar_mesero',
      (data: { pedidoId: number; mesaNumero?: number; mensaje: string }) => {
        soundManager.playOrderReady();
        showToast(
          data.mensaje || `Pedido #${data.pedidoId} listo para servir en mesa`,
          'success'
        );
        setPedidos((prev) =>
          prev.map((p) => (p.id === data.pedidoId ? { ...p, estado: 'LISTO' } : p))
        );
        api.getPedidos().then(setPedidos).catch(() => {});
        api.getMesas().then(setMesas).catch(() => {});
      }
    );

    socket.on('mesa_actualizada', (mesaActualizada: Mesa) => {
      setMesas((prev) =>
        prev.map((m) => (m.id === mesaActualizada.id ? mesaActualizada : m))
      );
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('nuevo_pedido_cocina');
      socket.off('pedido_actualizado');
      socket.off('notificar_mesero');
      socket.off('mesa_actualizada');
    };
  }, [loadInitialData, showToast]);

  const handleOrderCreated = async () => {
    loadInitialData();
  };

  const handleUpdatePedidoEstado = async (pedidoId: number, nuevoEstado: EstadoPedido) => {
    await api.actualizarEstadoPedido(pedidoId, nuevoEstado);
    setPedidos((prev) =>
      prev.map((p) => (p.id === pedidoId ? { ...p, estado: nuevoEstado } : p))
    );
    api.getMesas().then(setMesas).catch(() => {});
  };

  // Desocupar mesa y dejarla disponible para nuevos comensales
  const handleDesocuparMesa = async (mesaId: number) => {
    try {
      await api.actualizarMesa(mesaId, { estado: 'DISPONIBLE' });
      setMesas((prev) =>
        prev.map((m) => (m.id === mesaId ? { ...m, estado: 'DISPONIBLE' } : m))
      );
      const mesaNum = mesas.find((m) => m.id === mesaId)?.numero || mesaId;
      showToast(`Mesa #${mesaNum} desocupada y disponible para nuevos clientes`, 'success');
      soundManager.playActionComplete();
    } catch (err: any) {
      showToast(err.message || 'Error al desocupar la mesa', 'error');
    }
  };

  // Cantidad de pedidos listos esperando ser servidos
  const pedidosListosCount = pedidos.filter((p) => p.estado === 'LISTO').length;

  // Cantidad de cuentas activas por cobrar
  const cuentasPendientesCount = mesas.filter(
    (m) =>
      m.estado === 'OCUPADA' ||
      m.estado === 'EN_PAGO' ||
      pedidos.some(
        (p) => p.mesaId === m.id && p.estado !== 'PAGADO' && p.estado !== 'CANCELADO'
      )
  ).length;

  return (
    <div className="min-h-screen bg-sand-50 flex flex-col">
      {/* Barra Superior con selector de Mesero y Cocina */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        currentUser={currentUser}
        onOpenLogin={() => setIsLoginOpen(true)}
        isConnected={isConnected}
        pedidosListosCount={pedidosListosCount}
      />

      {/* Contenido Principal */}
      <main className="flex-1">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="flex items-center space-x-2 text-xs text-charcoal-700/60">
              <span className="h-2 w-2 rounded-full bg-sage-500 animate-pulse" />
              <span>Cargando datos del sistema...</span>
            </div>
          </div>
        ) : (
          <>
            {currentTab === 'mesero' && (
              <MeseroView
                mesas={mesas}
                categorias={categorias}
                platos={platos}
                pedidos={pedidos}
                onOrderCreated={handleOrderCreated}
                onUpdatePedidoEstado={handleUpdatePedidoEstado}
                onDesocuparMesa={handleDesocuparMesa}
                showToast={showToast}
              />
            )}

            {currentTab === 'cocina' && (
              <CocinaView initialPedidos={pedidos} showToast={showToast} />
            )}
          </>
        )}
      </main>

      {/* Modal de Inicio de Sesión */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          showToast(`Sesión iniciada como ${user.nombre}`, 'success');
        }}
      />

      {/* Notificación Toast Sutil para Acciones */}
      {toast && (
        <NotificationToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
