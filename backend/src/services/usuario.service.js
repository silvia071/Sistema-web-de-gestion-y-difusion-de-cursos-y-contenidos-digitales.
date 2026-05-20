const Usuario = require("../models/usuario.model");
const bcrypt = require("bcrypt");
const AccesoCurso = require("../models/accesoCurso.model");
const EstadoCuenta = require("../enums/estadoCuenta");
const jwt = require("jsonwebtoken");

const registrarUsuario = async (datos, opciones = {}) => {
  if (!datos.contrasenia) {
    throw new Error("La contraseña es obligatoria");
  }

  const emailNormalizado = datos.email.trim().toLowerCase();

  const existente = await Usuario.findOne({ email: emailNormalizado });
  if (existente) {
    throw new Error("Ya existe un usuario con ese email");
  }

  const salt = await bcrypt.genSalt(10);
  const contraseniaHasheada = await bcrypt.hash(datos.contrasenia, salt);

  const nuevoUsuario = new Usuario({
    nombre: datos.nombre,
    apellido: datos.apellido,
    email: emailNormalizado,
    contrasenia: contraseniaHasheada,
    direccion: datos.direccion,
    telefono: datos.telefono,

    // Seguridad:
    // - Registro público: siempre CLIENTE.
    // - Registro desde admin: permite usar el rol enviado.
    rol: opciones.permitirRol ? datos.rol || "CLIENTE" : "CLIENTE",
  });

  return await nuevoUsuario.save();
};

const iniciarSesion = async (email, contrasenia) => {
  const emailLimpio = email.trim().toLowerCase();
  const usuario = await Usuario.findOne({ email: emailLimpio });

  if (!usuario) {
    throw new Error("Credenciales inválidas");
  }

  if (usuario.estadoCuenta !== EstadoCuenta.ACTIVO) {
    throw new Error(
      `La cuenta no está activa. Estado actual: ${usuario.estadoCuenta}`,
    );
  }

  const esValida = await bcrypt.compare(contrasenia, usuario.contrasenia);

  if (!esValida) {
    throw new Error("Credenciales inválidas");
  }

  usuario.fechaUltimoAcceso = new Date();
  await usuario.save();

  const token = jwt.sign(
    { id: usuario._id, rol: usuario.rol },
    process.env.JWT_SECRET,
    { expiresIn: "8h" },
  );

  return { usuario, token };
};

const cerrarSesion = async () => {
  return {
    mensaje: "Sesión cerrada correctamente",
  };
};

const listarUsuarios = async () => {
  return await Usuario.find();
};

const buscarUsuarioPorId = async (id) => {
  return await Usuario.findById(id);
};

const buscarUsuarioPorEmail = async (email) => {
  const emailNormalizado = email.trim().toLowerCase();
  const usuario = await Usuario.findOne({ email: emailNormalizado });

  if (!usuario) {
    throw new Error("No se encontró ningún usuario con ese email");
  }

  return usuario;
};

const editarPerfil = async (id, datosActualizados) => {
  const camposPermitidos = {
    nombre: datosActualizados.nombre,
    apellido: datosActualizados.apellido,
    direccion: datosActualizados.direccion,
    telefono: datosActualizados.telefono,
  };

  Object.keys(camposPermitidos).forEach((key) => {
    if (camposPermitidos[key] === undefined) {
      delete camposPermitidos[key];
    }
  });

  const usuarioActualizado = await Usuario.findByIdAndUpdate(
    id,
    camposPermitidos,
    {
      returnDocument: "after",
      runValidators: true,
    },
  );

  if (!usuarioActualizado) {
    throw new Error("Usuario no encontrado");
  }

  return usuarioActualizado;
};

const cambiarContrasenia = async (id, datos) => {
  const usuario = await Usuario.findById(id);

  if (!usuario) {
    throw new Error("Usuario no encontrado");
  }

  const { contraseniaActual, nuevaContrasenia } = datos;

  if (!contraseniaActual || !nuevaContrasenia) {
    throw new Error(
      "La contraseña actual y la nueva contraseña son obligatorias",
    );
  }

  const coincide = await bcrypt.compare(contraseniaActual, usuario.contrasenia);

  if (!coincide) {
    throw new Error("La contraseña actual es incorrecta");
  }

  if (nuevaContrasenia.length < 6) {
    throw new Error("La nueva contraseña debe tener al menos 6 caracteres");
  }

  const mismaContrasenia = await bcrypt.compare(
    nuevaContrasenia,
    usuario.contrasenia,
  );

  if (mismaContrasenia) {
    throw new Error("La nueva contraseña no puede ser igual a la actual");
  }

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(nuevaContrasenia, salt);

  usuario.contrasenia = hash;
  return await usuario.save();
};

const eliminarUsuario = async (id) => {
  return await Usuario.findByIdAndDelete(id);
};

const bloquearUsuario = async (id) => {
  return await Usuario.findByIdAndUpdate(
    id,
    { estadoCuenta: EstadoCuenta.BLOQUEADO },
    { returnDocument: "after" },
  );
};

const activarUsuario = async (id) => {
  const usuarioActualizado = await Usuario.findByIdAndUpdate(
    id,
    { estadoCuenta: EstadoCuenta.ACTIVO },
    { returnDocument: "after" },
  );

  if (!usuarioActualizado) {
    throw new Error("Usuario no encontrado");
  }

  return usuarioActualizado;
};

const cambiarRol = async (id, nuevoRol) => {
  return await Usuario.findByIdAndUpdate(
    id,
    { rol: nuevoRol },
    { returnDocument: "after", runValidators: true },
  );
};

const actualizarEmail = async (id, nuevoEmail) => {
  const emailNormalizado = nuevoEmail.trim().toLowerCase();

  const existente = await Usuario.findOne({ email: emailNormalizado });
  if (existente && existente._id.toString() !== id) {
    throw new Error("Ya existe un usuario con ese email");
  }

  const usuario = await Usuario.findByIdAndUpdate(
    id,
    { email: emailNormalizado },
    { returnDocument: "after", runValidators: true },
  );

  if (!usuario) {
    throw new Error("Usuario no encontrado");
  }

  return usuario;
};

const actualizarDireccion = async (id, nuevaDireccion) => {
  const usuario = await Usuario.findByIdAndUpdate(
    id,
    { direccion: nuevaDireccion },
    { returnDocument: "after", runValidators: true },
  );

  if (!usuario) {
    throw new Error("No se encontró el usuario para actualizar la dirección");
  }

  return usuario;
};

const actualizarTelefono = async (id, nuevoTelefono) => {
  const usuario = await Usuario.findByIdAndUpdate(
    id,
    { telefono: nuevoTelefono },
    { returnDocument: "after", runValidators: true },
  );

  if (!usuario) {
    throw new Error("No se encontró el usuario para actualizar el teléfono");
  }

  return usuario;
};

const listarCursosAdquiridos = async (usuarioId) => {
  const accesos = await AccesoCurso.find({
    usuario: usuarioId,
    estado: "ACTIVO",
  }).populate("curso");

  return accesos.map((acceso) => acceso.curso);
};

module.exports = {
  registrarUsuario,
  iniciarSesion,
  cerrarSesion,
  listarUsuarios,
  buscarUsuarioPorId,
  buscarUsuarioPorEmail,
  editarPerfil,
  cambiarContrasenia,
  eliminarUsuario,
  bloquearUsuario,
  activarUsuario,
  cambiarRol,
  actualizarEmail,
  actualizarDireccion,
  actualizarTelefono,
  listarCursosAdquiridos,
};
