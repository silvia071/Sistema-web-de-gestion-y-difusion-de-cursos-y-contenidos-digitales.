import "./Carrito.css";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCarrito } from "../context/CarritoContext";
import mercadoPagoIcon from "../assets/payment/mercado-pago-icon.png";
import api from "../services/api";
import {
  Check,
  ClipboardList,
  CreditCard,
  Download,
  FileText,
  Headphones,
  IdCard,
  Infinity,
  Landmark,
  Lock,
  MapPin,
  ShieldCheck,
  ShoppingCart,
  UserRound,
  WalletCards,
} from "lucide-react";

function formatearPrecio(valor) {
  return Number(valor || 0).toLocaleString("es-AR");
}

function Checkout() {
  const { carrito, carritoBackend, limpiarCarritoVisual } = useCarrito();

  const navigate = useNavigate();
  const metodosPagoRef = useRef(null);

  const [metodoPago, setMetodoPago] = useState("TRANSFERENCIA");
  const [metodoPagoVisual, setMetodoPagoVisual] = useState("TRANSFERENCIA");
  const [metodosPago, setMetodosPago] = useState([]);
  const [procesando, setProcesando] = useState(false);
  const [procesandoPagoVisual, setProcesandoPagoVisual] = useState(false);

  const [resumenCompra, setResumenCompra] = useState({
    subtotal: 0,
    descuento: 0,
    totalFinal: 0,
    codigoCuponAplicado: null,
  });

  const [datosFacturacion, setDatosFacturacion] = useState({
    nombreCompleto: "",
    dni: "",
    domicilio: "",
  });

  const [erroresFacturacion, setErroresFacturacion] = useState({});

  const [modal, setModal] = useState({
    visible: false,
    titulo: "",
    mensaje: "",
    tipo: "info",
    accion: null,
    textoConfirmar: "Aceptar",
  });

  const subtotalVisual = useMemo(() => {
    return carrito.reduce((acc, item) => acc + Number(item.precio || 0), 0);
  }, [carrito]);

  useEffect(() => {
    const obtenerResumenCarrito = async () => {
      if (!carritoBackend?._id || carrito.length === 0) {
        setResumenCompra({
          subtotal: subtotalVisual,
          descuento: 0,
          totalFinal: subtotalVisual,
          codigoCuponAplicado: null,
        });

        return;
      }

      try {
        const { data } = await api.get(
          `/api/carrito/${carritoBackend._id}/total`,
        );

        setResumenCompra({
          subtotal: Number(data.subtotal || 0),
          descuento: Number(data.descuento || 0),
          totalFinal: Number(data.totalFinal || data.subtotal || 0),
          codigoCuponAplicado: data.codigoCuponAplicado || null,
        });
      } catch (error) {
        console.error("Error al obtener resumen del carrito:", error);

        setResumenCompra({
          subtotal: subtotalVisual,
          descuento: 0,
          totalFinal: subtotalVisual,
          codigoCuponAplicado: null,
        });
      }
    };

    obtenerResumenCarrito();
  }, [carritoBackend?._id, carrito.length, subtotalVisual]);

  useEffect(() => {
    const obtenerMetodosPago = async () => {
      try {
        const response = await api.get("/api/metodos-pago");
        const metodos = Array.isArray(response.data) ? response.data : [];

        setMetodosPago(metodos);

        if (metodos.some((metodo) => metodo.tipo === "TARJETA")) {
          setMetodoPago("TARJETA");
          setMetodoPagoVisual("MERCADO_PAGO");
        } else if (metodos.some((metodo) => metodo.tipo === "TRANSFERENCIA")) {
          setMetodoPago("TRANSFERENCIA");
          setMetodoPagoVisual("TRANSFERENCIA");
        } else if (metodos[0]?.tipo) {
          setMetodoPago(metodos[0].tipo);
          setMetodoPagoVisual(metodos[0].tipo);
        }
      } catch (error) {
        console.error("Error al obtener métodos de pago:", error);
      }
    };

    obtenerMetodosPago();
  }, []);

  useEffect(() => {
    if (carrito.length === 0 && !procesandoPagoVisual) {
      navigate("/carrito", { replace: true });
    }
  }, [carrito.length, navigate, procesandoPagoVisual]);

  const mostrarModal = ({
    titulo,
    mensaje,
    tipo = "info",
    accion = null,
    textoConfirmar = "Aceptar",
  }) => {
    setModal({
      visible: true,
      titulo,
      mensaje,
      tipo,
      accion,
      textoConfirmar,
    });
  };

  const cerrarModal = () => {
    setModal({
      visible: false,
      titulo: "",
      mensaje: "",
      tipo: "info",
      accion: null,
      textoConfirmar: "Aceptar",
    });
  };

  const confirmarModal = async () => {
    const accion = modal.accion;

    cerrarModal();

    if (accion) {
      await accion();
    }
  };

  const obtenerMetodoPagoSeleccionado = () => {
    return metodosPago.find((metodo) => metodo.tipo === metodoPago);
  };

  const metodoExiste = (tipo) =>
    metodosPago.some((metodo) => metodo.tipo === tipo);

  const obtenerNombreMetodoVisual = () => {
    const nombres = {
      MERCADO_PAGO: "Mercado Pago",
      TARJETA_DEBITO_CREDITO: "Tarjeta de crédito / débito",
      TRANSFERENCIA: "Transferencia bancaria",
      PAYPAL: "PayPal o billetera digital",
    };

    return nombres[metodoPagoVisual] || "Método no seleccionado";
  };

  const obtenerIconoMetodoVisual = () => {
    const iconos = {
      MERCADO_PAGO: (
        <img
          src={mercadoPagoIcon}
          alt="Mercado Pago"
          className="checkout-metodo-logo"
        />
      ),
      TARJETA_DEBITO_CREDITO: <WalletCards size={20} />,
      TRANSFERENCIA: <Landmark size={20} />,
      PAYPAL: <CreditCard size={20} />,
    };

    return iconos[metodoPagoVisual] || <CreditCard size={20} />;
  };

  const seleccionarMetodoPago = (visual, backend) => {
    if (procesando || procesandoPagoVisual) return;

    setMetodoPagoVisual(visual);
    setMetodoPago(backend);
  };

  const irAMetodosPago = () => {
    metodosPagoRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  const validarDatosFacturacion = () => {
    const errores = {};

    if (!datosFacturacion.nombreCompleto.trim()) {
      errores.nombreCompleto = "Ingresá el nombre completo.";
    }

    if (!datosFacturacion.dni.trim()) {
      errores.dni = "Ingresá el DNI.";
    }

    if (!datosFacturacion.domicilio.trim()) {
      errores.domicilio = "Ingresá el domicilio.";
    }

    setErroresFacturacion(errores);

    return Object.keys(errores).length === 0;
  };

  const handleCambioFacturacion = (e) => {
    const { name, value } = e.target;

    setDatosFacturacion((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErroresFacturacion((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const handleConfirmarCompra = async () => {
    if (procesando || procesandoPagoVisual) return;

    try {
      setProcesando(true);

      if (!validarDatosFacturacion()) {
        mostrarModal({
          titulo: "Datos incompletos",
          mensaje:
            "Completá los datos de facturación antes de confirmar la compra.",
          tipo: "warning",
        });

        return;
      }

      if (carrito.length === 0) {
        mostrarModal({
          titulo: "Carrito vacío",
          mensaje: "Agregá al menos un curso antes de continuar.",
          tipo: "warning",
        });

        return;
      }

      if (!carritoBackend?._id) {
        mostrarModal({
          titulo: "Error de carrito",
          mensaje: "No se pudo obtener el carrito activo.",
          tipo: "error",
        });

        return;
      }

      const metodoSeleccionado = obtenerMetodoPagoSeleccionado();

      if (!metodoSeleccionado?._id) {
        mostrarModal({
          titulo: "Método de pago no disponible",
          mensaje:
            "No se encontró el método de pago seleccionado en el backend.",
          tipo: "warning",
        });

        return;
      }

      const { data: compraResponse } = await api.post(
        `/api/compra/desde-carrito/${carritoBackend._id}`,
      );

      const compra = compraResponse.datos;

      const { data: pagoResponse } = await api.post("/api/pagos", {
        monto: compra.total,
        metodoPago: metodoSeleccionado._id,
        compra: compra._id,
      });

      const pago = pagoResponse.datos;

      const { data: resultadoPagoResponse } = await api.post(
        "/api/pagos/procesar",
        {
          pagoId: pago._id,
        },
      );

      const resultadoPago = resultadoPagoResponse.datos;

      if (resultadoPago?.tipo === "mercadopago" && resultadoPago?.init_point) {
        setProcesandoPagoVisual(true);
        setProcesando(false);

        setTimeout(() => {
          window.location.href = resultadoPago.init_point;
        }, 2000);

        return;
      }

      if (resultadoPago?.tipo === "transferencia") {
        setProcesandoPagoVisual(true);
        setProcesando(false);

        setTimeout(() => {
          limpiarCarritoVisual();
          navigate("/pago-pendiente", { replace: true });
        }, 1600);

        return;
      }

      setProcesandoPagoVisual(true);
      setProcesando(false);

      setTimeout(() => {
        limpiarCarritoVisual();

        mostrarModal({
          titulo: "Compra generada",
          mensaje: "La compra fue generada correctamente.",
          tipo: "success",
          accion: () => navigate("/mis-cursos"),
          textoConfirmar: "Ver mis cursos",
        });

        setProcesandoPagoVisual(false);
      }, 1600);
    } catch (error) {
      console.error("Error al finalizar compra:", error);
      console.error("URL:", error.config?.url);
      console.error("METHOD:", error.config?.method);
      console.error("STATUS:", error.response?.status);
      console.error("DATA BACKEND:", error.response?.data);

      setProcesandoPagoVisual(false);

      const mensajeBackend =
        error.response?.data?.mensaje ||
        error.response?.data?.error ||
        error.message ||
        "Ocurrió un error al finalizar la compra.";

      if (mensajeBackend === "Carrito no activo") {
        limpiarCarritoVisual();

        mostrarModal({
          titulo: "Carrito vencido",
          mensaje:
            "El carrito anterior ya no está activo. Volvé a agregar el curso para continuar.",
          tipo: "warning",
          accion: () => navigate("/cursos"),
          textoConfirmar: "Ver cursos",
        });

        return;
      }

      mostrarModal({
        titulo: "Error al finalizar la compra",
        mensaje: mensajeBackend,
        tipo: "error",
      });
    } finally {
      setProcesando(false);
    }
  };

  const subtotal = Number(resumenCompra.subtotal || 0);
  const descuento = Number(resumenCompra.descuento || 0);
  const totalFinal = Number(resumenCompra.totalFinal || subtotal || 0);

  return (
    <section className="carrito-page">
      {procesandoPagoVisual && (
        <div className="carrito-modal-overlay">
          <div className="carrito-modal carrito-modal-info carrito-modal-procesando">
            <div className="carrito-loader"></div>

            <h2>
              Procesando pago
              <span className="puntos-cargando">
                <span>.</span>
                <span>.</span>
                <span>.</span>
              </span>
            </h2>

            <p>Estamos validando la operación. Aguarde un momento.</p>
          </div>
        </div>
      )}

      {modal.visible && !procesandoPagoVisual && (
        <div className="carrito-modal-overlay">
          <div className={`carrito-modal carrito-modal-${modal.tipo}`}>
            <div className="carrito-modal-icon">
              {modal.tipo === "success" && <Check size={30} />}
              {modal.tipo === "warning" && "!"}
              {modal.tipo === "error" && "×"}
              {modal.tipo === "info" && "i"}
            </div>

            <h2>{modal.titulo}</h2>
            <p>{modal.mensaje}</p>

            <div className="carrito-modal-actions">
              <button
                type="button"
                className="carrito-modal-btn-confirmar"
                onClick={confirmarModal}
              >
                {modal.textoConfirmar}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="carrito-header">
        <div>
          <span className="carrito-eyebrow">Finalizá tu compra</span>
          <h1 className="carrito-title">Confirmar compra</h1>
          <p className="carrito-subtitle">
            Revisá el resumen, elegí el método de pago y confirmá tu compra.
          </p>
        </div>

        <div className="checkout-steps" aria-label="Progreso de compra">
          <div className="checkout-step">
            <span>
              <ShoppingCart size={18} />
            </span>
            <p>Carrito</p>
          </div>

          <div className="checkout-step checkout-step--active">
            <span>
              <ClipboardList size={18} />
            </span>
            <p>Confirmar</p>
          </div>

          <div className="checkout-step">
            <span>
              <Check size={18} />
            </span>
            <p>Confirmación</p>
          </div>
        </div>
      </div>

      <div className="carrito-container">
        <div className="carrito-lista">
          <div className="carrito-cupon carrito-cupon-activo">
            <div className="carrito-cupon-icono">
              <ShoppingCart size={23} />
            </div>
            <div className="carrito-cupon-contenido">
              <h3>Datos de la compra</h3>
              <p>
                Esta compra corresponde a cursos digitales. Una vez aprobado el
                pago, el acceso se habilita automáticamente en tu cuenta.
              </p>

              <div className="carrito-confianza">
                <div>
                  <span>
                    <Download size={20} />
                  </span>
                  <strong>Entrega digital</strong>
                  <p>No requiere envío físico.</p>
                </div>

                <div>
                  <span>
                    <Infinity size={20} />
                  </span>
                  <strong>Acceso permanente</strong>
                  <p>El curso queda asociado a tu usuario.</p>
                </div>

                <div>
                  <span>
                    <Headphones size={20} />
                  </span>
                  <strong>Soporte incluido</strong>
                  <p>Podés consultar ante cualquier problema.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="checkout-card">
            <div className="checkout-card-icono">
              <FileText size={22} />
            </div>

            <div className="checkout-card-contenido">
              <h3>Datos de facturación</h3>
              <p>
                Completá los datos necesarios para registrar la compra a tu
                nombre.
              </p>

              <div className="checkout-form">
                <label>
                  Nombre completo
                  <div className="checkout-input-wrap">
                    <UserRound size={18} />
                    <input
                      type="text"
                      name="nombreCompleto"
                      value={datosFacturacion.nombreCompleto}
                      onChange={handleCambioFacturacion}
                      placeholder="Ej: Andrés Zardo"
                      autoComplete="name"
                      disabled={procesando || procesandoPagoVisual}
                    />
                  </div>
                  {erroresFacturacion.nombreCompleto && (
                    <span>{erroresFacturacion.nombreCompleto}</span>
                  )}
                </label>

                <label>
                  DNI
                  <div className="checkout-input-wrap">
                    <IdCard size={18} />
                    <input
                      type="text"
                      name="dni"
                      value={datosFacturacion.dni}
                      onChange={handleCambioFacturacion}
                      placeholder="Ej: 12345678"
                      autoComplete="off"
                      disabled={procesando || procesandoPagoVisual}
                    />
                  </div>
                  {erroresFacturacion.dni && (
                    <span>{erroresFacturacion.dni}</span>
                  )}
                </label>

                <label>
                  Domicilio
                  <div className="checkout-input-wrap">
                    <MapPin size={18} />
                    <input
                      type="text"
                      name="domicilio"
                      value={datosFacturacion.domicilio}
                      onChange={handleCambioFacturacion}
                      placeholder="Ej: San Martín 123"
                      autoComplete="street-address"
                      disabled={procesando || procesandoPagoVisual}
                    />
                  </div>
                  {erroresFacturacion.domicilio && (
                    <span>{erroresFacturacion.domicilio}</span>
                  )}
                </label>
              </div>
            </div>
          </div>

          <div className="metodos-pago" ref={metodosPagoRef}>
            <h4>Elegí tu método de pago</h4>

            {metodoExiste("TARJETA") && (
              <button
                type="button"
                className={`metodo-opcion ${
                  metodoPagoVisual === "MERCADO_PAGO" ? "activo" : ""
                }`}
                onClick={() => seleccionarMetodoPago("MERCADO_PAGO", "TARJETA")}
                disabled={procesando || procesandoPagoVisual}
              >
                <span className="metodo-radio">
                  {metodoPagoVisual === "MERCADO_PAGO" && <Check size={13} />}
                </span>

                <span className="metodo-icono metodo-icono-mp">
                  <img src={mercadoPagoIcon} alt="Mercado Pago" />
                </span>

                <span className="metodo-texto">
                  <span className="metodo-titulo">
                    Mercado Pago
                    <small>Más usado</small>
                  </span>
                  <span className="metodo-descripcion">
                    Pagá con tarjeta, débito o saldo disponible.
                  </span>
                </span>

                <span className="metodo-flecha">›</span>
              </button>
            )}

            {metodoExiste("TARJETA") && (
              <button
                type="button"
                className={`metodo-opcion ${
                  metodoPagoVisual === "TARJETA_DEBITO_CREDITO" ? "activo" : ""
                }`}
                onClick={() =>
                  seleccionarMetodoPago("TARJETA_DEBITO_CREDITO", "TARJETA")
                }
                disabled={procesando || procesandoPagoVisual}
              >
                <span className="metodo-radio">
                  {metodoPagoVisual === "TARJETA_DEBITO_CREDITO" && (
                    <Check size={13} />
                  )}
                </span>

                <span className="metodo-icono">
                  <WalletCards size={18} />
                </span>

                <span className="metodo-texto">
                  <span className="metodo-titulo">
                    Tarjeta de crédito / débito
                    <small>Cuotas</small>
                  </span>
                  <span className="metodo-descripcion">
                    Visa, Mastercard y más.
                  </span>
                </span>

                <span className="metodo-flecha">›</span>
              </button>
            )}

            {metodoExiste("TRANSFERENCIA") && (
              <button
                type="button"
                className={`metodo-opcion ${
                  metodoPagoVisual === "TRANSFERENCIA" ? "activo" : ""
                }`}
                onClick={() =>
                  seleccionarMetodoPago("TRANSFERENCIA", "TRANSFERENCIA")
                }
                disabled={procesando || procesandoPagoVisual}
              >
                <span className="metodo-radio">
                  {metodoPagoVisual === "TRANSFERENCIA" && <Check size={13} />}
                </span>

                <span className="metodo-icono">
                  <Landmark size={18} />
                </span>

                <span className="metodo-texto">
                  <span className="metodo-titulo">
                    Transferencia bancaria
                    <small>Aprobación manual</small>
                  </span>
                  <span className="metodo-descripcion">
                    Pago pendiente de aprobación administrativa.
                  </span>
                </span>

                <span className="metodo-flecha">›</span>
              </button>
            )}

            {metodoExiste("TARJETA") && (
              <button
                type="button"
                className={`metodo-opcion ${
                  metodoPagoVisual === "PAYPAL" ? "activo" : ""
                }`}
                onClick={() => seleccionarMetodoPago("PAYPAL", "TARJETA")}
                disabled={procesando || procesandoPagoVisual}
              >
                <span className="metodo-radio">
                  {metodoPagoVisual === "PAYPAL" && <Check size={13} />}
                </span>

                <span className="metodo-icono">
                  <CreditCard size={18} />
                </span>

                <span className="metodo-texto">
                  <span className="metodo-titulo">
                    PayPal o billetera digital
                  </span>
                  <span className="metodo-descripcion">
                    Pagá de forma rápida y segura.
                  </span>
                </span>

                <span className="metodo-flecha">›</span>
              </button>
            )}
          </div>
        </div>

        <aside className="carrito-resumen">
          <div className="resumen-header">
            <h3>Resumen final</h3>
            <span>
              {carrito.length} curso{carrito.length > 1 ? "s" : ""}
            </span>
          </div>

          {carrito.map((item) => {
            const itemId = item.itemId || item.id || item._id;

            return (
              <div className="resumen-linea" key={itemId}>
                <span>{item.titulo}</span>
                <strong>${formatearPrecio(item.precio)}</strong>
              </div>
            );
          })}

          <div className="resumen-linea">
            <span>Subtotal</span>
            <strong>${formatearPrecio(subtotal)}</strong>
          </div>

          {descuento > 0 && (
            <div className="resumen-linea resumen-descuento">
              <span>
                Descuento
                {resumenCompra.codigoCuponAplicado
                  ? ` (${resumenCompra.codigoCuponAplicado})`
                  : ""}
              </span>
              <strong>- ${formatearPrecio(descuento)}</strong>
            </div>
          )}

          <div className="resumen-total">
            <span>Total a pagar</span>
            <strong>${formatearPrecio(totalFinal)}</strong>
          </div>

          <button
            type="button"
            className="btn-finalizar"
            onClick={handleConfirmarCompra}
            disabled={procesando || procesandoPagoVisual}
          >
            {procesando || procesandoPagoVisual ? (
              "Procesando..."
            ) : (
              <>
                <Lock size={15} />
                Confirmar compra →
              </>
            )}
          </button>

          <Link to="/carrito" className="btn-vaciar btn-seguir-explorando">
            ← Volver al carrito
          </Link>

          <div className="checkout-metodo-resumen">
            <div className="checkout-metodo-resumen-header">
              <strong>Medio de pago</strong>

              <button type="button" onClick={irAMetodosPago}>
                Cambiar
              </button>
            </div>

            <div className="checkout-metodo-resumen-body">
              <span>{obtenerIconoMetodoVisual()}</span>
              <p>{obtenerNombreMetodoVisual()}</p>
            </div>
          </div>

          <div className="checkout-seguridad">
            <div className="checkout-seguridad-icono">
              <ShieldCheck size={22} />
            </div>

            <div>
              <strong>Pago 100% seguro</strong>
              <p>Tus datos están protegidos durante todo el proceso.</p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

export default Checkout;
