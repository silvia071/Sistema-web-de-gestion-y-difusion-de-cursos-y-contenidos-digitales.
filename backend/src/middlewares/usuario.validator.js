const { body, param, validationResult } = require("express-validator");

const validarRespuesta = (req, res, next) => {
  const errores = validationResult(req);

  if (!errores.isEmpty()) {
    return res.status(400).json({
      ok: false,
      errores: errores.array().map((err) => ({
        campo: err.path,
        mensaje: err.msg,
      })),
    });
  }

  next();
};

const validarId = [
  param("id")
    .isMongoId()
    .withMessage("El ID proporcionado no es un formato válido de MongoDB"),
  validarRespuesta,
];

const reglasRegistroBase = [
  body("nombre")
    .trim()
    .notEmpty()
    .withMessage("El nombre es obligatorio")
    .isLength({ min: 2 })
    .withMessage("El nombre debe tener al menos 2 caracteres"),

  body("apellido").trim().notEmpty().withMessage("El apellido es obligatorio"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("El email es obligatorio")
    .isEmail()
    .withMessage("Debe proporcionar un email válido"),

  body("contrasenia")
    .notEmpty()
    .withMessage("La contraseña es obligatoria")
    .isLength({ min: 6 })
    .withMessage("La contraseña debe tener al menos 6 caracteres"),
];

const validarRegistroPublico = [
  ...reglasRegistroBase,

  body("rol")
    .not()
    .exists()
    .withMessage("No se puede asignar un rol desde el registro público"),

  validarRespuesta,
];

const validarRegistroAdmin = [
  ...reglasRegistroBase,

  body("rol")
    .optional()
    .isIn(["CLIENTE", "ADMINISTRADOR"])
    .withMessage("El rol debe ser CLIENTE o ADMINISTRADOR"),

  validarRespuesta,
];

const validarLogin = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("El email es obligatorio")
    .isEmail()
    .withMessage("Email inválido"),

  body("contrasenia").notEmpty().withMessage("La contraseña es requerida"),

  validarRespuesta,
];

const validarCambioRol = [
  body("nuevoRol")
    .notEmpty()
    .withMessage("El nuevo rol es obligatorio")
    .isIn(["CLIENTE", "ADMINISTRADOR"])
    .withMessage("El rol debe ser CLIENTE o ADMINISTRADOR"),

  validarRespuesta,
];

const validarEditarPerfil = [
  body("nombre")
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage("El nombre debe tener al menos 2 caracteres"),

  body("apellido")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("El apellido no puede estar vacío"),

  body("direccion")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("La dirección no puede estar vacía"),

  body("telefono")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("El teléfono no puede estar vacío"),

  validarRespuesta,
];

module.exports = {
  validarRegistro: validarRegistroPublico,
  validarRegistroPublico,
  validarRegistroAdmin,
  validarLogin,
  validarId,
  validarCambioRol,
  validarEditarPerfil,
};
