import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../config/api";
import CardBlog from "../components/common/CardBlog";
import "./Blog.css";

function Blog() {
  const navigate = useNavigate();
  const [publicaciones, setPublicaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargarPublicaciones = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/publicaciones`);
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          setError("No se pudieron cargar las publicaciones.");
          return;
        }

        const publicacionesData = Array.isArray(data)
          ? data
          : data.publicaciones || [];

        setPublicaciones(publicacionesData);
      } catch (err) {
        console.error(err);
        setError("Error de conexión con el servidor.");
      } finally {
        setLoading(false);
      }
    };

    cargarPublicaciones();
  }, []);

  const obtenerResumen = (pub) => {
    return pub.resumen || pub.contenido || "Sin resumen disponible.";
  };

  const obtenerImagen = (pub) => {
    if (!pub.imagen) return "/placeholder-curso.png";

    if (pub.imagen.startsWith("http")) {
      return pub.imagen;
    }

    return `${API_BASE}${pub.imagen}`;
  };

  if (loading) {
    return (
      <section className="blog-page">
        <div className="blog-header">
          <h1>Blog</h1>
          <p>Artículos y novedades sobre programación</p>
        </div>

        <p className="blog-status">Cargando publicaciones...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="blog-page">
        <div className="blog-header">
          <h1>Blog</h1>
          <p>Artículos y novedades sobre programación</p>
        </div>

        <p className="blog-status blog-error">{error}</p>
      </section>
    );
  }

  return (
    <section className="blog-page">
      <div className="blog-header">
        <h1>Blog</h1>
        <p>Artículos y novedades sobre programación</p>
      </div>

      {publicaciones.length === 0 ? (
        <p className="blog-status">No hay publicaciones disponibles.</p>
      ) : (
        <div className="grid grid-3">
          {publicaciones.map((pub, index) => (
            <CardBlog
              key={pub._id || index}
              imagen={obtenerImagen(pub)}
              titulo={pub.titulo}
              texto={obtenerResumen(pub)}
              onClick={() => navigate(`/blog/${pub._id}`)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default Blog;
