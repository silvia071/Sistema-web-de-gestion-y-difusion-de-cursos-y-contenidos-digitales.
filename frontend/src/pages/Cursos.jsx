import { useNavigate, useLocation } from "react-router-dom";
import { useCarrito } from "../context/CarritoContext";
import { useState, useEffect, useMemo, useCallback } from "react";
import api from "../services/api";
import { getImageUrl } from "../utils/getImageUrl";
import "./Curso.css";

function tokenValido(token) {
  return (
    token && token !== "null" && token !== "undefined" && token.trim() !== ""
  );
}

function normalizarTexto(valor) {
  return String(valor || "")
    .toLowerCase()
    .trim();
}

function Cursos() {
  const navigate = useNavigate();
  const location = useLocation();
  const { agregarAlCarrito, mensajeCarrito, estaEnCarrito } = useCarrito();

  const params = new URLSearchParams(location.search);
  const categoriaSeleccionada = decodeURIComponent(
    params.get("categoria") || "",
  );

  const [categoriaActiva, setCategoriaActiva] = useState(
    categoriaSeleccionada || null,
  );
  const [busqueda, setBusqueda] = useState("");
  const [orden, setOrden] = useState("recientes");
  const [cursos, setCursos] = useState([]);
  const [misCursosIds, setMisCursosIds] = useState([]);
  const [favoritosIds, setFavoritosIds] = useState(() => {
    const favoritosGuardados = localStorage.getItem("favoritosCursos");

    if (!favoritosGuardados) return [];

    try {
      const favoritosParseados = JSON.parse(favoritosGuardados);
      return Array.isArray(favoritosParseados) ? favoritosParseados : [];
    } catch (error) {
      console.error("Error leyendo favoritos:", error);
      return [];
    }
  });
  const [cursoAvisoId, setCursoAvisoId] = useState(null);
  const [cursoAvisoTexto, setCursoAvisoTexto] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const rol = localStorage.getItem("rol");
  const esAdmin = rol === "ADMINISTRADOR";

  useEffect(() => {
    setCategoriaActiva(categoriaSeleccionada || null);
  }, [categoriaSeleccionada]);

  useEffect(() => {
    localStorage.setItem("favoritosCursos", JSON.stringify(favoritosIds));
  }, [favoritosIds]);

  const cargarCursos = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const rolActual = localStorage.getItem("rol");

      const endpoint =
        rolActual === "ADMINISTRADOR"
          ? "/api/cursos/admin/todos"
          : "/api/cursos";

      const response = await api.get(endpoint);
      const datos = response.data.datos || response.data || [];

      setCursos(Array.isArray(datos) ? datos : []);
    } catch (err) {
      console.error(err);
      setCursos([]);
      setError(
        err.response?.data?.mensaje ||
          "No se pudieron cargar los cursos disponibles.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarCursos();
  }, [cargarCursos]);

  useEffect(() => {
    const obtenerMisCursos = async () => {
      try {
        const token = localStorage.getItem("token");
        const usuarioId = localStorage.getItem("userId");

        if (!tokenValido(token) || !usuarioId) {
          setMisCursosIds([]);
          return;
        }

        const response = await api.get(`/api/accesos/usuario/${usuarioId}`);

        const accesos = Array.isArray(response.data?.datos)
          ? response.data.datos
          : Array.isArray(response.data)
            ? response.data
            : [];

        const ids = accesos
          .map(
            (acceso) =>
              acceso?.curso?._id || acceso?.curso?.id || acceso?.curso,
          )
          .filter(Boolean)
          .map((id) => String(id));

        setMisCursosIds(ids);
      } catch (error) {
        console.error("Error al obtener cursos comprados:", error);
        setMisCursosIds([]);
      }
    };

    obtenerMisCursos();
  }, []);

  const categorias = useMemo(() => {
    return [
      ...new Set(
        cursos.map((curso) => curso.categoria?.nombre).filter(Boolean),
      ),
    ].sort((a, b) => a.localeCompare(b));
  }, [cursos]);

  const cantidadPorCategoria = useMemo(() => {
    const conteo = {};

    cursos.forEach((curso) => {
      const nombre = curso.categoria?.nombre;

      if (nombre) {
        conteo[nombre] = (conteo[nombre] || 0) + 1;
      }
    });

    return conteo;
  }, [cursos]);

  const cursosFiltrados = useMemo(() => {
    const textoBusqueda = normalizarTexto(busqueda);

    let resultado = cursos.filter((curso) => {
      const coincideCategoria =
        !categoriaActiva ||
        normalizarTexto(curso.categoria?.nombre) ===
          normalizarTexto(categoriaActiva);

      const coincideBusqueda =
        !textoBusqueda ||
        normalizarTexto(curso.titulo).includes(textoBusqueda) ||
        normalizarTexto(curso.descripcion).includes(textoBusqueda) ||
        normalizarTexto(curso.categoria?.nombre).includes(textoBusqueda) ||
        normalizarTexto(curso.nivel).includes(textoBusqueda);

      return coincideCategoria && coincideBusqueda;
    });

    if (orden === "recientes") {
      resultado = [...resultado].sort(
        (a, b) =>
          new Date(b.createdAt || b.fechaCreacion || 0) -
          new Date(a.createdAt || a.fechaCreacion || 0),
      );
    }

    if (orden === "menor-precio") {
      resultado = [...resultado].sort(
        (a, b) => Number(a.precio || 0) - Number(b.precio || 0),
      );
    }

    if (orden === "mayor-precio") {
      resultado = [...resultado].sort(
        (a, b) => Number(b.precio || 0) - Number(a.precio || 0),
      );
    }

    if (orden === "az") {
      resultado = [...resultado].sort((a, b) =>
        String(a.titulo || "").localeCompare(String(b.titulo || "")),
      );
    }

    return resultado;
  }, [cursos, categoriaActiva, busqueda, orden]);

  const hayFiltrosActivos = Boolean(
    busqueda.trim() || categoriaActiva || orden !== "recientes",
  );

  const limpiarFiltros = () => {
    setBusqueda("");
    setCategoriaActiva(null);
    setOrden("recientes");
    navigate("/cursos", { replace: true });
  };

  const obtenerImagenCurso = (curso) => {
    return (
      getImageUrl(curso?.imagenPortada) ||
      getImageUrl(curso?.imagen) ||
      "/placeholder-curso.png"
    );
  };

  const mostrarAvisoCurso = (cursoId, texto) => {
    setCursoAvisoId(cursoId);
    setCursoAvisoTexto(texto);

    setTimeout(() => {
      setCursoAvisoId(null);
      setCursoAvisoTexto("");
    }, 2500);
  };

  const handleToggleFavorito = (e, cursoId) => {
    e.stopPropagation();

    setFavoritosIds((prev) => {
      const yaEsFavorito = prev.includes(cursoId);

      if (yaEsFavorito) {
        mostrarAvisoCurso(cursoId, "Curso quitado de favoritos");
        return prev.filter((id) => id !== cursoId);
      }

      mostrarAvisoCurso(cursoId, "Curso agregado a favoritos");
      return [...prev, cursoId];
    });
  };

  const handleAgregarAlCarrito = (e, curso) => {
    e.stopPropagation();

    const token = localStorage.getItem("token");

    if (!tokenValido(token)) {
      navigate("/login", {
        state: { from: location.pathname + location.search },
      });
      return;
    }

    const cursoId = String(curso?._id || curso?.id);

    if (misCursosIds.includes(cursoId)) {
      mostrarAvisoCurso(cursoId, "✔ Ya lo tenés en tu biblioteca");
      return;
    }

    if (estaEnCarrito(cursoId)) {
      mostrarAvisoCurso(cursoId, "✓ Ya está en el carrito");
      return;
    }

    agregarAlCarrito({
      ...curso,
      imagen: obtenerImagenCurso(curso),
    });
  };

  const handleVerCurso = (e, cursoId) => {
    e.stopPropagation();
    navigate(`/cursos/${cursoId}`);
  };

  const handleIrAlCurso = (e, cursoId) => {
    e.stopPropagation();
    navigate(`/curso/${cursoId}/aprender`);
  };

  if (loading) {
    return (
      <div className="cursos-page">
        <div className="cursos-container">
          <div className="cursos-estado-card loading">
            <div className="cursos-estado-icon">📚</div>
            <h2>Cargando cursos</h2>
            <p>Estamos preparando el catálogo disponible.</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cursos-page">
        <div className="cursos-container">
          <div className="cursos-estado-card error">
            <div className="cursos-estado-icon">⚠️</div>
            <h2>Error al cargar cursos</h2>
            <p>{error}</p>

            <button type="button" onClick={cargarCursos}>
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cursos-page">
      {mensajeCarrito && (
        <div className="toast-carrito">
          <span className="toast-carrito-icon">✓</span>
          <strong>{mensajeCarrito}</strong>
        </div>
      )}

      <section className="cursos-hero">
        <div className="cursos-hero__text">
          <span className="cursos-hero__badge">CATÁLOGO DE CURSOS</span>

          <h1>
            Cursos para llevar
            <span> tus habilidades al siguiente nivel</span>
          </h1>

          <p>
            Explorá los cursos disponibles y encontrá el camino perfecto para
            vos.
          </p>
        </div>

        <div className="cursos-hero__search">
          <span>⌕</span>
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar cursos, tecnologías..."
          />
        </div>
      </section>

      <main className="cursos-container">
        <section className="cursos-catalogo-panel">
          <div className="cursos-catalogo-header">
            <div>
              <span>Explorá por categoría</span>
              <h2>Catálogo disponible</h2>
            </div>

            <strong>
              {cursosFiltrados.length} de {cursos.length} cursos
            </strong>
          </div>

          <div className="cursos-toolbar">
            <div className="filtros-botones">
              <button
                type="button"
                className={!categoriaActiva ? "activo" : ""}
                onClick={() => setCategoriaActiva(null)}
              >
                Todas <small>{cursos.length}</small>
              </button>

              {categorias.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  className={categoriaActiva === cat ? "activo" : ""}
                  onClick={() => setCategoriaActiva(cat)}
                >
                  {cat} <small>{cantidadPorCategoria[cat] || 0}</small>
                </button>
              ))}
            </div>

            <div className="cursos-orden">
              <span>Ordenar por</span>

              <select value={orden} onChange={(e) => setOrden(e.target.value)}>
                <option value="recientes">Más recientes</option>
                <option value="menor-precio">Menor precio</option>
                <option value="mayor-precio">Mayor precio</option>
                <option value="az">Nombre A-Z</option>
              </select>
            </div>

            {hayFiltrosActivos && (
              <button
                type="button"
                className="cursos-limpiar-filtros"
                onClick={limpiarFiltros}
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </section>

        {cursosFiltrados.length === 0 ? (
          <div
            className={`cursos-estado-card ${
              cursos.length === 0 ? "empty" : "filter"
            }`}
          >
            <div className="cursos-estado-icon">
              {cursos.length === 0 ? "📭" : "🔎"}
            </div>

            <h2>
              {cursos.length === 0
                ? "No hay cursos disponibles"
                : "No se encontraron cursos"}
            </h2>

            <p>
              {cursos.length === 0
                ? "Todavía no hay cursos publicados en la plataforma. Cuando se carguen nuevos cursos, van a aparecer en este catálogo."
                : "No encontramos cursos que coincidan con la búsqueda o los filtros aplicados."}
            </p>

            <div className="cursos-estado-actions">
              {hayFiltrosActivos && cursos.length > 0 && (
                <button type="button" onClick={limpiarFiltros}>
                  Limpiar filtros
                </button>
              )}

              <button type="button" className="ghost" onClick={cargarCursos}>
                Recargar cursos
              </button>
            </div>
          </div>
        ) : (
          <div
            className="cursos-grid animar-grid"
            key={`${categoriaActiva || "todas"}-${busqueda}-${orden}`}
          >
            {cursosFiltrados.map((curso) => {
              const cursoId = String(curso?._id || curso?.id);
              const cursoComprado = misCursosIds.includes(cursoId);
              const mostrarAviso = cursoAvisoId === cursoId;
              const esFavorito = favoritosIds.includes(cursoId);

              return (
                <article
                  className={`curso-card ${
                    cursoComprado ? "curso-card--comprado" : ""
                  }`}
                  key={curso._id || curso.id}
                  onClick={() => navigate(`/cursos/${cursoId}`)}
                >
                  <div className="curso-card__imagen">
                    <img src={obtenerImagenCurso(curso)} alt={curso.titulo} />

                    <span className="curso-card__categoria">
                      {curso.categoria?.nombre || "Programación"}
                    </span>

                    <button
                      className={`curso-card__favorito ${
                        esFavorito ? "curso-card__favorito--activo" : ""
                      }`}
                      type="button"
                      onClick={(e) => handleToggleFavorito(e, cursoId)}
                      aria-label={
                        esFavorito
                          ? "Quitar de favoritos"
                          : "Agregar a favoritos"
                      }
                    >
                      {esFavorito ? "♥" : "♡"}
                    </button>

                    {esAdmin && (
                      <span
                        className={`curso-card__estado curso-card__estado--${curso.estado?.toLowerCase()}`}
                      >
                        {curso.estado || "SIN ESTADO"}
                      </span>
                    )}
                  </div>

                  <div className="curso-card__body">
                    <h3>{curso.titulo}</h3>

                    <p>{curso.descripcion}</p>

                    <div className="curso-card__meta">
                      <span className="curso-card__rating">★ 4.9</span>
                      <span>👥 +1.000 estudiantes</span>
                    </div>

                    <div className="curso-card__precio">
                      ${curso.precio?.toLocaleString("es-AR")}
                    </div>

                    <div className="curso-card__acciones">
                      <button
                        className="curso-card__btn curso-card__btn--primary"
                        onClick={(e) => handleVerCurso(e, cursoId)}
                      >
                        Ver curso
                      </button>

                      {cursoComprado || esAdmin ? (
                        <button
                          className="curso-card__btn curso-card__btn--secondary"
                          onClick={(e) => handleIrAlCurso(e, cursoId)}
                        >
                          Ir al curso
                        </button>
                      ) : (
                        <button
                          className="curso-card__btn curso-card__btn--secondary"
                          onClick={(e) => handleAgregarAlCarrito(e, curso)}
                        >
                          Agregar al carrito
                        </button>
                      )}
                    </div>
                  </div>

                  {mostrarAviso && (
                    <div className="curso-aviso-comprado">
                      {cursoAvisoTexto}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default Cursos;
