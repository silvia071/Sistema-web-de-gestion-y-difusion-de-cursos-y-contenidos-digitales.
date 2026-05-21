const Pago = require("../models/pago.model");
const Compra = require("../models/compra.model");
const AccesoCurso = require("../models/accesoCurso.model");
const EstadoPago = require("../enums/estadoPago");
const EstadoCompra = require("../enums/estadoCompra");

const crearPago = async (data) => {
  const { monto, metodoPago, usuario, compra } = data;

  if (!monto || !metodoPago || !usuario || !compra) {
    throw new Error("monto, metodoPago, usuario y compra son obligatorios");
  }

  const compraExistente = await Compra.findById(compra);

  if (!compraExistente) {
    throw new Error("La compra no existe");
  }

  if (compraExistente.usuario.toString() !== usuario.toString()) {
    throw new Error("No tenés permiso para pagar esta compra");
  }

  if (compraExistente.pago) {
    throw new Error("La compra ya tiene un pago asociado");
  }

  if (Number(monto) !== Number(compraExistente.total)) {
    throw new Error("El monto del pago no coincide con el total de la compra");
  }

  const pago = new Pago({
    ...data,
    monto: Number(monto),
  });

  const pagoGuardado = await pago.save();

  compraExistente.pago = pagoGuardado._id;
  await compraExistente.save();

  return await Pago.findById(pagoGuardado._id)
    .populate("metodoPago")
    .populate("usuario")
    .populate("compra");
};

const buscarPagoPorId = async (id) => {
  return await Pago.findById(id)
    .populate("metodoPago")
    .populate("usuario")
    .populate("compra");
};

const aprobarPago = async (id) => {
  const pago = await Pago.findById(id);

  if (!pago) {
    throw new Error("Pago no encontrado");
  }

  if (pago.estado === EstadoPago.APROBADO) {
    return await Pago.findById(id)
      .populate("metodoPago")
      .populate("usuario")
      .populate("compra");
  }

  const compra = await Compra.findById(pago.compra).populate("detalles");

  if (!compra) {
    throw new Error("Compra no encontrada");
  }

  if (!compra.detalles || compra.detalles.length === 0) {
    throw new Error("La compra no tiene detalles");
  }

  pago.estado = EstadoPago.APROBADO;
  await pago.save();

  compra.estado = EstadoCompra.PAGADA;
  await compra.save();

  for (const detalle of compra.detalles) {
    const accesoExistente = await AccesoCurso.findOne({
      usuario: pago.usuario,
      curso: detalle.curso,
    });

    if (accesoExistente) {
      accesoExistente.estado = "ACTIVO";
      accesoExistente.compra = compra._id;

      if (
        accesoExistente.progreso === undefined ||
        accesoExistente.progreso === null
      ) {
        accesoExistente.progreso = 0;
      }

      await accesoExistente.save();
    } else {
      await AccesoCurso.create({
        usuario: pago.usuario,
        curso: detalle.curso,
        compra: compra._id,
        progreso: 0,
        estado: "ACTIVO",
      });
    }
  }

  return await Pago.findById(id)
    .populate("metodoPago")
    .populate("usuario")
    .populate("compra");
};

const rechazarPago = async (id) => {
  const pago = await Pago.findById(id);

  if (!pago) {
    throw new Error("Pago no encontrado");
  }

  if (pago.estado === EstadoPago.RECHAZADO) {
    return await Pago.findById(id)
      .populate("metodoPago")
      .populate("usuario")
      .populate("compra");
  }

  pago.estado = EstadoPago.RECHAZADO;
  await pago.save();

  const compra = await Compra.findById(pago.compra);

  if (compra) {
    compra.estado = EstadoCompra.CANCELADA;
    await compra.save();
  }

  return await Pago.findById(id)
    .populate("metodoPago")
    .populate("usuario")
    .populate("compra");
};

const procesarPago = async (pagoId) => {
  if (!pagoId) {
    throw new Error("El pagoId es obligatorio");
  }

  const pago = await Pago.findById(pagoId)
    .populate("metodoPago")
    .populate("usuario")
    .populate("compra");

  if (!pago) {
    throw new Error("Pago no encontrado");
  }

  if (!pago.metodoPago) {
    throw new Error("El pago no tiene método de pago asociado");
  }

  const tipoMetodo = pago.metodoPago.tipo;

  if (tipoMetodo === "TRANSFERENCIA") {
    return {
      tipo: "transferencia",
      mensaje:
        "La compra quedó pendiente de aprobación administrativa por transferencia.",
    };
  }

  if (tipoMetodo === "TARJETA") {
    const usarMock =
      process.env.MP_MOCK === "true" ||
      !process.env.MP_ACCESS_TOKEN ||
      process.env.MP_ACCESS_TOKEN === "TU_ACCESS_TOKEN";

    if (!usarMock) {
      throw new Error(
        "Mercado Pago real no está configurado en esta versión. Activá MP_MOCK=true para usar pago simulado.",
      );
    }

    await aprobarPago(pago._id);

    return {
      tipo: "mercadopago",
      init_point: `${process.env.FRONTEND_URL || "http://localhost:5173"}/pago-exitoso`,
      mensaje: "Pago simulado correctamente.",
    };
  }

  throw new Error("Método de pago no soportado");
};

const listarPagos = async () => {
  return await Pago.find()
    .sort({ createdAt: -1 })
    .populate("usuario", "nombre apellido email")
    .populate("metodoPago")
    .populate({
      path: "compra",
      populate: {
        path: "detalles",
        populate: {
          path: "curso",
          select: "titulo precio",
        },
      },
    });
};

module.exports = {
  crearPago,
  buscarPagoPorId,
  listarPagos,
  aprobarPago,
  rechazarPago,
  procesarPago,
};
