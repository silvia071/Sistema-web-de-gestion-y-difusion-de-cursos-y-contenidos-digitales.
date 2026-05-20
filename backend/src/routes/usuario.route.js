const express = require("express");
const router = express.Router();

const {
  registrarUsuario,
  iniciarSesion,
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
} = require("../controllers/usuario.controller");

const {
  validarRegistroPublico,
  validarRegistroAdmin,
  validarId,
  validarCambioRol,
  validarEditarPerfil,
} = require("../middlewares/usuario.validator");

const { verificarToken } = require("../middlewares/verificarToken.middleware");
const { verificarAdmin } = require("../middlewares/verificarAdmin.validator");
const {
  verificarMismoUsuarioOAdmin,
} = require("../middlewares/verificarMismoUsuarioOAdmin.middleware");

// Públicas
router.post("/registro", validarRegistroPublico, registrarUsuario);
router.post("/login", iniciarSesion);

// Usuario autenticado
router.get("/me", verificarToken, (req, res) => {
  return res.status(200).json({
    datos: {
      _id: req.usuario._id,
      id: req.usuario._id,
      nombre: req.usuario.nombre,
      apellido: req.usuario.apellido,
      email: req.usuario.email,
      rol: req.usuario.rol,
      estadoCuenta: req.usuario.estadoCuenta,
      direccion: req.usuario.direccion,
      telefono: req.usuario.telefono,
      fechaCreacion: req.usuario.fechaCreacion,
      createdAt: req.usuario.createdAt,
    },
  });
});

router.put("/me", verificarToken, validarEditarPerfil, (req, res, next) => {
  req.params.id = req.usuario._id;
  return editarPerfil(req, res, next);
});

router.put("/me/password", verificarToken, (req, res, next) => {
  req.params.id = req.usuario._id;
  return cambiarContrasenia(req, res, next);
});

// Admin
router.get("/", verificarToken, verificarAdmin, listarUsuarios);

router.post(
  "/",
  verificarToken,
  verificarAdmin,
  validarRegistroAdmin,
  registrarUsuario,
);

router.get(
  "/email/:email",
  verificarToken,
  verificarAdmin,
  buscarUsuarioPorEmail,
);

router.put(
  "/bloquear/:id",
  verificarToken,
  verificarAdmin,
  validarId,
  bloquearUsuario,
);

router.put(
  "/activar/:id",
  verificarToken,
  verificarAdmin,
  validarId,
  activarUsuario,
);

router.put(
  "/rol/:id",
  verificarToken,
  verificarAdmin,
  validarId,
  validarCambioRol,
  cambiarRol,
);

router.delete(
  "/:id",
  verificarToken,
  verificarAdmin,
  validarId,
  eliminarUsuario,
);

// Usuario propio o admin
router.get(
  "/:id",
  verificarToken,
  validarId,
  verificarMismoUsuarioOAdmin,
  buscarUsuarioPorId,
);

router.get(
  "/:id/mis-cursos",
  verificarToken,
  validarId,
  verificarMismoUsuarioOAdmin,
  listarCursosAdquiridos,
);

router.put(
  "/perfil/:id",
  verificarToken,
  validarId,
  verificarMismoUsuarioOAdmin,
  validarEditarPerfil,
  editarPerfil,
);

router.put(
  "/password/:id",
  verificarToken,
  validarId,
  verificarMismoUsuarioOAdmin,
  cambiarContrasenia,
);

router.patch(
  "/email/:id",
  verificarToken,
  validarId,
  verificarMismoUsuarioOAdmin,
  actualizarEmail,
);

router.patch(
  "/direccion/:id",
  verificarToken,
  validarId,
  verificarMismoUsuarioOAdmin,
  actualizarDireccion,
);

router.patch(
  "/telefono/:id",
  verificarToken,
  validarId,
  verificarMismoUsuarioOAdmin,
  actualizarTelefono,
);

module.exports = router;
