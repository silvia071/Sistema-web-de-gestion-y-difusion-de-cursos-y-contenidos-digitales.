const express = require("express");
const router = express.Router();

const {
  getPublicaciones,
  getPublicacionesAdmin,
  getPublicacionById,
  getPublicacionAdminById,
  createPublicacion,
  updatePublicacion,
  deletePublicacion,
  publicarPublicacion,
  ocultarPublicacion,
} = require("../controllers/publicacion.controller");

const { verificarToken } = require("../middlewares/verificarToken.middleware");
const { verificarAdmin } = require("../middlewares/verificarAdmin.validator");

// Admin: puede ver PUBLICADO, BORRADOR u OCULTO
router.get(
  "/admin/todas",
  verificarToken,
  verificarAdmin,
  getPublicacionesAdmin,
);
router.get(
  "/admin/:id",
  verificarToken,
  verificarAdmin,
  getPublicacionAdminById,
);

// Públicas: solo devuelven publicaciones PUBLICADAS
router.get("/", getPublicaciones);
router.get("/:id", getPublicacionById);

router.post("/", verificarToken, verificarAdmin, createPublicacion);

router.put("/:id", verificarToken, verificarAdmin, updatePublicacion);

router.delete("/:id", verificarToken, verificarAdmin, deletePublicacion);

router.patch(
  "/:id/publicar",
  verificarToken,
  verificarAdmin,
  publicarPublicacion,
);

router.patch(
  "/:id/ocultar",
  verificarToken,
  verificarAdmin,
  ocultarPublicacion,
);

module.exports = router;
