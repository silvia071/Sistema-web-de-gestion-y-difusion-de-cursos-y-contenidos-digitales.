import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { getImageUrl } from "../utils/getImageUrl";
import "./Home.css";

import reactHero from "../assets/react-hero.png";
import figmaHero from "../assets/figma-hero.png";
import marketingHero from "../assets/marketing-hero.png";

export default function Home() {
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const obtenerCursos = async () => {
      try {
        const response = await api.get("/api/cursos");
        const lista = response.data.datos || [];

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
      curso?.imagenPortada ||
      curso?.imagen ||
      curso?.imagenUrl ||
      curso?.urlImagen ||
      curso?.image ||
      curso?.img;

    if (!imagen || typeof imagen !== "string") return null;

    const limpia = imagen.trim();
    if (!limpia) return null;

    return getImageUrl(limpia);
  };

  return (
    <main className="home-page">
      <section className="hero-home">
        <div className="hero-home__content">
          <div className="hero-home__left">
            <span className="hero-home__eyebrow">
              PLATAFORMA DE CURSOS ONLINE
            </span>

            <h1 className="hero-home__title">
              Aprendé hoy.
              <br />
              <span>Transformá tu futuro.</span>
            </h1>

            <p className="hero-home__text">
              Accedé a cursos digitales diseñados para ayudarte a desarrollar
              nuevas habilidades, avanzar profesionalmente y aprender a tu
              ritmo.
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

          <div className="hero-home__right" aria-hidden="true">
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
                      Aprendé a crear interfaces modernas, dinámicas y
                      escalables con herramientas actuales.
                    </p>

                    <Link to="/cursos" className="hero-card__btn">
                      Explorar
                    </Link>
                  </div>

                  <div className="hero-card__right">
                    <div className="hero-card__code hero-card__code--left"></div>
                    <img src={reactHero} alt="" />
                    <div className="hero-card__code hero-card__code--right"></div>
                  </div>
                </div>
              </div>

              <div className="hero-course-card hero-course-card--top">
                <span className="hero-course-card__tag hero-course-card__tag--pink">
                  DISEÑO
                </span>

                <div className="hero-course-card__small-content">
                  <div className="hero-course-card__small-text">
                    <h4>UI/UX</h4>
                    <h4>Diseño Web</h4>
                  </div>

                  <div className="hero-course-card__small-media">
                    <img src={figmaHero} alt="" />
                  </div>
                </div>
              </div>

              <div className="hero-course-card hero-course-card--bottom">
                <span className="hero-course-card__tag hero-course-card__tag--green">
                  MARKETING
                </span>

                <div className="hero-course-card__small-content">
                  <div className="hero-course-card__small-text">
                    <h4>Marketing</h4>
                    <h4>Digital</h4>
                  </div>

                  <div className="hero-course-card__small-media">
                    <img src={marketingHero} alt="" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="benefits-strip" id="como">
        <div className="benefits-strip__grid">
          <article className="benefit-item">
            <div className="benefit-item__icon">📘</div>

            <div className="benefit-item__content">
              <h3>Aprendé a tu ritmo</h3>
              <p>Accedé cuando quieras desde cualquier dispositivo.</p>
            </div>
          </article>

          <article className="benefit-item">
            <div className="benefit-item__icon">📄</div>

            <div className="benefit-item__content">
              <h3>Certificados</h3>
              <p>Sumá valor a tu perfil al completar tus cursos.</p>
            </div>
          </article>

          <article className="benefit-item">
            <div className="benefit-item__icon">∞</div>

            <div className="benefit-item__content">
              <h3>Acceso ilimitado</h3>
              <p>Revisá el contenido todas las veces que necesites.</p>
            </div>
          </article>

          <article className="benefit-item">
            <div className="benefit-item__icon">🎧</div>

            <div className="benefit-item__content">
              <h3>Soporte</h3>
              <p>Acompañamiento para resolver dudas durante el aprendizaje.</p>
            </div>
          </article>
        </div>
      </section>

      <section className="featured-courses">
        <div className="container">
          <div className="featured-courses__header">
            <div>
              <h2>Cursos destacados</h2>
              <p>Una selección de contenidos para empezar hoy.</p>
            </div>

            <Link to="/cursos" className="featured-courses__btn">
              Ver todos →
            </Link>
          </div>

          {loading ? (
            <p className="home-loading">Cargando cursos...</p>
          ) : cursos.length === 0 ? (
            <p className="home-loading">No hay cursos disponibles.</p>
          ) : (
            <div className="featured-courses__grid">
              {cursos.map((curso) => {
                const categoriaTexto = obtenerCategoriaTexto(curso);
                const categoriaClase = obtenerCategoriaClase(categoriaTexto);
                const iniciales = obtenerIniciales(curso, categoriaTexto);
                const imagenCurso = construirImagenCurso(curso);

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
                        {(curso.profesor || curso.instructor) && (
                          <span className="course-card__teacher">
                            {curso.profesor || curso.instructor}
                          </span>
                        )}

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
      <section className="home-cta">
        <div className="home-cta__content">
          <div className="home-cta__icon">🎓</div>

          <div>
            <h2>¿Listo para comenzar?</h2>
            <p>Unite a miles de estudiantes y empezá a aprender hoy mismo.</p>
          </div>

          <Link to="/cursos" className="home-cta__btn">
            Explorar cursos
          </Link>
        </div>
      </section>
      <section className="mobile-preview">
        <div className="mobile-preview__grid">
          <div className="phone-mockup">
            <div className="phone-mockup__top">
              <span className="phone-logo">{"{MD}"}</span>
              <span>☰</span>
            </div>

            <span className="phone-eyebrow">PLATAFORMA DE CURSOS</span>

            <h3>
              Aprendé hoy.
              <span>Transformá tu futuro.</span>
            </h3>

            <p>Accedé a los mejores cursos online y desarrollá habilidades.</p>

            <button>Ver cursos</button>

            <div className="phone-stats">
              <span>+100</span>
              <span>+5.000</span>
              <span>4.9/5</span>
            </div>
          </div>

          <div className="phone-mockup">
            <div className="phone-mockup__top">
              <span>‹</span>
              <span>☰</span>
            </div>

            <h4>Aprendé a tu ritmo</h4>

            <div className="phone-feature">📘 Accedé cuando quieras</div>
            <div className="phone-feature">📄 Certificados incluidos</div>
            <div className="phone-feature">∞ Acceso ilimitado</div>
            <div className="phone-feature">🎧 Soporte disponible</div>
          </div>

          <div className="phone-mockup">
            <div className="phone-mockup__top">
              <span>‹</span>
              <span>☰</span>
            </div>

            <h4>Cursos destacados</h4>

            <div className="phone-course">
              {(() => {
                const imagenPreview = cursos[0]
                  ? construirImagenCurso(cursos[0])
                  : null;

                return imagenPreview ? (
                  <img
                    src={imagenPreview}
                    alt={cursos[0]?.titulo || "Curso destacado"}
                  />
                ) : null;
              })()}

              <strong>{cursos[0]?.titulo || "Curso de JavaScript"}</strong>
              <span>⭐ 4.9</span>
              <b>$15.000</b>
              <button>Ver curso</button>
            </div>
          </div>

          <div className="phone-mockup">
            <div className="phone-mockup__top">
              <span>‹</span>
              <span>☰</span>
            </div>

            <span className="phone-badge">DESARROLLO WEB</span>

            <h4>React Completo</h4>

            <p>Aprendé React desde cero y construí aplicaciones modernas.</p>

            <button>Ver curso</button>

            <div className="phone-mini-card">DISEÑO · UI/UX Diseño Web</div>
            <div className="phone-mini-card">MARKETING · Marketing Digital</div>
          </div>
        </div>
      </section>
    </main>
  );
}
