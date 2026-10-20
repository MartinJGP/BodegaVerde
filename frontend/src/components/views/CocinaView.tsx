'use client';

import React, { useState, useEffect } from 'react';
import { Pedido, EstadoPedido } from '@/types';
import { Clock, CheckCircle2, Play, Check } from 'lucide-react';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';

interface CocinaViewProps {
  initialPedidos: Pedido[];
  showToast: (msg: string, type?: 'success' | 'alert' | 'error') => void;
}

export const CocinaView: React.FC<CocinaViewProps> = ({ initialPedidos, showToast }) => {
  const [pedidos, setPedidos] = useState<Pedido[]>(initialPedidos);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  // Cargar y escuchar eventos de WebSockets en tiempo real
  useEffect(() => {
    setPedidos(initialPedidos);
    const socket = getSocket();

    // Nueva comanda emitida por el mesero
    socket.on('nuevo_pedido_cocina', (nuevoPedido: Pedido) => {
      setPedidos((prev) => {
        if (prev.some((p) => p.id === nuevoPedido.id)) return prev;
        return [nuevoPedido, ...prev];
      });
      showToast(`Nueva comanda recibida para Mesa #${nuevoPedido.mesa?.numero}`, 'alert');
    });

    // Actualización de estado
    socket.on('pedido_actualizado', (actualizado: any) => {
      setPedidos((prev) =>
        prev.map((p) => (p.id === actualizado.id ? { ...p, estado: actualizado.estado } : p))
      );
    });

    return () => {
      socket.off('nuevo_pedido_cocina');
      socket.off('pedido_actualizado');
    };
  }, [initialPedidos, showToast]);

  // Filtrar comandas activas en cocina (ocultar las entregadas o canceladas)
  const activePedidos = pedidos.filter(
    (p) => p.estado === 'PENDIENTE' || p.estado === 'EN_PREPARACION' || p.estado === 'LISTO'
  );

  const handleUpdateStatus = async (pedidoId: number, nuevoEstado: EstadoPedido) => {
    setLoadingId(pedidoId);
    try {
      await api.actualizarEstadoPedido(pedidoId, nuevoEstado);

      setPedidos((prev) =>
        prev.map((p) => (p.id === pedidoId ? { ...p, estado: nuevoEstado } : p))
      );

      if (nuevoEstado === 'LISTO') {
        showToast(`Pedido #${pedidoId} marcado como listo. Mesero notificado.`, 'success');
      } else if (nuevoEstado === 'ENTREGADO') {
        showToast(`Pedido #${pedidoId} despachado a mesa`, 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Error al actualizar comanda', 'error');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      {/* Encabezado KDS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-sand-200 mb-6 gap-2">
        <div>
          <h2 className="text-base font-semibold text-charcoal-900 tracking-tight">
            Pantalla de Cocina (KDS)
          </h2>
          <p className="text-xs text-charcoal-700/70">
            Comandas activas ordenadas por orden de llegada
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="rounded-full bg-sand-100 px-3 py-1 font-medium text-charcoal-800">
            {activePedidos.length} {activePedidos.length === 1 ? 'comanda activa' : 'comandas activas'}
          </span>
        </div>
      </div>

      {/* Grid de Comandas */}
      {activePedidos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-sand-300 p-12 text-center bg-white/50">
          <Clock className="mx-auto h-8 w-8 text-charcoal-700/30 mb-2" />
          <h3 className="text-xs font-semibold text-charcoal-800">
            No hay comandas pendientes
          </h3>
          <p className="text-[11px] text-charcoal-700/60 mt-0.5">
            Las nuevas órdenes tomadas por los meseros aparecerán aquí al instante
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activePedidos.map((pedido) => {
            const isPendiente = pedido.estado === 'PENDIENTE';
            const isEnPrep = pedido.estado === 'EN_PREPARACION';
            const isListo = pedido.estado === 'LISTO';

            return (
              <div
                key={pedido.id}
                className={`flex flex-col justify-between rounded-xl border bg-white p-4 shadow-xs transition-all ${
                  isListo
                    ? 'border-sage-300 ring-1 ring-sage-300/60'
                    : isEnPrep
                    ? 'border-amberPastel-200'
                    : 'border-sand-200'
                }`}
              >
                <div>
                  {/* Cabecera de la comanda */}
                  <div className="flex items-center justify-between pb-3 border-b border-sand-100">
                    <div>
                      <span className="text-xs font-bold text-charcoal-900">
                        Comanda #{pedido.id}
                      </span>
                      <span className="block text-[11px] font-medium text-sage-600">
                        Mesa {pedido.mesa?.numero}
                      </span>
                    </div>

                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium ${
                        isListo
                          ? 'bg-sage-100 text-sage-700'
                          : isEnPrep
                          ? 'bg-amberPastel-100 text-amberPastel-700'
                          : 'bg-sand-100 text-charcoal-700'
                      }`}
                    >
                      {isListo
                        ? 'Listo para servir'
                        : isEnPrep
                        ? 'En preparación'
                        : 'Pendiente'}
                    </span>
                  </div>

                  {/* Lista de platos y notas */}
                  <div className="mt-3 space-y-2.5">
                    {pedido.detalles.map((det, idx) => (
                      <div key={idx} className="text-xs">
                        <div className="flex items-baseline space-x-2">
                          <span className="font-bold text-charcoal-900 w-5">
                            {det.cantidad}x
                          </span>
                          <span className="font-medium text-charcoal-800">
                            {det.plato?.nombre || 'Plato'}
                          </span>
                        </div>
                        {det.notasPersonalizadas && (
                          <div className="ml-7 mt-1 rounded bg-sand-100/70 px-2 py-0.5 text-[11px] font-medium text-charcoal-700 border border-sand-200/50 inline-block">
                            Nota: {det.notasPersonalizadas}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Acciones de Cocinero */}
                <div className="mt-5 pt-3 border-t border-sand-100">
                  {isPendiente && (
                    <button
                      onClick={() => handleUpdateStatus(pedido.id, 'EN_PREPARACION')}
                      disabled={loadingId === pedido.id}
                      className="flex w-full items-center justify-center space-x-1.5 rounded-lg border border-sand-200 bg-sand-50 py-2 text-xs font-medium text-charcoal-800 hover:bg-sand-100 btn-action"
                    >
                      <Play className="h-3 w-3" />
                      <span>Iniciar Preparación</span>
                    </button>
                  )}

                  {isEnPrep && (
                    <button
                      onClick={() => handleUpdateStatus(pedido.id, 'LISTO')}
                      disabled={loadingId === pedido.id}
                      className="flex w-full items-center justify-center space-x-1.5 rounded-lg bg-sage-500 py-2 text-xs font-medium text-white hover:bg-sage-600 btn-action"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Marcar Listo para Servir</span>
                    </button>
                  )}

                  {isListo && (
                    <button
                      onClick={() => handleUpdateStatus(pedido.id, 'ENTREGADO')}
                      disabled={loadingId === pedido.id}
                      className="flex w-full items-center justify-center space-x-1.5 rounded-lg bg-sand-100 py-2 text-xs font-medium text-charcoal-800 hover:bg-sand-200 btn-action"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Confirmar Despacho a Mesa</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
