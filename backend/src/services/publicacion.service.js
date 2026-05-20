const Publicacion = require("../models/publicacion.model");
const Categoria = require("../models/categoria.model");
const EstadoContenido = require("../enums/estadoContenido");

const crearPublicacion = async (datosPublicacion) => {
  if (!datosPublicacion.categoria) {
    throw new Error("La publicación debe tener una categoría");
  }

  const categoriaExistente = await Categoria.findById(
    datosPublicacion.categoria,
  );

  if (!categoriaExistente) {
    throw new Error("La categoría indicada no existe");
  }

  const nuevaPublicacion = new Publicacion(datosPublicacion);
  const guardada = await nuevaPublicacion.save();

  await Categoria.findByIdAndUpdate(guardada.categoria, {
    $addToSet: { publicaciones: guardada._id },
  });

  return await Publicacion.findById(guardada._id).populate("categoria");
};

const editarPublicacion = async (id, datosActualizados) => {
  const publicacionOriginal = await Publicacion.findById(id);

  if (!publicacionOriginal) {
    return null;
  }

  const categoriaOriginal = publicacionOriginal.categoria?.toString();
  const categoriaNueva = datosActualizados.categoria;

  if (categoriaNueva) {
    const categoriaExistente = await Categoria.findById(categoriaNueva);

    if (!categoriaExistente) {
      throw new Error("La nueva categoría indicada no existe");
    }
  }

  await Publicacion.findByIdAndUpdate(id, datosActualizados, {
    new: true,
    runValidators: true,
  });

  if (categoriaNueva && categoriaNueva.toString() !== categoriaOriginal) {
    await Categoria.findByIdAndUpdate(categoriaOriginal, {
      $pull: { publicaciones: publicacionOriginal._id },
    });

    await Categoria.findByIdAndUpdate(categoriaNueva, {
      $addToSet: { publicaciones: publicacionOriginal._id },
    });
  }

  return await Publicacion.findById(id).populate("categoria");
};

const eliminarPublicacion = async (id) => {
  const publicacionEliminada = await Publicacion.findByIdAndDelete(id);

  if (publicacionEliminada) {
    await Categoria.findByIdAndUpdate(publicacionEliminada.categoria, {
      $pull: { publicaciones: publicacionEliminada._id },
    });
  }

  return publicacionEliminada;
};

const listarPublicaciones = async (filtros = {}) => {
  const filtroMongo = {};

  if (filtros.estado) {
    filtroMongo.estado = filtros.estado;
  }

  if (filtros.categoria) {
    filtroMongo.categoria = filtros.categoria;
  }

  return await Publicacion.find(filtroMongo)
    .sort({ fechaCreacion: -1 })
    .populate("categoria");
};

const listarPublicacionesPublicas = async (filtros = {}) => {
  const filtroMongo = {
    estado: EstadoContenido.PUBLICADO,
  };

  if (filtros.categoria) {
    filtroMongo.categoria = filtros.categoria;
  }

  return await Publicacion.find(filtroMongo)
    .sort({ fechaCreacion: -1 })
    .populate("categoria");
};

const buscarPublicacionPorId = async (id) => {
  return await Publicacion.findById(id).populate("categoria");
};

const buscarPublicacionPublicaPorId = async (id) => {
  return await Publicacion.findOne({
    _id: id,
    estado: EstadoContenido.PUBLICADO,
  }).populate("categoria");
};

const publicarPublicacion = async (id) => {
  return await Publicacion.findByIdAndUpdate(
    id,
    { estado: EstadoContenido.PUBLICADO },
    { new: true, runValidators: true },
  ).populate("categoria");
};

const ocultarPublicacion = async (id) => {
  return await Publicacion.findByIdAndUpdate(
    id,
    { estado: EstadoContenido.OCULTO },
    { new: true, runValidators: true },
  ).populate("categoria");
};

module.exports = {
  crearPublicacion,
  editarPublicacion,
  eliminarPublicacion,
  listarPublicaciones,
  listarPublicacionesPublicas,
  buscarPublicacionPorId,
  buscarPublicacionPublicaPorId,
  publicarPublicacion,
  ocultarPublicacion,
};
