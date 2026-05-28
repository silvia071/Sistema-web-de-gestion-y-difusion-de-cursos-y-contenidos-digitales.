import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { USE_MOCK_API } from "../config/api";
import api from "../services/api";
import "./Registro.css";

function Registro() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error) setError("");
    if (success) setSuccess("");
  };

const irALogin = () => {
  navigate("/login", {
    replace: true,
    state: { email: form.email.trim().toLowerCase() },
  });
};

const irAlInicio = () => {
  navigate("/", { replace: true });
  };
  

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submitting) return;

    setError("");
    setSuccess("");

    const nombre = form.nombre.trim();
    const apellido = form.apellido.trim();
    const email = form.email.trim().toLowerCase();
    const contrasenia = form.password.trim();

    if (!nombre || !apellido || !email || !contrasenia) {
      setError("Completá todos los campos.");
      return;
    }

    if (contrasenia.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setSubmitting(true);

    if (USE_MOCK_API) {
      setSuccess("Usuario registrado correctamente.");
      setSubmitting(false);
      return;
    }

    try {
      const { data } = await api.post("/api/auth/register", {
        nombre,
        apellido,
        email,
        contrasenia,
      });

      setSuccess(data?.mensaje || "Usuario registrado correctamente.");
    } catch (err) {
      console.error(err);

      const erroresValidacion = err.response?.data?.errores;

      if (Array.isArray(erroresValidacion) && erroresValidacion.length > 0) {
        setError(erroresValidacion.map((item) => item.mensaje).join(" - "));
        return;
      }

      setError(
        err.response?.data?.error ||
          err.response?.data?.detalle ||
          err.response?.data?.mensaje ||
          "No se pudo registrar el usuario.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="registro-page">
      <div className="registro-card">
        <div className="registro-header">
          <p className="registro-kicker">Crear cuenta</p>
          <h1 className="registro-title">Registrate en Mundo Dev</h1>
          <p className="registro-subtitle">
            Completá tus datos para acceder a cursos, compras y contenido.
          </p>
        </div>

        <form className="registro-form" onSubmit={handleSubmit}>
          {error && (
            <p className="registro-alert registro-alert-error">{error}</p>
          )}

          {success && (
            <div className="registro-success-overlay">
              <div className="registro-success-modal">
                <div className="registro-success-icon">✓</div>

                <h2>Usuario registrado correctamente</h2>

                <p>
                  Tu cuenta fue creada con éxito. Ya podés iniciar sesión y
                  empezar a explorar los cursos.
                </p>

                <div className="registro-success-actions">
                  <button
                    type="button"
                    className="registro-success-btn registro-success-btn-primary"
                    onClick={irALogin}
                  >
                    Iniciar sesión
                  </button>

                  <button
                    type="button"
                    className="registro-success-btn registro-success-btn-secondary"
                    onClick={irAlInicio}
                  >
                    Ir al inicio
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="registro-row">
            <div className="registro-group">
              <label htmlFor="nombre">Nombre</label>
              <input
                id="nombre"
                name="nombre"
                type="text"
                placeholder="Tu nombre"
                value={form.nombre}
                onChange={handleChange}
                required
              />
            </div>

            <div className="registro-group">
              <label htmlFor="apellido">Apellido</label>
              <input
                id="apellido"
                name="apellido"
                type="text"
                placeholder="Tu apellido"
                value={form.apellido}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="registro-group">
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="tu@email.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="registro-group">
            <label htmlFor="password">Contraseña</label>

            <div className="registro-password-wrap">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Ingresá una contraseña"
                value={form.password}
                onChange={handleChange}
                required
              />

              <button
                type="button"
                className="registro-password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? "Ocultar" : "Mostrar"}
              </button>
            </div>
          </div>

          <button className="registro-btn" type="submit" disabled={submitting}>
            {submitting ? "Registrando..." : "Crear cuenta"}
          </button>
        </form>

        <p className="registro-login-text">
          ¿Ya tenés cuenta? <Link to="/login">Iniciar sesión</Link>
        </p>
      </div>
    </section>
  );
}

export default Registro;
