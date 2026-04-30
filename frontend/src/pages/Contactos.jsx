import { useState } from "react";
import "./Contactos.css";

function Contactos() {
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    mensaje: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log("Formulario enviado:", form);

    // limpiar formulario
    setForm({
      nombre: "",
      email: "",
      mensaje: "",
    });
  };

  return (
    <section className="contacto-page">
      <div className="contacto-container">
        <div className="contacto-header">
          <span className="contacto-badge">Estamos para ayudarte</span>
          <h1>Contacto</h1>
          <p>
            ¿Tenés alguna consulta? Escribinos y te responderemos lo antes
            posible.
          </p>
        </div>

        <div className="contacto-grid">
          <form className="contacto-form" onSubmit={handleSubmit}>
            <div className="contacto-form-row">
              <input
                type="text"
                name="nombre"
                placeholder="Nombre"
                value={form.nombre}
                onChange={handleChange}
                required
              />

              <input
                type="email"
                name="email"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <textarea
              name="mensaje"
              placeholder="Mensaje"
              rows="6"
              value={form.mensaje}
              onChange={handleChange}
              required
            />

            <button type="submit" className="contacto-btn">
              Enviar mensaje
            </button>
          </form>

          <div className="contacto-info">
            <h3>Información</h3>
            <p>
              <strong>Email:</strong> contacto@mundodev.com
            </p>
            <p>
              <strong>Ubicación:</strong> Argentina
            </p>
            <p>
              <strong>Horario:</strong> Lunes a Viernes
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Contactos;
