const Curso = require("../models/curso.model");
const Categoria = require("../models/categoria.model");
const Leccion = require("../models/leccion.model");
const EstadoContenido = require("../enums/estadoContenido");

const populateCategoria = {
  path: "categoria",
};

const populateLecciones = {
  path: "lecciones",
  select: "titulo descripcion duracionMinutos orden estado",
  options: { sort: { orden: 1 } },
};

class CursoService {
  async crearCurso(datosCurso) {
    if (!datosCurso.categoria) {
      throw new Error("El curso debe tener una categoría");
    }

    const categoriaExistente = await Categoria.findById(datosCurso.categoria);

    if (!categoriaExistente) {
      throw new Error("La categoría indicada no existe");
    }

    const curso = new Curso(datosCurso);
    const cursoGuardado = await curso.save();

    return await Curso.findById(cursoGuardado._id)
      .populate(populateCategoria)
      .populate(populateLecciones);
  }

  async editarCurso(id, datosActualizados) {
    if (datosActualizados.categoria) {
      const categoriaExistente = await Categoria.findById(
        datosActualizados.categoria,
      );

      if (!categoriaExistente) {
        throw new Error("La categoría indicada no existe");
      }
    }

    return await Curso.findByIdAndUpdate(id, datosActualizados, {
      new: true,
      runValidators: true,
    })
      .populate(populateCategoria)
      .populate(populateLecciones);
  }

  async eliminarCurso(id) {
    const curso = await Curso.findById(id);

    if (!curso) {
      return null;
    }

    await Leccion.deleteMany({ curso: id });

    return await Curso.findByIdAndDelete(id);
  }

  async listarCursos(filtros = {}) {
    const filtroMongo = {};

    if (filtros.categoria) {
      filtroMongo.categoria = filtros.categoria;
    }

    if (filtros.estado) {
      filtroMongo.estado = filtros.estado;
    }

    return await Curso.find(filtroMongo)
      .sort({ fechaCreacion: -1 })
      .populate(populateCategoria)
      .populate(populateLecciones);
  }

  async buscarCursoPorId(id) {
    return await Curso.findById(id)
      .populate(populateCategoria)
      .populate(populateLecciones);
  }

  async publicarCurso(id) {
    return await Curso.findByIdAndUpdate(
      id,
      { estado: EstadoContenido.PUBLICADO },
      { new: true, runValidators: true },
    )
      .populate(populateCategoria)
      .populate(populateLecciones);
  }

  async ocultarCurso(id) {
    return await Curso.findByIdAndUpdate(
      id,
      { estado: EstadoContenido.OCULTO },
      { new: true, runValidators: true },
    )
      .populate(populateCategoria)
      .populate(populateLecciones);
  }
}

module.exports = new CursoService();
