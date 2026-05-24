import { jsPDF } from "jspdf";

function obtenerNombreAlumno() {
  const usuarioGuardado = localStorage.getItem("usuario");

  if (!usuarioGuardado) return "Alumno";

  try {
    const usuario = JSON.parse(usuarioGuardado);

    const nombreCompleto = `${usuario.nombre || ""} ${
      usuario.apellido || ""
    }`.trim();

    return nombreCompleto || usuario.email || "Alumno";
  } catch {
    return "Alumno";
  }
}

function limpiarNombreArchivo(texto) {
  return String(texto || "certificado")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function generarCertificado(acceso) {
  const curso = acceso?.curso;

  if (!curso || (acceso?.progreso || 0) < 100) return;

  const alumno = obtenerNombreAlumno();
  const tituloCurso = curso.titulo || "Curso completado";

  const fecha = new Date().toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const ancho = doc.internal.pageSize.getWidth();
  const alto = doc.internal.pageSize.getHeight();

  // Fondo principal
  doc.setFillColor(6, 13, 44);
  doc.rect(0, 0, ancho, alto, "F");

  // Banda superior
  doc.setFillColor(17, 24, 92);
  doc.rect(0, 0, ancho, 46, "F");

  // Detalles diagonales superiores
  doc.setFillColor(30, 80, 200);
  doc.triangle(0, 0, 50, 0, 0, 50, "F");

  doc.setFillColor(110, 52, 220);
  doc.triangle(ancho, 0, ancho - 50, 0, ancho, 50, "F");

  // Cuerpo del certificado
  doc.setFillColor(8, 20, 66);
  doc.roundedRect(18, 24, ancho - 36, alto - 42, 8, 8, "F");

  // Bordes principales
  doc.setDrawColor(56, 189, 248);
  doc.setLineWidth(1.4);
  doc.roundedRect(14, 14, ancho - 28, alto - 28, 7, 7);

  doc.setDrawColor(168, 85, 247);
  doc.setLineWidth(0.55);
  doc.roundedRect(23, 31, ancho - 46, alto - 56, 5, 5);

  // Marca superior
  doc.setTextColor(56, 189, 248);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("MUNDO DEV", ancho / 2, 38, { align: "center" });

  doc.setDrawColor(56, 189, 248);
  doc.setLineWidth(0.4);
  doc.line(96, 45, ancho - 96, 45);

  // Sello de aprobación
  doc.setFillColor(34, 197, 94);
  doc.circle(48, 54, 13, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("100%", 48, 52, { align: "center" });

  doc.setFontSize(5.8);
  doc.text("COMPLETO", 48, 58, { align: "center" });

  // Título principal
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(31);
  doc.text("Certificado de finalización", ancho / 2, 68, {
    align: "center",
  });

  // Texto introductorio
  doc.setTextColor(185, 196, 238);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text("Este certificado acredita que", ancho / 2, 88, {
    align: "center",
  });

  // Nombre del alumno
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.text(alumno, ancho / 2, 107, { align: "center" });

  doc.setDrawColor(124, 231, 184);
  doc.setLineWidth(0.45);
  doc.line(88, 114, ancho - 88, 114);

  // Descripción del curso
  doc.setTextColor(185, 196, 238);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text("ha completado satisfactoriamente el curso", ancho / 2, 126, {
    align: "center",
  });

  // Nombre del curso
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text(tituloCurso, ancho / 2, 143, { align: "center" });

  // Fecha
  doc.setFillColor(14, 165, 233);
  doc.roundedRect(ancho / 2 - 47, 154, 94, 13, 4, 4, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(`Emitido el ${fecha}`, ancho / 2, 162.5, {
    align: "center",
  });

  // Firma izquierda
  doc.setDrawColor(124, 231, 184);
  doc.setLineWidth(0.45);
  doc.line(52, 176, 118, 176);

  doc.setTextColor(185, 196, 238);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text("Dirección académica", 85, 183, { align: "center" });

  // Firma derecha
  doc.setDrawColor(168, 85, 247);
  doc.setLineWidth(0.45);
  doc.line(ancho - 118, 176, ancho - 52, 176);

  doc.setTextColor(185, 196, 238);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text("Mundo Dev · Plataforma educativa", ancho - 85, 183, {
    align: "center",
  });

  // Código de certificado
  const codigoCertificado = `MD-${String(curso._id || acceso._id || Date.now())
    .slice(-8)
    .toUpperCase()}`;

  doc.setTextColor(125, 145, 190);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Código de certificado: ${codigoCertificado}`, ancho / 2, 195, {
    align: "center",
  });

  const nombreArchivo = limpiarNombreArchivo(`certificado-${tituloCurso}`);

  doc.save(`${nombreArchivo || "certificado"}.pdf`);
}
