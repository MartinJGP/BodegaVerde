'use client';

import React, { useState } from 'react';
import { Mesa, Categoria, Plato, Pedido, EstadoPedido } from '@/types';
import {
  Plus,
  Minus,
  Trash2,
  Send,
  Check,
  BellRing,
  ArrowUpRight,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { api } from '@/lib/api';
import { soundManager } from '@/lib/audio';

interface MeseroViewProps {
  mesas: Mesa[];
  categorias: Categoria[];
  platos: Plato[];
  pedidos?: Pedido[];
  onOrderCreated: (pedido: any) => void;
  onUpdatePedidoEstado?: (pedidoId: number, estado: EstadoPedido) => Promise<void>;
  onDesocuparMesa?: (mesaId: number) => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'alert' | 'error') => void;
}

interface CartItem {
  plato: Plato;
  cantidad: number;
  notas: string;
}

export const MeseroView: React.FC<MeseroViewProps> = ({
  mesas,
  categorias,
  platos,
  pedidos = [],
  onOrderCreated,
  onUpdatePedidoEstado,
  onDesocuparMesa,
  showToast,
}) => {
  const [selectedMesaId, setSelectedMesaId] = useState<number>(mesas[0]?.id || 1);
  const [selectedCategoriaId, setSelectedCategoriaId] = useState<number | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deliveringId, setDeliveringId] = useState<number | null>(null);
  const [isDesocupando, setIsDesocupando] = useState(false);

  const selectedMesa = mesas.find((m) => m.id === selectedMesaId);

  // Pedidos listos en cocina que esperan ser recogidos y servidos por el mesero
  const pedidosListos = pedidos.filter((p) => p.estado === 'LISTO');

  // Comandas activas para la mesa seleccionada actualmente
  const pedidosMesaActual = pedidos.filter(
    (p) => p.mesaId === selectedMesaId && p.estado !== 'CANCELADO'
  );
  const pedidosListosMesaActual = pedidosMesaActual.filter((p) => p.estado === 'LISTO');
  const pedidosCocinandoMesaActual = pedidosMesaActual.filter((p) => p.estado === 'EN_PREPARACION');
  const pedidosPendientesMesaActual = pedidosMesaActual.filter((p) => p.estado === 'PENDIENTE');

  // Estado de ocupación de la mesa activa
  const isMesaActualOcupada =
    selectedMesa?.estado === 'OCUPADA' ||
    pedidosMesaActual.some((p) => p.estado !== 'ENTREGADO');

  // Filtrado de platos por categoría
  const filteredPlatos = selectedCategoriaId
    ? platos.filter((p) => p.categoriaId === selectedCategoriaId)
    : platos;

  // Agregar plato al carrito
  const addToCart = (plato: Plato) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.plato.id === plato.id);
      if (existing) {
        return prev.map((item) =>
          item.plato.id === plato.id ? { ...item, cantidad: item.cantidad + 1 } : item
        );
      }
      return [...prev, { plato, cantidad: 1, notas: '' }];
    });
  };

  // Modificar cantidad
  const updateQuantity = (platoId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.plato.id === platoId) {
            const newQty = item.cantidad + delta;
            return newQty > 0 ? { ...item, cantidad: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  // Modificar nota personalizada
  const updateNotes = (platoId: number, notas: string) => {
    setCart((prev) =>
      prev.map((item) => (item.plato.id === platoId ? { ...item, notas } : item))
    );
  };

  // Quitar plato
  const removeFromCart = (platoId: number) => {
    setCart((prev) => prev.filter((item) => item.plato.id !== platoId));
  };

  // Total
  const total = cart.reduce(
    (sum, item) => sum + Number(item.plato.precio) * item.cantidad,
    0
  );

  // Confirmar entrega de pedido a la mesa
  const handleConfirmDelivery = async (pedidoId: number) => {
    setDeliveringId(pedidoId);
    try {
      if (onUpdatePedidoEstado) {
        await onUpdatePedidoEstado(pedidoId, 'ENTREGADO');
      } else {
        await api.actualizarEstadoPedido(pedidoId, 'ENTREGADO');
      }
      soundManager.playActionComplete();
      showToast(`Comanda #${pedidoId} marcada como entregada en mesa`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Error al confirmar entrega', 'error');
    } finally {
      setDeliveringId(null);
    }
  };

  // Desocupar la mesa cuando los comensales terminan su estadía
  const handleDesocuparMesaClick = async () => {
    if (!selectedMesa) return;
    setIsDesocupando(true);
    try {
      if (onDesocuparMesa) {
        await onDesocuparMesa(selectedMesa.id);
      } else {
        await api.actualizarMesa(selectedMesa.id, { estado: 'DISPONIBLE' });
        showToast(`Mesa #${selectedMesa.numero} desocupada y disponible`, 'success');
      }
      soundManager.playActionComplete();
    } catch (err: any) {
      showToast(err.message || 'Error al desocupar mesa', 'error');
    } finally {
      setIsDesocupando(false);
    }
  };

  // Enviar pedido a cocina
  const handleConfirmOrder = async () => {
    if (cart.length === 0) {
      showToast('Seleccione al menos un plato para registrar la orden', 'alert');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        mesaId: selectedMesaId,
        total: parseFloat(total.toFixed(2)),
        detalles: cart.map((item) => ({
          platoId: item.plato.id,
          cantidad: item.cantidad,
          precioUnitario: Number(item.plato.precio),
          notas: item.notas.trim() || undefined,
        })),
      };

      const res = await api.crearPedido(payload);
      soundManager.playActionComplete();
      showToast(`Comanda #${res.pedido.id} enviada a cocina. Insumos descontados.`, 'success');
      setCart([]);
      onOrderCreated(res.pedido);
    } catch (err: any) {
      showToast(err.message || 'Error al registrar pedido', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      {/* 0. Alerta Persistente de Platos Listos para Servir (Si el mesero estaba ocupado) */}
      {pedidosListos.length > 0 && (
        <div className="mb-6 rounded-xl border border-amberPastel-300 bg-amberPastel-50/90 p-4 shadow-sm animate-feedback">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-amberPastel-200">
            <div className="flex items-center space-x-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amberPastel-200 text-amberPastel-800">
                <BellRing className="h-4.5 w-4.5 animate-pulse" />
              </span>
              <h3 className="text-sm sm:text-base font-bold text-charcoal-900">
                Comandas listas en cocina para recoger ({pedidosListos.length})
              </h3>
            </div>
            <span className="self-start sm:self-auto rounded-full bg-amberPastel-200 px-3 py-1 text-xs font-semibold text-amberPastel-800">
              Atención requerida
            </span>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {pedidosListos.map((p) => {
              const mesaNum =
                p.mesa?.numero || mesas.find((m) => m.id === p.mesaId)?.numero || p.mesaId;
              const itemsList =
                p.detalles && p.detalles.length > 0
                  ? p.detalles.map((d) => `${d.cantidad}x ${d.plato?.nombre || 'Plato'}`).join(', ')
                  : 'Platos preparados';

              return (
                <div
                  key={p.id}
                  className="flex flex-col justify-between rounded-lg border border-amberPastel-200 bg-white p-3 shadow-2xs"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="rounded bg-amberPastel-100 px-2 py-0.5 text-xs font-bold text-amberPastel-800">
                        Mesa {mesaNum}
                      </span>
                      <span className="text-[11px] font-medium text-charcoal-700/60">
                        Comanda #{p.id}
                      </span>
                    </div>
                    <p className="mt-2 text-xs font-medium text-charcoal-800 line-clamp-2">
                      {itemsList}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-sand-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setSelectedMesaId(p.mesaId)}
                      className="inline-flex items-center space-x-1 text-[11px] font-medium text-charcoal-700 hover:text-charcoal-900 underline underline-offset-2 btn-action"
                    >
                      <span>Ver mesa</span>
                      <ArrowUpRight className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => handleConfirmDelivery(p.id)}
                      disabled={deliveringId === p.id}
                      className="flex items-center space-x-1 rounded-md bg-sage-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-sage-600 disabled:opacity-50 btn-action shadow-xs"
                    >
                      <Check className="h-3 w-3" />
                      <span>{deliveringId === p.id ? 'Entregando...' : 'Confirmar Entrega'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 1. Selector de Mesas con Estados: Libre, Cocinando, Listo para Servir, Ocupada */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base sm:text-lg font-bold tracking-tight text-charcoal-900">
            Mesas del Salón
          </h2>
          <span className="text-xs sm:text-sm font-medium text-charcoal-600">
            Mesa seleccionada: #{selectedMesa?.numero || selectedMesaId}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {mesas.map((mesa) => {
            const isSelected = mesa.id === selectedMesaId;

            // Comandas activas para esta mesa específica
            const pedidosMesa = pedidos.filter(
              (p) => p.mesaId === mesa.id && p.estado !== 'CANCELADO'
            );
            const pedidosListosMesa = pedidosMesa.filter((p) => p.estado === 'LISTO');
            const pedidosCocinandoMesa = pedidosMesa.filter((p) => p.estado === 'EN_PREPARACION');
            const pedidosPendientesMesa = pedidosMesa.filter((p) => p.estado === 'PENDIENTE');

            const hasListo = pedidosListosMesa.length > 0;
            const hasCocinando = pedidosCocinandoMesa.length > 0;
            const hasPendiente = pedidosPendientesMesa.length > 0;
            const isOcupada =
              mesa.estado === 'OCUPADA' || hasListo || hasCocinando || hasPendiente;

            return (
              <button
                key={mesa.id}
                onClick={() => setSelectedMesaId(mesa.id)}
                className={`relative flex flex-col items-center justify-center rounded-2xl border p-3.5 sm:p-4 btn-action transition-all ${
                  isSelected
                    ? hasListo
                      ? 'border-amberPastel-500 bg-amberPastel-50/90 ring-2 ring-amberPastel-400 shadow-sm'
                      : hasCocinando
                      ? 'border-sand-400 bg-sand-100 ring-2 ring-sand-300 shadow-xs'
                      : 'border-sage-500 bg-white ring-2 ring-sage-500 shadow-xs'
                    : hasListo
                    ? 'border-amberPastel-400 bg-amberPastel-50/70 hover:bg-amberPastel-100/60 ring-2 ring-amberPastel-300 shadow-xs'
                    : hasCocinando
                    ? 'border-sand-300 bg-sand-50/60 hover:bg-sand-100/50'
                    : isOcupada
                    ? 'border-amberPastel-200/80 bg-amberPastel-50/50 hover:bg-amberPastel-50'
                    : 'border-sand-200 bg-white hover:border-sand-300'
                }`}
              >
                {/* Indicador de pulso si el plato está listo en barra */}
                {hasListo && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amberPastel-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-amberPastel-500" />
                  </span>
                )}

                <span className="text-sm sm:text-base font-bold text-charcoal-900">
                  Mesa {mesa.numero}
                </span>
                <span className="text-xs text-charcoal-600 mt-0.5">
                  {mesa.capacidad} comensales
                </span>

                {/* Badge contextual de estado */}
                {hasListo ? (
                  <span className="mt-2.5 rounded-full bg-amberPastel-200 px-2.5 py-1 text-xs font-semibold text-amberPastel-800">
                    ¡Listo para servir!
                  </span>
                ) : hasCocinando ? (
                  <span className="mt-2.5 flex items-center space-x-1 rounded-full bg-sand-200 px-2.5 py-1 text-xs font-semibold text-charcoal-800">
                    <span className="h-1.5 w-1.5 rounded-full bg-amberPastel-600 animate-pulse" />
                    <span>Cocinando</span>
                  </span>
                ) : hasPendiente ? (
                  <span className="mt-2.5 rounded-full bg-sand-100 px-2.5 py-1 text-xs font-medium text-charcoal-700">
                    En cola
                  </span>
                ) : isOcupada ? (
                  <span className="mt-2.5 rounded-full bg-amberPastel-100 px-2.5 py-1 text-xs font-medium text-amberPastel-700">
                    Ocupada
                  </span>
                ) : (
                  <span className="mt-2.5 rounded-full bg-sage-100 px-2.5 py-1 text-xs font-medium text-sage-700">
                    Libre
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Cuerpo: Menú de la Carta y Comanda */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Catálogo de Carta (8 cols) */}
        <div className="lg:col-span-7 xl:col-span-8">
          {/* Categorías */}
          <div className="flex items-center space-x-2.5 overflow-x-auto pb-3 mb-4">
            <button
              onClick={() => setSelectedCategoriaId(null)}
              className={`rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold whitespace-nowrap btn-action transition-all ${
                selectedCategoriaId === null
                  ? 'bg-sage-600 text-white shadow-xs'
                  : 'bg-sand-100 text-charcoal-700 hover:bg-sand-200'
              }`}
            >
              Todos los platos
            </button>
            {categorias.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoriaId(cat.id)}
                className={`rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold whitespace-nowrap btn-action transition-all ${
                  selectedCategoriaId === cat.id
                    ? 'bg-sage-600 text-white shadow-xs'
                    : 'bg-sand-100 text-charcoal-700 hover:bg-sand-200'
                }`}
              >
                {cat.nombre}
              </button>
            ))}
          </div>

          {/* Grid de Platos */}
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            {filteredPlatos.map((plato) => {
              const precioNum = Number(plato.precio).toFixed(2);
              const isAvailable = plato.activo;

              return (
                <div
                  key={plato.id}
                  className={`flex flex-col justify-between rounded-2xl border p-4 sm:p-5 bg-white transition-all shadow-2xs ${
                    isAvailable
                      ? 'border-sand-200 hover:border-sand-300'
                      : 'border-sand-200/50 bg-sand-50/60 opacity-60'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <h3 className="text-sm sm:text-base font-bold text-charcoal-900">
                        {plato.nombre}
                      </h3>
                      <span className="text-sm sm:text-base font-bold text-sage-700">
                        S/ {precioNum}
                      </span>
                    </div>
                    {plato.descripcion && (
                      <p className="mt-1.5 text-xs text-charcoal-600 leading-relaxed line-clamp-2">
                        {plato.descripcion}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between pt-2.5 border-t border-sand-100">
                    <span className="text-xs font-medium text-charcoal-600/70">
                      {plato.categoria?.nombre || 'Carta General'}
                    </span>
                    {isAvailable ? (
                      <button
                        onClick={() => addToCart(plato)}
                        className="flex items-center space-x-1.5 rounded-lg bg-sage-50 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-sage-700 hover:bg-sage-100 border border-sage-200 btn-action transition-all"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Agregar</span>
                      </button>
                    ) : (
                      <span className="rounded-lg bg-terracotta-50 px-2.5 py-1 text-xs font-semibold text-terracotta-600">
                        Agotado
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Panel Lateral: Estado de Mesa, Cocinando, Listo y Comanda Activa (4 cols) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4">
          {/* Card de Estado de Mesa y Acción para Desocuparla */}
          <div className="rounded-2xl border border-sand-200 bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-charcoal-900">
                  Mesa #{selectedMesa?.numero}
                </h3>
                <p className="text-xs sm:text-sm text-charcoal-600 mt-0.5">
                  {isMesaActualOcupada
                    ? 'Comensales en mesa (Ocupada)'
                    : 'Mesa desocupada (Disponible)'}
                </p>
              </div>

              {isMesaActualOcupada ? (
                <button
                  onClick={handleDesocuparMesaClick}
                  disabled={isDesocupando}
                  className="flex items-center space-x-2 rounded-xl border border-sand-300 bg-sand-50 px-4 py-2 text-xs sm:text-sm font-semibold text-charcoal-800 hover:bg-sand-100 disabled:opacity-50 btn-action transition-all"
                >
                  <CheckCircle2 className="h-4 w-4 text-sage-600" />
                  <span>{isDesocupando ? 'Liberando...' : 'Desocupar Mesa'}</span>
                </button>
              ) : (
                <span className="rounded-xl bg-sage-50 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-sage-700 border border-sage-200">
                  Disponible
                </span>
              )}
            </div>
          </div>

          {/* Card si la mesa tiene platos listos para servir */}
          {pedidosListosMesaActual.length > 0 && (
            <div className="rounded-2xl border border-amberPastel-300 bg-amberPastel-50/90 p-5 shadow-xs animate-feedback">
              <div className="flex items-center space-x-2 text-amberPastel-900">
                <BellRing className="h-5 w-5 animate-pulse text-amberPastel-700" />
                <h3 className="text-sm sm:text-base font-bold">
                  ¡Platos listos para entregar en Mesa #{selectedMesa?.numero}!
                </h3>
              </div>

              <div className="mt-3.5 space-y-2.5">
                {pedidosListosMesaActual.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-xl border border-amberPastel-200 bg-white p-3.5 shadow-2xs"
                  >
                    <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-charcoal-900">
                      <span>Comanda #{p.id}</span>
                      <span className="rounded-full bg-amberPastel-100 px-3 py-1 text-xs font-semibold text-amberPastel-800">
                        Lista para servir
                      </span>
                    </div>

                    <ul className="mt-2.5 space-y-1.5 text-xs sm:text-sm text-charcoal-800">
                      {p.detalles?.map((det, idx) => (
                        <li key={idx} className="flex justify-between items-start">
                          <span className="font-medium">
                            {det.cantidad}x {det.plato?.nombre}
                          </span>
                          {det.notasPersonalizadas && (
                            <span className="text-xs italic text-charcoal-500 ml-2">
                              ({det.notasPersonalizadas})
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => handleConfirmDelivery(p.id)}
                      disabled={deliveringId === p.id}
                      className="mt-3.5 flex w-full items-center justify-center space-x-2 rounded-xl bg-sage-600 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-sage-700 disabled:opacity-50 btn-action shadow-xs transition-all"
                    >
                      <Check className="h-4 w-4" />
                      <span>
                        {deliveringId === p.id
                          ? 'Marcando entrega...'
                          : 'Confirmar Entrega a Comensales'}
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Card si la mesa tiene comandas en preparación en cocina ("Cocinando") */}
          {pedidosCocinandoMesaActual.length > 0 && (
            <div className="rounded-2xl border border-sand-200 bg-white p-5 shadow-2xs">
              <div className="flex items-center justify-between pb-2.5 border-b border-sand-100">
                <div className="flex items-center text-charcoal-900">
                  <h3 className="text-sm sm:text-base font-bold">Cocinando en Cocina</h3>
                </div>
                <span className="rounded-full bg-sand-100 px-3 py-1 text-xs font-semibold text-charcoal-800">
                  En preparación
                </span>
              </div>

              <div className="mt-3.5 space-y-2.5">
                {pedidosCocinandoMesaActual.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-xl border border-sand-100 bg-sand-50/60 p-3 text-xs sm:text-sm"
                  >
                    <div className="flex justify-between items-center font-bold text-charcoal-900">
                      <span>Comanda #{p.id}</span>
                      <span className="flex items-center space-x-1.5 text-xs font-medium text-charcoal-600">
                        <Clock className="h-3.5 w-3.5" />
                        <span>En preparación</span>
                      </span>
                    </div>

                    <ul className="mt-2 space-y-1 text-charcoal-800">
                      {p.detalles?.map((det, idx) => (
                        <li key={idx} className="flex justify-between items-start text-xs sm:text-sm">
                          <span className="font-medium">
                            {det.cantidad}x {det.plato?.nombre}
                          </span>
                          {det.notasPersonalizadas && (
                            <span className="text-xs italic text-charcoal-500 ml-2">
                              ({det.notasPersonalizadas})
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Formulario de Nueva Comanda */}
          <div className="sticky top-20 rounded-2xl border border-sand-200 bg-white p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between pb-3.5 border-b border-sand-100">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-charcoal-900">Tomar Comanda</h3>
                <p className="text-xs sm:text-sm text-charcoal-600 mt-0.5">
                  Mesa #{selectedMesa?.numero}
                </p>
              </div>
              <span className="rounded-full bg-sand-100 px-3 py-1 text-xs font-semibold text-charcoal-700">
                {cart.length} {cart.length === 1 ? 'ítem' : 'ítems'}
              </span>
            </div>

            {/* Lista de ítems en carrito */}
            <div className="mt-4 max-h-[320px] space-y-3.5 overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <div className="py-10 text-center text-xs sm:text-sm text-charcoal-500">
                  Seleccione platos de la carta para añadirlos a la comanda
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.plato.id}
                    className="rounded-xl border border-sand-100 bg-sand-50/60 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-semibold text-charcoal-900">
                        {item.plato.nombre}
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-charcoal-900">
                        S/ {(Number(item.plato.precio) * item.cantidad).toFixed(2)}
                      </span>
                    </div>

                    {/* Notas personalizadas */}
                    <input
                      type="text"
                      value={item.notas}
                      onChange={(e) => updateNotes(item.plato.id, e.target.value)}
                      placeholder="Nota de preparación (ej. sin azúcar)..."
                      className="mt-2 w-full rounded-lg border border-sand-200 bg-white px-3 py-1.5 text-xs text-charcoal-800 placeholder:text-sand-400 focus:border-sage-500 focus:outline-none"
                    />

                    {/* Controles de cantidad */}
                    <div className="mt-2.5 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.plato.id, -1)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-sand-200 bg-white text-charcoal-700 hover:bg-sand-100 btn-action transition-all"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-7 text-center text-sm font-bold text-charcoal-900">
                          {item.cantidad}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.plato.id, 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-sand-200 bg-white text-charcoal-700 hover:bg-sand-100 btn-action transition-all"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.plato.id)}
                        className="text-charcoal-400 hover:text-terracotta-600 btn-action p-1.5 transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Resumen de Total */}
            <div className="mt-5 pt-3.5 border-t border-sand-100 space-y-2.5">
              <div className="flex items-center justify-between text-xs sm:text-sm text-charcoal-600">
                <span>Subtotal</span>
                <span className="font-medium">S/ {total.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-base sm:text-lg font-bold text-charcoal-900">
                <span>Total</span>
                <span className="text-sage-800">S/ {total.toFixed(2)}</span>
              </div>

              <button
                onClick={handleConfirmOrder}
                disabled={cart.length === 0 || isSubmitting}
                className="mt-3.5 flex w-full items-center justify-center space-x-2 rounded-xl bg-sage-600 py-3 text-sm sm:text-base font-bold text-white hover:bg-sage-700 disabled:opacity-40 btn-action shadow-xs transition-all"
              >
                <Send className="h-4 w-4" />
                <span>
                  {isSubmitting ? 'Enviando a cocina...' : 'Confirmar y Enviar a Cocina'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
