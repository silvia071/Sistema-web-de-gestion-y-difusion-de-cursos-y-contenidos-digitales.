import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import "./AdminCompras.css";

function formatearPrecio(valor) {
  const numero = Number(valor || 0);

  return numero.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });
}
function obtenerSiglaCurso(titulo) {
  const palabrasIgnoradas = [
    "curso",
    "cursos",
    "de",
    "del",
    "la",
    "las",
    "el",
    "los",
    "y",
    "con",
    "para",
    "desde",
    "aprende",
    "aprendé",
    "introducción",
    "basico",
    "básico",
    "avanzado",
  ];

  const texto = String(titulo || "")
    .trim()
    .replace(/\s+/g, " ");

  if (!texto) return "C";

  const textoLower = texto.toLowerCase();

  const casosEspeciales = [
    { clave: "javascript", sigla: "JS" },
    { clave: "typescript", sigla: "TS" },
    { clave: "node", sigla: "ND" },
    { clave: "react", sigla: "RE" },
    { clave: "python", sigla: "PY" },
    { clave: "sql", sigla: "SQL" },
    { clave: "mongo", sigla: "MDB" },
    { clave: "html", sigla: "HTML" },
    { clave: "css", sigla: "CSS" },
    { clave: "api", sigla: "API" },
    { clave: "c++", sigla: "C++" },
  ];

  const casoEncontrado = casosEspeciales.find((caso) =>
    textoLower.includes(caso.clave),
  );

  if (casoEncontrado) return casoEncontrado.sigla;

  const palabras = texto
    .split(" ")
    .filter(Boolean)
    .filter((palabra) => !palabrasIgnoradas.includes(palabra.toLowerCase()));

  if (palabras.length === 0) {
    return texto.slice(0, 3).toUpperCase();
  }

  if (palabras.length === 1) {
    return palabras[0].slice(0, 3).toUpperCase();
  }

  return palabras
    .slice(0, 2)
    .map((palabra) => palabra[0])
    .join("")
    .toUpperCase();
}

function formatearFecha(fecha) {
  if (!fecha) return "Sin fecha";

  return new Date(fecha).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function obtenerDetalles(compra) {
  return Array.isArray(compra?.detalles) ? compra.detalles : [];
}

function normalizarEstado(estado) {
  return String(estado || "PENDIENTE").toUpperCase();
}

function normalizarFiltroEstado(valor) {
  const estado = String(valor || "").toUpperCase();

  const equivalencias = {
    TODOS: "todos",
    PENDIENTE: "pendiente",
    EN_PROCESO: "pendiente",
    APROBADA: "aprobada",
    APROBADO: "aprobada",
    PAGADA: "pagada",
    PAGADO: "pagada",
    COMPLETADA: "aprobada",
    COMPLETADO: "aprobada",
    RECHAZADA: "rechazada",
    RECHAZADO: "rechazada",
    CANCELADA: "cancelada",
    CANCELADO: "cancelada",
  };

  return equivalencias[estado] || "todos";
}

function claseEstado(estado) {
  const estadoNormalizado = normalizarEstado(estado);

  if (
    estadoNormalizado === "PAGADA" ||
    estadoNormalizado === "APROBADA" ||
    estadoNormalizado === "COMPLETADA" ||
    estadoNormalizado === "APROBADO" ||
    estadoNormalizado === "PAGADO"
  ) {
    return "aprobada";
  }

  if (estadoNormalizado === "PENDIENTE" || estadoNormalizado === "EN_PROCESO") {
    return "pendiente";
  }

  if (
    estadoNormalizado === "CANCELADA" ||
    estadoNormalizado === "RECHAZADA" ||
    estadoNormalizado === "CANCELADO" ||
    estadoNormalizado === "RECHAZADO"
  ) {
    return "rechazada";
  }

  return "";
}

function coincideEstadoCompra(estadoCompra, filtro) {
  const estado = normalizarEstado(estadoCompra);

  if (filtro === "todos") return true;

  if (filtro === "pendiente") {
    return estado === "PENDIENTE" || estado === "EN_PROCESO";
  }

  if (filtro === "aprobada") {
    return (
      estado === "APROBADA" ||
      estado === "APROBADO" ||
      estado === "COMPLETADA" ||
      estado === "COMPLETADO"
    );
  }

  if (filtro === "pagada") {
    return estado === "PAGADA" || estado === "PAGADO";
  }

  if (filtro === "rechazada") {
    return estado === "RECHAZADA" || estado === "RECHAZADO";
  }

  if (filtro === "cancelada") {
    return estado === "CANCELADA" || estado === "CANCELADO";
  }

  return true;
}

function obtenerNombreUsuario(usuario) {
  if (!usuario) return "Usuario no disponible";

  const nombreCompleto =
    `${usuario.nombre || ""} ${usuario.apellido || ""}`.trim();

  return nombreCompleto || usuario.email || "Usuario sin nombre";
}

export default function AdminCompras() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const estadoInicial = normalizarFiltroEstado(searchParams.get("estado"));

  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState(estadoInicial);
  const [orden, setOrden] = useState("recientes");
  const [compraSeleccionada, setCompraSeleccionada] = useState(null);

  const obtenerCompras = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/api/compra/admin/todas");

      const comprasData = Array.isArray(response.data?.datos)
        ? response.data.datos
        : Array.isArray(response.data)
          ? response.data
          : [];

      setCompras(comprasData);
    } catch (error) {
      setError(
        error.response?.data?.mensaje ||
          error.response?.data?.error ||
          error.message ||
          "No se pudieron cargar las órdenes de compra.",
      );
      setCompras([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    obtenerCompras();
  }, []);

  useEffect(() => {
    const estadoUrl = normalizarFiltroEstado(searchParams.get("estado"));
    setEstadoFiltro(estadoUrl);
  }, [searchParams]);

  const aplicarFiltroEstado = (estado) => {
    const estadoNormalizado = normalizarFiltroEstado(estado);

    setEstadoFiltro(estadoNormalizado);

    if (estadoNormalizado === "todos") {
      navigate("/admin/compras", { replace: true });
      return;
    }

    const estadoUrl = estadoNormalizado.toUpperCase();
    navigate(`/admin/compras?estado=${estadoUrl}`, { replace: true });
  };

  const limpiarFiltros = () => {
    setBusqueda("");
    setEstadoFiltro("todos");
    setOrden("recientes");
    navigate("/admin/compras", { replace: true });
  };

  const resumen = useMemo(() => {
    const totalFacturado = compras.reduce(
      (total, compra) => total + Number(compra.total || 0),
      0,
    );

    const pendientes = compras.filter((compra) => {
      const estado = normalizarEstado(compra.estado);
      return estado === "PENDIENTE" || estado === "EN_PROCESO";
    }).length;

    const aprobadas = compras.filter((compra) =>
      coincideEstadoCompra(compra.estado, "aprobada"),
    ).length;

    const pagadas = compras.filter((compra) =>
      coincideEstadoCompra(compra.estado, "pagada"),
    ).length;

    const cursosVendidos = compras.reduce(
      (total, compra) => total + obtenerDetalles(compra).length,
      0,
    );

    const usuariosUnicos = new Set(
      compras
        .map((compra) => compra?.usuario?._id || compra?.usuario?.id)
        .filter(Boolean),
    ).size;

    return {
      totalFacturado,
      pendientes,
      aprobadas,
      pagadas,
      cursosVendidos,
      usuariosUnicos,
    };
  }, [compras]);

  const comprasFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    let resultado = compras.filter((compra) => {
      const estado = normalizarEstado(compra.estado);
      const estadoTexto = estado.toLowerCase();

      const usuario = compra?.usuario || {};
      const datosUsuario =
        `${usuario.nombre || ""} ${usuario.apellido || ""} ${usuario.email || ""}`.toLowerCase();

      const cursos = obtenerDetalles(compra)
        .map((detalle) => detalle?.curso?.titulo || "")
        .join(" ")
        .toLowerCase();

      const idCompra = String(compra?._id || compra?.id || "").toLowerCase();

      const coincideTexto =
        !texto ||
        estadoTexto.includes(texto) ||
        datosUsuario.includes(texto) ||
        cursos.includes(texto) ||
        idCompra.includes(texto);

      const coincideEstado = coincideEstadoCompra(compra.estado, estadoFiltro);

      return coincideTexto && coincideEstado;
    });

    if (orden === "recientes") {
      resultado = [...resultado].sort(
        (a, b) =>
          new Date(b.createdAt || b.fechaCompra || 0) -
          new Date(a.createdAt || a.fechaCompra || 0),
      );
    }

    if (orden === "antiguas") {
      resultado = [...resultado].sort(
        (a, b) =>
          new Date(a.createdAt || a.fechaCompra || 0) -
          new Date(b.createdAt || b.fechaCompra || 0),
      );
    }

    if (orden === "mayor-total") {
      resultado = [...resultado].sort(
        (a, b) => Number(b.total || 0) - Number(a.total || 0),
      );
    }

    return resultado;
  }, [compras, busqueda, estadoFiltro, orden]);

  const hayFiltrosActivos =
    Boolean(busqueda.trim()) ||
    estadoFiltro !== "todos" ||
    orden !== "recientes";

  if (loading) {
    return (
      <main className="admin-compras-page">
        <section className="admin-compras-header">
          <div>
            <span>Panel administrador</span>
            <h1>Órdenes de compra</h1>
            <p>Cargando órdenes registradas...</p>
          </div>
        </section>

        <section className="admin-compras-table-card">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="admin-compras-skeleton"></div>
          ))}
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="admin-compras-page">
        <section className="admin-compras-header">
          <div>
            <span>Panel administrador</span>
            <h1>Órdenes de compra</h1>
            <p>Hubo un problema al cargar las órdenes.</p>
          </div>
        </section>

        <div className="admin-compras-empty admin-compras-empty-error">
          <span className="admin-compras-empty-icon">⚠️</span>

          <h3>No se pudieron cargar las compras</h3>

          <p>{error}</p>

          <button type="button" onClick={obtenerCompras}>
            Reintentar
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-compras-page">
      <section className="admin-compras-header">
        <div className="admin-compras-header-text">
          <div className="admin-compras-breadcrumb">
            Dashboard <span>›</span> Compras
          </div>

          <h1>Órdenes de compra</h1>

          <p>
            Visualizá las compras registradas en el sistema, sus usuarios,
            estado y cursos incluidos.
          </p>
        </div>

        <div className="admin-compras-header-actions">
          <button
            type="button"
            className="btn-volver-admin"
            onClick={() => navigate("/admin")}
          >
            ← Volver al panel
          </button>

          <button
            type="button"
            className="btn-recargar-admin"
            onClick={obtenerCompras}
          >
            ↻ Recargar
          </button>
        </div>
      </section>

      <section className="admin-compras-stats">
        <article>
          <span className="admin-stat-icon purple">🧾</span>
          <div>
            <strong>{compras.length}</strong>
            <p>Órdenes totales</p>
          </div>
        </article>

        <article>
          <span className="admin-stat-icon blue">💳</span>
          <div>
            <strong>{formatearPrecio(resumen.totalFacturado)}</strong>
            <p>Total registrado</p>
          </div>
        </article>

        <article>
          <span className="admin-stat-icon orange">◔</span>
          <div>
            <strong>{resumen.pendientes}</strong>
            <p>Pendientes</p>
          </div>
        </article>

        <article>
          <span className="admin-stat-icon green">🎓</span>
          <div>
            <strong>{resumen.cursosVendidos}</strong>
            <p>Cursos vendidos</p>
          </div>
        </article>
      </section>

      <section className="admin-compras-quick-filters">
        <button
          type="button"
          className={estadoFiltro === "todos" ? "active" : ""}
          onClick={() => aplicarFiltroEstado("todos")}
        >
          Todas
        </button>

        <button
          type="button"
          className={estadoFiltro === "pendiente" ? "active pendiente" : ""}
          onClick={() => aplicarFiltroEstado("PENDIENTE")}
        >
          Pendientes
        </button>

        <button
          type="button"
          className={estadoFiltro === "aprobada" ? "active aprobada" : ""}
          onClick={() => aplicarFiltroEstado("APROBADA")}
        >
          Aprobadas
        </button>

        <button
          type="button"
          className={estadoFiltro === "pagada" ? "active pagada" : ""}
          onClick={() => aplicarFiltroEstado("PAGADA")}
        >
          Pagadas
        </button>

        <button
          type="button"
          className={estadoFiltro === "rechazada" ? "active rechazada" : ""}
          onClick={() => aplicarFiltroEstado("RECHAZADA")}
        >
          Rechazadas
        </button>

        <button
          type="button"
          className={estadoFiltro === "cancelada" ? "active cancelada" : ""}
          onClick={() => aplicarFiltroEstado("CANCELADA")}
        >
          Canceladas
        </button>
      </section>

      <section className="admin-compras-toolbar">
        <div className="admin-compras-search">
          <span>⌕</span>
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por usuario, email, curso, estado o ID..."
          />
        </div>

        <select
          value={estadoFiltro}
          onChange={(e) => aplicarFiltroEstado(e.target.value)}
        >
          <option value="todos">Estado: Todos</option>
          <option value="pendiente">Pendientes</option>
          <option value="aprobada">Aprobadas</option>
          <option value="pagada">Pagadas</option>
          <option value="rechazada">Rechazadas</option>
          <option value="cancelada">Canceladas</option>
        </select>

        <select value={orden} onChange={(e) => setOrden(e.target.value)}>
          <option value="recientes">Más recientes</option>
          <option value="antiguas">Más antiguas</option>
          <option value="mayor-total">Mayor total</option>
        </select>

        {hayFiltrosActivos && (
          <button
            type="button"
            className="btn-limpiar-compras"
            onClick={limpiarFiltros}
          >
            Limpiar filtros
          </button>
        )}
      </section>

      {estadoFiltro !== "todos" && (
        <div className="admin-compras-filter-info">
          Mostrando compras filtradas por estado:{" "}
          <strong>{estadoFiltro.toUpperCase()}</strong>
        </div>
      )}

      <section className="admin-compras-table-card">
        {comprasFiltradas.length === 0 ? (
          <div className="admin-compras-empty compact">
            <span className="admin-compras-empty-icon">
              {compras.length === 0 ? "🧾" : "🔎"}
            </span>

            <h3>
              {compras.length === 0
                ? "No hay compras registradas"
                : "No encontramos órdenes"}
            </h3>

            <p>
              {compras.length === 0
                ? "Todavía no se generaron órdenes de compra en la plataforma. Cuando un usuario compre un curso, aparecerá en este listado."
                : "No hay compras que coincidan con la búsqueda, el estado seleccionado o el orden aplicado."}
            </p>

            <div className="admin-compras-empty-actions">
              {hayFiltrosActivos && compras.length > 0 && (
                <button type="button" onClick={limpiarFiltros}>
                  Limpiar filtros
                </button>
              )}

              <button type="button" onClick={obtenerCompras}>
                Recargar compras
              </button>
            </div>
          </div>
        ) : (
          <div className="admin-compras-table">
            {comprasFiltradas.map((compra) => {
              const usuario = compra.usuario;
              const detalles = obtenerDetalles(compra);
              const primerDetalle = detalles[0];
              const cursosExtra = Math.max(detalles.length - 1, 0);
              const estado = normalizarEstado(compra.estado);
              const estadoClase = claseEstado(estado);

              return (
                <article
                  key={compra._id || compra.id}
                  className="admin-compra-row"
                >
                  <div className="admin-compra-col orden">
                    <small>Orden</small>
                    <strong>
                      #{String(compra._id || compra.id).slice(-6)}
                    </strong>
                    <span className={`admin-compra-estado ${estadoClase}`}>
                      {estado}
                    </span>
                  </div>

                  <div className="admin-compra-col usuario">
                    <small>Usuario</small>
                    <strong>{obtenerNombreUsuario(usuario)}</strong>
                    <p>{usuario?.email || "Sin email"}</p>
                  </div>

                  <div className="admin-compra-col curso">
                    <small>Cursos ({detalles.length})</small>

                    {primerDetalle ? (
                      <>
                        <strong>
                          {primerDetalle?.curso?.titulo || "Curso sin título"}
                        </strong>
                        <p>
                          {primerDetalle?.curso?.categoria?.nombre ||
                            "Curso online"}
                        </p>
                        {cursosExtra > 0 && <em>+ {cursosExtra} curso más</em>}
                      </>
                    ) : (
                      <p>Sin cursos asociados</p>
                    )}
                  </div>

                  <div className="admin-compra-col fecha">
                    <small>Fecha</small>
                    <strong>
                      {formatearFecha(compra.createdAt || compra.fechaCompra)}
                    </strong>
                    <p>Mercado Pago</p>
                  </div>

                  <div className="admin-compra-col total">
                    <small>Total</small>
                    <strong>{formatearPrecio(compra.total)}</strong>
                    <button
                      type="button"
                      onClick={() => setCompraSeleccionada(compra)}
                    >
                      Ver detalle →
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {compraSeleccionada && (
        <div
          className="admin-compra-modal-overlay"
          onClick={() => setCompraSeleccionada(null)}
        >
          <div
            className="admin-compra-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-compra-modal-header">
              <div>
                <span>Detalle administrativo</span>
                <h2>
                  Orden #
                  {String(
                    compraSeleccionada._id || compraSeleccionada.id,
                  ).slice(-6)}
                </h2>
              </div>

              <button type="button" onClick={() => setCompraSeleccionada(null)}>
                ×
              </button>
            </div>

            <div className="admin-compra-modal-grid">
              <div>
                <small>Estado</small>
                <strong>{normalizarEstado(compraSeleccionada.estado)}</strong>
              </div>

              <div>
                <small>Fecha</small>
                <strong>
                  {formatearFecha(
                    compraSeleccionada.createdAt ||
                      compraSeleccionada.fechaCompra,
                  )}
                </strong>
              </div>

              <div>
                <small>Total</small>
                <strong>{formatearPrecio(compraSeleccionada.total)}</strong>
              </div>

              <div>
                <small>Usuario</small>
                <strong>
                  {obtenerNombreUsuario(compraSeleccionada.usuario)}
                </strong>
              </div>

              <div>
                <small>Email</small>
                <strong>
                  {compraSeleccionada.usuario?.email || "Sin email"}
                </strong>
              </div>

              <div>
                <small>ID completo</small>
                <strong>
                  {compraSeleccionada._id || compraSeleccionada.id}
                </strong>
              </div>
            </div>

            <div className="admin-compra-modal-cursos">
              <h3>Cursos incluidos</h3>

              {obtenerDetalles(compraSeleccionada).map((detalle) => (
                <div
                  key={detalle._id || detalle.id}
                  className="admin-compra-modal-curso"
                >
                  <span>{obtenerSiglaCurso(detalle?.curso?.titulo)}</span>

                  <div>
                    <strong>
                      {detalle?.curso?.titulo || "Curso sin título"}
                    </strong>
                    <p>
                      {detalle?.curso?.descripcion ||
                        detalle?.curso?.categoria?.nombre ||
                        "Curso online"}
                    </p>
                    <small>
                      {formatearPrecio(
                        detalle?.precioUnitario || detalle?.subtotal,
                      )}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
