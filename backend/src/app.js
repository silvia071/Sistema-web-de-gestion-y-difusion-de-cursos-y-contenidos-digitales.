const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();

const origenesPermitidos = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
].filter(Boolean);

// Middlewares
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || origenesPermitidos.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origen no permitido por CORS"));
    },
    credentials: true,
  }),
);

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Rutas
const authRoutes = require("./routes/auth.routes");
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

app.use("/api/auth", authRoutes);
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
app.use("/api/accesos", accesoCursoRoutes);

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
