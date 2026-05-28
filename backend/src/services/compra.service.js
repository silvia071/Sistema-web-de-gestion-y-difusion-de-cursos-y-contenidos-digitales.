const Compra = require("../models/compra.model");
const DetalleCompra = require("../models/detalleCompra.model");
const AccesoCurso = require("../models/accesoCurso.model");
const Cupon = require("../models/cupon.model");
const Pago = require("../models/pago.model");
const EstadoCompra = require("../enums/estadoCompra");
const EstadoPago = require("../enums/estadoPago");

const populateCompra = (query) => {
  return query.populate("usuario").populate({
    path: "detalles",
    populate: {
      path: "curso",
    },
  });
};

const validarCompraPendiente = async (usuarioId, cursoId) => {
  const detallesDelCurso = await DetalleCompra.find({
    curso: cursoId,
  }).select("_id");

  const detallesIds = detallesDelCurso.map((detalle) => detalle._id);

  if (detallesIds.length === 0) {
    return;
  }

  const comprasPendientes = await Compra.find({
    usuario: usuarioId,
    detalles: { $in: detallesIds },
    estado: EstadoCompra.PENDIENTE,
  }).select("_id");

  for (const compra of comprasPendientes) {
    const pago = await Pago.findOne({
      compra: compra._id,
      estado: EstadoPago.PENDIENTE,
    }).populate("metodoPago");

    if (pago?.metodoPago?.tipo === "TRANSFERENCIA") {
      throw new Error(
        "Ya tenés una compra pendiente de aprobación por transferencia para uno de los cursos del carrito",
      );
    }
  }
};

const validarYCalcularDescuento = async (carrito, subtotal) => {
  if (!carrito.cupon) {
    return {
      cupon: null,
      codigoCuponAplicado: null,
      descuentoAplicado: 0,
      total: subtotal,
    };
  }

  const cuponId = carrito.cupon._id || carrito.cupon;
  const cupon = await Cupon.findById(cuponId);

  if (!cupon) {
    throw new Error("El cupón aplicado al carrito ya no existe");
  }

  if (!cupon.estaVigente()) {
    throw new Error("El cupón aplicado ya no está vigente");
  }

  if (subtotal < cupon.montoMinimoCompra) {
    throw new Error(
      `El cupón requiere una compra mínima de $${cupon.montoMinimoCompra}`,
    );
  }

  const descuentoCalculado = cupon.calcularDescuento(subtotal);
  const total = Math.max(subtotal - descuentoCalculado, 0);

  return {
    cupon: cupon._id,
    codigoCuponAplicado: cupon.codigo,
    descuentoAplicado: descuentoCalculado,
    total,
  };
};

const incrementarUsoCupon = async (cuponId) => {
  if (!cuponId) return;

  await Cupon.findByIdAndUpdate(cuponId, {
    $inc: { usosActuales: 1 },
  });
};

const generarCompraDesdeCarrito = async (carrito, usuarioId) => {
  if (!usuarioId) {
    throw new Error("El usuario es obligatorio");
  }

  if (!carrito) {
    throw new Error("Carrito no encontrado");
  }

  if (!carrito.usuario || carrito.usuario.toString() !== usuarioId.toString()) {
    throw new Error(
      "No tenés permiso para generar una compra con este carrito",
    );
  }

  if (!carrito.items || carrito.items.length === 0) {
    throw new Error("El carrito está vacío");
  }

  let subtotal = 0;
  const detallesIds = [];

  for (const item of carrito.items) {
    if (!item.curso) {
      throw new Error("Uno de los items del carrito no tiene curso");
    }

    if (item.precioUnitario == null) {
      throw new Error("Uno de los items del carrito no tiene precioUnitario");
    }

    const cursoId = item.curso._id || item.curso;

    const accesoExistente = await AccesoCurso.findOne({
      usuario: usuarioId,
      curso: cursoId,
      estado: "ACTIVO",
    });

    if (accesoExistente) {
      throw new Error("Ya tenés acceso a uno de los cursos del carrito");
    }

    await validarCompraPendiente(usuarioId, cursoId);

    const subtotalDetalle = Number(item.precioUnitario);

    const detalle = await DetalleCompra.create({
      curso: cursoId,
      precioUnitario: item.precioUnitario,
      subtotal: subtotalDetalle,
    });

    subtotal += subtotalDetalle;
    detallesIds.push(detalle._id);
  }

  const datosDescuento = await validarYCalcularDescuento(carrito, subtotal);

  const compra = await Compra.create({
    usuario: usuarioId,
    detalles: detallesIds,
    subtotal,
    descuento: datosDescuento.descuentoAplicado,
    total: datosDescuento.total,
    cupon: datosDescuento.cupon,
    codigoCuponAplicado: datosDescuento.codigoCuponAplicado,
    estado: EstadoCompra.PENDIENTE,
  });

  await incrementarUsoCupon(datosDescuento.cupon);

  if (typeof carrito.finalizar === "function") {
    carrito.finalizar();
  } else {
    carrito.items = [];
  }

  await carrito.save();

  return await populateCompra(Compra.findById(compra._id));
};

const obtenerComprasPorUsuario = async (usuarioId) => {
  if (!usuarioId) {
    throw new Error("El usuario es obligatorio");
  }

  return await populateCompra(
    Compra.find({ usuario: usuarioId }).sort({ createdAt: -1 }),
  );
};

const obtenerCompraPorIdYUsuario = async (compraId, usuarioId) => {
  if (!compraId) {
    throw new Error("El id de la compra es obligatorio");
  }

  if (!usuarioId) {
    throw new Error("El usuario es obligatorio");
  }

  const compra = await populateCompra(Compra.findById(compraId));

  if (!compra) {
    throw new Error("Compra no encontrada");
  }

  if (
    !compra.usuario ||
    compra.usuario._id.toString() !== usuarioId.toString()
  ) {
    throw new Error("No tenés permiso para ver esta compra");
  }

  return compra;
};

const obtenerTodasLasCompras = async () => {
  return await populateCompra(Compra.find().sort({ createdAt: -1 }));
};

const obtenerCompraPorIdAdmin = async (compraId) => {
  if (!compraId) {
    throw new Error("El id de la compra es obligatorio");
  }

  const compra = await populateCompra(Compra.findById(compraId));

  if (!compra) {
    throw new Error("Compra no encontrada");
  }

  return compra;
};

const eliminarCompra = async (compraId) => {
  const compra = await Compra.findByIdAndDelete(compraId);

  if (!compra) {
    throw new Error("Compra no encontrada");
  }

  return compra;
};

module.exports = {
  generarCompraDesdeCarrito,
  obtenerComprasPorUsuario,
  obtenerCompraPorIdYUsuario,
  obtenerTodasLasCompras,
  obtenerCompraPorIdAdmin,
  eliminarCompra,
};
