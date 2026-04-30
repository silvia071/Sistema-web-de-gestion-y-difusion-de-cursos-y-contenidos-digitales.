import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE, USE_MOCK_API } from "../config/api";
import { readMockPerfil, writeMockPerfil } from "../services/mockPerfil";
import { useCarrito } from "../context/CarritoContext";
import "./Login.css";

function Login() {
  const navigate = useNavigate();
  const { recargarCarrito } = useCarrito();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const email = form.email.trim();
    const password = form.password;

    if (!email || !password) {
      setError("Completá todos los campos.");
      return;
    }

    if (USE_MOCK_API) {
      const perfil = readMockPerfil(email);
      writeMockPerfil(perfil);

      localStorage.setItem("token", "mock_session");
      localStorage.setItem("userId", "local");
      localStorage.setItem("email", email);
      localStorage.setItem("nombre", perfil?.nombre || "Usuario");

      recargarCarrito();
      navigate("/cursos");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/api/usuarios/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, contrasenia: password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg =
          data.detalle || data.mensaje || "No se pudo iniciar sesión.";
        setError(msg);
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", data.usuario.id || data.usuario._id);
      localStorage.setItem("email", data.usuario.email);
      localStorage.setItem("nombre", data.usuario.nombre);
      localStorage.setItem("rol", data.usuario.rol);

      recargarCarrito();
      navigate("/cursos");
    } catch {
      setError("Error de red. Intentá de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="login-page">
      <div className="login-card">
        <div className="login-header">
          <h1 className="login-title">Iniciar sesión</h1>
          <p className="login-subtitle">
            Accedé a tu cuenta para ver tus cursos y tu perfil.
          </p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && <p className="login-error">{error}</p>}

          <div className="login-group">
            <label className="login-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              className="login-input"
              type="email"
              placeholder="Ingresá tu email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="login-group">
            <label className="login-label" htmlFor="password">
              Contraseña
            </label>

            <div className="login-password-wrap">
              <input
                id="password"
                name="password"
                className="login-input"
                type={showPassword ? "text" : "password"}
                placeholder="Ingresá tu contraseña"
                value={form.password}
                onChange={handleChange}
                required
              />

              <button
                type="button"
                className="login-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Ocultar" : "Mostrar"}
              </button>
            </div>
          </div>

          <button className="login-btn" type="submit" disabled={submitting}>
            {submitting ? "Ingresando…" : "Ingresar"}
          </button>
        </form>

        <p className="login-register-text">
          ¿No tenés cuenta?{" "}
          <Link className="login-register-link" to="/registro">
            Registrate
          </Link>
        </p>
      </div>
    </section>
  );
}

export default Login;
