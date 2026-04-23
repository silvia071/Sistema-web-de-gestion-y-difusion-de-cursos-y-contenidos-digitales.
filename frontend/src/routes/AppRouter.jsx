import { Routes, Route } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import AuthLayout from "../layouts/AuthLayout";
import ProtectedRoute from "./ProtectedRoute";

import Home from "../pages/Home";
import Login from "../pages/Login";
import Registro from "../pages/Registro";
import Cursos from "../pages/Cursos";
import DetalleCurso from "../pages/DetalleCurso";
import Blog from "../pages/Blog";
import BlogDetalle from "../pages/BlogDetalle";
import Perfil from "../pages/Perfil";
import Carrito from "../pages/Carrito";
import Categorias from "../pages/Categorias";
import Nosotros from "../pages/Nosotros";
import Contactos from "../pages/Contactos";

function AppRouter() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/cursos" element={<Cursos />} />
        <Route path="/cursos/:id" element={<DetalleCurso />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:id" element={<BlogDetalle />} />
        <Route path="/categorias" element={<Categorias />} />
        <Route path="/nosotros" element={<Nosotros />} />
        <Route path="/contactos" element={<Contactos />} />
      </Route>

      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
      </Route>

      <Route element={<MainLayout />}>
        <Route
          path="/perfil"
          element={
            <ProtectedRoute>
              <Perfil />
            </ProtectedRoute>
          }
        />
        <Route
          path="/carrito"
          element={
            <ProtectedRoute>
              <Carrito />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}

export default AppRouter;
