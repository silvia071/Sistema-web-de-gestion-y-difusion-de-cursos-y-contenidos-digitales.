import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./AdminLecciones.css";

const FORM_INICIAL = {
  titulo: "",
  descripcion: "",
  contenido: "",
  videoUrl: "",
  duracionMinutos: "",
  orden: "",
  estado: "PUBLICADO",
};

function AdminLecciones() {
  const [cursos, setCursos] = useState([]);
  const [lecciones, setLecciones] = useState([]);
  const [cursoSeleccionado, setCursoSeleccionado] = useState("");
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(FORM_INICIAL);

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [loadingCursos, setLoadingCursos] = useState(true);
  const [loadingLecciones, setLoadingLecciones] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const formLeccionRef = useRef(null);
  const inputTituloRef = useRef(null);
  const navigate = useNavigate();

  const cursoActivo = cursos.find((curso) => curso._id === cursoSeleccionado);

  const obtenerLecciones = async (cursoId) => {
    if (!cursoId) {
      setLecciones([]);
      return;
    }

    try {
      setLoadingLecciones(true);
      setError("");

      const response = await api.get(`/api/lecciones/admin/curso/${cursoId}`);
      setLecciones(response.data.datos || []);
    } catch (error) {
      console.error("ERROR OBTENIENDO LECCIONES:", error);
      setLecciones([]);
      setError(
        error.response?.data?.mensaje ||
          "No se pudieron cargar las lecciones del curso.",
      );
    } finally {
      setLoadingLecciones(false);
    }
  };

  useEffect(() => {
    const cargarCursosIniciales = async () => {
      try {
        setLoadingCursos(true);
        setError("");

        const response = await api.get("/api/cursos/admin/todos");
        setCursos(response.data.datos || []);
      } catch (error) {
        console.error("ERROR OBTENIENDO CURSOS:", error);
        setError(
          error.response?.data?.mensaje ||
            "No se pudieron cargar los cursos disponibles.",
        );
      } finally {
        setLoadingCursos(false);
      }
    };

    cargarCursosIniciales();
  }, []);

  useEffect(() => {
    obtenerLecciones(cursoSeleccionado);
  }, [cursoSeleccionado]);

  const limpiarForm = () => {
    setForm(FORM_INICIAL);
    setEditandoId(null);
    setError("");
    setMensaje("");
  };

  const handleNuevaLeccion = () => {
    limpiarForm();

    setTimeout(() => {
      formLeccionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      inputTituloRef.current?.focus();
    }, 100);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validarForm = () => {
    const errores = [];

    if (!cursoSeleccionado) errores.push("Seleccioná un curso.");
    if (!form.titulo.trim()) errores.push("El título es obligatorio.");
    if (!form.descripcion.trim()) {
      errores.push("La descripción es obligatoria.");
    }
    if (!form.contenido.trim()) errores.push("El contenido es obligatorio.");

    const duracion = Number(form.duracionMinutos);
    const orden = Number(form.orden);

    if (!form.duracionMinutos) errores.push("La duración es obligatoria.");
    if (Number.isNaN(duracion) || duracion <= 0) {
      errores.push("La duración debe ser mayor a 0.");
    }

    if (!form.orden) errores.push("El orden es obligatorio.");
    if (Number.isNaN(orden) || orden <= 0) {
      errores.push("El orden debe ser mayor a 0.");
    }

    if (!form.estado) errores.push("El estado es obligatorio.");

    return errores;
  };

  const guardarLeccion = async (e) => {
    e.preventDefault();
    setMensaje("");
    setError("");

    const errores = validarForm();

    if (errores.length > 0) {
      setError(errores.join(" "));
      return;
    }

    const payload = {
      titulo: form.titulo.trim(),
      descripcion: form.descripcion.trim(),
      contenido: form.contenido.trim(),
      videoUrl: form.videoUrl.trim(),
      curso: cursoSeleccionado,
      duracionMinutos: Number(form.duracionMinutos),
      orden: Number(form.orden),
      estado: form.estado,
    };

    try {
      setGuardando(true);

      if (editandoId) {
        await api.put(`/api/lecciones/${editandoId}`, payload);
        setMensaje("Lección editada correctamente.");
      } else {
        await api.post("/api/lecciones", payload);
        setMensaje("Lección creada correctamente.");
      }

      limpiarForm();
      await obtenerLecciones(cursoSeleccionado);
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.mensaje ||
          error.response?.data?.errores?.join(" ") ||
          "Error al guardar la lección.",
      );
    } finally {
      setGuardando(false);
    }
  };

  const cargarParaEditar = (leccion) => {
    setEditandoId(leccion._id);

    setForm({
      titulo: leccion.titulo || "",
      descripcion: leccion.descripcion || "",
      contenido: leccion.contenido || "",
      videoUrl: leccion.videoUrl || "",
      duracionMinutos: leccion.duracionMinutos || "",
      orden: leccion.orden || "",
      estado: leccion.estado || "PUBLICADO",
    });

    setMensaje("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const eliminarLeccion = async (id) => {
    const confirmar = window.confirm(
      "¿Seguro que querés eliminar esta lección?",
    );

    if (!confirmar) return;

    try {
      setMensaje("");
      setError("");

      await api.delete(`/api/lecciones/${id}`);

      setMensaje("Lección eliminada correctamente.");
      await obtenerLecciones(cursoSeleccionado);
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.mensaje || "Error al eliminar la lección.",
      );
    }
  };

  const formatearEstado = (estado) => {
    if (estado === "PUBLICADO") return "Publicado";
    if (estado === "BORRADOR") return "Borrador";
    if (estado === "OCULTO") return "Oculto";
    return estado || "-";
  };

  const leccionesFiltradas = useMemo(() => {
    return lecciones.filter((leccion) => {
      const texto = busqueda.toLowerCase().trim();

      const coincideBusqueda =
        !texto ||
        leccion.titulo?.toLowerCase().includes(texto) ||
        leccion.descripcion?.toLowerCase().includes(texto) ||
        leccion.contenido?.toLowerCase().includes(texto);

      const coincideEstado = !filtroEstado || leccion.estado === filtroEstado;

      return coincideBusqueda && coincideEstado;
    });
  }, [lecciones, busqueda, filtroEstado]);

  const totalLecciones = lecciones.length;

  const totalPublicadas = lecciones.filter(
    (leccion) => leccion.estado === "PUBLICADO",
  ).length;

  const totalBorradores = lecciones.filter(
    (leccion) => leccion.estado === "BORRADOR",
  ).length;

  const duracionTotal = lecciones.reduce((total, leccion) => {
    return total + Number(leccion.duracionMinutos || 0);
  }, 0);

  const hayFiltrosActivos = Boolean(busqueda.trim() || filtroEstado);

  const limpiarFiltros = () => {
    setBusqueda("");
    setFiltroEstado("");
  };

  if (loadingCursos) {
    return (
      <section className="admin-lecciones-page">
        <div className="admin-lecciones-shell admin-lecciones-loading">
          <div className="admin-lecciones-loading-icon">▤</div>
          <h1>Gestión de lecciones</h1>
          <p>Cargando cursos disponibles...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="admin-lecciones-page">
      <div className="admin-lecciones-shell">
        <header className="admin-lecciones-header">
          <div>
            <div className="admin-lecciones-breadcrumb">
              Dashboard <span>›</span> Lecciones
            </div>

            <h1>Gestión de lecciones</h1>

            <p>
              Creá, editá, publicá u ocultá lecciones asociadas a cada curso.
            </p>
          </div>

          <div className="admin-lecciones-header-actions">
            <button
              type="button"
              className="admin-lecciones-back-btn"
              onClick={() => navigate("/admin")}
            >
              ← Volver al panel
            </button>

            <button
              type="button"
              className="admin-lecciones-primary-btn"
              onClick={handleNuevaLeccion}
            >
              <span>+</span>
              Nueva lección
            </button>
          </div>
        </header>

        {(mensaje || error || editandoId) && (
          <div className="admin-lecciones-feedback">
            {mensaje && (
              <div className="admin-lecciones-alert success">{mensaje}</div>
            )}

            {error && (
              <div className="admin-lecciones-alert error">{error}</div>
            )}

            {editandoId && (
              <div className="admin-lecciones-alert info">
                Estás editando una lección seleccionada.
              </div>
            )}
          </div>
        )}

        <section className="admin-lecciones-stats">
          <article className="admin-leccion-stat-card purple">
            <div className="admin-leccion-stat-icon">▤</div>
            <div>
              <span>Total lecciones</span>
              <strong>{totalLecciones}</strong>
              <p>Del curso seleccionado</p>
            </div>
          </article>

          <article className="admin-leccion-stat-card green">
            <div className="admin-leccion-stat-icon">✓</div>
            <div>
              <span>Publicadas</span>
              <strong>{totalPublicadas}</strong>
              <p>Contenido visible</p>
            </div>
          </article>

          <article className="admin-leccion-stat-card gold">
            <div className="admin-leccion-stat-icon">▣</div>
            <div>
              <span>Borradores</span>
              <strong>{totalBorradores}</strong>
              <p>Pendientes de publicar</p>
            </div>
          </article>

          <article className="admin-leccion-stat-card cyan">
            <div className="admin-leccion-stat-icon">⏱</div>
            <div>
              <span>Duración total</span>
              <strong>{duracionTotal}</strong>
              <p>Minutos cargados</p>
            </div>
          </article>
        </section>

        <div className="admin-lecciones-toolbar">
          <label className="admin-lecciones-filter">
            <span>Curso</span>
            <select
              value={cursoSeleccionado}
              onChange={(e) => {
                setCursoSeleccionado(e.target.value);
                limpiarForm();
              }}
              required
            >
              <option value="">Seleccionar curso</option>

              {cursos.map((curso) => (
                <option key={curso._id} value={curso._id}>
                  {curso.titulo}
                </option>
              ))}
            </select>
          </label>

          <div className="admin-lecciones-search">
            <span>⌕</span>
            <input
              type="text"
              placeholder="Buscar lecciones..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <label className="admin-lecciones-filter">
            <span>Estado</span>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <option value="">Todos los estados</option>
              <option value="PUBLICADO">Publicado</option>
              <option value="BORRADOR">Borrador</option>
              <option value="OCULTO">Oculto</option>
            </select>
          </label>

          <button
            type="button"
            className="admin-lecciones-secondary-btn"
            onClick={() => obtenerLecciones(cursoSeleccionado)}
          >
            ↻ Recargar
          </button>
        </div>

        <div className="admin-lecciones-dashboard-grid">
          <form
            ref={formLeccionRef}
            className="admin-leccion-form-card"
            onSubmit={guardarLeccion}
          >
            <div className="admin-leccion-form-header">
              <div className="admin-leccion-form-icon">▣</div>

              <div>
                <h2>{editandoId ? "Editar lección" : "Crear nueva lección"}</h2>
                <p>
                  {editandoId
                    ? "Modificá la información de la lección seleccionada."
                    : "Completá los datos para agregar una nueva lección."}
                </p>
              </div>
            </div>

            <div className="admin-leccion-course-box">
              <span>Curso seleccionado</span>
              <strong>{cursoActivo?.titulo || "Sin curso seleccionado"}</strong>
            </div>

            <div className="admin-leccion-form-grid">
              <label>
                <span>Título de la lección</span>
                <input
                  ref={inputTituloRef}
                  type="text"
                  name="titulo"
                  placeholder="Ej: Introducción al curso"
                  value={form.titulo}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                <span>Descripción</span>
                <input
                  type="text"
                  name="descripcion"
                  placeholder="Breve descripción de la lección..."
                  value={form.descripcion}
                  onChange={handleChange}
                  required
                />
              </label>

              <label className="admin-leccion-field-content">
                <span>Contenido</span>
                <textarea
                  name="contenido"
                  placeholder="¿Qué aprenderá el estudiante?"
                  value={form.contenido}
                  onChange={handleChange}
                  rows={3}
                  required
                />
              </label>

              <label>
                <span>URL del video</span>
                <input
                  type="text"
                  name="videoUrl"
                  placeholder="https://youtube.com/..."
                  value={form.videoUrl}
                  onChange={handleChange}
                />
              </label>

              <label>
                <span>Duración en minutos</span>
                <input
                  type="number"
                  min="1"
                  name="duracionMinutos"
                  placeholder="Ej: 15"
                  value={form.duracionMinutos}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                <span>Orden</span>
                <input
                  type="number"
                  min="1"
                  name="orden"
                  placeholder="Ej: 1"
                  value={form.orden}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                <span>Estado</span>
                <select
                  name="estado"
                  value={form.estado}
                  onChange={handleChange}
                >
                  <option value="PUBLICADO">Publicado</option>
                  <option value="BORRADOR">Borrador</option>
                  <option value="OCULTO">Oculto</option>
                </select>
              </label>
            </div>

            <div className="admin-leccion-form-actions">
              <button
                type="button"
                className="admin-lecciones-clean-btn"
                onClick={limpiarForm}
                disabled={guardando}
              >
                {editandoId ? "Cancelar" : "Limpiar"}
              </button>

              <button
                type="submit"
                className="admin-lecciones-save-btn"
                disabled={guardando}
              >
                {guardando
                  ? "Guardando..."
                  : editandoId
                    ? "Guardar cambios"
                    : "Guardar lección"}
              </button>
            </div>

            <div className="admin-lecciones-help-card">
              <div>💡</div>
              <p>
                Las lecciones publicadas quedan visibles dentro del curso para
                los estudiantes con acceso.
              </p>
            </div>
          </form>

          <div className="admin-lecciones-list-card">
            <div className="admin-lecciones-list-header">
              <div>
                <h2>Lecciones del curso</h2>
                <p>
                  {cursoActivo
                    ? `Contenido cargado para ${cursoActivo.titulo}.`
                    : "Seleccioná un curso para ver sus lecciones."}
                </p>
              </div>

              <span>{leccionesFiltradas.length} lecciones</span>
            </div>

            <div className="admin-lecciones-list">
              {!cursoSeleccionado ? (
                <div className="admin-lecciones-empty-card">
                  <div className="admin-lecciones-empty-icon">🎓</div>

                  <h3>Seleccioná un curso</h3>

                  <p>
                    Elegí un curso desde el selector superior para ver, crear o
                    administrar sus lecciones.
                  </p>
                </div>
              ) : loadingLecciones ? (
                <div className="admin-lecciones-empty-card loading">
                  <div className="admin-lecciones-empty-icon">▤</div>

                  <h3>Cargando lecciones</h3>

                  <p>
                    Estamos consultando el contenido cargado para este curso.
                  </p>
                </div>
              ) : leccionesFiltradas.length === 0 ? (
                <div
                  className={`admin-lecciones-empty-card ${
                    lecciones.length === 0 ? "empty" : "filter"
                  }`}
                >
                  <div className="admin-lecciones-empty-icon">
                    {lecciones.length === 0 ? "📭" : "🔎"}
                  </div>

                  <h3>
                    {lecciones.length === 0
                      ? "No hay lecciones cargadas"
                      : "No se encontraron lecciones"}
                  </h3>

                  <p>
                    {lecciones.length === 0
                      ? "Este curso todavía no tiene lecciones. Podés crear la primera desde el formulario."
                      : "El curso tiene lecciones cargadas, pero ninguna coincide con la búsqueda o el estado seleccionado."}
                  </p>

                  <div className="admin-lecciones-empty-actions">
                    {hayFiltrosActivos && lecciones.length > 0 && (
                      <button type="button" onClick={limpiarFiltros}>
                        Limpiar filtros
                      </button>
                    )}

                    <button
                      type="button"
                      className="ghost"
                      onClick={() => obtenerLecciones(cursoSeleccionado)}
                    >
                      Recargar lecciones
                    </button>

                    {lecciones.length === 0 && (
                      <button type="button" onClick={handleNuevaLeccion}>
                        Crear lección
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                leccionesFiltradas.map((leccion) => (
                  <article key={leccion._id} className="admin-leccion-item">
                    <div className="admin-leccion-order">{leccion.orden}</div>

                    <div className="admin-leccion-main">
                      <div className="admin-leccion-play">▶</div>

                      <div>
                        <h3>{leccion.titulo}</h3>
                        <p>{leccion.descripcion}</p>
                      </div>
                    </div>

                    <div className="admin-leccion-description">
                      <span>Contenido</span>
                      <strong>{leccion.contenido}</strong>
                    </div>

                    <div className="admin-leccion-meta">
                      <div>
                        <span>Duración</span>
                        <strong>{leccion.duracionMinutos} min</strong>
                      </div>

                      <div>
                        <span>Orden</span>
                        <strong>{leccion.orden}</strong>
                      </div>

                      <div>
                        <span>Estado</span>
                        <strong
                          className={`admin-leccion-pill ${leccion.estado?.toLowerCase()}`}
                        >
                          {formatearEstado(leccion.estado)}
                        </strong>
                      </div>
                    </div>

                    <div className="admin-leccion-actions">
                      <button
                        type="button"
                        className="admin-leccion-edit-btn"
                        onClick={() => cargarParaEditar(leccion)}
                        title="Editar lección"
                      >
                        ✎
                      </button>

                      <button
                        type="button"
                        className="admin-leccion-delete-btn"
                        onClick={() => eliminarLeccion(leccion._id)}
                        title="Eliminar lección"
                      >
                        🗑
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AdminLecciones;
