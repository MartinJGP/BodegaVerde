'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/Header';
import { LoginModal } from '@/components/LoginModal';
import { NotificationToast } from '@/components/NotificationToast';
import { MeseroView } from '@/components/views/MeseroView';
import { CocinaView } from '@/components/views/CocinaView';
import { AdminView } from '@/components/views/AdminView';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { soundManager } from '@/lib/audio';
import {
  Mesa,
  Categoria,
  Plato,
  Pedido,
  Insumo,
  LoteInsumo,
  KardexMovimiento,
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

  // Datos globales
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [platos, setPlatos] = useState<Plato[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [alertasStock, setAlertasStock] = useState<Insumo[]>([]);
  const [alertasVencer, setAlertasVencer] = useState<LoteInsumo[]>([]);
  const [kardex, setKardex] = useState<KardexMovimiento[]>([]);

  const [loading, setLoading] = useState(true);

  // Toast
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

  // Desbloquear audio automáticamente con el primer gesto del usuario
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

  // Carga inicial de datos desde la API del backend
  const loadInitialData = useCallback(async () => {
    try {
      const [
        resMesas,
        resCategorias,
        resPlatos,
        resPedidos,
        resInsumos,
        resAlertasStock,
        resAlertasVencer,
        resKardex,
      ] = await Promise.allSettled([
        api.getMesas(),
        api.getCategorias(),
        api.getPlatos(),
        api.getPedidos(),
        api.getInsumos(),
        api.getAlertasStockMinimo(),
        api.getAlertasPorVencer(7),
        api.getKardexGlobal(),
      ]);

      if (resMesas.status === 'fulfilled') setMesas(resMesas.value);
      if (resCategorias.status === 'fulfilled') setCategorias(resCategorias.value);
      if (resPlatos.status === 'fulfilled') setPlatos(resPlatos.value);
      if (resPedidos.status === 'fulfilled') setPedidos(resPedidos.value);
      if (resInsumos.status === 'fulfilled') setInsumos(resInsumos.value);
      if (resAlertasStock.status === 'fulfilled') setAlertasStock(resAlertasStock.value);
      if (resAlertasVencer.status === 'fulfilled') setAlertasVencer(resAlertasVencer.value);
      if (resKardex.status === 'fulfilled') setKardex(resKardex.value);
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

    // Nueva comanda emitida
    socket.on('nuevo_pedido_cocina', (nuevoPedido: Pedido) => {
      setPedidos((prev) => {
        if (prev.some((p) => p.id === nuevoPedido.id)) return prev;
        return [nuevoPedido, ...prev];
      });
      // Sincronizar estado de mesa en frontend
      setMesas((prev) =>
        prev.map((m) => (m.id === nuevoPedido.mesaId ? { ...m, estado: 'OCUPADA' } : m))
      );
    });

    // Actualización de estado de pedido (cocina o entrega)
    socket.on('pedido_actualizado', (actualizado: any) => {
      setPedidos((prev) =>
        prev.map((p) => (p.id === actualizado.id ? { ...p, ...actualizado } : p))
      );
    });

    // Notificación en tiempo real al mesero: plato listo
    socket.on(
      'notificar_mesero',
      (data: { pedidoId: number; mesaNumero?: number; mensaje: string }) => {
        // 1. Reproducir sonido de alerta (chime armónico de restaurante)
        soundManager.playOrderReady();

        // 2. Mostrar toast visual emergente
        showToast(
          data.mensaje || `Pedido #${data.pedidoId} listo para servir en mesa`,
          'success'
        );

        // 3. Actualizar estado local inmediatamente para persistencia visual en mesas y banner
        setPedidos((prev) =>
          prev.map((p) => (p.id === data.pedidoId ? { ...p, estado: 'LISTO' } : p))
        );

        // 4. Refrescar datos completos desde el servidor para consistencia
        api.getPedidos().then(setPedidos).catch(() => {});
        api.getMesas().then(setMesas).catch(() => {});
      }
    );

    // Actualización de mesa en tiempo real (ej. desocupada o liberada)
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

  // Al crear una orden desde el mesero
  const handleOrderCreated = async () => {
    loadInitialData();
  };

  // Actualizar estado de comanda (ej. Mesero confirma entrega a comensales)
  const handleUpdatePedidoEstado = async (pedidoId: number, nuevoEstado: EstadoPedido) => {
    await api.actualizarEstadoPedido(pedidoId, nuevoEstado);
    setPedidos((prev) =>
      prev.map((p) => (p.id === pedidoId ? { ...p, estado: nuevoEstado } : p))
    );
    // Refrescar mesas y kárdex si corresponde
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

  return (
    <div className="min-h-screen bg-sand-50 flex flex-col">
      {/* Barra Superior con indicador de pedidos listos y botón de prueba sonora */}
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
