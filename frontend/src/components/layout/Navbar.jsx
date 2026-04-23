import { NavLink, useNavigate } from "react-router-dom";
import { useCarrito } from "../../context/CarritoContext";
import { useEffect, useState } from "react";
import logo from "../../assets/logo.png";
import "./Navbar.css";

function Navbar() {
  const { cantidadTotal } = useCarrito();
  const navigate = useNavigate();

  const [openUserMenu, setOpenUserMenu] = useState(false);
  const [animarBadge, setAnimarBadge] = useState(false);

  const token = localStorage.getItem("token");
  const nombre = localStorage.getItem("nombre");

  useEffect(() => {
    if (cantidadTotal > 0) {
      setAnimarBadge(true);

      const timer = setTimeout(() => {
        setAnimarBadge(false);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [cantidadTotal]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("email");
    localStorage.removeItem("nombre");
    navigate("/login");
  };

  return (
    <header className="navbar">
      <div className="container navbar__content">
        <div className="navbar__logo">
          <NavLink to="/" className="navbar__brand">
            <img src={logo} alt="Mundo Dev" className="navbar__logo-img" />
          </NavLink>
        </div>

        <nav className="navbar__links">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `navbar__link ${isActive ? "active" : ""}`
            }
          >
            Inicio
          </NavLink>

          <NavLink
            to="/cursos"
            className={({ isActive }) =>
              `navbar__link ${isActive ? "active" : ""}`
            }
          >
            Cursos
          </NavLink>

          <NavLink
            to="/blog"
            className={({ isActive }) =>
              `navbar__link ${isActive ? "active" : ""}`
            }
          >
            Blog
          </NavLink>

          <NavLink
            to="/categorias"
            className={({ isActive }) =>
              `navbar__link ${isActive ? "active" : ""}`
            }
          >
            Categorías
          </NavLink>

          <NavLink
            to="/nosotros"
            className={({ isActive }) =>
              `navbar__link ${isActive ? "active" : ""}`
            }
          >
            Nosotros
          </NavLink>

          <NavLink
            to="/contactos"
            className={({ isActive }) =>
              `navbar__link ${isActive ? "active" : ""}`
            }
          >
            Contacto
          </NavLink>
        </nav>

        <div className="navbar__actions">
          {token && (
            <NavLink
              to="/carrito"
              className={({ isActive }) =>
                `navbar__cart ${isActive ? "active" : ""}`
              }
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="8" cy="21" r="1"></circle>
                <circle cx="19" cy="21" r="1"></circle>
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.72a2 2 0 0 0 2-1.64L23 6H6"></path>
              </svg>

              {cantidadTotal > 0 && (
                <span
                  className={`navbar__cart-badge ${
                    animarBadge ? "navbar__cart-badge--animado" : ""
                  }`}
                >
                  {cantidadTotal}
                </span>
              )}
            </NavLink>
          )}

          {token ? (
            <div className="navbar__user-menu">
              <button
                type="button"
                className="navbar__user-btn"
                onClick={() => setOpenUserMenu(!openUserMenu)}
              >
                Mi cuenta ▼
              </button>
              {openUserMenu && (
                <div className="navbar__dropdown">
                  <button
                    type="button"
                    className="navbar__dropdown-item"
                    onClick={() => {
                      setOpenUserMenu(false);
                      navigate("/perfil");
                    }}
                  >
                    Mi perfil
                  </button>

                  <button
                    type="button"
                    className="navbar__dropdown-item"
                    onClick={() => {
                      setOpenUserMenu(false);
                      navigate("/carrito");
                    }}
                  >
                    Mi carrito
                  </button>

                  <button
                    type="button"
                    className="navbar__dropdown-item"
                    onClick={() => {
                      setOpenUserMenu(false);
                      handleLogout();
                    }}
                  >
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <NavLink to="/login" className="navbar__button">
              Ingresar
            </NavLink>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
