const usuarioService = require("../services/usuario.service");

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
      mensaje: "Login exitoso",
      usuario: {
        id: usuario._id,
        _id: usuario._id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        rol: usuario.rol,
        estadoCuenta: usuario.estadoCuenta,
      },
      token,
    });
  } catch (error) {
    return res.status(401).json({
      mensaje: "Credenciales inválidas",
      error: error.message,
    });
  }
};

const registrarUsuario = async (req, res) => {
  try {
    const usuario = await usuarioService.registrarUsuario(req.body, {
      permitirRol: false,
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

module.exports = {
  iniciarSesion,
  registrarUsuario,
};
