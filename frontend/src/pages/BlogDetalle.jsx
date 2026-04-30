import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_BASE } from "../config/api";
import "./BlogDetalle.css";

function BlogDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [publicacion, setPublicacion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargarPublicacion = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/publicaciones/${id}`);
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          setError(data.mensaje || "Publicación no encontrada.");
          return;
        }

        setPublicacion(data);
      } catch (err) {
        console.error(err);
        setError("Error de conexión con el servidor.");
      } finally {
        setLoading(false);
      }
    };

    cargarPublicacion();
  }, [id]);

  const formatearFecha = (fecha) => {
    if (!fecha) return "Sin fecha";
    return new Date(fecha).toLocaleDateString("es-AR");
  };

  const obtenerCategoria = (pub) => {
    return pub.categoria?.nombre || "Sin categoría";
  };

  // 🔥 CORREGIDO
  const obtenerImagen = (pub) => {
    if (!pub.imagen) return `${API_BASE}/uploads/test.png`;

    if (pub.imagen.startsWith("http")) {
      return pub.imagen;
    }

    return `${API_BASE}${pub.imagen}`;
  };

  if (loading) {
    return (
      <div className="blog-detalle">
        <h2>Cargando publicación...</h2>
      </div>
    );
  }

  if (error || !publicacion) {
    return (
      <div className="blog-detalle">
        <button className="blog-detalle-btn" onClick={() => navigate("/blog")}>
          ← Volver
        </button>
        <h2>{error || "Publicación no encontrada."}</h2>
      </div>
    );
  }

  return (
    <div className="blog-detalle">
      <button className="blog-detalle-btn" onClick={() => navigate("/blog")}>
        ← Volver
      </button>

      <img
        src={obtenerImagen(publicacion)}
        alt={publicacion.titulo}
        className="blog-detalle-img"
      />

      <h1>{publicacion.titulo}</h1>

      <p className="blog-detalle-info">
        <strong>{obtenerCategoria(publicacion)}</strong> -{" "}
        {formatearFecha(publicacion.fechaPublicacion || publicacion.createdAt)}
      </p>

      <p className="blog-detalle-contenido">
        {publicacion.contenido || "Sin contenido disponible."}
      </p>
    </div>
  );
}

export default BlogDetalle;
