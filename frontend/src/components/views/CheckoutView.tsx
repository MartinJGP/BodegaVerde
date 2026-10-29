'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Mesa,
  Pedido,
  Comprobante,
  TipoComprobante,
  MetodoPago,
  ResumenCajaDiario,
} from '@/types';
import {
  Receipt,
  CreditCard,
  Banknote,
  QrCode,
  CheckCircle2,
  Clock,
  Printer,
  FileText,
  DollarSign,
  AlertCircle,
  Sparkles,
  Search,
  ArrowRight,
  X,
  Building2,
  Percent,
} from 'lucide-react';
import { api } from '@/lib/api';
import { soundManager } from '@/lib/audio';

interface CheckoutViewProps {
  mesas: Mesa[];
  pedidos: Pedido[];
  onCobroCompletado: () => void;
  showToast: (msg: string, type?: 'success' | 'alert' | 'error') => void;
}

export const CheckoutView: React.FC<CheckoutViewProps> = ({
  mesas,
  pedidos,
  onCobroCompletado,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'pendientes' | 'arqueo'>('pendientes');
  const [selectedMesa, setSelectedMesa] = useState<Mesa | null>(null);
  const [comprobantes, setComprobantes] = useState<Comprobante[]>([]);
  const [resumenDiario, setResumenDiario] = useState<ResumenCajaDiario | null>(null);
  const [loadingData, setLoadingData] = useState(false);

  const [showCobroModal, setShowCobroModal] = useState(false);
  const [tipoComprobante, setTipoComprobante] = useState<TipoComprobante>('BOLETA');
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteDocumento, setClienteDocumento] = useState('');
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('EFECTIVO');
  const [montoRecibido, setMontoRecibido] = useState<string>('');
  const [referenciaPago, setReferenciaPago] = useState('');
  const [mostrarCamposCliente, setMostrarCamposCliente] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [ticketParaVer, setTicketParaVer] = useState<Comprobante | null>(null);

  const loadHistorial = useCallback(async () => {
    setLoadingData(true);
    try {
      const [resComprobantes, resResumen] = await Promise.allSettled([
        api.getComprobantes(),
        api.getResumenCajaDiario(),
      ]);

      if (resComprobantes.status === 'fulfilled') {
        setComprobantes(resComprobantes.value);
      }
      if (resResumen.status === 'fulfilled') {
        setResumenDiario(resResumen.value);
      }
    } catch (err: any) {
      console.error('Error cargando historial de caja:', err);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    loadHistorial();
  }, [loadHistorial]);

  const mesasConCuentaActiva = useMemo(() => {
    return mesas.map((mesa) => {
      const pedidosMesa = pedidos.filter(
        (p) => p.mesaId === mesa.id && p.estado !== 'PAGADO' && p.estado !== 'CANCELADO'
      );
      const totalPendiente = pedidosMesa.reduce((acc, p) => acc + Number(p.total), 0);
      return {
        ...mesa,
        pedidosActivos: pedidosMesa,
        totalPendiente,
      };
    }).filter((m) => m.pedidosActivos.length > 0 || m.estado === 'OCUPADA' || m.estado === 'EN_PAGO');
  }, [mesas, pedidos]);

  const pedidoActivoMesa = useMemo(() => {
    if (!selectedMesa) return null;
    return (
      pedidos.find(
        (p) =>
          p.mesaId === selectedMesa.id &&
          p.estado !== 'PAGADO' &&
          p.estado !== 'CANCELADO'
      ) || null
    );
  }, [selectedMesa, pedidos]);

  // calculo de base imponible e igv 18%
  const calculosPrecuenta = useMemo(() => {
    if (!pedidoActivoMesa) return { subtotal: 0, igv: 0, total: 0 };
    const total = Number(pedidoActivoMesa.total);
    const subtotal = Number((total / 1.18).toFixed(2));
    const igv = Number((total - subtotal).toFixed(2));
    return { subtotal, igv, total };
  }, [pedidoActivoMesa]);

  const vueltoCalculado = useMemo(() => {
    if (metodoPago !== 'EFECTIVO' || !montoRecibido || !pedidoActivoMesa) return 0;
    const recibido = parseFloat(montoRecibido);
    const total = Number(pedidoActivoMesa.total);
    if (isNaN(recibido) || recibido < total) return 0;
    return Number((recibido - total).toFixed(2));
  }, [metodoPago, montoRecibido, pedidoActivoMesa]);

  // denominaciones de efectivo rapido
  const quickCashOptions = useMemo(() => {
    if (!pedidoActivoMesa) return [];
    const total = Number(pedidoActivoMesa.total);
    const list: number[] = [total];

    const roundTen = Math.ceil(total / 10) * 10;
    if (roundTen > total && !list.includes(roundTen)) {
      list.push(roundTen);
    }

    [50, 100, 200].forEach((bill) => {
      if (bill > total && !list.includes(bill)) {
        list.push(bill);
      }
    });

    return list.slice(0, 4);
  }, [pedidoActivoMesa]);

  const handleIniciarCobro = (mesa: Mesa) => {
    setSelectedMesa(mesa);
    const ped = pedidos.find(
      (p) => p.mesaId === mesa.id && p.estado !== 'PAGADO' && p.estado !== 'CANCELADO'
    );
    if (!ped) {
      showToast('No se encontró un pedido activo en esta mesa', 'alert');
      return;
    }
    setTipoComprobante('BOLETA');
    setClienteNombre('');
    setClienteDocumento('');
    setMetodoPago('EFECTIVO');
    setMontoRecibido(String(Number(ped.total).toFixed(2)));
    setReferenciaPago('');
    setMostrarCamposCliente(false);
    setShowCobroModal(true);
  };

  const handleConfirmarCobro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pedidoActivoMesa) return;

    if (tipoComprobante === 'FACTURA' && (!clienteDocumento || clienteDocumento.length !== 11)) {
      showToast('La factura requiere un número de RUC válido de 11 dígitos', 'alert');
      return;
    }

    if (metodoPago === 'EFECTIVO') {
      const recibido = parseFloat(montoRecibido);
      if (isNaN(recibido) || recibido < Number(pedidoActivoMesa.total)) {
        showToast('El monto recibido en efectivo no puede ser menor al total', 'alert');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const res = await api.emitirComprobante({
        pedidoId: pedidoActivoMesa.id,
        tipo: tipoComprobante,
        clienteNombre: clienteNombre.trim() || (tipoComprobante === 'FACTURA' ? 'Empresa Cliente' : 'Clientes Varios'),
        clienteDocumento: clienteDocumento.trim() || undefined,
        pagos: [
          {
            metodoPago,
            monto: Number(pedidoActivoMesa.total),
            montoRecibido: metodoPago === 'EFECTIVO' ? parseFloat(montoRecibido) : undefined,
            vuelto: metodoPago === 'EFECTIVO' ? vueltoCalculado : undefined,
            referencia: referenciaPago.trim() || undefined,
          },
        ],
      });

      soundManager.playActionComplete();
      showToast(
        `${res.comprobante.tipo} ${res.comprobante.serie}-${String(res.comprobante.numeroCorrelativo).padStart(6, '0')} emitida con éxito. Mesa #${selectedMesa?.numero} liberada.`,
        'success'
      );

      setShowCobroModal(false);
      setSelectedMesa(null);
      setTicketParaVer(res.comprobante);
      onCobroCompletado();
      loadHistorial();
    } catch (err: any) {
      showToast(err.message || 'Error al procesar el cobro', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      {/* Encabezado y Navegación de Caja */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-sand-200 pb-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('pendientes')}
            className={`flex items-center space-x-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'pendientes'
                ? 'bg-sage-600 text-white shadow-xs'
                : 'bg-white text-charcoal-700 hover:bg-sand-100 border border-sand-200'
            }`}
          >
            <Receipt className="h-3.5 w-3.5" />
            <span>Cuentas por Cobrar ({mesasConCuentaActiva.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('arqueo')}
            className={`flex items-center space-x-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'arqueo'
                ? 'bg-sage-600 text-white shadow-xs'
                : 'bg-white text-charcoal-700 hover:bg-sand-100 border border-sand-200'
            }`}
          >
            <DollarSign className="h-3.5 w-3.5" />
            <span>Arqueo de Caja</span>
          </button>
        </div>

        <button
          onClick={loadHistorial}
          className="text-xs text-charcoal-700/70 hover:text-charcoal-900 flex items-center space-x-1"
        >
          <span>Actualizar datos</span>
        </button>
      </div>

      {/* Cuentas por Cobrar */}
      {activeTab === 'pendientes' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Listado de Mesas con Cuentas Pendientes */}
          <div className="lg:col-span-2">
            <h3 className="text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-3">
              Mesas con Cuenta Activa
            </h3>

            {mesasConCuentaActiva.length === 0 ? (
              <div className="rounded-xl border border-dashed border-sand-300 bg-white p-8 text-center">
                <Receipt className="mx-auto h-8 w-8 text-charcoal-700/40" />
                <p className="mt-2 text-xs font-medium text-charcoal-800">
                  No hay cuentas pendientes por cobrar en este momento
                </p>
                <p className="text-[11px] text-charcoal-700/60">
                  Todas las mesas activas están al día o libres en salón.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {mesasConCuentaActiva.map((mesa) => {
                  const isSelected = selectedMesa?.id === mesa.id;
                  const pedido = mesa.pedidosActivos[0];
                  return (
                    <div
                      key={mesa.id}
                      onClick={() => setSelectedMesa(mesa)}
                      className={`cursor-pointer rounded-xl border p-4 transition-all ${
                        isSelected
                          ? 'border-sage-500 bg-sage-50/50 shadow-sm ring-1 ring-sage-500'
                          : 'border-sand-200 bg-white hover:border-sand-300 hover:shadow-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sand-100 font-bold text-sm text-charcoal-800">
                            #{mesa.numero}
                          </span>
                          <div>
                            <h4 className="text-xs font-semibold text-charcoal-900">
                              Mesa {mesa.numero}
                            </h4>
                            <p className="text-[11px] text-charcoal-700/60">
                              Capacidad: {mesa.capacidad} personas
                            </p>
                          </div>
                        </div>

                        <span className="rounded-full bg-amberPastel-100 px-2 py-0.5 text-[10px] font-semibold text-amberPastel-800">
                          {pedido ? pedido.estado : mesa.estado}
                        </span>
                      </div>

                      {pedido ? (
                        <div className="mt-3 border-t border-sand-100 pt-2.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-charcoal-700/70">Comanda #{pedido.id}</span>
                            <span className="font-bold text-sage-800">
                              S/ {Number(pedido.total).toFixed(2)}
                            </span>
                          </div>
                          <p className="mt-1 text-[11px] text-charcoal-700/60 truncate">
                            Atendido por: {pedido.usuario?.nombre || 'Mesero'} • {pedido.detalles?.length || 0} platos
                          </p>
                          <div className="mt-3 flex space-x-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedMesa(mesa);
                              }}
                              className="flex-1 rounded-md border border-sand-300 bg-white py-1.5 text-center text-xs font-medium text-charcoal-800 hover:bg-sand-50"
                            >
                              Ver Cuenta
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleIniciarCobro(mesa);
                              }}
                              className="flex-1 rounded-md bg-sage-700 py-1.5 text-center text-xs font-semibold text-white hover:bg-sage-800 shadow-xs transition-colors"
                            >
                              Cobrar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3 border-t border-sand-100 pt-2 text-[11px] text-charcoal-700/60">
                          Sin pedido registrado en sistema
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Panel Lateral: Detalle de Consumo */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 rounded-xl border border-sand-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-sand-200 pb-3">
                <div className="flex items-center space-x-2">
                  <Receipt className="h-4 w-4 text-sage-700" />
                  <h3 className="text-sm font-semibold text-charcoal-900">
                    Cuenta
                  </h3>
                </div>
                {selectedMesa && (
                  <span className="rounded-md bg-sand-100 px-2 py-0.5 text-xs font-bold text-charcoal-800">
                    Mesa #{selectedMesa.numero}
                  </span>
                )}
              </div>

              {pedidoActivoMesa ? (
                <div className="mt-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-charcoal-700/70 mb-2">
                      <span>Comanda #{pedidoActivoMesa.id}</span>
                      <span>
                        {new Date(pedidoActivoMesa.fechaCreacion).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {/* Desglose de Ítems */}
                    <div className="max-h-60 overflow-y-auto space-y-2 border-y border-sand-100 py-3">
                      {pedidoActivoMesa.detalles?.map((det, idx) => (
                        <div key={idx} className="flex justify-between text-xs">
                          <div className="pr-2">
                            <span className="font-medium text-charcoal-900">
                              {det.cantidad}x {det.plato?.nombre || 'Plato'}
                            </span>
                            {det.notasPersonalizadas && (
                              <p className="text-[10px] text-charcoal-700/60 italic">
                                Nota: {det.notasPersonalizadas}
                              </p>
                            )}
                          </div>
                          <span className="font-semibold text-charcoal-800 whitespace-nowrap">
                            S/ {(det.cantidad * Number(det.precioUnitario)).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Resumen Tributario */}
                    <div className="mt-3 space-y-1.5 text-xs text-charcoal-700">
                      <div className="flex justify-between">
                        <span>Base Imponible (Subtotal):</span>
                        <span>S/ {calculosPrecuenta.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>I.G.V. (18%):</span>
                        <span>S/ {calculosPrecuenta.igv.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between border-t border-sand-200 pt-2 text-sm font-bold text-charcoal-900">
                        <span>Total a Pagar:</span>
                        <span className="text-sage-700 font-extrabold">
                          S/ {calculosPrecuenta.total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="mt-6">
                    <button
                      onClick={() => handleIniciarCobro(selectedMesa!)}
                      className="w-full flex items-center justify-center space-x-2 rounded-xl bg-sage-700 hover:bg-sage-800 text-white px-4 py-2.5 text-xs font-semibold shadow-xs transition-colors"
                    >
                      <CreditCard className="h-4 w-4" />
                      <span>Cobrar Cuenta</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-charcoal-700/60">
                  Seleccione una mesa para ver su cuenta.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Arqueo de Caja */}
      {activeTab === 'arqueo' && (
        <div className="space-y-6">
          {/* Tarjetas de Arqueo Diario */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-sand-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-charcoal-700/70">Total Recaudado Hoy</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sage-50 text-sage-600">
                  <DollarSign className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-xl font-bold text-charcoal-900">
                S/ {resumenDiario ? resumenDiario.totalRecaudado.toFixed(2) : '0.00'}
              </p>
              <p className="text-[11px] text-charcoal-700/60 mt-1">
                {resumenDiario?.totalComprobantes || 0} comprobantes emitidos
              </p>
            </div>

            <div className="rounded-xl border border-sand-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-charcoal-700/70">Efectivo en Caja</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sand-100 text-charcoal-700">
                  <Banknote className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-xl font-bold text-charcoal-900">
                S/ {resumenDiario?.desgloseMetodos?.EFECTIVO ? resumenDiario.desgloseMetodos.EFECTIVO.toFixed(2) : '0.00'}
              </p>
              <p className="text-[11px] text-charcoal-700/60 mt-1">
                Efectivo neto para arqueo físico
              </p>
            </div>

            <div className="rounded-xl border border-sand-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-charcoal-700/70">Pagos Digitales (POS / QR)</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amberPastel-50 text-amberPastel-700">
                  <CreditCard className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-xl font-bold text-charcoal-900">
                S/{' '}
                {(
                  (resumenDiario?.desgloseMetodos?.TARJETA || 0) +
                  (resumenDiario?.desgloseMetodos?.YAPE || 0) +
                  (resumenDiario?.desgloseMetodos?.PLIN || 0)
                ).toFixed(2)}
              </p>
              <p className="text-[11px] text-charcoal-700/60 mt-1">
                POS: S/ {resumenDiario?.desgloseMetodos?.TARJETA || 0} • Yape/Plin: S/{' '}
                {(resumenDiario?.desgloseMetodos?.YAPE || 0) + (resumenDiario?.desgloseMetodos?.PLIN || 0)}
              </p>
            </div>

            <div className="rounded-xl border border-sand-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-charcoal-700/70">Boletas vs Facturas</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sand-100 text-charcoal-700">
                  <FileText className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-xl font-bold text-charcoal-900">
                {resumenDiario?.totalBoletas || 0} B / {resumenDiario?.totalFacturas || 0} F
              </p>
              <p className="text-[11px] text-charcoal-700/60 mt-1">
                Series B001 y F001 activas
              </p>
            </div>
          </div>

          {/* Tabla de Comprobantes Emitidos */}
          <div className="rounded-xl border border-sand-200 bg-white shadow-xs overflow-hidden">
            <div className="flex items-center justify-between border-b border-sand-200 px-5 py-3.5">
              <h3 className="text-xs font-semibold text-charcoal-900">
                Registro de Comprobantes Emitidos (Libro de Ventas Diario)
              </h3>
              <span className="text-[11px] text-charcoal-700/60">
                Total registros: {comprobantes.length}
              </span>
            </div>

            {loadingData ? (
              <div className="p-8 text-center text-xs text-charcoal-700/60">
                Cargando comprobantes...
              </div>
            ) : comprobantes.length === 0 ? (
              <div className="p-8 text-center text-xs text-charcoal-700/60">
                No se han emitido comprobantes aún. Realice el cobro de una mesa para generar la primera boleta o factura.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-sand-50/70 border-b border-sand-200 text-charcoal-700/80 font-medium">
                    <tr>
                      <th className="px-4 py-2.5">Comprobante</th>
                      <th className="px-4 py-2.5">Cliente</th>
                      <th className="px-4 py-2.5">Mesa / Comanda</th>
                      <th className="px-4 py-2.5">Medio de Pago</th>
                      <th className="px-4 py-2.5">Subtotal</th>
                      <th className="px-4 py-2.5">IGV (18%)</th>
                      <th className="px-4 py-2.5">Total</th>
                      <th className="px-4 py-2.5">Fecha / Hora</th>
                      <th className="px-4 py-2.5 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sand-100">
                    {comprobantes.map((c) => (
                      <tr key={c.id} className="hover:bg-sand-50/50">
                        <td className="px-4 py-3 font-semibold text-charcoal-900 whitespace-nowrap">
                          {c.serie}-{String(c.numeroCorrelativo).padStart(6, '0')}
                          <span
                            className={`ml-2 inline-block rounded px-1.5 py-0.5 text-[10px] font-bold ${
                              c.tipo === 'FACTURA'
                                ? 'bg-amberPastel-100 text-amberPastel-800'
                                : 'bg-sage-100 text-sage-800'
                            }`}
                          >
                            {c.tipo}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-charcoal-800">
                          <div>{c.clienteNombre || 'Clientes Varios'}</div>
                          {c.clienteDocumento && (
                            <div className="text-[10px] text-charcoal-700/60">
                              Doc: {c.clienteDocumento}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-charcoal-700 whitespace-nowrap">
                          Mesa #{c.pedido?.mesa?.numero || '-'} (Ped #{c.pedidoId})
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {c.pagos?.map((p, idx) => (
                            <span
                              key={idx}
                              className="inline-block rounded bg-sand-100 px-2 py-0.5 text-[10px] font-medium text-charcoal-800 mr-1"
                            >
                              {p.metodoPago} (S/ {Number(p.monto).toFixed(2)})
                            </span>
                          ))}
                        </td>
                        <td className="px-4 py-3 text-charcoal-700">
                          S/ {Number(c.subtotal).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-charcoal-700">
                          S/ {Number(c.igv).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 font-bold text-sage-800 whitespace-nowrap">
                          S/ {Number(c.total).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-charcoal-700/70 whitespace-nowrap">
                          {new Date(c.fechaEmision).toLocaleString([], {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <button
                            onClick={() => setTicketParaVer(c)}
                            className="inline-flex items-center space-x-1 rounded-md border border-sand-300 bg-white px-2.5 py-1 text-[11px] font-medium text-charcoal-800 hover:bg-sand-50"
                          >
                            <Printer className="h-3 w-3 text-charcoal-600" />
                            <span>Ver Ticket</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {showCobroModal && selectedMesa && pedidoActivoMesa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal-900/40 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-sand-200/60 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center space-x-2 text-xs font-medium text-charcoal-700/70">
                <span className="font-semibold text-charcoal-900">Mesa #{selectedMesa.numero}</span>
                <span>·</span>
                <span>Comanda #{pedidoActivoMesa.id}</span>
                <span>·</span>
                <span>{pedidoActivoMesa.detalles?.length || 0} ítems</span>
              </div>
              <button
                type="button"
                onClick={() => setShowCobroModal(false)}
                className="rounded-lg p-1 text-charcoal-500 hover:text-charcoal-800 hover:bg-sand-100 transition-colors"
                title="Cerrar (Esc)"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="text-center py-4">
              <span className="text-[10px] font-semibold text-charcoal-700/50 uppercase tracking-wider">
                Monto Total a Cobrar
              </span>
              <div className="mt-0.5 text-4xl sm:text-5xl font-semibold tracking-tight text-charcoal-900">
                <span className="text-2xl font-normal text-charcoal-700/40 mr-1">S/</span>
                {Number(pedidoActivoMesa.total).toFixed(2)}
              </div>
              <div className="mt-1 text-[11px] text-charcoal-700/60 font-medium">
                Base S/ {calculosPrecuenta.subtotal.toFixed(2)} · IGV (18%) S/ {calculosPrecuenta.igv.toFixed(2)}
              </div>
            </div>

            <form onSubmit={handleConfirmarCobro} className="space-y-4">
              <div className="space-y-2">
                <div className="grid grid-cols-2 p-1 rounded-xl bg-sand-100 text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => {
                      setTipoComprobante('BOLETA');
                      setMostrarCamposCliente(false);
                    }}
                    className={`py-1.5 rounded-lg text-center transition-all ${
                      tipoComprobante === 'BOLETA'
                        ? 'bg-white text-charcoal-900 font-semibold shadow-xs'
                        : 'text-charcoal-700/70 hover:text-charcoal-900'
                    }`}
                  >
                    Boleta de Venta
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTipoComprobante('FACTURA');
                      setMostrarCamposCliente(true);
                    }}
                    className={`py-1.5 rounded-lg text-center transition-all ${
                      tipoComprobante === 'FACTURA'
                        ? 'bg-white text-charcoal-900 font-semibold shadow-xs'
                        : 'text-charcoal-700/70 hover:text-charcoal-900'
                    }`}
                  >
                    Factura Electrónica
                  </button>
                </div>

                {tipoComprobante === 'FACTURA' ? (
                  <div className="space-y-2 pt-1 animate-in fade-in duration-150">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-medium text-charcoal-700 mb-1">
                          RUC (11 dígitos) *
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={11}
                          value={clienteDocumento}
                          onChange={(e) => setClienteDocumento(e.target.value)}
                          placeholder="20601234567"
                          className="w-full rounded-lg border border-sand-300 px-3 py-1.5 text-xs text-charcoal-900 focus:border-sage-600 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-charcoal-700 mb-1">
                          Razón Social *
                        </label>
                        <input
                          type="text"
                          required
                          value={clienteNombre}
                          onChange={(e) => setClienteNombre(e.target.value)}
                          placeholder="Empresa SAC"
                          className="w-full rounded-lg border border-sand-300 px-3 py-1.5 text-xs text-charcoal-900 focus:border-sage-600 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    {!mostrarCamposCliente ? (
                      <button
                        type="button"
                        onClick={() => setMostrarCamposCliente(true)}
                        className="text-[11px] text-sage-700 hover:text-sage-800 font-medium transition-colors"
                      >
                        + Agregar DNI o Nombre (opcional)
                      </button>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 pt-1 animate-in fade-in duration-150">
                        <div>
                          <label className="block text-[10px] font-medium text-charcoal-700/70 mb-0.5">
                            DNI Cliente
                          </label>
                          <input
                            type="text"
                            maxLength={8}
                            value={clienteDocumento}
                            onChange={(e) => setClienteDocumento(e.target.value)}
                            placeholder="72819201"
                            className="w-full rounded-lg border border-sand-300 px-3 py-1 text-xs text-charcoal-900 focus:border-sage-600 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-charcoal-700/70 mb-0.5">
                            Nombre
                          </label>
                          <input
                            type="text"
                            value={clienteNombre}
                            onChange={(e) => setClienteNombre(e.target.value)}
                            placeholder="Clientes Varios"
                            className="w-full rounded-lg border border-sand-300 px-3 py-1 text-xs text-charcoal-900 focus:border-sage-600 focus:outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="grid grid-cols-4 p-1 rounded-xl bg-sand-100 text-xs font-medium">
                  {(['EFECTIVO', 'TARJETA', 'YAPE', 'PLIN'] as MetodoPago[]).map((metodo) => (
                    <button
                      key={metodo}
                      type="button"
                      onClick={() => setMetodoPago(metodo)}
                      className={`py-1.5 flex items-center justify-center space-x-1 rounded-lg transition-all ${
                        metodoPago === metodo
                          ? 'bg-white text-charcoal-900 font-semibold shadow-xs'
                          : 'text-charcoal-700/70 hover:text-charcoal-900'
                      }`}
                    >
                      {metodo === 'EFECTIVO' && <Banknote className="h-3.5 w-3.5" />}
                      {metodo === 'TARJETA' && <CreditCard className="h-3.5 w-3.5" />}
                      {(metodo === 'YAPE' || metodo === 'PLIN') && <QrCode className="h-3.5 w-3.5" />}
                      <span>{metodo === 'TARJETA' ? 'POS' : metodo}</span>
                    </button>
                  ))}
                </div>

                {metodoPago === 'EFECTIVO' ? (
                  <div className="space-y-3 pt-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] text-charcoal-700/60 font-medium mr-1">Rápido:</span>
                      {quickCashOptions.map((opt, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setMontoRecibido(String(opt.toFixed(2)))}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                            parseFloat(montoRecibido) === opt
                              ? 'border-sage-600 bg-sage-50 text-sage-800 font-semibold ring-1 ring-sage-600'
                              : 'border-sand-200 bg-white text-charcoal-800 hover:bg-sand-50'
                          }`}
                        >
                          {opt === Number(pedidoActivoMesa.total) ? `Exacto S/ ${opt.toFixed(2)}` : `S/ ${opt.toFixed(2)}`}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-sand-50 border border-sand-200/80">
                      <div className="flex-1">
                        <label className="block text-[10px] font-semibold text-charcoal-700/70 uppercase">
                          Dinero Recibido
                        </label>
                        <div className="relative mt-0.5 flex items-center">
                          <span className="absolute left-2.5 text-xs text-charcoal-700/50 font-bold">S/</span>
                          <input
                            type="number"
                            step="0.10"
                            value={montoRecibido}
                            onChange={(e) => setMontoRecibido(e.target.value)}
                            placeholder="0.00"
                            required
                            className="w-full rounded-lg border border-sand-300 bg-white pl-7 pr-3 py-1.5 text-sm font-semibold text-charcoal-900 focus:border-sage-600 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="block text-[10px] font-semibold text-charcoal-700/70 uppercase">
                          Vuelto
                        </span>
                        <div
                          className={`mt-1 text-lg font-bold tracking-tight ${
                            vueltoCalculado > 0 ? 'text-sage-700' : 'text-charcoal-700/60'
                          }`}
                        >
                          S/ {vueltoCalculado.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="pt-1">
                    <label className="block text-[11px] font-medium text-charcoal-700 mb-1">
                      {metodoPago === 'TARJETA'
                        ? 'Nº de Operación / Voucher POS (Opcional)'
                        : 'Código de Operación Yape / Plin (Opcional)'}
                    </label>
                    <input
                      type="text"
                      value={referenciaPago}
                      onChange={(e) => setReferenciaPago(e.target.value)}
                      placeholder={metodoPago === 'TARJETA' ? 'Ej. OP-48192' : 'Ej. 091823'}
                      className="w-full rounded-lg border border-sand-300 px-3 py-1.5 text-xs text-charcoal-900 focus:border-sage-600 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="pt-2 space-y-1.5">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 flex items-center justify-center space-x-2 rounded-xl bg-sage-700 hover:bg-sage-800 text-white font-semibold text-xs shadow-sm transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Procesando cobro...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Cobrar S/ {Number(pedidoActivoMesa.total).toFixed(2)} y Liberar Mesa</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCobroModal(false)}
                  className="w-full py-1 text-center text-xs font-medium text-charcoal-700/60 hover:text-charcoal-900 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {ticketParaVer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-sand-200 font-mono text-xs">
            <div className="text-center border-b border-dashed border-sand-300 pb-3">
              <h2 className="font-bold text-sm tracking-tight text-charcoal-900">
                LA BODEGA VERDE
              </h2>
              <p className="text-[10px] text-charcoal-700/80">RUC: 20518934121</p>
              <p className="text-[10px] text-charcoal-700/80">Jr. Sucre 335A, Barranco - Lima</p>
              <div className="mt-2 inline-block rounded border border-sand-300 bg-sand-50 px-2 py-0.5 text-[10px] font-bold">
                {ticketParaVer.tipo} ELECTRÓNICA
              </div>
              <p className="mt-1 font-bold text-charcoal-900">
                {ticketParaVer.serie}-{String(ticketParaVer.numeroCorrelativo).padStart(6, '0')}
              </p>
            </div>

            <div className="py-2.5 border-b border-dashed border-sand-300 space-y-1 text-[11px] text-charcoal-800">
              <p>Fecha: {new Date(ticketParaVer.fechaEmision).toLocaleString()}</p>
              <p>Cliente: {ticketParaVer.clienteNombre || 'Clientes Varios'}</p>
              {ticketParaVer.clienteDocumento && <p>Doc: {ticketParaVer.clienteDocumento}</p>}
              <p>Mesa: #{ticketParaVer.pedido?.mesa?.numero || selectedMesa?.numero || '-'}</p>
            </div>

            {/* Ítems del Pedido */}
            <div className="py-2.5 border-b border-dashed border-sand-300 space-y-1.5 text-[11px]">
              {ticketParaVer.pedido?.detalles?.map((det, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>
                    {det.cantidad}x {det.plato?.nombre || 'Ítem'}
                  </span>
                  <span>S/ {(det.cantidad * Number(det.precioUnitario)).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Totales */}
            <div className="py-2.5 border-b border-dashed border-sand-300 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>OP. GRAVADA:</span>
                <span>S/ {Number(ticketParaVer.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>I.G.V. (18%):</span>
                <span>S/ {Number(ticketParaVer.igv).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-xs pt-1">
                <span>IMPORTE TOTAL:</span>
                <span>S/ {Number(ticketParaVer.total).toFixed(2)}</span>
              </div>
            </div>

            {/* Detalle del Pago */}
            <div className="py-2.5 text-[10px] text-charcoal-700 space-y-0.5">
              {ticketParaVer.pagos?.map((p, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>FORMA DE PAGO: {p.metodoPago}</span>
                  <span>S/ {Number(p.monto).toFixed(2)}</span>
                </div>
              ))}
              {ticketParaVer.pagos?.[0]?.vuelto && (
                <div className="flex justify-between text-sage-800 font-bold">
                  <span>VUELTO:</span>
                  <span>S/ {Number(ticketParaVer.pagos[0].vuelto).toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="mt-4 border-t border-dashed border-sand-300 pt-3 text-center text-[10px] text-charcoal-700/70">
              <p>¡Gracias por su visita a La Bodega Verde!</p>
              <p>Representación impresa de comprobante electrónico</p>
            </div>

            <div className="mt-4 flex space-x-2">
              <button
                onClick={() => window.print()}
                className="flex-1 flex items-center justify-center space-x-1 rounded-lg border border-sand-300 bg-sand-50 py-1.5 text-xs font-medium text-charcoal-800 hover:bg-sand-100"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Imprimir</span>
              </button>
              <button
                onClick={() => setTicketParaVer(null)}
                className="flex-1 rounded-lg bg-sage-600 py-1.5 text-xs font-semibold text-white hover:bg-sage-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
