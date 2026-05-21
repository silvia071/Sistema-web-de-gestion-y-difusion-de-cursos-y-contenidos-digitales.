import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  Home,
  BookOpen,
  Newspaper,
  UsersRound,
  MessageCircle,
  ShoppingCart,
} from "lucide-react";
import { useCarrito } from "../../context/CarritoContext";
import logo from "../../assets/logo.png";
import "./Navbar.css";

function obtenerPayloadToken(token) {
  try {
    if (!token || typeof token !== "string") return null;

    const partes = token.split(".");

    if (partes.length !== 3) return null;

    const payloadBase64 = partes[1].replace(/-/g, "+").replace(/_/g, "/");

    const payloadDecodificado = decodeURIComponent(
      atob(payloadBase64)
        .split("")
        .map((caracter) => {
          return `%${`00${caracter.charCodeAt(0).toString(16)}`.slice(-2)}`;
        })
        .join(""),
    );

    return JSON.parse(payloadDecodificado);
  } catch {
    return null;
  }
}

function Navbar() {
  const { cantidadTotal, limpiarCarritoVisual } = useCarrito();
  const navigate = useNavigate();

  const [openUserMenu, setOpenUserMenu] = useState(false);

  const cerrarMenuUsuario = () => {
    setOpenUserMenu(false);
  };

  const navegarYCerrarMenu = (ruta) => {
    cerrarMenuUsuario();
    navigate(ruta);
  };

  const tokenGuardado = localStorage.getItem("token");

  const token =
    tokenGuardado &&
    tokenGuardado !== "null" &&
    tokenGuardado !== "undefined" &&
    tokenGuardado.trim() !== ""
      ? tokenGuardado
      : null;

  const payload = token ? obtenerPayloadToken(token) : null;
  const esAdmin = payload?.rol === "ADMINISTRADOR";

  const handleLogout = () => {
    limpiarCarritoVisual();

    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    localStorage.removeItem("rol");
    localStorage.removeItem("userId");
    localStorage.removeItem("email");
    localStorage.removeItem("nombre");
    localStorage.removeItem("apellido");
    localStorage.removeItem("nombreCompleto");
    localStorage.removeItem("carrito");

    cerrarMenuUsuario();
    navigate("/");
  };

  const handleCarritoClick = (e) => {
    e.preventDefault();
    cerrarMenuUsuario();

    if (token) {
      navigate("/carrito");
    } else {
      navigate("/login");
    }
  };

  return (
    <header className="navbar">
      <div className="container navbar__content">
        <div className="navbar__logo">
          <NavLink to="/" className="navbar__brand" onClick={cerrarMenuUsuario}>
            <img src={logo} alt="Mundo Dev" className="navbar__logo-img" />

            <span className="navbar__brand-text">
              MUNDO <strong>DEV</strong>
            </span>
          </NavLink>
        </div>

        <nav className="navbar__links">
          <NavLink
            to="/"
            end
            onClick={cerrarMenuUsuario}
            className={({ isActive }) =>
              `navbar__link ${isActive ? "active" : ""}`
            }
          >
            <Home />
            <span>Inicio</span>
          </NavLink>

          <NavLink
            to="/cursos"
            onClick={cerrarMenuUsuario}
            className={({ isActive }) =>
              `navbar__link ${isActive ? "active" : ""}`
            }
          >
            <BookOpen />
            <span>Cursos</span>
          </NavLink>

          <NavLink
            to="/blog"
            onClick={cerrarMenuUsuario}
            className={({ isActive }) =>
              `navbar__link ${isActive ? "active" : ""}`
            }
          >
            <Newspaper />
            <span>Blog</span>
          </NavLink>

          <NavLink
            to="/nosotros"
            onClick={cerrarMenuUsuario}
            className={({ isActive }) =>
              `navbar__link ${isActive ? "active" : ""}`
            }
          >
            <UsersRound />
            <span>Nosotros</span>
          </NavLink>

          <NavLink
            to="/contactos"
            onClick={cerrarMenuUsuario}
            className={({ isActive }) =>
              `navbar__link ${isActive ? "active" : ""}`
            }
          >
            <MessageCircle />
            <span>Contacto</span>
          </NavLink>
        </nav>

        <div className="navbar__actions">
          {!esAdmin && (
            <NavLink
              to="/carrito"
              onClick={handleCarritoClick}
              className={({ isActive }) =>
                `navbar__cart ${isActive ? "active" : ""}`
              }
            >
              <ShoppingCart />

              {token && cantidadTotal > 0 && (
                <span
                  key={cantidadTotal}
                  className="navbar__cart-badge navbar__cart-badge--animado"
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
                onClick={() => setOpenUserMenu((prev) => !prev)}
              >
                Mi cuenta ▼
              </button>

              {openUserMenu && (
                <div className="navbar__dropdown">
                  <button
                    type="button"
                    className="navbar__dropdown-item"
                    onClick={() => navegarYCerrarMenu("/perfil")}
                  >
                    Mi perfil
                  </button>

                  {!esAdmin && (
                    <>
                      <button
                        type="button"
                        className="navbar__dropdown-item"
                        onClick={() => navegarYCerrarMenu("/mis-cursos")}
                      >
                        Mis cursos
                      </button>

                      <button
                        type="button"
                        className="navbar__dropdown-item"
                        onClick={() => navegarYCerrarMenu("/carrito")}
                      >
                        Mi carrito
                      </button>
                    </>
                  )}

                  {esAdmin && (
                    <button
                      type="button"
                      className="navbar__dropdown-item"
                      onClick={() => navegarYCerrarMenu("/admin")}
                    >
                      Panel administrador
                    </button>
                  )}

                  <button
                    type="button"
                    className="navbar__dropdown-item"
                    onClick={handleLogout}
                  >
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <NavLink
              to="/login"
              className="navbar__button"
              onClick={cerrarMenuUsuario}
            >
              Ingresar
            </NavLink>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
