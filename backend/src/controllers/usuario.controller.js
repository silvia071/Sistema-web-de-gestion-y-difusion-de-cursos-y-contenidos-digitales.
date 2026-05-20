const usuarioService = require("../services/usuario.service");

const registrarUsuario = async (req, res) => {
  try {
    const permitirRol = req.usuario?.rol === "ADMINISTRADOR";

    const usuario = await usuarioService.registrarUsuario(req.body, {
      permitirRol,
    });

    return res.status(201).json({
      mensaje: "Usuario registrado correctamente",
      datos: {
        id: usuario._id,
        _id: usuario._id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        rol: usuario.rol,
        estadoCuenta: usuario.estadoCuenta,
      },
    });
  } catch (error) {
    return res.status(400).json({
      mensaje: "Error en el registro de usuario",
      error: error.message,
    });
  }
};

const iniciarSesion = async (req, res) => {
  try {
    const { email, contrasenia } = req.body;

    if (!email || !contrasenia) {
      return res.status(400).json({
        mensaje: "Email y contraseña son obligatorios",
      });
    }

    const { usuario, token } = await usuarioService.iniciarSesion(
      email,
      contrasenia,
    );

    return res.status(200).json({
      mensaje: "Inicio de sesión correcto",
      token,
      usuario: {
        _id: usuario._id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        rol: usuario.rol,
      },
    });
  } catch (error) {
    return res.status(401).json({
      mensaje: "Error al iniciar sesión",
      error: error.message,
    });
  }
};

const listarUsuarios = async (req, res) => {
  try {
    const usuarios = await usuarioService.listarUsuarios();

    return res.status(200).json({
      mensaje: "Usuarios obtenidos correctamente",
      datos: usuarios,
    });
  } catch (error) {
    return res.status(500).json({
      mensaje: "Error al obtener usuarios",
      error: error.message,
    });
  }
};

const buscarUsuarioPorId = async (req, res) => {
  try {
    const usuario = await usuarioService.buscarUsuarioPorId(req.params.id);

    if (!usuario) {
      return res.status(404).json({
        mensaje: "Usuario no encontrado",
      });
    }

    return res.status(200).json({
      mensaje: "Usuario obtenido correctamente",
      datos: usuario,
    });
  } catch (error) {
    return res.status(400).json({
      mensaje: "Error al buscar usuario",
      error: error.message,
    });
  }
};

const buscarUsuarioPorEmail = async (req, res) => {
  try {
    const { email } = req.params;

    const usuario = await usuarioService.buscarUsuarioPorEmail(email);

    if (!usuario) {
      return res.status(404).json({
        mensaje: "No existe un usuario con ese email",
      });
    }

    return res.status(200).json({
      mensaje: "Usuario obtenido correctamente",
      datos: usuario,
    });
  } catch (error) {
    return res.status(400).json({
      mensaje: "Error en la búsqueda del usuario",
      error: error.message,
    });
  }
};

const editarPerfil = async (req, res) => {
  try {
    const { id } = req.params;

    const usuario = await usuarioService.editarPerfil(id, req.body);

    if (!usuario) {
      return res.status(404).json({
        mensaje: "Usuario no encontrado",
      });
    }

    return res.status(200).json({
      mensaje: "Perfil actualizado correctamente",
      datos: usuario,
    });
  } catch (error) {
    return res.status(500).json({
      mensaje: "Error al editar perfil",
      error: error.message,
    });
  }
};

const cambiarContrasenia = async (req, res) => {
  try {
    const { id } = req.params;

    await usuarioService.cambiarContrasenia(id, req.body);

    return res.status(200).json({
      mensaje: "Contraseña actualizada correctamente",
    });
  } catch (error) {
    return res.status(400).json({
      mensaje: "Error al cambiar contraseña",
      error: error.message,
    });
  }
};

const eliminarUsuario = async (req, res) => {
  try {
    const usuarioEliminado = await usuarioService.eliminarUsuario(
      req.params.id,
    );

    if (!usuarioEliminado) {
      return res.status(404).json({
        mensaje: "Usuario no encontrado",
      });
    }

    return res.status(200).json({
      mensaje: "Usuario eliminado correctamente",
    });
  } catch (error) {
    return res.status(400).json({
      mensaje: "Error al eliminar usuario",
      error: error.message,
    });
  }
};

const bloquearUsuario = async (req, res) => {
  try {
    const usuario = await usuarioService.bloquearUsuario(req.params.id);

    if (!usuario) {
      return res.status(404).json({
        mensaje: "Usuario no encontrado",
      });
    }

    return res.status(200).json({
      mensaje: "Usuario bloqueado correctamente",
      datos: usuario,
    });
  } catch (error) {
    return res.status(400).json({
      mensaje: "Error al bloquear usuario",
      error: error.message,
    });
  }
};

const activarUsuario = async (req, res) => {
  try {
    const usuario = await usuarioService.activarUsuario(req.params.id);

    if (!usuario) {
      return res.status(404).json({
        mensaje: "Usuario no encontrado",
      });
    }

    return res.status(200).json({
      mensaje: "Usuario activado correctamente",
      datos: usuario,
    });
  } catch (error) {
    return res.status(400).json({
      mensaje: "Error al activar usuario",
      error: error.message,
    });
  }
};

const cambiarRol = async (req, res) => {
  try {
    const { nuevoRol } = req.body;

    const usuario = await usuarioService.cambiarRol(req.params.id, nuevoRol);

    if (!usuario) {
      return res.status(404).json({
        mensaje: "Usuario no encontrado",
      });
    }

    return res.status(200).json({
      mensaje: "Rol actualizado correctamente",
      datos: usuario,
    });
  } catch (error) {
    return res.status(400).json({
      mensaje: "Error al cambiar rol",
      error: error.message,
    });
  }
};

const actualizarEmail = async (req, res) => {
  try {
    const { nuevoEmail } = req.body;

    const usuario = await usuarioService.actualizarEmail(
      req.params.id,
      nuevoEmail,
    );

    if (!usuario) {
      return res.status(404).json({
        mensaje: "Usuario no encontrado",
      });
    }

    return res.status(200).json({
      mensaje: "Email actualizado correctamente",
      datos: usuario,
    });
  } catch (error) {
    return res.status(400).json({
      mensaje: "Error al actualizar email",
      error: error.message,
    });
  }
};

const actualizarDireccion = async (req, res) => {
  try {
    const { nuevaDireccion } = req.body;

    const usuario = await usuarioService.actualizarDireccion(
      req.params.id,
      nuevaDireccion,
    );

    if (!usuario) {
      return res.status(404).json({
        mensaje: "Usuario no encontrado",
      });
    }

    return res.status(200).json({
      mensaje: "Dirección actualizada correctamente",
      datos: usuario,
    });
  } catch (error) {
    return res.status(400).json({
      mensaje: "Error al actualizar dirección",
      error: error.message,
    });
  }
};

const actualizarTelefono = async (req, res) => {
  try {
    const { nuevoTelefono } = req.body;

    const usuario = await usuarioService.actualizarTelefono(
      req.params.id,
      nuevoTelefono,
    );

    if (!usuario) {
      return res.status(404).json({
        mensaje: "Usuario no encontrado",
      });
    }

    return res.status(200).json({
      mensaje: "Teléfono actualizado correctamente",
      datos: usuario,
    });
  } catch (error) {
    return res.status(400).json({
      mensaje: "Error al actualizar teléfono",
      error: error.message,
    });
  }
};

const listarCursosAdquiridos = async (req, res) => {
  try {
    const cursos = await usuarioService.listarCursosAdquiridos(req.params.id);

    return res.status(200).json({
      mensaje: "Cursos adquiridos obtenidos correctamente",
      datos: cursos,
    });
  } catch (error) {
    return res.status(400).json({
      mensaje: "Error al listar cursos adquiridos",
      error: error.message,
    });
  }
};

module.exports = {
  registrarUsuario,
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
  iniciarSesion,
};
