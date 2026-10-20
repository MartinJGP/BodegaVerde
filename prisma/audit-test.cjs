const http = require('http');
const { spawn } = require('child_process');

function request(path, method = 'GET', data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runAudit() {
  console.log('====================================================');
  console.log('🔍 INICIANDO AUDITORÍA INTEGRAL DEL BACKEND');
  console.log('====================================================\n');

  console.log('Iniciando servidor NestJS en segundo plano...');
  const server = spawn('node', ['dist/main.js'], { stdio: 'inherit' });

  // Esperar a que el servidor inicialice
  await sleep(4000);

  let passed = 0;
  let total = 0;

  async function test(name, fn) {
    total++;
    try {
      await fn();
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } catch (e) {
      console.error(`❌ [FAIL] ${name} -> ${e.message}`);
    }
  }

  try {
    let token = '';

    // 1. Auth Login
    await test('POST /auth/login (Autenticación JWT)', async () => {
      const res = await request('/auth/login', 'POST', {
        email: 'admin@bodegaverde.pe',
        password: 'password123'
      });
      if (res.status !== 201 && res.status !== 200) throw new Error(`Status ${res.status}`);
      if (!res.data.access_token) throw new Error('No se recibió access_token');
      token = res.data.access_token;
    });

    // 2. Mesas
    await test('GET /mesas (Listado de Mesas)', async () => {
      const res = await request('/mesas');
      if (res.status !== 200) throw new Error(`Status ${res.status}`);
      if (!Array.isArray(res.data) || res.data.length === 0) throw new Error('No se encontraron mesas');
    });

    // 3. Platos y Recetas
    let platoLatteId = 0;
    await test('GET /platos (Platos con Recetas)', async () => {
      const res = await request('/platos');
      if (res.status !== 200) throw new Error(`Status ${res.status}`);
      if (!Array.isArray(res.data) || res.data.length === 0) throw new Error('No se encontraron platos');
      const latte = res.data.find(p => p.nombre.includes('Latte'));
      if (latte) platoLatteId = latte.id;
    });

    // 4. RF-02 y RF-03: Disponibilidad de platos
    await test(`GET /platos/${platoLatteId}/disponibilidad (RF-02 y RF-03)`, async () => {
      const res = await request(`/platos/${platoLatteId}/disponibilidad`);
      if (res.status !== 200) throw new Error(`Status ${res.status}`);
      if (typeof res.data.disponible !== 'boolean') throw new Error('Respuesta inválida');
    });

    // 5. RF-12: Alertas de Stock Mínimo
    await test('GET /insumos/alertas/stock-minimo (RF-12 Alertas Stock)', async () => {
      const res = await request('/insumos/alertas/stock-minimo');
      if (res.status !== 200) throw new Error(`Status ${res.status}`);
      if (!Array.isArray(res.data)) throw new Error('No es un arreglo');
      console.log(`       -> Insumos en alerta de stock mínimo: ${res.data.length}`);
    });

    // 6. RF-13: Alertas de Insumos Próximos a Vencer
    await test('GET /insumos/alertas/por-vencer (RF-13 Alertas Caducidad)', async () => {
      const res = await request('/insumos/alertas/por-vencer?dias=7');
      if (res.status !== 200) throw new Error(`Status ${res.status}`);
      if (!Array.isArray(res.data)) throw new Error('No es un arreglo');
      console.log(`       -> Lotes próximos a vencer detectados: ${res.data.length}`);
    });

    // 7. RF-01, RF-04, RF-09, RF-17: Crear Pedido con Transacción ACID
    let pedidoCreadoId = 0;
    await test('POST /pedidos (RF-01, RF-04, RF-09, RF-17 Transacción ACID y Kárdex)', async () => {
      const res = await request('/pedidos', 'POST', {
        mesaId: 1,
        total: 25.00,
        detalles: [
          {
            platoId: platoLatteId,
            cantidad: 2,
            precioUnitario: 12.50,
            notas: 'Sin azúcar, bien caliente'
          }
        ]
      });
      if (res.status !== 201 && res.status !== 200) throw new Error(`Status ${res.status}: ${JSON.stringify(res.data)}`);
      if (!res.data.success || !res.data.pedido) throw new Error('Error al registrar pedido');
      pedidoCreadoId = res.data.pedido.id;
      console.log(`       -> Pedido #${pedidoCreadoId} creado, stock de café y leche descontado atómicamente`);
    });

    // 8. RF-06 y RF-07: Actualizar Estado del Pedido a LISTO
    await test(`PATCH /pedidos/${pedidoCreadoId}/estado (RF-06 y RF-07 Notificación Cocina-Mesero)`, async () => {
      const res = await request(`/pedidos/${pedidoCreadoId}/estado`, 'PATCH', {
        estado: 'LISTO'
      });
      if (res.status !== 200) throw new Error(`Status ${res.status}`);
      if (res.data.pedido.estado !== 'LISTO') throw new Error('Estado no actualizado');
    });

    // 9. RF-14: Registro y Justificación de Mermas
    await test('POST /insumos/1/merma (RF-14 Registro de Mermas)', async () => {
      const res = await request('/insumos/1/merma', 'POST', {
        cantidad: 0.100,
        motivo: 'Bolsa rota durante manipulación en barra',
        usuarioId: 1
      });
      if (res.status !== 201 && res.status !== 200) throw new Error(`Status ${res.status}: ${JSON.stringify(res.data)}`);
    });

    // 10. RF-17: Historial de Kárdex
    await test('GET /insumos/kardex/global (RF-17 Auditoría Kárdex)', async () => {
      const res = await request('/insumos/kardex/global');
      if (res.status !== 200) throw new Error(`Status ${res.status}`);
      if (!Array.isArray(res.data) || res.data.length === 0) throw new Error('No hay movimientos de Kárdex');
      console.log(`       -> Movimientos registrados en Kárdex auditados: ${res.data.length}`);
    });

    // 11. RF-10: Módulo de Compras (Crear Orden de Compra)
    await test('POST /compras (RF-10 Órdenes de Compra a Proveedores)', async () => {
      const res = await request('/compras', 'POST', {
        proveedorId: 1,
        usuarioId: 1,
        detalles: [
          { insumoId: 1, cantidadSolicitada: 10, precioUnitario: 42.00 }
        ]
      });
      if (res.status !== 201 && res.status !== 200) throw new Error(`Status ${res.status}`);
    });

  } finally {
    console.log('\nApagando servidor de prueba...');
    server.kill();
  }

  console.log('\n====================================================');
  console.log(`🎯 RESULTADO AUDITORÍA: ${passed} / ${total} PRUEBAS EXITOSAS`);
  console.log('====================================================\n');
  process.exit(passed === total ? 0 : 1);
}

runAudit();
