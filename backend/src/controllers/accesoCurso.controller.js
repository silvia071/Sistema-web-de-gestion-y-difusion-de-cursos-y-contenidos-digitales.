const mongoose = require("mongoose");
const AccesoCurso = require("../models/accesoCurso.model");
const Curso = require("../models/curso.model");

const esObjectIdValido = (id) => mongoose.Types.ObjectId.isValid(id);

const generarCodigoCertificado = (accesoId) => {
  const base = String(accesoId).slice(-8).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();

  return `MD-${base}-${random}`;
};

// Obtener cursos del usuario
const obtenerAccesosUsuario = async (req, res) => {
  try {
    const usuarioId = req.params.id || req.params.usuarioId;

    if (!usuarioId || !esObjectIdValido(usuarioId)) {
      return res.status(400).json({
        mensaje: "ID de usuario inválido",
      });
    }

    const accesos = await AccesoCurso.find({
      usuario: usuarioId,
      estado: "ACTIVO",
    })
      .populate({
        path: "curso",
      })
      .lean();

    const accesosValidos = accesos.filter((acceso) => acceso.curso);

    return res.status(200).json({
      mensaje: "Accesos obtenidos correctamente",
      datos: accesosValidos,
    });
  } catch (error) {
    return res.status(500).json({
      mensaje: "Error interno del servidor",
      error: error.message,
    });
  }
};

// Crear acceso manual desde administrador
const crearAccesoCurso = async (req, res) => {
  try {
    const { usuarioId, cursoId } = req.body;

    if (!usuarioId || !esObjectIdValido(usuarioId)) {
      return res.status(400).json({
        mensaje: "usuarioId es obligatorio y debe ser válido",
      });
    }

    if (!cursoId || !esObjectIdValido(cursoId)) {
      return res.status(400).json({
        mensaje: "cursoId es obligatorio y debe ser válido",
      });
    }

    const curso = await Curso.findById(cursoId);

    if (!curso) {
      return res.status(404).json({
        mensaje: "Curso no encontrado",
      });
    }

    const accesoExistente = await AccesoCurso.findOne({
      usuario: usuarioId,
      curso: cursoId,
    });

    if (accesoExistente) {
      return res.status(200).json({
        mensaje: "El usuario ya tiene acceso a este curso",
        datos: accesoExistente,
      });
    }

    const nuevoAcceso = await AccesoCurso.create({
      usuario: usuarioId,
      curso: cursoId,
      progreso: 0,
      estado: "ACTIVO",
      certificadoEmitido: false,
      fechaFinalizacion: null,
    });

    return res.status(201).json({
      mensaje: "Acceso manual creado correctamente",
      datos: nuevoAcceso,
    });
  } catch (error) {
    return res.status(500).json({
      mensaje: "Error interno del servidor",
      error: error.message,
    });
  }
};

// Actualizar progreso
const actualizarProgreso = async (req, res) => {
  try {
    const { leccionId } = req.body;
    const { id } = req.params;

    if (!id || !esObjectIdValido(id)) {
      return res.status(400).json({
        mensaje: "ID de acceso inválido",
      });
    }

    if (!leccionId || !esObjectIdValido(leccionId)) {
      return res.status(400).json({
        mensaje: "ID de lección inválido",
      });
    }

    const acceso = await AccesoCurso.findById(id);

    if (!acceso) {
      return res.status(404).json({
        mensaje: "Acceso al curso no encontrado",
      });
    }

    const esPropietario =
      acceso.usuario.toString() === req.usuario._id.toString();

    const esAdmin = req.usuario.rol === "ADMINISTRADOR";

    if (!esPropietario && !esAdmin) {
      return res.status(403).json({
        mensaje: "No tenés permiso para actualizar este progreso",
      });
    }

    const curso = await Curso.findById(acceso.curso).populate({
      path: "lecciones",
      match: { estado: "PUBLICADO" },
      options: { sort: { orden: 1 } },
    });

    if (!curso) {
      return res.status(404).json({
        mensaje: "Curso no encontrado",
      });
    }

    const leccionesPublicadas = curso.lecciones || [];
    const totalLecciones = leccionesPublicadas.length;

    if (totalLecciones === 0) {
      return res.status(400).json({
        mensaje: "El curso no tiene lecciones publicadas",
      });
    }

    const indiceLeccion = leccionesPublicadas.findIndex(
      (leccion) => leccion._id.toString() === leccionId.toString(),
    );

    if (indiceLeccion === -1) {
      return res.status(400).json({
        mensaje: "La lección no pertenece a este curso o no está publicada",
      });
    }

    if (!Array.isArray(acceso.leccionesCompletadas)) {
      acceso.leccionesCompletadas = [];
    }

    acceso.leccionesCompletadas = acceso.leccionesCompletadas.filter(
      (idCompletada) =>
        leccionesPublicadas.some(
          (leccion) => leccion._id.toString() === idCompletada.toString(),
        ),
    );

    const yaCompletada = acceso.leccionesCompletadas.some(
      (idCompletada) => idCompletada.toString() === leccionId.toString(),
    );

    if (!esAdmin && !yaCompletada && indiceLeccion > 0) {
      const leccionAnterior = leccionesPublicadas[indiceLeccion - 1];

      const anteriorCompletada = acceso.leccionesCompletadas.some(
        (idCompletada) =>
          idCompletada.toString() === leccionAnterior._id.toString(),
      );

      if (!anteriorCompletada) {
        return res.status(403).json({
          mensaje: "Debés completar la lección anterior antes de continuar",
        });
      }
    }

    if (!yaCompletada) {
      acceso.leccionesCompletadas.push(leccionId);
    }

    acceso.ultimaLeccion = leccionId;

    acceso.progreso = Math.round(
      (acceso.leccionesCompletadas.length / totalLecciones) * 100,
    );

    if (acceso.progreso >= 100) {
      acceso.progreso = 100;

      if (!acceso.certificadoEmitido) {
        acceso.certificadoEmitido = true;
        acceso.fechaFinalizacion = new Date();
        acceso.codigoCertificado = generarCodigoCertificado(acceso._id);
      }

      if (!acceso.fechaFinalizacion) {
        acceso.fechaFinalizacion = new Date();
      }

      if (!acceso.codigoCertificado) {
        acceso.codigoCertificado = generarCodigoCertificado(acceso._id);
      }
    }

    await acceso.save();

    return res.status(200).json({
      mensaje: "Progreso actualizado correctamente",
      datos: {
        acceso,
        progreso: acceso.progreso,
        ultimaLeccion: acceso.ultimaLeccion,
        leccionesCompletadas: acceso.leccionesCompletadas,
        certificadoEmitido: acceso.certificadoEmitido,
        codigoCertificado: acceso.codigoCertificado,
        fechaFinalizacion: acceso.fechaFinalizacion,
      },
    });
  } catch (error) {
    return res.status(500).json({
      mensaje: "Error interno del servidor",
      error: error.message,
    });
  }
};

module.exports = {
  obtenerAccesosUsuario,
  crearAccesoCurso,
  actualizarProgreso,
};
