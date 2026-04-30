import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../config/api";
import "./Blog.css";
import CardBlog from "../components/common/CardBlog";


function Blog() {
  const navigate = useNavigate();
  const [publicaciones, setPublicaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargarPublicaciones = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/publicaciones`);
        const data = await res.json();

        if (!res.ok) {
          setError("No se pudieron cargar las publicaciones");
          return;
        }

        setPublicaciones(data);
      } catch (err) {
        setError("Error de conexión con el servidor");
      } finally {
        setLoading(false);
      }
    };

    cargarPublicaciones();
  }, []);

  const formatearFecha = (fecha) => {
    if (!fecha) return "Sin fecha";
    return new Date(fecha).toLocaleDateString("es-AR");
  };

  const obtenerResumen = (pub) => {
    return pub.resumen || pub.contenido || "Sin resumen disponible.";
  };

  const obtenerCategoria = (pub) => {
    return pub.categoria?.nombre || "Sin categoría";
  };

  const obtenerImagen = (pub, index) => {
    return pub.imagen || `https://picsum.photos/400/200?random=${index + 1}`;
  };

  if (loading) {
    return (
      <section className="blog-page">
        <div className="blog-header">
          <h1 className="blog-title">Blog</h1>
          <p className="blog-subtitle">
            Descubrí artículos, novedades y recursos sobre programación y
            tecnología.
          </p>
        </div>
        <p>Cargando publicaciones...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="blog-page">
        <div className="blog-header">
          <h1 className="blog-title">Blog</h1>
          <p className="blog-subtitle">
            Descubrí artículos, novedades y recursos sobre programación y
            tecnología.
          </p>
        </div>
        <p>{error}</p>
      </section>
    );
  }

  return (
    <section className="blog-page">
      <div className="blog-header">
        <h1>Blog</h1>
        <p>Artículos y novedades sobre programación</p>
      </div>

      <div className="grid grid-3">
        {publicaciones.map((pub, index) => (
          <CardBlog
            key={pub._id}
            imagen={obtenerImagen(pub, index)}
            titulo={pub.titulo}
            texto={obtenerResumen(pub)}
            onClick={() => navigate(`/blog/${pub._id}`)}
          />
        ))}
      </div>
    </section>
  );
}


export default Blog;
