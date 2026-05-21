const Carrito = require("../models/carrito.model");
const ItemCarrito = require("../models/itemCarrito.model");
const EstadoCarrito = require("../enums/estadoCarrito");
const Curso = require("../models/curso.model");
const AccesoCurso = require("../models/accesoCurso.model");
const Compra = require("../models/compra.model");
const DetalleCompra = require("../models/detalleCompra.model");

const validarPropietarioCarrito = (carrito, usuarioId) => {
  if (!usuarioId) {
    throw new Error("El usuario es obligatorio");
  }

  if (carrito.usuario.toString() !== usuarioId.toString()) {
    throw new Error("No tenés permiso para operar este carrito");
  }
};

const crearCarrito = async (usuarioId) => {
  if (!usuarioId) {
    throw new Error("El usuario es obligatorio");
  }

  const carritoExistente = await Carrito.findOne({
    usuario: usuarioId,
    estado: EstadoCarrito.ABIERTO,
  }).populate({
    path: "items",
    populate: {
      path: "curso",
    },
  });

  if (carritoExistente) {
    return carritoExistente;
  }

  return await Carrito.create({
    usuario: usuarioId,
    items: [],
    estado: EstadoCarrito.ABIERTO,
  });
};

const obtenerCarritoActivo = async (id, usuarioId) => {
  const carrito = await Carrito.findById(id).populate({
    path: "items",
    populate: {
      path: "curso",
    },
  });

  if (!carrito) throw new Error("Carrito no encontrado");

  validarPropietarioCarrito(carrito, usuarioId);

  if (carrito.estado !== EstadoCarrito.ABIERTO) {
    throw new Error("Carrito no activo");
  }

  return carrito;
};

const validarCursoDisponibleParaUsuario = async (usuarioId, idCurso) => {
  const accesoExistente = await AccesoCurso.findOne({
    usuario: usuarioId,
    curso: idCurso,
    estado: "ACTIVO",
  });

  if (accesoExistente) {
    throw new Error("Ya tenés acceso a este curso");
  }

  const detallesDelCurso = await DetalleCompra.find({
    curso: idCurso,
  }).select("_id");

  const detallesIds = detallesDelCurso.map((detalle) => detalle._id);

  if (detallesIds.length === 0) {
    return;
  }

  const compraPendiente = await Compra.findOne({
    usuario: usuarioId,
    detalles: { $in: detallesIds },
    estado: { $in: ["PENDIENTE", "EN_PROCESO"] },
  });

  if (compraPendiente) {
    throw new Error(
      "Ya tenés una compra pendiente de aprobación para este curso",
    );
  }
};

const agregarCursoAlCarrito = async (idCarrito, idCurso, usuarioId) => {
  const curso = await Curso.findById(idCurso);

  if (!curso) {
    throw new Error("Curso no existe");
  }

  if (curso.estado !== "PUBLICADO") {
    throw new Error("Este curso no está disponible para la compra");
  }

  const carrito = await Carrito.findById(idCarrito).populate("items");

  if (!carrito) {
    throw new Error("Carrito no encontrado");
  }

  validarPropietarioCarrito(carrito, usuarioId);

  if (carrito.estado !== EstadoCarrito.ABIERTO) {
    throw new Error("Carrito no activo");
  }

  await validarCursoDisponibleParaUsuario(carrito.usuario, idCurso);

  const itemExistente = await ItemCarrito.findOne({
    _id: { $in: carrito.items.map((item) => item._id) },
    curso: idCurso,
  });

  if (itemExistente) {
    throw new Error("El curso ya está en el carrito");
  }

  const item = await ItemCarrito.create({
    curso: idCurso,
    precioUnitario: curso.precio,
  });

  carrito.agregarItem(item._id);
  await carrito.save();

  return await Carrito.findById(idCarrito).populate({
    path: "items",
    populate: {
      path: "curso",
    },
  });
};

const eliminarItemDelCarrito = async (idCarrito, idItem, usuarioId) => {
  const carrito = await Carrito.findById(idCarrito);

  if (!carrito) {
    throw new Error("Carrito no encontrado");
  }

  validarPropietarioCarrito(carrito, usuarioId);

  if (carrito.estado !== EstadoCarrito.ABIERTO) {
    throw new Error("Carrito no activo");
  }

  carrito.eliminarItem(idItem);
  await carrito.save();

  await ItemCarrito.findByIdAndDelete(idItem);

  return await Carrito.findById(idCarrito).populate({
    path: "items",
    populate: {
      path: "curso",
    },
  });
};

const vaciarCarrito = async (idCarrito, usuarioId) => {
  const carrito = await Carrito.findById(idCarrito);

  if (!carrito) {
    throw new Error("Carrito no encontrado");
  }

  validarPropietarioCarrito(carrito, usuarioId);

  if (carrito.estado !== EstadoCarrito.ABIERTO) {
    throw new Error("Carrito no activo");
  }

  const itemsIds = [...carrito.items];

  carrito.vaciar();
  await carrito.save();

  await ItemCarrito.deleteMany({
    _id: { $in: itemsIds },
  });

  return await Carrito.findById(idCarrito).populate({
    path: "items",
    populate: {
      path: "curso",
    },
  });
};

const calcularTotalCarrito = async (idCarrito, usuarioId) => {
  const carrito = await Carrito.findById(idCarrito).populate("items");

  if (!carrito) {
    throw new Error("Carrito no encontrado");
  }

  validarPropietarioCarrito(carrito, usuarioId);

  let total = 0;

  carrito.items.forEach((item) => {
    total += Number(item.precioUnitario || 0);
  });

  return total;
};

module.exports = {
  crearCarrito,
  obtenerCarritoActivo,
  agregarCursoAlCarrito,
  eliminarItemDelCarrito,
  vaciarCarrito,
  calcularTotalCarrito,
};
