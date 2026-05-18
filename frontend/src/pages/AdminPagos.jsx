import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import "./AdminPagos.css";

function AdminPagos() {
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [procesandoId, setProcesandoId] = useState(null);

  const [busqueda, setBusqueda] = useState("");
  const [filtroMetodo, setFiltroMetodo] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");

  const [modalConfirmacion, setModalConfirmacion] = useState(false);
  const [accionPendiente, setAccionPendiente] = useState(null);
  const [pagoPendiente, setPagoPendiente] = useState(null);

  const obtenerPagos = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/api/pagos");
      const datos = response.data.datos || response.data || [];

      setPagos(Array.isArray(datos) ? datos : []);
    } catch (error) {
      console.error("Error obteniendo pagos:", error);

      setError(
        error.response?.data?.mensaje || "No se pudieron cargar los pagos.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    obtenerPagos();
  }, []);

  const abrirModalConfirmacion = (pagoId, accion) => {
    setPagoPendiente(pagoId);
    setAccionPendiente(accion);
    setModalConfirmacion(true);
  };

  const cerrarModalConfirmacion = () => {
    setModalConfirmacion(false);
    setPagoPendiente(null);
    setAccionPendiente(null);
  };

  const confirmarAccionPago = async () => {
    if (!pagoPendiente || !accionPendiente) return;

    try {
      setProcesandoId(pagoPendiente);
      setMensaje("");
      setError("");

      await api.patch(`/api/pagos/${pagoPendiente}/${accionPendiente}`);

      if (accionPendiente === "aprobar") {
        setMensaje(
          "Pago aprobado correctamente. El acceso al curso fue habilitado.",
        );
      } else {
        setMensaje("Pago rechazado correctamente.");
      }

      setPagos((prev) =>
        prev.map((pago) =>
          pago._id === pagoPendiente
            ? {
                ...pago,
                estado:
                  accionPendiente === "aprobar" ? "APROBADO" : "RECHAZADO",
              }
            : pago,
        ),
      );
    } catch (error) {
      console.error("Error procesando pago:", error);

      setError(
        error.response?.data?.mensaje ||
          `No se pudo ${
            accionPendiente === "aprobar" ? "aprobar" : "rechazar"
          } el pago.`,
      );
    } finally {
      setProcesandoId(null);
      cerrarModalConfirmacion();
    }
  };

  const aprobarPago = (pagoId) => {
    abrirModalConfirmacion(pagoId, "aprobar");
  };

  const rechazarPago = (pagoId) => {
    abrirModalConfirmacion(pagoId, "rechazar");
  };

  const formatearPrecio = (valor) => {
    return Number(valor || 0).toLocaleString("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    });
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return "-";

    return new Date(fecha).toLocaleString("es-AR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  };

  const obtenerNombreUsuario = (usuario) => {
    if (!usuario) return "Usuario no disponible";

    const nombreCompleto = `${usuario.nombre || ""} ${
      usuario.apellido || ""
    }`.trim();

    return nombreCompleto || usuario.email || "Usuario sin nombre";
  };

  const obtenerInicialesUsuario = (usuario) => {
    if (!usuario) return "US";

    const nombre = usuario.nombre?.trim()?.[0] || "";
    const apellido = usuario.apellido?.trim()?.[0] || "";

    return `${nombre}${apellido}`.toUpperCase() || "US";
  };

  const obtenerMetodoPago = (metodoPago) => {
    if (!metodoPago) return "-";

    return metodoPago.tipo || metodoPago.nombre || "-";
  };

  const formatearMetodoPago = (metodoPago) => {
    const metodo = obtenerMetodoPago(metodoPago);

    if (metodo === "TRANSFERENCIA") return "Transferencia";
    if (metodo === "TARJETA") return "Tarjeta";
    if (metodo === "MERCADO_PAGO") return "Mercado Pago";

    return metodo;
  };

  const formatearEstado = (estado) => {
    if (estado === "APROBADO") return "Aprobado";
    if (estado === "RECHAZADO") return "Rechazado";
    if (estado === "PENDIENTE") return "Pendiente";

    return estado || "Pendiente";
  };

  const obtenerCursosTexto = (pago) => {
    const detalles = pago.compra?.detalles || [];

    if (detalles.length === 0) return "Sin cursos asociados";

    return detalles
      .map((detalle) => detalle.curso?.titulo || "Curso no disponible")
      .join(", ");
  };

  const pagosFiltrados = useMemo(() => {
    return pagos.filter((pago) => {
      const texto = busqueda.toLowerCase().trim();
      const estado = pago.estado || "PENDIENTE";
      const metodo = obtenerMetodoPago(pago.metodoPago);

      const nombreUsuario = obtenerNombreUsuario(pago.usuario).toLowerCase();
      const emailUsuario = pago.usuario?.email?.toLowerCase() || "";
      const cursosTexto = obtenerCursosTexto(pago).toLowerCase();
      const compraId = String(
        pago.compra?._id || pago.compra || "",
      ).toLowerCase();

      const coincideBusqueda =
        !texto ||
        nombreUsuario.includes(texto) ||
        emailUsuario.includes(texto) ||
        cursosTexto.includes(texto) ||
        compraId.includes(texto);

      const coincideMetodo = !filtroMetodo || metodo === filtroMetodo;
      const coincideEstado = !filtroEstado || estado === filtroEstado;

      return coincideBusqueda && coincideMetodo && coincideEstado;
    });
  }, [pagos, busqueda, filtroMetodo, filtroEstado]);

  const totalPagos = pagos.length;

  const totalAprobados = pagos.filter(
    (pago) => pago.estado === "APROBADO",
  ).length;

  const totalPendientes = pagos.filter(
    (pago) => (pago.estado || "PENDIENTE") === "PENDIENTE",
  ).length;

  const totalRechazados = pagos.filter(
    (pago) => pago.estado === "RECHAZADO",
  ).length;

  const montoTotal = pagos.reduce((total, pago) => {
    return total + Number(pago.monto || 0);
  }, 0);

  const metodosDisponibles = useMemo(() => {
    const metodos = pagos
      .map((pago) => obtenerMetodoPago(pago.metodoPago))
      .filter((metodo) => metodo && metodo !== "-");

    return [...new Set(metodos)];
  }, [pagos]);

  if (loading) {
    return (
      <section className="admin-pagos-page">
        <div className="admin-pagos-shell admin-pagos-loading">
          <h1>Gestión de pagos</h1>
          <p>Cargando pagos...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="admin-pagos-page">
      <div className="admin-pagos-shell">
        <header className="admin-pagos-header">
          <div>
            <div className="admin-pagos-breadcrumb">
              Dashboard <span>›</span> Pagos
            </div>

            <h1>Gestión de pagos</h1>

            <p>Revisá los pagos generados y aprobá o rechazá transferencias.</p>
          </div>

         
        </header>

        {(mensaje || error) && (
          <div className="admin-pagos-feedback">
            {mensaje && (
              <div className="admin-pagos-alert success">{mensaje}</div>
            )}
            {error && <div className="admin-pagos-alert error">{error}</div>}
          </div>
        )}

        <section className="admin-pagos-stats">
          <article className="admin-pago-stat-card purple">
            <div className="admin-pago-stat-icon">💳</div>
            <div>
              <span>Total pagos</span>
              <strong>{totalPagos}</strong>
              <p>Registrados</p>
            </div>
          </article>

          <article className="admin-pago-stat-card green">
            <div className="admin-pago-stat-icon">✓</div>
            <div>
              <span>Aprobados</span>
              <strong>{totalAprobados}</strong>
              <p>Accesos habilitados</p>
            </div>
          </article>

          <article className="admin-pago-stat-card gold">
            <div className="admin-pago-stat-icon">⏳</div>
            <div>
              <span>Pendientes</span>
              <strong>{totalPendientes}</strong>
              <p>Requieren revisión</p>
            </div>
          </article>

          <article className="admin-pago-stat-card cyan">
            <div className="admin-pago-stat-icon">↯</div>
            <div>
              <span>Monto total</span>
              <strong>{formatearPrecio(montoTotal)}</strong>
              <p>{totalRechazados} rechazados</p>
            </div>
          </article>
        </section>

        <div className="admin-pagos-toolbar">
          <div className="admin-pagos-search">
            <span>⌕</span>
            <input
              type="text"
              placeholder="Buscar por usuario, email, curso o compra..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <label className="admin-pagos-filter">
            <span>Método</span>
            <select
              value={filtroMetodo}
              onChange={(e) => setFiltroMetodo(e.target.value)}
            >
              <option value="">Todos los métodos</option>

              {metodosDisponibles.map((metodo) => (
                <option key={metodo} value={metodo}>
                  {formatearMetodoPago({ tipo: metodo })}
                </option>
              ))}
            </select>
          </label>

          <label className="admin-pagos-filter">
            <span>Estado</span>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <option value="">Todos los estados</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="APROBADO">Aprobado</option>
              <option value="RECHAZADO">Rechazado</option>
            </select>
          </label>

          <button
            type="button"
            className="admin-pagos-secondary-btn"
            onClick={obtenerPagos}
          >
            ↻ Recargar
          </button>
        </div>

        <div className="admin-pagos-list-card">
          <div className="admin-pagos-list-header">
            <div>
              <h2>Pagos registrados</h2>
              <p>Listado general de pagos generados en la plataforma.</p>
            </div>

            <span>{pagosFiltrados.length} pagos</span>
          </div>

          <div className="admin-pagos-list">
            {pagosFiltrados.length === 0 ? (
              <div className="admin-pagos-empty">
                No hay pagos para mostrar.
              </div>
            ) : (
              pagosFiltrados.map((pago) => {
                const estado = pago.estado || "PENDIENTE";
                const estaPendiente = estado === "PENDIENTE";
                const estaProcesando = procesandoId === pago._id;

                return (
                  <article key={pago._id} className="admin-pago-item">
                    <div className="admin-pago-user">
                      <div className="admin-pago-avatar">
                        {obtenerInicialesUsuario(pago.usuario)}
                      </div>

                      <div>
                        <h3>{obtenerNombreUsuario(pago.usuario)}</h3>
                        <p>{pago.usuario?.email || "Sin email"}</p>
                      </div>
                    </div>

                    <div className="admin-pago-meta">
                      <div>
                        <span>Método</span>
                        <strong>{formatearMetodoPago(pago.metodoPago)}</strong>
                      </div>

                      <div>
                        <span>Curso/s</span>
                        <strong>{obtenerCursosTexto(pago)}</strong>
                      </div>

                      <div>
                        <span>Compra</span>
                        <strong>
                          {pago.compra?._id || pago.compra || "-"}
                        </strong>
                      </div>

                      <div>
                        <span>Fecha</span>
                        <strong>
                          {formatearFecha(pago.createdAt || pago.fechaPago)}
                        </strong>
                      </div>
                    </div>

                    <div className="admin-pago-summary">
                      <strong>{formatearPrecio(pago.monto)}</strong>

                      <span
                        className={`admin-pago-pill ${estado.toLowerCase()}`}
                      >
                        {formatearEstado(estado)}
                      </span>
                    </div>

                    <div className="admin-pago-actions">
                      {estaPendiente ? (
                        <>
                          <button
                            type="button"
                            className="admin-pago-approve-btn"
                            disabled={estaProcesando}
                            onClick={() => aprobarPago(pago._id)}
                            title="Aprobar pago"
                          >
                            ✓
                          </button>

                          <button
                            type="button"
                            className="admin-pago-reject-btn"
                            disabled={estaProcesando}
                            onClick={() => rechazarPago(pago._id)}
                            title="Rechazar pago"
                          >
                            ✕
                          </button>
                        </>
                      ) : (
                        <span className="admin-pago-resolved">
                          {estado === "APROBADO" && "Pago aprobado"}
                          {estado === "RECHAZADO" && "Pago rechazado"}
                        </span>
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>

        {modalConfirmacion && (
          <div className="admin-pagos-modal-overlay">
            <div className="admin-pagos-modal">
              <h3>
                {accionPendiente === "aprobar"
                  ? "Confirmar aprobación"
                  : "Confirmar rechazo"}
              </h3>

              <p>
                {accionPendiente === "aprobar"
                  ? "¿Seguro que querés aprobar este pago? Esto habilitará el acceso al curso."
                  : "¿Seguro que querés rechazar este pago? La compra quedará cancelada."}
              </p>

              <div className="admin-pagos-modal-actions">
                <button
                  type="button"
                  className="admin-pagos-modal-cancel"
                  onClick={cerrarModalConfirmacion}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  className={
                    accionPendiente === "aprobar"
                      ? "admin-pagos-modal-confirm"
                      : "admin-pagos-modal-confirm danger"
                  }
                  onClick={confirmarAccionPago}
                  disabled={procesandoId === pagoPendiente}
                >
                  {procesandoId === pagoPendiente
                    ? "Procesando..."
                    : accionPendiente === "aprobar"
                      ? "Aprobar"
                      : "Rechazar"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default AdminPagos;
