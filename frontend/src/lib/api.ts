import {
  Mesa,
  Categoria,
  Plato,
  Pedido,
  Insumo,
  LoteInsumo,
  KardexMovimiento,
  EstadoPedido,
  Comprobante,
  ResumenCajaDiario,
  TipoComprobante,
  MetodoPago,
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      let errorMessage = `Error HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        // Fallback to generic message
      }
      throw new Error(errorMessage);
    }
    return response.json();
  } catch (error: any) {
    console.error(`Error en API [${endpoint}]:`, error.message);
    throw error;
  }
}

export const api = {
  // Auth
  login: (email: string, pass: string) =>
    request<{ access_token: string; usuario: { nombre: string; rol: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: pass }),
    }),

  // Mesas
  getMesas: () => request<Mesa[]>('/mesas'),
  getMesa: (id: number) => request<Mesa>(`/mesas/${id}`),
  actualizarMesa: (id: number, data: Partial<Mesa>) =>
    request<Mesa>(`/mesas/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Categorías y Platos
  getCategorias: () => request<Categoria[]>('/categorias'),
  getPlatos: (soloActivos: boolean = true) =>
    request<Plato[]>(`/platos?soloActivos=${soloActivos}`),
  verificarDisponibilidad: (id: number) =>
    request<{ platoId: number; nombre: string; disponible: boolean; insumosFaltantes: any[] }>(
      `/platos/${id}/disponibilidad`
    ),

  // Pedidos
  getPedidos: (estado?: EstadoPedido) =>
    request<Pedido[]>(estado ? `/pedidos?estado=${estado}` : '/pedidos'),
  getPedido: (id: number) => request<Pedido>(`/pedidos/${id}`),
  crearPedido: (data: {
    mesaId: number;
    total: number;
    usuarioId?: number;
    detalles: {
      platoId: number;
      cantidad: number;
      precioUnitario: number;
      notas?: string;
    }[];
  }) =>
    request<{ success: boolean; message: string; pedido: Pedido }>('/pedidos', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  actualizarEstadoPedido: (id: number, estado: EstadoPedido) =>
    request<{ success: boolean; message: string; pedido: Pedido }>(`/pedidos/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ estado }),
    }),

  // Insumos y Control de Inventario
  getInsumos: () => request<Insumo[]>('/insumos'),
  getAlertasStockMinimo: () => request<Insumo[]>('/insumos/alertas/stock-minimo'),
  getAlertasPorVencer: (dias: number = 7) =>
    request<LoteInsumo[]>(`/insumos/alertas/por-vencer?dias=${dias}`),
  getKardexGlobal: () => request<KardexMovimiento[]>('/insumos/kardex/global'),
  registrarMerma: (
    insumoId: number,
    data: { cantidad: number; motivo: string; usuarioId?: number }
  ) =>
    request<any>(`/insumos/${insumoId}/merma`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  ajustarStock: (
    insumoId: number,
    data: { cantidad: number; motivo: string; usuarioId?: number }
  ) =>
    request<any>(`/insumos/${insumoId}/ajuste`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  crearInsumo: (data: {
    nombre: string;
    unidadMedida: string;
    stockActual: number;
    stockMinimo: number;
    costoPromedio: number;
  }) =>
    request<Insumo>('/insumos', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // ==========================================
  // CHECKOUT Y FACTURACIÓN (RF-09 a RF-14)
  // ==========================================
  getComprobantes: () => request<Comprobante[]>('/comprobantes'),
  getComprobante: (id: number) => request<Comprobante>(`/comprobantes/${id}`),
  getResumenCajaDiario: () => request<ResumenCajaDiario>('/comprobantes/resumen/diario'),
  emitirComprobante: (data: {
    pedidoId: number;
    cajeroId?: number;
    tipo: TipoComprobante;
    clienteNombre?: string;
    clienteDocumento?: string;
    pagos: {
      metodoPago: MetodoPago;
      monto: number;
      montoRecibido?: number;
      vuelto?: number;
      referencia?: string;
    }[];
  }) =>
    request<{
      success: boolean;
      message: string;
      comprobante: Comprobante;
      pedido: Pedido;
      mesaLiberada?: Mesa;
    }>('/comprobantes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
