import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class PedidosGateway {
  @WebSocketServer()
  server: Server;

  notificarNuevoPedido(pedido: any) {
    if (this.server) {
      this.server.emit('nuevo_pedido_cocina', pedido);
    }
  }

  // alerta de comanda lista para servicio
  notificarActualizacionEstado(pedido: any) {
    if (this.server) {
      this.server.emit('pedido_actualizado', pedido);

      if (pedido.estado === 'LISTO') {
        this.server.emit('notificar_mesero', {
          pedidoId: pedido.id,
          mesaNumero: pedido.mesa?.numero,
          mensaje: `Pedido #${pedido.id} listo para servir en Mesa ${pedido.mesa?.numero || ''}`
        });
      }
    }
  }

  notificarMesaActualizada(mesa: any) {
    if (this.server) {
      this.server.emit('mesa_actualizada', mesa);
    }
  }

  @SubscribeMessage('cambiar_estado')
  handleCambiarEstado(@MessageBody() data: { pedidoId: number; estado: string }) {
    if (this.server) {
      this.server.emit('pedido_actualizado', data);

      if (data.estado === 'LISTO') {
        this.server.emit('notificar_mesero', {
          pedidoId: data.pedidoId,
          mensaje: `Pedido #${data.pedidoId} listo para servir`
        });
      }
    }
  }
}
