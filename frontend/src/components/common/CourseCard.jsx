import { Link } from "react-router-dom";
import "./CourseCard.css";

function CourseCard({ curso }) {
  const estado = curso.estado;
  const categoria = curso.categoria?.nombre || "Programación";

  const imagenRaw = curso.imagenPortada || curso.imagen;
  const imagen =
    typeof imagenRaw === "string" && imagenRaw.trim() !== ""
      ? imagenRaw
      : "/placeholder-curso.png";

  const titulo = curso.titulo || "Curso sin título";

  return (
    <article className="course-card">
      <div className="course-card__cover">
        <img src={imagen} alt={titulo} className="course-card__cover-image" />

        <div className="course-card__badges">
          {estado && (
            <span
              className={`course-card__badge course-card__badge--estado course-card__badge--${estado.toLowerCase()}`}
            >
              {estado}
            </span>
          )}

          <span className="course-card__badge course-card__badge--categoria">
            {categoria}
          </span>
        </div>

        <button
          className="course-card__favorite"
          type="button"
          aria-label="Agregar a favoritos"
        >
          ♡
        </button>
      </div>

      <div className="course-card__content">
        <h3>{titulo}</h3>

        <div className="course-card__footer">
          <span className="course-card__teacher">Instructor</span>

          <span className="course-card__rating">⭐ 4.9</span>
        </div>

        <div className="course-card__price">
          ${Number(curso.precio || 0).toLocaleString("es-AR")}
        </div>

        <Link to={`/cursos/${curso._id}`} className="course-card__link">
          Ver curso
        </Link>
      </div>
    </article>
  );
}

export default CourseCard;
