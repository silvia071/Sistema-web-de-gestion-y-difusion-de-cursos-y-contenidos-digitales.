import "./CardBlog.css";

function CardBlog({ imagen, titulo, texto, onClick }) {
  return (
    <div className="card card-blog" onClick={onClick}>
      <img src={imagen} alt={titulo} className="card-blog-img" />

      <div className="card-blog-content">
        <h3 className="card-blog-title">{titulo}</h3>

        <p className="card-blog-text">{texto}</p>

        <button
          type="button"
          className="card-blog-read-more"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          Leer más →
        </button>
      </div>
    </div>
  );
}

export default CardBlog;
