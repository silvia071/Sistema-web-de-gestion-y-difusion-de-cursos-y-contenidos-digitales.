const mongoose = require("mongoose");
const Favorito = require("../models/favorito.model");
const Curso = require("../models/curso.model");
const reseniaService = require("./resenia.service");

const agregarResumenReseniasAFavoritos = async (favoritos) => {
  const cursosIds = favoritos
    .map((favorito) => favorito?.curso?._id)
    .filter(Boolean)
    .map((id) => String(id));

  const resumenes = await reseniaService.obtenerResumenesPorCursos(cursosIds);

  return favoritos.map((favorito) => {
    const favoritoPlano =
      typeof favorito.toObject === "function" ? favorito.toObject() : favorito;

    if (!favoritoPlano.curso) return favoritoPlano;

    const resumen = resumenes[String(favoritoPlano.curso._id)] || {
      promedio: 0,
      cantidad: 0,
    };

    return {
      ...favoritoPlano,
      curso: {
        ...favoritoPlano.curso,
        promedioResenias: resumen.promedio,
        cantidadResenias: resumen.cantidad,
      },
    };
  });
};

const listarFavoritosPorUsuario = async (usuarioId) => {
  const favoritos = await Favorito.find({ usuario: usuarioId })
    .populate({
      path: "curso",
      populate: {
        path: "categoria",
        select: "nombre",
      },
    })
    .sort({ fechaAgregado: -1 });

  return agregarResumenReseniasAFavoritos(favoritos);
};

const obtenerIdsCursosFavoritos = async (usuarioId) => {
  const favoritos = await Favorito.find({ usuario: usuarioId }).select("curso");

  return favoritos.map((favorito) => favorito.curso.toString());
};

const agregarFavorito = async (usuarioId, cursoId) => {
  if (!mongoose.Types.ObjectId.isValid(cursoId)) {
    const error = new Error("ID de curso inválido");
    error.statusCode = 400;
    throw error;
  }

  const cursoExiste = await Curso.findById(cursoId);

  if (!cursoExiste) {
    const error = new Error("El curso no existe");
    error.statusCode = 404;
    throw error;
  }

  const favoritoExistente = await Favorito.findOne({
    usuario: usuarioId,
    curso: cursoId,
  });

  if (favoritoExistente) {
    return favoritoExistente;
  }

  const nuevoFavorito = new Favorito({
    usuario: usuarioId,
    curso: cursoId,
  });

  return nuevoFavorito.save();
};

const quitarFavorito = async (usuarioId, cursoId) => {
  if (!mongoose.Types.ObjectId.isValid(cursoId)) {
    const error = new Error("ID de curso inválido");
    error.statusCode = 400;
    throw error;
  }

  const favoritoEliminado = await Favorito.findOneAndDelete({
    usuario: usuarioId,
    curso: cursoId,
  });

  if (!favoritoEliminado) {
    const error = new Error("El curso no estaba en favoritos");
    error.statusCode = 404;
    throw error;
  }

  return favoritoEliminado;
};

const alternarFavorito = async (usuarioId, cursoId) => {
  if (!mongoose.Types.ObjectId.isValid(cursoId)) {
    const error = new Error("ID de curso inválido");
    error.statusCode = 400;
    throw error;
  }

  const favoritoExistente = await Favorito.findOne({
    usuario: usuarioId,
    curso: cursoId,
  });

  if (favoritoExistente) {
    await Favorito.findByIdAndDelete(favoritoExistente._id);

    return {
      esFavorito: false,
      mensaje: "Curso quitado de favoritos",
    };
  }

  const cursoExiste = await Curso.findById(cursoId);

  if (!cursoExiste) {
    const error = new Error("El curso no existe");
    error.statusCode = 404;
    throw error;
  }

  await Favorito.create({
    usuario: usuarioId,
    curso: cursoId,
  });

  return {
    esFavorito: true,
    mensaje: "Curso agregado a favoritos",
  };
};

module.exports = {
  listarFavoritosPorUsuario,
  obtenerIdsCursosFavoritos,
  agregarFavorito,
  quitarFavorito,
  alternarFavorito,
};
