const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
// Rutas
const usuarioRoutes = require("./routes/usuario.route");
const cursoRoutes = require("./routes/curso.route");
const leccionRoutes = require("./routes/leccion.route");
const publicacionRoutes = require("./routes/publicacion.route");
const categoriaRoutes = require("./routes/categoria.route");
const mensajeRoutes = require("./routes/mensajeContacto.route");
const metodoPagoRoutes = require("./routes/metodoPago.route");
const datosFacturacionRoutes = require("./routes/datosFacturacion.route");
const pagoRoutes = require("./routes/pago.route");
const carritoRoutes = require("./routes/carrito.route");
const compraRoutes = require("./routes/compra.route");
const accesoCursoRoutes = require("./routes/accesoCurso.route");

app.use("/api/usuarios", usuarioRoutes);
app.use("/api/cursos", cursoRoutes);
app.use("/api/lecciones", leccionRoutes);
app.use("/api/publicaciones", publicacionRoutes);
app.use("/api/categorias", categoriaRoutes);
app.use("/api/mensajes", mensajeRoutes);
app.use("/api/metodos-pago", metodoPagoRoutes);
app.use("/api/datos-facturacion", datosFacturacionRoutes);
app.use("/api/pagos", pagoRoutes);
app.use("/api/carrito", carritoRoutes);
app.use("/api/compra", compraRoutes);
app.use("/api/acceso-curso", accesoCursoRoutes);

app.get("/api/publicaciones/prueba-app", (req, res) => {
  res.json({ mensaje: "PRUEBA DIRECTA EN APP OK" });
});

app.get("/", (req, res) => {
  res.send("API funcionando 🚀");
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Error interno del servidor",
  });
});

module.exports = app;
