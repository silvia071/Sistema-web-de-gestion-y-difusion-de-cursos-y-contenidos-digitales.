/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import api from "../services/api";
import { getImageUrl } from "../utils/getImageUrl";

const CarritoContext = createContext();

export const useCarrito = () => useContext(CarritoContext);

export function CarritoProvider({ children }) {
  const [carritoBackend, setCarritoBackend] = useState(null);
  const [carrito, setCarrito] = useState([]);
  const [mensajeCarrito, setMensajeCarrito] = useState("");
  const [cargandoCarrito, setCargandoCarrito] = useState(false);

  const haySesion = useCallback(() => {
    const token = localStorage.getItem("token");

    return (
      token && token !== "null" && token !== "undefined" && token.trim() !== ""
    );
  }, []);

  const normalizarItem = useCallback((item) => {
    const curso = item.curso || item;

    if (!curso) return null;

    const imagenRaw = curso.imagenPortada || curso.imagen || "";
    const imagen = getImageUrl(imagenRaw);

    return {
      id: String(curso._id || curso.id),
      itemId: item._id ? String(item._id) : undefined,
      titulo: curso.titulo || "Curso sin título",
      precio: Number(item.precioUnitario || curso.precio || 0),
      imagen,
      curso,
    };
  }, []);

  const limpiarEstadoCarrito = useCallback(() => {
    setCarrito([]);
    setCarritoBackend(null);
    setMensajeCarrito("");

    Object.keys(localStorage)
      .filter((key) => key.toLowerCase().includes("carrito"))
      .forEach((key) => localStorage.removeItem(key));
  }, []);

  const cargarCarritoBackend = useCallback(async () => {
    if (!haySesion()) {
      limpiarEstadoCarrito();
      setCargandoCarrito(false);
      return null;
    }

    try {
      setCargandoCarrito(true);

      const { data } = await api.post("/api/carrito");

      setCarritoBackend(data);

      const itemsNormalizados = Array.isArray(data.items)
        ? data.items.map((item) => normalizarItem(item)).filter(Boolean)
        : [];

      setCarrito(itemsNormalizados);

      return data;
    } catch (error) {
      console.error("Error al cargar carrito:", error);
      limpiarEstadoCarrito();
      return null;
    } finally {
      setCargandoCarrito(false);
    }
  }, [haySesion, limpiarEstadoCarrito, normalizarItem]);

  useEffect(() => {
    cargarCarritoBackend();

    const syncSesion = () => {
      cargarCarritoBackend();
    };

    window.addEventListener("storage", syncSesion);

    return () => {
      window.removeEventListener("storage", syncSesion);
    };
  }, [cargarCarritoBackend]);

  const recargarCarrito = () => {
    cargarCarritoBackend();
  };

  const mostrarMensaje = (texto) => {
    setMensajeCarrito(texto);

    setTimeout(() => {
      setMensajeCarrito("");
    }, 2200);
  };

  const estaEnCarrito = (id) => {
    return carrito.some((item) => String(item.id) === String(id));
  };

  const crearOCargarCarritoActivo = async () => {
    const { data } = await api.post("/api/carrito");

    setCarritoBackend(data);

    const itemsNormalizados = Array.isArray(data.items)
      ? data.items.map((item) => normalizarItem(item)).filter(Boolean)
      : [];

    setCarrito(itemsNormalizados);

    return data;
  };

  const agregarAlCarrito = async (producto) => {
    if (!haySesion()) {
      mostrarMensaje("Para agregar cursos al carrito tenés que iniciar sesión");
      return false;
    }

    const idCurso = producto?._id || producto?.id;

    if (!idCurso) {
      console.error("El producto no tiene id ni _id:", producto);
      return false;
    }

    if (estaEnCarrito(idCurso)) {
      mostrarMensaje("Este curso ya está en el carrito");
      return false;
    }

    try {
      let carritoActual = carritoBackend;

      if (!carritoActual?._id) {
        carritoActual = await crearOCargarCarritoActivo();
      }

      if (!carritoActual?._id) {
        mostrarMensaje("No se pudo obtener el carrito");
        return false;
      }

      const { data } = await api.post(
        `/api/carrito/${carritoActual._id}/item`,
        {
          idCurso,
        },
      );

      setCarritoBackend(data);

      const itemsNormalizados = Array.isArray(data.items)
        ? data.items.map((item) => normalizarItem(item)).filter(Boolean)
        : [];

      setCarrito(itemsNormalizados);

      mostrarMensaje("Curso agregado al carrito");
      return true;
    } catch (error) {
      console.error("Error al agregar al carrito:", error);

      const mensaje =
        error.response?.data?.error ||
        error.response?.data?.mensaje ||
        "No se pudo agregar el curso al carrito";

      if (mensaje === "Carrito no activo") {
        try {
          limpiarEstadoCarrito();

          const nuevoCarrito = await crearOCargarCarritoActivo();

          const { data } = await api.post(
            `/api/carrito/${nuevoCarrito._id}/item`,
            {
              idCurso,
            },
          );

          setCarritoBackend(data);

          const itemsNormalizados = Array.isArray(data.items)
            ? data.items.map((item) => normalizarItem(item)).filter(Boolean)
            : [];

          setCarrito(itemsNormalizados);

          mostrarMensaje("Curso agregado al carrito");
          return true;
        } catch (nuevoError) {
          console.error("Error al crear un nuevo carrito:", nuevoError);

          mostrarMensaje(
            nuevoError.response?.data?.error ||
              nuevoError.response?.data?.mensaje ||
              "No se pudo crear un nuevo carrito",
          );

          return false;
        }
      }

      mostrarMensaje(mensaje);
      return false;
    }
  };

  const eliminarDelCarrito = async (id) => {
    if (!carritoBackend?._id) return;

    const item = carrito.find(
      (producto) =>
        String(producto.id) === String(id) ||
        String(producto.itemId) === String(id),
    );

    const itemId = item?.itemId || id;

    try {
      const { data } = await api.delete(
        `/api/carrito/${carritoBackend._id}/item/${itemId}`,
      );

      setCarritoBackend(data);

      const itemsNormalizados = Array.isArray(data.items)
        ? data.items.map((item) => normalizarItem(item)).filter(Boolean)
        : [];

      setCarrito(itemsNormalizados);
    } catch (error) {
      console.error("Error al eliminar item del carrito:", error);

      const mensaje =
        error.response?.data?.error ||
        error.response?.data?.mensaje ||
        "No se pudo eliminar el curso";

      if (mensaje === "Carrito no activo") {
        limpiarEstadoCarrito();
        mostrarMensaje("El carrito anterior ya no estaba activo");
        return;
      }

      mostrarMensaje(mensaje);
    }
  };

  const vaciarCarrito = async () => {
    if (!carritoBackend?._id) {
      limpiarEstadoCarrito();
      return;
    }

    try {
      await api.delete(`/api/carrito/${carritoBackend._id}/vaciar`);

      limpiarEstadoCarrito();
    } catch (error) {
      console.error("Error al vaciar carrito:", error);

      const mensaje =
        error.response?.data?.error ||
        error.response?.data?.mensaje ||
        "No se pudo vaciar el carrito";

      if (mensaje === "Carrito no activo") {
        limpiarEstadoCarrito();
        mostrarMensaje("El carrito anterior ya no estaba activo");
        return;
      }

      mostrarMensaje(mensaje);
    }
  };

  const limpiarCarritoVisual = () => {
    limpiarEstadoCarrito();
  };

  const cantidadTotal = useMemo(() => carrito.length, [carrito]);

  const subtotal = useMemo(() => {
    return carrito.reduce((acc, item) => acc + Number(item.precio || 0), 0);
  }, [carrito]);

  return (
    <CarritoContext.Provider
      value={{
        carrito,
        carritoBackend,
        mensajeCarrito,
        cantidadTotal,
        subtotal,
        cargandoCarrito,
        agregarAlCarrito,
        eliminarDelCarrito,
        vaciarCarrito,
        limpiarCarritoVisual,
        recargarCarrito,
        estaEnCarrito,
      }}
    >
      {children}
    </CarritoContext.Provider>
  );
}
