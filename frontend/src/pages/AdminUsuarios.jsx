import { useEffect, useMemo, useRef, useState } from "react";
import api from "../services/api";
import "./AdminUsuarios.css";

const USUARIO_INICIAL = {
  nombre: "",
  apellido: "",
  email: "",
  password: "",
  rol: "ESTUDIANTE",
};

function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");

  const [nuevoUsuario, setNuevoUsuario] = useState(USUARIO_INICIAL);
  const formUsuarioRef = useRef(null);
  const inputNombreRef = useRef(null);

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/api/usuarios");
      setUsuarios(response.data.datos || []);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los usuarios.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const limpiarForm = () => {
    setNuevoUsuario(USUARIO_INICIAL);
    setMensaje("");
    setError("");
  };

  const handleNuevoUsuario = () => {
    limpiarForm();

    setTimeout(() => {
      formUsuarioRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      inputNombreRef.current?.focus();
    }, 100);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setNuevoUsuario((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");
    setError("");

    try {
      setGuardando(true);

      await api.post("/api/usuarios", nuevoUsuario);

      setMensaje("Usuario creado correctamente.");

      setNuevoUsuario(USUARIO_INICIAL);

      await cargarUsuarios();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.mensaje || "Error al crear usuario.");
    } finally {
      setGuardando(false);
    }
  };

  const obtenerEstadoUsuario = (usuario) => {
    return usuario.estado || "ACTIVO";
  };

  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((usuario) => {
      const texto = busqueda.toLowerCase().trim();

      const coincideBusqueda =
        !texto ||
        usuario.nombre?.toLowerCase().includes(texto) ||
        usuario.apellido?.toLowerCase().includes(texto) ||
        usuario.email?.toLowerCase().includes(texto);

      const coincideRol = !filtroRol || usuario.rol === filtroRol;

      const estadoUsuario = obtenerEstadoUsuario(usuario);
      const coincideEstado = !filtroEstado || estadoUsuario === filtroEstado;

      return coincideBusqueda && coincideRol && coincideEstado;
    });
  }, [usuarios, busqueda, filtroRol, filtroEstado]);

  const totalUsuarios = usuarios.length;

  const totalActivos = usuarios.filter(
    (usuario) => obtenerEstadoUsuario(usuario) === "ACTIVO",
  ).length;

  const totalAdmins = usuarios.filter(
    (usuario) => usuario.rol === "ADMINISTRADOR",
  ).length;

  const totalClientes = usuarios.filter(
    (usuario) => usuario.rol === "CLIENTE",
  ).length;

  const obtenerIniciales = (usuario) => {
    const nombre = usuario.nombre?.trim()?.[0] || "";
    const apellido = usuario.apellido?.trim()?.[0] || "";

    return `${nombre}${apellido}`.toUpperCase() || "US";
  };

  const formatearRol = (rol) => {
    if (rol === "ADMINISTRADOR") return "Administrador";
    if (rol === "ESTUDIANTE") return "Estudiante";
    if (rol === "CLIENTE") return "Cliente";
    return rol || "-";
  };

  const formatearEstado = (estado) => {
    if (estado === "ACTIVO") return "Activo";
    if (estado === "BLOQUEADO") return "Bloqueado";
    if (estado === "PENDIENTE") return "Pendiente";
    return estado || "Activo";
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return "-";

    return new Date(fecha).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <section className="admin-usuarios-page">
      <div className="admin-usuarios-shell">
        <header className="admin-usuarios-header">
          <div>
            <div className="admin-usuarios-breadcrumb">
              Dashboard <span>›</span> Usuarios
            </div>

            <h1>Gestión de usuarios</h1>

            <p>Administrá usuarios, roles y accesos de la plataforma.</p>
          </div>

          <button
            type="button"
            className="admin-usuarios-primary-btn"
            onClick={handleNuevoUsuario}
          >
            <span>+</span>
            Nuevo usuario
          </button>
        </header>

        {(mensaje || error) && (
          <div className="admin-usuarios-feedback">
            {mensaje && (
              <div className="admin-usuarios-alert success">{mensaje}</div>
            )}

            {error && <div className="admin-usuarios-alert error">{error}</div>}
          </div>
        )}

        <section className="admin-usuarios-stats">
          <article className="admin-usuario-stat-card purple">
            <div className="admin-stat-icon">👥</div>
            <div>
              <span>Total usuarios</span>
              <strong>{totalUsuarios}</strong>
              <p>En la plataforma</p>
            </div>
          </article>

          <article className="admin-usuario-stat-card green">
            <div className="admin-stat-icon">✓</div>
            <div>
              <span>Activos</span>
              <strong>{totalActivos}</strong>
              <p>Usuarios habilitados</p>
            </div>
          </article>

          <article className="admin-usuario-stat-card gold">
            <div className="admin-stat-icon">⚙</div>
            <div>
              <span>Administradores</span>
              <strong>{totalAdmins}</strong>
              <p>Acceso completo</p>
            </div>
          </article>

          <article className="admin-usuario-stat-card cyan">
            <div className="admin-stat-icon">●</div>
            <div>
              <span>Clientes</span>
              <strong>{totalClientes}</strong>
              <p>Usuarios compradores</p>
            </div>
          </article>
        </section>

        <div className="admin-usuarios-toolbar">
          <div className="admin-usuarios-search">
            <span>⌕</span>
            <input
              type="text"
              placeholder="Buscar usuarios por nombre, email o apellido..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <label className="admin-usuarios-filter">
            <span>Rol</span>
            <select
              value={filtroRol}
              onChange={(e) => setFiltroRol(e.target.value)}
            >
              <option value="">Todos los roles</option>
              <option value="ESTUDIANTE">Estudiante</option>
              <option value="CLIENTE">Cliente</option>
              <option value="ADMINISTRADOR">Administrador</option>
            </select>
          </label>

          <label className="admin-usuarios-filter">
            <span>Estado</span>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <option value="">Todos los estados</option>
              <option value="ACTIVO">Activo</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="BLOQUEADO">Bloqueado</option>
            </select>
          </label>

          <button
            type="button"
            className="admin-usuarios-secondary-btn"
            onClick={cargarUsuarios}
          >
            ↻ Recargar
          </button>
        </div>

        <div className="admin-usuarios-dashboard-grid">
          <form
            ref={formUsuarioRef}
            className="admin-usuarios-form-card"
            onSubmit={handleSubmit}
          >
            <div className="admin-usuarios-form-header">
              <div className="admin-usuarios-form-icon">♙</div>

              <div>
                <h2>Crear nuevo usuario</h2>
                <p>
                  Completá los datos para crear un nuevo usuario en la
                  plataforma.
                </p>
              </div>
            </div>

            <div className="admin-usuarios-form-grid">
              <label>
                <span>Nombre</span>
                <input
                  ref={inputNombreRef}
                  type="text"
                  name="nombre"
                  placeholder="Ej. Juan"
                  value={nuevoUsuario.nombre}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                <span>Apellido</span>
                <input
                  type="text"
                  name="apellido"
                  placeholder="Ej. Pérez"
                  value={nuevoUsuario.apellido}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                <span>Email</span>
                <input
                  type="email"
                  name="email"
                  placeholder="Ej. juan.perez@correo.com"
                  value={nuevoUsuario.email}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                <span>Contraseña</span>
                <input
                  type="password"
                  name="password"
                  placeholder="Mínimo 8 caracteres"
                  value={nuevoUsuario.password}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                <span>Rol</span>
                <select
                  name="rol"
                  value={nuevoUsuario.rol}
                  onChange={handleChange}
                >
                  <option value="ESTUDIANTE">Estudiante</option>
                  <option value="CLIENTE">Cliente</option>
                  <option value="ADMINISTRADOR">Administrador</option>
                </select>
              </label>
            </div>

            <div className="admin-usuarios-form-actions">
              <button
                type="button"
                className="admin-usuarios-clean-btn"
                onClick={limpiarForm}
                disabled={guardando}
              >
                Limpiar
              </button>

              <button
                type="submit"
                className="admin-usuarios-save-btn"
                disabled={guardando}
              >
                {guardando ? "Creando..." : "Crear usuario"}
              </button>
            </div>

            <div className="admin-usuarios-permission-card">
              <div>🛡</div>
              <p>
                Los usuarios con rol <strong>Administrador</strong> tienen
                acceso completo al panel.
              </p>
            </div>
          </form>

          <div className="admin-usuarios-list-card">
            <div className="admin-usuarios-list-header">
              <div>
                <h2>Usuarios registrados</h2>
                <p>Listado general de usuarios cargados en la plataforma.</p>
              </div>

              <span>{usuariosFiltrados.length} usuarios</span>
            </div>

            <div className="admin-usuarios-list">
              {loading ? (
                <div className="admin-usuarios-empty">Cargando usuarios...</div>
              ) : usuariosFiltrados.length === 0 ? (
                <div className="admin-usuarios-empty">
                  No hay usuarios para mostrar.
                </div>
              ) : (
                usuariosFiltrados.map((usuario) => {
                  const estadoUsuario = obtenerEstadoUsuario(usuario);

                  return (
                    <article key={usuario._id} className="admin-usuario-item">
                      <div className="admin-usuario-main">
                        <div className="admin-usuario-avatar">
                          {obtenerIniciales(usuario)}
                        </div>

                        <div>
                          <h3>
                            {usuario.nombre} {usuario.apellido}
                          </h3>
                          <p>{usuario.email}</p>
                        </div>
                      </div>

                      <div className="admin-usuario-meta">
                        <div>
                          <span>Rol</span>
                          <strong
                            className={`admin-usuario-pill rol ${usuario.rol?.toLowerCase()}`}
                          >
                            {formatearRol(usuario.rol)}
                          </strong>
                        </div>

                        <div>
                          <span>Estado</span>
                          <strong
                            className={`admin-usuario-pill estado ${estadoUsuario.toLowerCase()}`}
                          >
                            {formatearEstado(estadoUsuario)}
                          </strong>
                        </div>

                        <div className="admin-usuario-date">
                          <span>Registrado</span>
                          <strong>
                            {formatearFecha(
                              usuario.createdAt || usuario.fechaCreacion,
                            )}
                          </strong>
                        </div>
                      </div>

                      <div className="admin-usuario-actions">
                        <button
                          type="button"
                          className="admin-usuario-edit-btn"
                        >
                          ✎
                        </button>

                        <button
                          type="button"
                          className="admin-usuario-role-btn"
                        >
                          ⇄
                        </button>

                        <button
                          type="button"
                          className="admin-usuario-delete-btn"
                        >
                          🗑
                        </button>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AdminUsuarios;
