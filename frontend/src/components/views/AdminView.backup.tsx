'use client';

import React, { useState } from 'react';
import { Insumo, LoteInsumo, KardexMovimiento, UnidadMedida } from '@/types';
import {
  AlertTriangle,
  Clock,
  TrendingDown,
  Plus,
  FileText,
  PackagePlus,
  ArrowUpCircle,
  X,
  CheckCircle2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { soundManager } from '@/lib/audio';

interface AdminViewProps {
  insumos: Insumo[];
  alertasStock: Insumo[];
  alertasVencer: LoteInsumo[];
  kardex: KardexMovimiento[];
  onRefreshData: () => void;
  showToast: (msg: string, type?: 'success' | 'alert' | 'error') => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  insumos,
  alertasStock,
  alertasVencer,
  kardex,
  onRefreshData,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'insumos' | 'alertas' | 'kardex'>('insumos');

  // Modal: Registrar Merma
  const [showMermaModal, setShowMermaModal] = useState(false);
  const [mermaInsumoId, setMermaInsumoId] = useState<number>(insumos[0]?.id || 1);
  const [mermaCantidad, setMermaCantidad] = useState('');
  const [mermaMotivo, setMermaMotivo] = useState('');

  // Modal: Ingresar Stock / Reabastecer
  const [showIngresoModal, setShowIngresoModal] = useState(false);
  const [ingresoInsumoId, setIngresoInsumoId] = useState<number>(insumos[0]?.id || 1);
  const [ingresoCantidad, setIngresoCantidad] = useState('');
  const [ingresoMotivo, setIngresoMotivo] = useState('Compra a proveedor local');

  // Modal: Crear Nuevo Insumo
  const [showNuevoInsumoModal, setShowNuevoInsumoModal] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoUnidad, setNuevoUnidad] = useState<UnidadMedida>('KG');
  const [nuevoStockActual, setNuevoStockActual] = useState('');
  const [nuevoStockMinimo, setNuevoStockMinimo] = useState('');
  const [nuevoCosto, setNuevoCosto] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Manejo de Registro de Merma
  const handleRegistrarMerma = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mermaCantidad || Number(mermaCantidad) <= 0) {
      showToast('Ingrese una cantidad válida mayor a cero', 'alert');
      return;
    }
    if (!mermaMotivo.trim()) {
      showToast('El motivo de la merma es obligatorio', 'alert');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.registrarMerma(mermaInsumoId, {
        cantidad: parseFloat(mermaCantidad),
        motivo: mermaMotivo.trim(),
        usuarioId: 1,
      });

      soundManager.playActionComplete();
      showToast('Merma registrada y descontada del inventario', 'success');
      setShowMermaModal(false);
      setMermaCantidad('');
      setMermaMotivo('');
      onRefreshData();
    } catch (err: any) {
      showToast(err.message || 'Error al registrar merma', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Manejo de Ingreso / Reabastecimiento de Stock
  const handleIngresarStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingresoCantidad || Number(ingresoCantidad) <= 0) {
      showToast('Ingrese una cantidad válida a ingresar', 'alert');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.ajustarStock(ingresoInsumoId, {
        cantidad: parseFloat(ingresoCantidad),
        motivo: ingresoMotivo.trim() || 'Ingreso de mercadería / compra',
        usuarioId: 1,
      });

      soundManager.playActionComplete();
      showToast(`Stock reabastecido (+${ingresoCantidad}) correctamente`, 'success');
      setShowIngresoModal(false);
      setIngresoCantidad('');
      setIngresoMotivo('Compra a proveedor local');
      onRefreshData();
    } catch (err: any) {
      showToast(err.message || 'Error al reabastecer stock', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Manejo de Creación de Nuevo Insumo
  const handleCrearInsumo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre.trim()) {
      showToast('El nombre del insumo es obligatorio', 'alert');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.crearInsumo({
        nombre: nuevoNombre.trim(),
        unidadMedida: nuevoUnidad,
        stockActual: parseFloat(nuevoStockActual) || 0,
        stockMinimo: parseFloat(nuevoStockMinimo) || 1,
        costoPromedio: parseFloat(nuevoCosto) || 0,
      });

      soundManager.playActionComplete();
      showToast(`Insumo "${nuevoNombre}" registrado en el catálogo`, 'success');
      setShowNuevoInsumoModal(false);
      setNuevoNombre('');
      setNuevoStockActual('');
      setNuevoStockMinimo('');
      setNuevoCosto('');
      onRefreshData();
    } catch (err: any) {
      showToast(err.message || 'Error al registrar nuevo insumo', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Abrir modal de reabastecimiento para un insumo específico
  const openReabastecerInsumo = (insumoId: number) => {
    setIngresoInsumoId(insumoId);
    setShowIngresoModal(true);
  };

  // Abrir modal de merma para un insumo específico
  const openMermaInsumo = (insumoId: number) => {
    setMermaInsumoId(insumoId);
    setShowMermaModal(true);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      {/* 1. Tarjetas de Resumen de Inventario */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4 mb-6">
        <div className="rounded-xl border border-sand-200 bg-white p-4">
          <span className="text-xs font-medium text-charcoal-700/70">Total Insumos</span>
          <p className="mt-1 text-xl font-bold text-charcoal-900">{insumos.length}</p>
          <span className="text-[11px] text-charcoal-700/50 mt-1 block">Catálogo activo</span>
        </div>

        <div className="rounded-xl border border-amberPastel-200/80 bg-amberPastel-50/40 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amberPastel-700">Stock Mínimo</span>
            <AlertTriangle className="h-4 w-4 text-amberPastel-600" />
          </div>
          <p className="mt-1 text-xl font-bold text-amberPastel-700">{alertasStock.length}</p>
          <span className="text-[11px] text-amberPastel-700/70 mt-1 block">Requieren reposición</span>
        </div>

        <div className="rounded-xl border border-terracotta-100 bg-terracotta-50/40 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-terracotta-600">Por Vencer (7 días)</span>
            <Clock className="h-4 w-4 text-terracotta-500" />
          </div>
          <p className="mt-1 text-xl font-bold text-terracotta-600">{alertasVencer.length}</p>
          <span className="text-[11px] text-terracotta-600/70 mt-1 block">Control preventivo</span>
        </div>

        <div className="rounded-xl border border-sand-200 bg-white p-4">
          <span className="text-xs font-medium text-charcoal-700/70">Kárdex Registrado</span>
          <p className="mt-1 text-xl font-bold text-charcoal-900">{kardex.length}</p>
          <span className="text-[11px] text-charcoal-700/50 mt-1 block">Movimientos auditados</span>
        </div>
      </div>

      {/* 2. Pestañas de Navegación y Botones de Acción */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-3 border-b border-sand-200 mb-5 gap-3">
        {/* Pestañas de Vista */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 lg:pb-0">
          <button
            onClick={() => setActiveTab('insumos')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap btn-action ${
              activeTab === 'insumos'
                ? 'bg-sage-500 text-white shadow-xs'
                : 'bg-sand-100 text-charcoal-700 hover:bg-sand-200'
            }`}
          >
            Insumos & Existencias
          </button>
          <button
            onClick={() => setActiveTab('alertas')}
            className={`flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap btn-action ${
              activeTab === 'alertas'
                ? 'bg-sage-500 text-white shadow-xs'
                : 'bg-sand-100 text-charcoal-700 hover:bg-sand-200'
            }`}
          >
            <span>Alertas de Control</span>
            {alertasStock.length + alertasVencer.length > 0 && (
              <span className="rounded-full bg-white/20 px-1.5 py-0.2 text-[10px] font-bold">
                {alertasStock.length + alertasVencer.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('kardex')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap btn-action ${
              activeTab === 'kardex'
                ? 'bg-sage-500 text-white shadow-xs'
                : 'bg-sand-100 text-charcoal-700 hover:bg-sand-200'
            }`}
          >
            Kárdex en Tiempo Real
          </button>
        </div>

        {/* Grupo de Acciones de Inventario: Ingreso de Stock, Nuevo Insumo, Registrar Merma */}
        <div className="flex flex-wrap items-center gap-2">
          {/* 1. Botón Ingresar Stock / Reabastecer */}
          <button
            onClick={() => {
              if (insumos.length > 0) setIngresoInsumoId(insumos[0].id);
              setShowIngresoModal(true);
            }}
            className="flex items-center space-x-1.5 rounded-lg bg-sage-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-sage-600 shadow-xs btn-action"
          >
            <ArrowUpCircle className="h-3.5 w-3.5" />
            <span>Ingresar Stock / Reabastecer</span>
          </button>

          {/* 2. Botón Nuevo Insumo */}
          <button
            onClick={() => setShowNuevoInsumoModal(true)}
            className="flex items-center space-x-1.5 rounded-lg border border-sand-300 bg-white px-3 py-1.5 text-xs font-medium text-charcoal-800 hover:bg-sand-50 shadow-2xs btn-action"
          >
            <PackagePlus className="h-3.5 w-3.5 text-sage-600" />
            <span>Nuevo Insumo</span>
          </button>

          {/* 3. Botón Registrar Merma / Pérdida */}
          <button
            onClick={() => {
              if (insumos.length > 0) setMermaInsumoId(insumos[0].id);
              setShowMermaModal(true);
            }}
            className="flex items-center space-x-1.5 rounded-lg border border-terracotta-200 bg-terracotta-50 px-3 py-1.5 text-xs font-medium text-terracotta-700 hover:bg-terracotta-100 btn-action"
          >
            <TrendingDown className="h-3.5 w-3.5" />
            <span>Registrar Merma / Pérdida</span>
          </button>
        </div>
      </div>

      {/* 3. Contenido de las pestañas */}

      {/* PESTAÑA 1: Insumos & Existencias con Acciones por Fila */}
      {activeTab === 'insumos' && (
        <div className="overflow-hidden rounded-xl border border-sand-200 bg-white shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-sand-50/70 border-b border-sand-200 text-charcoal-700 font-semibold">
                <tr>
                  <th className="px-4 py-3">Insumo</th>
                  <th className="px-4 py-3">Unidad</th>
                  <th className="px-4 py-3">Stock Actual</th>
                  <th className="px-4 py-3">Stock Mínimo</th>
                  <th className="px-4 py-3">Costo Promedio</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones Rápidas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-100 text-charcoal-800">
                {insumos.map((ins) => {
                  const stockNum = Number(ins.stockActual);
                  const minNum = Number(ins.stockMinimo);
                  const isCritico = stockNum <= minNum;

                  return (
                    <tr key={ins.id} className="hover:bg-sand-50/40 transition-colors">
                      <td className="px-4 py-3 font-medium text-charcoal-900">{ins.nombre}</td>
                      <td className="px-4 py-3 text-charcoal-700/70">{ins.unidadMedida}</td>
                      <td className="px-4 py-3 font-semibold">{stockNum.toFixed(3)}</td>
                      <td className="px-4 py-3 text-charcoal-700/70">{minNum.toFixed(3)}</td>
                      <td className="px-4 py-3 text-charcoal-700/70">
                        S/ {Number(ins.costoPromedio).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-medium ${
                            isCritico
                              ? 'bg-amberPastel-100 text-amberPastel-700'
                              : 'bg-sage-100 text-sage-700'
                          }`}
                        >
                          {isCritico ? 'Stock bajo' : 'Normal'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => openReabastecerInsumo(ins.id)}
                            title="Reabastecer stock de este insumo"
                            className="rounded border border-sage-200 bg-sage-50 px-2 py-1 text-[11px] font-medium text-sage-700 hover:bg-sage-100 btn-action"
                          >
                            + Stock
                          </button>
                          <button
                            onClick={() => openMermaInsumo(ins.id)}
                            title="Registrar merma de este insumo"
                            className="rounded border border-terracotta-200 bg-terracotta-50 px-2 py-1 text-[11px] font-medium text-terracotta-700 hover:bg-terracotta-100 btn-action"
                          >
                            - Merma
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PESTAÑA 2: Alertas de Control */}
      {activeTab === 'alertas' && (
        <div className="space-y-6">
          {/* Alertas de Stock Mínimo */}
          <div className="rounded-xl border border-sand-200 bg-white p-5 shadow-2xs">
            <h3 className="text-xs font-semibold text-charcoal-900 mb-1">
              Insumos con Stock Mínimo Crítico
            </h3>
            <p className="text-[11px] text-charcoal-700/60 mb-3">
              Materia prima por debajo del umbral de seguridad. Pulse en reabastecer para añadir existencias.
            </p>

            {alertasStock.length === 0 ? (
              <p className="text-xs text-sage-600 font-medium py-2">
                Todos los insumos superan el umbral de stock mínimo
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {alertasStock.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border border-amberPastel-200 bg-amberPastel-50/40 p-3"
                  >
                    <div>
                      <span className="text-xs font-semibold text-charcoal-900 block">
                        {item.nombre}
                      </span>
                      <span className="text-[11px] text-charcoal-700/70">
                        Disponible: {Number(item.stockActual).toFixed(3)} {item.unidadMedida} (Mínimo:{' '}
                        {Number(item.stockMinimo).toFixed(3)})
                      </span>
                    </div>
                    <button
                      onClick={() => openReabastecerInsumo(item.id)}
                      className="rounded bg-amberPastel-200 px-2.5 py-1 text-xs font-semibold text-amberPastel-800 hover:bg-amberPastel-300 btn-action shadow-2xs"
                    >
                      Reabastecer
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Alertas de Insumos Próximos a Vencer */}
          <div className="rounded-xl border border-sand-200 bg-white p-5 shadow-2xs">
            <h3 className="text-xs font-semibold text-charcoal-900 mb-1">
              Control Preventivo de Caducidad
            </h3>
            <p className="text-[11px] text-charcoal-700/60 mb-3">
              Lotes activos con fecha de vencimiento dentro de los próximos 7 días (Regla FEFO)
            </p>

            {alertasVencer.length === 0 ? (
              <p className="text-xs text-sage-600 font-medium py-2">
                No hay insumos perecibles próximos a caducar en los próximos 7 días
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {alertasVencer.map((lote) => {
                  const fecha = new Date(lote.fechaCaducidad).toLocaleDateString('es-PE');
                  return (
                    <div
                      key={lote.id}
                      className="flex items-center justify-between rounded-lg border border-terracotta-100 bg-terracotta-50/40 p-3"
                    >
                      <div>
                        <span className="text-xs font-semibold text-charcoal-900 block">
                          {lote.insumo?.nombre || 'Insumo'}
                        </span>
                        <span className="text-[11px] text-charcoal-700/70">
                          Lote: {lote.codigoLote} | Remanente: {Number(lote.cantidadDisponible).toFixed(2)}{' '}
                          {lote.insumo?.unidadMedida}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-terracotta-600 font-medium block">
                          Vence: {fecha}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* PESTAÑA 3: Kárdex en Tiempo Real */}
      {activeTab === 'kardex' && (
        <div className="overflow-hidden rounded-xl border border-sand-200 bg-white shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-sand-50/70 border-b border-sand-200 text-charcoal-700 font-semibold">
                <tr>
                  <th className="px-4 py-3">Fecha y Hora</th>
                  <th className="px-4 py-3">Insumo</th>
                  <th className="px-4 py-3">Tipo Movimiento</th>
                  <th className="px-4 py-3">Cantidad</th>
                  <th className="px-4 py-3">Saldo Resultante</th>
                  <th className="px-4 py-3">Motivo / Justificación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-100 text-charcoal-800">
                {kardex.map((mov) => {
                  const fecha = new Date(mov.fechaRegistro).toLocaleString('es-PE', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  const isSalida = mov.tipoMovimiento === 'SALIDA_VENTA';
                  const isMerma = mov.tipoMovimiento === 'MERMA';
                  const isEntrada =
                    mov.tipoMovimiento === 'ENTRADA_COMPRA' ||
                    mov.tipoMovimiento === 'AJUSTE_FISICO';

                  return (
                    <tr key={mov.id} className="hover:bg-sand-50/40 transition-colors">
                      <td className="px-4 py-2.5 text-charcoal-700/70 whitespace-nowrap">{fecha}</td>
                      <td className="px-4 py-2.5 font-medium text-charcoal-900">
                        {mov.insumo?.nombre || `#${mov.insumoId}`}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`inline-block rounded px-2 py-0.5 text-[10px] font-medium ${
                            isSalida
                              ? 'bg-sand-100 text-charcoal-700'
                              : isMerma
                              ? 'bg-terracotta-100 text-terracotta-700'
                              : 'bg-sage-100 text-sage-700'
                          }`}
                        >
                          {mov.tipoMovimiento.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-semibold">
                        {isSalida || isMerma ? '-' : '+'}
                        {Number(mov.cantidad).toFixed(3)}
                      </td>
                      <td className="px-4 py-2.5 text-charcoal-700/80">
                        {Number(mov.stockResultante).toFixed(3)}
                      </td>
                      <td className="px-4 py-2.5 text-charcoal-700/80 max-w-xs truncate">
                        {mov.motivo}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Modal: Ingresar Stock / Reabastecer */}
      {showIngresoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal-900/30 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl border border-sand-200 bg-white p-5 shadow-lg animate-feedback">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-charcoal-900">
                Ingreso de Stock / Reabastecimiento
              </h3>
              <button
                onClick={() => setShowIngresoModal(false)}
                className="text-charcoal-700/50 hover:text-charcoal-900 btn-action"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-charcoal-700/60 mb-4">
              Suma existencias al almacén y registra el movimiento de entrada en el Kárdex
            </p>

            <form onSubmit={handleIngresarStock} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-charcoal-700 mb-1">
                  Insumo a reabastecer
                </label>
                <select
                  value={ingresoInsumoId}
                  onChange={(e) => setIngresoInsumoId(Number(e.target.value))}
                  className="w-full rounded-lg border border-sand-200 bg-white px-3 py-2 text-xs text-charcoal-900 focus:border-sage-500 focus:outline-none"
                >
                  {insumos.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.nombre} ({i.unidadMedida}) — Stock actual: {Number(i.stockActual).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-charcoal-700 mb-1">
                  Cantidad a ingresar
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  required
                  value={ingresoCantidad}
                  onChange={(e) => setIngresoCantidad(e.target.value)}
                  placeholder="ej. 5.000"
                  className="w-full rounded-lg border border-sand-200 px-3 py-2 text-xs text-charcoal-900 focus:border-sage-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-charcoal-700 mb-1">
                  Motivo o justificación del ingreso
                </label>
                <input
                  type="text"
                  required
                  value={ingresoMotivo}
                  onChange={(e) => setIngresoMotivo(e.target.value)}
                  placeholder="ej. Compra a proveedor Chanchamayo..."
                  className="w-full rounded-lg border border-sand-200 px-3 py-2 text-xs text-charcoal-900 focus:border-sage-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-sand-100">
                <button
                  type="button"
                  onClick={() => setShowIngresoModal(false)}
                  className="rounded-lg border border-sand-200 px-3 py-1.5 text-xs font-medium text-charcoal-700 hover:bg-sand-50 btn-action"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-sage-500 px-4 py-1.5 text-xs font-medium text-white hover:bg-sage-600 disabled:opacity-50 btn-action shadow-xs"
                >
                  {isSubmitting ? 'Guardando...' : 'Confirmar Ingreso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Modal: Crear Nuevo Insumo */}
      {showNuevoInsumoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal-900/30 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl border border-sand-200 bg-white p-5 shadow-lg animate-feedback">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-charcoal-900">
                Crear Nuevo Insumo
              </h3>
              <button
                onClick={() => setShowNuevoInsumoModal(false)}
                className="text-charcoal-700/50 hover:text-charcoal-900 btn-action"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-charcoal-700/60 mb-4">
              Añade una nueva materia prima al catálogo para usar en recetas y control de stock
            </p>

            <form onSubmit={handleCrearInsumo} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-charcoal-700 mb-1">
                  Nombre del insumo
                </label>
                <input
                  type="text"
                  required
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  placeholder="ej. Menta Fresca Orgánica"
                  className="w-full rounded-lg border border-sand-200 px-3 py-2 text-xs text-charcoal-900 focus:border-sage-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-charcoal-700 mb-1">
                    Unidad de Medida
                  </label>
                  <select
                    value={nuevoUnidad}
                    onChange={(e) => setNuevoUnidad(e.target.value as UnidadMedida)}
                    className="w-full rounded-lg border border-sand-200 bg-white px-3 py-2 text-xs text-charcoal-900 focus:border-sage-500 focus:outline-none"
                  >
                    <option value="KG">Kilogramo (KG)</option>
                    <option value="LITRO">Litro (LITRO)</option>
                    <option value="UNIDAD">Unidad (UNIDAD)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-charcoal-700 mb-1">
                    Costo Promedio (S/)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={nuevoCosto}
                    onChange={(e) => setNuevoCosto(e.target.value)}
                    placeholder="ej. 8.50"
                    className="w-full rounded-lg border border-sand-200 px-3 py-2 text-xs text-charcoal-900 focus:border-sage-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-charcoal-700 mb-1">
                    Stock Inicial
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    required
                    value={nuevoStockActual}
                    onChange={(e) => setNuevoStockActual(e.target.value)}
                    placeholder="ej. 5.0"
                    className="w-full rounded-lg border border-sand-200 px-3 py-2 text-xs text-charcoal-900 focus:border-sage-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-charcoal-700 mb-1">
                    Stock Mínimo (Alerta)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    required
                    value={nuevoStockMinimo}
                    onChange={(e) => setNuevoStockMinimo(e.target.value)}
                    placeholder="ej. 1.5"
                    className="w-full rounded-lg border border-sand-200 px-3 py-2 text-xs text-charcoal-900 focus:border-sage-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-sand-100">
                <button
                  type="button"
                  onClick={() => setShowNuevoInsumoModal(false)}
                  className="rounded-lg border border-sand-200 px-3 py-1.5 text-xs font-medium text-charcoal-700 hover:bg-sand-50 btn-action"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-sage-500 px-4 py-1.5 text-xs font-medium text-white hover:bg-sage-600 disabled:opacity-50 btn-action shadow-xs"
                >
                  {isSubmitting ? 'Registrando...' : 'Guardar Insumo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Modal: Registrar Merma / Pérdida */}
      {showMermaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal-900/30 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl border border-sand-200 bg-white p-5 shadow-lg animate-feedback">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-charcoal-900">
                Registro y Justificación de Merma
              </h3>
              <button
                onClick={() => setShowMermaModal(false)}
                className="text-charcoal-700/50 hover:text-charcoal-900 btn-action"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-charcoal-700/60 mb-4">
              Descuenta stock físico y genera asiento de auditoría en Kárdex
            </p>

            <form onSubmit={handleRegistrarMerma} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-charcoal-700 mb-1">
                  Insumo afectado
                </label>
                <select
                  value={mermaInsumoId}
                  onChange={(e) => setMermaInsumoId(Number(e.target.value))}
                  className="w-full rounded-lg border border-sand-200 bg-white px-3 py-2 text-xs text-charcoal-900 focus:border-sage-500 focus:outline-none"
                >
                  {insumos.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.nombre} ({i.unidadMedida}) — Disponible: {Number(i.stockActual).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-charcoal-700 mb-1">
                  Cantidad a dar de baja
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  required
                  value={mermaCantidad}
                  onChange={(e) => setMermaCantidad(e.target.value)}
                  placeholder="ej. 0.150"
                  className="w-full rounded-lg border border-sand-200 px-3 py-2 text-xs text-charcoal-900 focus:border-sage-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-charcoal-700 mb-1">
                  Motivo obligatorio de la pérdida
                </label>
                <textarea
                  rows={2}
                  required
                  value={mermaMotivo}
                  onChange={(e) => setMermaMotivo(e.target.value)}
                  placeholder="ej. Insumo deteriorado por humedad o empaque abierto..."
                  className="w-full rounded-lg border border-sand-200 px-3 py-2 text-xs text-charcoal-900 focus:border-sage-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-sand-100">
                <button
                  type="button"
                  onClick={() => setShowMermaModal(false)}
                  className="rounded-lg border border-sand-200 px-3 py-1.5 text-xs font-medium text-charcoal-700 hover:bg-sand-50 btn-action"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-terracotta-500 px-4 py-1.5 text-xs font-medium text-white hover:bg-terracotta-600 disabled:opacity-50 btn-action"
                >
                  {isSubmitting ? 'Registrando...' : 'Confirmar Merma'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
