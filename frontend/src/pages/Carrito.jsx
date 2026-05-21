import "./Carrito.css";
import { useCarrito } from "../context/CarritoContext";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../services/api";

function tokenValido(token) {
  return (
    token && token !== "null" && token !== "undefined" && token.trim() !== ""
  );
}

function Carrito() {
  const {
    carrito,
    carritoBackend,
    eliminarDelCarrito,
    vaciarCarrito,
    limpiarCarritoVisual,
  } = useCarrito();

  const navigate = useNavigate();
  const location = useLocation();

  const [metodoPago, setMetodoPago] = useState("TRANSFERENCIA");
  const [metodoPagoVisual, setMetodoPagoVisual] = useState("TRANSFERENCIA");
  const [metodosPago, setMetodosPago] = useState([]);
  const [procesando, setProcesando] = useState(false);
  const [procesandoPagoVisual, setProcesandoPagoVisual] = useState(false);

  const [modal, setModal] = useState({
    visible: false,
    titulo: "",
    mensaje: "",
    tipo: "info",
    accion: null,
    textoConfirmar: "Aceptar",
    textoCancelar: "Cancelar",
    mostrarCancelar: false,
  });

  const subtotal = carrito.reduce(
    (acc, item) => acc + Number(item.precio || 0),
    0,
  );

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

  const obtenerMetodoPagoSeleccionado = () => {
    return metodosPago.find((metodo) => metodo.tipo === metodoPago);
  };

  const metodoExiste = (tipo) =>
    metodosPago.some((metodo) => metodo.tipo === tipo);

  const seleccionarMetodoPago = (visual, backend) => {
    if (procesando || procesandoPagoVisual) return;

    setMetodoPagoVisual(visual);
    setMetodoPago(backend);
  };

  const mostrarModal = ({
    titulo,
    mensaje,
    tipo = "info",
    accion = null,
    textoConfirmar = "Aceptar",
    textoCancelar = "Cancelar",
    mostrarCancelar = false,
  }) => {
    setModal({
      visible: true,
      titulo,
      mensaje,
      tipo,
      accion,
      textoConfirmar,
      textoCancelar,
      mostrarCancelar,
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
      textoCancelar: "Cancelar",
      mostrarCancelar: false,
    });
  };

  const confirmarModal = async () => {
    const accion = modal.accion;

    cerrarModal();

    if (accion) {
      await accion();
    }
  };

  const handleContinuarPago = async () => {
    if (procesando || procesandoPagoVisual) return;

    try {
      setProcesando(true);

      const token = localStorage.getItem("token");

      if (!tokenValido(token)) {
        mostrarModal({
          titulo: "Iniciá sesión",
          mensaje: "Tenés que iniciar sesión para poder comprar cursos.",
          tipo: "info",
          accion: () =>
            navigate("/login", {
              replace: true,
              state: { from: location.pathname },
            }),
          textoConfirmar: "Iniciar sesión",
        });

        return;
      }

      if (carrito.length === 0) {
        mostrarModal({
          titulo: "Carrito vacío",
          mensaje: "Agregá al menos un curso antes de continuar con la compra.",
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
        }, 3000);

        return;
      }

      if (resultadoPago?.tipo === "transferencia") {
        setProcesandoPagoVisual(true);
        setProcesando(false);

        setTimeout(() => {
          limpiarCarritoVisual();
          navigate("/pago-pendiente", { replace: true });
        }, 3000);

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

      setProcesandoPagoVisual(false);

      const mensajeBackend =
        error.response?.data?.mensaje ||
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

  const handleVaciarCarrito = () => {
    if (procesando || procesandoPagoVisual) return;

    mostrarModal({
      titulo: "Vaciar carrito",
      mensaje: "¿Seguro que querés eliminar todos los cursos del carrito?",
      tipo: "warning",
      accion: async () => {
        await vaciarCarrito();
      },
      textoConfirmar: "Sí, vaciar carrito",
      textoCancelar: "Cancelar",
      mostrarCancelar: true,
    });
  };

  const handleEliminarCurso = (item) => {
    if (procesando || procesandoPagoVisual) return;

    const itemId = item.itemId || item.id || item._id;
    const tituloCurso = item.titulo || "este curso";

    mostrarModal({
      titulo: "Eliminar curso",
      mensaje: `¿Seguro que querés eliminar "${tituloCurso}" del carrito?`,
      tipo: "warning",
      accion: async () => {
        await eliminarDelCarrito(itemId);

        mostrarModal({
          titulo: "Curso eliminado",
          mensaje: `"${tituloCurso}" fue eliminado del carrito.`,
          tipo: "success",
          textoConfirmar: "Aceptar",
        });
      },
      textoConfirmar: "Sí, eliminar",
      textoCancelar: "Cancelar",
      mostrarCancelar: true,
    });
  };

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
              {modal.tipo === "success" && "✓"}
              {modal.tipo === "warning" && "!"}
              {modal.tipo === "error" && "×"}
              {modal.tipo === "info" && "i"}
            </div>

            <h2>{modal.titulo}</h2>
            <p>{modal.mensaje}</p>

            <div className="carrito-modal-actions">
              {modal.mostrarCancelar && (
                <button
                  type="button"
                  className="carrito-modal-btn-cancelar"
                  onClick={cerrarModal}
                >
                  {modal.textoCancelar}
                </button>
              )}

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
          <h1 className="carrito-title">Tu carrito</h1>
          <p className="carrito-subtitle">
            Revisá los cursos seleccionados antes de continuar con el pago.
          </p>
        </div>

        {carrito.length > 0 && (
          <div className="checkout-steps" aria-label="Progreso de compra">
            <div className="checkout-step checkout-step--active">
              <span>🛒</span>
              <p>Carrito</p>
            </div>

            <div className="checkout-step">
              <span>💳</span>
              <p>Pago</p>
            </div>

            <div className="checkout-step">
              <span>✓</span>
              <p>Confirmación</p>
            </div>
          </div>
        )}
      </div>

      {carrito.length === 0 ? (
        <div className="carrito-vacio">
          <div className="carrito-vacio-icono">🛒</div>
          <h2>Tu carrito está vacío</h2>
          <p>Explorá los cursos disponibles y agregá el que quieras empezar.</p>

          <Link to="/cursos" className="btn-finalizar">
            Ver cursos
          </Link>
        </div>
      ) : (
        <div className="carrito-container">
          <div className="carrito-lista">
            {carrito.map((item) => {
              const itemId = item.itemId || item.id || item._id;

              return (
                <article key={itemId} className="carrito-card">
                  <div className="carrito-imagen-wrap">
                    <img
                      src={item.imagen}
                      alt={item.titulo}
                      className="carrito-imagen"
                    />
                  </div>

                  <div className="carrito-info">
                    <div className="carrito-badges">
                      <span>Curso digital</span>
                      <span>Acceso inmediato</span>
                    </div>

                    <h2 className="carrito-item-title">{item.titulo}</h2>

                    <div className="carrito-meta">
                      <span>💻 Online</span>
                      <span>♾️ De por vida</span>
                      <span>☁️ Contenido actualizado</span>
                    </div>
                  </div>

                  <div className="carrito-acciones">
                    <p className="carrito-total-item">
                      ${Number(item.precio || 0).toLocaleString("es-AR")}
                    </p>

                    <button
                      type="button"
                      className="btn-eliminar"
                      onClick={() => handleEliminarCurso(item)}
                      aria-label={`Eliminar ${item.titulo}`}
                      title="Eliminar curso"
                      disabled={procesando || procesandoPagoVisual}
                    >
                      🗑
                    </button>
                  </div>
                </article>
              );
            })}

            <div className="carrito-cupon">
              <div className="carrito-cupon-icono">＋</div>

              <div>
                <h3>¿Tenés un cupón de descuento?</h3>
                <p>Podés aplicarlo en el siguiente paso de pago.</p>
              </div>

              <span className="carrito-cupon-flecha">›</span>
            </div>
          </div>

          <aside className="carrito-resumen">
            <div className="resumen-header">
              <h3>Resumen de tu compra</h3>
              <span>
                {carrito.length} curso{carrito.length > 1 ? "s" : ""}
              </span>
            </div>

            <div className="resumen-linea">
              <span>Subtotal</span>
              <strong>${subtotal.toLocaleString("es-AR")}</strong>
            </div>

            <div className="resumen-total">
              <span>Total</span>
              <strong>${subtotal.toLocaleString("es-AR")}</strong>
            </div>

            <div className="metodos-pago">
              <h4>Elegí tu método de pago</h4>

              {metodoExiste("TARJETA") && (
                <button
                  type="button"
                  className={`metodo-opcion ${
                    metodoPagoVisual === "MERCADO_PAGO" ? "activo" : ""
                  }`}
                  onClick={() =>
                    seleccionarMetodoPago("MERCADO_PAGO", "TARJETA")
                  }
                  disabled={procesando || procesandoPagoVisual}
                >
                  <span className="metodo-radio">
                    {metodoPagoVisual === "MERCADO_PAGO" && "✓"}
                  </span>

                  <span className="metodo-icono">💳</span>

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
                    metodoPagoVisual === "TARJETA_DEBITO_CREDITO"
                      ? "activo"
                      : ""
                  }`}
                  onClick={() =>
                    seleccionarMetodoPago("TARJETA_DEBITO_CREDITO", "TARJETA")
                  }
                  disabled={procesando || procesandoPagoVisual}
                >
                  <span className="metodo-radio">
                    {metodoPagoVisual === "TARJETA_DEBITO_CREDITO" && "✓"}
                  </span>

                  <span className="metodo-icono">💳</span>

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
                    {metodoPagoVisual === "TRANSFERENCIA" && "✓"}
                  </span>

                  <span className="metodo-icono">🏦</span>

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
                    {metodoPagoVisual === "PAYPAL" && "✓"}
                  </span>

                  <span className="metodo-icono">🅿️</span>

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

            <button
              type="button"
              className="btn-finalizar"
              onClick={handleContinuarPago}
              disabled={procesando || procesandoPagoVisual}
            >
              {procesando || procesandoPagoVisual
                ? "Procesando pago..."
                : "Continuar al pago →"}
            </button>

            <div className="resumen-botones-secundarios">
              <button
                type="button"
                className="btn-vaciar btn-vaciar-carrito"
                onClick={handleVaciarCarrito}
                disabled={procesando || procesandoPagoVisual}
              >
                Vaciar carrito
              </button>

              <Link to="/cursos" className="btn-vaciar btn-seguir-explorando">
                🛍️ Seguir explorando
              </Link>
            </div>

            <div className="carrito-confianza">
              <div>
                <span>🔒</span>
                <strong>Compra segura</strong>
                <p>Tus datos están protegidos</p>
              </div>

              <div>
                <span>⚡</span>
                <strong>Acceso inmediato</strong>
                <p>Comenzá a aprender enseguida</p>
              </div>

              <div>
                <span>🎧</span>
                <strong>Soporte incluido</strong>
                <p>Te acompañamos siempre</p>
              </div>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}

export default Carrito;
