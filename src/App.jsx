import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  Building2, MapPin, Hash, TrendingUp, Search, Plus, X, ChevronLeft,
  CircleCheck, CircleX, TriangleAlert, Link2, ClipboardList,
  RefreshCcw, Lock, LogOut, BookMarked, Loader2, Home,
  Sun, Moon, Camera, Image, Save, Edit3, Eye,
  ShieldCheck, Fingerprint, KeyRound, FileSignature, CheckCheck,
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
/*  CONFIGURACIÓN — dominio obra pública MOP                           */
/* ================================================================== */

const CATEGORY_CONFIG = {
  Instrucción:            { color: "var(--color-info)",    bg: "var(--color-info-bg)",    Icon: ClipboardList },
  Avance:                 { color: "#2563EB",               bg: "rgba(37,99,235,0.12)",    Icon: TrendingUp },
  "Recepción de Partida": { color: "var(--color-success)", bg: "var(--color-success-bg)", Icon: CircleCheck },
  Incidente:              { color: "var(--color-danger)",  bg: "var(--color-danger-bg)",  Icon: TriangleAlert },
  Modificación:           { color: "var(--color-warning)", bg: "var(--color-warning-bg)", Icon: RefreshCcw },
};

// Roles — dominio obra pública MOP
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

// Credenciales demo — 3 roles
const MOCK_CREDENTIALS = {
  "cristian":   { password: "123", role: "inspector_fiscal" },
  "mauricio":   { password: "123", role: "admin_contrato" },
  "prevencion": { password: "123", role: "prevencionista" },
};

// Contratos — obra pública MOP (no DOM municipal)
const PROJECTS = [
  {
    id: 1,
    name: "Mejoramiento Ruta 5 Norte, Huentelauquén",
    address: "Ruta 5 Norte, km 392–418, Región de Coquimbo",
    permit: "MOP-VIALIDAD-0842/2025",
    progress: 47,
  },
  {
    id: 2,
    name: "Construcción Puente Sobre Río Toltén",
    address: "Ruta 199, km 12, Temuco, Araucanía",
    permit: "MOP-VIALIDAD-0317/2025",
    progress: 21,
  },
  {
    id: 3,
    name: "Habilitación Camino a Porvenir, T. del Fuego",
    address: "Ruta Y-71, km 0–45, Región de Magallanes",
    permit: "MOP-VIALIDAD-1103/2024",
    progress: 88,
  },
  {
    id: 4,
    name: "Edificio de Servicios MOP, Aysén",
    address: "Av. Baquedano 650, Coyhaique, Región de Aysén",
    permit: "MOP-ARQ-0056/2025",
    progress: 9,
  },
];

// Folios demo — lenguaje real de obra pública MOP
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
      category: "Recepción de Partida",
      title: "Recepción de terraplén km 0–15",
      body: "El Inspector Fiscal verifica la construcción del terraplén entre km 0 y km 15, con material de préstamo de la cantera autorizada C-03. Se realizaron 18 ensayos de compactación, todos con valores superiores al 95% DPMS exigido. La cota de proyecto se cumple con variaciones inferiores a ±2 cm según nivelación diferencial. Se aprueba la partida.",
      resultado: "Aprobado", creatorRole: "inspector_fiscal", creatorName: "Cristián Manríquez",
      createdAt: "2026-05-20T11:00:00", status: "firmado", signedAt: "2026-05-20T11:08:00",
      signature: { code: "MOP-2024-202-GH" }, refFolio: null, geo: null, photos: [], comments: [],
    },
    {
      id: 33, folioNumber: 3,
      category: "Recepción de Partida",
      title: "Recepción de carpeta asfáltica km 0–12",
      body: "Se verifica la colocación de carpeta asfáltica AC-10 en el tramo km 0–12. Testigos extraídos: 6 unidades. Espesor promedio: 6,1 cm (mín. exigido 6,0 cm). Porcentaje de vacíos promedio: 4,8% (rango aceptable 3–6%). Resistencia a la compresión diametral promedio: 1.220 kPa (mín. exigido 800 kPa). Partida aprobada sin observaciones.",
      resultado: "Aprobado", creatorRole: "inspector_fiscal", creatorName: "Cristián Manríquez",
      createdAt: "2026-07-30T09:45:00", status: "firmado", signedAt: "2026-07-30T09:52:00",
      signature: { code: "MOP-2024-203-IJ" }, refFolio: null, geo: null, photos: [], comments: [],
    },
  ],
  4: [
    {
      id: 41, folioNumber: 1,
      category: "Instrucción",
      title: "Instrucción de entrega de terreno y condicionantes iniciales",
      body: "El Inspector Fiscal procede a la entrega formal de terreno del contrato MOP-ARQ-0056/2025, Edificio de Servicios MOP, Coyhaique. Condicionantes: (1) el acceso de maquinaria respetará la servidumbre de paso sur de 4,0 m; (2) las excavaciones se ejecutarán con entibación según estudio de mecánica; (3) se prohíbe maquinaria pesada los días sábado, domingo y festivos por ordenanza municipal.",
      resultado: null, creatorRole: "inspector_fiscal", creatorName: "Cristián Manríquez",
      createdAt: "2026-09-01T08:30:00", status: "firmado", signedAt: "2026-09-01T08:38:00",
      signature: { code: "MOP-2025-301-KL" }, refFolio: null, geo: null, photos: [], comments: [],
    },
    {
      id: 42, folioNumber: 2,
      category: "Avance",
      title: "Inicio de excavación de fundaciones sector A",
      body: "El Administrador de Contrato informa el inicio de la excavación de fundaciones en el sector A del Edificio de Servicios MOP. La excavación se realiza con retroexcavadora CAT 320 con entibación metálica según diseño provisional aprobado. Profundidad de proyecto: -3,5 m del nivel de pavimento. Volumen estimado: 480 m³.",
      resultado: null, creatorRole: "admin_contrato", creatorName: "Mauricio Jilabert",
      createdAt: "2026-09-08T14:00:00", status: "borrador",
      signedAt: null, signature: null, refFolio: null, geo: null, photos: [], comments: [],
    },
  ],
};

/* ================================================================== */
/*  SERVICIOS                                                          */
/* ================================================================== */
const netDelay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

const authService = {
  async login(email, password) {
    await netDelay();
    const account = MOCK_CREDENTIALS[email.trim().toLowerCase()];
    if (!account || account.password !== password) throw new Error("Usuario o contraseña incorrectos.");
    return { token: "mock.jwt." + btoa(email).slice(0, 12), role: account.role, user: ROLES[account.role] };
  },
};

const folioService = {
  // Crea borrador (producción: POST /api/v1/folios/)
  async create(p) { await netDelay(300); return { ...p, createdAt: new Date().toISOString() }; },

  // Firma electrónica avanzada (producción: POST /api/v1/folios/:id/firmar/)
  // Simula la consulta al proveedor de FEA y devuelve el folio firmado con código.
  async sign(folio) {
    await netDelay(800);
    const code = "MOP-" + new Date().getFullYear() + "-" +
      String(folio.folioNumber).padStart(3, "0") + "-" +
      Math.random().toString(36).slice(2, 4).toUpperCase() +
      Math.floor(10 + Math.random() * 89);
    return { ...folio, status: "firmado", signedAt: new Date().toISOString(), signature: { code } };
  },

  // Aprueba o rechaza (producción: POST /api/v1/folios/:id/resolver/)
  async resolve(id, resultado) { await netDelay(400); return { id, resultado }; },
};

/* ================================================================== */
/*  UTILIDADES                                                         */
/* ================================================================== */
function formatDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function foliostr(n) { return String(n).padStart(3, "0"); }

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
/*  MODAL DE FIRMA ELECTRÓNICA AVANZADA                                */
/*  Flujo: advertencia legal → PIN simulado → biometría → confirmación */
/* ================================================================== */
function SignatureModal({ folio, role, onCancel, onSigned }) {
  const currentRole = ROLES[role];
  // "warning" → "pin" → "bio" → "done"
  const [step, setStep] = useState("warning");
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [signing, setSigning] = useState(false);

  function submitPin() {
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      setPinError("Ingresa el PIN de 4 dígitos de tu certificado digital.");
      return;
    }
    setPinError("");
    setStep("bio");
  }

  async function runBiometric() {
    setSigning(true);
    try {
      // Punto de integración real: WebAuthn / SDK del proveedor de FEA
      // (p.ej. navigator.credentials.get(...)). Aquí se simula la respuesta.
      const signed = await folioService.sign(folio);
      setStep("done");
      setTimeout(() => onSigned(signed), 900);
    } catch {
      setSigning(false);
      setStep("pin");
      setPinError("No se pudo completar la firma. Reintenta.");
    }
  }

  return (
    <div
      className="fade-in"
      style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(0,0,0,0.72)" }}
      onClick={step !== "done" ? onCancel : undefined}
    >
      <div
        className="sheet-enter"
        style={{ width: "100%", maxWidth: 480, borderRadius: "24px 24px 0 0", padding: 28, background: "var(--bg-canvas)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: "var(--color-info-bg)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <ShieldCheck size={22} style={{ color: "var(--color-info)" }} />
          </div>
          <div style={{ flex: 1 }}>
            <p className="font-display" style={{ fontSize: 16, fontWeight: 700 }}>Firma Electrónica Avanzada</p>
            <p style={{ fontSize: 11, color: "var(--text-muted)" }}>Folio N°{foliostr(folio.folioNumber)} · {folio.category}</p>
          </div>
          {step !== "done" && (
            <button onClick={onCancel} style={{ padding: 6, background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}><X size={20} /></button>
          )}
        </div>

        {/* PASO 1 — Advertencia legal */}
        {step === "warning" && (
          <>
            <div style={{ borderRadius: 14, padding: "14px 16px", marginBottom: 16, background: "var(--color-danger-bg)", border: "1px solid rgba(239,68,68,0.25)" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--color-danger)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <TriangleAlert size={15} /> Advertencia legal
              </p>
              <p style={{ fontSize: 13, lineHeight: 1.7, color: "var(--text-main)" }}>
                Al firmar, el folio queda <strong>bloqueado</strong>: no podrá editarse ni eliminarse. Los folios firmados son <strong>inmutables</strong> conforme al Reglamento de Contratos de Obra Pública (RCOP).
              </p>
            </div>
            <div style={{ borderRadius: 12, padding: "12px 14px", marginBottom: 20, background: "var(--bg-glass)", border: "1px solid var(--border-glass)", fontSize: 12 }}>
              <p style={{ color: "var(--text-muted)", marginBottom: 2 }}>Firmante</p>
              <p style={{ fontWeight: 700, marginBottom: 8 }}>{currentRole.name}</p>
              <p style={{ color: "var(--text-muted)", marginBottom: 2 }}>Rol</p>
              <p style={{ fontWeight: 600 }}>{currentRole.label}</p>
            </div>
            <button
              onClick={() => setStep("pin")}
              className="btn-tap btn-accent"
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px 0", borderRadius: 14, border: "none", fontWeight: 700, fontSize: 15 }}
            >
              <FileSignature size={18} /> Continuar con la firma
            </button>
            <button
              onClick={onCancel}
              style={{ width: "100%", marginTop: 10, padding: "12px 0", borderRadius: 14, border: "none", background: "none", color: "var(--text-muted)", fontWeight: 600, fontSize: 14, cursor: "pointer" }}
            >
              Cancelar
            </button>
          </>
        )}

        {/* PASO 2 — PIN del certificado */}
        {step === "pin" && (
          <>
            <label style={{ ...labelStyle, display: "flex", alignItems: "center", gap: 6 }}>
              <KeyRound size={14} /> PIN del certificado digital
            </label>
            <input
              value={pin}
              onChange={(e) => { setPin(e.target.value.replace(/\D/g, "").slice(0, 4)); setPinError(""); }}
              type="password"
              inputMode="numeric"
              autoFocus
              placeholder="••••"
              style={{ ...inputStyle, textAlign: "center", letterSpacing: "0.5em", fontSize: 26, fontWeight: 700, marginBottom: pinError ? 6 : 4 }}
            />
            {pinError && (
              <p style={{ fontSize: 12, color: "var(--color-danger)", marginBottom: 12 }}>{pinError}</p>
            )}
            <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 20 }}>
              Para la demo, cualquier combinación de 4 dígitos es válida.
            </p>
            <button
              onClick={submitPin}
              className="btn-tap btn-accent"
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px 0", borderRadius: 14, border: "none", fontWeight: 700, fontSize: 15 }}
            >
              Continuar
            </button>
          </>
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
              {signing ? "Validando identidad…" : "Confirma con tu huella"}
            </p>
            <p style={{ fontSize: 12, color: "var(--text-muted)", maxWidth: 260, lineHeight: 1.7, marginBottom: signing ? 0 : 20 }}>
              {signing
                ? "Consultando al proveedor de firma electrónica avanzada…"
                : "Apoya el dedo en el sensor o usa Face ID para autorizar la firma con validez legal."
              }
            </p>
            {!signing && (
              <button
                onClick={() => setStep("pin")}
                style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}
              >
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
            <p className="font-display" style={{ fontSize: 19, fontWeight: 700, marginBottom: 8 }}>¡Folio firmado!</p>
            <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.7 }}>
              El registro fue incorporado a la bitácora de forma inmutable.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  CREAR NUEVO FOLIO                                                  */
/* ================================================================== */
function NewFolioSheet({ role, nextFolioNumber, onClose, onSave }) {
  const currentRole = ROLES[role];
  const [category, setCategory] = useState(currentRole.categories[0] || "Avance");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [photos, setPhotos] = useState([]);
  const [saving, setSaving] = useState(false);

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
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 18 }}>
          {currentRole.categories.map((c) => {
            const active = category === c; const cfg = CATEGORY_CONFIG[c]; return (
              <button key={c} onClick={() => setCategory(c)} type="button"
                style={{ fontSize: 12, fontWeight: 600, padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer", background: active ? cfg.bg : "rgba(0,0,0,0.04)", color: active ? cfg.color : "var(--text-muted)" }}>
                {c}
              </button>
            );
          })}
        </div>
        <label style={labelStyle}>Título</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título del folio…" style={inputStyle} />
        <label style={labelStyle}>Descripción técnica</label>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Describe la partida, instrucción o incidente…" rows={5} style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }} />
        <label style={labelStyle}>Evidencia fotográfica</label>
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

const labelStyle = { fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 8 };
const inputStyle = { width: "100%", borderRadius: 12, padding: "13px 14px", marginBottom: 18, background: "rgba(0,0,0,0.04)", border: "1px solid var(--border-glass)", color: "var(--text-main)", outline: "none" };

/* ================================================================== */
/*  DETALLE DE FOLIO                                                   */
/*  · Edición si es borrador propio                                    */
/*  · Botón "Firmar" si es borrador propio (abre SignatureModal)       */
/*  · Botones Aprobar/Rechazar para el Inspector Fiscal                */
/*  · Banner de inmutabilidad si está firmado                          */
/* ================================================================== */
function FolioDetail({ folio, role, onClose, onUpdate }) {
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

  // El folio fue creado por el usuario actual → puede editar y firmar
  const isOwner = folio.creatorRole === role;

  // El Inspector Fiscal puede Aprobar/Rechazar si:
  // - tiene canResolve
  // - el folio está firmado
  // - es Incidente o Recepción de Partida sin resultado aún
  // - NO fue creado por él mismo
  const canResolve =
    currentRole.canResolve &&
    !isDraft &&
    (folio.category === "Incidente" || folio.category === "Recepción de Partida") &&
    folio.resultado === null &&
    folio.creatorRole !== role;

  async function handleSave() {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    onUpdate({ ...folio, title: title.trim(), body: body.trim(), photos });
    setSaving(false);
    setEditing(false);
  }

  function handleSigned(signedFolio) {
    setShowSignModal(false);
    onUpdate(signedFolio);
  }

  async function handleResolve(resultado) {
    setResolving(true);
    await folioService.resolve(folio.id, resultado);
    onUpdate({ ...folio, resultado });
    setResolving(false);
  }

  return (
    <div className="fade-in" style={{ position: "fixed", inset: 0, zIndex: 50, background: "var(--bg-canvas)", overflowY: "auto" }}>
      {/* Header */}
      <div className="glass-panel" style={{ position: "sticky", top: 0, zIndex: 10, padding: "14px 16px", display: "flex", alignItems: "center", gap: 10, borderRadius: 0, borderTop: "none", borderLeft: "none", borderRight: "none" }}>
        <button onClick={onClose} className="btn-tap" style={{ width: 40, height: 40, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "1px solid var(--border-glass)", color: "var(--text-main)", minHeight: 40 }}>
          <ChevronLeft size={20} />
        </button>
        <div style={{ flex: 1 }}>
          <p className="font-display" style={{ fontSize: 15, fontWeight: 700 }}>Folio N°{foliostr(folio.folioNumber)}</p>
          <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{folio.category}</p>
        </div>
        {/* Botón Editar: borrador propio, no editando */}
        {isDraft && isOwner && !editing && (
          <button onClick={() => setEditing(true)} className="btn-tap"
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, border: "1px solid var(--border-glass)", background: "var(--bg-glass)", color: "var(--text-main)", fontWeight: 600, fontSize: 12, minHeight: 36 }}>
            <Edit3 size={14} /> Editar
          </button>
        )}
        {/* Botón Firmar: borrador propio, no editando */}
        {isDraft && isOwner && !editing && (
          <button onClick={() => setShowSignModal(true)} className="btn-tap btn-accent"
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, border: "none", fontWeight: 700, fontSize: 12, minHeight: 36 }}>
            <FileSignature size={14} /> Firmar
          </button>
        )}
      </div>

      <div style={{ padding: 20, maxWidth: 600, margin: "0 auto" }}>
        {/* Banner de inmutabilidad — solo folios firmados */}
        {!isDraft && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, borderRadius: 12, padding: "10px 14px", marginBottom: 16, background: "var(--color-success-bg)", border: "1px solid rgba(16,185,129,0.2)" }}>
            <Lock size={14} style={{ color: "var(--color-success)", flexShrink: 0 }} />
            <p style={{ fontSize: 12, color: "var(--color-success)", fontWeight: 600 }}>
              Folio firmado — Este registro es inmutable conforme al Reglamento de Contratos de Obra Pública.
            </p>
          </div>
        )}

        {/* Badges de estado */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, padding: "5px 12px", borderRadius: 8, background: cfg.bg, color: cfg.color }}><CatIcon size={13} /> {folio.category}</span>
          <span style={{ fontSize: 10, fontWeight: 700, padding: "5px 10px", borderRadius: 6, textTransform: "uppercase", letterSpacing: "0.06em", background: isDraft ? "rgba(0,0,0,0.05)" : "var(--color-success-bg)", color: isDraft ? "var(--text-muted)" : "var(--color-success)" }}>{isDraft ? "Borrador" : "Firmado"}</span>
          {folio.resultado && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, padding: "5px 12px", borderRadius: 8, background: folio.resultado === "Aprobado" ? "var(--color-success-bg)" : "var(--color-danger-bg)", color: folio.resultado === "Aprobado" ? "var(--color-success)" : "var(--color-danger)" }}>
              {folio.resultado === "Aprobado" ? <CircleCheck size={13} /> : <CircleX size={13} />} {folio.resultado}
            </span>
          )}
        </div>

        {/* Contenido editable */}
        {editing ? (
          <>
            <label style={labelStyle}>Título</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} />
            <label style={labelStyle}>Descripción</label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }} />
            <label style={labelStyle}>Evidencia fotográfica</label>
            <PhotoCapture photos={photos} onPhotosChange={setPhotos} />
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={() => { setEditing(false); setTitle(folio.title); setBody(folio.body); setPhotos(folio.photos || []); }}
                className="btn-tap" style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: "1px solid var(--border-glass)", background: "none", color: "var(--text-muted)", fontWeight: 600, fontSize: 14 }}>Cancelar</button>
              <button onClick={handleSave} disabled={saving || !title.trim() || !body.trim()}
                className="btn-tap btn-accent" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "12px 0", borderRadius: 12, border: "none", fontWeight: 600, fontSize: 14, opacity: saving ? 0.6 : 1 }}>
                {saving ? <Loader2 size={16} className="spin" /> : <Save size={16} />} Guardar
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="font-display" style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.4, marginBottom: 12 }}>{folio.title}</h2>
            <p style={{ fontSize: 14, lineHeight: 1.8, color: "var(--text-muted)", marginBottom: 20 }}>{folio.body}</p>
            {folio.photos && folio.photos.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Evidencia adjunta</p>
                <div className="photo-grid">{folio.photos.map((p) => <img key={p.id} src={p.preview} alt={p.name} />)}</div>
              </div>
            )}
          </>
        )}

        {/* Botones Aprobar / Rechazar — Inspector Fiscal */}
        {canResolve && !editing && (
          <div style={{ marginTop: 8, marginBottom: 16 }}>
            <p style={labelStyle}>Resolución del Inspector Fiscal</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => handleResolve("Aprobado")}
                disabled={resolving}
                className="btn-tap"
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px 0", borderRadius: 12, border: "none", fontWeight: 700, fontSize: 14, background: "var(--color-success-bg)", color: "var(--color-success)", opacity: resolving ? 0.6 : 1 }}
              >
                {resolving ? <Loader2 size={16} className="spin" /> : <CircleCheck size={18} />} Aprobar
              </button>
              <button
                onClick={() => handleResolve("Rechazado")}
                disabled={resolving}
                className="btn-tap"
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px 0", borderRadius: 12, border: "none", fontWeight: 700, fontSize: 14, background: "var(--color-danger-bg)", color: "var(--color-danger)", opacity: resolving ? 0.6 : 1 }}
              >
                {resolving ? <Loader2 size={16} className="spin" /> : <CircleX size={18} />} Rechazar
              </button>
            </div>
          </div>
        )}

        {/* Metadatos */}
        {!editing && (
          <div className="glass-panel" style={{ borderRadius: 16, padding: 16, marginTop: 10 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 12 }}>
              <div><p style={{ color: "var(--text-muted)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", marginBottom: 2 }}>Creado por</p><p style={{ fontWeight: 600 }}>{folio.creatorName}</p></div>
              <div><p style={{ color: "var(--text-muted)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", marginBottom: 2 }}>Fecha</p><p style={{ fontWeight: 500 }}>{formatDateTime(folio.createdAt)}</p></div>
              {folio.signature && <div><p style={{ color: "var(--text-muted)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", marginBottom: 2 }}>Código de firma</p><p className="font-mono" style={{ fontWeight: 600, fontSize: 11 }}>{folio.signature.code}</p></div>}
              {folio.signedAt && <div><p style={{ color: "var(--text-muted)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", marginBottom: 2 }}>Firmado el</p><p style={{ fontWeight: 500 }}>{formatDateTime(folio.signedAt)}</p></div>}
            </div>
          </div>
        )}
      </div>

      {/* Modal de firma */}
      {showSignModal && (
        <SignatureModal folio={folio} role={role} onCancel={() => setShowSignModal(false)} onSigned={handleSigned} />
      )}
    </div>
  );
}

/* ================================================================== */
/*  FOLIO CARD                                                         */
/* ================================================================== */
function FolioCard({ folio, currentRole, onClick }) {
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
        <span style={{ marginLeft: "auto", fontSize: 9, fontWeight: 700, padding: "3px 7px", borderRadius: 5, textTransform: "uppercase", letterSpacing: "0.06em", background: isDraft ? "rgba(0,0,0,0.05)" : "var(--color-success-bg)", color: isDraft ? "var(--text-muted)" : "var(--color-success)" }}>{isDraft ? "Borrador" : "Firmado"}</span>
      </div>
      <h3 className="font-display" style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.4, marginBottom: 6 }}>{folio.title}</h3>
      <p style={{ fontSize: 12, lineHeight: 1.6, color: "var(--text-muted)", marginBottom: 10, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{folio.body}</p>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTop: "1px solid var(--border-glass)" }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 500, color: "var(--text-muted)" }}>{folio.creatorName}</p>
          <p style={{ fontSize: 10, color: "var(--text-muted)", opacity: 0.6 }}>{formatDateTime(folio.createdAt)}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 500, color: "var(--accent)" }}><Eye size={14} /> Ver</div>
      </div>
    </article>
  );
}

/* ================================================================== */
/*  DASHBOARD                                                          */
/* ================================================================== */
function ProjectScreen({ projects, selectedProjectId, foliosByProject, onSelectProject, onStatClick }) {
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
      {/* Contrato activo */}
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
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Avance físico</span>
            <span className="font-mono" style={{ fontSize: 14, fontWeight: 700, color: "var(--accent)" }}>{project.progress}%</span>
          </div>
          <div style={{ width: "100%", height: 8, borderRadius: 4, background: "rgba(0,0,0,0.08)", overflow: "hidden" }}>
            <div style={{ width: `${project.progress}%`, height: "100%", borderRadius: 4, background: `linear-gradient(90deg, var(--accent), var(--color-info))`, boxShadow: `0 0 12px var(--accent-glow)`, transition: "width 0.6s ease" }} />
          </div>
        </div>
      </div>

      {/* Stats clickables */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
        {stats.map((s) => (
          <button key={s.label} onClick={() => onStatClick(s.filter)} className="glass-panel btn-tap" style={{ borderRadius: 16, padding: "18px 10px", textAlign: "center", cursor: "pointer", minHeight: "auto" }}>
            <p className="font-display" style={{ fontSize: 26, fontWeight: 700, color: s.color }}>{s.value}</p>
            <p style={{ fontSize: 10, marginTop: 3, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>{s.label}</p>
          </button>
        ))}
      </div>

      {/* Lista de contratos */}
      <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Todos los Contratos</p>
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
                  <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{pFolios.length} folios · {p.progress}% avance</p>
                  <p className="font-mono" style={{ fontSize: 10, color: "var(--text-muted)", opacity: 0.7, marginTop: 1 }}>{p.permit}</p>
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
/*  UI COMPONENTS                                                      */
/* ================================================================== */
function ThemeToggle({ isDark, toggleDark }) {
  return (
    <button onClick={toggleDark} className="btn-tap glass-panel" style={{ width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "1px solid var(--border-glass)", color: "var(--text-main)" }} aria-label="Cambiar tema">
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}

function LoginScreen({ onLogin, isDark, toggleDark }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError("");
    if (!email.trim() || !password) { setError("Ingresa tu usuario y contraseña."); return; }
    setLoading(true);
    try { onLogin(await authService.login(email, password)); } catch (e) { setError(e.message); setLoading(false); }
  }

  return (
    <div className="fade-in login-bg" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "40px 24px" }}>
      <div style={{ position: "absolute", top: 16, right: 16, zIndex: 10 }}><ThemeToggle isDark={isDark} toggleDark={toggleDark} /></div>
      <div style={{ width: "100%", maxWidth: 380, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div className="glass-panel" style={{ width: 64, height: 64, borderRadius: 20, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
            <BookMarked size={32} style={{ color: "var(--accent)" }} />
          </div>
          <h1 className="font-display" style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 6 }}>Libro de Obra Digital</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Contratos de Obra Pública MOP · Bitácora inmutable</p>
        </div>
        <div className="glass-panel" style={{ borderRadius: 24, padding: 28 }}>
          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>Usuario</label>
            <input value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }} type="text" autoCapitalize="none" placeholder="cristian" style={{ ...inputStyle, marginBottom: 0 }} />
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>Contraseña</label>
            <input value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }} type="password" placeholder="••••••••" onKeyDown={(e) => e.key === "Enter" && handleSubmit()} style={{ ...inputStyle, marginBottom: 0 }} />
          </div>
          {error && (<div className="fade-in" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, borderRadius: 14, padding: "12px 14px", marginBottom: 16, background: "var(--color-danger-bg)", color: "var(--color-danger)" }}><TriangleAlert size={16} style={{ flexShrink: 0 }} /> {error}</div>)}
          <button onClick={handleSubmit} disabled={loading} className="btn-tap btn-accent" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 15, fontWeight: 600, borderRadius: 14, padding: "14px 0", border: "none", opacity: loading ? 0.7 : 1 }}>
            {loading ? <Loader2 size={18} className="spin" /> : <Lock size={17} />} {loading ? "Verificando…" : "Ingresar"}
          </button>
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border-glass)", textAlign: "center" }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Accesos Demo</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { user: "cristian · 123", role: "Inspector Fiscal MOP" },
                { user: "mauricio · 123", role: "Administrador de Contrato" },
                { user: "prevencion · 123", role: "Prevencionista de Riesgos" },
              ].map((c) => (
                <div key={c.user} style={{ borderRadius: 10, padding: "8px 12px", background: "rgba(0,0,0,0.03)", border: "1px solid var(--border-glass)" }}>
                  <p className="font-mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>{c.user}</p>
                  <p style={{ fontSize: 10, color: "var(--text-muted)", opacity: 0.7 }}>{c.role}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  APP PRINCIPAL                                                      */
/* ================================================================== */
function AppContent() {
  const [session, setSession] = useState(null);
  const [foliosByProject, setFoliosByProject] = useState({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("bitacora");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Todas");
  const [showNew, setShowNew] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(PROJECTS[0].id);
  const [viewingFolio, setViewingFolio] = useState(null);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) root.classList.add("dark"); else root.classList.remove("dark");
  }, [isDark]);

  const role = session?.role;
  const currentRole = role ? ROLES[role] : null;
  const folios = foliosByProject[selectedProjectId] || [];

  useEffect(() => {
    if (!session) return;
    setLoading(true);
    const timer = setTimeout(() => { setFoliosByProject({ ...ALL_FOLIOS }); setLoading(false); }, 500);
    return () => clearTimeout(timer);
  }, [session]);

  const nextFolioNumber = useMemo(() => Math.max(0, ...folios.map((f) => f.folioNumber)) + 1, [folios]);

  const visibleFolios = useMemo(() => {
    if (!role) return [];
    return folios
      .filter((f) => {
        if (categoryFilter === "Todas") return true;
        if (categoryFilter === "__firmados") return f.status === "firmado";
        return f.category === categoryFilter;
      })
      .filter((f) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return f.title.toLowerCase().includes(q) || f.body.toLowerCase().includes(q) || String(f.folioNumber).includes(q);
      })
      .sort((a, b) => b.folioNumber - a.folioNumber);
  }, [folios, role, categoryFilter, search]);

  const handleLogout = useCallback(() => {
    setSession(null); setFoliosByProject({}); setTab("bitacora");
    setSearch(""); setCategoryFilter("Todas"); setViewingFolio(null);
  }, []);

  function handleNewFolioSave(folio) {
    setFoliosByProject((prev) => ({ ...prev, [selectedProjectId]: [...(prev[selectedProjectId] || []), folio] }));
    setShowNew(false);
  }

  function handleUpdateFolio(updated) {
    setFoliosByProject((prev) => ({ ...prev, [selectedProjectId]: (prev[selectedProjectId] || []).map((f) => f.id === updated.id ? updated : f) }));
    setViewingFolio(updated);
  }

  function handleStatClick(filter) { setCategoryFilter(filter); setTab("bitacora"); }

  if (!session) return <LoginScreen onLogin={setSession} isDark={isDark} toggleDark={() => setIsDark(!isDark)} />;

  if (viewingFolio) {
    return (
      <FolioDetail
        folio={viewingFolio}
        role={role}
        onClose={() => setViewingFolio(null)}
        onUpdate={handleUpdateFolio}
      />
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
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
            <p style={{ fontSize: 12, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em" }}>Sincronizando…</p>
          </div>
        ) : tab === "obra" ? (
          <ProjectScreen projects={PROJECTS} selectedProjectId={selectedProjectId} foliosByProject={foliosByProject} onSelectProject={setSelectedProjectId} onStatClick={handleStatClick} />
        ) : (
          <div style={{ padding: 20 }}>
            {/* Selector de contratos */}
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

            {/* Buscador */}
            <div style={{ position: "relative", marginBottom: 14 }}>
              <Search size={16} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar en bitácora…"
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

            {visibleFolios.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 24px", color: "var(--text-muted)" }}>
                <ClipboardList size={36} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
                <p style={{ fontSize: 13 }}>No se encontraron folios.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {visibleFolios.map((folio) => <FolioCard key={folio.id} folio={folio} currentRole={currentRole} onClick={setViewingFolio} />)}
              </div>
            )}
          </div>
        )}
      </main>

      {/* FAB — crear folio */}
      {currentRole.canCreate && tab === "bitacora" && !loading && (
        <button onClick={() => setShowNew(true)} className="btn-tap btn-accent"
          style={{ position: "fixed", zIndex: 40, right: 20, bottom: 90, width: 54, height: 54, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", border: "none" }}>
          <Plus size={24} />
        </button>
      )}

      {/* Barra de navegación inferior */}
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

      {showNew && <NewFolioSheet role={role} nextFolioNumber={nextFolioNumber} onClose={() => setShowNew(false)} onSave={handleNewFolioSave} />}
    </div>
  );
}

export default function App() { return <ErrorBoundary><AppContent /></ErrorBoundary>; }
