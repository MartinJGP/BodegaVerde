import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class PedidosGateway {
  @WebSocketServer()
  server: Server;

  // Notifica en tiempo real a la pantalla de cocina (KDS) cuando se crea una nueva comanda
  notificarNuevoPedido(pedido: any) {
    if (this.server) {
      this.server.emit('nuevo_pedido_cocina', pedido);
    }
  }

  // Notifica actualización de estado de pedido (a cocina y a meseros)
  notificarActualizacionEstado(pedido: any) {
    if (this.server) {
      this.server.emit('pedido_actualizado', pedido);

      if (pedido.estado === 'LISTO') {
        this.server.emit('notificar_mesero', {
          pedidoId: pedido.id,
          mesaNumero: pedido.mesa?.numero,
          mensaje: `¡Pedido #${pedido.id} de la Mesa ${pedido.mesa?.numero} listo para servir!`
        });
      }
    }
  }

  // Notifica actualización de mesa (ej. liberada o marcada como disponible)
  notificarMesaActualizada(mesa: any) {
    if (this.server) {
      this.server.emit('mesa_actualizada', mesa);
    }
  }

  // Permite a clientes conectados por socket enviar actualización de estado directamente
  @SubscribeMessage('cambiar_estado')
  handleCambiarEstado(@MessageBody() data: { pedidoId: number; estado: string }) {
    if (this.server) {
      this.server.emit('pedido_actualizado', data);

      if (data.estado === 'LISTO') {
        this.server.emit('notificar_mesero', {
          pedidoId: data.pedidoId,
          mensaje: `¡Pedido #${data.pedidoId} listo para servir!`
        });
      }
    }
  }
}
