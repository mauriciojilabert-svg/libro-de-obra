import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  Building2,
  MapPin,
  Hash,
  TrendingUp,
  Search,
  Plus,
  X,
  ChevronLeft,
  ShieldCheck,
  CircleCheck,
  CircleX,
  TriangleAlert,
  KeyRound,
  Link2,
  ClipboardList,
  RefreshCcw,
  Lock,
  LogOut,
  BookMarked,
  Fingerprint,
  Loader2,
  Home,
  Sun,
  Moon,
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
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center" style={{ background: "var(--bg-canvas)", color: "var(--text-main)" }}>
          <TriangleAlert size={48} className="text-red-500 mb-4" />
          <h1 className="text-2xl font-display font-bold mb-2">Algo salió mal</h1>
          <p className="text-sm opacity-70 mb-6 max-w-sm">
            La aplicación encontró un error inesperado al renderizar la interfaz. 
          </p>
          <pre className="text-xs bg-black/10 dark:bg-white/10 p-4 rounded-xl max-w-full overflow-auto text-left mb-6">
            {this.state.error?.toString()}
          </pre>
          <button 
            onClick={() => window.location.reload()} 
            className="btn-tap btn-primary px-6 py-2.5 rounded-full font-medium"
          >
            Recargar Aplicación
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ================================================================== */
/*  CONFIGURACIÓN ESTÁTICA                                             */
/* ================================================================== */

const CATEGORY_CONFIG = {
  Instrucción: { color: "var(--color-info)", bg: "var(--color-info-bg)", Icon: ClipboardList },
  Avance: { color: "var(--text-muted)", bg: "rgba(160,174,192,0.15)", Icon: TrendingUp },
  "Recepción de Partida": { color: "var(--color-success)", bg: "var(--color-success-bg)", Icon: CircleCheck },
  Incidente: { color: "var(--color-danger)", bg: "var(--color-danger-bg)", Icon: TriangleAlert },
  Modificación: { color: "var(--color-warning)", bg: "var(--color-warning-bg)", Icon: RefreshCcw },
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
    canResolve: true,
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
    body: "Se verifica en terreno la enfierradura de fundaciones corridas entre los ejes A y B, conforme a cuantía y diámetros indicados en plano EST-04 rev.2. Separación de estribos @20 cm verificada con huincha. Recubrimiento mínimo de 5 cm cumplido según NCh429. No se observan deficiencias. Se autoriza el hormigonado de la partida.",
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
    body: "Durante excavación de fundaciones en eje C-3, retroexcavadora modelo CAT 320 impactó matriz de agua potable de 110 mm a 1,2 m de profundidad, no georreferenciada en el plano de instalaciones sanitarias entregado por el mandante. Se corta suministro general del sector a las 10:47 hrs. Se notifica a la empresa sanitaria para reparación de emergencia. Sin personal lesionado. Se adjuntará registro fotográfico como anexo.",
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
    body: "Se instruye reforzar el apuntalamiento del moldaje de losa nivel 2, paño comprendido entre ejes 3-5 / B-D, debido a deflexión superior a la tolerancia admisible detectada en inspección visual. Instalar puntales adicionales @0,8 m según detalle entregado en obra, previo al hormigonado programado. Plazo de ejecución: inmediato, antes de iniciar faena de hormigonado.",
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
];

/* ================================================================== */
/*  SERVICIOS                                                          */
/* ================================================================== */

const netDelay = (ms = 550) => new Promise((r) => setTimeout(r, ms));

const authService = {
  async login(email, password) {
    await netDelay();
    const account = MOCK_CREDENTIALS[email.trim().toLowerCase()];
    if (!account || account.password !== password) {
      throw new Error("Correo o contraseña incorrectos.");
    }
    return {
      token: "mock.jwt." + btoa(email).slice(0, 12),
      role: account.role,
      user: ROLES[account.role],
    };
  },
};

const projectService = {
  async get() {
    await netDelay(300);
    return PROJECT;
  },
};

const folioService = {
  async list() {
    await netDelay();
    return INITIAL_FOLIOS;
  },
  async create(payload) {
    await netDelay(400);
    return { ...payload, createdAt: new Date().toISOString() };
  },
  async sign(folio) {
    await netDelay(700);
    const code = "AF" + Math.floor(100 + Math.random() * 899) + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
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
/*  UTILIDADES                                                         */
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

/* ================================================================== */
/*  COMPONENTES UI - REDISEÑO 2026                                     */
/* ================================================================== */

function ThemeToggle({ isDark, toggleDark }) {
  return (
    <button 
      onClick={toggleDark}
      className="btn-tap w-10 h-10 rounded-full glass-panel flex items-center justify-center shrink-0"
      aria-label="Cambiar tema"
    >
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
    <div className="min-h-screen w-full flex flex-col justify-center px-6 py-10 fade-in login-bg">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle isDark={isDark} toggleDark={toggleDark} />
      </div>

      <div className="w-full max-w-sm mx-auto relative z-10">
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 glass-panel">
            <BookMarked size={32} className="text-blue-500" />
          </div>
          <h1 className="font-display text-3xl font-bold leading-tight tracking-tight text-glow">Libro de Obra</h1>
          <p className="text-sm mt-2 opacity-70">Bitácora legal de obra, inmutable.</p>
        </div>

        <div className="rounded-3xl p-7 space-y-5 glass-panel">
          <div>
            <label className="text-xs font-semibold mb-2 block opacity-70 uppercase tracking-wider">Correo</label>
            <input
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              type="email"
              inputMode="email"
              placeholder="tu@empresa.cl"
              className="w-full rounded-2xl py-3.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 transition-all"
            />
          </div>
          <div>
            <label className="text-xs font-semibold mb-2 block opacity-70 uppercase tracking-wider">Contraseña</label>
            <input
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              type="password"
              placeholder="••••••••"
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="w-full rounded-2xl py-3.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 transition-all"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm rounded-2xl px-4 py-3 fade-in bg-red-500/15 text-red-600 dark:text-red-400">
              <TriangleAlert size={16} className="shrink-0" />
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn-tap btn-primary w-full flex items-center justify-center gap-2 text-base font-semibold rounded-2xl py-4 mt-2"
          >
            {loading ? <Loader2 size={18} className="spin" /> : <Lock size={17} />}
            {loading ? "Verificando…" : "Ingresar a Bitácora"}
          </button>

          <div className="pt-3 text-xs leading-relaxed opacity-60 text-center">
            <p className="font-semibold mb-1 opacity-80">Accesos Demo</p>
            <p className="font-mono">felipe@obra.cl · obra2026</p>
            <p className="font-mono">carla@ito.cl · ito2026</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FolioCard({ folio, currentRole, role, onAmend, onResolve }) {
  const cfg = CATEGORY_CONFIG[folio.category] || CATEGORY_CONFIG["Instrucción"];
  const isDraft = folio.status === "borrador";
  const CatIcon = cfg.Icon;
  const canQuickResolve = currentRole.canResolve && !isDraft && !folio.resultado && (folio.category === "Incidente" || folio.category === "Recepción de Partida");

  return (
    <article className="rounded-3xl overflow-hidden fade-in glass-panel p-5 space-y-4">
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-black/10 dark:bg-white/10">
          N°{foliostr(folio.folioNumber)}
        </span>
        <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ background: cfg.bg, color: cfg.color }}>
          <CatIcon size={14} /> {folio.category}
        </span>
        <span className="ml-auto text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-lg opacity-80" 
              style={{ background: isDraft ? 'rgba(0,0,0,0.05)' : 'var(--color-success-bg)', color: isDraft ? 'var(--text-muted)' : 'var(--color-success)' }}>
          {isDraft ? "Borrador" : "Firmado"}
        </span>
      </div>

      <h3 className="font-display font-semibold text-[1.1rem] leading-snug">{folio.title}</h3>
      <p className="text-[14px] leading-relaxed opacity-80">{folio.body}</p>

      {folio.resultado && (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg" style={{
          background: folio.resultado === "Aprobado" ? "var(--color-success-bg)" : "var(--color-danger-bg)",
          color: folio.resultado === "Aprobado" ? "var(--color-success)" : "var(--color-danger)"
        }}>
          {folio.resultado === "Aprobado" ? <CircleCheck size={14} /> : <CircleX size={14} />}
          {folio.resultado}
        </span>
      )}

      {folio.refFolio && (
        <p className="flex items-center gap-1.5 text-xs opacity-60">
          <Link2 size={14} /> Referencia Folio N°{foliostr(folio.refFolio)}
        </p>
      )}

      <div className="pt-3 flex items-center justify-between border-t border-black/5 dark:border-white/5 mt-2">
        <div>
          <p className="text-[11px] font-medium opacity-60">{folio.creatorName}</p>
          <p className="text-[10px] opacity-40">{formatDateTime(folio.createdAt)}</p>
        </div>
        {!isDraft && currentRole.canCreate && (
          <button onClick={() => onAmend(folio)} className="btn-tap px-4 py-2 rounded-xl text-xs font-semibold bg-black/5 dark:bg-white/10 hover:bg-black/10 transition-colors">
            Enmendar
          </button>
        )}
      </div>

      {canQuickResolve && (
        <div className="grid grid-cols-2 gap-2 pt-2">
          <button onClick={() => onResolve(folio.id, "Aprobado")} className="btn-tap py-2.5 rounded-xl text-sm font-semibold flex justify-center items-center gap-2" style={{ background: "var(--color-success-bg)", color: "var(--color-success)" }}>
            <CircleCheck size={16} /> Aprobar
          </button>
          <button onClick={() => onResolve(folio.id, "Rechazado")} className="btn-tap py-2.5 rounded-xl text-sm font-semibold flex justify-center items-center gap-2" style={{ background: "var(--color-danger-bg)", color: "var(--color-danger)" }}>
            <CircleX size={16} /> Rechazar
          </button>
        </div>
      )}
    </article>
  );
}

function ProjectScreen({ project, folios }) {
  const firmados = folios.filter((f) => f.status === "firmado").length;
  const incidentes = folios.filter((f) => f.category === "Incidente").length;
  
  return (
    <div className="px-5 py-5 space-y-5 fade-in">
      <div className="rounded-3xl p-6 space-y-4 glass-panel relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
        
        <div className="flex items-start gap-3 relative z-10">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-500 flex items-center justify-center shrink-0">
            <Building2 size={20} />
          </div>
          <div>
            <p className="font-display text-xl font-bold leading-tight">{project.name}</p>
            <p className="text-xs opacity-70 mt-1 flex items-center gap-1"><MapPin size={12}/> {project.address}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-xs font-mono opacity-60 bg-black/5 dark:bg-white/5 py-2 px-3 rounded-xl w-max relative z-10">
          <Hash size={14} /> Permiso: {project.permit}
        </div>
        
        <div className="pt-2 relative z-10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold opacity-70 uppercase tracking-wider">Avance de obra</span>
            <span className="text-sm font-mono font-bold text-blue-500">{project.progress}%</span>
          </div>
          <div className="w-full h-3 rounded-full overflow-hidden bg-black/10 dark:bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" style={{ width: `${project.progress}%` }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Folios", value: folios.length, color: "text-blue-500" },
          { label: "Firmados", value: firmados, color: "text-green-500" },
          { label: "Incidentes", value: incidentes, color: "text-red-500" },
        ].map((s) => (
          <div key={s.label} className="rounded-3xl p-5 text-center glass-panel flex flex-col items-center justify-center">
            <p className={`font-display text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] mt-1 opacity-70 uppercase tracking-wider font-semibold">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 text-xs rounded-2xl p-4 glass-panel border border-blue-500/20 bg-blue-500/5">
        <Lock size={24} className="shrink-0 text-blue-500" />
        <span className="leading-relaxed opacity-80">Los folios firmados forman parte del marco legal de la obra y son inmutables criptográficamente.</span>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  MAIN COMPONENT                                                     */
/* ================================================================== */

function AppContent() {
  const [session, setSession] = useState(null);
  const [project, setProject] = useState(null);
  const [folios, setFolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("bitacora");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Todas");
  
  // Theme logic
  const [isDark, setIsDark] = useState(false);
  
  useEffect(() => {
    // Check user preference or default to false (light) as requested
    const root = window.document.documentElement;
    if (isDark) root.classList.add("dark");
    else root.classList.remove("dark");
  }, [isDark]);

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
      } catch (e) {
        console.error(e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [session]);

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

  const handleLogout = useCallback(() => {
    setSession(null);
    setProject(null);
    setFolios([]);
    setTab("bitacora");
    setSearch("");
    setCategoryFilter("Todas");
  }, []);

  async function handleResolve(folioId, resultado) {
    await folioService.resolve(folioId, resultado);
    setFolios((prev) => prev.map((f) => (f.id === folioId ? { ...f, resultado } : f)));
  }

  function handleStartAmendment(folio) {
    alert("Enmienda iniciada para folio N° " + folio.folioNumber + ". (Demo)");
  }

  if (!session) {
    return <LoginScreen onLogin={setSession} isDark={isDark} toggleDark={() => setIsDark(!isDark)} />;
  }

  return (
    <div className="libro-obra-app min-h-screen w-full flex flex-col relative">
      
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none z-0 login-bg opacity-40"></div>

      {/* Barra superior */}
      <header className="sticky top-0 z-30 px-5 py-4 glass-panel border-b-0 border-x-0 rounded-none flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/30">
          <BookMarked size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-[1.05rem] font-bold leading-tight truncate">Libro de Obra</h1>
          <p className="text-xs truncate opacity-70 font-medium">
            {currentRole.short} · {currentRole.name}
          </p>
        </div>
        <ThemeToggle isDark={isDark} toggleDark={() => setIsDark(!isDark)} />
        <button onClick={handleLogout} className="btn-tap w-10 h-10 rounded-xl glass-panel flex items-center justify-center shrink-0 ml-1 text-red-500 hover:bg-red-500/10">
          <LogOut size={18} />
        </button>
      </header>

      {/* Contenido */}
      <main className="flex-1 overflow-y-auto pb-28 relative z-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 opacity-60">
            <Loader2 size={32} className="spin mb-4 text-blue-500" />
            <p className="text-sm font-medium tracking-wide uppercase">Sincronizando...</p>
          </div>
        ) : tab === "obra" ? (
          <ProjectScreen project={project} folios={folios} />
        ) : (
          <div className="px-5 py-5 space-y-5">
            {/* Buscador de cristal */}
            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar en bitácora..."
                className="w-full rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 glass-panel shadow-sm transition-all text-sm"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {["Todas", ...Object.keys(CATEGORY_CONFIG)].map((c) => {
                const active = categoryFilter === c;
                return (
                  <button
                    key={c}
                    onClick={() => setCategoryFilter(c)}
                    className="shrink-0 text-[13px] font-semibold px-4 py-2.5 rounded-full transition-all"
                    style={{
                      background: active ? "var(--color-primary)" : "var(--bg-glass)",
                      color: active ? "white" : "var(--text-main)",
                      boxShadow: active ? "0 4px 12px var(--color-primary-glow)" : "none",
                      border: active ? "none" : "1px solid var(--border-glass)",
                    }}
                  >
                    {c}
                  </button>
                );
              })}
            </div>

            {visibleFolios.length === 0 ? (
              <div className="text-center py-20 px-6 opacity-60">
                <ClipboardList size={40} className="mx-auto mb-4 opacity-50" />
                <p className="text-sm font-medium">No se encontraron folios.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {visibleFolios.map((folio) => (
                  <FolioCard
                    key={folio.id}
                    folio={folio}
                    currentRole={currentRole}
                    role={role}
                    onAmend={handleStartAmendment}
                    onResolve={handleResolve}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      {currentRole.canCreate && tab === "bitacora" && !loading && (
        <button
          className="btn-tap fixed z-40 right-5 flex items-center justify-center w-14 h-14 rounded-full font-semibold btn-primary"
          style={{ bottom: "calc(env(safe-area-inset-bottom) + 6rem)" }}
          onClick={() => alert("Crear nuevo folio (Demo)")}
        >
          <Plus size={24} />
        </button>
      )}

      {/* Navegación Inferior Flotante (estilo isla) */}
      <div className="fixed bottom-6 inset-x-0 z-30 px-6 flex justify-center pointer-events-none">
        <nav className="glass-panel rounded-full flex items-center p-1.5 shadow-2xl pointer-events-auto border-black/10 dark:border-white/10">
          {[
            { key: "bitacora", label: "Bitácora", Icon: BookMarked },
            { key: "obra", label: "Dashboard", Icon: Home },
          ].map(({ key, label, Icon }) => {
            const active = tab === key;
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                className="btn-tap flex items-center gap-2 px-6 py-3 rounded-full transition-all"
                style={{ 
                  background: active ? "var(--color-primary)" : "transparent",
                  color: active ? "white" : "var(--text-muted)"
                }}
              >
                <Icon size={18} strokeWidth={active ? 2.5 : 2} />
                {active && <span className="text-sm font-semibold">{label}</span>}
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
