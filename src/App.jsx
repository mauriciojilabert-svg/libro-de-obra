import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  Building2, MapPin, TrendingUp, Search, Plus, X, ChevronLeft, ChevronRight,
  CircleCheck, CircleX, TriangleAlert, ClipboardList, HardHat,
  Lock, LogOut, BookMarked, Loader2, Home, ShieldCheck, ShieldAlert,
  Sun, Moon, Camera, Image, Save, Edit3, Eye, Fingerprint, KeyRound,
  FileSignature, ScrollText, MessageSquare, FileText,
} from "lucide-react";

/* ================================================================== */
/*  ERROR BOUNDARY                                                     */
/* ================================================================== */
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error("ErrorBoundary:", error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center", background: "var(--bg-canvas)", color: "var(--text-main)" }}>
          <TriangleAlert size={48} style={{ color: "var(--color-danger)", marginBottom: 16 }} />
          <h1 className="font-display" style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Algo salió mal</h1>
          <pre style={{ fontSize: 11, background: "rgba(0,0,0,0.05)", padding: 16, borderRadius: 12, maxWidth: "100%", overflow: "auto", textAlign: "left", marginBottom: 20 }}>{this.state.error?.toString()}</pre>
          <button onClick={() => window.location.reload()} className="btn-tap btn-accent" style={{ padding: "12px 28px", borderRadius: 12, border: "none", fontWeight: 600 }}>Recargar</button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ================================================================== */
/*  CONFIGURACIÓN DE DOMINIO — OBRA PÚBLICA (MOP)                      */
/* ================================================================== */

/** Libros paralelos del contrato. Cada uno tiene su propio correlativo
 *  y un único rol habilitado para escribir en él. Todos los perfiles
 *  leen la totalidad de los libros. */
const LIBROS = {
  maestro: { clave: "maestro", nombre: "Libro de Obras Maestro", corto: "Maestro", escribe: "Inspector Fiscal", Icon: ScrollText },
  comunicaciones: { clave: "comunicaciones", nombre: "Libro de Comunicaciones", corto: "Comunicaciones", escribe: "Administrador de Contrato", Icon: MessageSquare },
  prevencion: { clave: "prevencion", nombre: "Libro de Prevención de Riesgos", corto: "Prevención", escribe: "Prevencionista de Riesgos", Icon: HardHat },
};

const CATEGORIAS = {
  "Instrucción Inspector Fiscal": { corto: "Instrucción", color: "var(--color-info)", bg: "var(--color-info-bg)", Icon: ClipboardList },
  "Recepción de Partida": { corto: "Recepción", color: "var(--color-success)", bg: "var(--color-success-bg)", Icon: CircleCheck },
  "Incidente de Obra": { corto: "Incidente", color: "var(--color-danger)", bg: "var(--color-danger-bg)", Icon: TriangleAlert },
  "Avance Diario": { corto: "Avance", color: "#2563EB", bg: "rgba(37,99,235,0.12)", Icon: TrendingUp },
  "Seguridad y Medio Ambiente": { corto: "Seguridad", color: "var(--color-warning)", bg: "var(--color-warning-bg)", Icon: HardHat },
};

/** Categorías sobre las que el Inspector Fiscal puede pronunciarse. */
const CATEGORIAS_RESOLUBLES = ["Recepción de Partida", "Incidente de Obra", "Seguridad y Medio Ambiente"];

const ROLES = {
  inspector_fiscal: {
    clave: "inspector_fiscal",
    label: "Inspector Fiscal",
    corto: "Inspector Fiscal",
    organismo: "MOP · Dirección de Vialidad",
    nombre: "Cristián Manríquez",
    escribeEn: ["maestro"],
    puedeResolver: true,
    categorias: ["Instrucción Inspector Fiscal", "Recepción de Partida", "Incidente de Obra"],
  },
  admin_contrato: {
    clave: "admin_contrato",
    label: "Administrador de Contrato",
    corto: "Adm. Contrato",
    organismo: "Empresa Contratista",
    nombre: "Mauricio Cáceres",
    escribeEn: ["comunicaciones"],
    puedeResolver: false,
    categorias: ["Avance Diario", "Recepción de Partida", "Incidente de Obra"],
  },
  prevencionista: {
    clave: "prevencionista",
    label: "Prevencionista de Riesgos",
    corto: "Prevencionista",
    organismo: "Empresa Contratista",
    nombre: "Luciano Sepúlveda",
    escribeEn: ["prevencion"],
    puedeResolver: false,
    categorias: ["Seguridad y Medio Ambiente", "Incidente de Obra"],
  },
};

const CREDENCIALES = {
  cristian: { clave: "123", rol: "inspector_fiscal" },
  mauricio: { clave: "123", rol: "admin_contrato" },
  prevencion: { clave: "123", rol: "prevencionista" },
};

const CONTRATOS = [
  {
    id: 1, codigo: "MOP-VIALIDAD-0842/2025",
    nombre: "Mejoramiento Ruta 5 Sur, sector Molina – San Rafael",
    ubicacion: "Ruta 5 Sur, dm 4.000 al dm 6.200 · Región del Maule",
    contratista: "Constructora Andes Sur S.A.",
    monto: "UF 184.500", plazo: "540 días corridos", avance: 47,
  },
  {
    id: 2, codigo: "MOP-VIALIDAD-0317/2025",
    nombre: "Reposición Puente Toltén",
    ubicacion: "Ruta S-40, comuna de Teodoro Schmidt · Región de La Araucanía",
    contratista: "Ingeniería y Construcción Biobío Ltda.",
    monto: "UF 96.200", plazo: "420 días corridos", avance: 23,
  },
  {
    id: 3, codigo: "MOP-ARQ-0158/2024",
    nombre: "Construcción Edificio Consistorial de Puerto Aysén",
    ubicacion: "Calle Sargento Aldea 480, Puerto Aysén · Región de Aysén",
    contratista: "Constructora Patagonia Austral SpA",
    monto: "UF 142.800", plazo: "600 días corridos", avance: 68,
  },
  {
    id: 4, codigo: "MOP-VIALIDAD-0521/2024",
    nombre: "Conservación Global Camino Porvenir – Cerro Sombrero",
    ubicacion: "Ruta Y-71, Tierra del Fuego · Región de Magallanes",
    contratista: "Obras Civiles Magallanes S.A.",
    monto: "UF 78.400", plazo: "365 días corridos", avance: 81,
  },
];

const IF_NOMBRE = ROLES.inspector_fiscal.nombre;
const AC_NOMBRE = ROLES.admin_contrato.nombre;
const PR_NOMBRE = ROLES.prevencionista.nombre;

function base(o) {
  return { fotos: [], geo: null, refFolio: null, resolucion: null, firma: null, firmadoEn: null, ...o };
}

const FOLIOS_DEMO = {
  1: [
    base({
      id: 1101, numero: 1, libro: "maestro", categoria: "Instrucción Inspector Fiscal",
      titulo: "Reperfilado de subrasante entre dm 4.200 y dm 4.850",
      cuerpo: "Se instruye a la empresa contratista ejecutar el reperfilado y recompactación de la subrasante en el tramo comprendido entre dm 4.200 y dm 4.850, por presentar razón de soporte CBR inferior al 20% exigido en las Especificaciones Técnicas Especiales del contrato. Deberá acreditarse el cumplimiento mediante nuevos ensayos de laboratorio antes de autorizar la colocación de subbase granular. Plazo: 5 días corridos contados desde la presente anotación.",
      autorRol: "inspector_fiscal", autorNombre: IF_NOMBRE,
      creadoEn: "2026-08-11T09:20:00", estado: "firmado", firmadoEn: "2026-08-11T09:34:00",
      firma: { codigo: "MOP-2026-001-QA" },
    }),
    base({
      id: 1102, numero: 2, libro: "maestro", categoria: "Instrucción Inspector Fiscal",
      titulo: "Reforzamiento de señalización en desvío de tránsito, dm 5.100",
      cuerpo: "Constatado en visita a terreno que el desvío provisorio habilitado en dm 5.100 no cuenta con la totalidad de la señalización exigida, se instruye reponer los delineadores verticales faltantes, instalar señalética reflectante en ambos accesos y mantener personal banderero en horario de 08:00 a 18:00 hrs. mientras dure la faena. La empresa deberá informar el cumplimiento en el Libro de Comunicaciones.",
      autorRol: "inspector_fiscal", autorNombre: IF_NOMBRE,
      creadoEn: "2026-08-24T16:05:00", estado: "firmado", firmadoEn: "2026-08-24T16:12:00",
      firma: { codigo: "MOP-2026-002-LT" },
    }),
    base({
      id: 1103, numero: 3, libro: "maestro", categoria: "Incidente de Obra",
      titulo: "Paralización parcial de faena por condiciones climáticas",
      cuerpo: "Se deja constancia que, producto de precipitaciones superiores a 25 mm en 12 horas, se paralizan las faenas de colocación de carpeta asfáltica entre dm 4.900 y dm 5.400. Se instruye a la empresa contratista adoptar medidas de protección de la subbase expuesta y reponer el cierre perimetral desplazado por escorrentía en el acceso sur.",
      autorRol: "inspector_fiscal", autorNombre: IF_NOMBRE,
      creadoEn: "2026-09-08T11:40:00", estado: "borrador",
    }),
    base({
      id: 1201, numero: 1, libro: "comunicaciones", categoria: "Avance Diario",
      titulo: "Colocación de subbase granular dm 4.200 – dm 4.850",
      cuerpo: "Se informa el término de la colocación y compactación de subbase granular en el tramo indicado, en espesor de 0,20 m compactado. Se ejecutaron ensayos de densidad in situ N° 114 al 119 mediante método de cono de arena, obteniéndose un promedio de 96,4% de la densidad máxima compactada seca del Proctor Modificado, superior al 95% exigido.",
      autorRol: "admin_contrato", autorNombre: AC_NOMBRE,
      creadoEn: "2026-08-19T18:10:00", estado: "firmado", firmadoEn: "2026-08-19T18:22:00",
      firma: { codigo: "MOP-2026-001-BN" },
    }),
    base({
      id: 1202, numero: 2, libro: "comunicaciones", categoria: "Recepción de Partida",
      titulo: "Solicitud de recepción de partida: subbase granular dm 4.200 – dm 4.850",
      cuerpo: "Se solicita a la Inspección Fiscal la recepción de la partida de subbase granular ejecutada entre dm 4.200 y dm 4.850, adjuntándose los certificados del laboratorio de autocontrol y el registro topográfico de espesores. La partida fue ejecutada conforme a la sección 5.301 del Manual de Carreteras, Volumen 5.",
      autorRol: "admin_contrato", autorNombre: AC_NOMBRE,
      creadoEn: "2026-08-20T09:05:00", estado: "firmado", firmadoEn: "2026-08-20T09:11:00",
      firma: { codigo: "MOP-2026-002-CD" },
      resolucion: {
        resultado: "Aprobado",
        observacion: "Se recibe conforme la partida. Los ensayos de densidad y el registro de espesores cumplen lo exigido. Se autoriza el inicio de la colocación de base granular.",
        porNombre: IF_NOMBRE, porRol: "inspector_fiscal", fecha: "2026-08-21T10:30:00",
      },
    }),
    base({
      id: 1203, numero: 3, libro: "comunicaciones", categoria: "Avance Diario",
      titulo: "Hormigonado de losa de aproximación norte, obra de arte dm 5.680",
      cuerpo: "Se informa la ejecución del hormigonado de la losa de aproximación norte de la obra de arte ubicada en dm 5.680, con hormigón grado H-30, tamaño máximo nominal 20 mm y cono de 8 cm. Volumen colocado: 34,5 m³. Se extrajeron seis probetas cilíndricas para ensayo a compresión a 7 y 28 días conforme a NCh 1017. Curado mediante membrana de curado y riego durante 7 días.",
      autorRol: "admin_contrato", autorNombre: AC_NOMBRE,
      creadoEn: "2026-09-02T17:45:00", estado: "firmado", firmadoEn: "2026-09-02T17:58:00",
      firma: { codigo: "MOP-2026-003-EF" },
    }),
    base({
      id: 1204, numero: 4, libro: "comunicaciones", categoria: "Incidente de Obra",
      titulo: "Corte no programado de tránsito por volcamiento de camión tolva",
      cuerpo: "Siendo las 14:20 hrs. se produce el volcamiento de un camión tolva de empresa subcontratista en el acceso norte del desvío provisorio de dm 5.100, sin personal lesionado. Se corta el tránsito en ambos sentidos durante 50 minutos hasta el retiro del vehículo con grúa. Se dio aviso inmediato a Carabineros y a la Inspección Fiscal. Se adjunta registro fotográfico del despeje de la calzada.",
      autorRol: "admin_contrato", autorNombre: AC_NOMBRE,
      creadoEn: "2026-09-05T15:30:00", estado: "firmado", firmadoEn: "2026-09-05T15:44:00",
      firma: { codigo: "MOP-2026-004-GH" },
    }),
    base({
      id: 1301, numero: 1, libro: "prevencion", categoria: "Seguridad y Medio Ambiente",
      titulo: "Charla diaria de seguridad y verificación de elementos de protección personal",
      cuerpo: "Se realiza charla de cinco minutos con una dotación de 34 trabajadores, abordando el riesgo de atropello en faenas con tránsito habilitado. Se verifica el uso de casco, chaleco reflectante y calzado de seguridad en la totalidad del personal en terreno. Se detectan dos trabajadores sin protección auditiva en el sector de planta de asfalto, situación corregida en el acto.",
      autorRol: "prevencionista", autorNombre: PR_NOMBRE,
      creadoEn: "2026-09-03T08:30:00", estado: "firmado", firmadoEn: "2026-09-03T08:40:00",
      firma: { codigo: "MOP-2026-001-JK" },
    }),
    base({
      id: 1302, numero: 2, libro: "prevencion", categoria: "Incidente de Obra",
      titulo: "Cuasi accidente por maquinaria en zona de desvío, dm 5.120",
      cuerpo: "Se registra cuasi accidente en dm 5.120: retroexcavadora inicia giro de superestructura sin verificar punto ciego, encontrándose un trabajador a aproximadamente 3 metros del radio de giro. No se registran lesionados. Se retira al operador de la faena por la jornada, se refuerza el procedimiento de trabajo seguro y se instruye la verificación de alarma de retroceso audible en toda la maquinaria del contrato.",
      autorRol: "prevencionista", autorNombre: PR_NOMBRE,
      creadoEn: "2026-09-06T12:15:00", estado: "firmado", firmadoEn: "2026-09-06T12:29:00",
      firma: { codigo: "MOP-2026-002-MN" },
    }),
  ],
  2: [
    base({
      id: 2101, numero: 1, libro: "maestro", categoria: "Instrucción Inspector Fiscal",
      titulo: "Entrega de terreno y autorización de instalación de faena",
      cuerpo: "Se deja constancia de la entrega de terreno del contrato en el sector de emplazamiento del Puente Toltén, ribera norte y sur. Se autoriza la instalación de faena en el área indicada en el plano de instalación aprobado, debiendo respetarse la franja de protección de vegetación ribereña definida en la Resolución de Calificación Ambiental.",
      autorRol: "inspector_fiscal", autorNombre: IF_NOMBRE,
      creadoEn: "2026-07-15T10:00:00", estado: "firmado", firmadoEn: "2026-07-15T10:14:00",
      firma: { codigo: "MOP-2026-001-PQ" },
    }),
    base({
      id: 2201, numero: 1, libro: "comunicaciones", categoria: "Avance Diario",
      titulo: "Hinca de pilotes de fundación, cepa N° 2",
      cuerpo: "Se informa el término de la hinca de los cuatro pilotes de acero de la cepa N° 2, con penetración final entre 18,4 y 19,1 metros bajo el nivel de socavación de diseño. Se adjunta registro de golpes por metro y control de verticalidad. Rechazo alcanzado conforme a lo previsto por el proyectista.",
      autorRol: "admin_contrato", autorNombre: AC_NOMBRE,
      creadoEn: "2026-08-28T19:00:00", estado: "firmado", firmadoEn: "2026-08-28T19:20:00",
      firma: { codigo: "MOP-2026-001-RS" },
    }),
    base({
      id: 2202, numero: 2, libro: "comunicaciones", categoria: "Recepción de Partida",
      titulo: "Solicitud de recepción de enfierradura de cepa N° 2",
      cuerpo: "Se solicita la recepción de la enfierradura del coronamiento de la cepa N° 2, ejecutada conforme al plano estructural EST-12 revisión C. Se verificó diámetro, cuantía, traslapos y recubrimiento mínimo de 5 cm. Se solicita autorización para hormigonar dentro de las próximas 48 horas.",
      autorRol: "admin_contrato", autorNombre: AC_NOMBRE,
      creadoEn: "2026-09-07T11:20:00", estado: "firmado", firmadoEn: "2026-09-07T11:33:00",
      firma: { codigo: "MOP-2026-002-TU" },
    }),
    base({
      id: 2301, numero: 1, libro: "prevencion", categoria: "Seguridad y Medio Ambiente",
      titulo: "Verificación de plan de trabajo sobre agua y elementos de rescate",
      cuerpo: "Se verifica la disponibilidad de chalecos salvavidas para la totalidad del personal que ejecuta faenas sobre el cauce, la presencia de bote de rescate operativo con motor fuera de borda y la instalación de líneas de vida en las plataformas de trabajo de ambas riberas.",
      autorRol: "prevencionista", autorNombre: PR_NOMBRE,
      creadoEn: "2026-09-01T09:10:00", estado: "firmado", firmadoEn: "2026-09-01T09:18:00",
      firma: { codigo: "MOP-2026-001-VW" },
    }),
  ],
  3: [
    base({
      id: 3101, numero: 1, libro: "maestro", categoria: "Instrucción Inspector Fiscal",
      titulo: "Observación a terminaciones de tabiquería en segundo nivel",
      cuerpo: "Se instruye corregir el aplome de la tabiquería de volcanita del segundo nivel, eje D entre ejes 4 y 7, por presentar desviaciones superiores a la tolerancia de 3 mm por metro establecida en las especificaciones técnicas. La corrección deberá ejecutarse antes de la instalación del cielo falso.",
      autorRol: "inspector_fiscal", autorNombre: IF_NOMBRE,
      creadoEn: "2026-08-30T15:00:00", estado: "firmado", firmadoEn: "2026-08-30T15:09:00",
      firma: { codigo: "MOP-2026-001-XY" },
    }),
    base({
      id: 3201, numero: 1, libro: "comunicaciones", categoria: "Avance Diario",
      titulo: "Montaje de estructura de techumbre, sector oriente",
      cuerpo: "Se informa el término del montaje de cerchas metálicas del sector oriente del edificio, con verificación de torque en uniones apernadas y aplicación de pintura anticorrosiva de retoque en soldaduras de terreno. Avance físico acumulado de la partida: 72%.",
      autorRol: "admin_contrato", autorNombre: AC_NOMBRE,
      creadoEn: "2026-09-04T18:30:00", estado: "firmado", firmadoEn: "2026-09-04T18:41:00",
      firma: { codigo: "MOP-2026-001-ZA" },
    }),
    base({
      id: 3301, numero: 1, libro: "prevencion", categoria: "Seguridad y Medio Ambiente",
      titulo: "Trabajo en altura: verificación de andamios y arnés",
      cuerpo: "Se verifica la certificación de los andamios modulares del sector oriente, la instalación de rodapiés y barandas en todas las plataformas y el uso de arnés de seguridad con doble cola de vida en el personal que ejecuta montaje de techumbre.",
      autorRol: "prevencionista", autorNombre: PR_NOMBRE,
      creadoEn: "2026-09-04T08:45:00", estado: "firmado", firmadoEn: "2026-09-04T08:52:00",
      firma: { codigo: "MOP-2026-001-BC" },
    }),
  ],
  4: [
    base({
      id: 4101, numero: 1, libro: "maestro", categoria: "Instrucción Inspector Fiscal",
      titulo: "Programa de conservación rutinaria para período invernal",
      cuerpo: "Se instruye a la empresa contratista mantener operativo el equipo de despeje de nieve durante todo el período invernal, con disponibilidad de 24 horas y reporte diario del estado de transitabilidad de la ruta entre Porvenir y Cerro Sombrero. Ante cierre de la ruta deberá informarse de inmediato a la Inspección Fiscal por el medio más expedito.",
      autorRol: "inspector_fiscal", autorNombre: IF_NOMBRE,
      creadoEn: "2026-06-02T11:00:00", estado: "firmado", firmadoEn: "2026-06-02T11:13:00",
      firma: { codigo: "MOP-2026-001-DE" },
    }),
    base({
      id: 4201, numero: 1, libro: "comunicaciones", categoria: "Avance Diario",
      titulo: "Perfilado y reposición de material granular, km 28 al km 34",
      cuerpo: "Se informa la ejecución del perfilado de la calzada y reposición de material granular estabilizado en el tramo indicado, con aporte de 620 m³ de material proveniente del pozo autorizado. Se ejecutó riego de compactación pese a las bajas temperaturas registradas en la jornada.",
      autorRol: "admin_contrato", autorNombre: AC_NOMBRE,
      creadoEn: "2026-08-14T17:00:00", estado: "firmado", firmadoEn: "2026-08-14T17:26:00",
      firma: { codigo: "MOP-2026-001-FG" },
    }),
  ],
};

/* ================================================================== */
/*  SELLADO E INTEGRIDAD                                               */
/* ================================================================== */

/** Representación canónica del contenido de un folio. Sólo incluye lo que
 *  queda sellado: modificar cualquiera de estos campos rompe la cadena.
 *  La resolución del Inspector Fiscal NO forma parte del sello, porque es
 *  un acto posterior y separado que se adosa al folio sin alterarlo. */
function canonico(f) {
  return JSON.stringify({
    n: f.numero, lib: f.libro, cat: f.categoria,
    tit: f.titulo, cue: f.cuerpo,
    rol: f.autorRol, aut: f.autorNombre,
    cre: f.creadoEn, fir: f.firmadoEn,
    fot: (f.fotos || []).map((p) => p.nombre || ""),
  });
}

/** SHA-256 vía Web Crypto. En contextos no seguros (http en red local,
 *  típico al probar desde el celular) crypto.subtle no existe: se usa un
 *  resumen no criptográfico para que la demostración siga funcionando. */
async function digestHex(texto) {
  try {
    if (globalThis.crypto && globalThis.crypto.subtle) {
      const datos = new TextEncoder().encode(texto);
      const buf = await globalThis.crypto.subtle.digest("SHA-256", datos);
      return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
    }
  } catch (e) {
    console.warn("crypto.subtle no disponible, se usa resumen alternativo", e);
  }
  return resumenAlternativo(texto);
}

function resumenAlternativo(texto) {
  let a = 0x811c9dc5, b = 0x01000193, c = 0x85ebca6b, d = 0xc2b2ae35;
  for (let i = 0; i < texto.length; i++) {
    const ch = texto.charCodeAt(i);
    a = Math.imul(a ^ ch, 16777619);
    b = Math.imul(b ^ (ch + i), 2246822519);
    c = Math.imul(c ^ (ch * 31), 3266489917);
    d = Math.imul(d ^ (ch + 7), 668265263);
  }
  const h = (n) => (n >>> 0).toString(16).padStart(8, "0");
  return (h(a) + h(b) + h(c) + h(d)).repeat(2);
}

function cadenaDe(folios, libro) {
  return folios
    .filter((f) => f.libro === libro && f.estado === "firmado")
    .sort((x, y) => x.numero - y.numero);
}

/** Calcula la cadena de sellos de todos los libros de un contrato. */
async function sellarCadenas(folios) {
  const salida = folios.map((f) => ({ ...f }));
  for (const clave of Object.keys(LIBROS)) {
    let previo = "GENESIS";
    for (const f of cadenaDe(salida, clave)) {
      const hash = await digestHex(canonico(f) + "|" + previo);
      f.firma = { ...(f.firma || {}), hash, hashAnterior: previo, metodo: "FEA simulada · PIN + biometría" };
      previo = hash;
    }
  }
  return salida;
}

/** Recorre la cadena de un libro y reporta el estado de cada folio. */
async function verificarLibro(folios, libro) {
  const resultado = [];
  let previo = "GENESIS";
  let rota = false;
  for (const f of cadenaDe(folios, libro)) {
    const esperado = await digestHex(canonico(f) + "|" + previo);
    let estado;
    if (rota) estado = "no_verificable";
    else if (esperado === f.firma?.hash && previo === f.firma?.hashAnterior) estado = "ok";
    else { estado = "alterado"; rota = true; }
    resultado.push({ id: f.id, numero: f.numero, titulo: f.titulo, estado, esperado, almacenado: f.firma?.hash });
    previo = f.firma?.hash || esperado;
  }
  return resultado;
}

function letrasAleatorias() {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  return abc[Math.floor(Math.random() * abc.length)] + abc[Math.floor(Math.random() * abc.length)];
}

/* ================================================================== */
/*  SERVICIOS (reemplazables 1:1 por llamadas a la API real)           */
/* ================================================================== */
const demora = (ms = 400) => new Promise((r) => setTimeout(r, ms));

const authService = {
  async login(usuario, clave) {
    await demora();
    const cuenta = CREDENCIALES[String(usuario).trim().toLowerCase()];
    if (!cuenta || cuenta.clave !== clave) throw new Error("Usuario o contraseña incorrectos.");
    return { token: "demo." + btoa(usuario).slice(0, 12), rol: cuenta.rol, usuario: ROLES[cuenta.rol] };
  },
};

const folioService = {
  async crear(payload) { await demora(300); return { ...payload, creadoEn: new Date().toISOString() }; },
  async firmar(folio, hashPrevio) {
    await demora(300);
    const firmadoEn = new Date().toISOString();
    const firmado = { ...folio, estado: "firmado", firmadoEn };
    const hash = await digestHex(canonico(firmado) + "|" + hashPrevio);
    firmado.firma = {
      codigo: `MOP-${new Date().getFullYear()}-${String(folio.numero).padStart(3, "0")}-${letrasAleatorias()}`,
      hash, hashAnterior: hashPrevio, metodo: "FEA simulada · PIN + biometría",
    };
    return firmado;
  },
  async resolver(folioId, resolucion) { await demora(300); return { folioId, resolucion }; },
};

/* ================================================================== */
/*  UTILIDADES                                                         */
/* ================================================================== */
function fechaHora(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function nFolio(n) { return String(n).padStart(3, "0"); }
function corto(hash, n = 16) { return hash ? hash.slice(0, n) + "…" : "—"; }

const estiloEtiqueta = { fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 8 };
const estiloCampo = { width: "100%", borderRadius: 12, padding: "13px 14px", marginBottom: 18, background: "rgba(0,0,0,0.04)", border: "1px solid var(--border-glass)", color: "var(--text-main)", outline: "none" };

/* ================================================================== */
/*  ANIMACIONES PROPIAS DE ESTA PANTALLA                               */
/* ================================================================== */
function EstilosLocales() {
  return (
    <style>{`
      @keyframes lodPulso { 0%,100% { transform: scale(1); opacity: .85 } 50% { transform: scale(1.08); opacity: 1 } }
      @keyframes lodAnillo { 0% { transform: scale(.9); opacity: .7 } 100% { transform: scale(1.5); opacity: 0 } }
      @keyframes lodBarrido { 0% { top: 8% } 100% { top: 88% } }
      .lod-pulso { animation: lodPulso 1.4s ease-in-out infinite; }
      .lod-anillo { animation: lodAnillo 1.6s ease-out infinite; }
      .lod-barrido { animation: lodBarrido 1.1s ease-in-out infinite alternate; }
      .lod-paso { height: 4px; border-radius: 2px; flex: 1; transition: background .3s ease; }
    `}</style>
  );
}

/* ================================================================== */
/*  CAPTURA DE FOTOS                                                   */
/* ================================================================== */
function CapturaFotos({ fotos, onCambio }) {
  const refArchivo = useRef(null);
  function capturar(e) {
    const archivos = Array.from(e.target.files || []);
    if (!archivos.length) return;
    const nuevas = archivos.map((file) => ({ id: Date.now() + Math.random(), file, preview: URL.createObjectURL(file), nombre: file.name }));
    onCambio([...fotos, ...nuevas]);
    e.target.value = "";
  }
  function quitar(id) {
    const foto = fotos.find((p) => p.id === id);
    if (foto?.preview) URL.revokeObjectURL(foto.preview);
    onCambio(fotos.filter((p) => p.id !== id));
  }
  const botón = { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 0", borderRadius: 12, border: "1px solid var(--border-glass)", background: "var(--bg-glass)", color: "var(--text-main)", fontWeight: 600, fontSize: 13 };
  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: fotos.length > 0 ? 12 : 0 }}>
        <button type="button" className="btn-tap" style={botón}
          onClick={() => { refArchivo.current.setAttribute("capture", "environment"); refArchivo.current.click(); }}>
          <Camera size={18} /> Cámara
        </button>
        <button type="button" className="btn-tap" style={botón}
          onClick={() => { refArchivo.current.removeAttribute("capture"); refArchivo.current.click(); }}>
          <Image size={18} /> Galería
        </button>
        <input ref={refArchivo} type="file" accept="image/*" multiple onChange={capturar} style={{ display: "none" }} />
      </div>
      {fotos.length > 0 && (
        <div className="photo-grid">
          {fotos.map((p) => (
            <div key={p.id} style={{ position: "relative" }}>
              <img src={p.preview} alt={p.nombre} />
              <button onClick={() => quitar(p.id)} style={{ position: "absolute", top: 4, right: 4, width: 22, height: 22, borderRadius: "50%", background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><X size={12} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  MODAL DE FIRMA ELECTRÓNICA AVANZADA (simulada)                     */
/* ================================================================== */
function ModalFirma({ folio, rol, onCerrar, onFirmar }) {
  const [paso, setPaso] = useState(1);
  const [acepta, setAcepta] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [bio, setBio] = useState("espera");
  const [firmado, setFirmado] = useState(null);
  const yaSellado = useRef(false);

  useEffect(() => {
    if (paso !== 3 || bio !== "leyendo") return;
    const t = setTimeout(() => setBio("verificando"), 1900);
    return () => clearTimeout(t);
  }, [paso, bio]);

  useEffect(() => {
    if (bio !== "verificando" || yaSellado.current) return;
    yaSellado.current = true;
    let cancelado = false;
    (async () => {
      try {
        const resultado = await onFirmar();
        if (!cancelado) { setFirmado(resultado); setPaso(4); }
      } catch (e) {
        if (!cancelado) { setError("No fue posible completar la firma. Reintenta."); setBio("espera"); yaSellado.current = false; }
      }
    })();
    return () => { cancelado = true; };
  }, [bio, onFirmar]);

  const puedeCerrar = paso === 1 || paso === 2 || paso === 4;

  return (
    <div className="fade-in" style={{ position: "fixed", inset: 0, zIndex: 70, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(0,0,0,0.72)" }}
      onClick={() => puedeCerrar && onCerrar()}>
      <div className="sheet-enter" style={{ width: "100%", maxWidth: 480, maxHeight: "94vh", overflowY: "auto", borderRadius: "24px 24px 0 0", padding: 24, background: "var(--bg-canvas)" }}
        onClick={(e) => e.stopPropagation()}>

        {/* Cabecera + progreso */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "var(--accent-glow)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FileSignature size={17} />
            </div>
            <div>
              <p className="font-display" style={{ fontSize: 15, fontWeight: 700 }}>Firma Electrónica Avanzada</p>
              <p style={{ fontSize: 11, color: "var(--text-muted)" }}>Folio N°{nFolio(folio.numero)} · {LIBROS[folio.libro].corto}</p>
            </div>
          </div>
          {puedeCerrar && (
            <button onClick={onCerrar} style={{ padding: 6, background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}><X size={20} /></button>
          )}
        </div>
        <div style={{ display: "flex", gap: 5, marginBottom: 22 }}>
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="lod-paso" style={{ background: n <= paso ? "var(--accent)" : "rgba(0,0,0,0.10)" }} />
          ))}
        </div>

        {/* PASO 1 — Advertencia legal */}
        {paso === 1 && (
          <div className="fade-in">
            <p style={estiloEtiqueta}>Paso 1 de 4 · Advertencia legal</p>
            <div style={{ borderRadius: 16, padding: 16, background: "var(--color-warning-bg)", border: "1px solid var(--border-glass)", marginBottom: 16 }}>
              <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                <TriangleAlert size={18} style={{ color: "var(--color-warning)", flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-main)" }}>Esta acción es irreversible</p>
              </div>
              <p style={{ fontSize: 12.5, lineHeight: 1.75, color: "var(--text-muted)" }}>
                Al firmar, el presente folio quedará incorporado de forma definitiva al {LIBROS[folio.libro].nombre} del contrato. No podrá ser editado ni eliminado por ningún usuario, incluido quien lo suscribe. Cualquier corrección posterior deberá efectuarse mediante un nuevo folio que haga referencia expresa a éste.
              </p>
            </div>
            <div style={{ borderRadius: 16, padding: 16, background: "rgba(0,0,0,0.035)", border: "1px solid var(--border-glass)", marginBottom: 18 }}>
              <p style={{ fontSize: 11.5, lineHeight: 1.75, color: "var(--text-muted)" }}>
                La firma se efectúa conforme a la <strong style={{ color: "var(--text-main)" }}>Ley N° 19.799</strong>, sobre documentos electrónicos, firma electrónica y servicios de certificación de dicha firma. El suscriptor declara que los antecedentes consignados corresponden a hechos verificados en terreno y asume la responsabilidad que de ello se deriva.
              </p>
              <p className="font-mono" style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 10, opacity: 0.75 }}>
                Suscriptor: {rol.nombre} · {rol.label}
              </p>
            </div>
            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", marginBottom: 18 }}>
              <input type="checkbox" checked={acepta} onChange={(e) => setAcepta(e.target.checked)} style={{ width: 18, height: 18, marginTop: 1, flexShrink: 0, accentColor: "var(--accent)" }} />
              <span style={{ fontSize: 13, lineHeight: 1.6, color: "var(--text-main)" }}>He leído la advertencia y acepto firmar este folio con validez legal.</span>
            </label>
            <button onClick={() => setPaso(2)} disabled={!acepta} className="btn-tap btn-accent"
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 15, fontWeight: 600, borderRadius: 14, padding: "14px 0", border: "none", opacity: acepta ? 1 : 0.45 }}>
              Continuar <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* PASO 2 — PIN */}
        {paso === 2 && (
          <div className="fade-in">
            <p style={estiloEtiqueta}>Paso 2 de 4 · Clave de firma</p>
            <div style={{ textAlign: "center", padding: "10px 0 18px" }}>
              <div style={{ width: 56, height: 56, borderRadius: 18, background: "var(--accent-glow)", color: "var(--accent)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                <KeyRound size={26} />
              </div>
              <p style={{ fontSize: 13.5, color: "var(--text-muted)", lineHeight: 1.6, maxWidth: 320, margin: "0 auto" }}>
                Ingresa tu clave personal de firma. Es distinta de la contraseña de acceso y sólo tú la conoces.
              </p>
            </div>
            <input
              value={pin}
              onChange={(e) => { setPin(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
              type="password" inputMode="numeric" autoComplete="off" placeholder="••••"
              onKeyDown={(e) => { if (e.key === "Enter" && pin.length >= 4) { setPaso(3); setBio("leyendo"); } }}
              style={{ ...estiloCampo, textAlign: "center", fontSize: 26, letterSpacing: "0.5em", padding: "16px 14px", marginBottom: 10 }}
            />
            <p className="font-mono" style={{ fontSize: 10.5, color: "var(--text-muted)", textAlign: "center", marginBottom: 14, opacity: 0.8 }}>
              Demostración: cualquier clave de 4 a 6 dígitos
            </p>
            {error && (
              <div className="fade-in" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, borderRadius: 14, padding: "12px 14px", marginBottom: 14, background: "var(--color-danger-bg)", color: "var(--color-danger)" }}>
                <TriangleAlert size={16} style={{ flexShrink: 0 }} /> {error}
              </div>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setPaso(1)} className="btn-tap" style={{ flex: 1, padding: "13px 0", borderRadius: 12, border: "1px solid var(--border-glass)", background: "none", color: "var(--text-muted)", fontWeight: 600, fontSize: 14 }}>Atrás</button>
              <button onClick={() => { if (pin.length < 4) { setError("La clave debe tener al menos 4 dígitos."); return; } setPaso(3); setBio("leyendo"); }}
                className="btn-tap btn-accent" style={{ flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "13px 0", borderRadius: 12, border: "none", fontWeight: 600, fontSize: 14 }}>
                Validar clave <ChevronRight size={17} />
              </button>
            </div>
          </div>
        )}

        {/* PASO 3 — Biometría */}
        {paso === 3 && (
          <div className="fade-in" style={{ textAlign: "center", padding: "6px 0 10px" }}>
            <p style={{ ...estiloEtiqueta, textAlign: "left" }}>Paso 3 de 4 · Verificación de identidad</p>
            <div style={{ position: "relative", width: 150, height: 150, margin: "18px auto 22px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span className="lod-anillo" style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid var(--accent)" }} />
              <span className="lod-anillo" style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid var(--accent)", animationDelay: "0.5s" }} />
              <div style={{ position: "relative", width: 112, height: 112, borderRadius: "50%", background: "var(--accent-glow)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                <Fingerprint size={62} className={bio === "leyendo" ? "lod-pulso" : ""} style={{ color: "var(--accent)" }} />
                {bio === "leyendo" && (
                  <span className="lod-barrido" style={{ position: "absolute", left: "10%", right: "10%", height: 2, background: "var(--accent)", boxShadow: "0 0 10px var(--accent)", borderRadius: 2 }} />
                )}
              </div>
            </div>
            <p className="font-display" style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>
              {bio === "verificando" ? "Validando identidad…" : "Apoya el dedo en el sensor"}
            </p>
            <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.65, maxWidth: 300, margin: "0 auto 20px" }}>
              {bio === "verificando"
                ? "Consultando al proveedor acreditado de servicios de certificación."
                : "Usa la huella digital o el reconocimiento facial del dispositivo para autorizar la firma."}
            </p>
            {bio === "verificando" && <Loader2 size={22} className="spin" style={{ color: "var(--accent)" }} />}
            {bio === "leyendo" && (
              <button onClick={() => { setPaso(2); setBio("espera"); }} className="btn-tap"
                style={{ padding: "11px 26px", borderRadius: 12, border: "1px solid var(--border-glass)", background: "none", color: "var(--text-muted)", fontWeight: 600, fontSize: 13 }}>
                Cancelar
              </button>
            )}
          </div>
        )}

        {/* PASO 4 — Confirmación */}
        {paso === 4 && firmado && (
          <div className="fade-in">
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ width: 62, height: 62, borderRadius: "50%", background: "var(--color-success-bg)", color: "var(--color-success)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                <ShieldCheck size={30} />
              </div>
              <p className="font-display" style={{ fontSize: 19, fontWeight: 700, marginBottom: 6 }}>Folio firmado</p>
              <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, maxWidth: 320, margin: "0 auto" }}>
                El folio quedó incorporado al libro y sellado. Desde este momento no admite modificaciones.
              </p>
            </div>
            <div className="glass-panel" style={{ borderRadius: 16, padding: 16, marginBottom: 18 }}>
              <FilaDato etiqueta="Código de firma" valor={firmado.firma.codigo} mono destacado />
              <FilaDato etiqueta="Fecha y hora" valor={fechaHora(firmado.firmadoEn)} />
              <FilaDato etiqueta="Método" valor={firmado.firma.metodo} />
              <FilaDato etiqueta="Sello SHA-256" valor={corto(firmado.firma.hash, 28)} mono />
              <FilaDato etiqueta="Encadenado a" valor={firmado.firma.hashAnterior === "GENESIS" ? "Primer folio del libro" : corto(firmado.firma.hashAnterior, 20)} mono ultimo />
            </div>
            <button onClick={onCerrar} className="btn-tap btn-accent"
              style={{ width: "100%", fontSize: 15, fontWeight: 600, borderRadius: 14, padding: "14px 0", border: "none" }}>
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function FilaDato({ etiqueta, valor, mono, destacado, ultimo }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, paddingBottom: ultimo ? 0 : 9, marginBottom: ultimo ? 0 : 9, borderBottom: ultimo ? "none" : "1px solid var(--border-glass)" }}>
      <span style={{ fontSize: 10.5, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0 }}>{etiqueta}</span>
      <span className={mono ? "font-mono" : ""} style={{ fontSize: mono ? 11.5 : 12.5, fontWeight: destacado ? 700 : 500, color: destacado ? "var(--accent)" : "var(--text-main)", textAlign: "right", wordBreak: "break-all" }}>{valor}</span>
    </div>
  );
}

/* ================================================================== */
/*  MODAL DE RECHAZO CON OBSERVACIONES                                 */
/* ================================================================== */
function ModalRechazo({ folio, onCerrar, onConfirmar }) {
  const [texto, setTexto] = useState("");
  const [guardando, setGuardando] = useState(false);
  return (
    <div className="fade-in" style={{ position: "fixed", inset: 0, zIndex: 70, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(0,0,0,0.7)" }} onClick={onCerrar}>
      <div className="sheet-enter" style={{ width: "100%", maxWidth: 480, maxHeight: "92vh", overflowY: "auto", borderRadius: "24px 24px 0 0", padding: 24, background: "var(--bg-canvas)" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <h2 className="font-display" style={{ fontSize: 17, fontWeight: 700 }}>Rechazar con observaciones</h2>
          <button onClick={onCerrar} style={{ padding: 8, background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}><X size={20} /></button>
        </div>
        <p style={{ fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 18 }}>
          Folio N°{nFolio(folio.numero)} · {folio.titulo}
        </p>
        <label style={estiloEtiqueta}>Observación técnica</label>
        <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={6}
          placeholder="Fundamente el rechazo indicando la partida observada, el incumplimiento detectado y la corrección exigida…"
          style={{ ...estiloCampo, resize: "vertical", fontFamily: "inherit", lineHeight: 1.6 }} />
        <div style={{ borderRadius: 12, padding: 13, background: "rgba(0,0,0,0.035)", border: "1px solid var(--border-glass)", marginBottom: 18 }}>
          <p style={{ fontSize: 11.5, lineHeight: 1.7, color: "var(--text-muted)" }}>
            La observación quedará adosada al folio con su fecha, hora y el nombre de quien la suscribe. El contenido original del folio no se modifica: el sello permanece intacto.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCerrar} className="btn-tap" style={{ flex: 1, padding: "13px 0", borderRadius: 12, border: "1px solid var(--border-glass)", background: "none", color: "var(--text-muted)", fontWeight: 600, fontSize: 14 }}>Cancelar</button>
          <button
            onClick={async () => { if (!texto.trim()) return; setGuardando(true); await onConfirmar(texto.trim()); setGuardando(false); }}
            disabled={!texto.trim() || guardando} className="btn-tap"
            style={{ flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "13px 0", borderRadius: 12, border: "none", background: "var(--color-danger)", color: "#fff", fontWeight: 600, fontSize: 14, opacity: !texto.trim() || guardando ? 0.5 : 1 }}>
            {guardando ? <Loader2 size={17} className="spin" /> : <CircleX size={17} />} Registrar rechazo
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  MODAL DE VERIFICACIÓN DE INTEGRIDAD                                */
/* ================================================================== */
function ModalIntegridad({ libro, folios, onCerrar, onAdulterar }) {
  const [resultado, setResultado] = useState(null);
  const [recargar, setRecargar] = useState(0);

  useEffect(() => {
    let cancelado = false;
    setResultado(null);
    (async () => {
      const r = await verificarLibro(folios, libro);
      if (!cancelado) setResultado(r);
    })();
    return () => { cancelado = true; };
  }, [folios, libro, recargar]);

  const conforme = resultado && resultado.every((r) => r.estado === "ok");
  const primeraFalla = resultado && resultado.find((r) => r.estado === "alterado");

  return (
    <div className="fade-in" style={{ position: "fixed", inset: 0, zIndex: 70, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(0,0,0,0.7)" }} onClick={onCerrar}>
      <div className="sheet-enter" style={{ width: "100%", maxWidth: 480, maxHeight: "92vh", overflowY: "auto", borderRadius: "24px 24px 0 0", padding: 24, background: "var(--bg-canvas)" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <h2 className="font-display" style={{ fontSize: 17, fontWeight: 700 }}>Verificación de integridad</h2>
          <button onClick={onCerrar} style={{ padding: 8, background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}><X size={20} /></button>
        </div>

        {!resultado && (
          <div style={{ textAlign: "center", padding: "50px 0", color: "var(--text-muted)" }}>
            <Loader2 size={26} className="spin" style={{ color: "var(--accent)", marginBottom: 12 }} />
            <p style={{ fontSize: 12.5 }}>Recalculando la cadena de sellos…</p>
          </div>
        )}

        {resultado && (
          <>
            <div style={{ borderRadius: 16, padding: 16, marginBottom: 16, background: conforme ? "var(--color-success-bg)" : "var(--color-danger-bg)", border: "1px solid var(--border-glass)" }}>
              <div style={{ display: "flex", gap: 11 }}>
                {conforme
                  ? <ShieldCheck size={22} style={{ color: "var(--color-success)", flexShrink: 0 }} />
                  : <ShieldAlert size={22} style={{ color: "var(--color-danger)", flexShrink: 0 }} />}
                <div>
                  <p className="font-display" style={{ fontSize: 14.5, fontWeight: 700, color: conforme ? "var(--color-success)" : "var(--color-danger)", marginBottom: 4 }}>
                    {conforme ? "Libro íntegro" : "Se detectó una alteración"}
                  </p>
                  <p style={{ fontSize: 12, lineHeight: 1.65, color: "var(--text-muted)" }}>
                    {conforme
                      ? `Se recalcularon los ${resultado.length} folios firmados de ${LIBROS[libro].nombre} y todos los sellos coinciden con su contenido. El libro no ha sido alterado.`
                      : `La cadena se rompe en el folio N°${nFolio(primeraFalla?.numero)}. Su contenido no corresponde al sello registrado al momento de la firma, por lo que los folios posteriores no pueden darse por verificados.`}
                  </p>
                </div>
              </div>
            </div>

            {resultado.length === 0 && (
              <p style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center", padding: "24px 0" }}>
                Este libro aún no tiene folios firmados.
              </p>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
              {resultado.map((r) => {
                const cfg = r.estado === "ok"
                  ? { color: "var(--color-success)", bg: "var(--color-success-bg)", Icon: CircleCheck, texto: "Sello conforme" }
                  : r.estado === "alterado"
                    ? { color: "var(--color-danger)", bg: "var(--color-danger-bg)", Icon: CircleX, texto: "Contenido alterado" }
                    : { color: "var(--color-warning)", bg: "var(--color-warning-bg)", Icon: TriangleAlert, texto: "No verificable" };
                return (
                  <div key={r.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: 12, borderRadius: 12, background: cfg.bg, border: "1px solid var(--border-glass)" }}>
                    <cfg.Icon size={16} style={{ color: cfg.color, flexShrink: 0, marginTop: 1 }} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.45 }}>N°{nFolio(r.numero)} · {r.titulo}</p>
                      <p style={{ fontSize: 10.5, fontWeight: 600, color: cfg.color, marginTop: 3 }}>{cfg.texto}</p>
                      <p className="font-mono" style={{ fontSize: 9.5, color: "var(--text-muted)", marginTop: 4, wordBreak: "break-all", opacity: 0.8 }}>{corto(r.almacenado, 32)}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {resultado.length > 0 && (
              <div style={{ borderTop: "1px solid var(--border-glass)", paddingTop: 14 }}>
                <p style={{ fontSize: 10.5, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Herramienta de demostración</p>
                <p style={{ fontSize: 11.5, color: "var(--text-muted)", lineHeight: 1.65, marginBottom: 10 }}>
                  Simula la modificación de un folio ya firmado directamente en la base de datos, sin pasar por la aplicación. Sirve para comprobar que la alteración queda en evidencia.
                </p>
                <button
                  onClick={() => { onAdulterar(resultado[0].id); setRecargar((n) => n + 1); }}
                  className="btn-tap"
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "11px 0", borderRadius: 12, border: "1px dashed var(--color-danger)", background: "none", color: "var(--color-danger)", fontWeight: 600, fontSize: 12.5 }}>
                  <ShieldAlert size={16} /> Simular adulteración del folio N°{nFolio(resultado[0].numero)}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  NUEVO FOLIO                                                        */
/* ================================================================== */
function HojaNuevoFolio({ rol, libro, numero, onCerrar, onGuardar }) {
  const disponibles = rol.categorias;
  const [categoria, setCategoria] = useState(disponibles[0]);
  const [titulo, setTitulo] = useState("");
  const [cuerpo, setCuerpo] = useState("");
  const [fotos, setFotos] = useState([]);
  const [guardando, setGuardando] = useState(false);

  async function guardar() {
    if (!titulo.trim() || !cuerpo.trim()) return;
    setGuardando(true);
    const folio = base({
      id: Date.now(), numero, libro, categoria,
      titulo: titulo.trim(), cuerpo: cuerpo.trim(),
      autorRol: rol.clave, autorNombre: rol.nombre,
      creadoEn: new Date().toISOString(), estado: "borrador",
      fotos: fotos.map((p) => ({ id: p.id, nombre: p.nombre, preview: p.preview })),
    });
    const creado = await folioService.crear(folio);
    onGuardar({ ...folio, creadoEn: creado.creadoEn });
    setGuardando(false);
  }

  return (
    <div className="fade-in" style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(0,0,0,0.65)" }} onClick={onCerrar}>
      <div className="sheet-enter" style={{ width: "100%", maxWidth: 480, maxHeight: "92vh", overflowY: "auto", borderRadius: "24px 24px 0 0", padding: 24, background: "var(--bg-canvas)" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <h2 className="font-display" style={{ fontSize: 18, fontWeight: 700 }}>Nuevo folio N°{nFolio(numero)}</h2>
          <button onClick={onCerrar} style={{ padding: 8, background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}><X size={22} /></button>
        </div>
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 20 }}>{LIBROS[libro].nombre}</p>

        <label style={estiloEtiqueta}>Tipo de folio</label>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 18 }}>
          {disponibles.map((c) => {
            const activo = categoria === c;
            const cfg = CATEGORIAS[c];
            return (
              <button key={c} type="button" onClick={() => setCategoria(c)}
                style={{ fontSize: 12, fontWeight: 600, padding: "7px 13px", borderRadius: 8, border: "none", cursor: "pointer", background: activo ? cfg.bg : "rgba(0,0,0,0.04)", color: activo ? cfg.color : "var(--text-muted)" }}>
                {c}
              </button>
            );
          })}
        </div>

        <label style={estiloEtiqueta}>Título</label>
        <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ej: Recepción de subbase granular dm 4.200 – dm 4.850" style={estiloCampo} />

        <label style={estiloEtiqueta}>Descripción técnica</label>
        <textarea value={cuerpo} onChange={(e) => setCuerpo(e.target.value)} rows={5}
          placeholder="Indique partida, ubicación (dm o eje), ensayos o verificaciones realizadas y la norma o especificación aplicable…"
          style={{ ...estiloCampo, resize: "vertical", fontFamily: "inherit", lineHeight: 1.6 }} />

        <label style={estiloEtiqueta}>Evidencia fotográfica</label>
        <CapturaFotos fotos={fotos} onCambio={setFotos} />

        <div style={{ borderRadius: 12, padding: 12, background: "rgba(0,0,0,0.035)", border: "1px solid var(--border-glass)", margin: "18px 0" }}>
          <p style={{ fontSize: 11.5, lineHeight: 1.65, color: "var(--text-muted)" }}>
            El folio se creará como borrador y podrá editarse. Sólo al firmarlo quedará incorporado al libro de forma definitiva.
          </p>
        </div>

        <button onClick={guardar} disabled={guardando || !titulo.trim() || !cuerpo.trim()} className="btn-tap btn-accent"
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 15, fontWeight: 600, borderRadius: 14, padding: "14px 0", border: "none", opacity: (guardando || !titulo.trim() || !cuerpo.trim()) ? 0.5 : 1 }}>
          {guardando ? <Loader2 size={18} className="spin" /> : <Plus size={18} />}
          {guardando ? "Guardando…" : "Crear folio como borrador"}
        </button>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  BANNER DE INMUTABILIDAD                                            */
/* ================================================================== */
function BannerInmutabilidad({ folio }) {
  const f = folio.firma || {};
  return (
    <div style={{ borderRadius: 18, padding: 17, marginBottom: 18, background: "var(--color-success-bg)", border: "1px solid var(--border-glass)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 11, marginBottom: 13 }}>
        <ShieldCheck size={21} style={{ color: "var(--color-success)", flexShrink: 0, marginTop: 1 }} />
        <div>
          <p className="font-display" style={{ fontSize: 14, fontWeight: 700, color: "var(--color-success)", marginBottom: 4 }}>
            Documento firmado electrónicamente
          </p>
          <p style={{ fontSize: 11.5, lineHeight: 1.7, color: "var(--text-muted)" }}>
            Folio incorporado de forma definitiva al libro y sellado criptográficamente. No admite edición ni eliminación. Firmado conforme a la Ley N° 19.799 sobre documentos electrónicos y firma electrónica.
          </p>
        </div>
      </div>
      <div style={{ background: "rgba(0,0,0,0.04)", borderRadius: 12, padding: 13 }}>
        <FilaDato etiqueta="Código de firma" valor={f.codigo || "—"} mono destacado />
        <FilaDato etiqueta="Suscrito por" valor={`${folio.autorNombre} · ${ROLES[folio.autorRol]?.label || ""}`} />
        <FilaDato etiqueta="Fecha y hora" valor={fechaHora(folio.firmadoEn)} />
        <FilaDato etiqueta="Sello SHA-256" valor={corto(f.hash, 30)} mono />
        <FilaDato etiqueta="Encadenado a" valor={f.hashAnterior === "GENESIS" ? "Primer folio del libro" : corto(f.hashAnterior, 22)} mono ultimo />
      </div>
    </div>
  );
}

/* ================================================================== */
/*  DETALLE DE FOLIO                                                   */
/* ================================================================== */
function DetalleFolio({ folio, rol, onCerrar, onActualizar, onFirmar, onRechazar, onAprobar }) {
  const esBorrador = folio.estado === "borrador";
  const cfg = CATEGORIAS[folio.categoria] || CATEGORIAS["Instrucción Inspector Fiscal"];
  const IconoCat = cfg.Icon;

  const [editando, setEditando] = useState(false);
  const [titulo, setTitulo] = useState(folio.titulo);
  const [cuerpo, setCuerpo] = useState(folio.cuerpo);
  const [fotos, setFotos] = useState(folio.fotos || []);
  const [guardando, setGuardando] = useState(false);

  const esAutor = folio.autorRol === rol.clave;
  const puedeResolver =
    rol.puedeResolver &&
    folio.estado === "firmado" &&
    !folio.resolucion &&
    folio.autorRol !== rol.clave &&
    CATEGORIAS_RESOLUBLES.includes(folio.categoria);

  async function guardar() {
    setGuardando(true);
    await demora(350);
    onActualizar({ ...folio, titulo: titulo.trim(), cuerpo: cuerpo.trim(), fotos });
    setGuardando(false);
    setEditando(false);
  }

  return (
    <div className="fade-in" style={{ position: "fixed", inset: 0, zIndex: 50, background: "var(--bg-canvas)", overflowY: "auto" }}>
      <div className="glass-panel" style={{ position: "sticky", top: 0, zIndex: 10, padding: "14px 16px", display: "flex", alignItems: "center", gap: 10, borderRadius: 0, borderTop: "none", borderLeft: "none", borderRight: "none" }}>
        <button onClick={onCerrar} className="btn-tap" style={{ width: 40, height: 40, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "1px solid var(--border-glass)", color: "var(--text-main)", minHeight: 40 }}>
          <ChevronLeft size={20} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p className="font-display" style={{ fontSize: 15, fontWeight: 700 }}>Folio N°{nFolio(folio.numero)}</p>
          <p style={{ fontSize: 11, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{LIBROS[folio.libro].nombre}</p>
        </div>
        {esBorrador && esAutor && !editando && (
          <button onClick={() => setEditando(true)} className="btn-tap" style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 13px", borderRadius: 10, border: "1px solid var(--border-glass)", background: "none", color: "var(--text-main)", fontWeight: 600, fontSize: 12, minHeight: 36 }}>
            <Edit3 size={14} /> Editar
          </button>
        )}
      </div>

      <div style={{ padding: 20, maxWidth: 620, margin: "0 auto", paddingBottom: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, padding: "5px 12px", borderRadius: 8, background: cfg.bg, color: cfg.color }}>
            <IconoCat size={13} /> {folio.categoria}
          </span>
          <span style={{ fontSize: 10, fontWeight: 700, padding: "5px 10px", borderRadius: 6, textTransform: "uppercase", letterSpacing: "0.06em", background: esBorrador ? "rgba(0,0,0,0.05)" : "var(--color-success-bg)", color: esBorrador ? "var(--text-muted)" : "var(--color-success)" }}>
            {esBorrador ? "Borrador" : "Firmado"}
          </span>
          {folio.resolucion && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, padding: "5px 12px", borderRadius: 8, background: folio.resolucion.resultado === "Aprobado" ? "var(--color-success-bg)" : "var(--color-danger-bg)", color: folio.resolucion.resultado === "Aprobado" ? "var(--color-success)" : "var(--color-danger)" }}>
              {folio.resolucion.resultado === "Aprobado" ? <CircleCheck size={13} /> : <CircleX size={13} />} {folio.resolucion.resultado}
            </span>
          )}
        </div>

        {!editando && !esBorrador && <BannerInmutabilidad folio={folio} />}

        {editando ? (
          <>
            <label style={estiloEtiqueta}>Título</label>
            <input value={titulo} onChange={(e) => setTitulo(e.target.value)} style={estiloCampo} />
            <label style={estiloEtiqueta}>Descripción técnica</label>
            <textarea value={cuerpo} onChange={(e) => setCuerpo(e.target.value)} rows={7} style={{ ...estiloCampo, resize: "vertical", fontFamily: "inherit", lineHeight: 1.6 }} />
            <label style={estiloEtiqueta}>Evidencia fotográfica</label>
            <CapturaFotos fotos={fotos} onCambio={setFotos} />
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={() => { setEditando(false); setTitulo(folio.titulo); setCuerpo(folio.cuerpo); setFotos(folio.fotos || []); }}
                className="btn-tap" style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: "1px solid var(--border-glass)", background: "none", color: "var(--text-muted)", fontWeight: 600, fontSize: 14 }}>Cancelar</button>
              <button onClick={guardar} disabled={guardando || !titulo.trim() || !cuerpo.trim()} className="btn-tap btn-accent"
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "12px 0", borderRadius: 12, border: "none", fontWeight: 600, fontSize: 14, opacity: guardando ? 0.6 : 1 }}>
                {guardando ? <Loader2 size={16} className="spin" /> : <Save size={16} />} Guardar
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="font-display" style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.4, marginBottom: 12 }}>{folio.titulo}</h2>
            <p style={{ fontSize: 14, lineHeight: 1.85, color: "var(--text-muted)", marginBottom: 20, whiteSpace: "pre-wrap" }}>{folio.cuerpo}</p>

            {folio.fotos && folio.fotos.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <p style={estiloEtiqueta}>Evidencia adjunta</p>
                <div className="photo-grid">{folio.fotos.map((p) => <img key={p.id} src={p.preview} alt={p.nombre} />)}</div>
              </div>
            )}

            <div className="glass-panel" style={{ borderRadius: 16, padding: 16, marginBottom: 18 }}>
              <FilaDato etiqueta="Autor" valor={folio.autorNombre} />
              <FilaDato etiqueta="Perfil" valor={ROLES[folio.autorRol]?.label || "—"} />
              <FilaDato etiqueta="Creado" valor={fechaHora(folio.creadoEn)} ultimo={esBorrador} />
              {!esBorrador && <FilaDato etiqueta="Firmado" valor={fechaHora(folio.firmadoEn)} ultimo />}
            </div>

            {folio.resolucion && (
              <div className="glass-panel" style={{ borderRadius: 16, padding: 17, marginBottom: 18, borderLeft: `3px solid ${folio.resolucion.resultado === "Aprobado" ? "var(--color-success)" : "var(--color-danger)"}` }}>
                <p style={{ ...estiloEtiqueta, marginBottom: 10 }}>Resolución del Inspector Fiscal</p>
                <p style={{ fontSize: 13.5, lineHeight: 1.75, color: "var(--text-main)", marginBottom: 12, whiteSpace: "pre-wrap" }}>{folio.resolucion.observacion}</p>
                <div style={{ borderTop: "1px solid var(--border-glass)", paddingTop: 10 }}>
                  <FilaDato etiqueta="Resuelto por" valor={folio.resolucion.porNombre} />
                  <FilaDato etiqueta="Fecha" valor={fechaHora(folio.resolucion.fecha)} ultimo />
                </div>
              </div>
            )}

            {esBorrador && (
              <div style={{ borderRadius: 14, padding: 14, marginBottom: 18, background: "var(--color-warning-bg)", border: "1px solid var(--border-glass)", display: "flex", gap: 10 }}>
                <FileText size={17} style={{ color: "var(--color-warning)", flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 12, lineHeight: 1.65, color: "var(--text-muted)" }}>
                  Este folio es un borrador y aún no forma parte del libro. Mientras no se firme, puede editarse y no tiene valor legal.
                </p>
              </div>
            )}

            {esBorrador && esAutor && (
              <button onClick={() => onFirmar(folio)} className="btn-tap btn-accent"
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 9, fontSize: 15, fontWeight: 600, borderRadius: 14, padding: "15px 0", border: "none" }}>
                <FileSignature size={19} /> Firmar e incorporar al libro
              </button>
            )}

            {puedeResolver && (
              <div>
                <p style={{ ...estiloEtiqueta, marginBottom: 10 }}>Pronunciamiento del Inspector Fiscal</p>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => onAprobar(folio)} className="btn-tap"
                    style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "14px 0", borderRadius: 13, border: "none", background: "var(--color-success)", color: "#fff", fontWeight: 600, fontSize: 14 }}>
                    <CircleCheck size={17} /> Aprobar
                  </button>
                  <button onClick={() => onRechazar(folio)} className="btn-tap"
                    style={{ flex: 1.35, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "14px 0", borderRadius: 13, border: "none", background: "var(--color-danger)", color: "#fff", fontWeight: 600, fontSize: 13.5 }}>
                    <CircleX size={17} /> Rechazar con observaciones
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  TARJETA DE FOLIO                                                   */
/* ================================================================== */
function TarjetaFolio({ folio, onAbrir, resaltarPendiente }) {
  const cfg = CATEGORIAS[folio.categoria] || CATEGORIAS["Instrucción Inspector Fiscal"];
  const esBorrador = folio.estado === "borrador";
  const IconoCat = cfg.Icon;
  return (
    <article className="glass-panel fade-in" style={{ borderRadius: 20, padding: 18, cursor: "pointer" }} onClick={() => onAbrir(folio)}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <span className="font-mono" style={{ fontSize: 10, fontWeight: 700, padding: "4px 8px", borderRadius: 6, background: "var(--accent)", color: "#fff" }}>N°{nFolio(folio.numero)}</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 600, padding: "4px 8px", borderRadius: 6, background: cfg.bg, color: cfg.color }}>
          <IconoCat size={11} /> {cfg.corto}
        </span>
        {folio.resolucion && (
          <span style={{ fontSize: 9.5, fontWeight: 700, padding: "3px 7px", borderRadius: 5, textTransform: "uppercase", letterSpacing: "0.05em", background: folio.resolucion.resultado === "Aprobado" ? "var(--color-success-bg)" : "var(--color-danger-bg)", color: folio.resolucion.resultado === "Aprobado" ? "var(--color-success)" : "var(--color-danger)" }}>
            {folio.resolucion.resultado}
          </span>
        )}
        {resaltarPendiente && !folio.resolucion && !esBorrador && (
          <span style={{ fontSize: 9.5, fontWeight: 700, padding: "3px 7px", borderRadius: 5, textTransform: "uppercase", letterSpacing: "0.05em", background: "var(--color-warning-bg)", color: "var(--color-warning)" }}>
            Requiere tu pronunciamiento
          </span>
        )}
        <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 4, fontSize: 9, fontWeight: 700, padding: "3px 7px", borderRadius: 5, textTransform: "uppercase", letterSpacing: "0.06em", background: esBorrador ? "rgba(0,0,0,0.05)" : "var(--color-success-bg)", color: esBorrador ? "var(--text-muted)" : "var(--color-success)" }}>
          {!esBorrador && <ShieldCheck size={10} />} {esBorrador ? "Borrador" : "Firmado"}
        </span>
      </div>
      <h3 className="font-display" style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.4, marginBottom: 6 }}>{folio.titulo}</h3>
      <p style={{ fontSize: 12, lineHeight: 1.6, color: "var(--text-muted)", marginBottom: 10, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{folio.cuerpo}</p>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTop: "1px solid var(--border-glass)" }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 11, fontWeight: 500, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{folio.autorNombre}</p>
          <p style={{ fontSize: 10, color: "var(--text-muted)", opacity: 0.6 }}>{fechaHora(folio.creadoEn)}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 500, color: "var(--accent)", flexShrink: 0 }}><Eye size={14} /> Ver</div>
      </div>
    </article>
  );
}

/* ================================================================== */
/*  PANTALLA DE CONTRATO (dashboard)                                   */
/* ================================================================== */
function PantallaContrato({ contratoId, folios, rol, onSeleccionar, onIrABitacora, onVerificar }) {
  const contrato = CONTRATOS.find((c) => c.id === contratoId);
  const firmados = folios.filter((f) => f.estado === "firmado").length;
  const borradores = folios.filter((f) => f.estado === "borrador").length;
  const pendientes = folios.filter((f) => f.estado === "firmado" && !f.resolucion && CATEGORIAS_RESOLUBLES.includes(f.categoria) && f.autorRol !== "inspector_fiscal").length;

  const tarjetas = [
    { etiqueta: "Folios", valor: folios.length, color: "var(--accent)", filtro: "Todas" },
    { etiqueta: "Firmados", valor: firmados, color: "var(--color-success)", filtro: "__firmados" },
    { etiqueta: rol.puedeResolver ? "Por resolver" : "Borradores", valor: rol.puedeResolver ? pendientes : borradores, color: "var(--color-warning)", filtro: rol.puedeResolver ? "__pendientes" : "__borradores" },
  ];

  return (
    <div className="fade-in" style={{ padding: 20 }}>
      <div className="glass-panel" style={{ borderRadius: 22, padding: 22, marginBottom: 16, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, right: 0, width: 120, height: 120, borderRadius: "50%", background: "var(--accent-glow)", filter: "blur(50px)", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <span className="font-mono" style={{ fontSize: 10, fontWeight: 700, padding: "4px 9px", borderRadius: 6, background: "var(--accent-glow)", color: "var(--accent)", display: "inline-block", marginBottom: 10 }}>
            {contrato.codigo}
          </span>
          <p className="font-display" style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.35, marginBottom: 6 }}>{contrato.nombre}</p>
          <p style={{ fontSize: 11.5, color: "var(--text-muted)", display: "flex", alignItems: "flex-start", gap: 5, marginBottom: 16, lineHeight: 1.5 }}>
            <MapPin size={12} style={{ flexShrink: 0, marginTop: 2 }} /> {contrato.ubicacion}
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            <DatoContrato etiqueta="Contratista" valor={contrato.contratista} />
            <DatoContrato etiqueta="Inspector Fiscal" valor={ROLES.inspector_fiscal.nombre} />
            <DatoContrato etiqueta="Monto" valor={contrato.monto} />
            <DatoContrato etiqueta="Plazo" valor={contrato.plazo} />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Avance físico</span>
            <span className="font-mono" style={{ fontSize: 14, fontWeight: 700, color: "var(--accent)" }}>{contrato.avance}%</span>
          </div>
          <div style={{ width: "100%", height: 8, borderRadius: 4, background: "rgba(0,0,0,0.08)", overflow: "hidden" }}>
            <div style={{ width: `${contrato.avance}%`, height: "100%", borderRadius: 4, background: "linear-gradient(90deg, var(--accent), var(--color-info))", boxShadow: "0 0 12px var(--accent-glow)", transition: "width 0.6s ease" }} />
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
        {tarjetas.map((s) => (
          <button key={s.etiqueta} onClick={() => onIrABitacora(s.filtro)} className="glass-panel btn-tap"
            style={{ borderRadius: 16, padding: "18px 8px", textAlign: "center", cursor: "pointer", minHeight: "auto" }}>
            <p className="font-display" style={{ fontSize: 26, fontWeight: 700, color: s.color }}>{s.valor}</p>
            <p style={{ fontSize: 9.5, marginTop: 3, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600 }}>{s.etiqueta}</p>
          </button>
        ))}
      </div>

      <button onClick={onVerificar} className="glass-panel btn-tap"
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, borderRadius: 16, padding: 16, marginBottom: 20, cursor: "pointer", textAlign: "left", minHeight: "auto" }}>
        <div style={{ width: 38, height: 38, borderRadius: 12, background: "var(--color-success-bg)", color: "var(--color-success)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <ShieldCheck size={19} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p className="font-display" style={{ fontSize: 13.5, fontWeight: 700 }}>Verificar integridad del libro</p>
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Recalcula los sellos y detecta alteraciones</p>
        </div>
        <ChevronRight size={18} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
      </button>

      <p style={{ ...estiloEtiqueta, marginBottom: 12 }}>Contratos asignados</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {CONTRATOS.map((c) => {
          const activo = c.id === contratoId;
          return (
            <button key={c.id} onClick={() => onSeleccionar(c.id)} className="glass-panel btn-tap"
              style={{ borderRadius: 16, padding: 15, textAlign: "left", cursor: "pointer", minHeight: "auto", borderColor: activo ? "var(--accent)" : undefined, boxShadow: activo ? "0 0 12px var(--accent-glow)" : undefined }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 12, background: activo ? "var(--accent)" : "rgba(0,0,0,0.04)", color: activo ? "#fff" : "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Building2 size={18} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className="font-mono" style={{ fontSize: 9.5, color: "var(--text-muted)", marginBottom: 2 }}>{c.codigo}</p>
                  <p className="font-display" style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.35, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.nombre}</p>
                  <p style={{ fontSize: 10.5, color: "var(--text-muted)", marginTop: 2 }}>{c.avance}% de avance</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DatoContrato({ etiqueta, valor }) {
  return (
    <div>
      <p style={{ fontSize: 9.5, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{etiqueta}</p>
      <p style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.35 }}>{valor}</p>
    </div>
  );
}

/* ================================================================== */
/*  COMPONENTES DE INTERFAZ                                            */
/* ================================================================== */
function BotonTema({ oscuro, alternar }) {
  return (
    <button onClick={alternar} className="btn-tap glass-panel" aria-label="Cambiar tema"
      style={{ width: 38, height: 38, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "1px solid var(--border-glass)", color: "var(--text-main)", minHeight: 38 }}>
      {oscuro ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}

function PantallaLogin({ onIngresar, oscuro, alternar }) {
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function ingresar() {
    setError("");
    if (!usuario.trim() || !clave) { setError("Ingresa tu usuario y contraseña."); return; }
    setCargando(true);
    try { onIngresar(await authService.login(usuario, clave)); }
    catch (e) { setError(e.message); setCargando(false); }
  }

  const cuentas = [
    { usuario: "cristian", rol: "Inspector Fiscal · MOP" },
    { usuario: "mauricio", rol: "Administrador de Contrato" },
    { usuario: "prevencion", rol: "Prevencionista de Riesgos" },
  ];

  return (
    <div className="fade-in login-bg" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "40px 24px" }}>
      <div style={{ position: "absolute", top: 16, right: 16, zIndex: 10 }}><BotonTema oscuro={oscuro} alternar={alternar} /></div>
      <div style={{ width: "100%", maxWidth: 390, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: 34 }}>
          <div className="glass-panel" style={{ width: 60, height: 60, borderRadius: 18, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
            <BookMarked size={30} style={{ color: "var(--accent)" }} />
          </div>
          <h1 className="font-display" style={{ fontSize: 27, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 6 }}>Libro de Obra Digital</h1>
          <p style={{ fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.5 }}>Contratos de obra pública · Registro foliado e inmutable</p>
        </div>

        <div className="glass-panel" style={{ borderRadius: 24, padding: 26 }}>
          <div style={{ marginBottom: 16 }}>
            <label style={estiloEtiqueta}>Usuario</label>
            <input value={usuario} onChange={(e) => { setUsuario(e.target.value); setError(""); }} type="text" autoCapitalize="none" autoCorrect="off" placeholder="cristian" style={{ ...estiloCampo, marginBottom: 0 }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={estiloEtiqueta}>Contraseña</label>
            <input value={clave} onChange={(e) => { setClave(e.target.value); setError(""); }} type="password" placeholder="••••••"
              onKeyDown={(e) => e.key === "Enter" && ingresar()} style={{ ...estiloCampo, marginBottom: 0 }} />
          </div>
          {error && (
            <div className="fade-in" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, borderRadius: 14, padding: "12px 14px", marginBottom: 14, background: "var(--color-danger-bg)", color: "var(--color-danger)" }}>
              <TriangleAlert size={16} style={{ flexShrink: 0 }} /> {error}
            </div>
          )}
          <button onClick={ingresar} disabled={cargando} className="btn-tap btn-accent"
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 15, fontWeight: 600, borderRadius: 14, padding: "14px 0", border: "none", opacity: cargando ? 0.7 : 1 }}>
            {cargando ? <Loader2 size={18} className="spin" /> : <Lock size={17} />} {cargando ? "Verificando…" : "Ingresar"}
          </button>

          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border-glass)" }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10, textAlign: "center" }}>Perfiles de demostración</p>
            {cuentas.map((c) => (
              <button key={c.usuario} onClick={() => { setUsuario(c.usuario); setClave("123"); setError(""); }}
                className="btn-tap"
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "9px 12px", marginBottom: 6, borderRadius: 10, border: "1px solid var(--border-glass)", background: "none", cursor: "pointer", minHeight: "auto", textAlign: "left" }}>
                <div style={{ minWidth: 0 }}>
                  <p className="font-mono" style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-main)" }}>{c.usuario} · 123</p>
                  <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 1 }}>{c.rol}</p>
                </div>
                <ChevronRight size={15} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  APLICACIÓN                                                         */
/* ================================================================== */
function Aplicacion() {
  const [sesion, setSesion] = useState(null);
  const [foliosPorContrato, setFoliosPorContrato] = useState({});
  const [cargando, setCargando] = useState(true);
  const [tab, setTab] = useState("bitacora");
  const [contratoId, setContratoId] = useState(CONTRATOS[0].id);
  const [libro, setLibro] = useState("maestro");
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("Todas");
  const [nuevoAbierto, setNuevoAbierto] = useState(false);
  const [verFolioId, setVerFolioId] = useState(null);
  const [firmarId, setFirmarId] = useState(null);
  const [rechazarId, setRechazarId] = useState(null);
  const [integridadAbierta, setIntegridadAbierta] = useState(false);
  const [oscuro, setOscuro] = useState(false);

  useEffect(() => {
    const raiz = document.documentElement;
    if (oscuro) raiz.classList.add("dark"); else raiz.classList.remove("dark");
  }, [oscuro]);

  const rol = sesion ? ROLES[sesion.rol] : null;
  const folios = useMemo(() => foliosPorContrato[contratoId] || [], [foliosPorContrato, contratoId]);

  // Carga inicial: se sella la cadena de todos los libros de cada contrato.
  useEffect(() => {
    if (!sesion) return;
    let cancelado = false;
    setCargando(true);
    (async () => {
      const datos = {};
      for (const clave of Object.keys(FOLIOS_DEMO)) {
        datos[clave] = await sellarCadenas(FOLIOS_DEMO[clave].map((f) => ({ ...f })));
      }
      await demora(400);
      if (!cancelado) { setFoliosPorContrato(datos); setCargando(false); }
    })();
    return () => { cancelado = true; };
  }, [sesion]);

  // Al cambiar de perfil, situarse en el libro donde ese perfil escribe.
  useEffect(() => {
    if (rol) setLibro(rol.escribeEn[0] || "maestro");
  }, [rol]);

  const puedeEscribir = rol ? rol.escribeEn.includes(libro) : false;
  const siguienteNumero = useMemo(() => {
    const delLibro = folios.filter((f) => f.libro === libro);
    return delLibro.reduce((max, f) => Math.max(max, f.numero), 0) + 1;
  }, [folios, libro]);

  const visibles = useMemo(() => {
    return folios
      .filter((f) => f.libro === libro)
      .filter((f) => {
        if (filtro === "Todas") return true;
        if (filtro === "__firmados") return f.estado === "firmado";
        if (filtro === "__borradores") return f.estado === "borrador";
        if (filtro === "__pendientes") return f.estado === "firmado" && !f.resolucion && CATEGORIAS_RESOLUBLES.includes(f.categoria) && f.autorRol !== "inspector_fiscal";
        return f.categoria === filtro;
      })
      .filter((f) => {
        if (!busqueda.trim()) return true;
        const q = busqueda.toLowerCase();
        return f.titulo.toLowerCase().includes(q) || f.cuerpo.toLowerCase().includes(q) || String(f.numero).includes(q);
      })
      .sort((a, b) => b.numero - a.numero);
  }, [folios, libro, filtro, busqueda]);

  const folioActivo = verFolioId ? folios.find((f) => f.id === verFolioId) : null;
  const folioAFirmar = firmarId ? folios.find((f) => f.id === firmarId) : null;
  const folioARechazar = rechazarId ? folios.find((f) => f.id === rechazarId) : null;

  const salir = useCallback(() => {
    setSesion(null); setFoliosPorContrato({}); setTab("bitacora");
    setBusqueda(""); setFiltro("Todas"); setVerFolioId(null);
    setFirmarId(null); setRechazarId(null); setIntegridadAbierta(false);
  }, []);

  function actualizarFolio(actualizado) {
    setFoliosPorContrato((prev) => ({
      ...prev,
      [contratoId]: (prev[contratoId] || []).map((f) => (f.id === actualizado.id ? actualizado : f)),
    }));
  }

  function guardarNuevo(folio) {
    setFoliosPorContrato((prev) => ({ ...prev, [contratoId]: [...(prev[contratoId] || []), folio] }));
    setNuevoAbierto(false);
    setVerFolioId(folio.id);
  }

  const firmarFolio = useCallback(async () => {
    const actuales = foliosPorContrato[contratoId] || [];
    const objetivo = actuales.find((f) => f.id === firmarId);
    if (!objetivo) throw new Error("Folio no encontrado");
    const cadena = cadenaDe(actuales, objetivo.libro);
    const previo = cadena.length ? cadena[cadena.length - 1].firma.hash : "GENESIS";
    const firmado = await folioService.firmar(objetivo, previo);
    setFoliosPorContrato((prev) => ({
      ...prev,
      [contratoId]: (prev[contratoId] || []).map((f) => (f.id === firmado.id ? firmado : f)),
    }));
    return firmado;
  }, [foliosPorContrato, contratoId, firmarId]);

  async function resolver(folio, resultado, observacion) {
    const resolucion = {
      resultado, observacion,
      porNombre: rol.nombre, porRol: rol.clave,
      fecha: new Date().toISOString(),
    };
    await folioService.resolver(folio.id, resolucion);
    actualizarFolio({ ...folio, resolucion });
  }

  function adulterar(folioId) {
    setFoliosPorContrato((prev) => ({
      ...prev,
      [contratoId]: (prev[contratoId] || []).map((f) =>
        f.id === folioId ? { ...f, cuerpo: f.cuerpo + " (texto modificado directamente en la base de datos)" } : f
      ),
    }));
  }

  if (!sesion) {
    return (
      <>
        <EstilosLocales />
        <PantallaLogin onIngresar={setSesion} oscuro={oscuro} alternar={() => setOscuro(!oscuro)} />
      </>
    );
  }

  if (folioActivo) {
    return (
      <>
        <EstilosLocales />
        <DetalleFolio
          folio={folioActivo} rol={rol}
          onCerrar={() => setVerFolioId(null)}
          onActualizar={actualizarFolio}
          onFirmar={(f) => setFirmarId(f.id)}
          onAprobar={(f) => resolver(f, "Aprobado", "Se aprueba lo informado, sin observaciones.")}
          onRechazar={(f) => setRechazarId(f.id)}
        />
        {folioAFirmar && (
          <ModalFirma folio={folioAFirmar} rol={rol} onFirmar={firmarFolio} onCerrar={() => setFirmarId(null)} />
        )}
        {folioARechazar && (
          <ModalRechazo folio={folioARechazar}
            onCerrar={() => setRechazarId(null)}
            onConfirmar={async (texto) => { await resolver(folioARechazar, "Rechazado", texto); setRechazarId(null); }} />
        )}
      </>
    );
  }

  const contrato = CONTRATOS.find((c) => c.id === contratoId);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <EstilosLocales />

      <header className="glass-panel" style={{ position: "sticky", top: 0, zIndex: 30, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, borderRadius: 0, borderTop: "none", borderLeft: "none", borderRight: "none" }}>
        <div style={{ width: 38, height: 38, borderRadius: 12, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 0 16px var(--accent-glow)" }}>
          <BookMarked size={18} color="#fff" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 className="font-display" style={{ fontSize: 14.5, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Libro de Obra Digital</h1>
          <p style={{ fontSize: 10, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{rol.corto} · {rol.nombre}</p>
        </div>
        <BotonTema oscuro={oscuro} alternar={() => setOscuro(!oscuro)} />
        <button onClick={salir} className="btn-tap glass-panel" aria-label="Salir"
          style={{ width: 38, height: 38, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-danger)", minHeight: 38 }}>
          <LogOut size={16} />
        </button>
      </header>

      <main style={{ flex: 1, overflowY: "auto", paddingBottom: 100 }}>
        {cargando ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "100px 0", color: "var(--text-muted)" }}>
            <Loader2 size={28} className="spin" style={{ marginBottom: 12, color: "var(--accent)" }} />
            <p style={{ fontSize: 12, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em" }}>Verificando sellos…</p>
          </div>
        ) : tab === "contrato" ? (
          <PantallaContrato
            contratoId={contratoId} folios={folios} rol={rol}
            onSeleccionar={setContratoId}
            onIrABitacora={(f) => { setFiltro(f); setTab("bitacora"); }}
            onVerificar={() => setIntegridadAbierta(true)}
          />
        ) : (
          <div style={{ padding: "16px 20px 20px" }}>
            {/* Selector de contrato */}
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 12 }}>
              {CONTRATOS.map((c) => (
                <button key={c.id} onClick={() => setContratoId(c.id)} className="btn-tap font-mono"
                  style={{ flexShrink: 0, fontSize: 10.5, fontWeight: 700, padding: "8px 13px", borderRadius: 10, border: "none", minHeight: 32,
                    background: c.id === contratoId ? "var(--accent)" : "var(--bg-glass)",
                    color: c.id === contratoId ? "#fff" : "var(--text-muted)",
                    boxShadow: c.id === contratoId ? "0 3px 10px var(--accent-glow)" : "none" }}>
                  {c.codigo}
                </button>
              ))}
            </div>
            <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.45, marginBottom: 14 }}>{contrato.nombre}</p>

            {/* Selector de libro */}
            <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
              {Object.values(LIBROS).map((l) => {
                const activo = libro === l.clave;
                const IconoLibro = l.Icon;
                return (
                  <button key={l.clave} onClick={() => setLibro(l.clave)} className="btn-tap"
                    style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "10px 4px", borderRadius: 13, border: "none", minHeight: "auto",
                      background: activo ? "var(--accent)" : "var(--bg-glass)", color: activo ? "#fff" : "var(--text-muted)",
                      boxShadow: activo ? "0 3px 12px var(--accent-glow)" : "none" }}>
                    <IconoLibro size={17} />
                    <span style={{ fontSize: 10.5, fontWeight: activo ? 700 : 600 }}>{l.corto}</span>
                  </button>
                );
              })}
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 14, padding: "0 2px" }}>
              <p style={{ fontSize: 10.5, color: "var(--text-muted)", lineHeight: 1.4 }}>
                Escribe: {LIBROS[libro].escribe}
                {!puedeEscribir && <span style={{ opacity: 0.75 }}> · sólo lectura para tu perfil</span>}
              </p>
              <button onClick={() => setIntegridadAbierta(true)} className="btn-tap"
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 10px", borderRadius: 9, border: "1px solid var(--border-glass)", background: "none", color: "var(--color-success)", fontWeight: 600, fontSize: 10.5, minHeight: "auto", flexShrink: 0 }}>
                <ShieldCheck size={13} /> Verificar
              </button>
            </div>

            {/* Búsqueda */}
            <div style={{ position: "relative", marginBottom: 12 }}>
              <Search size={16} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar en el libro…"
                className="glass-panel" style={{ width: "100%", borderRadius: 14, padding: "12px 12px 12px 40px", outline: "none", color: "var(--text-main)", fontSize: 13 }} />
            </div>

            {/* Filtros */}
            <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 12 }}>
              {["Todas", ...Object.keys(CATEGORIAS)].map((c) => {
                const activo = filtro === c;
                const texto = c === "Todas" ? "Todas" : CATEGORIAS[c].corto;
                return (
                  <button key={c} onClick={() => setFiltro(c)} className="btn-tap"
                    style={{ flexShrink: 0, fontSize: 11, fontWeight: 600, padding: "7px 14px", borderRadius: 10, border: "none", minHeight: 32,
                      background: activo ? "var(--accent)" : "var(--bg-glass)", color: activo ? "#fff" : "var(--text-main)",
                      boxShadow: activo ? "0 3px 10px var(--accent-glow)" : "none" }}>
                    {texto}
                  </button>
                );
              })}
            </div>

            {visibles.length === 0 ? (
              <div style={{ textAlign: "center", padding: "56px 24px", color: "var(--text-muted)" }}>
                <ClipboardList size={36} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
                <p style={{ fontSize: 13 }}>No hay folios que coincidan con la búsqueda.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {visibles.map((f) => (
                  <TarjetaFolio key={f.id} folio={f} onAbrir={(x) => setVerFolioId(x.id)}
                    resaltarPendiente={rol.puedeResolver && f.autorRol !== rol.clave && CATEGORIAS_RESOLUBLES.includes(f.categoria)} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {puedeEscribir && tab === "bitacora" && !cargando && (
        <button onClick={() => setNuevoAbierto(true)} className="btn-tap btn-accent"
          style={{ position: "fixed", zIndex: 40, right: 20, bottom: 90, width: 54, height: 54, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", border: "none" }}>
          <Plus size={24} />
        </button>
      )}

      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 30, padding: "8px 20px", paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}>
        <nav className="glass-panel" style={{ borderRadius: 18, display: "flex", padding: 5, gap: 4 }}>
          {[{ clave: "bitacora", texto: "Bitácora", Icono: BookMarked }, { clave: "contrato", texto: "Contrato", Icono: Home }].map(({ clave, texto, Icono }) => {
            const activo = tab === clave;
            return (
              <button key={clave} onClick={() => setTab(clave)} className="btn-tap"
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 0", borderRadius: 14, border: "none",
                  background: activo ? "var(--accent)" : "transparent", color: activo ? "#fff" : "var(--text-muted)",
                  boxShadow: activo ? "0 0 14px var(--accent-glow)" : "none" }}>
                <Icono size={18} strokeWidth={activo ? 2.5 : 2} />
                <span style={{ fontSize: 13, fontWeight: activo ? 700 : 500 }}>{texto}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {nuevoAbierto && (
        <HojaNuevoFolio rol={rol} libro={libro} numero={siguienteNumero}
          onCerrar={() => setNuevoAbierto(false)} onGuardar={guardarNuevo} />
      )}
      {integridadAbierta && (
        <ModalIntegridad libro={libro} folios={folios}
          onCerrar={() => setIntegridadAbierta(false)} onAdulterar={adulterar} />
      )}
      {folioAFirmar && !folioActivo && (
        <ModalFirma folio={folioAFirmar} rol={rol} onFirmar={firmarFolio} onCerrar={() => setFirmarId(null)} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Aplicacion />
    </ErrorBoundary>
  );
}
