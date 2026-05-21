const mongoose = require("mongoose");
const Pago = require("../models/pago.model");
const pagoService = require("../services/pago.service");

const client = require("../config/mercadoPago");
const { Preference } = require("mercadopago");

const esObjectIdValido = (id) => mongoose.Types.ObjectId.isValid(id);

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

const esAdmin = (req) => req.usuario?.rol === "ADMINISTRADOR";

const usuarioEsPropietarioPago = (pago, usuarioId) => {
  return pago.usuario?._id?.toString() === usuarioId?.toString();
};

const crearPago = async (req, res) => {
  try {
    const { monto, metodoPago, compra } = req.body;

    if (!monto) {
      return res.status(400).json({ mensaje: "El monto es obligatorio" });
    }

    if (Number(monto) <= 0) {
      return res.status(400).json({ mensaje: "El monto debe ser mayor a 0" });
    }

    if (!metodoPago) {
      return res
        .status(400)
        .json({ mensaje: "El método de pago es obligatorio" });
    }

    if (!compra) {
      return res.status(400).json({ mensaje: "La compra es obligatoria" });
    }

    const datosPago = {
      ...req.body,
      usuario: req.usuario._id,
    };

    const pago = await pagoService.crearPago(datosPago);

    return res.status(201).json({
      mensaje: "Pago creado correctamente",
      datos: pago,
    });
  } catch (error) {
    if (error.message.includes("permiso")) {
      return res.status(403).json({ mensaje: error.message });
    }

    return res.status(400).json({ mensaje: error.message });
  }
};

const listarPagos = async (req, res) => {
  try {
    const pagos = await pagoService.listarPagos();

    return res.status(200).json({
      mensaje: "Pagos obtenidos correctamente",
      datos: pagos,
    });
  } catch (error) {
    return res.status(500).json({
      mensaje: "Error al listar pagos",
      error: error.message,
    });
  }
};

const buscarPagoPorId = async (req, res) => {
  try {
    const { id } = req.params;

    if (!esObjectIdValido(id)) {
      return res.status(400).json({ mensaje: "ID inválido" });
    }

    const pago = await pagoService.buscarPagoPorId(id);

    if (!pago) {
      return res.status(404).json({ mensaje: "Pago no encontrado" });
    }

    return res.status(200).json({
      mensaje: "Pago obtenido correctamente",
      datos: pago,
    });
  } catch (error) {
    return res.status(500).json({
      mensaje: "Error al buscar pago",
      error: error.message,
    });
  }
};

const aprobarPago = async (req, res) => {
  try {
    const { id } = req.params;

    if (!esObjectIdValido(id)) {
      return res.status(400).json({ mensaje: "ID inválido" });
    }

    const pago = await pagoService.aprobarPago(id);

    if (!pago) {
      return res.status(404).json({ mensaje: "Pago no encontrado" });
    }

    return res.status(200).json({
      mensaje: "Pago aprobado correctamente",
      datos: pago,
    });
  } catch (error) {
    return res.status(400).json({
      mensaje: error.message || "Error al aprobar pago",
    });
  }
};

const rechazarPago = async (req, res) => {
  try {
    const { id } = req.params;

    if (!esObjectIdValido(id)) {
      return res.status(400).json({ mensaje: "ID inválido" });
    }

    const pago = await pagoService.rechazarPago(id);

    if (!pago) {
      return res.status(404).json({ mensaje: "Pago no encontrado" });
    }

    return res.status(200).json({
      mensaje: "Pago rechazado correctamente",
      datos: pago,
    });
  } catch (error) {
    return res.status(400).json({
      mensaje: error.message || "Error al rechazar pago",
    });
  }
};

const crearPreferencia = async (req, res) => {
  try {
    const { pagoId, titulo, precio } = req.body;

    if (!pagoId || !titulo || !precio) {
      return res.status(400).json({
        mensaje: "pagoId, titulo y precio son obligatorios",
      });
    }

    if (!esObjectIdValido(pagoId)) {
      return res.status(400).json({ mensaje: "pagoId inválido" });
    }

    const pago = await Pago.findById(pagoId)
      .populate("compra")
      .populate("usuario");

    if (!pago) {
      return res.status(404).json({ mensaje: "Pago no encontrado" });
    }

    if (!esAdmin(req) && !usuarioEsPropietarioPago(pago, req.usuario._id)) {
      return res.status(403).json({
        mensaje: "No tenés permiso para procesar este pago",
      });
    }

    const preference = new Preference(client);

    const response = await preference.create({
      body: {
        items: [
          {
            title: titulo,
            unit_price: Number(precio),
            quantity: 1,
            currency_id: "ARS",
          },
        ],
        external_reference: pago._id.toString(),
        notification_url: `${BACKEND_URL}/api/pagos/webhook`,
        back_urls: {
          success: `${FRONTEND_URL}/pago-exitoso`,
          failure: `${FRONTEND_URL}/pago-fallido`,
          pending: `${FRONTEND_URL}/pago-pendiente`,
        },
        auto_return: "approved",
      },
    });

    pago.mpPreferenceId = response.id;
    pago.externalReference = pago._id.toString();
    await pago.save();

    return res.status(200).json({
      mensaje: "Preferencia creada correctamente",
      datos: {
        id: response.id,
        init_point: response.init_point,
      },
    });
  } catch (error) {
    console.error("Error Mercado Pago:", error.message);

    return res.status(500).json({
      mensaje: "Error al crear preferencia de pago",
      error: error.message,
    });
  }
};

const procesarPago = async (req, res) => {
  try {
    const { pagoId } = req.body;

    if (!pagoId) {
      return res.status(400).json({ mensaje: "El pagoId es obligatorio" });
    }

    if (!esObjectIdValido(pagoId)) {
      return res.status(400).json({ mensaje: "pagoId inválido" });
    }

    const pago = await Pago.findById(pagoId)
      .populate("metodoPago")
      .populate("usuario")
      .populate("compra");

    if (!pago) {
      return res.status(404).json({ mensaje: "Pago no encontrado" });
    }

    if (!esAdmin(req) && !usuarioEsPropietarioPago(pago, req.usuario._id)) {
      return res.status(403).json({
        mensaje: "No tenés permiso para procesar este pago",
      });
    }

    const tipoMetodo = pago.metodoPago?.tipo;

    if (tipoMetodo === "TARJETA") {
      const usarMock =
        process.env.MP_MOCK === "true" ||
        !process.env.MP_ACCESS_TOKEN ||
        process.env.MP_ACCESS_TOKEN === "TU_ACCESS_TOKEN";

      if (usarMock) {
        await pagoService.aprobarPago(pago._id);

        return res.status(200).json({
          mensaje: "Pago simulado correctamente",
          datos: {
            tipo: "mercadopago",
            init_point: `${FRONTEND_URL}/pago-exitoso`,
            simulado: true,
          },
        });
      }

      const preference = new Preference(client);

      const response = await preference.create({
        body: {
          items: [
            {
              title: "Compra de cursos",
              unit_price: Number(pago.monto),
              quantity: 1,
              currency_id: "ARS",
            },
          ],
          external_reference: pago._id.toString(),
          notification_url: `${BACKEND_URL}/api/pagos/webhook`,
          back_urls: {
            success: `${FRONTEND_URL}/pago-exitoso`,
            failure: `${FRONTEND_URL}/pago-fallido`,
            pending: `${FRONTEND_URL}/pago-pendiente`,
          },
          auto_return: "approved",
        },
      });

      pago.mpPreferenceId = response.id;
      pago.externalReference = pago._id.toString();
      await pago.save();

      return res.status(200).json({
        mensaje: "Pago procesado correctamente",
        datos: {
          tipo: "mercadopago",
          init_point: response.init_point,
          simulado: false,
        },
      });
    }

    if (tipoMetodo === "TRANSFERENCIA") {
      return res.status(200).json({
        mensaje: "Pago pendiente por transferencia",
        datos: {
          tipo: "transferencia",
          banco: "Banco Ejemplo",
          alias: "mi.alias",
          cbu: "0000000000000000000000",
        },
      });
    }

    return res.status(400).json({
      mensaje: "Método de pago no soportado",
    });
  } catch (error) {
    console.error("Error al procesar pago:", error.message);

    return res.status(500).json({
      mensaje: "Error al procesar el pago",
      error: error.message,
    });
  }
};

module.exports = {
  crearPago,
  listarPagos,
  buscarPagoPorId,
  aprobarPago,
  rechazarPago,
  crearPreferencia,
  procesarPago,
};
