const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('===========================================================');
  console.log('🌱 POBLANDO BASE DE DATOS: LA BODEGA VERDE (BARRANCO)');
  console.log('===========================================================');

  // Limpieza previa en orden de dependencias para permitir re-ejecución limpia
  console.log('1. Limpiando datos anteriores para reinicio limpio...');
  await prisma.pedidoDetalle.deleteMany();
  await prisma.pedido.deleteMany();
  await prisma.kardexMovimiento.deleteMany();
  await prisma.loteInsumo.deleteMany();
  await prisma.ordenCompraDetalle.deleteMany();
  await prisma.ordenCompra.deleteMany();
  await prisma.recetaDetalle.deleteMany();
  await prisma.plato.deleteMany();
  await prisma.categoria.deleteMany();
  await prisma.insumo.deleteMany();
  await prisma.mesa.deleteMany();
  await prisma.proveedor.deleteMany();
  await prisma.usuario.deleteMany();

  // 1. USUARIOS (Admin, Meseros, Cocina)
  console.log('2. Creando usuarios con roles del sistema...');
  const passwordHash = await bcrypt.hash('password123', 10);

  const admin = await prisma.usuario.create({
    data: {
      nombre: 'Administrador General',
      email: 'admin@bodegaverde.pe',
      passwordHash,
      rol: 'ADMIN',
    },
  });

  const meseroCarlos = await prisma.usuario.create({
    data: {
      nombre: 'Carlos Mesero',
      email: 'mesero@bodegaverde.pe',
      passwordHash,
      rol: 'MESERO',
    },
  });

  const meseraLucia = await prisma.usuario.create({
    data: {
      nombre: 'Lucía Mendoza',
      email: 'lucia.mesera@bodegaverde.pe',
      passwordHash,
      rol: 'MESERO',
    },
  });

  const chef = await prisma.usuario.create({
    data: {
      nombre: 'Chef Principal',
      email: 'cocina@bodegaverde.pe',
      passwordHash,
      rol: 'COCINERO',
    },
  });

  const cajero = await prisma.usuario.create({
    data: {
      nombre: 'Cajero Principal',
      email: 'caja@bodegaverde.pe',
      passwordHash,
      rol: 'CAJERO',
    },
  });

  // 2. MESAS (Mesas de salón, terraza y barra)
  console.log('3. Creando mesas del local...');
  const mesas = await Promise.all([
    prisma.mesa.create({ data: { numero: 1, capacidad: 2, estado: 'DISPONIBLE' } }),
    prisma.mesa.create({ data: { numero: 2, capacidad: 4, estado: 'OCUPADA' } }), // Mesa con comanda activa
    prisma.mesa.create({ data: { numero: 3, capacidad: 4, estado: 'DISPONIBLE' } }),
    prisma.mesa.create({ data: { numero: 4, capacidad: 6, estado: 'OCUPADA' } }), // Mesa con comanda activa
    prisma.mesa.create({ data: { numero: 5, capacidad: 2, estado: 'DISPONIBLE' } }),
    prisma.mesa.create({ data: { numero: 6, capacidad: 8, estado: 'DISPONIBLE' } }),
    prisma.mesa.create({ data: { numero: 7, capacidad: 4, estado: 'DISPONIBLE' } }),
    prisma.mesa.create({ data: { numero: 8, capacidad: 2, estado: 'DISPONIBLE' } }),
  ]);

  // 3. CATEGORIAS DE CARTA
  console.log('4. Creando categorías gastronómicas...');
  const catCafe = await prisma.categoria.create({
    data: { nombre: 'Cafetería de Especialidad', descripcion: 'Café de origen peruano de altura y espressos' },
  });
  const catDesayuno = await prisma.categoria.create({
    data: { nombre: 'Desayunos & Bowls', descripcion: 'Opciones nutritivas con insumos orgánicos' },
  });
  const catSandwich = await prisma.categoria.create({
    data: { nombre: 'Sandwiches Artesanales', descripcion: 'Panadería fresca de masa madre y ciabatta' },
  });
  const catEnsaladas = await prisma.categoria.create({
    data: { nombre: 'Ensaladas & Almuerzos', descripcion: 'Bowls frescos con superalimentos y proteínas' },
  });
  const catBebidas = await prisma.categoria.create({
    data: { nombre: 'Bebidas Naturales', descripcion: 'Jugos recién exprimidos e infusiones frías' },
  });

  // 4. INSUMOS (Materia prima con stock y umbrales mínimos)
  console.log('5. Creando insumos e inventario inicial...');
  const insCafe = await prisma.insumo.create({
    data: { nombre: 'Café en Grano Chanchamayo', unidadMedida: 'KG', stockActual: 15.0, stockMinimo: 3.5, costoPromedio: 44.00 },
  });
  const insLeche = await prisma.insumo.create({
    data: { nombre: 'Leche Fresca Entera Pasteurizada', unidadMedida: 'LITRO', stockActual: 24.0, stockMinimo: 6.0, costoPromedio: 5.50 },
  });
  const insLecheAlmendra = await prisma.insumo.create({
    data: { nombre: 'Bebida de Almendras Artesanal', unidadMedida: 'LITRO', stockActual: 8.0, stockMinimo: 2.0, costoPromedio: 9.80 },
  });
  const insPanMasaMadre = await prisma.insumo.create({
    data: { nombre: 'Pan Campesino de Masa Madre', unidadMedida: 'UNIDAD', stockActual: 35.0, stockMinimo: 10.0, costoPromedio: 1.80 },
  });
  const insPanCiabatta = await prisma.insumo.create({
    data: { nombre: 'Pan Ciabatta Integral', unidadMedida: 'UNIDAD', stockActual: 25.0, stockMinimo: 8.0, costoPromedio: 1.50 },
  });
  const insPalta = await prisma.insumo.create({
    data: { nombre: 'Palta Hass Calibre Especial', unidadMedida: 'KG', stockActual: 9.5, stockMinimo: 3.0, costoPromedio: 8.80 },
  });
  const insHuevos = await prisma.insumo.create({
    data: { nombre: 'Huevos de Corral Orgánicos', unidadMedida: 'UNIDAD', stockActual: 60.0, stockMinimo: 15.0, costoPromedio: 0.90 },
  });
  const insFrutosRojos = await prisma.insumo.create({
    data: { nombre: 'Frutos Rojos Frescos (Fresas y Arándanos)', unidadMedida: 'KG', stockActual: 1.2, stockMinimo: 2.5, costoPromedio: 16.00 }, // ALERTA STOCK MINIMO (RF-12)
  });
  const insYogurt = await prisma.insumo.create({
    data: { nombre: 'Yogurt Griego Natural sin Azúcar', unidadMedida: 'KG', stockActual: 6.0, stockMinimo: 2.0, costoPromedio: 13.50 },
  });
  const insMozzarella = await prisma.insumo.create({
    data: { nombre: 'Queso Mozzarella de Fundo', unidadMedida: 'KG', stockActual: 5.0, stockMinimo: 1.5, costoPromedio: 26.00 },
  });
  const insTomate = await prisma.insumo.create({
    data: { nombre: 'Tomate Italiano Orgánico', unidadMedida: 'KG', stockActual: 7.0, stockMinimo: 2.0, costoPromedio: 4.80 },
  });
  const insAlbahaca = await prisma.insumo.create({
    data: { nombre: 'Albahaca Fresca Hidropónica', unidadMedida: 'KG', stockActual: 1.0, stockMinimo: 0.3, costoPromedio: 12.00 },
  });
  const insPollo = await prisma.insumo.create({
    data: { nombre: 'Pechuga de Pollo al Vapor Deshilachada', unidadMedida: 'KG', stockActual: 8.0, stockMinimo: 2.5, costoPromedio: 18.50 },
  });
  const insQuinua = await prisma.insumo.create({
    data: { nombre: 'Quinua Perlada Orgánica Cocida', unidadMedida: 'KG', stockActual: 6.5, stockMinimo: 2.0, costoPromedio: 7.20 },
  });
  const insNaranjas = await prisma.insumo.create({
    data: { nombre: 'Naranjas de Jugo Seleccionadas', unidadMedida: 'KG', stockActual: 20.0, stockMinimo: 5.0, costoPromedio: 3.50 },
  });

  // 5. LOTES CON FECHAS DE CADUCIDAD (Para alertas de caducidad RF-13)
  console.log('6. Creando lotes con fechas de vencimiento...');
  const hoy = new Date();
  const en3Dias = new Date(hoy.getTime() + 3 * 24 * 60 * 60 * 1000);
  const en5Dias = new Date(hoy.getTime() + 5 * 24 * 60 * 60 * 1000);
  const en60Dias = new Date(hoy.getTime() + 60 * 24 * 60 * 60 * 1000);

  await prisma.loteInsumo.createMany({
    data: [
      {
        insumoId: insLeche.id,
        codigoLote: 'LOT-LEC-2601',
        fechaCaducidad: en3Dias, // Caduca en 3 días (RF-13)
        cantidadIngresada: 12.0,
        cantidadDisponible: 12.0,
        estado: 'ACTIVO',
      },
      {
        insumoId: insYogurt.id,
        codigoLote: 'LOT-YOG-2602',
        fechaCaducidad: en5Dias, // Caduca en 5 días (RF-13)
        cantidadIngresada: 6.0,
        cantidadDisponible: 6.0,
        estado: 'ACTIVO',
      },
      {
        insumoId: insTomate.id,
        codigoLote: 'LOT-TOM-2603',
        fechaCaducidad: en3Dias, // Caduca en 3 días (RF-13)
        cantidadIngresada: 4.0,
        cantidadDisponible: 4.0,
        estado: 'ACTIVO',
      },
      {
        insumoId: insCafe.id,
        codigoLote: 'LOT-CAF-2604',
        fechaCaducidad: en60Dias,
        cantidadIngresada: 15.0,
        cantidadDisponible: 15.0,
        estado: 'ACTIVO',
      },
    ],
  });

  // 6. PLATOS CON FICHAS TÉCNICAS (RECETAS RF-16)
  console.log('7. Creando platos y recetas detalladas...');
  const pLatte = await prisma.plato.create({
    data: {
      categoriaId: catCafe.id,
      nombre: 'Café Latte Caliente',
      precio: 12.50,
      descripcion: 'Doble shot de espresso con leche texturizada al vapor',
      activo: true,
      receta: {
        create: [
          { insumoId: insCafe.id, cantidadRequerida: 0.018 },
          { insumoId: insLeche.id, cantidadRequerida: 0.200 },
        ],
      },
    },
  });

  const pAmericano = await prisma.plato.create({
    data: {
      categoriaId: catCafe.id,
      nombre: 'Americano Doble Clásico',
      precio: 9.50,
      descripcion: 'Extracción de espresso doble con agua purificada',
      activo: true,
      receta: {
        create: [
          { insumoId: insCafe.id, cantidadRequerida: 0.020 },
        ],
      },
    },
  });

  const pCappuccino = await prisma.plato.create({
    data: {
      categoriaId: catCafe.id,
      nombre: 'Cappuccino de la Casa',
      precio: 13.00,
      descripcion: 'Espresso intenso con microespuma de leche sedosa',
      activo: true,
      receta: {
        create: [
          { insumoId: insCafe.id, cantidadRequerida: 0.018 },
          { insumoId: insLeche.id, cantidadRequerida: 0.160 },
        ],
      },
    },
  });

  const pIcedLatteAlmendra = await prisma.plato.create({
    data: {
      categoriaId: catCafe.id,
      nombre: 'Iced Latte con Leche de Almendras',
      precio: 15.00,
      descripcion: 'Espresso servido sobre hielo y bebida vegetal de almendras',
      activo: true,
      receta: {
        create: [
          { insumoId: insCafe.id, cantidadRequerida: 0.018 },
          { insumoId: insLecheAlmendra.id, cantidadRequerida: 0.220 },
        ],
      },
    },
  });

  const pAvocadoToast = await prisma.plato.create({
    data: {
      categoriaId: catDesayuno.id,
      nombre: 'Avocado Toast Clásico',
      precio: 21.00,
      descripcion: 'Dos tostadas de pan de masa madre con palta cremosa y huevo pochado',
      activo: true,
      receta: {
        create: [
          { insumoId: insPanMasaMadre.id, cantidadRequerida: 2 },
          { insumoId: insPalta.id, cantidadRequerida: 0.150 },
          { insumoId: insHuevos.id, cantidadRequerida: 1 },
        ],
      },
    },
  });

  const pBowlYogurt = await prisma.plato.create({
    data: {
      categoriaId: catDesayuno.id,
      nombre: 'Bowl de Yogurt Griego y Frutos Rojos',
      precio: 19.50,
      descripcion: 'Yogurt artesanal con arándanos y fresas frescas de estación',
      activo: true,
      receta: {
        create: [
          { insumoId: insYogurt.id, cantidadRequerida: 0.200 },
          { insumoId: insFrutosRojos.id, cantidadRequerida: 0.120 },
        ],
      },
    },
  });

  const pCaprese = await prisma.plato.create({
    data: {
      categoriaId: catSandwich.id,
      nombre: 'Sandwich Caprese en Masa Madre',
      precio: 22.00,
      descripcion: 'Queso mozzarella fundido, rodajas de tomate orgánico y hojas de albahaca fresca',
      activo: true,
      receta: {
        create: [
          { insumoId: insPanMasaMadre.id, cantidadRequerida: 2 },
          { insumoId: insMozzarella.id, cantidadRequerida: 0.100 },
          { insumoId: insTomate.id, cantidadRequerida: 0.080 },
          { insumoId: insAlbahaca.id, cantidadRequerida: 0.010 },
        ],
      },
    },
  });

  const pSandwichPollo = await prisma.plato.create({
    data: {
      categoriaId: catSandwich.id,
      nombre: 'Ciabatta de Pollo & Palta Hass',
      precio: 23.50,
      descripcion: 'Pechuga deshilachada jugosa con láminas de palta y pan ciabatta integral crocante',
      activo: true,
      receta: {
        create: [
          { insumoId: insPanCiabatta.id, cantidadRequerida: 1 },
          { insumoId: insPollo.id, cantidadRequerida: 0.140 },
          { insumoId: insPalta.id, cantidadRequerida: 0.080 },
        ],
      },
    },
  });

  const pEnsaladaQuinua = await prisma.plato.create({
    data: {
      categoriaId: catEnsaladas.id,
      nombre: 'Bowl Andino de Quinua y Palta',
      precio: 24.00,
      descripcion: 'Quinua perlada orgánica, dados de palta, tomate fresco y aderezo de limón',
      activo: true,
      receta: {
        create: [
          { insumoId: insQuinua.id, cantidadRequerida: 0.150 },
          { insumoId: insPalta.id, cantidadRequerida: 0.090 },
          { insumoId: insTomate.id, cantidadRequerida: 0.060 },
        ],
      },
    },
  });

  const pJugoNaranja = await prisma.plato.create({
    data: {
      categoriaId: catBebidas.id,
      nombre: 'Jugo de Naranja 100% Puro',
      precio: 10.50,
      descripcion: 'Zumo recién exprimido al momento sin agua ni azúcar añadida',
      activo: true,
      receta: {
        create: [
          { insumoId: insNaranjas.id, cantidadRequerida: 0.400 },
        ],
      },
    },
  });

  // 7. PROVEEDORES
  console.log('8. Registrando directorio de proveedores...');
  const provCafe = await prisma.proveedor.create({
    data: {
      razonSocial: 'Finca Coffea Perú E.I.R.L.',
      ruc: '20601234567',
      telefono: '987654321',
      correo: 'ventas@fincacoffea.pe',
    },
  });

  const provLacteos = await prisma.proveedor.create({
    data: {
      razonSocial: 'Distribuidora Lácteos del Sur S.A.C.',
      ruc: '20559876543',
      telefono: '945123789',
      correo: 'pedidos@lacteosdelsur.pe',
    },
  });

  const provHuerto = await prisma.proveedor.create({
    data: {
      razonSocial: 'BioHuerto Pachacamac S.A.',
      ruc: '20491122334',
      telefono: '912345678',
      correo: 'ventas@biohuerto.pe',
    },
  });

  const provPanaderia = await prisma.proveedor.create({
    data: {
      razonSocial: 'Panadería Artesanal Barranco',
      ruc: '20123987456',
      telefono: '934567890',
      correo: 'pedidos@panaderiabarranco.pe',
    },
  });

  // 8. KÁRDEX INICIAL (Historial de transacciones para auditoría RF-17)
  console.log('9. Generando movimientos iniciales en Kárdex...');
  await prisma.kardexMovimiento.createMany({
    data: [
      {
        insumoId: insCafe.id,
        usuarioId: admin.id,
        tipoMovimiento: 'ENTRADA_COMPRA',
        cantidad: 15.0,
        stockAnterior: 0.0,
        stockResultante: 15.0,
        motivo: 'Abastecimiento inicial Finca Coffea - Guía #001-4451',
      },
      {
        insumoId: insLeche.id,
        usuarioId: admin.id,
        tipoMovimiento: 'ENTRADA_COMPRA',
        cantidad: 24.0,
        stockAnterior: 0.0,
        stockResultante: 24.0,
        motivo: 'Abastecimiento lácteos frescos - Guía #002-8871',
      },
      {
        insumoId: insPalta.id,
        usuarioId: admin.id,
        tipoMovimiento: 'ENTRADA_COMPRA',
        cantidad: 10.0,
        stockAnterior: 0.0,
        stockResultante: 10.0,
        motivo: 'Ingreso semanal BioHuerto Pachacamac',
      },
      {
        insumoId: insPalta.id,
        usuarioId: chef.id,
        tipoMovimiento: 'MERMA',
        cantidad: 0.500,
        stockAnterior: 10.0,
        stockResultante: 9.5,
        motivo: 'Palta sobremadura descartada en control de calidad matutino',
      },
    ],
  });

  // 9. COMANDAS ACTIVAS PARA DEMOSTRACIÓN EN COCINA (KDS)
  console.log('10. Creando pedidos activos para pantalla de cocina (KDS)...');
  // Comanda 1: En preparación para Mesa 2
  const pedido1 = await prisma.pedido.create({
    data: {
      mesaId: mesas[1].id, // Mesa 2
      usuarioId: meseroCarlos.id,
      estado: 'EN_PREPARACION',
      total: 33.50,
      detalles: {
        create: [
          {
            platoId: pLatte.id,
            cantidad: 1,
            precioUnitario: 12.50,
            notasPersonalizadas: 'Con leche bien caliente, sin azúcar',
          },
          {
            platoId: pAvocadoToast.id,
            cantidad: 1,
            precioUnitario: 21.00,
            notasPersonalizadas: 'Huevo bien cocido por favor',
          },
        ],
      },
    },
  });

  // Comanda 2: Pendiente para Mesa 4
  const pedido2 = await prisma.pedido.create({
    data: {
      mesaId: mesas[3].id, // Mesa 4
      usuarioId: meseraLucia.id,
      estado: 'PENDIENTE',
      total: 56.50,
      detalles: {
        create: [
          {
            platoId: pCaprese.id,
            cantidad: 2,
            precioUnitario: 22.00,
            notasPersonalizadas: 'Pan bien tostado',
          },
          {
            platoId: pCappuccino.id,
            cantidad: 1,
            precioUnitario: 12.50,
          },
        ],
      },
    },
  });

  console.log('===========================================================');
  console.log('🎉 BASE DE DATOS DE LA BODEGA VERDE POBLADA EXITOSAMENTE');
  console.log('===========================================================');
}

main()
  .catch((e) => {
    console.error('Error durante el poblamiento:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
