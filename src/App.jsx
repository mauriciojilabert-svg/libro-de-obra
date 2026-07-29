import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  Building2,
  MapPin,
  Hash,
  TrendingUp,
  Search,
  Plus,
  CircleCheck,
  CircleX,
  TriangleAlert,
  Link2,
  ClipboardList,
  RefreshCcw,
  Lock,
  LogOut,
  BookMarked,
  Loader2,
  Home,
} from "lucide-react";

/* ================================================================== */
/*  ERROR BOUNDARY                                                     */
/* ================================================================== */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center", background: "#0D0F12", color: "#F1F3F5" }}>
          <TriangleAlert size={48} color="#EF4444" style={{ marginBottom: 16 }} />
          <h1 style={{ fontFamily: "Outfit, sans-serif", fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Algo salió mal</h1>
          <p style={{ fontSize: 14, opacity: 0.6, marginBottom: 20, maxWidth: 320 }}>
            La aplicación encontró un error inesperado.
          </p>
          <pre style={{ fontSize: 11, background: "rgba(255,255,255,0.05)", padding: 16, borderRadius: 12, maxWidth: "100%", overflow: "auto", textAlign: "left", marginBottom: 20 }}>
            {this.state.error?.toString()}
          </pre>
          <button onClick={() => window.location.reload()} className="btn-tap btn-primary" style={{ padding: "12px 28px", borderRadius: 12, border: "none", fontWeight: 600 }}>
            Recargar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ================================================================== */
/*  CONFIGURACIÓN                                                      */
/* ================================================================== */

const CATEGORY_CONFIG = {
  Instrucción: { color: "var(--color-info)", bg: "var(--color-info-bg)", Icon: ClipboardList },
  Avance: { color: "var(--text-secondary)", bg: "rgba(156,163,175,0.1)", Icon: TrendingUp },
  "Recepción de Partida": { color: "var(--color-success)", bg: "var(--color-success-bg)", Icon: CircleCheck },
  Incidente: { color: "var(--color-danger)", bg: "var(--color-danger-bg)", Icon: TriangleAlert },
  Modificación: { color: "var(--color-warning)", bg: "var(--color-warning-bg)", Icon: RefreshCcw },
};

const ROLES = {
  constructor: {
    label: "Administrador de Obra",
    short: "Constructor",
    name: "Mauricio Jilabert",
    canCreate: true,
    canComment: false,
    canResolve: false,
    categories: ["Avance", "Incidente", "Modificación", "Recepción de Partida"],
  },
  ito: {
    label: "ITO — Inspector Técnico",
    short: "ITO",
    name: "Carlos Reyes",
    canCreate: true,
    canComment: false,
    canResolve: true,
    categories: ["Instrucción", "Incidente", "Recepción de Partida"],
  },
};

const MOCK_CREDENTIALS = {
  "mauricio@test.cl": { password: "test123", role: "constructor" },
  "carlitos@test.cl": { password: "test123", role: "ito" },
};

const PROJECT = {
  name: "Edificio Mirador del Parque",
  address: "Av. Las Industrias 4521, Renca, Santiago",
  permit: "DOM-RENCA-0142/2024",
  progress: 62,
};

const INITIAL_FOLIOS = [
  {
    id: 11, folioNumber: 11, category: "Recepción de Partida",
    title: "Recepción de enfierradura de fundaciones eje A-B",
    body: "Se verifica en terreno la enfierradura de fundaciones corridas entre los ejes A y B, conforme a cuantía y diámetros indicados en plano EST-04 rev.2. Separación de estribos @20 cm verificada con huincha. Recubrimiento mínimo de 5 cm cumplido según NCh429.",
    resultado: "Aprobado", creatorRole: "ito", creatorName: "Carlos Reyes",
    createdAt: "2026-06-22T09:15:00", status: "firmado", signedAt: "2026-06-22T09:22:00",
    signature: { code: "AF3-991-KX" }, refFolio: null, geo: { lat: -33.4012, lng: -70.7289 }, photos: [], comments: [],
  },
  {
    id: 12, folioNumber: 12, category: "Incidente",
    title: "Rotura de matriz de agua potable en eje C-3",
    body: "Durante excavación en eje C-3, retroexcavadora CAT 320 impactó matriz de agua potable de 110 mm a 1,2 m de profundidad. Se corta suministro general a las 10:47 hrs. Se notifica a la empresa sanitaria. Sin personal lesionado.",
    resultado: null, creatorRole: "constructor", creatorName: "Mauricio Jilabert",
    createdAt: "2026-06-25T10:55:00", status: "firmado", signedAt: "2026-06-25T11:03:00",
    signature: { code: "AF3-114-QP" }, refFolio: null, geo: { lat: -33.4018, lng: -70.7301 }, photos: [], comments: [],
  },
  {
    id: 13, folioNumber: 13, category: "Instrucción",
    title: "Refuerzo de moldaje en losa nivel 2",
    body: "Se instruye reforzar apuntalamiento del moldaje de losa nivel 2, paño entre ejes 3-5 / B-D, por deflexión superior a la tolerancia admisible. Instalar puntales adicionales @0,8 m. Plazo: inmediato, antes de iniciar hormigonado.",
    resultado: null, creatorRole: "ito", creatorName: "Carlos Reyes",
    createdAt: "2026-06-29T08:40:00", status: "firmado", signedAt: "2026-06-29T08:44:00",
    signature: { code: "AF3-227-TV" }, refFolio: null, geo: null, photos: [], comments: [],
  },
];

/* ================================================================== */
/*  SERVICIOS                                                          */
/* ================================================================== */
const netDelay = (ms = 550) => new Promise((r) => setTimeout(r, ms));

const authService = {
  async login(email, password) {
    await netDelay();
    const account = MOCK_CREDENTIALS[email.trim().toLowerCase()];
    if (!account || account.password !== password) throw new Error("Correo o contraseña incorrectos.");
    return { token: "mock.jwt." + btoa(email).slice(0, 12), role: account.role, user: ROLES[account.role] };
  },
};
const projectService = { async get() { await netDelay(300); return PROJECT; } };
const folioService = {
  async list() { await netDelay(); return INITIAL_FOLIOS; },
  async create(p) { await netDelay(400); return { ...p, createdAt: new Date().toISOString() }; },
  async sign(f) {
    await netDelay(700);
    const code = "AF" + Math.floor(100 + Math.random() * 899) + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
    return { ...f, status: "firmado", signedAt: new Date().toISOString(), signature: { code } };
  },
  async resolve(id, r) { await netDelay(400); return { id, r }; },
  async comment(id, c) { await netDelay(300); return { id, c }; },
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
/*  LOGIN                                                              */
/* ================================================================== */
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError("");
    if (!email.trim() || !password) { setError("Ingresa tu correo y contraseña."); return; }
    setLoading(true);
    try { onLogin(await authService.login(email, password)); }
    catch (e) { setError(e.message); setLoading(false); }
  }

  return (
    <div className="fade-in" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "40px 24px", background: "var(--bg-base)" }}>
      {/* Ambient glow */}
      <div style={{ position: "absolute", top: -120, left: "50%", transform: "translateX(-50%)", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: 380, position: "relative", zIndex: 1 }}>
        {/* Branding */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "var(--color-primary)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 20, boxShadow: "0 0 30px var(--color-primary-glow)" }}>
            <BookMarked size={28} color="#fff" />
          </div>
          <h1 className="font-display" style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 6, color: "var(--text-primary)" }}>Libro de Obra</h1>
          <p style={{ fontSize: 13, color: "var(--text-tertiary)" }}>Bitácora digital de obra · Inmutable</p>
        </div>

        {/* Card */}
        <div className="surface-2" style={{ borderRadius: 20, padding: 28 }}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>Correo</label>
            <input value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }} type="email" inputMode="email" placeholder="tu@empresa.cl"
              className="input-field" style={{ width: "100%", borderRadius: 12, padding: "14px 16px" }} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>Contraseña</label>
            <input value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }} type="password" placeholder="••••••••"
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="input-field" style={{ width: "100%", borderRadius: 12, padding: "14px 16px" }} />
          </div>

          {error && (
            <div className="fade-in" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, borderRadius: 12, padding: "12px 14px", marginBottom: 16, background: "var(--color-danger-bg)", color: "var(--color-danger)" }}>
              <TriangleAlert size={16} style={{ flexShrink: 0 }} /> {error}
            </div>
          )}

          <button onClick={handleSubmit} disabled={loading}
            className="btn-tap btn-primary"
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 15, fontWeight: 600, borderRadius: 12, padding: "14px 0", border: "none", opacity: loading ? 0.7 : 1 }}>
            {loading ? <Loader2 size={18} className="spin" /> : <Lock size={17} />}
            {loading ? "Verificando…" : "Ingresar"}
          </button>

          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border-subtle)", textAlign: "center" }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Accesos Demo</p>
            <p className="font-mono" style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.8 }}>mauricio@test.cl · test123</p>
            <p className="font-mono" style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.8 }}>carlitos@test.cl · test123</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  FOLIO CARD                                                         */
/* ================================================================== */
function FolioCard({ folio, currentRole, role, onAmend, onResolve }) {
  const cfg = CATEGORY_CONFIG[folio.category] || CATEGORY_CONFIG["Instrucción"];
  const isDraft = folio.status === "borrador";
  const CatIcon = cfg.Icon;
  const canQuickResolve = currentRole.canResolve && !isDraft && !folio.resultado && (folio.category === "Incidente" || folio.category === "Recepción de Partida");

  return (
    <article className="surface-1 fade-in" style={{ borderRadius: 16, padding: 20 }}>
      {/* Header chips */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        <span className="chip font-mono" style={{ background: "var(--color-primary)", color: "#fff", fontSize: 10 }}>
          N°{foliostr(folio.folioNumber)}
        </span>
        <span className="chip" style={{ background: cfg.bg, color: cfg.color }}>
          <CatIcon size={12} /> {folio.category}
        </span>
        <span className="chip" style={{ marginLeft: "auto", background: isDraft ? "var(--bg-surface-3)" : "var(--color-success-bg)", color: isDraft ? "var(--text-tertiary)" : "var(--color-success)", textTransform: "uppercase", fontSize: 9, letterSpacing: "0.08em" }}>
          {isDraft ? "Borrador" : "Firmado"}
        </span>
      </div>

      {/* Content */}
      <h3 className="font-display" style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.4, marginBottom: 8 }}>{folio.title}</h3>
      <p style={{ fontSize: 13, lineHeight: 1.7, color: "var(--text-secondary)", marginBottom: 12 }}>{folio.body}</p>

      {folio.resultado && (
        <span className="chip" style={{ background: folio.resultado === "Aprobado" ? "var(--color-success-bg)" : "var(--color-danger-bg)", color: folio.resultado === "Aprobado" ? "var(--color-success)" : "var(--color-danger)", marginBottom: 12 }}>
          {folio.resultado === "Aprobado" ? <CircleCheck size={13} /> : <CircleX size={13} />}
          {folio.resultado}
        </span>
      )}

      {folio.refFolio && (
        <p style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-tertiary)", marginBottom: 8 }}>
          <Link2 size={13} /> Ref. Folio N°{foliostr(folio.refFolio)}
        </p>
      )}

      {/* Footer */}
      <div style={{ paddingTop: 12, marginTop: 12, borderTop: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 500, color: "var(--text-secondary)" }}>{folio.creatorName}</p>
          <p style={{ fontSize: 10, color: "var(--text-tertiary)" }}>{formatDateTime(folio.createdAt)}</p>
        </div>
        {!isDraft && currentRole.canCreate && (
          <button onClick={() => onAmend(folio)} className="btn-tap" style={{ padding: "8px 16px", borderRadius: 10, fontSize: 12, fontWeight: 600, background: "var(--bg-surface-3)", color: "var(--text-secondary)", border: "1px solid var(--border-medium)" }}>
            Enmendar
          </button>
        )}
      </div>

      {canQuickResolve && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, paddingTop: 12 }}>
          <button onClick={() => onResolve(folio.id, "Aprobado")} className="btn-tap" style={{ padding: "10px 0", borderRadius: 10, fontSize: 13, fontWeight: 600, display: "flex", justifyContent: "center", alignItems: "center", gap: 6, background: "var(--color-success-bg)", color: "var(--color-success)", border: "none" }}>
            <CircleCheck size={16} /> Aprobar
          </button>
          <button onClick={() => onResolve(folio.id, "Rechazado")} className="btn-tap" style={{ padding: "10px 0", borderRadius: 10, fontSize: 13, fontWeight: 600, display: "flex", justifyContent: "center", alignItems: "center", gap: 6, background: "var(--color-danger-bg)", color: "var(--color-danger)", border: "none" }}>
            <CircleX size={16} /> Rechazar
          </button>
        </div>
      )}
    </article>
  );
}

/* ================================================================== */
/*  PROJECT / DASHBOARD                                                */
/* ================================================================== */
function ProjectScreen({ project, folios }) {
  const firmados = folios.filter((f) => f.status === "firmado").length;
  const incidentes = folios.filter((f) => f.category === "Incidente").length;

  return (
    <div className="fade-in" style={{ padding: 20 }}>
      {/* Project card */}
      <div className="surface-2" style={{ borderRadius: 20, padding: 24, marginBottom: 16, position: "relative", overflow: "hidden" }}>
        {/* Top accent */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, var(--color-primary), var(--color-info), var(--color-primary))" }} />

        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: "var(--color-primary-glow)", color: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Building2 size={22} />
          </div>
          <div>
            <p className="font-display" style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.3 }}>{project.name}</p>
            <p style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
              <MapPin size={12} /> {project.address}
            </p>
          </div>
        </div>

        <div className="font-mono" style={{ fontSize: 11, color: "var(--text-tertiary)", background: "var(--bg-surface-1)", padding: "8px 12px", borderRadius: 10, display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 20 }}>
          <Hash size={13} /> Permiso: {project.permit}
        </div>

        {/* Progress bar */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Avance de Obra</span>
            <span className="font-mono" style={{ fontSize: 14, fontWeight: 700, color: "var(--color-primary)" }}>{project.progress}%</span>
          </div>
          <div style={{ width: "100%", height: 8, borderRadius: 4, background: "var(--bg-surface-1)", overflow: "hidden" }}>
            <div style={{ width: `${project.progress}%`, height: "100%", borderRadius: 4, background: "linear-gradient(90deg, var(--color-primary), var(--color-info))", boxShadow: "0 0 12px var(--color-primary-glow)" }} />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
        {[
          { label: "Folios", value: folios.length, color: "var(--color-primary)" },
          { label: "Firmados", value: firmados, color: "var(--color-success)" },
          { label: "Incidentes", value: incidentes, color: "var(--color-danger)" },
        ].map((s) => (
          <div key={s.label} className="surface-1" style={{ borderRadius: 16, padding: 20, textAlign: "center" }}>
            <p className="font-display" style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</p>
            <p style={{ fontSize: 10, marginTop: 4, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Legal notice */}
      <div className="surface-1" style={{ borderRadius: 14, padding: 16, display: "flex", alignItems: "center", gap: 12, borderColor: "rgba(99,102,241,0.15)" }}>
        <Lock size={20} style={{ flexShrink: 0, color: "var(--color-primary)" }} />
        <span style={{ fontSize: 12, lineHeight: 1.6, color: "var(--text-secondary)" }}>Los folios firmados son inmutables criptográficamente y forman parte del marco legal de la obra.</span>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  MAIN                                                               */
/* ================================================================== */
function AppContent() {
  const [session, setSession] = useState(null);
  const [project, setProject] = useState(null);
  const [folios, setFolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("bitacora");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Todas");

  const role = session?.role;
  const currentRole = role ? ROLES[role] : null;

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
      } catch (e) { console.error(e); }
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, [session]);

  const visibleFolios = useMemo(() => {
    if (!role) return [];
    return folios
      .filter((f) => (categoryFilter === "Todas" ? true : f.category === categoryFilter))
      .filter((f) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return f.title.toLowerCase().includes(q) || f.body.toLowerCase().includes(q) || String(f.folioNumber).includes(q);
      })
      .sort((a, b) => b.folioNumber - a.folioNumber);
  }, [folios, role, categoryFilter, search]);

  const handleLogout = useCallback(() => {
    setSession(null); setProject(null); setFolios([]); setTab("bitacora"); setSearch(""); setCategoryFilter("Todas");
  }, []);

  async function handleResolve(folioId, resultado) {
    await folioService.resolve(folioId, resultado);
    setFolios((prev) => prev.map((f) => (f.id === folioId ? { ...f, resultado } : f)));
  }

  function handleStartAmendment(folio) {
    alert("Enmienda iniciada para folio N° " + folio.folioNumber + ". (Demo)");
  }

  if (!session) return <LoginScreen onLogin={setSession} />;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-base)" }}>
      {/* Header */}
      <header className="surface-1" style={{ position: "sticky", top: 0, zIndex: 30, padding: "14px 20px", display: "flex", alignItems: "center", gap: 14, borderTop: "none", borderLeft: "none", borderRight: "none", borderRadius: 0 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 0 20px var(--color-primary-glow)" }}>
          <BookMarked size={20} color="#fff" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 className="font-display" style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Libro de Obra</h1>
          <p style={{ fontSize: 11, color: "var(--text-tertiary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {currentRole.short} · {currentRole.name}
          </p>
        </div>
        <button onClick={handleLogout} className="btn-tap" style={{ width: 40, height: 40, borderRadius: 12, background: "var(--bg-surface-3)", border: "1px solid var(--border-medium)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-danger)" }} aria-label="Cerrar sesión">
          <LogOut size={18} />
        </button>
      </header>

      {/* Accent line */}
      <div className="accent-line" />

      {/* Content */}
      <main style={{ flex: 1, overflowY: "auto", paddingBottom: 100 }}>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "120px 0", color: "var(--text-tertiary)" }}>
            <Loader2 size={28} className="spin" style={{ marginBottom: 12, color: "var(--color-primary)" }} />
            <p style={{ fontSize: 12, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em" }}>Sincronizando…</p>
          </div>
        ) : tab === "obra" ? (
          <ProjectScreen project={project} folios={folios} />
        ) : (
          <div style={{ padding: 20 }}>
            {/* Search */}
            <div style={{ position: "relative", marginBottom: 16 }}>
              <Search size={17} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)" }} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar en bitácora…"
                className="input-field" style={{ width: "100%", borderRadius: 14, padding: "14px 14px 14px 42px" }} />
            </div>

            {/* Category pills */}
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 12, marginBottom: 8 }}>
              {["Todas", ...Object.keys(CATEGORY_CONFIG)].map((c) => {
                const active = categoryFilter === c;
                return (
                  <button key={c} onClick={() => setCategoryFilter(c)} className="btn-tap"
                    style={{
                      flexShrink: 0, fontSize: 12, fontWeight: 600, padding: "8px 16px", borderRadius: 10, border: "none",
                      background: active ? "var(--color-primary)" : "var(--bg-surface-2)",
                      color: active ? "#fff" : "var(--text-secondary)",
                      boxShadow: active ? "0 0 14px var(--color-primary-glow)" : "none",
                      minHeight: 36
                    }}>
                    {c}
                  </button>
                );
              })}
            </div>

            {/* Folios */}
            {visibleFolios.length === 0 ? (
              <div style={{ textAlign: "center", padding: "80px 24px", color: "var(--text-tertiary)" }}>
                <ClipboardList size={36} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
                <p style={{ fontSize: 13 }}>No se encontraron folios.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {visibleFolios.map((folio) => (
                  <FolioCard key={folio.id} folio={folio} currentRole={currentRole} role={role} onAmend={handleStartAmendment} onResolve={handleResolve} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* FAB */}
      {currentRole.canCreate && tab === "bitacora" && !loading && (
        <button onClick={() => alert("Crear nuevo folio (Demo)")} className="btn-tap btn-primary"
          style={{ position: "fixed", zIndex: 40, right: 20, bottom: 100, width: 56, height: 56, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", border: "none" }}>
          <Plus size={24} />
        </button>
      )}

      {/* Bottom Nav */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 30, padding: "12px 20px", paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
        <nav className="surface-2" style={{ borderRadius: 16, display: "flex", padding: 6, gap: 6 }}>
          {[
            { key: "bitacora", label: "Bitácora", Icon: BookMarked },
            { key: "obra", label: "Dashboard", Icon: Home },
          ].map(({ key, label, Icon }) => {
            const active = tab === key;
            return (
              <button key={key} onClick={() => setTab(key)} className="btn-tap"
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 0", borderRadius: 12, border: "none",
                  background: active ? "var(--color-primary)" : "transparent",
                  color: active ? "#fff" : "var(--text-tertiary)",
                  boxShadow: active ? "0 0 16px var(--color-primary-glow)" : "none",
                }}>
                <Icon size={18} strokeWidth={active ? 2.5 : 2} />
                <span style={{ fontSize: 13, fontWeight: active ? 700 : 500 }}>{label}</span>
              </button>
            );
          })}
        </nav>
      </div>
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
