const mongoose = require("mongoose");
const Resenia = require("../models/resenia.model");
const Curso = require("../models/curso.model");
const AccesoCurso = require("../models/accesoCurso.model");

const validarObjectId = (id, mensaje = "ID inválido") => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error(mensaje);
    error.statusCode = 400;
    throw error;
  }
};

const verificarCursoExiste = async (cursoId) => {
  validarObjectId(cursoId, "ID de curso inválido");

  const curso = await Curso.findById(cursoId);

  if (!curso) {
    const error = new Error("El curso no existe");
    error.statusCode = 404;
    throw error;
  }

  return curso;
};

const verificarAccesoAlCurso = async (usuarioId, cursoId) => {
  const acceso = await AccesoCurso.findOne({
    usuario: usuarioId,
    curso: cursoId,
    estado: "ACTIVO",
  });

  if (!acceso) {
    const error = new Error("Solo podés reseñar cursos a los que tenés acceso");
    error.statusCode = 403;
    throw error;
  }

  return acceso;
};

const obtenerResumenCurso = async (cursoId) => {
  const resumen = await Resenia.aggregate([
    {
      $match: {
        curso: new mongoose.Types.ObjectId(cursoId),
      },
    },
    {
      $group: {
        _id: "$curso",
        promedio: { $avg: "$puntaje" },
        cantidad: { $sum: 1 },
      },
    },
  ]);

  if (resumen.length === 0) {
    return {
      promedio: 0,
      cantidad: 0,
    };
  }

  return {
    promedio: Number(resumen[0].promedio.toFixed(1)),
    cantidad: resumen[0].cantidad,
  };
};

const listarPorCurso = async (cursoId) => {
  await verificarCursoExiste(cursoId);

  const resenias = await Resenia.find({ curso: cursoId })
    .populate("usuario", "nombre apellido email")
    .sort({ fechaCreacion: -1 });

  const resumen = await obtenerResumenCurso(cursoId);

  return {
    resenias,
    resumen,
  };
};

const obtenerMiResenia = async (usuarioId, cursoId) => {
  validarObjectId(cursoId, "ID de curso inválido");

  return Resenia.findOne({
    usuario: usuarioId,
    curso: cursoId,
  });
};

const crearResenia = async ({ usuarioId, cursoId, puntaje, comentario }) => {
  await verificarCursoExiste(cursoId);
  await verificarAccesoAlCurso(usuarioId, cursoId);

  const puntajeNumerico = Number(puntaje);

  if (
    !Number.isInteger(puntajeNumerico) ||
    puntajeNumerico < 1 ||
    puntajeNumerico > 5
  ) {
    const error = new Error("El puntaje debe ser un número entero entre 1 y 5");
    error.statusCode = 400;
    throw error;
  }

  if (!comentario || String(comentario).trim().length < 5) {
    const error = new Error("El comentario debe tener al menos 5 caracteres");
    error.statusCode = 400;
    throw error;
  }

  const reseniaExistente = await Resenia.findOne({
    usuario: usuarioId,
    curso: cursoId,
  });

  if (reseniaExistente) {
    const error = new Error("Ya realizaste una reseña para este curso");
    error.statusCode = 409;
    throw error;
  }

  const nuevaResenia = await Resenia.create({
    usuario: usuarioId,
    curso: cursoId,
    puntaje: puntajeNumerico,
    comentario: String(comentario).trim(),
  });

  return nuevaResenia.populate("usuario", "nombre apellido email");
};

const editarResenia = async ({ usuarioId, reseniaId, puntaje, comentario }) => {
  validarObjectId(reseniaId, "ID de reseña inválido");

  const resenia = await Resenia.findById(reseniaId);

  if (!resenia) {
    const error = new Error("La reseña no existe");
    error.statusCode = 404;
    throw error;
  }

  if (String(resenia.usuario) !== String(usuarioId)) {
    const error = new Error("No podés editar una reseña que no te pertenece");
    error.statusCode = 403;
    throw error;
  }

  if (puntaje !== undefined) {
    const puntajeNumerico = Number(puntaje);

    if (
      !Number.isInteger(puntajeNumerico) ||
      puntajeNumerico < 1 ||
      puntajeNumerico > 5
    ) {
      const error = new Error(
        "El puntaje debe ser un número entero entre 1 y 5",
      );
      error.statusCode = 400;
      throw error;
    }

    resenia.puntaje = puntajeNumerico;
  }

  if (comentario !== undefined) {
    if (!comentario || String(comentario).trim().length < 5) {
      const error = new Error("El comentario debe tener al menos 5 caracteres");
      error.statusCode = 400;
      throw error;
    }

    resenia.comentario = String(comentario).trim();
  }

  await resenia.save();

  return resenia.populate("usuario", "nombre apellido email");
};

const eliminarResenia = async (usuarioId, reseniaId) => {
  validarObjectId(reseniaId, "ID de reseña inválido");

  const resenia = await Resenia.findById(reseniaId);

  if (!resenia) {
    const error = new Error("La reseña no existe");
    error.statusCode = 404;
    throw error;
  }

  if (String(resenia.usuario) !== String(usuarioId)) {
    const error = new Error("No podés eliminar una reseña que no te pertenece");
    error.statusCode = 403;
    throw error;
  }

  await Resenia.findByIdAndDelete(reseniaId);

  return resenia;
};

const obtenerResumenesPorCursos = async (cursosIds) => {
  const idsValidos = cursosIds
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));

  if (idsValidos.length === 0) {
    return {};
  }

  const resumenes = await Resenia.aggregate([
    {
      $match: {
        curso: { $in: idsValidos },
      },
    },
    {
      $group: {
        _id: "$curso",
        promedio: { $avg: "$puntaje" },
        cantidad: { $sum: 1 },
      },
    },
  ]);

  return resumenes.reduce((acc, item) => {
    acc[item._id.toString()] = {
      promedio: Number(item.promedio.toFixed(1)),
      cantidad: item.cantidad,
    };

    return acc;
  }, {});
};

module.exports = {
  listarPorCurso,
  obtenerMiResenia,
  crearResenia,
  editarResenia,
  eliminarResenia,
  obtenerResumenCurso,
  obtenerResumenesPorCursos,
};
