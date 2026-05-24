import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";
import { getImageUrl } from "../utils/getImageUrl";
import "./MisCursos.css";
import { generarCertificado } from "../utils/generarCertificado";

export default function MisCursos() {
  const [accesos, setAccesos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [orden, setOrden] = useState("recientes");

  const navigate = useNavigate();
  const location = useLocation();

  const obtenerMisCursos = async () => {
    try {
      setLoading(true);
      setError("");

      const usuarioResponse = await api.get("/api/usuarios/me");
      const usuarioLogueado =
        usuarioResponse.data?.datos || usuarioResponse.data;

      const usuarioId = usuarioLogueado?._id || usuarioLogueado?.id;

      if (!usuarioId) {
        setError("No se encontró sesión activa");
        setAccesos([]);
        return;
      }

      const response = await api.get(`/api/accesos/usuario/${usuarioId}`);

      const accesosData = Array.isArray(response.data?.datos)
        ? response.data.datos
        : Array.isArray(response.data)
          ? response.data
          : [];

      const accesosActivos = accesosData.filter((acceso) => {
        const estadoActivo =
          !acceso?.estado || acceso.estado.toUpperCase() === "ACTIVO";

        return estadoActivo && acceso?.curso;
      });

      const accesosConCursoCompleto = await Promise.all(
        accesosActivos.map(async (acceso) => {
          if (typeof acceso.curso === "object") {
            return acceso;
          }

          const cursoResponse = await api.get(`/api/cursos/${acceso.curso}`);

          return {
            ...acceso,
            curso: cursoResponse.data?.datos || cursoResponse.data,
          };
        }),
      );

      const ordenados = accesosConCursoCompleto.sort(
        (a, b) => (b.progreso || 0) - (a.progreso || 0),
      );

      setAccesos(ordenados);
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.detalle ||
          error.response?.data?.mensaje ||
          error.response?.data?.error ||
          error.message ||
          "No se pudieron cargar tus cursos",
      );

      setAccesos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    obtenerMisCursos();

    const handleFocus = () => {
      obtenerMisCursos();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [location.pathname]);

  const entrarAlCurso = (id) => {
    navigate(`/curso/${id}/aprender`);
  };

  const obtenerImagenCurso = (curso) => {
    return (
      getImageUrl(curso?.imagenPortada) ||
      getImageUrl(curso?.imagen) ||
      "/placeholder-curso.png"
    );
  };

  const cursoPrincipal =
    accesos.find((a) => (a.progreso || 0) > 0 && (a.progreso || 0) < 100) ||
    accesos.find((a) => (a.progreso || 0) < 100);

  const cursosCompletados = accesos.filter(
    (a) => (a.progreso || 0) >= 100,
  ).length;

  const cursosEnProgreso = accesos.filter(
    (a) => (a.progreso || 0) > 0 && (a.progreso || 0) < 100,
  ).length;

  const accesosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    let resultado = accesos.filter((acceso) => {
      const titulo = acceso?.curso?.titulo?.toLowerCase() || "";
      const categoria = acceso?.curso?.categoria?.nombre?.toLowerCase() || "";

      return !texto || titulo.includes(texto) || categoria.includes(texto);
    });

    if (orden === "progreso") {
      resultado = [...resultado].sort(
        (a, b) => (b.progreso || 0) - (a.progreso || 0),
      );
    }

    if (orden === "nombre") {
      resultado = [...resultado].sort((a, b) =>
        (a.curso?.titulo || "").localeCompare(b.curso?.titulo || ""),
      );
    }

    if (orden === "recientes") {
      resultado = [...resultado].sort(
        (a, b) =>
          new Date(b.fechaAcceso || b.createdAt || 0) -
          new Date(a.fechaAcceso || a.createdAt || 0),
      );
    }

    return resultado;
  }, [accesos, busqueda, orden]);

  if (loading) {
    return (
      <main className="mis-cursos-page">
        <section className="mis-cursos-hero">
          <span className="mis-cursos-eyebrow">PANEL DE ESTUDIANTE</span>
          <h1>Mis cursos</h1>
          <p>Cargando tu aprendizaje...</p>
        </section>

        <section className="mis-cursos-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton-card"></div>
          ))}
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mis-cursos-page">
        <section className="mis-cursos-hero">
          <span className="mis-cursos-eyebrow">PANEL DE ESTUDIANTE</span>
          <h1>Mis cursos</h1>
          <p>Hubo un problema al cargar tu biblioteca.</p>
        </section>

        <div className="mis-cursos-empty">
          <h3>No pudimos cargar tus cursos</h3>
          <p>{error}</p>
          <button className="btn-explorar" onClick={() => navigate("/cursos")}>
            Ver cursos
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mis-cursos-page">
      <section className="mis-cursos-hero">
        <div>
          <span className="mis-cursos-eyebrow">PANEL DE ESTUDIANTE</span>
          <h1>Mis cursos</h1>
          <p>
            Tu aprendizaje, tu ritmo. Continuá donde lo dejaste y seguí
            creciendo.
          </p>
        </div>

        <div className="mis-cursos-hero-visual">
          <span>🎓</span>
        </div>
      </section>

      {accesos.length === 0 ? (
        <div className="mis-cursos-empty">
          <h3>No tenés cursos todavía</h3>
          <p>Explorá los cursos y empezá a aprender.</p>

          <button className="btn-explorar" onClick={() => navigate("/cursos")}>
            Ver cursos
          </button>
        </div>
      ) : (
        <>
          {cursoPrincipal && (
            <section className="mis-cursos-featured">
              <div className="mis-cursos-section-title">
                <span>▶</span>
                <h2>Continuar aprendiendo</h2>
              </div>

              <div className="featured-card">
                <img
                  src={obtenerImagenCurso(cursoPrincipal.curso)}
                  alt={cursoPrincipal.curso.titulo}
                />

                <div className="featured-content">
                  <span className="featured-badge">EN PROGRESO</span>

                  <h3>{cursoPrincipal.curso.titulo}</h3>

                  <p>Continuar donde lo dejaste</p>

                  <div className="featured-progress-row">
                    <div className="mis-curso-progress">
                      <div
                        className="mis-curso-progress-fill animate"
                        style={{ width: `${cursoPrincipal.progreso || 0}%` }}
                      />
                    </div>

                    <strong>{cursoPrincipal.progreso || 0}%</strong>
                  </div>

                  <small>
                    Progreso actual del curso. Seguí aprendiendo desde tu última
                    lección.
                  </small>
                </div>

                <button
                  className="btn-continuar-grande"
                  onClick={() => entrarAlCurso(cursoPrincipal.curso._id)}
                >
                  ▶ Continuar curso
                </button>
              </div>
            </section>
          )}

          <section className="mis-cursos-stats">
            <div className="mis-stat-card">
              <span>📚</span>
              <div>
                <strong>{accesos.length}</strong>
                <p>Cursos totales</p>
              </div>
            </div>

            <div className="mis-stat-card">
              <span>✅</span>
              <div>
                <strong>{cursosCompletados}</strong>
                <p>Completados</p>
              </div>
            </div>

            <div className="mis-stat-card">
              <span>🕘</span>
              <div>
                <strong>{cursosEnProgreso}</strong>
                <p>En progreso</p>
              </div>
            </div>

            <div className="mis-stat-card">
              <span>🏆</span>
              <div>
                <strong>{cursosCompletados}</strong>
                <p>Certificados obtenidos</p>
              </div>
            </div>
          </section>

          <section className="mis-cursos-listado">
            <div className="mis-cursos-listado-header">
              <h2>Todos mis cursos</h2>

              <div className="mis-cursos-actions">
                <div className="mis-cursos-search">
                  <span>⌕</span>
                  <input
                    type="text"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar cursos..."
                  />
                </div>

                <select
                  className="mis-cursos-select"
                  value={orden}
                  onChange={(e) => setOrden(e.target.value)}
                >
                  <option value="recientes">Más recientes</option>
                  <option value="progreso">Mayor progreso</option>
                  <option value="nombre">Nombre</option>
                </select>
              </div>
            </div>

            {accesosFiltrados.length === 0 ? (
              <div className="mis-cursos-empty">
                <h3>No encontramos cursos</h3>
                <p>Probá con otra búsqueda.</p>
              </div>
            ) : (
              <section className="mis-cursos-grid">
                {accesosFiltrados.map((acceso) => {
                  const curso = acceso.curso;
                  const progreso = acceso.progreso || 0;
                  const completado = progreso >= 100;

                  return (
                    <article key={acceso._id} className="mis-curso-card">
                      <div className="mis-curso-img">
                        <img
                          src={obtenerImagenCurso(curso)}
                          alt={curso.titulo}
                        />

                        <span
                          className={
                            completado
                              ? "mis-curso-status completado"
                              : "mis-curso-status"
                          }
                        >
                          {completado ? "COMPLETADO" : "EN PROGRESO"}
                        </span>
                      </div>

                      <div className="mis-curso-content">
                        <h3>{curso.titulo}</h3>

                        <p>
                          {curso.categoria?.nombre || "Curso online"} ·{" "}
                          {completado ? "Finalizado" : "Aprendizaje activo"}
                        </p>

                        <div className="mis-curso-progress-row">
                          <div className="mis-curso-progress">
                            <div
                              className="mis-curso-progress-fill animate"
                              style={{ width: `${progreso}%` }}
                            />
                          </div>

                          <span>{progreso}%</span>
                        </div>

                        <div className="mis-curso-card-actions">
                          <button
                            className="btn-entrar"
                            onClick={() => entrarAlCurso(curso._id)}
                          >
                            {completado ? "Ver curso" : "Continuar"} →
                          </button>

                          {completado && (
                            <button
                              type="button"
                              className="btn-certificado"
                              onClick={() => generarCertificado(acceso)}
                            >
                              Descargar certificado
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </section>
            )}
          </section>
        </>
      )}
    </main>
  );
}
