import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import api from "../services/api";
import logo from "../assets/logo.png";
import "./AprenderCurso.css";
import { generarCertificado } from "../utils/generarCertificado";

function tokenValido(token) {
  return (
    token && token !== "null" && token !== "undefined" && token.trim() !== ""
  );
}

function obtenerPayloadToken(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

function limpiarSesion() {
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");
  localStorage.removeItem("rol");
  localStorage.removeItem("userId");
  localStorage.removeItem("email");
  localStorage.removeItem("nombre");
  localStorage.removeItem("apellido");
  localStorage.removeItem("nombreCompleto");
  localStorage.removeItem("carrito");
}

function AprenderCurso() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const leccionUrlId = searchParams.get("leccion");

  const token = localStorage.getItem("token");
  const payload = tokenValido(token) ? obtenerPayloadToken(token) : null;
  const esAdmin = payload?.rol === "ADMINISTRADOR";

  const [curso, setCurso] = useState(null);
  const [accesoCurso, setAccesoCurso] = useState(null);
  const [leccionActual, setLeccionActual] = useState(null);
  const [leccionesCompletadas, setLeccionesCompletadas] = useState([]);
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [error, setError] = useState("");
  const [menuCuentaAbierto, setMenuCuentaAbierto] = useState(false);

  const cargarLeccionCompleta = async (leccionId) => {
    try {
      if (!leccionId) return;

      const response = await api.get(`/api/lecciones/${leccionId}`);
      setLeccionActual(response.data.datos);
    } catch (error) {
      console.error("ERROR CARGANDO LECCIÓN:", error);

      setError(
        error.response?.data?.mensaje ||
          "No se pudo cargar el contenido de la lección",
      );
    }
  };

  useEffect(() => {
    const cargarCurso = async () => {
      try {
        setError("");
        setCurso(null);
        setLeccionActual(null);
        setAccesoCurso(null);
        setLeccionesCompletadas([]);

        const usuarioResponse = await api.get("/api/usuarios/me");
        const usuarioLogueado =
          usuarioResponse.data?.datos || usuarioResponse.data;

        setUsuarioActual(usuarioLogueado);

        const usuarioId = usuarioLogueado?._id || usuarioLogueado?.id;

        if (!usuarioId) {
          setError("Tenés que iniciar sesión para acceder a este curso.");
          return;
        }

        const endpointLecciones = esAdmin
          ? `/api/lecciones/admin/curso/${id}`
          : `/api/lecciones/curso/${id}`;

        const leccionesResponse = await api.get(endpointLecciones);

        const lecciones = Array.isArray(leccionesResponse.data.datos)
          ? leccionesResponse.data.datos
          : Array.isArray(leccionesResponse.data)
            ? leccionesResponse.data
            : [];

        if (esAdmin) {
          const cursoResponse = await api.get(`/api/cursos/admin/${id}`);
          const cursoBase = cursoResponse.data.datos || cursoResponse.data;

          setCurso({
            ...cursoBase,
            lecciones,
          });

          let leccionInicial = null;

          if (leccionUrlId) {
            leccionInicial = lecciones.find(
              (leccion) => leccion._id?.toString() === leccionUrlId.toString(),
            );
          }

          if (!leccionInicial) {
            leccionInicial = lecciones[0];
          }

          if (leccionInicial?._id) {
            await cargarLeccionCompleta(leccionInicial._id);
          }

          return;
        }

        const accesoResponse = await api.get(
          `/api/accesos/usuario/${usuarioId}`,
        );

        const accesosData = Array.isArray(accesoResponse.data.datos)
          ? accesoResponse.data.datos
          : Array.isArray(accesoResponse.data)
            ? accesoResponse.data
            : [];

        const accesoEncontrado = accesosData.find((acceso) => {
          const cursoAccesoId =
            acceso?.curso?._id || acceso?.curso?.id || acceso?.curso;

          const estadoActivo =
            !acceso?.estado || acceso.estado.toUpperCase() === "ACTIVO";

          return cursoAccesoId?.toString() === id?.toString() && estadoActivo;
        });

        if (!accesoEncontrado) {
          setError("No tenés acceso a este curso.");
          return;
        }

        const cursoResponse = await api.get(`/api/cursos/${id}`);
        const cursoBase = cursoResponse.data.datos || cursoResponse.data;

        setCurso({
          ...cursoBase,
          lecciones,
        });

        setAccesoCurso(accesoEncontrado);
        setLeccionesCompletadas(accesoEncontrado.leccionesCompletadas || []);

        let leccionInicial = null;

        if (leccionUrlId) {
          leccionInicial = lecciones.find(
            (leccion) => leccion._id?.toString() === leccionUrlId.toString(),
          );
        }

        if (!leccionInicial && accesoEncontrado.ultimaLeccion) {
          leccionInicial =
            lecciones.find(
              (leccion) =>
                leccion._id?.toString() ===
                accesoEncontrado.ultimaLeccion.toString(),
            ) || lecciones[0];
        }

        if (!leccionInicial) {
          leccionInicial = lecciones[0];
        }

        if (leccionInicial?._id) {
          await cargarLeccionCompleta(leccionInicial._id);
        }
      } catch (error) {
        console.error(error);

        setError(
          error.response?.data?.mensaje ||
            error.response?.data?.error ||
            "No se pudo cargar el curso.",
        );
      }
    };

    cargarCurso();
  }, [id, esAdmin, leccionUrlId]);

  const indiceActual = useMemo(() => {
    if (!curso?.lecciones || !leccionActual) return -1;

    return curso.lecciones.findIndex(
      (leccion) => leccion._id.toString() === leccionActual._id.toString(),
    );
  }, [curso, leccionActual]);

  const porcentajeProgreso = useMemo(() => {
    if (!curso?.lecciones?.length) return 0;

    return Math.round(
      (leccionesCompletadas.length / curso.lecciones.length) * 100,
    );
  }, [curso, leccionesCompletadas]);

  const duracionTotal = useMemo(() => {
    if (!curso?.lecciones?.length) return 0;

    return curso.lecciones.reduce(
      (acc, leccion) => acc + (leccion.duracionMinutos || 0),
      0,
    );
  }, [curso]);

  const inicialesUsuario = useMemo(() => {
    const nombreCompleto =
      `${usuarioActual?.nombre || ""} ${usuarioActual?.apellido || ""}`.trim() ||
      localStorage.getItem("nombreCompleto") ||
      localStorage.getItem("nombre") ||
      "Usuario";

    return nombreCompleto
      .split(" ")
      .filter(Boolean)
      .map((palabra) => palabra[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [usuarioActual]);

  const leccionEstaCompletada = (leccionId) => {
    return leccionesCompletadas.some(
      (id) => id.toString() === leccionId.toString(),
    );
  };

  const leccionEstaBloqueada = (index) => {
    if (esAdmin) return false;
    if (!curso?.lecciones?.length) return true;
    if (index === 0) return false;

    const leccionAnterior = curso.lecciones[index - 1];

    return !leccionEstaCompletada(leccionAnterior._id);
  };

  const completarYContinuar = async () => {
    try {
      if (esAdmin) return;

      if (!accesoCurso || !leccionActual) {
        return;
      }

      const response = await api.patch(
        `/api/accesos/${accesoCurso._id}/progreso`,
        {
          leccionId: leccionActual._id,
        },
      );

      setLeccionesCompletadas(response.data.datos?.leccionesCompletadas || []);

      if (indiceActual < (curso.lecciones?.length || 0) - 1) {
        const siguienteLeccion = curso.lecciones[indiceActual + 1];
        await cargarLeccionCompleta(siguienteLeccion._id);
      }
    } catch (error) {
      console.error("Error actualizando progreso", error);

      setError(
        error.response?.data?.mensaje ||
          error.response?.data?.error ||
          "Error al actualizar el progreso del curso",
      );
    }
  };

  const irALeccionAnterior = async () => {
    if (indiceActual > 0) {
      const leccionAnterior = curso.lecciones[indiceActual - 1];
      await cargarLeccionCompleta(leccionAnterior._id);
    }
  };

  const irALeccionSiguiente = async () => {
    const siguienteIndex = indiceActual + 1;

    if (
      siguienteIndex < (curso.lecciones?.length || 0) &&
      !leccionEstaBloqueada(siguienteIndex)
    ) {
      const leccionSiguiente = curso.lecciones[siguienteIndex];
      await cargarLeccionCompleta(leccionSiguiente._id);
    }
  };

  const cerrarSesion = () => {
    limpiarSesion();
    setMenuCuentaAbierto(false);
    navigate("/");
  };

  if (error) {
    return (
      <main className="curso-estado-page">
        <div className="curso-estado-box">
          <div className="curso-estado-icono error">🔒</div>
          <h2>No se pudo acceder al curso</h2>
          <p>{error}</p>
          <button
            className="btn-volver-cursos"
            onClick={() => navigate("/cursos")}
          >
            Volver a cursos
          </button>
        </div>
      </main>
    );
  }

  if (!curso) {
    return (
      <main className="curso-estado-page">
        <div className="curso-estado-box">
          <h2>Cargando curso...</h2>
          <p>Estamos preparando el contenido para vos.</p>
        </div>
      </main>
    );
  }

  const videoEmbed = leccionActual?.videoUrl?.includes("watch?v=")
    ? leccionActual.videoUrl.replace("watch?v=", "embed/")
    : leccionActual?.videoUrl;

  return (
    <div className="player-page">
      <header className="learning-topbar">
        <div className="learning-brand">
          <img src={logo} alt="Mundo Dev" />
          <span>Mundo Dev</span>
        </div>

        <div className="learning-topbar-actions">
          <button
            className="btn-volver-cursos"
            onClick={() => navigate("/mis-cursos")}
          >
            ← Ir a mis cursos
          </button>

          <div className="topbar-navbar-user">
            <div className="topbar-user-group">
              <span className="topbar-avatar">{inicialesUsuario}</span>

              <button
                className="topbar-user-btn"
                type="button"
                onClick={() => setMenuCuentaAbierto((prev) => !prev)}
              >
                <span>Mi cuenta ▼</span>
              </button>
            </div>

            {menuCuentaAbierto && (
              <div className="topbar-user-menu">
                <button onClick={() => navigate("/perfil")}>Mi perfil</button>
                <button onClick={() => navigate("/mis-cursos")}>
                  Mis cursos
                </button>

                {!esAdmin && (
                  <button onClick={() => navigate("/carrito")}>
                    Mi carrito
                  </button>
                )}

                <button onClick={cerrarSesion}>Cerrar sesión</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <aside className="player-sidebar">
        <div className="sidebar-curso-card">
          <div className="sidebar-curso-icon">
            {(() => {
              const nombre = curso.titulo?.replace("Curso de ", "").trim();

              if (!nombre) return "CU";

              const siglasCustom = {
                javascript: "JS",
                python: "PY",
                java: "JV",
                "c++": "C++",
                "html y css": "HC",
                "node.js": "NJ",
                "apis rest": "API",
                react: "RE",
                "css avanzado": "CS",
                sql: "SQL",
              };

              const clave = nombre.toLowerCase();

              if (siglasCustom[clave]) {
                return siglasCustom[clave];
              }

              const palabras = nombre.split(" ");

              if (palabras.length === 1) {
                return palabras[0].slice(0, 2).toUpperCase();
              }

              return palabras
                .map((palabra) => palabra[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();
            })()}
          </div>

          <div>
            <h3>{curso.titulo}</h3>
            <p className="cantidad-lecciones">
              {curso.lecciones?.length || 0} lecciones • {duracionTotal} min
            </p>
          </div>
        </div>

        {!esAdmin ? (
          <div className="progreso-box">
            <div className="progreso-top">
              <span>Tu progreso</span>
              <strong>
                {leccionesCompletadas.length} de {curso.lecciones?.length || 0}
              </strong>
            </div>

            <div className="progreso-numero">{porcentajeProgreso}%</div>

            <div className="progreso-barra">
              <div
                className="progreso-barra-fill"
                style={{ width: `${porcentajeProgreso}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="progreso-box">
            <span>Modo administrador</span>
            <div className="progreso-numero">Vista previa</div>
          </div>
        )}

        <div className="lista-lecciones-wrap">
          <p className="lista-titulo">Lecciones del curso</p>

          <div className="lista-lecciones">
            {(curso.lecciones || []).map((leccion, index) => {
              const estaActiva =
                leccionActual?._id.toString() === leccion._id.toString();

              const estaCompletada = leccionEstaCompletada(leccion._id);
              const estaBloqueada = leccionEstaBloqueada(index);

              return (
                <button
                  key={leccion._id}
                  disabled={estaBloqueada}
                  className={`leccion-item ${estaActiva ? "activa" : ""} ${
                    !esAdmin && estaCompletada ? "completada" : ""
                  } ${estaBloqueada ? "bloqueada" : ""}`}
                  onClick={() => {
                    if (!estaBloqueada) {
                      cargarLeccionCompleta(leccion._id);
                    }
                  }}
                >
                  <span className="leccion-numero">{index + 1}</span>

                  <span className="leccion-info">
                    <span className="leccion-titulo">{leccion.titulo}</span>
                    <span className="leccion-minutos">
                      {leccion.duracionMinutos || 0} min
                    </span>
                  </span>

                  {!esAdmin && estaCompletada && (
                    <span className="check">✓</span>
                  )}

                  {estaBloqueada && <span className="lock">🔒</span>}
                </button>
              );
            })}
          </div>
        </div>

        {!esAdmin && porcentajeProgreso === 100 && (
          <div className="curso-finalizado-box">
            <div className="curso-finalizado">🎉 ¡Curso completado!</div>

            <button
              type="button"
              className="btn-certificado-player"
              onClick={() =>
                generarCertificado({
                  _id: accesoCurso?._id,
                  curso,
                  progreso: porcentajeProgreso,
                })
              }
            >
              🏆 Descargar certificado
            </button>
          </div>
        )}
      </aside>

      <main className="player-content">
        {leccionActual ? (
          <>
            <div className="leccion-header">
              <div>
                <p className="leccion-kicker">
                  Lección {indiceActual + 1} de {curso.lecciones?.length || 0}
                </p>

                <h2>{leccionActual.titulo}</h2>
                <p>{leccionActual.descripcion}</p>

                <div className="leccion-meta">
                  <span>⏱ Duración: {leccionActual.duracionMinutos} min</span>
                  <span>📚 Nivel: {curso.nivel || "Curso"}</span>

                  {curso.categoria && (
                    <span>
                      🏷 Categoría:{" "}
                      {typeof curso.categoria === "object"
                        ? curso.categoria.nombre
                        : curso.categoria}
                    </span>
                  )}
                </div>
              </div>

              {!esAdmin && leccionEstaCompletada(leccionActual._id) && (
                <div className="badge-leccion-completada">
                  ✓ Lección completada
                </div>
              )}
            </div>

            {videoEmbed ? (
              <div className="video-container">
                <iframe
                  src={videoEmbed}
                  title={leccionActual.titulo}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <p className="sin-video">Esta lección todavía no tiene video.</p>
            )}

            <div className="player-actions">
              {indiceActual > 0 && (
                <button className="btn-nav" onClick={irALeccionAnterior}>
                  ← Anterior
                </button>
              )}

              {!esAdmin && !leccionEstaCompletada(leccionActual._id) && (
                <button
                  className="btn-completar-abajo"
                  onClick={completarYContinuar}
                >
                  {indiceActual === (curso.lecciones?.length || 0) - 1
                    ? "Finalizar curso"
                    : "Completar lección"}
                </button>
              )}

              {indiceActual < (curso.lecciones?.length || 0) - 1 && (
                <button className="btn-siguiente" onClick={irALeccionSiguiente}>
                  Siguiente lección →
                </button>
              )}
            </div>
          </>
        ) : (
          <p>No hay lecciones</p>
        )}
      </main>
    </div>
  );
}

export default AprenderCurso;
