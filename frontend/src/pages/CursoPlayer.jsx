import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { API_BASE } from "../config/api";
import "./CursoPlayer.css";

export default function CursoPlayer() {
  const { id } = useParams();

  const [curso, setCurso] = useState(null);
  const [leccionActual, setLeccionActual] = useState(0);
  const [progreso, setProgreso] = useState(0);

  const usuarioId = localStorage.getItem("userId");

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const resCurso = await fetch(`${API_BASE}/api/cursos/${id}`);
        const dataCurso = await resCurso.json();

        setCurso(dataCurso);

        const resAcceso = await fetch(
          `${API_BASE}/api/acceso-curso/usuario/${usuarioId}`,
        );
        const accesos = await resAcceso.json();

        const acceso = accesos.find((a) => a.curso._id === id);

        if (acceso) {
          setProgreso(acceso.progreso);

          const index = Math.floor(
            (acceso.progreso / 100) * dataCurso.lecciones.length,
          );

          setLeccionActual(index);
        }
      } catch (error) {
        console.error(error);
      }
    };

    cargarDatos();
  }, [id]);

  const actualizarProgreso = async (nuevoProgreso) => {
    try {
      await fetch(`${API_BASE}/api/acceso-curso/progreso`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usuarioId,
          cursoId: id,
          progreso: nuevoProgreso,
        }),
      });
    } catch (error) {
      console.error(error);
    }
  };

  // ✅ SOLO CAMBIA LA LECCIÓN (NO EL PROGRESO)
  const handleSeleccionarLeccion = (index) => {
    setLeccionActual(index);
  };

  // ✅ AVANZA PROGRESO SOLO CON EL BOTÓN
  const handleSiguienteLeccion = () => {
    const siguienteIndex = leccionActual + 1;

    const nuevoProgreso = Math.round(
      ((siguienteIndex + 1) / curso.lecciones.length) * 100,
    );

    setProgreso(nuevoProgreso);
    actualizarProgreso(nuevoProgreso);

    if (siguienteIndex < curso.lecciones.length) {
      setLeccionActual(siguienteIndex);
    }
  };

  if (!curso) return <p>Cargando...</p>;

  return (
    <div className="curso-player">
      {/* SIDEBAR */}
      <div className="curso-player-sidebar">
        <h3>{curso.titulo}</h3>

        {curso.lecciones.map((l, i) => (
          <div
            key={l._id}
            onClick={() => handleSeleccionarLeccion(i)}
            className={`curso-player-item ${
              i === leccionActual ? "active" : ""
            }`}
          >
            {i + 1}. {l.titulo}
          </div>
        ))}
      </div>

      {/* CONTENIDO */}
      <div className="curso-player-content">
        <h1>{curso.lecciones[leccionActual]?.titulo}</h1>

        <p className="curso-player-descripcion">
          {curso.lecciones[leccionActual]?.descripcion}
        </p>

        {/* 🎥 VIDEO */}
        {curso.lecciones[leccionActual]?.videoUrl && (
          <div className="curso-player-video">
            <iframe
              src={curso.lecciones[leccionActual].videoUrl}
              title="Video"
              allowFullScreen
            />
          </div>
        )}

        {/* 📄 CONTENIDO */}
        <div className="curso-player-texto">
          {curso.lecciones[leccionActual]?.contenido}
        </div>

        {/* 📊 PROGRESO */}
        <div className="curso-player-progress">
          <div
            className="curso-player-progress-bar"
            style={{ width: `${progreso}%` }}
          />
        </div>

        <p className="curso-player-progreso-texto">Progreso: {progreso}%</p>

        {/* 👉 SIGUIENTE */}
        <button
          className="curso-player-btn"
          onClick={handleSiguienteLeccion}
          disabled={progreso >= 100}
        >
          {progreso >= 100 ? "Curso completado ✔" : "Siguiente lección →"}
        </button>
      </div>
    </div>
  );
}
