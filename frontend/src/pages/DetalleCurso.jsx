import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useCarrito } from "../context/CarritoContext";
import api from "../services/api";
import { getImageUrl } from "../utils/getImageUrl";
import "./DetalleCurso.css";

function tokenValido(token) {
  return (
    token && token !== "null" && token !== "undefined" && token.trim() !== ""
  );
}

function DetalleCurso() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const { agregarAlCarrito, mensajeCarrito } = useCarrito();

  const [curso, setCurso] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [yaComprado, setYaComprado] = useState(false);

  const token = localStorage.getItem("token");
  const haySesion = tokenValido(token);

  const rol = localStorage.getItem("rol");
  const esAdmin = rol === "ADMINISTRADOR";

  useEffect(() => {
    const cargarCurso = async () => {
      try {
        setLoading(true);
        setError("");

        const endpoint = esAdmin
          ? `/api/cursos/admin/${id}`
          : `/api/cursos/${id}`;

        const response = await api.get(endpoint);
        setCurso(response.data.datos);
      } catch (err) {
        console.error(err);
        setError("Error al cargar el curso");
      } finally {
        setLoading(false);
      }
    };

    cargarCurso();
  }, [id, esAdmin]);

  useEffect(() => {
    const verificarCompra = async () => {
      try {
        const userId = localStorage.getItem("userId");

        if (!haySesion || !userId || esAdmin) return;

        const response = await api.get(`/api/accesos/usuario/${userId}`);
        const accesos = response.data.datos || [];

        const tieneCurso = accesos.some((acceso) => {
          const cursoAccesoId =
            acceso?.curso?._id || acceso?.curso?.id || acceso?.curso;

          return String(cursoAccesoId) === String(id);
        });

        setYaComprado(tieneCurso);
      } catch (err) {
        console.error("Error al verificar acceso al curso:", err);
        setYaComprado(false);
      }
    };

    verificarCompra();
  }, [id, haySesion, esAdmin]);

  const precioFormateado = useMemo(() => {
    if (!curso?.precio) return "$0";
    return `$${curso.precio.toLocaleString("es-AR")}`;
  }, [curso]);

  const obtenerImagenCurso = (cursoActual) => {
    return (
      getImageUrl(cursoActual?.imagenPortada) ||
      getImageUrl(cursoActual?.imagen) ||
      "/placeholder-curso.png"
    );
  };

  const handleEntrarAlCurso = () => {
    if (!haySesion) {
      navigate("/login", {
        state: { from: location.pathname },
        replace: true,
      });
      return;
    }

    navigate(`/curso/${curso._id}/aprender`);
  };

  const handleAgregarAlCarrito = async () => {
    if (!haySesion) {
      navigate("/login", {
        state: { from: location.pathname },
        replace: true,
      });
      return;
    }

    if (esAdmin) {
      handleEntrarAlCurso();
      return;
    }

    await agregarAlCarrito({
      ...curso,
      imagen: obtenerImagenCurso(curso),
    });
  };

  if (loading) return <p className="detalle-curso-estado">Cargando...</p>;
  if (error) return <p className="detalle-curso-estado">{error}</p>;
  if (!curso) return <p className="detalle-curso-estado">No encontrado</p>;

  const puedeEntrarAlCurso = yaComprado || esAdmin;
  const cantidadLecciones = curso.lecciones?.length || 0;

  return (
    <section className="detalle-curso-page">
      <div className="detalle-curso-top">
        <button className="btn-volver-cta" onClick={() => navigate("/cursos")}>
          ← Volver a cursos
        </button>
      </div>

      <div className="detalle-curso-hero">
        <div className="detalle-curso-imagen">
          <img src={obtenerImagenCurso(curso)} alt={curso.titulo} />
        </div>

        <div className="detalle-curso-info">
          <span className="detalle-curso-categoria">
            {curso.categoria?.nombre || "Curso"}
          </span>

          <h1>{curso.titulo}</h1>

          <p className="detalle-curso-descripcion">{curso.descripcion}</p>

          <div className="detalle-curso-meta">
            <span>📘 Nivel: {curso.nivel}</span>
            <span>⏱ Duración: {curso.duracion}</span>
          </div>

          {!puedeEntrarAlCurso && (
            <p className="detalle-curso-precio">{precioFormateado}</p>
          )}

          <div className="detalle-curso-acciones">
            {puedeEntrarAlCurso ? (
              <button
                className="detalle-curso-btn"
                onClick={handleEntrarAlCurso}
              >
                ▶ Comenzar curso
              </button>
            ) : (
              <button
                className="detalle-curso-btn"
                onClick={handleAgregarAlCarrito}
              >
                🛒 Agregar al carrito
              </button>
            )}

            {mensajeCarrito && (
              <p className="detalle-curso-mensaje-carrito">{mensajeCarrito}</p>
            )}
          </div>
        </div>

        <div className="detalle-curso-beneficios">
          <div className="beneficio-item">
            <span className="beneficio-icono">♾</span>
            <div>
              <h3>Acceso de por vida</h3>
              <p>Aprendé a tu ritmo, cuando quieras</p>
            </div>
          </div>

          <div className="beneficio-item">
            <span className="beneficio-icono">🏅</span>
            <div>
              <h3>Certificado incluido</h3>
              <p>Al completar el curso</p>
            </div>
          </div>

          <div className="beneficio-item">
            <span className="beneficio-icono">💬</span>
            <div>
              <h3>Soporte del instructor</h3>
              <p>Respondemos tus dudas</p>
            </div>
          </div>

          <div className="beneficio-item">
            <span className="beneficio-icono">📦</span>
            <div>
              <h3>Recursos descargables</h3>
              <p>Material complementario</p>
            </div>
          </div>
        </div>
      </div>

      <div className="detalle-curso-extra">
        <div className="detalle-curso-bloque">
          <div className="bloque-header">
            <span className="bloque-icono">🎯</span>
            <h2>Qué vas a aprender</h2>
          </div>

          {curso.aprendizajes?.length > 0 ? (
            <ul className="detalle-curso-lista">
              {curso.aprendizajes.map((item, i) => (
                <li key={i}>
                  <span>✓</span>
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="detalle-curso-vacio">
              Próximamente vas a tener los objetivos del curso.
            </p>
          )}
        </div>

        <div className="detalle-curso-bloque">
          <div className="bloque-header lecciones-header">
            <div>
              <span className="bloque-icono">▶</span>
              <h2>Lecciones incluidas</h2>
            </div>

            <span className="lecciones-total">
              {cantidadLecciones} lecciones
            </span>
          </div>

          <div className="lecciones-lista">
            {curso.lecciones?.map((l, i) => (
              <div
                key={l._id}
                className={`leccion-item ${
                  !puedeEntrarAlCurso ? "leccion-bloqueada" : ""
                }`}
                onClick={() => {
                  if (!puedeEntrarAlCurso) return;

                  navigate(`/curso/${curso._id}/aprender?leccion=${l._id}`);
                }}
              >
                <div className="leccion-numero">{i + 1}</div>

                <div className="leccion-info">
                  <span className="leccion-titulo">{l.titulo}</span>
                  <span className="leccion-duracion">
                    ⏱ {l.duracionMinutos} min
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="detalle-curso-stats">
        <div className="stat-item">
          <span className="stat-icono">👥</span>
          <div>
            <strong>+3.200</strong>
            <p>Estudiantes</p>
          </div>
        </div>

        <div className="stat-item">
          <span className="stat-icono">⭐</span>
          <div>
            <strong>4.8</strong>
            <p>Calificación promedio</p>
          </div>
        </div>

        <div className="stat-item">
          <span className="stat-icono">📊</span>
          <div>
            <strong>+12</strong>
            <p>Horas de contenido</p>
          </div>
        </div>

        <div className="stat-item">
          <span className="stat-icono">{"</>"}</span>
          <div>
            <strong>Proyectos prácticos</strong>
            <p>Incluidos</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default DetalleCurso;
