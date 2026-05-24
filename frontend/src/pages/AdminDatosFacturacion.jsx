import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./AdminDatosFacturacion.css";

function AdminDatosFacturacion() {
  const navigate = useNavigate();
  const [datos, setDatos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [busqueda, setBusqueda] = useState("");
  const [filtroCondicion, setFiltroCondicion] = useState("");

  const cargarDatosFacturacion = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/api/datos-facturacion");
      const datosRecibidos = response.data.datos || [];

      setDatos(Array.isArray(datosRecibidos) ? datosRecibidos : []);
    } catch (error) {
      console.error("Error cargando datos de facturación:", error);

      setError(
        error.response?.data?.mensaje ||
          error.response?.data?.error ||
          "No se pudieron cargar los datos de facturación.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatosFacturacion();
  }, []);

  const obtenerNombreCompleto = (usuario = {}) => {
    const nombreCompleto = `${usuario.nombre || ""} ${
      usuario.apellido || ""
    }`.trim();

    return nombreCompleto || "Cliente sin nombre";
  };

  const obtenerIniciales = (usuario = {}) => {
    const nombre = usuario.nombre?.trim()?.[0] || "";
    const apellido = usuario.apellido?.trim()?.[0] || "";

    return `${nombre}${apellido}`.toUpperCase() || "CL";
  };

  const formatearCondicionFiscal = (condicion) => {
    if (!condicion) return "-";

    return condicion
      .toLowerCase()
      .split("_")
      .map((palabra) => palabra.charAt(0).toUpperCase() + palabra.slice(1))
      .join(" ");
  };

  const condicionesDisponibles = useMemo(() => {
    const condiciones = datos
      .map((dato) => dato.condicionFiscal)
      .filter(Boolean);

    return [...new Set(condiciones)];
  }, [datos]);

  const datosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return datos.filter((dato) => {
      const usuario = dato.usuario || {};

      const campos = [
        dato.razonSocial,
        dato.cuitCuil,
        dato.condicionFiscal,
        dato.domicilioFiscal,
        usuario.nombre,
        usuario.apellido,
        usuario.email,
      ];

      const coincideBusqueda =
        !texto ||
        campos.some((campo) =>
          String(campo || "")
            .toLowerCase()
            .includes(texto),
        );

      const coincideCondicion =
        !filtroCondicion || dato.condicionFiscal === filtroCondicion;

      return coincideBusqueda && coincideCondicion;
    });
  }, [datos, busqueda, filtroCondicion]);

  const totalDatos = datos.length;

  const totalConsumidorFinal = datos.filter((dato) =>
    String(dato.condicionFiscal || "")
      .toLowerCase()
      .includes("consumidor"),
  ).length;

  const totalResponsables = datos.filter((dato) =>
    String(dato.condicionFiscal || "")
      .toLowerCase()
      .includes("responsable"),
  ).length;

  const totalConCuit = datos.filter((dato) => dato.cuitCuil).length;

  const hayFiltrosActivos = Boolean(busqueda.trim() || filtroCondicion);

  const limpiarFiltros = () => {
    setBusqueda("");
    setFiltroCondicion("");
  };

  if (loading) {
    return (
      <section className="admin-facturacion-page">
        <div className="admin-facturacion-shell admin-facturacion-loading">
          <div className="admin-facturacion-loading-icon">🧾</div>
          <h1>Datos de facturación</h1>
          <p>Cargando datos fiscales registrados...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="admin-facturacion-page">
      <div className="admin-facturacion-shell">
        <header className="admin-facturacion-header">
          <div>
            <div className="admin-facturacion-breadcrumb">
              Dashboard <span>›</span> Facturación
            </div>

            <h1>Datos de facturación</h1>

            <p>Administrá los datos fiscales cargados por los usuarios.</p>
          </div>

          <div className="admin-facturacion-header-actions">
            <button
              type="button"
              className="admin-facturacion-back-btn"
              onClick={() => navigate("/admin")}
            >
              ← Volver al panel
            </button>
          </div>
        </header>

        {error && (
          <div className="admin-facturacion-feedback">
            <div className="admin-facturacion-alert error">{error}</div>
          </div>
        )}

        <section className="admin-facturacion-stats">
          <article className="admin-facturacion-stat-card purple">
            <div className="admin-facturacion-stat-icon">🧾</div>

            <div>
              <span>Total datos</span>
              <strong>{totalDatos}</strong>
              <p>Registros fiscales</p>
            </div>
          </article>

          <article className="admin-facturacion-stat-card green">
            <div className="admin-facturacion-stat-icon">✓</div>

            <div>
              <span>Con CUIT / CUIL</span>
              <strong>{totalConCuit}</strong>
              <p>Datos completos</p>
            </div>
          </article>

          <article className="admin-facturacion-stat-card gold">
            <div className="admin-facturacion-stat-icon">CF</div>

            <div>
              <span>Consumidor final</span>
              <strong>{totalConsumidorFinal}</strong>
              <p>Clientes registrados</p>
            </div>
          </article>

          <article className="admin-facturacion-stat-card cyan">
            <div className="admin-facturacion-stat-icon">RI</div>

            <div>
              <span>Responsables</span>
              <strong>{totalResponsables}</strong>
              <p>Condición fiscal activa</p>
            </div>
          </article>
        </section>

        <div className="admin-facturacion-toolbar">
          <div className="admin-facturacion-search">
            <span>⌕</span>

            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por cliente, email, CUIT o razón social..."
            />
          </div>

          <label className="admin-facturacion-filter">
            <span>Condición fiscal</span>

            <select
              value={filtroCondicion}
              onChange={(e) => setFiltroCondicion(e.target.value)}
            >
              <option value="">Todas</option>

              {condicionesDisponibles.map((condicion) => (
                <option key={condicion} value={condicion}>
                  {formatearCondicionFiscal(condicion)}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className="admin-facturacion-secondary-btn"
            onClick={cargarDatosFacturacion}
          >
            ↻ Recargar
          </button>
        </div>

        <div className="admin-facturacion-list-card">
          <div className="admin-facturacion-list-header">
            <div>
              <h2>Datos fiscales registrados</h2>
              <p>Listado general de información fiscal cargada por clientes.</p>
            </div>

            <span>{datosFiltrados.length} registros</span>
          </div>

          <div className="admin-facturacion-list">
            {datosFiltrados.length === 0 ? (
              <div
                className={`admin-facturacion-empty-card ${
                  datos.length === 0 ? "empty" : "filter"
                }`}
              >
                <div className="admin-facturacion-empty-icon">
                  {datos.length === 0 ? "🧾" : "🔎"}
                </div>

                <h3>
                  {datos.length === 0
                    ? "No hay datos de facturación"
                    : "No se encontraron datos fiscales"}
                </h3>

                <p>
                  {datos.length === 0
                    ? "Todavía no hay información fiscal cargada por los usuarios. Cuando completen sus datos de facturación, aparecerán en este listado."
                    : "No hay datos fiscales que coincidan con la búsqueda o la condición fiscal seleccionada."}
                </p>

                <div className="admin-facturacion-empty-actions">
                  {hayFiltrosActivos && datos.length > 0 && (
                    <button type="button" onClick={limpiarFiltros}>
                      Limpiar filtros
                    </button>
                  )}

                  <button
                    type="button"
                    className="ghost"
                    onClick={cargarDatosFacturacion}
                  >
                    Recargar datos
                  </button>
                </div>
              </div>
            ) : (
              datosFiltrados.map((dato) => {
                const usuario = dato.usuario || {};

                return (
                  <article key={dato._id} className="admin-facturacion-item">
                    <div className="admin-facturacion-user">
                      <div className="admin-facturacion-avatar">
                        {obtenerIniciales(usuario)}
                      </div>

                      <div>
                        <h3>{obtenerNombreCompleto(usuario)}</h3>
                        <p>{usuario.email || "Sin email"}</p>
                      </div>
                    </div>

                    <div className="admin-facturacion-meta">
                      <div>
                        <span>Razón social</span>
                        <strong>{dato.razonSocial || "-"}</strong>
                      </div>

                      <div>
                        <span>CUIT / CUIL</span>
                        <strong>{dato.cuitCuil || "-"}</strong>
                      </div>

                      <div>
                        <span>Condición fiscal</span>
                        <strong className="admin-facturacion-pill">
                          {formatearCondicionFiscal(dato.condicionFiscal)}
                        </strong>
                      </div>

                      <div>
                        <span>Domicilio fiscal</span>
                        <strong>{dato.domicilioFiscal || "-"}</strong>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default AdminDatosFacturacion;
