import { Routes, Route } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import AuthLayout from "../layouts/AuthLayout";
import ProtectedRoute from "./ProtectedRoute";
import Admin from "../pages/Admin";

import Home from "../pages/Home";
import Login from "../pages/Login";
import Registro from "../pages/Registro";
import Cursos from "../pages/Cursos";
import DetalleCurso from "../pages/DetalleCurso";
import Blog from "../pages/Blog";
import BlogDetalle from "../pages/BlogDetalle";
import Perfil from "../pages/Perfil";
import Carrito from "../pages/Carrito";

import Nosotros from "../pages/Nosotros";
import Contactos from "../pages/Contactos";
import MisCursos from "../pages/MisCursos";
import AprenderCurso from "../pages/AprenderCurso";
import CursoPlayer from "../pages/CursoPlayer";
import AdminCursos from "../pages/AdminCursos";

function AppRouter() {
  return (
    <Routes>
      {/* RUTAS PUBLICAS */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/cursos" element={<Cursos />} />
        <Route path="/cursos/:id" element={<DetalleCurso />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:id" element={<BlogDetalle />} />
   
        <Route path="/nosotros" element={<Nosotros />} />
        <Route path="/contactos" element={<Contactos />} />
      </Route>

      {/* AUTH */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
      </Route>

      {/* PRIVADAS */}
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

        <Route
          path="/mis-cursos"
          element={
            <ProtectedRoute>
              <MisCursos />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly={true}>
              <Admin />
            </ProtectedRoute>
          }
        />
        <Route
          path="/curso/:id/aprender"
          element={
            <ProtectedRoute>
              <AprenderCurso />
            </ProtectedRoute>
          }
        />
        <Route
          path="/curso/:id"
          element={
            <ProtectedRoute>
              <CursoPlayer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/cursos"
          element={
            <ProtectedRoute adminOnly={true}>
              <AdminCursos />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}

export default AppRouter;
