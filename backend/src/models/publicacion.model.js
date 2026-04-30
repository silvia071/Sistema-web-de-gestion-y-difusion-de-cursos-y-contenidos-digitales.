const mongoose = require("mongoose");
const EstadoContenido = require("../enums/estadoContenido");

const publicacionSchema = new mongoose.Schema(
  {
    titulo: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 120,
      validate: {
        validator: function (valor) {
          return valor && valor.trim().length > 0;
        },
        message: "El título no puede estar vacío",
      },
    },

    contenido: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 5000,
      validate: {
        validator: function (valor) {
          return valor && valor.trim().length > 0;
        },
        message: "El contenido no puede estar vacío",
      },
    },

    // 🔥 NUEVO CAMPO
    imagen: {
      type: String,
      default: "",
    },

    fechaPublicacion: {
      type: Date,
      default: Date.now,
    },

    estado: {
      type: String,
      enum: Object.values(EstadoContenido),
      default: EstadoContenido.BORRADOR,
    },

    categoria: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Categoria",
      required: true,
    },
  },
  {
    versionKey: false,
  },
);

publicacionSchema.methods.actualizarTitulo = function (nuevoTitulo) {
  this.titulo = nuevoTitulo;
};

publicacionSchema.methods.actualizarContenido = function (nuevoContenido) {
  this.contenido = nuevoContenido;
};

publicacionSchema.methods.asignarCategoria = function (categoriaId) {
  this.categoria = categoriaId;
};

publicacionSchema.methods.cambiarEstado = function (nuevoEstado) {
  this.estado = nuevoEstado;
};

publicacionSchema.methods.estaPublicado = function () {
  return this.estado === EstadoContenido.PUBLICADO;
};

publicacionSchema.methods.mostrarPublicacion = function () {
  return {
    id: this._id,
    titulo: this.titulo,
    contenido: this.contenido,
    imagen: this.imagen, // 👈 importante
    fechaPublicacion: this.fechaPublicacion,
    estado: this.estado,
    categoria: this.categoria,
  };
};

module.exports = mongoose.model("Publicacion", publicacionSchema);
