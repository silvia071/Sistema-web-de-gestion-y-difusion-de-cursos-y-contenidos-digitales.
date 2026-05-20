const express = require("express");
const router = express.Router();

const {
  iniciarSesion,
  registrarUsuario,
} = require("../controllers/auth.controller");

const {
  validarLogin,
  validarRegistroPublico,
} = require("../middlewares/usuario.validator");

router.post("/login", validarLogin, iniciarSesion);
router.post("/register", validarRegistroPublico, registrarUsuario);

module.exports = router;
