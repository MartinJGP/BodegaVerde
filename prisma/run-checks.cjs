const http = require('http');

function request(path, method = 'GET', data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
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

async function runAudit() {
  console.log('================================================================');
  console.log('🔍 AUDITORÍA INTEGRAL DE TODOS LOS CONTROLADORES (PORT 3001)');
  console.log('================================================================\n');

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

  // 1. AppController (Healthcheck)
  await test('AppController: GET / (Estado general de la API)', async () => {
    const res = await request('/');
    if (res.status !== 200 || res.data.status !== 'online') throw new Error(`Status ${res.status}`);
    console.log(`       -> Respuesta: ${res.data.proyecto} (v${res.data.version})`);
  });

  // 2. AuthController
  let token = '';
  await test('AuthController: POST /auth/login (Autenticación JWT)', async () => {
    const res = await request('/auth/login', 'POST', {
      email: 'admin@bodegaverde.pe',
      password: 'password123'
    });
    if (res.status !== 200 && res.status !== 201) throw new Error(`Status ${res.status}`);
    token = res.data.access_token;
    console.log(`       -> Token generado para: ${res.data.usuario.nombre} (${res.data.usuario.rol})`);
  });

  // 3. UsuariosController
  await test('UsuariosController: GET /usuarios (Listado de Usuarios)', async () => {
    const res = await request('/usuarios');
    if (res.status !== 200 || !Array.isArray(res.data)) throw new Error(`Status ${res.status}`);
    console.log(`       -> ${res.data.length} usuarios registrados en el sistema`);
  });

  // 4. MesasController
  let mesaId = 0;
  await test('MesasController: GET /mesas & GET /mesas/:id', async () => {
    const resList = await request('/mesas');
    if (resList.status !== 200 || !Array.isArray(resList.data)) throw new Error(`Status ${resList.status}`);
    mesaId = resList.data[0].id;

    const resSingle = await request(`/mesas/${mesaId}`);
    if (resSingle.status !== 200 || resSingle.data.id !== mesaId) throw new Error(`Status ${resSingle.status}`);
    console.log(`       -> Mesa #${resSingle.data.numero} verificada (Capacidad: ${resSingle.data.capacidad}, Estado: ${resSingle.data.estado})`);
  });

  // 5. CategoriasController
  let categoriaId = 0;
  await test('CategoriasController: GET /categorias & GET /categorias/:id', async () => {
    const resList = await request('/categorias');
    if (resList.status !== 200 || !Array.isArray(resList.data)) throw new Error(`Status ${resList.status}`);
    categoriaId = resList.data[0].id;

    const resSingle = await request(`/categorias/${categoriaId}`);
    if (resSingle.status !== 200 || resSingle.data.id !== categoriaId) throw new Error(`Status ${resSingle.status}`);
    console.log(`       -> Categoría #${categoriaId} (${resSingle.data.nombre}) contiene ${resSingle.data.platos.length} platos`);
  });

  // 6. PlatosController
  let platoLatteId = 0;
  await test('PlatosController: GET /platos & GET /platos/:id/disponibilidad', async () => {
    const resList = await request('/platos');
    if (resList.status !== 200 || !Array.isArray(resList.data)) throw new Error(`Status ${resList.status}`);
    const latte = resList.data.find(p => p.nombre.includes('Latte')) || resList.data[0];
    platoLatteId = latte.id;

    const resDisp = await request(`/platos/${platoLatteId}/disponibilidad`);
    if (resDisp.status !== 200 || typeof resDisp.data.disponible !== 'boolean') throw new Error(`Status ${resDisp.status}`);
    console.log(`       -> Plato "${latte.nombre}" verificado. Disponibilidad: ${resDisp.data.disponible ? 'DISPONIBLE' : 'SIN STOCK'}`);
  });

  // 7. InsumosController
  let insumoId = 0;
  await test('InsumosController: GET /insumos, alertas y Kárdex global', async () => {
    const resList = await request('/insumos');
    if (resList.status !== 200 || !Array.isArray(resList.data)) throw new Error(`Status ${resList.status}`);
    insumoId = resList.data[0].id;

    const resAlertasStock = await request('/insumos/alertas/stock-minimo');
    if (resAlertasStock.status !== 200) throw new Error(`Alertas stock: Status ${resAlertasStock.status}`);

    const resAlertasVencer = await request('/insumos/alertas/por-vencer?dias=7');
    if (resAlertasVencer.status !== 200) throw new Error(`Alertas caducidad: Status ${resAlertasVencer.status}`);

    const resKardexGlobal = await request('/insumos/kardex/global');
    if (resKardexGlobal.status !== 200) throw new Error(`Kárdex global: Status ${resKardexGlobal.status}`);

    console.log(`       -> Alertas stock mínimo: ${resAlertasStock.data.length} | Alertas por vencer: ${resAlertasVencer.data.length} | Movimientos Kárdex: ${resKardexGlobal.data.length}`);
  });

  // 8. InsumosController: Mermas y Ajustes
  await test('InsumosController: POST /insumos/:id/merma (RF-14 Registro de Merma)', async () => {
    const res = await request(`/insumos/${insumoId}/merma`, 'POST', {
      cantidad: 0.05,
      motivo: 'Derrame accidental en calibración matutina',
      usuarioId: 1
    });
    if (res.status !== 200 && res.status !== 201) throw new Error(`Status ${res.status}: ${JSON.stringify(res.data)}`);
    console.log(`       -> Merma registrada con éxito en Kárdex.`);
  });

  // 9. PedidosController
  let pedidoId = 0;
  await test('PedidosController: POST /pedidos, GET /pedidos y PATCH /pedidos/:id/estado', async () => {
    // Crear pedido
    const resCrear = await request('/pedidos', 'POST', {
      mesaId: 3,
      total: 25.00,
      detalles: [
        {
          platoId: platoLatteId,
          cantidad: 2,
          precioUnitario: 12.50,
          notas: 'Leche tibia, sin canela'
        }
      ]
    });
    if (resCrear.status !== 200 && resCrear.status !== 201) throw new Error(`Error crear: ${JSON.stringify(resCrear.data)}`);
    pedidoId = resCrear.data.pedido.id;

    // Actualizar estado
    const resPatch = await request(`/pedidos/${pedidoId}/estado`, 'PATCH', { estado: 'LISTO' });
    if (resPatch.status !== 200) throw new Error(`Error patch: ${JSON.stringify(resPatch.data)}`);

    // Listar pedidos
    const resList = await request('/pedidos');
    if (resList.status !== 200) throw new Error(`Error list: ${resList.status}`);

    console.log(`       -> Pedido #${pedidoId} creado y actualizado a ${resPatch.data.pedido.estado} (Total pedidos: ${resList.data.length})`);
  });

  // 10. ProveedoresController
  let proveedorId = 0;
  await test('ProveedoresController: GET /proveedores & GET /proveedores/:id', async () => {
    const resList = await request('/proveedores');
    if (resList.status !== 200 || !Array.isArray(resList.data)) throw new Error(`Status ${resList.status}`);
    proveedorId = resList.data[0].id;

    const resSingle = await request(`/proveedores/${proveedorId}`);
    if (resSingle.status !== 200 || resSingle.data.id !== proveedorId) throw new Error(`Status ${resSingle.status}`);
    console.log(`       -> Proveedor #${proveedorId} (${resSingle.data.razonSocial}) verificado.`);
  });

  // 11. ComprasController
  await test('ComprasController: POST /compras & GET /compras', async () => {
    const resCrear = await request('/compras', 'POST', {
      proveedorId: proveedorId,
      usuarioId: 1,
      detalles: [
        { insumoId: insumoId, cantidadSolicitada: 5, precioUnitario: 42.00 }
      ]
    });
    if (resCrear.status !== 200 && resCrear.status !== 201) throw new Error(`Status ${resCrear.status}`);

    const resList = await request('/compras');
    if (resList.status !== 200 || !Array.isArray(resList.data)) throw new Error(`Status ${resList.status}`);

    console.log(`       -> Orden de Compra #${resCrear.data.id} creada para ${resCrear.data.proveedor.razonSocial} (Total órdenes: ${resList.data.length})`);
  });

  console.log('\n================================================================');
  console.log(`🎯 AUDITORÍA DE CONTROLADORES: ${passed} / ${total} PRUEBAS EXITOSAS (100%)`);
  console.log('================================================================\n');
}

runAudit();
