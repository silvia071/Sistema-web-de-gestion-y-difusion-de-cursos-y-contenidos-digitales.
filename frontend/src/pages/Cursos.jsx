import { useNavigate, useLocation } from "react-router-dom";
import { useCarrito } from "../context/CarritoContext";
import { useState, useEffect, useMemo } from "react";
import { API_BASE } from "../config/api";
import "./Curso.css";

function Cursos() {
  const navigate = useNavigate();
  const location = useLocation();
  const { agregarAlCarrito, mensajeCarrito } = useCarrito();

  const params = new URLSearchParams(location.search);
  const categoriaSeleccionada = decodeURIComponent(
    params.get("categoria") || "",
  );

  const [categoriaActiva, setCategoriaActiva] = useState(
    categoriaSeleccionada || null,
  );
  const [cursos, setCursos] = useState([]);
  const [misCursosIds, setMisCursosIds] = useState([]);
  const [cursoAvisoId, setCursoAvisoId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setCategoriaActiva(categoriaSeleccionada || null);
  }, [categoriaSeleccionada]);

  useEffect(() => {
    const cargarCursos = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`${API_BASE}/api/cursos`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error("No se pudieron cargar los cursos");
        }

        setCursos(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setError("Error al cargar los cursos");
      } finally {
        setLoading(false);
      }
    };

    cargarCursos();
  }, []);

  useEffect(() => {
    const obtenerMisCursos = async () => {
      try {
        const token = localStorage.getItem("token");
        const usuarioId = localStorage.getItem("userId");

        if (!token || !usuarioId) {
          setMisCursosIds([]);
          return;
        }

        const res = await fetch(
          `${API_BASE}/api/acceso-curso/usuario/${usuarioId}`,
        );
        const data = await res.json();

        const ids = Array.isArray(data)
          ? data
              .map(
                (acceso) =>
                  acceso?.curso?._id || acceso?.curso?.id || acceso?.curso,
              )
              .filter(Boolean)
              .map((id) => String(id))
          : [];

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
    ];
  }, [cursos]);

  const cursosFiltrados = useMemo(() => {
    if (!categoriaActiva) return cursos;

    return cursos.filter(
      (curso) =>
        curso.categoria?.nombre?.toLowerCase() ===
        categoriaActiva.toLowerCase(),
    );
  }, [cursos, categoriaActiva]);

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

  // 🔥 SOLO BACKEND
  const obtenerImagenCurso = (curso) => {
    return `${API_BASE}${curso.imagenPortada}`;
  };

  const handleAgregarAlCarrito = (e, curso) => {
    e.stopPropagation();

    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login", {
        state: { from: location.pathname },
      });
      return;
    }

    const cursoId = String(curso?._id || curso?.id);

    if (misCursosIds.includes(cursoId)) {
      setCursoAvisoId(cursoId);

      setTimeout(() => {
        setCursoAvisoId(null);
      }, 2500);

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
      <div className="section">
        <div className="container">
          <p>Cargando cursos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="section">
        <div className="container">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="section">
      {mensajeCarrito && (
        <div className="toast-carrito">✅ {mensajeCarrito}</div>
      )}

      <div className="container">
        <div className="section-header">
          <h2>Cursos</h2>
          <p>
            Explorá los cursos disponibles para aprender programación paso a
            paso.
          </p>
        </div>

        <div className="filtros">
          <span className="filtros-titulo">Categorías</span>

          <div className="filtros-botones">
            <button
              className={!categoriaActiva ? "activo" : ""}
              onClick={() => setCategoriaActiva(null)}
            >
              Todas
            </button>

            {categorias.map((cat) => (
              <button
                key={cat}
                className={categoriaActiva === cat ? "activo" : ""}
                onClick={() => setCategoriaActiva(cat)}
              >
                {cat} ({cantidadPorCategoria[cat] || 0})
              </button>
            ))}
          </div>
        </div>

        <div
          className="cursos-grid animar-grid"
          key={categoriaActiva || "todas"}
        >
          {cursosFiltrados.map((curso) => {
            const cursoId = String(curso?._id || curso?.id);
            const cursoComprado = misCursosIds.includes(cursoId);
            const mostrarAviso = cursoAvisoId === cursoId;

            return (
              <div
                className={`card course-card ${cursoComprado ? "course-card-comprado" : ""}`}
                key={curso._id}
                onClick={() => navigate(`/cursos/${curso._id}`)}
              >
                <div className="course-top">
                  <img src={obtenerImagenCurso(curso)} alt={curso.titulo} />
                </div>

                <h3>{curso.titulo}</h3>
                <p>{curso.descripcion}</p>

                <span className="tag">{curso.categoria?.nombre}</span>

                <p className="course-price">
                  ${curso.precio?.toLocaleString()}
                </p>

                <div className="course-actions">
                  <button
                    className="btn btn-secondary full-width"
                    onClick={(e) => handleVerCurso(e, curso._id)}
                  >
                    Ver curso
                  </button>

                  {cursoComprado ? (
                    <button
                      className="btn btn-secondary full-width"
                      onClick={(e) => handleIrAlCurso(e, curso._id)}
                    >
                      Ir al curso
                    </button>
                  ) : (
                    <button
                      className="btn btn-primary full-width"
                      onClick={(e) => handleAgregarAlCarrito(e, curso)}
                    >
                      Agregar al carrito
                    </button>
                  )}
                </div>

                {mostrarAviso && (
                  <div className="curso-aviso-comprado">
                    ✔ Ya lo tenés en tu biblioteca
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Cursos;
