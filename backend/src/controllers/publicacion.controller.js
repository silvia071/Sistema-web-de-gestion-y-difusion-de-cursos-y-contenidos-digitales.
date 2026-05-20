const mongoose = require("mongoose");
const PublicacionService = require("../services/publicacion.service");
const EstadoContenido = require("../enums/estadoContenido");

const getPublicaciones = async (req, res) => {
  try {
    const { categoria } = req.query;
    const filtros = {};

    if (categoria) {
      if (!mongoose.Types.ObjectId.isValid(categoria)) {
        return res.status(400).json({
          mensaje: "ID de categoría inválido",
        });
      }

      filtros.categoria = categoria;
    }

    const publicaciones =
      await PublicacionService.listarPublicacionesPublicas(filtros);

    return res.status(200).json(publicaciones);
  } catch (error) {
    return res.status(500).json({
      mensaje: "Error al obtener publicaciones",
      error: error.message,
    });
  }
};

const getPublicacionesAdmin = async (req, res) => {
  try {
    const { categoria, estado } = req.query;
    const filtros = {};

    if (categoria) {
      if (!mongoose.Types.ObjectId.isValid(categoria)) {
        return res.status(400).json({
          mensaje: "ID de categoría inválido",
        });
      }

      filtros.categoria = categoria;
    }

    if (estado) {
      const estadoNormalizado = estado.trim().toUpperCase();

      if (!Object.values(EstadoContenido).includes(estadoNormalizado)) {
        return res.status(400).json({
          mensaje: "Estado inválido",
        });
      }

      filtros.estado = estadoNormalizado;
    }

    const publicaciones = await PublicacionService.listarPublicaciones(filtros);

    return res.status(200).json(publicaciones);
  } catch (error) {
    return res.status(500).json({
      mensaje: "Error al obtener publicaciones",
      error: error.message,
    });
  }
};

const getPublicacionById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ mensaje: "ID de publicación inválido" });
    }

    const publicacion =
      await PublicacionService.buscarPublicacionPublicaPorId(id);

    if (!publicacion) {
      return res.status(404).json({ mensaje: "Publicación no encontrada" });
    }

    return res.status(200).json(publicacion);
  } catch (error) {
    return res.status(500).json({
      mensaje: "Error al buscar publicación",
      error: error.message,
    });
  }
};

const getPublicacionAdminById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ mensaje: "ID de publicación inválido" });
    }

    const publicacion = await PublicacionService.buscarPublicacionPorId(id);

    if (!publicacion) {
      return res.status(404).json({ mensaje: "Publicación no encontrada" });
    }

    return res.status(200).json(publicacion);
  } catch (error) {
    return res.status(500).json({
      mensaje: "Error al buscar publicación",
      error: error.message,
    });
  }
};

const createPublicacion = async (req, res) => {
  try {
    const { titulo, contenido, categoria } = req.body;

    if (!titulo?.trim() || !contenido?.trim() || !categoria) {
      return res.status(400).json({
        mensaje: "Título, contenido y categoría son obligatorios",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(categoria)) {
      return res.status(400).json({
        mensaje: "ID de categoría inválido",
      });
    }

    const nuevaPublicacion = await PublicacionService.crearPublicacion(
      req.body,
    );

    return res.status(201).json(nuevaPublicacion);
  } catch (error) {
    if (error.message === "La categoría indicada no existe") {
      return res.status(400).json({
        mensaje: error.message,
      });
    }

    return res.status(500).json({
      mensaje: "Error al crear publicación",
      error: error.message,
    });
  }
};

const updatePublicacion = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ mensaje: "ID de publicación inválido" });
    }

    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({
        mensaje: "Debe enviar datos para actualizar",
      });
    }

    if (
      req.body.categoria &&
      !mongoose.Types.ObjectId.isValid(req.body.categoria)
    ) {
      return res.status(400).json({
        mensaje: "ID de categoría inválido",
      });
    }

    if (req.body.estado) {
      const estadoNormalizado = req.body.estado.trim().toUpperCase();

      if (!Object.values(EstadoContenido).includes(estadoNormalizado)) {
        return res.status(400).json({
          mensaje: "Estado inválido",
        });
      }

      req.body.estado = estadoNormalizado;
    }

    const actualizada = await PublicacionService.editarPublicacion(
      id,
      req.body,
    );

    if (!actualizada) {
      return res.status(404).json({ mensaje: "Publicación no encontrada" });
    }

    return res.status(200).json(actualizada);
  } catch (error) {
    if (error.message === "La nueva categoría indicada no existe") {
      return res.status(400).json({
        mensaje: error.message,
      });
    }

    return res.status(500).json({
      mensaje: "Error al actualizar publicación",
      error: error.message,
    });
  }
};

const deletePublicacion = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ mensaje: "ID de publicación inválido" });
    }

    const eliminada = await PublicacionService.eliminarPublicacion(id);

    if (!eliminada) {
      return res.status(404).json({ mensaje: "Publicación no encontrada" });
    }

    return res.status(200).json({
      mensaje: "Publicación eliminada correctamente",
    });
  } catch (error) {
    return res.status(500).json({
      mensaje: "Error al eliminar publicación",
      error: error.message,
    });
  }
};

const publicarPublicacion = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ mensaje: "ID de publicación inválido" });
    }

    const publicada = await PublicacionService.publicarPublicacion(id);

    if (!publicada) {
      return res.status(404).json({ mensaje: "Publicación no encontrada" });
    }

    return res.status(200).json(publicada);
  } catch (error) {
    return res.status(500).json({
      mensaje: "Error al publicar publicación",
      error: error.message,
    });
  }
};

const ocultarPublicacion = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ mensaje: "ID de publicación inválido" });
    }

    const oculta = await PublicacionService.ocultarPublicacion(id);

    if (!oculta) {
      return res.status(404).json({ mensaje: "Publicación no encontrada" });
    }

    return res.status(200).json(oculta);
  } catch (error) {
    return res.status(500).json({
      mensaje: "Error al ocultar publicación",
      error: error.message,
    });
  }
};

module.exports = {
  getPublicaciones,
  getPublicacionesAdmin,
  getPublicacionById,
  getPublicacionAdminById,
  createPublicacion,
  updatePublicacion,
  deletePublicacion,
  publicarPublicacion,
  ocultarPublicacion,
};
