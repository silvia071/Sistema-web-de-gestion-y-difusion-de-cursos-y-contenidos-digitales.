import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE } from "../config/api";
import "./Home.css";

import reactHero from "../assets/react-hero.png";
import figmaHero from "../assets/figma-hero.png";
import marketingHero from "../assets/marketing-hero.png";

const imgJS = new URL("../assets/JavaScript.png", import.meta.url).href;
const imgPython = new URL("../assets/Python.png", import.meta.url).href;
const imgJava = new URL("../assets/java.png", import.meta.url).href;
const imgCpp = new URL("../assets/C++.png", import.meta.url).href;
const imgHtml = new URL("../assets/html.png", import.meta.url).href;

export default function Home() {
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const obtenerCursos = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/cursos`);
        const data = await res.json();

        const lista = Array.isArray(data)
          ? data
          : Array.isArray(data.cursos)
            ? data.cursos
            : [];

        console.log("CURSOS HOME:", lista);
        setCursos(lista.slice(0, 4));
      } catch (error) {
        console.error("Error cargando cursos:", error);
        setCursos([]);
      } finally {
        setLoading(false);
      }
    };

    obtenerCursos();
  }, []);

  const obtenerCategoriaTexto = (curso) => {
    return typeof curso.categoria === "object"
      ? curso.categoria?.nombre || "CURSO"
      : curso.categoria || "CURSO";
  };

  const obtenerCategoriaClase = (categoriaTexto) => {
    const texto = categoriaTexto.toLowerCase();

    if (texto.includes("marketing")) return "course-card--marketing";
    if (texto.includes("dise")) return "course-card--design";
    if (texto.includes("backend")) return "course-card--backend";
    if (texto.includes("python")) return "course-card--backend";
    if (texto.includes("java")) return "course-card--backend";
    return "course-card--dev";
  };

  const obtenerIniciales = (curso, categoriaTexto) => {
    const titulo = (curso.titulo || "").toLowerCase();

    if (titulo.includes("javascript")) return "JS";
    if (titulo.includes("python")) return "PY";
    if (titulo.includes("java")) return "JV";
    if (titulo.includes("c++")) return "C++";
    if (titulo.includes("react")) return "⚛";
    if (categoriaTexto.toLowerCase().includes("marketing")) return "MK";
    if (categoriaTexto.toLowerCase().includes("dise")) return "UI";

    return categoriaTexto.slice(0, 2).toUpperCase();
  };

  const construirImagenCurso = (curso) => {
    const imagen =
      curso?.imagen ||
      curso?.imagenUrl ||
      curso?.urlImagen ||
      curso?.image ||
      curso?.img;

    if (!imagen || typeof imagen !== "string") return null;

    const limpia = imagen.trim();
    if (!limpia) return null;

    if (
      limpia.startsWith("http://") ||
      limpia.startsWith("https://") ||
      limpia.startsWith("data:")
    ) {
      return limpia;
    }

    if (limpia.startsWith("/uploads/")) {
      return `${API_BASE}${limpia}`;
    }

    if (limpia.startsWith("uploads/")) {
      return `${API_BASE}/${limpia}`;
    }

    if (limpia.startsWith("/")) {
      return `${API_BASE}${limpia}`;
    }

    return `${API_BASE}/uploads/${limpia}`;
  };

  const obtenerImagenLocal = (curso) => {
    const titulo = (curso.titulo || "").toLowerCase();

    if (titulo.includes("javascript")) return imgJS;
    if (titulo.includes("python")) return imgPython;
    if (titulo.includes("c++")) return imgCpp;
    if (titulo.includes("html") || titulo.includes("css")) return imgHtml;
    if (titulo.includes("java")) return imgJava;

    return null;
  };

  return (
    <main className="home-page">
      <section className="hero-home">
        <div className="hero-home__content">
          <div className="hero-home__left">
            <span className="hero-home__eyebrow">PLATAFORMA DE CURSOS</span>

            <h1 className="hero-home__title">
              Aprendé hoy,
              <br />
              <span>transformá tu futuro</span>
            </h1>

            <p className="hero-home__text">
              Accedé a los mejores cursos online y desarrollá nuevas habilidades
              a tu ritmo.
            </p>

            <div className="hero-home__actions">
              <Link
                to="/cursos"
                className="hero-home__btn hero-home__btn--primary"
              >
                Ver cursos
              </Link>

              <a
                href="#como"
                className="hero-home__btn hero-home__btn--secondary"
              >
                ¿Cómo funciona?
              </a>
            </div>

            <div className="hero-home__stats">
              <div className="hero-home__stat">
                <strong>+100</strong>
                <span>Cursos</span>
              </div>

              <div className="hero-home__stat">
                <strong>+5.000</strong>
                <span>Estudiantes</span>
              </div>

              <div className="hero-home__stat">
                <strong>4.9/5</strong>
                <span>Valoración</span>
              </div>
            </div>
          </div>

          <div className="hero-home__right">
            <div className="hero-home__visual">
              <div className="hero-card">
                <span className="hero-card__badge">DESARROLLO WEB</span>

                <div className="hero-card__content">
                  <div className="hero-card__left">
                    <h3>
                      React
                      <br />
                      Completo
                    </h3>

                    <p>
                      Aprendé React desde cero y construí aplicaciones modernas.
                    </p>

                    <Link to="/cursos" className="hero-card__btn">
                      Ver curso
                    </Link>
                  </div>

                  <div className="hero-card__right">
                    <div className="hero-card__code hero-card__code--left"></div>
                    <img src={reactHero} alt="React" />
                    <div className="hero-card__code hero-card__code--right"></div>
                  </div>
                </div>
              </div>

              <div className="hero-course-card hero-course-card--small hero-course-card--top">
                <span className="hero-course-card__tag hero-course-card__tag--pink">
                  DISEÑO
                </span>

                <div className="hero-course-card__small-content">
                  <div className="hero-course-card__small-text">
                    <h4>UI/UX</h4>
                    <h4>Diseño Web</h4>
                  </div>

                  <div className="hero-course-card__small-media">
                    <img src={figmaHero} alt="Figma" />
                  </div>
                </div>
              </div>

              <div className="hero-course-card hero-course-card--small hero-course-card--bottom">
                <span className="hero-course-card__tag hero-course-card__tag--green">
                  MARKETING
                </span>

                <div className="hero-course-card__small-content">
                  <div className="hero-course-card__small-text">
                    <h4>Marketing</h4>
                    <h4>Digital</h4>
                  </div>

                  <div className="hero-course-card__small-media">
                    <img src={marketingHero} alt="Marketing" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="benefits-strip" id="como">
        <div className="benefits-strip__grid">
          <div className="benefit-item">
            <div className="benefit-item__icon">📘</div>
            <div className="benefit-item__content">
              <h3>Aprendé a tu ritmo</h3>
              <p>
                Accedé a los cursos cuando quieras y desde cualquier
                dispositivo.
              </p>
            </div>
          </div>

          <div className="benefit-item">
            <div className="benefit-item__icon">📄</div>
            <div className="benefit-item__content">
              <h3>Certificados</h3>
              <p>
                Obtené certificados al completar cada curso y potenciá tu
                perfil.
              </p>
            </div>
          </div>

          <div className="benefit-item">
            <div className="benefit-item__icon">∞</div>
            <div className="benefit-item__content">
              <h3>Acceso ilimitado</h3>
              <p>Ingresá a todo el contenido siempre que lo necesites.</p>
            </div>
          </div>

          <div className="benefit-item">
            <div className="benefit-item__icon">🎧</div>
            <div className="benefit-item__content">
              <h3>Soporte 24/7</h3>
              <p>Nuestro equipo está siempre disponible para ayudarte.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="featured-courses">
        <div className="container">
          <div className="featured-courses__header">
            <div>
              <h2>Cursos destacados</h2>
              <p>Elegidos especialmente para vos</p>
            </div>

            <Link to="/cursos" className="featured-courses__btn">
              Ver todos →
            </Link>
          </div>

          {loading ? (
            <p className="home-loading">Cargando...</p>
          ) : cursos.length === 0 ? (
            <p className="home-loading">No hay cursos disponibles.</p>
          ) : (
            <div className="featured-courses__grid">
              {cursos.map((curso) => {
                const categoriaTexto = obtenerCategoriaTexto(curso);
                const categoriaClase = obtenerCategoriaClase(categoriaTexto);
                const iniciales = obtenerIniciales(curso, categoriaTexto);
                const imagenCurso =
                  construirImagenCurso(curso) || obtenerImagenLocal(curso);

                return (
                  <article
                    className={`course-card ${categoriaClase}`}
                    key={curso._id || curso.id}
                  >
                    <div className="course-card__cover">
                      <span className="course-card__badge">
                        {categoriaTexto}
                      </span>

                      <button
                        type="button"
                        className="course-card__favorite"
                        aria-label="Agregar a favoritos"
                      >
                        ♡
                      </button>

                      {imagenCurso && (
                        <img
                          src={imagenCurso}
                          alt={curso.titulo}
                          className="course-card__cover-image"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";

                            const fallback =
                              e.currentTarget.parentElement?.querySelector(
                                ".course-card__cover-fallback",
                              );

                            if (fallback) {
                              fallback.classList.remove("is-hidden");
                            }
                          }}
                        />
                      )}

                      <div
                        className={`course-card__cover-fallback ${
                          imagenCurso ? "is-hidden" : ""
                        }`}
                      >
                        <div className="course-card__cover-glow"></div>
                        <div className="course-card__cover-icon">
                          {iniciales}
                        </div>
                      </div>
                    </div>

                    <div className="course-card__content">
                      <h3>{curso.titulo}</h3>

                      <div className="course-card__footer">
                        <span className="course-card__teacher">
                          {curso.profesor || curso.instructor || "Instructor"}
                        </span>

                        <span className="course-card__rating">
                          ⭐ {curso.rating || 4.9}
                        </span>
                      </div>

                      <div className="course-card__price">
                        ${Number(curso.precio || 0).toLocaleString("es-AR")}
                      </div>

                      <Link
                        to={`/cursos/${curso._id || curso.id}`}
                        className="course-card__link"
                      >
                        Ver curso
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
