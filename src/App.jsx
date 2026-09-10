import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  Building2, MapPin, TrendingUp, Search, Plus, X, ChevronLeft,
  CircleCheck, CircleX, TriangleAlert, ClipboardList,
  RefreshCcw, Lock, LogOut, BookMarked, Loader2, Home,
  Sun, Moon, Camera, Image, Edit3, Eye,
  ShieldCheck, ShieldAlert, Fingerprint, FileSignature, CheckCheck,
  AlertCircle, Sparkles, CheckSquare, Square, FolderGit2, RefreshCw,
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
/*  CONFIGURACIÓN — Dominio Obra Pública MOP                           */
/* ================================================================== */

const CATEGORY_CONFIG = {
  Instrucción:            { color: "var(--color-info)",    bg: "var(--color-info-bg)",    Icon: ClipboardList },
  Avance:                 { color: "#2563EB",               bg: "rgba(37,99,235,0.12)",    Icon: TrendingUp },
  "Recepción de Partida": { color: "var(--color-success)", bg: "var(--color-success-bg)", Icon: CircleCheck },
  Incidente:              { color: "var(--color-danger)",  bg: "var(--color-danger-bg)",  Icon: TriangleAlert },
  Modificación:           { color: "var(--color-warning)", bg: "var(--color-warning-bg)", Icon: RefreshCcw },
};

// Roles oficiales — dominio obra pública MOP
const ROLES = {
  inspector_fiscal: {
    label: "Inspector Fiscal MOP",
    short: "I.F.",
    name: "Cristián Manríquez",
    canCreate: true,
    canResolve: true,   // Aprueba/rechaza recepciones e incidentes del contratista
    categories: ["Instrucción", "Incidente", "Recepción de Partida"],
  },
  admin_contrato: {
    label: "Administrador de Contrato",
    short: "A.C.",
    name: "Mauricio Jilabert",
    canCreate: true,
    canResolve: false,
    categories: ["Avance", "Incidente", "Modificación", "Recepción de Partida"],
  },
  prevencionista: {
    label: "Prevencionista de Riesgos",
    short: "P.R.",
    name: "Luis Parra",
    canCreate: true,
    canResolve: false,
    categories: ["Incidente"],
  },
};

// Credenciales demo
const MOCK_CREDENTIALS = {
  "cristian":   { password: "123", role: "inspector_fiscal" },
  "mauricio":   { password: "123", role: "admin_contrato" },
  "prevencion": { password: "123", role: "prevencionista" },
};

// Contratos MOP con métricas de Carpeta Digital (Auditoría de Brecha Documental)
const PROJECTS = [
  {
    id: 1,
    name: "Mejoramiento Ruta 5 Norte, Huentelauquén",
    address: "Ruta 5 Norte, km 392–418, Región de Coquimbo",
    permit: "MOP-VIALIDAD-0842/2025",
    progress: 47,
    carpetaDigital: {
      respaldoPct: 22, // Brecha: 47 - 22 = 25% -> Riesgo Alto
      docsCargados: 68,
      docsExigidos: 150,
      almacenamientoGB: "3.4 GB",
      limiteGB: "10.0 GB",
      ensayosPendientes: 14,
    },
  },
  {
    id: 2,
    name: "Construcción Puente Sobre Río Toltén",
    address: "Ruta 199, km 12, Temuco, Araucanía",
    permit: "MOP-VIALIDAD-0317/2025",
    progress: 21,
    carpetaDigital: {
      respaldoPct: 18, // Brecha: 21 - 18 = 3% -> Conforme
      docsCargados: 35,
      docsExigidos: 90,
      almacenamientoGB: "1.8 GB",
      limiteGB: "10.0 GB",
      ensayosPendientes: 2,
    },
  },
  {
    id: 3,
    name: "Habilitación Camino a Porvenir, T. del Fuego",
    address: "Ruta Y-71, km 0–45, Región de Magallanes",
    permit: "MOP-VIALIDAD-1103/2024",
    progress: 88,
    carpetaDigital: {
      respaldoPct: 61, // Brecha: 88 - 61 = 27% -> Riesgo Crítico
      docsCargados: 142,
      docsExigidos: 180,
      almacenamientoGB: "7.9 GB",
      limiteGB: "12.0 GB",
      ensayosPendientes: 26,
    },
  },
  {
    id: 4,
    name: "Edificio de Servicios MOP, Aysén",
    address: "Av. Baquedano 650, Coyhaique, Región de Aysén",
    permit: "MOP-ARQ-0056/2025",
    progress: 9,
    carpetaDigital: {
      respaldoPct: 10, // Brecha: 9 - 10 = -1% -> Al día
      docsCargados: 15,
      docsExigidos: 45,
      almacenamientoGB: "0.8 GB",
      limiteGB: "8.0 GB",
      ensayosPendientes: 0,
    },
  },
];

// Checklists técnicos contextuales según categoría
const CHECKLIST_TEMPLATES = {
  "Recepción de Partida": [
    { id: "ensayo_densidad", label: "Densidad in situ >95% Proctor", text: "Se ejecutaron ensayos de densidad in situ mediante método nuclear, cumpliendo sobre el 95% de la densidad máxima Proctor Modificado." },
    { id: "lab_autocontrol", label: "Certificados de laboratorio acreditado", text: "Se adjuntan certificados del laboratorio de autocontrol acreditado ante el INN." },
    { id: "topografia", label: "Control topográfico y cotas conforme", text: "Control topográfico conforme: espesores y rasantes respetan las tolerancias de las Especificaciones Técnicas." },
    { id: "inspeccion_visual", label: "Inspección visual sin segregaciones", text: "Inspección visual favorable, sin segregaciones, fisuras ni deformaciones en la superficie terminada." },
  ],
  "Incidente": [
    { id: "sin_lesionados", label: "Sin trabajadores lesionados graves", text: "Se constata que no hubo trabajadores con lesiones de consideración; se verificaron signos vitales y primeros auxilios." },
    { id: "protocolo_ds40", label: "Activación de protocolo DS 40", text: "Se activó el protocolo interno de contingencia y notificación inmediata a la jefatura de prevención de riesgos." },
    { id: "perimetro_seguro", label: "Área perimetrada y faena detenida", text: "El sector afectado fue acordonado con balizas reflectantes; faena paralizada preventivamente en el tramo." },
    { id: "aviso_mop", label: "Aviso formal a Inspección Fiscal", text: "Se emitió reporte preliminar radial y telefónico al Inspector Fiscal del contrato dentro de los 30 minutos." },
  ],
  "Avance": [
    { id: "maquinaria_op", label: "Maquinaria con check-list diario", text: "Equipos pesados operando con check-list de preuso al día y operadores con licencia municipal y examen al día." },
    { id: "clima_favorable", label: "Condiciones climáticas aptas", text: "Condiciones meteorológicas favorables para la faena, sin precipitaciones ni vientos que afecten la calidad." },
    { id: "volumen_cubicado", label: "Cubicación diaria verificada", text: "Volumen diario cubicado conforme a mediciones de terreno y registrado en planilla de avance físico." },
  ],
  "Instrucción": [
    { id: "plazo_rcop", label: "Plazo expreso según Art. 64 RCOP", text: "Se otorga un plazo perentorio de días hábiles conforme al Art. 64 del RCOP para subsanar la observación." },
    { id: "multa_asociada", label: "Apercibimiento de multa contractual", text: "El incumplimiento en el plazo señalado facultará a la Inspección Fiscal para cursar la multa estipulada en bases." },
  ],
  "Modificación": [
    { id: "justificacion_tecnica", label: "Justificación técnica anexa", text: "La propuesta cuenta con memoria explicativa del proyectista y no altera las condiciones de seguridad vial." },
    { id: "sin_aumento_plazo", label: "Sin afectación de ruta crítica", text: "La modificación no genera extensión de plazo contractual ni altera la fecha programada de entrega de obra." },
  ],
};

/* ================================================================== */
/*  MOTOR CRIPTOGRÁFICO — Cadena de Hashes SHA-256 (Inmutabilidad)     */
/* ================================================================== */

const GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000";

// Normalización canónica para sellado inmutable
function canonicalFolio(f) {
  return JSON.stringify({
    n: f.folioNumber,
    c: f.category,
    t: f.title.trim(),
    b: f.body.trim(),
    cr: f.creatorRole,
    cn: f.creatorName,
    ca: f.createdAt,
    sa: f.signedAt || "",
    p: (f.photos || []).map((photo) => photo.name || ""),
  });
}

// SHA-256 con Web Crypto API y fallback determinista seguro
async function sha256(text) {
  try {
    if (globalThis.crypto && globalThis.crypto.subtle) {
      const data = new TextEncoder().encode(text);
      const buffer = await globalThis.crypto.subtle.digest("SHA-256", data);
      return Array.from(new Uint8Array(buffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    }
  } catch (err) {
    console.warn("crypto.subtle no disponible, se utiliza fallback determinista", err);
  }
  let h1 = 0xdeadbeef, h2 = 0x41c64e6d, h3 = 0x85ebca6b, h4 = 0xc2b2ae35;
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ (ch + i), 1597334677);
    h3 = Math.imul(h3 ^ (ch * 31), 2246822507);
    h4 = Math.imul(h4 ^ (ch + 7), 3266489909);
  }
  const toHex = (n) => (n >>> 0).toString(16).padStart(8, "0");
  return (toHex(h1) + toHex(h2) + toHex(h3) + toHex(h4)).repeat(2);
}

// Auditoría forense: recalcula matemáticamente toda la cadena del proyecto
async function auditFolioChain(folios) {
  const signed = folios
    .filter((f) => f.status === "firmado")
    .sort((a, b) => a.folioNumber - b.folioNumber);

  const results = [];
  let previousHash = GENESIS_HASH;
  let isBroken = false;

  for (const f of signed) {
    const canon = canonicalFolio(f);
    const expectedHash = await sha256(canon + "|" + previousHash);
    const storedHash = f.signature?.hash;
    const storedPrev = f.signature?.previousHash;

    const matches = storedHash === expectedHash && storedPrev === previousHash;
    const status = isBroken ? "cadena_comprometida" : (matches ? "integro" : "adulterado");
    if (!matches) isBroken = true;

    results.push({
      folio: f,
      status, // "integro" | "adulterado" | "cadena_comprometida"
      expectedHash,
      storedHash: storedHash || "NO_FIRMADO",
      storedPrev: storedPrev || "NINGUNO",
      previousHashExpected: previousHash,
    });

    previousHash = storedHash || expectedHash;
  }
  return results;
}

// Sella de forma válida los folios iniciales demo
async function sealInitialFolios(allFolios) {
  const result = {};
  for (const [projectId, list] of Object.entries(allFolios)) {
    let prev = GENESIS_HASH;
    const projectFolios = [];
    for (const f of list) {
      if (f.status === "firmado") {
        const hash = await sha256(canonicalFolio(f) + "|" + prev);
        projectFolios.push({
          ...f,
          signature: {
            code: f.signature?.code || `MOP-2025-${String(f.folioNumber).padStart(3, "0")}-QA`,
            hash,
            previousHash: prev,
            method: "FEA Avanzada + SHA-256 (e-Sign)",
          },
        });
        prev = hash;
      } else {
        projectFolios.push({ ...f });
      }
    }
    result[projectId] = projectFolios;
  }
  return result;
}

function shortHash(hash, len = 14) {
  if (!hash) return "—";
  if (hash === GENESIS_HASH) return "GÉNESIS (0000…0000)";
  return hash.slice(0, len) + "…";
}

/* ================================================================== */
/*  FOLIOS DEMO INICIALES — Lenguaje Técnico de Obra Pública MOP       */
/* ================================================================== */
const ALL_FOLIOS = {
  1: [
    {
      id: 11, folioNumber: 1,
      category: "Instrucción",
      title: "Instrucción de refuerzo de berma sur km 401,2",
      body: "El Inspector Fiscal instruye reforzar la berma del costado sur en el km 401,2 de la Ruta 5 Norte, cuyo talud presenta socavación por escorrentía. Se exige berma mínima de 2,0 m y compactación al 95% de la densidad Proctor. Plazo de ejecución: 5 días hábiles desde la presente instrucción, conforme al Art. 64 del RCOP.",
      resultado: null, creatorRole: "inspector_fiscal", creatorName: "Cristián Manríquez",
      createdAt: "2026-08-05T09:10:00", status: "firmado", signedAt: "2026-08-05T09:18:00",
      signature: { code: "MOP-2025-001-KR" }, refFolio: null, geo: { lat: -31.6021, lng: -71.5432 }, photos: [], comments: [],
    },
    {
      id: 12, folioNumber: 2,
      category: "Avance",
      title: "Avance de excavación caja vial km 395–399",
      body: "El Administrador de Contrato informa término de la excavación de caja vial entre los km 395 y km 399 de la Ruta 5 Norte. Volumen ejecutado: 12.400 m³ de un total de 26.000 m³ proyectados para el tramo. Se adjuntan cubicaciones diarias. Avance físico acumulado en partida de excavación: 47,7%.",
      resultado: null, creatorRole: "admin_contrato", creatorName: "Mauricio Jilabert",
      createdAt: "2026-08-12T16:30:00", status: "firmado", signedAt: "2026-08-12T16:38:00",
      signature: { code: "MOP-2025-002-LN" }, refFolio: null, geo: null, photos: [], comments: [],
    },
    {
      id: 13, folioNumber: 3,
      category: "Incidente",
      title: "Volcamiento de camión aljibe km 403,7",
      body: "A las 11:35 hrs se produjo el volcamiento de un camión aljibe marca Mercedes-Benz, patente BGJR-17, en el km 403,7 al intentar revertir en zona de pendiente. El operador sufrió contusiones menores y fue trasladado al Hospital de Illapel. Se activa protocolo de accidente según DS 40. Faena paralizada en el sector hasta inspección de carabineros y mutual.",
      resultado: null, creatorRole: "prevencionista", creatorName: "Luis Parra",
      createdAt: "2026-08-19T11:52:00", status: "firmado", signedAt: "2026-08-19T12:05:00",
      signature: { code: "MOP-2025-003-QP" }, refFolio: null, geo: { lat: -31.6198, lng: -71.5501 }, photos: [], comments: [],
    },
    {
      id: 14, folioNumber: 4,
      category: "Recepción de Partida",
      title: "Recepción de base granular km 395–398",
      body: "El Inspector Fiscal verifica en terreno la compactación de la base granular colocada entre los km 395 y km 398. Se realizaron 12 ensayos de densidad in situ con densímetro nuclear: 11 resultados superan el 98% de la densidad máxima Proctor Modificado; 1 ensayo en km 396,4 arrojó 96,8% y fue corregido y reensayado con resultado satisfactorio. Se aprueba la partida para continuar con la subbase asfáltica.",
      resultado: "Aprobado", creatorRole: "inspector_fiscal", creatorName: "Cristián Manríquez",
      createdAt: "2026-08-28T10:15:00", status: "firmado", signedAt: "2026-08-28T10:22:00",
      signature: { code: "MOP-2025-004-TV" }, refFolio: null, geo: null, photos: [], comments: [],
    },
    {
      id: 15, folioNumber: 5,
      category: "Modificación",
      title: "Propuesta de cambio de sección transversal km 406–410",
      body: "El Administrador de Contrato solicita modificar la sección transversal del tramo km 406–410, cambiando de calzada única de 7,3 m a calzada de 6,5 m con bandas de emergencia de 2,0 m a cada costado, dado el ancho del predio expropiado disponible. El cambio debe ser evaluado por el proyectista y aprobado por la Dirección Regional de Vialidad.",
      resultado: null, creatorRole: "admin_contrato", creatorName: "Mauricio Jilabert",
      createdAt: "2026-09-02T14:20:00", status: "borrador",
      signedAt: null, signature: null, refFolio: null, geo: null, photos: [], comments: [],
    },
  ],
  2: [
    {
      id: 21, folioNumber: 1,
      category: "Instrucción",
      title: "Instrucción de inicio de trabajos y acta de entrega de terreno",
      body: "El Inspector Fiscal instruye el inicio formal de los trabajos del contrato MOP-VIALIDAD-0317/2025, Construcción Puente Sobre Río Toltén. Se deja constancia de la entrega de terreno realizada el día de hoy, con acceso al sector de emplazamiento en la Ruta 199, km 12. El Administrador de Contrato debe presentar el programa de trabajo definitivo dentro de los 15 días siguientes conforme al Art. 46 del RCOP.",
      resultado: null, creatorRole: "inspector_fiscal", creatorName: "Cristián Manríquez",
      createdAt: "2026-07-01T09:00:00", status: "firmado", signedAt: "2026-07-01T09:08:00",
      signature: { code: "MOP-2025-101-AB" }, refFolio: null, geo: null, photos: [], comments: [],
    },
    {
      id: 22, folioNumber: 2,
      category: "Avance",
      title: "Instalación de faenas y campamento",
      body: "Se informa la instalación completa de las faenas de obra: oficina modular (24 m²), bodega de materiales (48 m²), laboratorio de terreno, baños químicos (6 unidades) y generador de 80 kVA. El cierre perimetral con malla tipo Acmafor se extiende 320 m lineales cubriendo el perímetro del área de trabajo.",
      resultado: null, creatorRole: "admin_contrato", creatorName: "Mauricio Jilabert",
      createdAt: "2026-07-10T17:00:00", status: "firmado", signedAt: "2026-07-10T17:09:00",
      signature: { code: "MOP-2025-102-CD" }, refFolio: null, geo: null, photos: [], comments: [],
    },
    {
      id: 23, folioNumber: 3,
      category: "Incidente",
      title: "Hallazgo de restos de cimentación de puente antiguo",
      body: "Durante las excavaciones para la pila N°2, a 2,3 m de profundidad se detectan restos de cimentación de ciclópeo de un puente anterior no documentado en los planos de referencia. Se paraliza la excavación en el sector y se notifica al proyectista estructural. Se estima un atraso de 5 a 8 días hábiles en la pila N°2.",
      resultado: null, creatorRole: "admin_contrato", creatorName: "Mauricio Jilabert",
      createdAt: "2026-07-22T10:45:00", status: "borrador",
      signedAt: null, signature: null, refFolio: null, geo: null, photos: [], comments: [],
    },
  ],
  3: [
    {
      id: 31, folioNumber: 1,
      category: "Avance",
      title: "Término de escarpe y limpieza de faja vial km 0–22",
      body: "Se informa la finalización del escarpe y limpieza de la faja vial entre los km 0 y km 22 del camino a Porvenir. Se removieron 3.200 m³ de material orgánico y vegetación. El material no apto fue depositado en el botadero autorizado B-01 (53°31'S / 70°52'O). La faena se desarrolló sin incidentes de seguridad.",
      resultado: null, creatorRole: "admin_contrato", creatorName: "Mauricio Jilabert",
      createdAt: "2026-04-15T16:20:00", status: "firmado", signedAt: "2026-04-15T16:30:00",
      signature: { code: "MOP-2024-201-EF" }, refFolio: null, geo: null, photos: [], comments: [],
    },
    {
      id: 32, folioNumber: 2,
      category: "Instrucción",
      title: "Medidas preventivas por temporada invernal extrema",
      body: "El Inspector Fiscal instruye a la empresa contratista implementar de inmediato el plan de contingencia invernal: acopio de sal y cloruro de calcio para deshielo, turnos de 24 hrs para despeje de nieve con motoniveladora y habilitación de refugios de emergencia cada 15 km en la Ruta Y-71.",
      resultado: null, creatorRole: "inspector_fiscal", creatorName: "Cristián Manríquez",
      createdAt: "2026-05-02T10:00:00", status: "firmado", signedAt: "2026-05-02T10:12:00",
      signature: { code: "MOP-2024-202-GH" }, refFolio: null, geo: null, photos: [], comments: [],
    },
  ],
  4: [
    {
      id: 41, folioNumber: 1,
      category: "Instrucción",
      title: "Entrega de terreno y acta de inicio edificación MOP",
      body: "Se suscribe el Acta de Entrega de Terreno para las obras del nuevo Edificio de Servicios MOP en Coyhaique. Se hace entrega de las coordenadas georreferenciadas y los mojones de deslinde predial. El contratista dispone de 10 días para ingresar el Plan de Gestión Ambiental.",
      resultado: null, creatorRole: "inspector_fiscal", creatorName: "Cristián Manríquez",
      createdAt: "2026-08-20T11:00:00", status: "firmado", signedAt: "2026-08-20T11:15:00",
      signature: { code: "MOP-2025-301-JK" }, refFolio: null, geo: null, photos: [], comments: [],
    },
  ],
};

/* ================================================================== */
/*  SERVICIOS                                                          */
/* ================================================================== */
const netDelay = (ms = 350) => new Promise((r) => setTimeout(r, ms));

const authService = {
  async login(email, password) {
    await netDelay();
    const account = MOCK_CREDENTIALS[email.trim().toLowerCase()];
    if (!account || account.password !== password) throw new Error("Usuario o contraseña incorrectos.");
    return { token: "mock.jwt." + btoa(email).slice(0, 12), role: account.role, user: ROLES[account.role] };
  },
};

const folioService = {
  async create(p) { await netDelay(250); return { ...p, createdAt: new Date().toISOString() }; },

  async sign(folio, previousHash = GENESIS_HASH) {
    await netDelay(600);
    const signedAt = new Date().toISOString();
    const code = "MOP-" + new Date().getFullYear() + "-" +
      String(folio.folioNumber).padStart(3, "0") + "-" +
      Math.random().toString(36).slice(2, 4).toUpperCase() +
      Math.floor(10 + Math.random() * 89);

    const signedCandidate = { ...folio, status: "firmado", signedAt };
    const hash = await sha256(canonicalFolio(signedCandidate) + "|" + previousHash);

    return {
      ...signedCandidate,
      signature: {
        code,
        hash,
        previousHash,
        method: "FEA Avanzada + SHA-256 (e-Sign)",
      },
    };
  },

  async resolve(id, resultado) { await netDelay(300); return { id, resultado }; },
};

/* ================================================================== */
/*  UTILIDADES                                                         */
/* ================================================================== */
function formatDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function foliostr(n) { return String(n).padStart(3, "0"); }

const labelStyle = { fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 8 };
const inputStyle = { width: "100%", borderRadius: 12, padding: "13px 14px", marginBottom: 18, background: "rgba(0,0,0,0.04)", border: "1px solid var(--border-glass)", color: "var(--text-main)", outline: "none" };

/* ================================================================== */
/*  CAPTURA DE FOTOS                                                   */
/* ================================================================== */
function PhotoCapture({ photos, onPhotosChange }) {
  const fileRef = useRef(null);
  function handleCapture(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const newPhotos = files.map((file) => ({ id: Date.now() + Math.random(), file, preview: URL.createObjectURL(file), name: file.name }));
    onPhotosChange([...photos, ...newPhotos]);
    e.target.value = "";
  }
  function removePhoto(id) {
    const photo = photos.find((p) => p.id === id);
    if (photo?.preview) URL.revokeObjectURL(photo.preview);
    onPhotosChange(photos.filter((p) => p.id !== id));
  }
  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: photos.length > 0 ? 12 : 0 }}>
        <button type="button" onClick={() => { fileRef.current.setAttribute("capture", "environment"); fileRef.current.click(); }}
          className="btn-tap" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 0", borderRadius: 12, border: "1px solid var(--border-glass)", background: "var(--bg-glass)", color: "var(--text-main)", fontWeight: 600, fontSize: 13 }}>
          <Camera size={18} /> Cámara
        </button>
        <button type="button" onClick={() => { fileRef.current.removeAttribute("capture"); fileRef.current.click(); }}
          className="btn-tap" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 0", borderRadius: 12, border: "1px solid var(--border-glass)", background: "var(--bg-glass)", color: "var(--text-main)", fontWeight: 600, fontSize: 13 }}>
          <Image size={18} /> Galería
        </button>
        <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleCapture} style={{ display: "none" }} />
      </div>
      {photos.length > 0 && (
        <div className="photo-grid">
          {photos.map((p) => (
            <div key={p.id} style={{ position: "relative" }}>
              <img src={p.preview} alt={p.name} />
              <button onClick={() => removePhoto(p.id)} style={{ position: "absolute", top: 4, right: 4, width: 22, height: 22, borderRadius: "50%", background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><X size={12} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  CHECKLIST ASISTIDO PARA REDACCIÓN EN TERRENO                       */
/* ================================================================== */
function QuickChecklist({ category, onInsertText }) {
  const templates = CHECKLIST_TEMPLATES[category] || [];
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    setSelectedIds([]);
  }, [category]);

  if (templates.length === 0) return null;

  function toggleItem(item) {
    const isChecked = selectedIds.includes(item.id);
    const next = isChecked ? selectedIds.filter((id) => id !== item.id) : [...selectedIds, item.id];
    setSelectedIds(next);
    onInsertText(item.text, !isChecked);
  }

  function handleInsertAll() {
    const unselected = templates.filter((t) => !selectedIds.includes(t.id));
    unselected.forEach((t) => onInsertText(t.text, true));
    setSelectedIds(templates.map((t) => t.id));
  }

  return (
    <div style={{ marginBottom: 18, padding: 14, borderRadius: 14, background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.18)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          <Sparkles size={14} /> Asistente Técnico ({category})
        </span>
        <button type="button" onClick={handleInsertAll} style={{ background: "none", border: "none", fontSize: 11, fontWeight: 600, color: "var(--accent)", cursor: "pointer" }}>
          + Insertar todo
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {templates.map((item) => {
          const active = selectedIds.includes(item.id);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => toggleItem(item)}
              style={{
                display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 8,
                background: active ? "var(--color-info-bg)" : "rgba(255,255,255,0.4)",
                border: active ? "1px solid var(--color-info)" : "1px solid rgba(0,0,0,0.06)",
                textAlign: "left", cursor: "pointer", fontSize: 11, color: active ? "var(--color-info)" : "var(--text-main)",
                transition: "all 0.2s ease",
              }}
            >
              {active ? <CheckSquare size={14} color="var(--color-info)" /> : <Square size={14} color="var(--text-muted)" />}
              <span style={{ fontWeight: active ? 600 : 500 }}>{item.label}</span>
            </button>
          );
        })}
      </div>
      <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 8, opacity: 0.75 }}>
        Toca un ítem para insertar automáticamente la redacción técnica estandarizada al texto.
      </p>
    </div>
  );
}

/* ================================================================== */
/*  MODAL DE FIRMA ELECTRÓNICA AVANZADA (FEA)                          */
/* ================================================================== */
function SignatureModal({ folio, role, onCancel, onSigned }) {
  const currentRole = ROLES[role];
  const [step, setStep] = useState("terms"); // "terms" | "pin" | "bio" | "done"
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [signing, setSigning] = useState(false);

  function handlePinSubmit() {
    if (pin.length < 4) {
      setPinError("Ingresa tu PIN de 4 dígitos");
      return;
    }
    setPinError("");
    setStep("bio");
  }

  async function runBiometric() {
    setSigning(true);
    await netDelay(900);
    setSigning(false);
    setStep("done");
    await netDelay(650);
    onSigned();
  }

  return (
    <div className="fade-in" style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "rgba(0,0,0,0.72)" }} onClick={onCancel}>
      <div className="sheet-enter glass-panel" style={{ width: "100%", maxWidth: 440, borderRadius: 24, padding: 26, background: "var(--bg-canvas)", border: "1px solid var(--border-glass)" }} onClick={(e) => e.stopPropagation()}>
        
        {/* Encabezado */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--color-info-bg)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-info)" }}>
              <FileSignature size={18} />
            </div>
            <div>
              <h3 className="font-display" style={{ fontSize: 16, fontWeight: 700 }}>Firma Electrónica Avanzada</h3>
              <p style={{ fontSize: 11, color: "var(--text-muted)" }}>Sellado criptográfico SHA-256 e inmutabilidad MOP</p>
            </div>
          </div>
          <button onClick={onCancel} style={{ padding: 6, background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}><X size={20} /></button>
        </div>

        {/* PASO 1 — Términos legales */}
        {step === "terms" && (
          <div>
            <div style={{ padding: 14, borderRadius: 14, background: "var(--color-warning-bg)", border: "1px solid rgba(245,158,11,0.3)", marginBottom: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--color-warning)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4, display: "flex", alignItems: "center", gap: 5 }}>
                <TriangleAlert size={14} /> Advertencia Legal
              </p>
              <p style={{ fontSize: 12, color: "var(--text-main)", lineHeight: 1.6 }}>
                Al firmar con FEA, el folio quedará <strong>bloqueado de forma irreversible</strong> mediante un sello criptográfico encadenado. No podrá ser modificado ni eliminado por ninguna de las partes conforme a la Ley 19.799 y normativa MOP.
              </p>
            </div>

            <div style={{ padding: 12, borderRadius: 12, background: "rgba(0,0,0,0.04)", fontSize: 12, marginBottom: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ color: "var(--text-muted)" }}>Folio</span>
                <span className="font-mono" style={{ fontWeight: 700 }}>N°{foliostr(folio.folioNumber)} · {folio.category}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ color: "var(--text-muted)" }}>Firmante</span>
                <span style={{ fontWeight: 600 }}>{currentRole.name} ({currentRole.short})</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Estándar</span>
                <span style={{ fontWeight: 600, color: "var(--color-info)" }}>SHA-256 + FEA Certificada</span>
              </div>
            </div>

            <button onClick={() => setStep("pin")} className="btn-tap btn-accent" style={{ width: "100%", padding: "14px 0", borderRadius: 14, border: "none", fontWeight: 700, fontSize: 14 }}>
              Continuar al PIN de Seguridad
            </button>
          </div>
        )}

        {/* PASO 2 — PIN */}
        {step === "pin" && (
          <div>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
              Ingresa tu PIN de firma de 4 dígitos (Demo: cualquier 4 dígitos).
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 16 }}>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} style={{ width: 48, height: 56, borderRadius: 12, border: "2px solid " + (pin.length > i ? "var(--accent)" : "var(--border-glass)"), background: pin.length > i ? "var(--accent-glow)" : "rgba(0,0,0,0.03)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 700 }}>
                  {pin.length > i ? "•" : ""}
                </div>
              ))}
            </div>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              autoFocus
              onChange={(e) => { setPin(e.target.value.replace(/\D/g, "").slice(0, 4)); setPinError(""); }}
              placeholder="Escribe 4 dígitos…"
              style={{ ...inputStyle, textAlign: "center", letterSpacing: "0.2em", fontSize: 16, marginBottom: 8 }}
            />
            {pinError && <p style={{ color: "var(--color-danger)", fontSize: 12, marginBottom: 12, textAlign: "center" }}>{pinError}</p>}
            <button onClick={handlePinSubmit} disabled={pin.length < 4} className="btn-tap btn-accent" style={{ width: "100%", padding: "14px 0", borderRadius: 14, border: "none", fontWeight: 700, fontSize: 14, opacity: pin.length < 4 ? 0.5 : 1 }}>
              Validar PIN
            </button>
          </div>
        )}

        {/* PASO 3 — Biometría */}
        {step === "bio" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", paddingTop: 8, paddingBottom: 12 }}>
            <button
              onClick={runBiometric}
              disabled={signing}
              className="btn-tap"
              aria-label="Validar con biometría"
              style={{
                width: 120, height: 120, borderRadius: "50%", border: "none",
                display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20,
                cursor: signing ? "default" : "pointer",
                background: "var(--color-info-bg)",
                boxShadow: signing ? "none" : "0 0 0 10px rgba(99,102,241,0.1), 0 0 0 20px rgba(99,102,241,0.05)",
                transition: "box-shadow 0.4s ease",
              }}
            >
              {signing
                ? <Loader2 size={52} className="spin" style={{ color: "var(--color-info)" }} />
                : <Fingerprint size={60} style={{ color: "var(--color-info)" }} />
              }
            </button>
            <p className="font-display" style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>
              {signing ? "Sellando criptográficamente…" : "Confirma con tu huella o Face ID"}
            </p>
            <p style={{ fontSize: 12, color: "var(--text-muted)", maxWidth: 280, lineHeight: 1.7, marginBottom: signing ? 0 : 20 }}>
              {signing
                ? "Calculando resumen SHA-256 e incorporando a la cadena inmutable…"
                : "Apoya el dedo en el sensor o usa Face ID para autorizar el sellado legal."
              }
            </p>
            {!signing && (
              <button onClick={() => setStep("pin")} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}>
                <ChevronLeft size={15} /> Volver al PIN
              </button>
            )}
          </div>
        )}

        {/* PASO 4 — Confirmación */}
        {step === "done" && (
          <div className="fade-in" style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", paddingTop: 8, paddingBottom: 20 }}>
            <div style={{ width: 90, height: 90, borderRadius: "50%", background: "var(--color-success-bg)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
              <CheckCheck size={48} style={{ color: "var(--color-success)" }} />
            </div>
            <p className="font-display" style={{ fontSize: 19, fontWeight: 700, marginBottom: 8 }}>¡Folio Sellado con Éxito!</p>
            <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.7 }}>
              El registro fue incorporado a la cadena criptográfica SHA-256 de forma inmutable.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  PANTALLA DE AUDITORÍA Y VERIFICACIÓN FORENSE (SHA-256)             */
/* ================================================================== */
function IntegrityVerificationModal({ project, folios, onTamper, onRestore, isTampered, onClose }) {
  const [verifying, setVerifying] = useState(true);
  const [auditData, setAuditData] = useState([]);

  const runAudit = useCallback(async () => {
    setVerifying(true);
    await netDelay(400);
    const results = await auditFolioChain(folios);
    setAuditData(results);
    setVerifying(false);
  }, [folios]);

  useEffect(() => {
    runAudit();
  }, [runAudit]);

  const allValid = auditData.length > 0 && auditData.every((r) => r.status === "integro");
  const brokenIndex = auditData.findIndex((r) => r.status !== "integro");

  return (
    <div className="fade-in" style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(0,0,0,0.75)" }} onClick={onClose}>
      <div className="sheet-enter glass-panel" style={{ width: "100%", maxWidth: 580, maxHeight: "90vh", overflowY: "auto", borderRadius: 24, padding: 24, background: "var(--bg-canvas)", border: "1px solid var(--border-glass)" }} onClick={(e) => e.stopPropagation()}>
        
        {/* Cabecera del modal */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: allValid ? "var(--color-success-bg)" : "var(--color-danger-bg)", color: allValid ? "var(--color-success)" : "var(--color-danger)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {allValid ? <ShieldCheck size={22} /> : <ShieldAlert size={22} />}
            </div>
            <div>
              <h2 className="font-display" style={{ fontSize: 17, fontWeight: 700 }}>Auditoría Forense de Integridad</h2>
              <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{project.name}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ padding: 6, background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}><X size={22} /></button>
        </div>

        {/* Estado global de la cadena */}
        {verifying ? (
          <div style={{ padding: 30, textAlign: "center", color: "var(--text-muted)" }}>
            <Loader2 size={32} className="spin" style={{ margin: "0 auto 12px", color: "var(--accent)" }} />
            <p style={{ fontSize: 13, fontWeight: 600 }}>Recalculando resúmenes criptográficos SHA-256…</p>
          </div>
        ) : (
          <div>
            <div style={{ padding: 16, borderRadius: 16, marginBottom: 18, background: allValid ? "var(--color-success-bg)" : "var(--color-danger-bg)", border: `1px solid ${allValid ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                {allValid ? <ShieldCheck size={20} color="var(--color-success)" /> : <ShieldAlert size={20} color="var(--color-danger)" />}
                <p className="font-display" style={{ fontSize: 15, fontWeight: 700, color: allValid ? "var(--color-success)" : "var(--color-danger)" }}>
                  {allValid ? `Cadena 100% Íntegra (${auditData.length} Folios Firmados)` : `¡Alerta de Adulteración Detectada!`}
                </p>
              </div>
              <p style={{ fontSize: 12, color: "var(--text-main)", lineHeight: 1.6 }}>
                {allValid
                  ? "Todos los folios firmados coinciden matemáticamente con su hash SHA-256 y están encadenados secuencialmente desde el bloque Génesis. Inviolabilidad acreditada ante Contraloría y MOP."
                  : `Inconsistencia detectada a partir del Folio N°${auditData[brokenIndex]?.folio.folioNumber}. El contenido del registro no genera el hash original firmado digitalmente. La cadena posterior queda invalidada.`}
              </p>
            </div>

            {/* Cuadro de demostración comercial: Simulación de Fraude */}
            <div style={{ padding: 14, borderRadius: 14, background: "rgba(0,0,0,0.03)", border: "1px dashed var(--border-glass)", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: 6 }}>
                  <Sparkles size={13} /> Demostración de Resistencia a Fraude
                </span>
                <span style={{ fontSize: 10, color: isTampered ? "var(--color-danger)" : "var(--color-success)", fontWeight: 700 }}>
                  {isTampered ? "SIMULACIÓN ACTIVA" : "ESTADO REAL"}
                </span>
              </div>
              <p style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5, marginBottom: 12 }}>
                Simula una modificación no autorizada directa en la base de datos para comprobar cómo el recálculo criptográfico detecta al instante el engaño.
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                {!isTampered ? (
                  <button onClick={onTamper} className="btn-tap" style={{ flex: 1, padding: "9px 12px", borderRadius: 10, border: "none", background: "var(--color-danger-bg)", color: "var(--color-danger)", fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <AlertCircle size={14} /> Simular adulteración en Folio N°2
                  </button>
                ) : (
                  <button onClick={onRestore} className="btn-tap" style={{ flex: 1, padding: "9px 12px", borderRadius: 10, border: "none", background: "var(--color-success-bg)", color: "var(--color-success)", fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <RefreshCw size={14} /> Restaurar integridad original
                  </button>
                )}
              </div>
            </div>

            {/* Visualización de la cadena de bloques */}
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
              Bloques Encadenados (Génesis → Último)
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
              {/* Bloque Génesis */}
              <div style={{ padding: "10px 14px", borderRadius: 12, background: "rgba(0,0,0,0.02)", border: "1px solid var(--border-glass)", fontSize: 11 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 700, color: "var(--text-muted)" }}>[BLOQUE GÉNESIS]</span>
                  <span className="font-mono" style={{ fontSize: 10, color: "var(--text-muted)" }}>{shortHash(GENESIS_HASH, 20)}</span>
                </div>
              </div>

              {auditData.map((item) => {
                const isOk = item.status === "integro";
                const isTamperedItem = item.status === "adulterado";
                return (
                  <div
                    key={item.folio.id}
                    style={{
                      padding: 14, borderRadius: 14,
                      background: isOk ? "var(--bg-glass)" : (isTamperedItem ? "var(--color-danger-bg)" : "rgba(239,68,68,0.06)"),
                      border: `1px solid ${isOk ? "var(--border-glass)" : "var(--color-danger)"}`,
                      transition: "all 0.3s ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span className="font-mono" style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 5, background: "var(--accent)", color: "#fff" }}>
                          N°{foliostr(item.folio.folioNumber)}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 700 }}>{item.folio.title}</span>
                      </div>
                      <span
                        style={{
                          fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6,
                          background: isOk ? "var(--color-success-bg)" : "var(--color-danger-bg)",
                          color: isOk ? "var(--color-success)" : "var(--color-danger)",
                        }}
                      >
                        {isOk ? "✅ ÍNTEGRO" : (isTamperedItem ? "🚨 ADULTERADO" : "⚠️ CADENA ROTA")}
                      </span>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 10, marginTop: 8 }}>
                      <div>
                        <span style={{ color: "var(--text-muted)", display: "block" }}>Hash SHA-256 Sello:</span>
                        <span className="font-mono" style={{ fontWeight: 600, color: isOk ? "var(--text-main)" : "var(--color-danger)" }}>
                          {shortHash(item.storedHash, 16)}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: "var(--text-muted)", display: "block" }}>Hash Bloque Previo:</span>
                        <span className="font-mono" style={{ fontWeight: 600 }}>{shortHash(item.storedPrev, 16)}</span>
                      </div>
                    </div>

                    {!isOk && (
                      <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px dashed rgba(239,68,68,0.3)", fontSize: 11, color: "var(--color-danger)" }}>
                        <strong>Fallo de integridad:</strong> El hash calculado a partir del contenido actual (<code>{shortHash(item.expectedHash, 12)}</code>) no coincide con la firma legal registrada.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <button onClick={onClose} className="btn-tap btn-accent" style={{ width: "100%", padding: "13px 0", borderRadius: 14, border: "none", fontWeight: 700, fontSize: 14 }}>
          Cerrar Auditoría
        </button>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  WIDGET DE BRECHA DOCUMENTAL (CARPETA DIGITAL VS AVANCE FÍSICO)     */
/* ================================================================== */
function DocumentGapWidget({ project, onOpenAudit }) {
  const cd = project.carpetaDigital;
  if (!cd) return null;

  const avanceFisico = project.progress;
  const respaldoPct = cd.respaldoPct;
  const brecha = avanceFisico - respaldoPct; // Si es positiva alta, hay riesgo de fiscalización
  const esAlertaCritica = brecha > 15;

  return (
    <div className="glass-panel" style={{ borderRadius: 20, padding: 18, marginBottom: 16, position: "relative", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: esAlertaCritica ? "var(--color-danger-bg)" : "var(--color-info-bg)", color: esAlertaCritica ? "var(--color-danger)" : "var(--color-info)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FolderGit2 size={17} />
          </div>
          <div>
            <p className="font-display" style={{ fontSize: 14, fontWeight: 700 }}>Auditoría de Carpeta Digital</p>
            <p style={{ fontSize: 10, color: "var(--text-muted)" }}>Control MOP · Art. 108 RCOP</p>
          </div>
        </div>
        <span
          style={{
            fontSize: 10, fontWeight: 700, padding: "4px 8px", borderRadius: 6,
            background: esAlertaCritica ? "var(--color-danger-bg)" : "var(--color-success-bg)",
            color: esAlertaCritica ? "var(--color-danger)" : "var(--color-success)",
          }}
        >
          {esAlertaCritica ? `⚠️ Brecha: -${brecha}%` : `✅ Conforme (-${brecha}%)`}
        </span>
      </div>

      {/* Barras comparativas de avance */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
            <span style={{ color: "var(--text-muted)" }}>Avance Físico de Obra</span>
            <span className="font-mono" style={{ fontWeight: 700, color: "var(--accent)" }}>{avanceFisico}%</span>
          </div>
          <div style={{ width: "100%", height: 6, borderRadius: 3, background: "rgba(0,0,0,0.06)", overflow: "hidden" }}>
            <div style={{ width: `${avanceFisico}%`, height: "100%", borderRadius: 3, background: "var(--accent)" }} />
          </div>
        </div>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
            <span style={{ color: "var(--text-muted)" }}>Respaldo Documental en Carpeta Digital</span>
            <span className="font-mono" style={{ fontWeight: 700, color: esAlertaCritica ? "var(--color-danger)" : "var(--color-success)" }}>{respaldoPct}%</span>
          </div>
          <div style={{ width: "100%", height: 6, borderRadius: 3, background: "rgba(0,0,0,0.06)", overflow: "hidden" }}>
            <div style={{ width: `${respaldoPct}%`, height: "100%", borderRadius: 3, background: esAlertaCritica ? "var(--color-danger)" : "var(--color-success)" }} />
          </div>
        </div>
      </div>

      {/* Alerta de riesgo contractual si hay brecha */}
      {esAlertaCritica ? (
        <div style={{ padding: 10, borderRadius: 10, background: "var(--color-danger-bg)", border: "1px solid rgba(239,68,68,0.2)", marginBottom: 12, fontSize: 11, color: "var(--text-main)", lineHeight: 1.5 }}>
          <strong>Riesgo de Fiscalización:</strong> El avance físico supera por {brecha}% los antecedentes respaldados en la Carpeta Digital. Riesgo de reparo o retención del próximo Estado de Pago.
        </div>
      ) : (
        <div style={{ padding: 10, borderRadius: 10, background: "var(--color-success-bg)", border: "1px solid rgba(16,185,129,0.2)", marginBottom: 12, fontSize: 11, color: "var(--text-main)", lineHeight: 1.5 }}>
          <strong>Documentación al día:</strong> Los ensayos de laboratorio, estados de pago y cubicaciones acompañan el ritmo de avance físico exigido por el MOP.
        </div>
      )}

      {/* Métricas rápidas */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, fontSize: 11, textAlign: "center", marginBottom: 12 }}>
        <div style={{ padding: "8px 4px", borderRadius: 8, background: "rgba(0,0,0,0.03)" }}>
          <p style={{ color: "var(--text-muted)", fontSize: 9, textTransform: "uppercase", fontWeight: 700 }}>Documentos</p>
          <p style={{ fontWeight: 700, marginTop: 2 }}>{cd.docsCargados} / {cd.docsExigidos}</p>
        </div>
        <div style={{ padding: "8px 4px", borderRadius: 8, background: "rgba(0,0,0,0.03)" }}>
          <p style={{ color: "var(--text-muted)", fontSize: 9, textTransform: "uppercase", fontWeight: 700 }}>Espacio Nube</p>
          <p style={{ fontWeight: 700, marginTop: 2 }}>{cd.almacenamientoGB}</p>
        </div>
        <div style={{ padding: "8px 4px", borderRadius: 8, background: "rgba(0,0,0,0.03)" }}>
          <p style={{ color: "var(--text-muted)", fontSize: 9, textTransform: "uppercase", fontWeight: 700 }}>Ensayos S/F</p>
          <p style={{ fontWeight: 700, marginTop: 2, color: cd.ensayosPendientes > 0 ? "var(--color-danger)" : "var(--color-success)" }}>{cd.ensayosPendientes}</p>
        </div>
      </div>

      <button onClick={onOpenAudit} className="btn-tap" style={{ width: "100%", padding: "10px 0", borderRadius: 10, border: "1px solid var(--border-glass)", background: "var(--bg-glass)", color: "var(--text-main)", fontWeight: 600, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
        <ShieldCheck size={15} color="var(--accent)" /> Auditar Integridad Criptográfica (SHA-256)
      </button>
    </div>
  );
}

/* ================================================================== */
/*  CREAR NUEVO FOLIO CON ASISTENTE TÉCNICO                            */
/* ================================================================== */
function NewFolioSheet({ role, nextFolioNumber, onClose, onSave }) {
  const currentRole = ROLES[role];
  const [category, setCategory] = useState(currentRole.categories[0] || "Avance");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [photos, setPhotos] = useState([]);
  const [saving, setSaving] = useState(false);

  function handleInsertText(snippet, add) {
    if (add) {
      setBody((prev) => {
        const trimmed = prev.trim();
        if (!trimmed) return snippet;
        if (trimmed.includes(snippet)) return prev;
        return `${trimmed}\n• ${snippet}`;
      });
    } else {
      setBody((prev) => prev.replace(`• ${snippet}`, "").replace(snippet, "").trim());
    }
  }

  async function handleSave() {
    if (!title.trim() || !body.trim()) return;
    setSaving(true);
    const folio = {
      id: Date.now(), folioNumber: nextFolioNumber, category,
      title: title.trim(), body: body.trim(), resultado: null,
      creatorRole: role, creatorName: currentRole.name,
      createdAt: new Date().toISOString(), status: "borrador",
      signedAt: null, signature: null, refFolio: null, geo: null,
      photos: photos.map((p) => ({ id: p.id, name: p.name, preview: p.preview })), comments: [],
    };
    const created = await folioService.create(folio);
    onSave({ ...folio, createdAt: created.createdAt });
    setSaving(false);
  }

  return (
    <div className="fade-in" style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(0,0,0,0.65)" }} onClick={onClose}>
      <div className="sheet-enter" style={{ width: "100%", maxWidth: 480, maxHeight: "92vh", overflowY: "auto", borderRadius: "24px 24px 0 0", padding: 24, background: "var(--bg-canvas)" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 className="font-display" style={{ fontSize: 18, fontWeight: 700 }}>Nuevo Folio N°{foliostr(nextFolioNumber)}</h2>
          <button onClick={onClose} style={{ padding: 8, background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}><X size={22} /></button>
        </div>

        <label style={labelStyle}>Categoría</label>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
          {currentRole.categories.map((c) => {
            const active = category === c; const cfg = CATEGORY_CONFIG[c]; return (
              <button key={c} onClick={() => setCategory(c)} type="button"
                style={{ fontSize: 12, fontWeight: 600, padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer", background: active ? cfg.bg : "rgba(0,0,0,0.04)", color: active ? cfg.color : "var(--text-muted)" }}>
                {c}
              </button>
            );
          })}
        </div>

        {/* Asistente técnico de redacción */}
        <QuickChecklist category={category} onInsertText={handleInsertText} />

        <label style={labelStyle}>Título del folio</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Solicitud de recepción de subbase granular dm 4.200…" style={inputStyle} />

        <label style={labelStyle}>Descripción técnica y antecedentes</label>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Describe el avance, partida, ensayo o incidente…" rows={6} style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }} />

        <label style={labelStyle}>Evidencia fotográfica en terreno</label>
        <PhotoCapture photos={photos} onPhotosChange={setPhotos} />

        <button onClick={handleSave} disabled={saving || !title.trim() || !body.trim()} className="btn-tap btn-accent"
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 15, fontWeight: 600, borderRadius: 14, padding: "14px 0", border: "none", marginTop: 20, opacity: (saving || !title.trim() || !body.trim()) ? 0.5 : 1 }}>
          {saving ? <Loader2 size={18} className="spin" /> : <Plus size={18} />}
          {saving ? "Guardando…" : "Crear Folio como Borrador"}
        </button>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  DETALLE DE FOLIO CON SELLO CRIPTOGRÁFICO Y ACCIONES                */
/* ================================================================== */
function FolioDetail({ folio, role, latestSignedHash, onOpenAudit, onClose, onUpdate }) {
  const currentRole = ROLES[role];
  const isDraft = folio.status === "borrador";
  const cfg = CATEGORY_CONFIG[folio.category] || CATEGORY_CONFIG["Instrucción"];
  const CatIcon = cfg.Icon;

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(folio.title);
  const [body, setBody] = useState(folio.body);
  const [photos, setPhotos] = useState(folio.photos || []);
  const [saving, setSaving] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [resolving, setResolving] = useState(false);

  const isOwner = folio.creatorRole === role;
  const canResolveThis =
    currentRole.canResolve &&
    !isDraft &&
    !folio.resultado &&
    (folio.category === "Recepción de Partida" || folio.category === "Incidente" || folio.category === "Modificación");

  async function handleSaveEdit() {
    setSaving(true);
    const updated = {
      ...folio,
      title: title.trim(),
      body: body.trim(),
      photos: photos.map((p) => ({ id: p.id, name: p.name, preview: p.preview })),
    };
    await netDelay(200);
    onUpdate(updated);
    setSaving(false);
    setEditing(false);
  }

  async function handleSigned() {
    const signed = await folioService.sign(folio, latestSignedHash || GENESIS_HASH);
    onUpdate(signed);
    setShowSignModal(false);
  }

  async function handleResolve(resultado) {
    setResolving(true);
    await folioService.resolve(folio.id, resultado);
    onUpdate({ ...folio, resultado });
    setResolving(false);
  }

  return (
    <div className="fade-in" style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", flexDirection: "column", background: "var(--bg-canvas)", overflowY: "auto" }}>
      {/* Header */}
      <div className="glass-panel" style={{ position: "sticky", top: 0, zIndex: 10, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderRadius: 0, borderTop: "none", borderLeft: "none", borderRight: "none" }}>
        <button onClick={onClose} className="btn-tap" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "var(--accent)", background: "none", border: "none", cursor: "pointer" }}>
          <ChevronLeft size={20} /> Volver
        </button>
        <span className="font-mono" style={{ fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 8, background: "var(--accent)", color: "#fff" }}>
          N°{foliostr(folio.folioNumber)}
        </span>
      </div>

      <div style={{ padding: 20, maxWidth: 540, margin: "0 auto", width: "100%", paddingBottom: 60 }}>
        {/* Banner de estado legal */}
        <div style={{ padding: "12px 14px", borderRadius: 14, marginBottom: 16, background: isDraft ? "rgba(0,0,0,0.04)" : "var(--color-success-bg)", border: `1px solid ${isDraft ? "var(--border-glass)" : "rgba(16,185,129,0.3)"}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {isDraft ? <Lock size={16} color="var(--text-muted)" /> : <ShieldCheck size={18} color="var(--color-success)" />}
            <span style={{ fontSize: 12, fontWeight: 700, color: isDraft ? "var(--text-muted)" : "var(--color-success)" }}>
              {isDraft ? "Borrador de Trabajo (Modificable)" : "Folio Sellado con FEA (Inmutable)"}
            </span>
          </div>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6, background: cfg.bg, color: cfg.color }}>
            <CatIcon size={12} /> {folio.category}
          </span>
        </div>

        {/* Resolución previa */}
        {folio.resultado && (
          <div style={{ padding: "12px 16px", borderRadius: 14, marginBottom: 16, background: folio.resultado === "Aprobado" ? "var(--color-success-bg)" : "var(--color-danger-bg)", border: `1px solid ${folio.resultado === "Aprobado" ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`, display: "flex", alignItems: "center", gap: 10 }}>
            {folio.resultado === "Aprobado" ? <CircleCheck size={22} color="var(--color-success)" /> : <CircleX size={22} color="var(--color-danger)" />}
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: folio.resultado === "Aprobado" ? "var(--color-success)" : "var(--color-danger)" }}>
                Resolución: {folio.resultado} por la Inspección Fiscal
              </p>
              <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>El Inspector Fiscal se pronunció sobre este registro legal.</p>
            </div>
          </div>
        )}

        {/* Formulario de edición o vista */}
        {editing ? (
          <div>
            <label style={labelStyle}>Título</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} />
            <label style={labelStyle}>Descripción técnica</label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }} />
            <label style={labelStyle}>Evidencia fotográfica</label>
            <PhotoCapture photos={photos} onPhotosChange={setPhotos} />
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button onClick={() => setEditing(false)} className="btn-tap" style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: "1px solid var(--border-glass)", background: "none", color: "var(--text-muted)", fontWeight: 600 }}>Cancelar</button>
              <button onClick={handleSaveEdit} disabled={saving} className="btn-tap btn-accent" style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: "none", fontWeight: 700 }}>
                {saving ? "Guardando…" : "Guardar Cambios"}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <h1 className="font-display" style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.4, marginBottom: 12 }}>{folio.title}</h1>
            <p style={{ fontSize: 14, lineHeight: 1.8, color: "var(--text-main)", whiteSpace: "pre-line", marginBottom: 20 }}>{folio.body}</p>

            {folio.photos && folio.photos.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 8 }}>Evidencia Fotográfica ({folio.photos.length})</p>
                <div className="photo-grid">
                  {folio.photos.map((p) => (
                    <div key={p.id} style={{ borderRadius: 12, overflow: "hidden" }}>
                      <img src={p.preview} alt={p.name} style={{ width: "100%", height: 110, objectFit: "cover" }} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Acciones para folios en Borrador */}
        {isDraft && !editing && isOwner && (
          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            <button onClick={() => setEditing(true)} className="btn-tap" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "13px 0", borderRadius: 12, border: "1px solid var(--border-glass)", background: "var(--bg-glass)", color: "var(--text-main)", fontWeight: 600, fontSize: 13 }}>
              <Edit3 size={16} /> Editar Borrador
            </button>
            <button onClick={() => setShowSignModal(true)} className="btn-tap btn-accent" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "13px 0", borderRadius: 12, border: "none", fontWeight: 700, fontSize: 13 }}>
              <FileSignature size={16} /> Firmar con FEA
            </button>
          </div>
        )}

        {/* Acciones de resolución (Inspector Fiscal) */}
        {canResolveThis && (
          <div className="glass-panel" style={{ borderRadius: 18, padding: 18, marginBottom: 20, border: "1px solid var(--accent)" }}>
            <p className="font-display" style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Pronunciamiento de Inspección Fiscal</p>
            <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5, marginBottom: 14 }}>
              Como Inspector Fiscal, valida o rechaza formalmente esta partida o incidente para fines de Estado de Pago.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => handleResolve("Aprobado")} disabled={resolving} className="btn-tap" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "13px 0", borderRadius: 12, border: "none", fontWeight: 700, fontSize: 13, background: "var(--color-success-bg)", color: "var(--color-success)" }}>
                {resolving ? <Loader2 size={16} className="spin" /> : <CircleCheck size={17} />} Aprobar Partida
              </button>
              <button onClick={() => handleResolve("Rechazado")} disabled={resolving} className="btn-tap" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "13px 0", borderRadius: 12, border: "none", fontWeight: 700, fontSize: 13, background: "var(--color-danger-bg)", color: "var(--color-danger)" }}>
                {resolving ? <Loader2 size={16} className="spin" /> : <CircleX size={17} />} Rechazar
              </button>
            </div>
          </div>
        )}

        {/* Sello criptográfico y metadatos */}
        {!editing && (
          <div className="glass-panel" style={{ borderRadius: 18, padding: 18, marginTop: 10 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <ShieldCheck size={15} color="var(--accent)" /> Registro y Trazabilidad Legal
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 12, marginBottom: 12 }}>
              <div><p style={{ color: "var(--text-muted)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", marginBottom: 2 }}>Creador</p><p style={{ fontWeight: 600 }}>{folio.creatorName}</p></div>
              <div><p style={{ color: "var(--text-muted)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", marginBottom: 2 }}>Fecha Creación</p><p style={{ fontWeight: 500 }}>{formatDateTime(folio.createdAt)}</p></div>
              {folio.signature && <div><p style={{ color: "var(--text-muted)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", marginBottom: 2 }}>Código FEA</p><p className="font-mono" style={{ fontWeight: 700, fontSize: 11, color: "var(--color-info)" }}>{folio.signature.code}</p></div>}
              {folio.signedAt && <div><p style={{ color: "var(--text-muted)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", marginBottom: 2 }}>Sellado el</p><p style={{ fontWeight: 500 }}>{formatDateTime(folio.signedAt)}</p></div>}
            </div>

            {folio.signature?.hash && (
              <div style={{ paddingTop: 12, borderTop: "1px solid var(--border-glass)", fontSize: 11 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ color: "var(--text-muted)", fontSize: 10, fontWeight: 600, textTransform: "uppercase" }}>Sello SHA-256</span>
                  <span className="font-mono" style={{ fontSize: 10, color: "var(--accent)" }}>{shortHash(folio.signature.hash, 16)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ color: "var(--text-muted)", fontSize: 10, fontWeight: 600, textTransform: "uppercase" }}>Bloque Anterior</span>
                  <span className="font-mono" style={{ fontSize: 10, color: "var(--text-muted)" }}>{shortHash(folio.signature.previousHash, 16)}</span>
                </div>
                <button onClick={onOpenAudit} className="btn-tap" style={{ width: "100%", padding: "8px 0", borderRadius: 8, border: "none", background: "var(--color-info-bg)", color: "var(--color-info)", fontWeight: 700, fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                  <ShieldCheck size={13} /> Ver Auditoría de Cadena Completa
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {showSignModal && (
        <SignatureModal folio={folio} role={role} onCancel={() => setShowSignModal(false)} onSigned={handleSigned} />
      )}
    </div>
  );
}

/* ================================================================== */
/*  TARJETA DE FOLIO EN LA BITÁCORA                                    */
/* ================================================================== */
function FolioCard({ folio, onClick }) {
  const cfg = CATEGORY_CONFIG[folio.category] || CATEGORY_CONFIG["Instrucción"];
  const isDraft = folio.status === "borrador";
  const CatIcon = cfg.Icon;
  return (
    <article className="glass-panel fade-in" style={{ borderRadius: 20, padding: 18, cursor: "pointer" }} onClick={() => onClick(folio)}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <span className="font-mono" style={{ fontSize: 10, fontWeight: 700, padding: "4px 8px", borderRadius: 6, background: "var(--accent)", color: "#fff" }}>N°{foliostr(folio.folioNumber)}</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 600, padding: "4px 8px", borderRadius: 6, background: cfg.bg, color: cfg.color }}><CatIcon size={11} /> {folio.category}</span>
        {folio.resultado && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: folio.resultado === "Aprobado" ? "var(--color-success-bg)" : "var(--color-danger-bg)", color: folio.resultado === "Aprobado" ? "var(--color-success)" : "var(--color-danger)" }}>
            {folio.resultado === "Aprobado" ? <CircleCheck size={11} /> : <CircleX size={11} />} {folio.resultado}
          </span>
        )}
        <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 4, fontSize: 9, fontWeight: 700, padding: "3px 7px", borderRadius: 5, textTransform: "uppercase", letterSpacing: "0.06em", background: isDraft ? "rgba(0,0,0,0.05)" : "var(--color-success-bg)", color: isDraft ? "var(--text-muted)" : "var(--color-success)" }}>
          {!isDraft && <ShieldCheck size={11} />}
          {isDraft ? "Borrador" : "Firmado"}
        </span>
      </div>
      <h3 className="font-display" style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.4, marginBottom: 6 }}>{folio.title}</h3>
      <p style={{ fontSize: 12, lineHeight: 1.6, color: "var(--text-muted)", marginBottom: 10, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{folio.body}</p>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTop: "1px solid var(--border-glass)" }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 500, color: "var(--text-muted)" }}>{folio.creatorName}</p>
          <p style={{ fontSize: 10, color: "var(--text-muted)", opacity: 0.6 }}>{formatDateTime(folio.createdAt)}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 500, color: "var(--accent)" }}><Eye size={14} /> Ver Folio</div>
      </div>
    </article>
  );
}

/* ================================================================== */
/*  DASHBOARD DE CONTRATO Y AUDITORÍA                                  */
/* ================================================================== */
function ProjectScreen({ projects, selectedProjectId, foliosByProject, onSelectProject, onStatClick, onOpenAudit }) {
  const project = projects.find((p) => p.id === selectedProjectId);
  const folios = foliosByProject[selectedProjectId] || [];
  const firmados = folios.filter((f) => f.status === "firmado").length;
  const incidentes = folios.filter((f) => f.category === "Incidente").length;

  const stats = [
    { label: "Folios", value: folios.length, color: "var(--accent)", filter: "Todas" },
    { label: "Firmados", value: firmados, color: "var(--color-success)", filter: "__firmados" },
    { label: "Incidentes", value: incidentes, color: "var(--color-danger)", filter: "Incidente" },
  ];

  return (
    <div className="fade-in" style={{ padding: 20 }}>
      {/* Resumen del Contrato Activo */}
      <div className="glass-panel" style={{ borderRadius: 22, padding: 22, marginBottom: 16, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, right: 0, width: 120, height: 120, borderRadius: "50%", background: "var(--accent-glow)", filter: "blur(50px)", pointerEvents: "none" }} />
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14, position: "relative", zIndex: 1 }}>
          <div style={{ width: 42, height: 42, borderRadius: 14, background: "var(--accent-glow)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Building2 size={20} /></div>
          <div>
            <p className="font-display" style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.3 }}>{project.name}</p>
            <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}><MapPin size={11} /> {project.address}</p>
            <p className="font-mono" style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 3 }}>{project.permit}</p>
          </div>
        </div>
      </div>

      {/* Widget de Brecha Documental / Carpeta Digital */}
      <DocumentGapWidget project={project} onOpenAudit={onOpenAudit} />

      {/* Stats clickeables */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
        {stats.map((s) => (
          <button key={s.label} onClick={() => onStatClick(s.filter)} className="glass-panel btn-tap" style={{ borderRadius: 16, padding: "18px 10px", textAlign: "center", cursor: "pointer", minHeight: "auto" }}>
            <p className="font-display" style={{ fontSize: 26, fontWeight: 700, color: s.color }}>{s.value}</p>
            <p style={{ fontSize: 10, marginTop: 3, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>{s.label}</p>
          </button>
        ))}
      </div>

      {/* Lista de Contratos MOP */}
      <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Todos los Contratos MOP</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {projects.map((p) => {
          const active = p.id === selectedProjectId;
          const pFolios = foliosByProject[p.id] || [];
          return (
            <button key={p.id} onClick={() => onSelectProject(p.id)} className="glass-panel btn-tap"
              style={{ borderRadius: 16, padding: 16, textAlign: "left", cursor: "pointer", minHeight: "auto", borderColor: active ? "var(--accent)" : undefined, boxShadow: active ? `0 0 12px var(--accent-glow)` : undefined }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 12, background: active ? "var(--accent)" : "rgba(0,0,0,0.04)", color: active ? "#fff" : "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Building2 size={18} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className="font-display" style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</p>
                  <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{pFolios.length} folios · {p.progress}% avance físico</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  THEME TOGGLE                                                       */
/* ================================================================== */
function ThemeToggle({ isDark, toggleDark }) {
  return (
    <button onClick={toggleDark} className="btn-tap glass-panel" style={{ width: 38, height: 38, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-main)", minHeight: 38 }} aria-label={isDark ? "Modo claro" : "Modo oscuro"}>
      {isDark ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}

/* ================================================================== */
/*  PANTALLA DE LOGIN                                                  */
/* ================================================================== */
function LoginScreen({ onLogin, isDark, toggleDark }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError("");
    try {
      const session = await authService.login(email, password);
      onLogin(session);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, position: "relative" }}>
      <div style={{ position: "absolute", top: 20, right: 20 }}>
        <ThemeToggle isDark={isDark} toggleDark={toggleDark} />
      </div>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, borderRadius: 18, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", boxShadow: `0 0 24px var(--accent-glow)` }}>
            <BookMarked size={28} color="#fff" />
          </div>
          <h1 className="font-display" style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em" }}>Libro de Obra Digital</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 6 }}>Bitácora legal e inmutable para contratos MOP</p>
        </div>
        <div className="glass-panel" style={{ borderRadius: 24, padding: 28 }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>Usuario o Correo</label>
              <input value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }} type="text" autoCapitalize="none" placeholder="cristian / mauricio / prevencion" style={{ ...inputStyle, marginBottom: 0 }} />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>Contraseña</label>
              <input value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }} type="password" placeholder="123" style={{ ...inputStyle, marginBottom: 0 }} />
            </div>
            {error && <p style={{ color: "var(--color-danger)", fontSize: 12, marginBottom: 14, textAlign: "center" }}>{error}</p>}
            <button type="submit" disabled={loading || !email || !password} className="btn-tap btn-accent" style={{ width: "100%", padding: "14px 0", borderRadius: 14, border: "none", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: (loading || !email || !password) ? 0.5 : 1 }}>
              {loading ? <Loader2 size={18} className="spin" /> : <Lock size={18} />}
              {loading ? "Iniciando sesión…" : "Ingresar a la Obra"}
            </button>
          </form>
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border-glass)", textAlign: "center" }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Accesos Demo (Clave: 123)</p>
            <p className="font-mono" style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.8 }}>cristian · Inspector Fiscal MOP</p>
            <p className="font-mono" style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.8 }}>mauricio · Administrador Contrato</p>
            <p className="font-mono" style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.8 }}>prevencion · Prevencionista</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  APLICACIÓN PRINCIPAL (ESTADO GLOBAL)                               */
/* ================================================================== */
function AppContent() {
  const [session, setSession] = useState(null);
  const [foliosByProject, setFoliosByProject] = useState({});
  const [originalBackup, setOriginalBackup] = useState({});
  const [isTampered, setIsTampered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("bitacora");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Todas");
  const [showNew, setShowNew] = useState(false);
  const [showIntegrityModal, setShowIntegrityModal] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(1);
  const [viewingFolio, setViewingFolio] = useState(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  // Inicialización criptográfica garantizada de la bitácora
  useEffect(() => {
    if (!session) return;
    setLoading(true);
    sealInitialFolios(ALL_FOLIOS).then((sealed) => {
      setFoliosByProject(sealed);
      setOriginalBackup(JSON.parse(JSON.stringify(sealed)));
      setLoading(false);
    });
  }, [session]);

  const activeProject = useMemo(() => {
    return PROJECTS.find((p) => p.id === selectedProjectId) || PROJECTS[0];
  }, [selectedProjectId]);

  const projectFolios = useMemo(
    () => foliosByProject[selectedProjectId] || [],
    [foliosByProject, selectedProjectId]
  );

  const latestSignedHash = useMemo(() => {
    const signed = projectFolios
      .filter((f) => f.status === "firmado")
      .sort((a, b) => a.folioNumber - b.folioNumber);
    if (!signed.length) return GENESIS_HASH;
    return signed[signed.length - 1].signature?.hash || GENESIS_HASH;
  }, [projectFolios]);

  const nextFolioNumber = useMemo(() => {
    return Math.max(0, ...projectFolios.map((f) => f.folioNumber)) + 1;
  }, [projectFolios]);

  const visibleFolios = useMemo(() => {
    return projectFolios
      .filter((f) => {
        if (categoryFilter === "__firmados") return f.status === "firmado";
        if (categoryFilter !== "Todas" && f.category !== categoryFilter) return false;
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          f.title.toLowerCase().includes(q) ||
          f.body.toLowerCase().includes(q) ||
          String(f.folioNumber).includes(q)
        );
      })
      .sort((a, b) => b.folioNumber - a.folioNumber);
  }, [projectFolios, categoryFilter, search]);

  function handleLogout() {
    setSession(null);
    setViewingFolio(null);
    setShowNew(false);
  }

  function handleNewFolioSave(newFolio) {
    setFoliosByProject((prev) => ({
      ...prev,
      [selectedProjectId]: [...(prev[selectedProjectId] || []), newFolio],
    }));
    setShowNew(false);
  }

  function handleUpdateFolio(updatedFolio) {
    setFoliosByProject((prev) => ({
      ...prev,
      [selectedProjectId]: (prev[selectedProjectId] || []).map((f) =>
        f.id === updatedFolio.id ? updatedFolio : f
      ),
    }));
    if (viewingFolio?.id === updatedFolio.id) {
      setViewingFolio(updatedFolio);
    }
  }

  function handleStatClick(filter) {
    setCategoryFilter(filter);
    setTab("bitacora");
  }

  // Demostración de resistencia a adulteración para clientes/auditores
  function handleTamperSimulation() {
    setFoliosByProject((prev) => {
      const list = prev[selectedProjectId] || [];
      if (list.length < 2) return prev;
      const modified = list.map((f, i) => {
        if (i === 1) {
          return {
            ...f,
            title: f.title + " [ALTERADO EN BASE DE DATOS]",
            body: f.body + " (Modificación fraudulenta de cubicación posterior a la firma legal)",
          };
        }
        return f;
      });
      return { ...prev, [selectedProjectId]: modified };
    });
    setIsTampered(true);
  }

  function handleRestoreSimulation() {
    setFoliosByProject(JSON.parse(JSON.stringify(originalBackup)));
    setIsTampered(false);
  }

  if (!session) {
    return <LoginScreen onLogin={setSession} isDark={isDark} toggleDark={() => setIsDark(!isDark)} />;
  }

  const { role, user: currentRole } = session;

  if (viewingFolio) {
    return (
      <FolioDetail
        folio={viewingFolio}
        role={role}
        latestSignedHash={latestSignedHash}
        onOpenAudit={() => setShowIntegrityModal(true)}
        onClose={() => setViewingFolio(null)}
        onUpdate={handleUpdateFolio}
      />
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header institucional */}
      <header className="glass-panel" style={{ position: "sticky", top: 0, zIndex: 30, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, borderRadius: 0, borderTop: "none", borderLeft: "none", borderRight: "none" }}>
        <div style={{ width: 38, height: 38, borderRadius: 12, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 0 16px var(--accent-glow)` }}><BookMarked size={18} color="#fff" /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 className="font-display" style={{ fontSize: 15, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Libro de Obra Digital</h1>
          <p style={{ fontSize: 10, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentRole.short} · {currentRole.name}</p>
        </div>
        <ThemeToggle isDark={isDark} toggleDark={() => setIsDark(!isDark)} />
        <button onClick={handleLogout} className="btn-tap glass-panel" style={{ width: 38, height: 38, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-danger)", minHeight: 38 }} aria-label="Salir"><LogOut size={16} /></button>
      </header>

      <main style={{ flex: 1, overflowY: "auto", paddingBottom: 100 }}>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "100px 0", color: "var(--text-muted)" }}>
            <Loader2 size={28} className="spin" style={{ marginBottom: 12, color: "var(--accent)" }} />
            <p style={{ fontSize: 12, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em" }}>Verificando Sello Criptográfico…</p>
          </div>
        ) : tab === "obra" ? (
          <ProjectScreen
            projects={PROJECTS}
            selectedProjectId={selectedProjectId}
            foliosByProject={foliosByProject}
            onSelectProject={setSelectedProjectId}
            onStatClick={handleStatClick}
            onOpenAudit={() => setShowIntegrityModal(true)}
          />
        ) : (
          <div style={{ padding: 20 }}>
            {/* Selector de Contratos */}
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 12 }}>
              {PROJECTS.map((p) => (
                <button key={p.id} onClick={() => setSelectedProjectId(p.id)} className="btn-tap"
                  style={{ flexShrink: 0, fontSize: 11, fontWeight: 600, padding: "7px 14px", borderRadius: 10, border: "none", minHeight: 32,
                    background: p.id === selectedProjectId ? "var(--accent)" : "var(--bg-glass)",
                    color: p.id === selectedProjectId ? "#fff" : "var(--text-muted)",
                    boxShadow: p.id === selectedProjectId ? `0 3px 10px var(--accent-glow)` : "none" }}>
                  {p.name.length > 22 ? p.name.slice(0, 22) + "…" : p.name}
                </button>
              ))}
            </div>

            {/* Píldora de estado de integridad de la bitácora */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 12, background: isTampered ? "var(--color-danger-bg)" : "rgba(16,185,129,0.08)", border: `1px solid ${isTampered ? "var(--color-danger)" : "rgba(16,185,129,0.25)"}`, marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {isTampered ? <ShieldAlert size={16} color="var(--color-danger)" /> : <ShieldCheck size={16} color="var(--color-success)" />}
                <span style={{ fontSize: 11, fontWeight: 700, color: isTampered ? "var(--color-danger)" : "var(--color-success)" }}>
                  {isTampered ? "Alerta: Cadena Criptográfica Alterada" : "Inmutabilidad SHA-256 Acreditada"}
                </span>
              </div>
              <button onClick={() => setShowIntegrityModal(true)} style={{ background: "none", border: "none", fontSize: 11, fontWeight: 700, color: isTampered ? "var(--color-danger)" : "var(--color-success)", cursor: "pointer", textDecoration: "underline" }}>
                Auditar
              </button>
            </div>

            {/* Buscador */}
            <div style={{ position: "relative", marginBottom: 12 }}>
              <Search size={16} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por texto o número de folio…"
                className="glass-panel" style={{ width: "100%", borderRadius: 14, padding: "12px 12px 12px 40px", outline: "none", color: "var(--text-main)", fontSize: 13 }} />
            </div>

            {/* Filtros de categoría */}
            <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 12 }}>
              {["Todas", ...Object.keys(CATEGORY_CONFIG)].map((c) => {
                const active = categoryFilter === c;
                return (
                  <button key={c} onClick={() => setCategoryFilter(c)} className="btn-tap"
                    style={{ flexShrink: 0, fontSize: 11, fontWeight: 600, padding: "7px 14px", borderRadius: 10, border: "none", minHeight: 32,
                      background: active ? "var(--accent)" : "var(--bg-glass)", color: active ? "#fff" : "var(--text-main)",
                      boxShadow: active ? `0 3px 10px var(--accent-glow)` : "none" }}>
                    {c}
                  </button>
                );
              })}
            </div>

            {/* Listado de folios */}
            {visibleFolios.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 24px", color: "var(--text-muted)" }}>
                <ClipboardList size={36} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
                <p style={{ fontSize: 13 }}>No se encontraron folios con el filtro seleccionado.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {visibleFolios.map((folio) => (
                  <FolioCard key={folio.id} folio={folio} onClick={setViewingFolio} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* FAB para crear folio */}
      {currentRole.canCreate && tab === "bitacora" && !loading && (
        <button onClick={() => setShowNew(true)} className="btn-tap btn-accent"
          style={{ position: "fixed", zIndex: 40, right: 20, bottom: 90, width: 54, height: 54, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", border: "none" }}>
          <Plus size={24} />
        </button>
      )}

      {/* Navegación inferior flotante */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 30, padding: "8px 20px", paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}>
        <nav className="glass-panel" style={{ borderRadius: 18, display: "flex", padding: 5, gap: 4 }}>
          {[{ key: "bitacora", label: "Bitácora", Icon: BookMarked }, { key: "obra", label: "Dashboard", Icon: Home }].map(({ key, label, Icon }) => {
            const active = tab === key;
            return (
              <button key={key} onClick={() => setTab(key)} className="btn-tap"
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 0", borderRadius: 14, border: "none",
                  background: active ? "var(--accent)" : "transparent", color: active ? "#fff" : "var(--text-muted)",
                  boxShadow: active ? `0 0 14px var(--accent-glow)` : "none" }}>
                <Icon size={18} strokeWidth={active ? 2.5 : 2} />
                <span style={{ fontSize: 13, fontWeight: active ? 700 : 500 }}>{label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Modales */}
      {showNew && (
        <NewFolioSheet role={role} nextFolioNumber={nextFolioNumber} onClose={() => setShowNew(false)} onSave={handleNewFolioSave} />
      )}

      {showIntegrityModal && (
        <IntegrityVerificationModal
          project={activeProject}
          folios={projectFolios}
          onTamper={handleTamperSimulation}
          onRestore={handleRestoreSimulation}
          isTampered={isTampered}
          onClose={() => setShowIntegrityModal(false)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
