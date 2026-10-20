export type Rol = 'ADMIN' | 'MESERO' | 'COCINERO';

export type EstadoMesa = 'DISPONIBLE' | 'OCUPADA' | 'EN_PAGO';

export type EstadoPedido = 'PENDIENTE' | 'EN_PREPARACION' | 'LISTO' | 'ENTREGADO' | 'CANCELADO';

export type UnidadMedida = 'KG' | 'LITRO' | 'UNIDAD';

export type TipoMovimiento = 'ENTRADA_COMPRA' | 'SALIDA_VENTA' | 'MERMA' | 'AJUSTE_FISICO';

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: Rol;
  activo: boolean;
}

export interface Mesa {
  id: number;
  numero: number;
  capacidad: number;
  estado: EstadoMesa;
}

export interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string;
}

export interface Insumo {
  id: number;
  nombre: string;
  unidadMedida: UnidadMedida;
  stockActual: number | string;
  stockMinimo: number | string;
  costoPromedio: number | string;
}

export interface RecetaDetalle {
  id: number;
  insumoId: number;
  cantidadRequerida: number | string;
  insumo: Insumo;
}

export interface Plato {
  id: number;
  categoriaId: number;
  nombre: string;
  precio: number | string;
  descripcion?: string;
  activo: boolean;
  categoria?: Categoria;
  receta?: RecetaDetalle[];
}

export interface PedidoDetalle {
  id?: number;
  platoId: number;
  cantidad: number;
  precioUnitario: number;
  notasPersonalizadas?: string;
  plato?: Plato;
}

export interface Pedido {
  id: number;
  mesaId: number;
  usuarioId: number;
  estado: EstadoPedido;
  total: number | string;
  fechaCreacion: string;
  mesa: Mesa;
  usuario: { id: number; nombre: string; rol: Rol };
  detalles: PedidoDetalle[];
}

export interface LoteInsumo {
  id: number;
  insumoId: number;
  codigoLote: string;
  fechaCaducidad: string;
  cantidadIngresada: number | string;
  cantidadDisponible: number | string;
  estado: 'ACTIVO' | 'VENCIDO' | 'AGOTADO';
  insumo?: Insumo;
}

export interface KardexMovimiento {
  id: number;
  insumoId: number;
  usuarioId: number;
  tipoMovimiento: TipoMovimiento;
  cantidad: number | string;
  stockAnterior: number | string;
  stockResultante: number | string;
  motivo: string;
  fechaRegistro: string;
  insumo?: Insumo;
  usuario?: { id: number; nombre: string; rol: Rol };
}
