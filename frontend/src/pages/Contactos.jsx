import "./Contactos.css";
function Contactos() {
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
          <form className="contacto-form">
            <div className="contacto-form-row">
              <input type="text" placeholder="Nombre" />
              <input type="email" placeholder="Email" />
            </div>

            <textarea placeholder="Mensaje" rows="6"></textarea>

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
