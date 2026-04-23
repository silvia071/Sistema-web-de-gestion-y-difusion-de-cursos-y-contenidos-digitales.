import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:3000";

function Categorias() {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const obtenerCategorias = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/categorias`);

        if (!response.ok) {
          throw new Error("No se pudieron cargar las categorías");
        }

        const data = await response.json();
        setCategorias(data);
      } catch (err) {
        console.error(err);
        setError("Ocurrió un error al cargar las categorías");
      } finally {
        setLoading(false);
      }
    };

    obtenerCategorias();
  }, []);

  const handleCategoriaClick = (categoria) => {
    navigate(`/cursos?categoria=${encodeURIComponent(categoria.nombre)}`);
  };

  return (
    <section className="categorias-page">
      <div className="categorias-container">
        <div className="categorias-header">
          <span className="categorias-badge">Explorá por temática</span>
          <h1 className="categorias-title">Categorías</h1>
          <p className="categorias-subtitle">
            Elegí una categoría para ver los cursos relacionados.
          </p>
        </div>

        {loading && <p className="categorias-state">Cargando categorías...</p>}

        {error && !loading && <p className="categorias-state">{error}</p>}

        {!loading && !error && categorias.length === 0 && (
          <p className="categorias-state">No hay categorías disponibles.</p>
        )}

        {!loading && !error && categorias.length > 0 && (
          <div className="categorias-grid">
            {categorias.map((categoria) => (
              <article
                key={categoria._id}
                className="categoria-card"
                onClick={() => handleCategoriaClick(categoria)}
              >
                <div className="categoria-card__icon">
                  {categoria.nombre?.charAt(0)?.toUpperCase()}
                </div>

                <h3 className="categoria-card__title">{categoria.nombre}</h3>

                <p className="categoria-card__description">
                  {categoria.descripcion ||
                    "Cursos disponibles en esta categoría"}
                </p>

                <button
                  type="button"
                  className="categoria-card__button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCategoriaClick(categoria);
                  }}
                >
                  Ver cursos
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default Categorias;
