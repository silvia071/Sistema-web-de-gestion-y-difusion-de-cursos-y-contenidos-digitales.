import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./AdminCursos.css";

const ESTADO_INICIAL_FORM = {
  titulo: "",
  descripcion: "",
  precio: "",
  duracion: "",
  nivel: "",
  categoria: "",
  estado: "BORRADOR",
  imagenPortada: "",
};

function AdminCursos() {
  const [cursos, setCursos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(ESTADO_INICIAL_FORM);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [procesandoId, setProcesandoId] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const [busqueda, setBusqueda] = useState("");
  const [filtroNivel, setFiltroNivel] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");

  const [modalEliminar, setModalEliminar] = useState(null);

  const formCursoRef = useRef(null);
  const inputTituloRef = useRef(null);
  const navigate = useNavigate();

  const obtenerIdCurso = (curso) => {
    return curso?._id || curso?.id;
  };

  const limpiarForm = () => {
    setForm(ESTADO_INICIAL_FORM);
    setEditandoId(null);
    setError("");
    setMensaje("");
  };

  const handleNuevoCurso = () => {
    limpiarForm();

    setTimeout(() => {
      formCursoRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      inputTituloRef.current?.focus();
    }, 100);
  };

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError("");

      const [cursosResponse, categoriasResponse] = await Promise.all([
        api.get("/api/cursos/admin/todos"),
        api.get("/api/categorias"),
      ]);

      setCursos(cursosResponse.data?.datos || []);
      setCategorias(categoriasResponse.data?.datos || []);
    } catch (error) {
      console.error("Error cargando datos:", error);
      setError(
        error.response?.data?.mensaje ||
          "No se pudieron cargar los datos del administrador.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validarForm = () => {
    const errores = [];

    const titulo = form.titulo.trim();
    const descripcion = form.descripcion.trim();
    const duracion = form.duracion.trim();
    const precio = Number(form.precio);

    if (!titulo) errores.push("El título es obligatorio.");
    if (!descripcion) errores.push("La descripción es obligatoria.");
    if (!form.precio) errores.push("El precio es obligatorio.");
    if (Number.isNaN(precio) || precio <= 0) {
      errores.push("El precio debe ser mayor a 0.");
    }
    if (!duracion) errores.push("La duración es obligatoria.");
    if (!form.nivel) errores.push("El nivel es obligatorio.");
    if (!form.categoria) errores.push("La categoría es obligatoria.");
    if (!form.estado) errores.push("El estado es obligatorio.");

    return errores;
  };

  const guardarCurso = async (e) => {
    e.preventDefault();
    setMensaje("");
    setError("");

    const errores = validarForm();

    if (errores.length > 0) {
      setError(errores.join(" "));
      return;
    }

    const cursoPayload = {
      titulo: form.titulo.trim(),
      descripcion: form.descripcion.trim(),
      precio: Number(form.precio),
      duracion: form.duracion.trim(),
      nivel: form.nivel,
      categoria: form.categoria,
      estado: form.estado,
    };

    if (form.imagenPortada.trim()) {
      cursoPayload.imagenPortada = form.imagenPortada.trim();
    }

    try {
      setGuardando(true);

      if (editandoId) {
        await api.put(`/api/cursos/${editandoId}`, cursoPayload);
        setMensaje("Curso editado correctamente.");
      } else {
        await api.post("/api/cursos", cursoPayload);
        setMensaje("Curso creado correctamente.");
      }

      limpiarForm();
      await cargarDatos();
    } catch (error) {
      console.error("Error guardando curso:", error);

      const data = error.response?.data;

      setError(
        data?.errores?.join(" ") ||
          data?.detalle ||
          data?.mensaje ||
          `Error al ${editandoId ? "editar" : "crear"} curso.`,
      );
    } finally {
      setGuardando(false);
    }
  };

  const abrirModalEliminar = (curso) => {
    setMensaje("");
    setError("");

    const cursoId = obtenerIdCurso(curso);

    if (!cursoId) {
      setError("No se pudo obtener el ID del curso.");
      return;
    }

    setModalEliminar(curso);
  };

  const cerrarModalEliminar = () => {
    setModalEliminar(null);
  };

  const confirmarEliminarCurso = async () => {
    if (!modalEliminar) return;

    const cursoId = obtenerIdCurso(modalEliminar);

    if (!cursoId) {
      setError("No se pudo obtener el ID del curso.");
      return;
    }

    try {
      setProcesandoId(cursoId);
      setMensaje("");
      setError("");

      await api.delete(`/api/cursos/${cursoId}`);

      setMensaje("Curso eliminado correctamente.");
      setModalEliminar(null);

      if (editandoId === cursoId) {
        limpiarForm();
      }

      await cargarDatos();
    } catch (error) {
      console.error("Error eliminando curso:", error);

      setError(
        error.response?.data?.mensaje ||
          error.response?.data?.detalle ||
          "Error al eliminar curso.",
      );
    } finally {
      setProcesandoId("");
    }
  };

  const cargarCursoParaEditar = (curso) => {
    const cursoId = obtenerIdCurso(curso);

    setEditandoId(cursoId);

    setForm({
      titulo: curso.titulo || "",
      descripcion: curso.descripcion || "",
      precio: curso.precio ?? "",
      duracion: curso.duracion || "",
      nivel: curso.nivel || "",
      categoria:
        typeof curso.categoria === "object"
          ? curso.categoria?._id || curso.categoria?.id || ""
          : curso.categoria || "",
      estado: curso.estado || "BORRADOR",
      imagenPortada: curso.imagenPortada || "",
    });

    setMensaje("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const formatearNivel = (nivel) => {
    if (!nivel) return "-";
    return nivel.charAt(0) + nivel.slice(1).toLowerCase();
  };

  const formatearEstado = (estado) => {
    if (estado === "PUBLICADO") return "Publicado";
    if (estado === "BORRADOR") return "Borrador";
    if (estado === "OCULTO") return "Oculto";
    return estado || "-";
  };

  const obtenerCategoriaNombre = (categoria) => {
    if (!categoria) return "-";

    if (typeof categoria === "object") {
      return categoria.nombre || "-";
    }

    const encontrada = categorias.find(
      (cat) => (cat._id || cat.id) === categoria,
    );

    return encontrada?.nombre || "-";
  };

  const obtenerInicialesCurso = (titulo = "") => {
    const texto = titulo.toLowerCase();

    if (texto.includes("javascript")) return "JS";
    if (texto.includes("python")) return "PY";
    if (texto.includes("java")) return "JV";
    if (texto.includes("c++")) return "C++";
    if (texto.includes("html")) return "HTML";
    if (texto.includes("css")) return "CSS";
    if (texto.includes("react")) return "RE";
    if (texto.includes("node")) return "ND";
    if (texto.includes("sql")) return "SQL";
    if (texto.includes("mongo")) return "DB";

    return titulo
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((palabra) => palabra[0])
      .join("")
      .toUpperCase();
  };

  const cursosFiltrados = useMemo(() => {
    return cursos.filter((curso) => {
      const textoBusqueda = busqueda.toLowerCase().trim();

      const coincideBusqueda =
        !textoBusqueda ||
        curso.titulo?.toLowerCase().includes(textoBusqueda) ||
        curso.descripcion?.toLowerCase().includes(textoBusqueda);

      const coincideNivel = !filtroNivel || curso.nivel === filtroNivel;
      const coincideEstado = !filtroEstado || curso.estado === filtroEstado;

      const cursoCategoria =
        typeof curso.categoria === "object"
          ? curso.categoria?._id || curso.categoria?.id
          : curso.categoria;

      const coincideCategoria =
        !filtroCategoria || cursoCategoria === filtroCategoria;

      return (
        coincideBusqueda && coincideNivel && coincideEstado && coincideCategoria
      );
    });
  }, [cursos, busqueda, filtroNivel, filtroEstado, filtroCategoria]);

  const totalCursos = cursos.length;

  const totalPublicados = cursos.filter(
    (curso) => curso.estado === "PUBLICADO",
  ).length;

  const totalBorradores = cursos.filter(
    (curso) => curso.estado === "BORRADOR",
  ).length;

  const totalOcultos = cursos.filter(
    (curso) => curso.estado === "OCULTO",
  ).length;

  const hayFiltrosActivos = Boolean(
    busqueda.trim() || filtroNivel || filtroCategoria || filtroEstado,
  );

  const limpiarFiltros = () => {
    setBusqueda("");
    setFiltroNivel("");
    setFiltroCategoria("");
    setFiltroEstado("");
  };

  if (loading) {
    return (
      <section className="admin-cursos-page">
        <div className="admin-cursos-shell admin-loading-card">
          <div className="admin-loading-icon">🎓</div>
          <h1>Gestión de cursos</h1>
          <p>Cargando cursos registrados...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="admin-cursos-page">
      <div className="admin-cursos-shell">
        <header className="admin-cursos-header">
          <div>
            <div className="admin-breadcrumb">
              <button
                type="button"
                className="admin-breadcrumb-link"
                onClick={() => navigate("/admin")}
              >
                Dashboard
              </button>
              <span>›</span>
              Cursos
            </div>

            <h1>Gestión de cursos</h1>

            <p>
              Creá, editá, publicá u ocultá cursos desde el panel de
              administración.
            </p>
          </div>

          <div className="admin-header-actions">
            <button
              type="button"
              className="admin-back-btn"
              onClick={() => navigate("/admin")}
            >
              ← Volver al panel
            </button>

            <button
              type="button"
              className="admin-primary-btn"
              onClick={handleNuevoCurso}
            >
              <span>+</span>
              Nuevo curso
            </button>
          </div>
        </header>

        {(mensaje || error || editandoId) && (
          <div className="admin-feedback-zone">
            {mensaje && <div className="admin-alert success">{mensaje}</div>}
            {error && <div className="admin-alert error">{error}</div>}

            {editandoId && (
              <div className="admin-alert info">
                Estás editando un curso seleccionado.
              </div>
            )}
          </div>
        )}

        <section className="admin-cursos-stats">
          <article className="admin-curso-stat-card purple">
            <div className="admin-curso-stat-icon">🎓</div>
            <div>
              <span>Total cursos</span>
              <strong>{totalCursos}</strong>
              <p>En la plataforma</p>
            </div>
          </article>

          <article className="admin-curso-stat-card green">
            <div className="admin-curso-stat-icon">◉</div>
            <div>
              <span>Publicados</span>
              <strong>{totalPublicados}</strong>
              <p>Cursos visibles</p>
            </div>
          </article>

          <article className="admin-curso-stat-card gold">
            <div className="admin-curso-stat-icon">▣</div>
            <div>
              <span>Borradores</span>
              <strong>{totalBorradores}</strong>
              <p>Pendientes de publicar</p>
            </div>
          </article>

          <article className="admin-curso-stat-card cyan">
            <div className="admin-curso-stat-icon">◌</div>
            <div>
              <span>Ocultos</span>
              <strong>{totalOcultos}</strong>
              <p>No visibles al público</p>
            </div>
          </article>
        </section>

        <div className="admin-toolbar">
          <div className="admin-search">
            <span>⌕</span>
            <input
              type="text"
              placeholder="Buscar cursos..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <label className="admin-filter">
            <span>Nivel</span>
            <select
              value={filtroNivel}
              onChange={(e) => setFiltroNivel(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="PRINCIPIANTE">Principiante</option>
              <option value="INTERMEDIO">Intermedio</option>
              <option value="AVANZADO">Avanzado</option>
            </select>
          </label>

          <label className="admin-filter">
            <span>Categoría</span>
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
            >
              <option value="">Todas</option>
              {categorias.map((cat) => (
                <option key={cat._id || cat.id} value={cat._id || cat.id}>
                  {cat.nombre}
                </option>
              ))}
            </select>
          </label>

          <label className="admin-filter">
            <span>Estado</span>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="BORRADOR">Borrador</option>
              <option value="PUBLICADO">Publicado</option>
              <option value="OCULTO">Oculto</option>
            </select>
          </label>

          <button
            type="button"
            className="admin-secondary-btn"
            onClick={cargarDatos}
          >
            ↻ Recargar
          </button>
        </div>

        <div className="admin-cursos-dashboard-grid">
          <form
            ref={formCursoRef}
            className="admin-form-card"
            onSubmit={guardarCurso}
          >
            <div className="admin-form-card-header">
              <div className="admin-form-icon">✎</div>

              <div>
                <h2>{editandoId ? "Editar curso" : "Crear nuevo curso"}</h2>
                <p>
                  {editandoId
                    ? "Modificá la información del curso seleccionado."
                    : "Completá la información para agregar un nuevo curso."}
                </p>
              </div>
            </div>

            <div className="admin-form-grid">
              <label>
                <span>Título</span>
                <input
                  ref={inputTituloRef}
                  name="titulo"
                  placeholder="Ej. Curso de JavaScript"
                  value={form.titulo}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                <span>Descripción</span>
                <textarea
                  name="descripcion"
                  placeholder="Describe brevemente el contenido del curso..."
                  value={form.descripcion}
                  onChange={handleChange}
                  rows={3}
                  required
                />
              </label>

              <label>
                <span>Precio</span>
                <input
                  name="precio"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="Ej. 15000"
                  value={form.precio}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                <span>Duración</span>
                <input
                  name="duracion"
                  placeholder="Ej. 20 horas"
                  value={form.duracion}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                <span>URL o ruta de imagen</span>
                <input
                  name="imagenPortada"
                  placeholder="https://ejemplo.com/imagen.jpg"
                  value={form.imagenPortada}
                  onChange={handleChange}
                />
              </label>

              <label>
                <span>Nivel</span>
                <select
                  name="nivel"
                  value={form.nivel}
                  onChange={handleChange}
                  required
                >
                  <option value="">Seleccioná el nivel</option>
                  <option value="PRINCIPIANTE">Principiante</option>
                  <option value="INTERMEDIO">Intermedio</option>
                  <option value="AVANZADO">Avanzado</option>
                </select>
              </label>

              <label>
                <span>Categoría</span>
                <select
                  name="categoria"
                  value={form.categoria}
                  onChange={handleChange}
                  required
                >
                  <option value="">Seleccioná la categoría</option>

                  {categorias.map((cat) => (
                    <option key={cat._id || cat.id} value={cat._id || cat.id}>
                      {cat.nombre}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Estado</span>
                <select
                  name="estado"
                  value={form.estado}
                  onChange={handleChange}
                  required
                >
                  <option value="BORRADOR">Borrador</option>
                  <option value="PUBLICADO">Publicado</option>
                  <option value="OCULTO">Oculto</option>
                </select>
              </label>
            </div>

            <div className="admin-form-actions admin-form-actions-inline">
              <button
                type="button"
                className="admin-clean-btn"
                onClick={limpiarForm}
                disabled={guardando}
              >
                {editandoId ? "Cancelar" : "Limpiar"}
              </button>

              <button
                type="submit"
                className="admin-save-btn"
                disabled={guardando}
              >
                {guardando
                  ? "Guardando..."
                  : editandoId
                    ? "Guardar cambios"
                    : "Guardar curso"}
              </button>
            </div>

            <div className="admin-cursos-help-card">
              <div>💡</div>
              <p>
                Los cursos en estado <strong>Publicado</strong> quedan visibles
                para los usuarios de la plataforma.
              </p>
            </div>
          </form>

          <div className="admin-list-card">
            <div className="admin-list-header">
              <div>
                <h2>Cursos cargados</h2>
                <p>Listado general de cursos cargados en la plataforma.</p>
              </div>

              <span>{cursosFiltrados.length} cursos</span>
            </div>

            <div className="admin-list">
              {cursosFiltrados.length === 0 ? (
                <div
                  className={`admin-empty-card ${
                    cursos.length === 0 ? "empty" : "filter"
                  }`}
                >
                  <div className="admin-empty-icon">
                    {cursos.length === 0 ? "🎓" : "🔎"}
                  </div>

                  <h3>
                    {cursos.length === 0
                      ? "No hay cursos creados"
                      : "No se encontraron cursos"}
                  </h3>

                  <p>
                    {cursos.length === 0
                      ? "Todavía no cargaste cursos en la plataforma. Cuando crees el primero, aparecerá en este listado."
                      : "No hay cursos que coincidan con la búsqueda o los filtros aplicados."}
                  </p>

                  <div className="admin-empty-actions">
                    {hayFiltrosActivos && cursos.length > 0 && (
                      <button type="button" onClick={limpiarFiltros}>
                        Limpiar filtros
                      </button>
                    )}

                    <button
                      type="button"
                      className="ghost"
                      onClick={cargarDatos}
                    >
                      Recargar cursos
                    </button>

                    {cursos.length === 0 && (
                      <button type="button" onClick={handleNuevoCurso}>
                        Crear curso
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                cursosFiltrados.map((curso) => {
                  const cursoId = obtenerIdCurso(curso);

                  return (
                    <article key={cursoId} className="admin-item">
                      <div className="admin-course-main">
                        <div className="admin-course-avatar">
                          {obtenerInicialesCurso(curso.titulo)}
                        </div>

                        <div>
                          <h3>{curso.titulo}</h3>
                          <p>{curso.descripcion}</p>
                        </div>
                      </div>

                      <div className="admin-course-meta">
                        <div>
                          <span>Nivel</span>
                          <strong className="admin-pill level">
                            {formatearNivel(curso.nivel)}
                          </strong>
                        </div>

                        <div>
                          <span>Categoría</span>
                          <strong>
                            {obtenerCategoriaNombre(curso.categoria)}
                          </strong>
                        </div>

                        <div>
                          <span>Precio</span>
                          <strong>
                            ${Number(curso.precio || 0).toLocaleString("es-AR")}
                          </strong>
                        </div>

                        <div>
                          <span>Estado</span>
                          <strong
                            className={`admin-pill status ${curso.estado?.toLowerCase()}`}
                          >
                            {formatearEstado(curso.estado)}
                          </strong>
                        </div>
                      </div>

                      <div className="admin-course-actions">
                        <button
                          type="button"
                          className="admin-edit-btn"
                          onClick={() => cargarCursoParaEditar(curso)}
                          title="Editar curso"
                          disabled={procesandoId === cursoId}
                        >
                          ✎
                        </button>

                        <button
                          type="button"
                          className="admin-delete-btn"
                          onClick={() => abrirModalEliminar(curso)}
                          title="Eliminar curso"
                          disabled={procesandoId === cursoId}
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

      {modalEliminar && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card">
            <div className="admin-modal-icon">🗑</div>

            <h2>Eliminar curso</h2>

            <p>
              ¿Seguro que querés eliminar el curso{" "}
              <strong>{modalEliminar.titulo}</strong>? También se eliminarán sus
              lecciones. Esta acción no se puede deshacer.
            </p>

            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-modal-cancel"
                onClick={cerrarModalEliminar}
                disabled={procesandoId === obtenerIdCurso(modalEliminar)}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="admin-modal-danger"
                onClick={confirmarEliminarCurso}
                disabled={procesandoId === obtenerIdCurso(modalEliminar)}
              >
                {procesandoId === obtenerIdCurso(modalEliminar)
                  ? "Eliminando..."
                  : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default AdminCursos;
