import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { getImageUrl } from "../utils/getImageUrl";
import "./MisFavoritos.css";

function tokenValido(token) {
  return (
    token && token !== "null" && token !== "undefined" && token.trim() !== ""
  );
}

function MisFavoritos() {
  const navigate = useNavigate();

  const [favoritos, setFavoritos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [favoritoEliminandoId, setFavoritoEliminandoId] = useState(null);

  const cargarFavoritos = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!tokenValido(token)) {
        navigate("/login", {
          state: { from: "/mis-favoritos" },
        });
        return;
      }

      const response = await api.get("/api/favoritos");

      const datos = Array.isArray(response.data?.favoritos)
        ? response.data.favoritos
        : [];

      setFavoritos(datos);
    } catch (error) {
      console.error("Error al cargar favoritos:", error);

      setError(
        error.response?.data?.mensaje ||
          "No se pudieron cargar tus cursos favoritos.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarFavoritos();
  }, []);

  const quitarFavorito = async (event, cursoId) => {
    event.stopPropagation();

    try {
      setFavoritoEliminandoId(cursoId);

      await api.delete(`/api/favoritos/${cursoId}`);

      setFavoritos((prev) =>
        prev.filter((favorito) => {
          const id = favorito?.curso?._id || favorito?.curso?.id;
          return String(id) !== String(cursoId);
        }),
      );
    } catch (error) {
      console.error("Error al quitar favorito:", error);
    } finally {
      setFavoritoEliminandoId(null);
    }
  };

  if (loading) {
    return (
      <div className="mis-favoritos-page">
        <div className="mis-favoritos-container">
          <div className="mis-favoritos-estado">
            <div className="mis-favoritos-estado__icono">♡</div>
            <h2>Cargando favoritos</h2>
            <p>Estamos buscando los cursos que guardaste.</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mis-favoritos-page">
        <div className="mis-favoritos-container">
          <div className="mis-favoritos-estado mis-favoritos-estado--error">
            <div className="mis-favoritos-estado__icono">⚠️</div>
            <h2>No pudimos cargar tus favoritos</h2>
            <p>{error}</p>

            <button type="button" onClick={cargarFavoritos}>
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mis-favoritos-page">
      <section className="mis-favoritos-hero">
        <div>
          <span>MI LISTA</span>
          <h1>Mis cursos favoritos</h1>
          <p>
            Guardá los cursos que más te interesan y volvé a ellos cuando
            quieras.
          </p>
        </div>

        <button type="button" onClick={() => navigate("/cursos")}>
          Explorar cursos
        </button>
      </section>

      <main className="mis-favoritos-container">
        {favoritos.length === 0 ? (
          <div className="mis-favoritos-estado">
            <div className="mis-favoritos-estado__icono">♡</div>
            <h2>Todavía no tenés cursos favoritos</h2>
            <p>
              Tocá el corazón en el catálogo para guardar cursos en esta lista.
            </p>

            <button type="button" onClick={() => navigate("/cursos")}>
              Ir al catálogo
            </button>
          </div>
        ) : (
          <div className="mis-favoritos-grid">
            {favoritos.map((favorito) => {
              const curso = favorito.curso;
              const cursoId = String(curso?._id || curso?.id || "");

              if (!curso) return null;

              const imagen =
                getImageUrl(curso.imagenPortada) ||
                getImageUrl(curso.imagen) ||
                "/placeholder-curso.png";

              return (
                <article
                  className="mis-favoritos-card"
                  key={favorito._id || cursoId}
                  onClick={() => navigate(`/cursos/${cursoId}`)}
                >
                  <div className="mis-favoritos-card__imagen">
                    <img src={imagen} alt={curso.titulo} />

                    <span>{curso.categoria?.nombre || "Programación"}</span>

                    <button
                      type="button"
                      className="mis-favoritos-card__quitar"
                      onClick={(event) => quitarFavorito(event, cursoId)}
                      disabled={favoritoEliminandoId === cursoId}
                      title="Quitar de favoritos"
                      aria-label="Quitar de favoritos"
                    >
                      ♥
                    </button>
                  </div>

                  <div className="mis-favoritos-card__body">
                    <h3>{curso.titulo}</h3>

                    <p>{curso.descripcion}</p>

                    <div className="mis-favoritos-card__rating">
                      {Number(curso.promedioResenias || 0) > 0 ? (
                        <>
                          <span>
                            ★ {Number(curso.promedioResenias).toFixed(1)}
                          </span>
                          <small>
                            {curso.cantidadResenias}{" "}
                            {Number(curso.cantidadResenias) === 1
                              ? "reseña"
                              : "reseñas"}
                          </small>
                        </>
                      ) : (
                        <>
                          <span>★ Nuevo</span>
                          <small>Sin reseñas</small>
                        </>
                      )}
                    </div>

                    <div className="mis-favoritos-card__meta">
                      <span>{curso.nivel || "Nivel inicial"}</span>
                      <span>
                        ${Number(curso.precio || 0).toLocaleString("es-AR")}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        navigate(`/cursos/${cursoId}`);
                      }}
                    >
                      Ver curso
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default MisFavoritos;
