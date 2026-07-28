import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  Building2,
  MapPin,
  Hash,
  TrendingUp,
  Search,
  Plus,
  X,
  ChevronDown,
  ChevronLeft,
  User,
  ShieldCheck,
  FileSignature,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  KeyRound,
  MessageSquare,
  Link2,
  Clock,
  Eye,
  ClipboardList,
  RefreshCcw,
  Lock,
  LogOut,
  BookMarked,
  Fingerprint,
  Camera,
  Crosshair,
  Loader2,
  Trash2,
  Home,
} from "lucide-react";

/* ================================================================== */
/*  1. CONFIGURACIÓN ESTÁTICA DEL DOMINIO                              */
/* ================================================================== */

const CATEGORY_CONFIG = {
  Instrucción: { color: "var(--blueprint)", bg: "var(--blueprint-bg)", Icon: ClipboardList },
  Avance: { color: "var(--slate)", bg: "var(--slate-bg)", Icon: TrendingUp },
  "Recepción de Partida": { color: "var(--approval)", bg: "var(--approval-bg)", Icon: CheckCircle2 },
  Incidente: { color: "var(--incident)", bg: "var(--incident-bg)", Icon: AlertTriangle },
  Modificación: { color: "var(--amend)", bg: "var(--amend-bg)", Icon: RefreshCcw },
};

const ROLES = {
  constructor: {
    label: "Administrador de Obra / Constructor",
    short: "Constructor",
    name: "Felipe Contreras M.",
    canCreate: true,
    canComment: false,
    canResolve: false,
    categories: ["Avance", "Incidente", "Modificación", "Recepción de Partida"],
  },
  ito: {
    label: "ITO — Inspector Técnico de Obra",
    short: "ITO",
    name: "Carla Reyes S.",
    canCreate: true,
    canComment: false,
    canResolve: true, // puede aprobar/rechazar recepciones e incidentes ajenos
    categories: ["Instrucción", "Incidente", "Recepción de Partida"],
  },
  mandante: {
    label: "Propietario / Mandante",
    short: "Mandante",
    name: "Inversiones Andes Ltda.",
    canCreate: false,
    canComment: true,
    canResolve: false,
    categories: [],
  },
};

/* Credenciales simuladas para el login. En producción esto lo resuelve
   el backend contra la tabla de usuarios (ver authService más abajo). */
const MOCK_CREDENTIALS = {
  "felipe@obra.cl": { password: "obra2026", role: "constructor" },
  "carla@ito.cl": { password: "ito2026", role: "ito" },
  "mandante@andes.cl": { password: "andes2026", role: "mandante" },
};

const PROJECT = {
  name: "Edificio Mirador del Parque",
  address: "Av. Las Industrias 4521, Renca, Santiago",
  permit: "DOM-RENCA-0142/2024",
  progress: 62,
};

const INITIAL_FOLIOS = [
  {
    id: 11,
    folioNumber: 11,
    category: "Recepción de Partida",
    title: "Recepción de enfierradura de fundaciones eje A-B",
    body:
      "Se verifica en terreno la enfierradura de fundaciones corridas entre los ejes A y B, conforme a cuantía y diámetros indicados en plano EST-04 rev.2. Separación de estribos @20 cm verificada con huincha. Recubrimiento mínimo de 5 cm cumplido según NCh429. No se observan deficiencias. Se autoriza el hormigonado de la partida.",
    resultado: "Aprobado",
    creatorRole: "ito",
    creatorName: "Carla Reyes S.",
    createdAt: "2026-06-22T09:15:00",
    status: "firmado",
    signedAt: "2026-06-22T09:22:00",
    signature: { code: "AF3-991-KX" },
    refFolio: null,
    geo: { lat: -33.4012, lng: -70.7289 },
    photos: [],
    comments: [],
  },
  {
    id: 12,
    folioNumber: 12,
    category: "Incidente",
    title: "Rotura de matriz de agua potable por retroexcavadora en eje C-3",
    body:
      "Durante excavación de fundaciones en eje C-3, retroexcavadora modelo CAT 320 impactó matriz de agua potable de 110 mm a 1,2 m de profundidad, no georreferenciada en el plano de instalaciones sanitarias entregado por el mandante. Se corta suministro general del sector a las 10:47 hrs. Se notifica a la empresa sanitaria para reparación de emergencia. Sin personal lesionado. Se adjuntará registro fotográfico como anexo.",
    resultado: null,
    creatorRole: "constructor",
    creatorName: "Felipe Contreras M.",
    createdAt: "2026-06-25T10:55:00",
    status: "firmado",
    signedAt: "2026-06-25T11:03:00",
    signature: { code: "AF3-114-QP" },
    refFolio: null,
    geo: { lat: -33.4018, lng: -70.7301 },
    photos: [],
    comments: [],
  },
  {
    id: 13,
    folioNumber: 13,
    category: "Instrucción",
    title: "Refuerzo de moldaje en losa nivel 2 por deflexión observada",
    body:
      "Se instruye reforzar el apuntalamiento del moldaje de losa nivel 2, paño comprendido entre ejes 3-5 / B-D, debido a deflexión superior a la tolerancia admisible detectada en inspección visual. Instalar puntales adicionales @0,8 m según detalle entregado en obra, previo al hormigonado programado. Plazo de ejecución: inmediato, antes de iniciar faena de hormigonado.",
    resultado: null,
    creatorRole: "ito",
    creatorName: "Carla Reyes S.",
    createdAt: "2026-06-29T08:40:00",
    status: "firmado",
    signedAt: "2026-06-29T08:44:00",
    signature: { code: "AF3-227-TV" },
    refFolio: null,
    geo: null,
    photos: [],
    comments: [
      {
        author: "Inversiones Andes Ltda.",
        role: "mandante",
        text: "¿Esto retrasa la fecha de entrega de la losa nivel 2?",
        createdAt: "2026-06-29T14:10:00",
      },
    ],
  },
  {
    id: 14,
    folioNumber: 14,
    category: "Avance",
    title: "Avance semanal — Hormigonado de losa nivel 1 completado",
    body:
      "Se informa término de hormigonado de losa de entrepiso nivel 1, superficie total 480 m², resistencia especificada H-30. Avance físico acumulado de obra gruesa: 62%. Se adjunta cartola de despacho de hormigón N°4482 y registro fotográfico de la faena.",
    resultado: null,
    creatorRole: "constructor",
    creatorName: "Felipe Contreras M.",
    createdAt: "2026-07-03T17:20:00",
    status: "firmado",
    signedAt: "2026-07-03T17:26:00",
    signature: { code: "AF3-305-LR" },
    refFolio: null,
    geo: null,
    photos: [],
    comments: [],
  },
  {
    id: 15,
    folioNumber: 15,
    category: "Modificación",
    title: "Modificación de especificación técnica — Impermeabilización de cubierta",
    body:
      "Se propone modificar el sistema de impermeabilización de cubierta, desde membrana asfáltica soldada a sistema de poliuretano líquido aplicado in situ, a solicitud del mandante por criterio de mayor durabilidad y menor mantención. Pendiente cubicación de costo diferencial y aprobación formal antes de continuar con la faena de cubierta.",
    resultado: null,
    creatorRole: "constructor",
    creatorName: "Felipe Contreras M.",
    createdAt: "2026-07-10T12:05:00",
    status: "borrador",
    signedAt: null,
    signature: null,
    refFolio: null,
    geo: null,
    photos: [],
    comments: [],
  },
];

/* ================================================================== */
/*  2. CAPA DE SERVICIOS (API-READY)                                   */
/*                                                                     */
/*  Toda la I/O de datos vive aquí. Hoy simula latencia de red y usa   */
/*  datos en memoria; mañana se reemplaza el cuerpo de cada función    */
/*  por un fetch() al backend Django/Flask + PostgreSQL sin tocar los  */
/*  componentes. Los contratos (forma de argumentos y retorno) están   */
/*  pensados para calzar 1:1 con endpoints REST.                       */
/* ================================================================== */

// Cambiar a la URL real del backend cuando exista. Ej: DRF sobre Django.
const API_BASE = "/api/v1";

// Simula el retardo de una llamada de red en terreno (3G/4G).
const netDelay = (ms = 550) => new Promise((r) => setTimeout(r, ms));

/*
  Cuando el backend esté listo, cada método se convierte en algo como:

    async list(token) {
      const res = await fetch(`${API_BASE}/folios/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("No se pudo cargar la bitácora");
      return res.json();
    }

  Endpoints REST sugeridos (Django REST Framework / Flask-RESTful):
    POST   /api/v1/auth/login/           -> { token, user }
    GET    /api/v1/proyectos/:id/         -> datos de la obra
    GET    /api/v1/folios/                -> lista de folios del proyecto
    POST   /api/v1/folios/                -> crea borrador o folio firmado
    POST   /api/v1/folios/:id/firmar/     -> aplica firma electrónica avanzada
    POST   /api/v1/folios/:id/resolver/   -> aprueba / rechaza (rol ITO)
    POST   /api/v1/folios/:id/comentarios/-> agrega comentario (rol mandante)
*/

// --- Servicio de autenticación ---
const authService = {
  async login(email, password) {
    await netDelay();
    const account = MOCK_CREDENTIALS[email.trim().toLowerCase()];
    if (!account || account.password !== password) {
      throw new Error("Correo o contraseña incorrectos.");
    }
    // El backend devolvería un JWT; aquí simulamos uno.
    return {
      token: "mock.jwt." + btoa(email).slice(0, 12),
      role: account.role,
      user: ROLES[account.role],
    };
    // Producción:
    // const res = await fetch(`${API_BASE}/auth/login/`, {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ email, password }),
    // });
    // if (!res.ok) throw new Error("Credenciales inválidas");
    // return res.json();
  },
};

// --- Servicio de proyecto ---
const projectService = {
  async get() {
    await netDelay(300);
    return PROJECT;
  },
};

// --- Servicio de folios ---
const folioService = {
  async list() {
    await netDelay();
    return INITIAL_FOLIOS;
  },
  async create(payload) {
    await netDelay(400);
    // El backend asigna id, folioNumber correlativo y timestamps.
    return { ...payload, createdAt: new Date().toISOString() };
  },
  async sign(folio) {
    await netDelay(700); // la firma avanzada consulta al proveedor de identidad
    const code =
      "AF" +
      Math.floor(100 + Math.random() * 899) +
      "-" +
      Math.random().toString(36).slice(2, 6).toUpperCase();
    return { ...folio, status: "firmado", signedAt: new Date().toISOString(), signature: { code } };
  },
  async resolve(folioId, resultado) {
    await netDelay(400);
    return { folioId, resultado };
  },
  async comment(folioId, comment) {
    await netDelay(300);
    return { folioId, comment };
  },
};

/* ================================================================== */
/*  3. UTILIDADES                                                      */
/* ================================================================== */

function formatDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function foliostr(n) {
  return String(n).padStart(3, "0");
}

// Geolocalización real del navegador con respaldo simulado para demo/escritorio.
function capturarUbicacion() {
  return new Promise((resolve) => {
    const fallback = () =>
      resolve({
        lat: -33.4013 + (Math.random() - 0.5) * 0.002,
        lng: -70.7295 + (Math.random() - 0.5) * 0.002,
        sim: true,
      });
    if (!("geolocation" in navigator)) return fallback();
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, sim: false }),
      () => fallback(),
      { enableHighAccuracy: true, timeout: 4000 }
    );
  });
}

/* ================================================================== */
/*  ESTILOS COMPARTIDOS (identidad visual de bitácora legal)           */
/* ================================================================== */

const APP_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');

  .libro-obra-app {
    --ink: #16233B;
    --ink-light: #2C4066;
    --paper: #EDF0F1;
    --paper-card: #FFFFFF;
    --concrete: #666D73;
    --concrete-soft: #8A9096;
    --line: #D7DCDD;

    --blueprint: #2B5F8A;
    --blueprint-bg: #E4EDF3;
    --slate: #5B6472;
    --slate-bg: #E9EAEC;
    --approval: #276749;
    --approval-bg: #E4F0E9;
    --incident: #A8360F;
    --incident-bg: #F5E3DC;
    --amend: #8A5A0B;
    --amend-bg: #F3E9D6;
    --stamp: #9B1C1C;

    font-family: 'Inter', sans-serif;
    color: var(--ink);
    -webkit-tap-highlight-color: transparent;
  }
  .libro-obra-app * { box-sizing: border-box; }
  .libro-obra-app .font-display { font-family: 'Roboto Slab', serif; }
  .libro-obra-app .font-mono { font-family: 'JetBrains Mono', monospace; }

  .libro-obra-app .stamp-box {
    border: 2px solid var(--stamp);
    color: var(--stamp);
    transform: rotate(-2deg);
  }
  .libro-obra-app ::selection { background: var(--ink); color: white; }

  /* Botones grandes, cómodos para el pulgar en terreno (mín. 48px) */
  .libro-obra-app .btn-tap { min-height: 48px; touch-action: manipulation; }
  .libro-obra-app input, .libro-obra-app textarea, .libro-obra-app select { font-size: 16px; } /* evita zoom en iOS */

  .libro-obra-app .sheet-enter { animation: sheetUp .28s cubic-bezier(.2,.8,.2,1); }
  @keyframes sheetUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
  .libro-obra-app .fade-in { animation: fade .2s ease; }
  @keyframes fade { from { opacity: 0; } to { opacity: 1; } }
  .libro-obra-app .spin { animation: spin 1s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  @media (prefers-reduced-motion: reduce) {
    .libro-obra-app .sheet-enter,
    .libro-obra-app .fade-in,
    .libro-obra-app .spin { animation: none; }
  }
  .libro-obra-app :focus-visible { outline: 2px solid var(--blueprint); outline-offset: 2px; }
`;

/* ================================================================== */
/*  4. PANTALLA DE LOGIN                                               */
/* ================================================================== */

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError("");
    if (!email.trim() || !password) {
      setError("Ingresa tu correo y contraseña.");
      return;
    }
    setLoading(true);
    try {
      const session = await authService.login(email, password);
      onLogin(session);
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen w-full flex flex-col justify-center px-6 py-10 fade-in"
      style={{ background: "var(--ink)" }}
    >
      <div className="w-full max-w-sm mx-auto">
        <div className="flex flex-col items-center text-center mb-8" style={{ color: "white" }}>
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "rgba(255,255,255,0.12)" }}
          >
            <BookMarked size={30} />
          </div>
          <h1 className="font-display text-2xl leading-tight tracking-tight">Libro de Obra Digital</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.6)" }}>
            Bitácora legal de obra — foliada e inmutable
          </p>
        </div>

        <div className="rounded-2xl p-6 space-y-4" style={{ background: "var(--paper-card)" }}>
          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--concrete)" }}>
              Correo
            </label>
            <input
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              type="email"
              inputMode="email"
              autoComplete="username"
              placeholder="tu@empresa.cl"
              className="w-full rounded-xl py-3 px-4 focus:outline-none"
              style={{ background: "var(--paper)", border: "1px solid var(--line)" }}
            />
          </div>
          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--concrete)" }}>
              Contraseña
            </label>
            <input
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="w-full rounded-xl py-3 px-4 focus:outline-none"
              style={{ background: "var(--paper)", border: "1px solid var(--line)" }}
            />
          </div>

          {error && (
            <div
              className="flex items-center gap-2 text-sm rounded-xl px-3 py-2.5 fade-in"
              style={{ background: "var(--incident-bg)", color: "var(--incident)" }}
            >
              <AlertTriangle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn-tap w-full flex items-center justify-center gap-2 text-base font-semibold rounded-xl"
            style={{ background: "var(--ink)", color: "white", opacity: loading ? 0.7 : 1 }}
          >
            {loading ? <Loader2 size={18} className="spin" /> : <Lock size={17} />}
            {loading ? "Verificando…" : "Ingresar"}
          </button>

          <div className="pt-1 text-xs leading-relaxed" style={{ color: "var(--concrete-soft)" }}>
            <p className="font-semibold mb-1" style={{ color: "var(--concrete)" }}>
              Cuentas de demostración
            </p>
            <p className="font-mono">felipe@obra.cl · obra2026 — Constructor</p>
            <p className="font-mono">carla@ito.cl · ito2026 — ITO</p>
            <p className="font-mono">mandante@andes.cl · andes2026 — Mandante</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  5. MODAL DE FIRMA ELECTRÓNICA (validación biométrica / token)      */
/* ================================================================== */

function SignatureSheet({ folio, role, onCancel, onSigned }) {
  const currentRole = ROLES[role];
  const [step, setStep] = useState("pin"); // pin -> bio -> done
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [signing, setSigning] = useState(false);

  function submitPin() {
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      setPinError("Ingresa el PIN de 4 dígitos asociado a tu certificado.");
      return;
    }
    setPinError("");
    setStep("bio");
  }

  async function runBiometric() {
    setSigning(true);
    try {
      // Punto de integración real: WebAuthn / SDK del proveedor de FEA
      // (p. ej. navigator.credentials.get(...)). Hoy simulamos el token.
      const signed = await folioService.sign(folio);
      setStep("done");
      setTimeout(() => onSigned(signed), 850);
    } catch {
      setSigning(false);
      setStep("pin");
      setPinError("No se pudo completar la firma. Reintenta.");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center fade-in"
      style={{ background: "rgba(22, 35, 59, 0.6)" }}
      onClick={onCancel}
    >
      <div
        className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl p-6 space-y-5 sheet-enter"
        style={{ background: "var(--paper-card)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "var(--blueprint-bg)" }}
          >
            <ShieldCheck size={20} style={{ color: "var(--blueprint)" }} />
          </div>
          <div className="min-w-0">
            <p className="font-display font-semibold text-base">Firma Electrónica Avanzada</p>
            <p className="text-xs truncate" style={{ color: "var(--concrete)" }}>
              Folio N°{foliostr(folio.folioNumber)} · {folio.category}
            </p>
          </div>
          {step !== "done" && (
            <button onClick={onCancel} className="ml-auto p-2 -mr-2" aria-label="Cerrar">
              <X size={20} style={{ color: "var(--concrete)" }} />
            </button>
          )}
        </div>

        {step === "pin" && (
          <>
            <div className="text-xs rounded-xl p-3 space-y-1" style={{ background: "var(--paper)" }}>
              <p>
                <span style={{ color: "var(--concrete)" }}>Firmante: </span>
                <span className="font-semibold">{currentRole.name}</span>
              </p>
              <p>
                <span style={{ color: "var(--concrete)" }}>Rol: </span>
                <span className="font-semibold">{currentRole.label}</span>
              </p>
              <p style={{ color: "var(--incident)" }}>
                Al firmar, el folio queda bloqueado: no podrá editarse ni eliminarse.
              </p>
            </div>
            <div>
              <label className="text-sm font-semibold flex items-center gap-1.5 mb-2">
                <KeyRound size={15} /> PIN del certificado
              </label>
              <input
                value={pin}
                onChange={(e) => { setPin(e.target.value.replace(/\D/g, "").slice(0, 4)); setPinError(""); }}
                type="password"
                inputMode="numeric"
                autoFocus
                placeholder="••••"
                className="w-full text-center tracking-[0.6em] text-2xl font-mono rounded-xl py-4 focus:outline-none"
                style={{ background: "var(--paper)", border: "1px solid var(--line)" }}
              />
              {pinError && (
                <p className="text-xs mt-2" style={{ color: "var(--incident)" }}>{pinError}</p>
              )}
            </div>
            <button
              onClick={submitPin}
              className="btn-tap w-full flex items-center justify-center gap-2 text-base font-semibold rounded-xl"
              style={{ background: "var(--ink)", color: "white" }}
            >
              Continuar
            </button>
          </>
        )}

        {step === "bio" && (
          <div className="flex flex-col items-center text-center py-4">
            <button
              onClick={runBiometric}
              disabled={signing}
              className="btn-tap relative w-28 h-28 rounded-full flex items-center justify-center mb-4"
              style={{ background: "var(--blueprint-bg)" }}
              aria-label="Validar con biometría"
            >
              {signing ? (
                <Loader2 size={48} className="spin" style={{ color: "var(--blueprint)" }} />
              ) : (
                <Fingerprint size={54} style={{ color: "var(--blueprint)" }} />
              )}
            </button>
            <p className="font-display font-semibold text-base">
              {signing ? "Validando identidad…" : "Confirma con tu huella"}
            </p>
            <p className="text-xs mt-1 mb-5 max-w-[16rem]" style={{ color: "var(--concrete)" }}>
              {signing
                ? "Consultando al proveedor de firma avanzada."
                : "Apoya el dedo en el sensor o usa Face ID para autorizar la firma con validez legal."}
            </p>
            {!signing && (
              <button
                onClick={() => setStep("pin")}
                className="text-sm font-medium flex items-center gap-1"
                style={{ color: "var(--concrete)" }}
              >
                <ChevronLeft size={15} /> Volver al PIN
              </button>
            )}
          </div>
        )}

        {step === "done" && (
          <div className="flex flex-col items-center text-center py-6 fade-in">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
              style={{ background: "var(--approval-bg)" }}
            >
              <CheckCircle2 size={44} style={{ color: "var(--approval)" }} />
            </div>
            <p className="font-display font-semibold text-lg">Folio firmado</p>
            <p className="text-xs mt-1" style={{ color: "var(--concrete)" }}>
              Registro inmutable incorporado a la bitácora.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  6. HOJA INFERIOR — NUEVO FOLIO (sheet nativo)                       */
/* ================================================================== */

function NewFolioSheet({ role, nextFolioNumber, prefill, onClose, onSaveDraft, onRequestSign }) {
  const currentRole = ROLES[role];
  const [form, setForm] = useState({
    category: prefill?.category || "",
    title: prefill?.title || "",
    body: "",
    resultado: "",
    refFolio: prefill?.refFolio || null,
  });
  const [geo, setGeo] = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [photos, setPhotos] = useState([]);
  const cameraRef = useRef(null);

  const valid = form.category && form.title.trim() && form.body.trim();

  async function grabLocation() {
    setGeoLoading(true);
    const loc = await capturarUbicacion();
    setGeo(loc);
    setGeoLoading(false);
  }

  function onCameraFiles(e) {
    const files = Array.from(e.target.files || []);
    const readers = files.map(
      (f) =>
        new Promise((res) => {
          const r = new FileReader();
          r.onload = () => res({ name: f.name, dataUrl: r.result });
          r.readAsDataURL(f);
        })
    );
    Promise.all(readers).then((imgs) => setPhotos((p) => [...p, ...imgs]));
    e.target.value = "";
  }

  function build(status) {
    return {
      id: nextFolioNumber,
      folioNumber: nextFolioNumber,
      category: form.category,
      title: form.title.trim(),
      body: form.body.trim(),
      resultado: form.resultado || null,
      creatorRole: role,
      creatorName: currentRole.name,
      status,
      signedAt: null,
      signature: null,
      refFolio: form.refFolio,
      geo: geo ? { lat: geo.lat, lng: geo.lng } : null,
      photos,
      comments: [],
    };
  }

  const incidentOrReception = form.category === "Incidente" || form.category === "Recepción de Partida";

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center fade-in"
      style={{ background: "rgba(22, 35, 59, 0.6)" }}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg rounded-t-3xl max-h-[92vh] flex flex-col sheet-enter"
        style={{ background: "var(--paper-card)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-5 pt-4 pb-3 border-b" style={{ borderColor: "var(--line)" }}>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "var(--paper)" }}>
            <span className="font-mono text-xs font-bold">{foliostr(nextFolioNumber)}</span>
          </div>
          <div>
            <p className="font-display font-semibold text-base leading-tight">Nuevo folio</p>
            <p className="text-xs" style={{ color: "var(--concrete)" }}>Correlativo N°{foliostr(nextFolioNumber)}</p>
          </div>
          <button onClick={onClose} className="ml-auto p-2 -mr-2" aria-label="Cerrar">
            <X size={22} style={{ color: "var(--concrete)" }} />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4 space-y-4">
          {form.refFolio && (
            <div
              className="flex items-center gap-2 text-sm rounded-xl px-3 py-2"
              style={{ background: "var(--amend-bg)", color: "var(--amend)" }}
            >
              <Link2 size={15} />
              <span>Enmienda al Folio N°{foliostr(form.refFolio)}</span>
              <button onClick={() => setForm((f) => ({ ...f, refFolio: null }))} className="ml-auto p-1">
                <X size={14} />
              </button>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--concrete)" }}>Categoría</label>
            <div className="grid grid-cols-2 gap-2">
              {currentRole.categories.map((c) => {
                const cfg = CATEGORY_CONFIG[c];
                const active = form.category === c;
                return (
                  <button
                    key={c}
                    onClick={() => setForm((f) => ({ ...f, category: c, resultado: "" }))}
                    className="btn-tap flex items-center gap-2 rounded-xl px-3 text-sm font-medium text-left"
                    style={{
                      background: active ? cfg.bg : "var(--paper)",
                      border: `1.5px solid ${active ? cfg.color : "var(--line)"}`,
                      color: active ? cfg.color : "var(--concrete)",
                    }}
                  >
                    <cfg.Icon size={16} className="shrink-0" />
                    <span className="leading-tight">{c}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--concrete)" }}>Título</label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Título del folio"
              className="w-full rounded-xl py-3 px-4 focus:outline-none"
              style={{ background: "var(--paper)", border: "1px solid var(--line)" }}
            />
          </div>

          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--concrete)" }}>Contenido técnico</label>
            <textarea
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              placeholder="Describe la partida, instrucción o incidente…"
              rows={5}
              className="w-full rounded-xl py-3 px-4 resize-none focus:outline-none"
              style={{ background: "var(--paper)", border: "1px solid var(--line)" }}
            />
          </div>

          {role === "ito" && form.category === "Recepción de Partida" && (
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--concrete)" }}>Resultado</label>
              <div className="grid grid-cols-3 gap-2">
                {["Aprobado", "Rechazado", "Observado"].map((r) => (
                  <button
                    key={r}
                    onClick={() => setForm((f) => ({ ...f, resultado: r }))}
                    className="btn-tap text-sm rounded-xl font-medium"
                    style={{
                      border: `1.5px solid ${form.resultado === r ? "var(--ink)" : "var(--line)"}`,
                      background: form.resultado === r ? "var(--ink)" : "transparent",
                      color: form.resultado === r ? "white" : "var(--concrete)",
                    }}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Herramientas de terreno: geolocalización + cámara */}
          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--concrete)" }}>
              Evidencia en terreno {incidentOrReception && <span style={{ color: "var(--incident)" }}>· recomendada</span>}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={grabLocation}
                className="btn-tap flex items-center justify-center gap-2 rounded-xl text-sm font-medium"
                style={{
                  background: geo ? "var(--approval-bg)" : "var(--paper)",
                  border: `1.5px solid ${geo ? "var(--approval)" : "var(--line)"}`,
                  color: geo ? "var(--approval)" : "var(--concrete)",
                }}
              >
                {geoLoading ? <Loader2 size={16} className="spin" /> : <Crosshair size={16} />}
                {geo ? "Ubicación lista" : "Marcar ubicación"}
              </button>

              <button
                onClick={() => cameraRef.current?.click()}
                className="btn-tap flex items-center justify-center gap-2 rounded-xl text-sm font-medium"
                style={{
                  background: photos.length ? "var(--blueprint-bg)" : "var(--paper)",
                  border: `1.5px solid ${photos.length ? "var(--blueprint)" : "var(--line)"}`,
                  color: photos.length ? "var(--blueprint)" : "var(--concrete)",
                }}
              >
                <Camera size={16} />
                {photos.length ? `${photos.length} foto${photos.length > 1 ? "s" : ""}` : "Tomar foto"}
              </button>
              {/* capture="environment" abre la cámara trasera directamente en móvil */}
              <input
                ref={cameraRef}
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                onChange={onCameraFiles}
                className="hidden"
              />
            </div>

            {geo && (
              <p className="text-xs font-mono mt-2 flex items-center gap-1.5" style={{ color: "var(--concrete)" }}>
                <MapPin size={12} />
                {geo.lat.toFixed(5)}, {geo.lng.toFixed(5)} {geo.sim && "(simulada)"}
              </p>
            )}

            {photos.length > 0 && (
              <div className="flex gap-2 mt-2 overflow-x-auto">
                {photos.map((p, i) => (
                  <div key={i} className="relative shrink-0">
                    <img src={p.dataUrl} alt="" className="w-16 h-16 rounded-lg object-cover" style={{ border: "1px solid var(--line)" }} />
                    <button
                      onClick={() => setPhotos((ps) => ps.filter((_, j) => j !== i))}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: "var(--incident)", color: "white" }}
                      aria-label="Quitar foto"
                    >
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div
          className="px-5 py-4 flex flex-col gap-2 border-t"
          style={{ borderColor: "var(--line)", paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
        >
          <button
            disabled={!valid}
            onClick={() => onRequestSign(build("firmado"))}
            className="btn-tap w-full flex items-center justify-center gap-2 text-base font-semibold rounded-xl"
            style={{ background: "var(--ink)", color: "white", opacity: valid ? 1 : 0.4 }}
          >
            <FileSignature size={17} /> Firmar y publicar
          </button>
          <button
            disabled={!valid}
            onClick={() => onSaveDraft(build("borrador"))}
            className="btn-tap w-full flex items-center justify-center gap-2 text-sm font-medium rounded-xl border"
            style={{ borderColor: "var(--line)", color: "var(--concrete)", opacity: valid ? 1 : 0.4 }}
          >
            <Plus size={15} /> Guardar como borrador
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  7. TARJETA DE FOLIO (compacta, mobile)                             */
/* ================================================================== */

function FolioCard({ folio, currentRole, role, commentDraft, onComment, onCommentChange, onAmend, onResolve }) {
  const cfg = CATEGORY_CONFIG[folio.category];
  const isDraft = folio.status === "borrador";
  const CatIcon = cfg.Icon;
  // El ITO puede resolver incidentes/recepciones firmados que no creó él.
  const canQuickResolve =
    currentRole.canResolve &&
    !isDraft &&
    !folio.resultado &&
    (folio.category === "Incidente" || folio.category === "Recepción de Partida");

  return (
    <article className="rounded-2xl overflow-hidden fade-in" style={{ background: "var(--paper-card)", border: "1px solid var(--line)" }}>
      <div className="px-4 pt-3.5 pb-4 space-y-2.5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded" style={{ background: "var(--ink)", color: "white" }}>
            N°{foliostr(folio.folioNumber)}
          </span>
          <span className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded" style={{ background: cfg.bg, color: cfg.color }}>
            <CatIcon size={12} /> {folio.category}
          </span>
          <span
            className="ml-auto text-[11px] font-bold px-2 py-1 rounded"
            style={{
              background: isDraft ? "var(--paper)" : "var(--approval-bg)",
              color: isDraft ? "var(--concrete)" : "var(--approval)",
            }}
          >
            {isDraft ? "BORRADOR" : "FIRMADO"}
          </span>
        </div>

        <h3 className="font-display font-semibold text-base leading-snug">{folio.title}</h3>
        <p className="text-sm leading-relaxed" style={{ color: "var(--ink-light)" }}>{folio.body}</p>

        {folio.resultado && (
          <span
            className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded"
            style={{
              background: folio.resultado === "Aprobado" ? "var(--approval-bg)" : "var(--incident-bg)",
              color: folio.resultado === "Aprobado" ? "var(--approval)" : "var(--incident)",
            }}
          >
            {folio.resultado === "Aprobado" ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
            {folio.resultado}
          </span>
        )}

        {folio.refFolio && (
          <p className="flex items-center gap-1 text-xs" style={{ color: "var(--concrete)" }}>
            <Link2 size={12} /> Referencia al Folio N°{foliostr(folio.refFolio)}
          </p>
        )}

        {/* Evidencia adjunta */}
        {(folio.photos?.length > 0 || folio.geo) && (
          <div className="flex items-center gap-3 flex-wrap">
            {folio.photos?.length > 0 && (
              <div className="flex gap-1.5">
                {folio.photos.slice(0, 4).map((p, i) => (
                  <img key={i} src={p.dataUrl} alt="" className="w-11 h-11 rounded-lg object-cover" style={{ border: "1px solid var(--line)" }} />
                ))}
              </div>
            )}
            {folio.geo && (
              <span className="flex items-center gap-1 text-xs font-mono" style={{ color: "var(--concrete)" }}>
                <MapPin size={12} /> {folio.geo.lat.toFixed(4)}, {folio.geo.lng.toFixed(4)}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center gap-3 text-xs flex-wrap pt-0.5" style={{ color: "var(--concrete)" }}>
          <span className="flex items-center gap-1"><User size={12} />{folio.creatorName} · {ROLES[folio.creatorRole].short}</span>
          <span className="flex items-center gap-1 font-mono"><Clock size={12} />{formatDateTime(folio.createdAt)}</span>
        </div>

        {!isDraft && (
          <div className="stamp-box inline-flex items-center gap-2 rounded px-3 py-1.5 mt-1">
            <ShieldCheck size={15} />
            <div className="leading-tight">
              <p className="text-[11px] font-bold font-mono">FIRMA ELECTRÓNICA AVANZADA</p>
              <p className="text-[10px] font-mono">Cód. {folio.signature?.code} · {formatDateTime(folio.signedAt)}</p>
            </div>
          </div>
        )}

        {/* Aprobación / Rechazo rápido para el ITO */}
        {canQuickResolve && (
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => onResolve(folio.id, "Aprobado")}
              className="btn-tap flex items-center justify-center gap-1.5 text-sm font-semibold rounded-xl"
              style={{ background: "var(--approval-bg)", color: "var(--approval)", border: "1.5px solid var(--approval)" }}
            >
              <CheckCircle2 size={16} /> Aprobar
            </button>
            <button
              onClick={() => onResolve(folio.id, "Rechazado")}
              className="btn-tap flex items-center justify-center gap-1.5 text-sm font-semibold rounded-xl"
              style={{ background: "var(--incident-bg)", color: "var(--incident)", border: "1.5px solid var(--incident)" }}
            >
              <XCircle size={16} /> Rechazar
            </button>
          </div>
        )}

        {!isDraft && currentRole.canCreate && (
          <button
            onClick={() => onAmend(folio)}
            className="flex items-center gap-1.5 text-sm font-semibold pt-1"
            style={{ color: "var(--amend)" }}
          >
            <RefreshCcw size={14} /> Crear enmienda
          </button>
        )}

        {folio.comments.length > 0 && (
          <div className="space-y-2 pt-1">
            {folio.comments.map((c, i) => (
              <div key={i} className="flex items-start gap-2 text-xs rounded-xl p-2.5" style={{ background: "var(--paper)" }}>
                <MessageSquare size={13} className="mt-0.5 shrink-0" style={{ color: "var(--concrete)" }} />
                <p style={{ color: "var(--concrete)" }}>
                  <span className="font-semibold" style={{ color: "var(--ink)" }}>{c.author}:</span> {c.text}
                </p>
              </div>
            ))}
          </div>
        )}

        {currentRole.canComment && !isDraft && (
          <div className="flex gap-2 pt-1">
            <input
              value={commentDraft || ""}
              onChange={(e) => onCommentChange(folio.id, e.target.value)}
              placeholder="Dejar un comentario…"
              className="flex-1 text-sm rounded-xl py-2.5 px-3 focus:outline-none"
              style={{ background: "var(--paper)", border: "1px solid var(--line)" }}
            />
            <button
              onClick={() => onComment(folio.id)}
              className="btn-tap text-sm font-semibold px-4 rounded-xl"
              style={{ background: "var(--ink)", color: "white" }}
            >
              Enviar
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

/* ================================================================== */
/*  8. PANTALLA DE PROYECTO (tab "Obra")                               */
/* ================================================================== */

function ProjectScreen({ project, folios }) {
  const firmados = folios.filter((f) => f.status === "firmado").length;
  const incidentes = folios.filter((f) => f.category === "Incidente").length;
  return (
    <div className="px-4 py-4 space-y-4 fade-in">
      <div className="rounded-2xl p-5 space-y-3" style={{ background: "var(--paper-card)", border: "1px solid var(--line)" }}>
        <div className="flex items-start gap-2">
          <Building2 size={18} className="mt-0.5 shrink-0" style={{ color: "var(--ink-light)" }} />
          <p className="font-display text-lg font-semibold leading-snug">{project.name}</p>
        </div>
        <div className="flex items-start gap-2">
          <MapPin size={15} className="mt-0.5 shrink-0" style={{ color: "var(--concrete)" }} />
          <p className="text-sm" style={{ color: "var(--concrete)" }}>{project.address}</p>
        </div>
        <div className="flex items-start gap-2">
          <Hash size={15} className="mt-0.5 shrink-0" style={{ color: "var(--concrete)" }} />
          <p className="text-sm font-mono" style={{ color: "var(--concrete)" }}>Permiso N° {project.permit}</p>
        </div>
        <div className="pt-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold" style={{ color: "var(--concrete)" }}>Avance físico de obra</span>
            <span className="text-sm font-mono font-semibold">{project.progress}%</span>
          </div>
          <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: "var(--paper)" }}>
            <div className="h-full rounded-full" style={{ width: `${project.progress}%`, background: "var(--ink-light)" }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Folios", value: folios.length },
          { label: "Firmados", value: firmados },
          { label: "Incidentes", value: incidentes },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl p-4 text-center" style={{ background: "var(--paper-card)", border: "1px solid var(--line)" }}>
            <p className="font-display text-2xl font-bold">{s.value}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--concrete)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 text-xs rounded-xl px-3 py-3" style={{ background: "var(--blueprint-bg)", color: "var(--blueprint)" }}>
        <Lock size={15} className="shrink-0" />
        Los folios firmados son inmutables por ley: no pueden editarse ni eliminarse.
      </div>
    </div>
  );
}

/* ================================================================== */
/*  9. APP PRINCIPAL                                                   */
/* ================================================================== */

export default function App() {
  // --- Sesión ---
  const [session, setSession] = useState(null); // { token, role, user }

  // --- Datos (cargados vía servicios) ---
  const [project, setProject] = useState(null);
  const [folios, setFolios] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- UI ---
  const [tab, setTab] = useState("bitacora"); // bitacora | obra
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Todas");
  const [showNew, setShowNew] = useState(false);
  const [amendPrefill, setAmendPrefill] = useState(null);
  const [pendingSign, setPendingSign] = useState(null);
  const [commentDrafts, setCommentDrafts] = useState({});

  const role = session?.role;
  const currentRole = role ? ROLES[role] : null;

  /* --- Carga inicial de datos cuando hay sesión (API-ready) --- */
  useEffect(() => {
    if (!session) return;
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const [proj, list] = await Promise.all([projectService.get(), folioService.list()]);
        if (!alive) return;
        setProject(proj);
        setFolios(list);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [session]);

  const nextFolioNumber = useMemo(
    () => Math.max(0, ...folios.map((f) => f.folioNumber)) + 1,
    [folios]
  );

  const visibleFolios = useMemo(() => {
    if (!role) return [];
    return folios
      .filter((f) => (role === "mandante" ? f.status === "firmado" : true))
      .filter((f) => (categoryFilter === "Todas" ? true : f.category === categoryFilter))
      .filter((f) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return f.title.toLowerCase().includes(q) || f.body.toLowerCase().includes(q) || String(f.folioNumber).includes(q);
      })
      .sort((a, b) => b.folioNumber - a.folioNumber);
  }, [folios, role, categoryFilter, search]);

  /* --- Acciones (todas pasan por la capa de servicios) --- */
  const handleLogout = useCallback(() => {
    setSession(null);
    setProject(null);
    setFolios([]);
    setTab("bitacora");
    setSearch("");
    setCategoryFilter("Todas");
  }, []);

  async function handleSaveDraft(draft) {
    const created = await folioService.create(draft);
    setFolios((prev) => [...prev, created]);
    setShowNew(false);
    setAmendPrefill(null);
  }

  function handleRequestSign(draft) {
    setPendingSign(draft);
    // El sheet nuevo se cierra al confirmar la firma (ver onSigned).
  }

  async function handleSigned(signed) {
    // Si venía de un borrador nuevo, lo persistimos; si no existía, lo añadimos.
    const created = await folioService.create({ ...signed, createdAt: signed.createdAt });
    setFolios((prev) => [...prev, { ...signed, createdAt: created.createdAt }]);
    setPendingSign(null);
    setShowNew(false);
    setAmendPrefill(null);
  }

  async function handleResolve(folioId, resultado) {
    await folioService.resolve(folioId, resultado);
    setFolios((prev) => prev.map((f) => (f.id === folioId ? { ...f, resultado } : f)));
  }

  function handleStartAmendment(folio) {
    setAmendPrefill({
      category: "Modificación",
      title: `Enmienda al Folio N°${foliostr(folio.folioNumber)}`,
      refFolio: folio.folioNumber,
    });
    setShowNew(true);
  }

  async function handleAddComment(folioId) {
    const text = (commentDrafts[folioId] || "").trim();
    if (!text) return;
    const comment = { author: currentRole.name, role, text, createdAt: new Date().toISOString() };
    await folioService.comment(folioId, comment);
    setFolios((prev) => prev.map((f) => (f.id === folioId ? { ...f, comments: [...f.comments, comment] } : f)));
    setCommentDrafts((prev) => ({ ...prev, [folioId]: "" }));
  }

  /* --- Render --- */
  if (!session) {
    return (
      <div className="libro-obra-app">
        <style>{APP_STYLES}</style>
        <LoginScreen onLogin={setSession} />
      </div>
    );
  }

  return (
    <div className="libro-obra-app min-h-screen w-full flex flex-col" style={{ background: "var(--paper)" }}>
      <style>{APP_STYLES}</style>

      {/* Barra superior */}
      <header
        className="sticky top-0 z-20 px-4 py-3 flex items-center gap-3"
        style={{ background: "var(--ink)", color: "white", paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
      >
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,0.12)" }}>
          <BookMarked size={18} />
        </div>
        <div className="min-w-0">
          <h1 className="font-display text-base leading-tight truncate">Libro de Obra Digital</h1>
          <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.6)" }}>
            {currentRole.name} · {currentRole.short}
          </p>
        </div>
        <button onClick={handleLogout} className="ml-auto p-2 -mr-1" aria-label="Cerrar sesión">
          <LogOut size={19} />
        </button>
      </header>

      {/* Contenido */}
      <main className="flex-1 overflow-y-auto pb-24">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24" style={{ color: "var(--concrete)" }}>
            <Loader2 size={28} className="spin mb-3" />
            <p className="text-sm">Cargando bitácora…</p>
          </div>
        ) : tab === "obra" ? (
          <ProjectScreen project={project} folios={folios} />
        ) : (
          <div className="px-4 py-4 space-y-3">
            {/* Búsqueda + filtro */}
            <div className="relative">
              <Search size={17} className="absolute left-3 top-3.5" style={{ color: "var(--concrete)" }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar folio o palabra clave…"
                className="w-full rounded-xl py-3 pl-10 pr-3 focus:outline-none"
                style={{ background: "var(--paper-card)", border: "1px solid var(--line)" }}
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
              {["Todas", ...Object.keys(CATEGORY_CONFIG)].map((c) => {
                const active = categoryFilter === c;
                return (
                  <button
                    key={c}
                    onClick={() => setCategoryFilter(c)}
                    className="shrink-0 text-sm font-medium px-3.5 py-2 rounded-full"
                    style={{
                      background: active ? "var(--ink)" : "var(--paper-card)",
                      color: active ? "white" : "var(--concrete)",
                      border: `1px solid ${active ? "var(--ink)" : "var(--line)"}`,
                    }}
                  >
                    {c}
                  </button>
                );
              })}
            </div>

            {visibleFolios.length === 0 ? (
              <div className="text-center py-16 px-6" style={{ color: "var(--concrete)" }}>
                <ClipboardList size={32} className="mx-auto mb-3 opacity-50" />
                <p className="text-sm">
                  {search || categoryFilter !== "Todas"
                    ? "Ningún folio coincide con el filtro."
                    : "La bitácora está vacía. Crea el primer folio."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {visibleFolios.map((folio) => (
                  <FolioCard
                    key={folio.id}
                    folio={folio}
                    currentRole={currentRole}
                    role={role}
                    commentDraft={commentDrafts[folio.id]}
                    onComment={handleAddComment}
                    onCommentChange={(id, v) => setCommentDrafts((prev) => ({ ...prev, [id]: v }))}
                    onAmend={handleStartAmendment}
                    onResolve={handleResolve}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Botón flotante de acción (crear folio) */}
      {currentRole.canCreate && tab === "bitacora" && !loading && (
        <button
          onClick={() => { setAmendPrefill(null); setShowNew(true); }}
          className="btn-tap fixed z-30 right-4 flex items-center gap-2 px-5 rounded-full font-semibold shadow-lg"
          style={{ background: "var(--ink)", color: "white", bottom: "calc(env(safe-area-inset-bottom) + 5.5rem)" }}
        >
          <Plus size={20} /> Nuevo folio
        </button>
      )}

      {/* Navegación inferior */}
      <nav
        className="fixed bottom-0 inset-x-0 z-20 flex items-stretch"
        style={{
          background: "var(--paper-card)",
          borderTop: "1px solid var(--line)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {[
          { key: "bitacora", label: "Bitácora", Icon: BookMarked },
          { key: "obra", label: "Obra", Icon: Home },
        ].map(({ key, label, Icon }) => {
          const active = tab === key;
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="btn-tap flex-1 flex flex-col items-center justify-center gap-0.5 py-2"
              style={{ color: active ? "var(--ink)" : "var(--concrete-soft)" }}
            >
              <Icon size={22} strokeWidth={active ? 2.4 : 1.8} />
              <span className="text-[11px] font-medium">{label}</span>
            </button>
          );
        })}
      </nav>

      {/* Hojas modales */}
      {showNew && (
        <NewFolioSheet
          role={role}
          nextFolioNumber={nextFolioNumber}
          prefill={amendPrefill}
          onClose={() => { setShowNew(false); setAmendPrefill(null); }}
          onSaveDraft={handleSaveDraft}
          onRequestSign={handleRequestSign}
        />
      )}

      {pendingSign && (
        <SignatureSheet
          folio={pendingSign}
          role={role}
          onCancel={() => setPendingSign(null)}
          onSigned={handleSigned}
        />
      )}
    </div>
  );
}

export default App;
