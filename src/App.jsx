import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  Building2, MapPin, Hash, TrendingUp, Search, Plus, X,
  CircleCheck, CircleX, TriangleAlert, Link2, ClipboardList,
  RefreshCcw, Lock, LogOut, BookMarked, Loader2, Home,
  Sun, Moon, Camera, Image, Trash2,
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
          <p style={{ fontSize: 13, opacity: 0.6, marginBottom: 20 }}>Error inesperado al renderizar la interfaz.</p>
          <pre style={{ fontSize: 11, background: "rgba(0,0,0,0.05)", padding: 16, borderRadius: 12, maxWidth: "100%", overflow: "auto", textAlign: "left", marginBottom: 20 }}>{this.state.error?.toString()}</pre>
          <button onClick={() => window.location.reload()} className="btn-tap btn-accent" style={{ padding: "12px 28px", borderRadius: 12, border: "none", fontWeight: 600 }}>Recargar</button>
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
  Avance: { color: "var(--text-muted)", bg: "rgba(160,174,192,0.12)", Icon: TrendingUp },
  "Recepción de Partida": { color: "var(--color-success)", bg: "var(--color-success-bg)", Icon: CircleCheck },
  Incidente: { color: "var(--color-danger)", bg: "var(--color-danger-bg)", Icon: TriangleAlert },
  Modificación: { color: "var(--color-warning)", bg: "var(--color-warning-bg)", Icon: RefreshCcw },
};

const ROLES = {
  constructor: { label: "Administrador de Obra", short: "Constructor", name: "Mauricio Jilabert", canCreate: true, canComment: false, canResolve: false, categories: ["Avance", "Incidente", "Modificación", "Recepción de Partida"] },
  ito: { label: "ITO — Inspector Técnico", short: "ITO", name: "Carlos Reyes", canCreate: true, canComment: false, canResolve: true, categories: ["Instrucción", "Incidente", "Recepción de Partida"] },
};

const MOCK_CREDENTIALS = {
  "mauricio@test.cl": { password: "test123", role: "constructor" },
  "carlitos@test.cl": { password: "test123", role: "ito" },
};

const PROJECT = { name: "Edificio Mirador del Parque", address: "Av. Las Industrias 4521, Renca, Santiago", permit: "DOM-RENCA-0142/2024", progress: 62 };

const INITIAL_FOLIOS = [
  { id: 11, folioNumber: 11, category: "Recepción de Partida", title: "Recepción de enfierradura de fundaciones eje A-B", body: "Se verifica en terreno la enfierradura de fundaciones corridas entre los ejes A y B, conforme a cuantía y diámetros indicados en plano EST-04 rev.2. Recubrimiento mínimo de 5 cm cumplido según NCh429.", resultado: "Aprobado", creatorRole: "ito", creatorName: "Carlos Reyes", createdAt: "2026-06-22T09:15:00", status: "firmado", signedAt: "2026-06-22T09:22:00", signature: { code: "AF3-991-KX" }, refFolio: null, geo: { lat: -33.4012, lng: -70.7289 }, photos: [], comments: [] },
  { id: 12, folioNumber: 12, category: "Incidente", title: "Rotura de matriz de agua potable en eje C-3", body: "Retroexcavadora CAT 320 impactó matriz de agua potable de 110 mm a 1,2 m de profundidad. Se corta suministro general a las 10:47 hrs. Sin personal lesionado.", resultado: null, creatorRole: "constructor", creatorName: "Mauricio Jilabert", createdAt: "2026-06-25T10:55:00", status: "firmado", signedAt: "2026-06-25T11:03:00", signature: { code: "AF3-114-QP" }, refFolio: null, geo: { lat: -33.4018, lng: -70.7301 }, photos: [], comments: [] },
  { id: 13, folioNumber: 13, category: "Instrucción", title: "Refuerzo de moldaje en losa nivel 2", body: "Se instruye reforzar apuntalamiento del moldaje de losa nivel 2, paño entre ejes 3-5 / B-D, por deflexión superior a la tolerancia admisible. Plazo: inmediato.", resultado: null, creatorRole: "ito", creatorName: "Carlos Reyes", createdAt: "2026-06-29T08:40:00", status: "firmado", signedAt: "2026-06-29T08:44:00", signature: { code: "AF3-227-TV" }, refFolio: null, geo: null, photos: [], comments: [] },
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
  async sign(f) { await netDelay(700); const code = "AF" + Math.floor(100 + Math.random() * 899) + "-" + Math.random().toString(36).slice(2, 6).toUpperCase(); return { ...f, status: "firmado", signedAt: new Date().toISOString(), signature: { code } }; },
  async resolve(id, r) { await netDelay(400); return { id, r }; },
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
/*  COMPONENTE: CAPTURA DE FOTOS                                       */
/* ================================================================== */
function PhotoCapture({ photos, onPhotosChange }) {
  const fileRef = useRef(null);

  function handleCapture(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const newPhotos = files.map((file) => ({
      id: Date.now() + Math.random(),
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
    }));
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
        {/* Botón Cámara */}
        <button type="button" onClick={() => { fileRef.current.setAttribute("capture", "environment"); fileRef.current.click(); }}
          className="btn-tap" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 0", borderRadius: 12, border: "1px solid var(--border-glass)", background: "var(--bg-glass)", color: "var(--text-main)", fontWeight: 600, fontSize: 13 }}>
          <Camera size={18} /> Cámara
        </button>
        {/* Botón Galería */}
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
              <button onClick={() => removePhoto(p.id)}
                style={{ position: "absolute", top: 4, right: 4, width: 22, height: 22, borderRadius: "50%", background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  COMPONENTE: CREAR NUEVO FOLIO (con fotos)                          */
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
      id: Date.now(), folioNumber: nextFolioNumber, category, title: title.trim(), body: body.trim(),
      resultado: null, creatorRole: role, creatorName: currentRole.name,
      createdAt: new Date().toISOString(), status: "borrador", signedAt: null, signature: null,
      refFolio: null, geo: null,
      photos: photos.map((p) => ({ id: p.id, name: p.name, preview: p.preview })),
      comments: [],
    };
    const created = await folioService.create(folio);
    onSave({ ...folio, createdAt: created.createdAt });
    setSaving(false);
  }

  return (
    <div className="fade-in" style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <div className="sheet-enter glass-panel" style={{ width: "100%", maxWidth: 480, maxHeight: "92vh", overflowY: "auto", borderRadius: "24px 24px 0 0", padding: 24 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 className="font-display" style={{ fontSize: 18, fontWeight: 700 }}>Nuevo Folio N°{foliostr(nextFolioNumber)}</h2>
          <button onClick={onClose} style={{ padding: 8, background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}><X size={22} /></button>
        </div>

        {/* Categoría */}
        <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>Categoría</label>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 18 }}>
          {currentRole.categories.map((c) => {
            const active = category === c;
            const cfg = CATEGORY_CONFIG[c];
            return (
              <button key={c} onClick={() => setCategory(c)} type="button"
                style={{ fontSize: 12, fontWeight: 600, padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer", background: active ? cfg.bg : "rgba(0,0,0,0.04)", color: active ? cfg.color : "var(--text-muted)" }}>
                {c}
              </button>
            );
          })}
        </div>

        {/* Título */}
        <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>Título</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Descripción breve del registro…"
          style={{ width: "100%", borderRadius: 12, padding: "13px 14px", marginBottom: 18, background: "rgba(0,0,0,0.04)", border: "1px solid var(--border-glass)", color: "var(--text-main)", outline: "none" }} />

        {/* Cuerpo */}
        <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>Descripción detallada</label>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Descripción técnica completa del registro…" rows={4}
          style={{ width: "100%", borderRadius: 12, padding: "13px 14px", marginBottom: 18, background: "rgba(0,0,0,0.04)", border: "1px solid var(--border-glass)", color: "var(--text-main)", outline: "none", resize: "vertical", fontFamily: "inherit" }} />

        {/* Fotos */}
        <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>Evidencia fotográfica</label>
        <PhotoCapture photos={photos} onPhotosChange={setPhotos} />

        {/* Guardar */}
        <button onClick={handleSave} disabled={saving || !title.trim() || !body.trim()}
          className="btn-tap btn-accent" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 15, fontWeight: 600, borderRadius: 14, padding: "14px 0", border: "none", marginTop: 20, opacity: (saving || !title.trim() || !body.trim()) ? 0.5 : 1 }}>
          {saving ? <Loader2 size={18} className="spin" /> : <Plus size={18} />}
          {saving ? "Guardando…" : "Crear Folio como Borrador"}
        </button>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  COMPONENTES UI                                                     */
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
    if (!email.trim() || !password) { setError("Ingresa tu correo y contraseña."); return; }
    setLoading(true);
    try { onLogin(await authService.login(email, password)); }
    catch (e) { setError(e.message); setLoading(false); }
  }

  return (
    <div className="fade-in login-bg" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "40px 24px" }}>
      <div style={{ position: "absolute", top: 16, right: 16, zIndex: 10 }}>
        <ThemeToggle isDark={isDark} toggleDark={toggleDark} />
      </div>

      <div style={{ width: "100%", maxWidth: 380, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div className="glass-panel" style={{ width: 60, height: 60, borderRadius: 18, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
            <BookMarked size={30} style={{ color: "var(--accent)" }} />
          </div>
          <h1 className="font-display" style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 6 }}>Libro de Obra</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Bitácora digital de obra · Inmutable</p>
        </div>

        <div className="glass-panel" style={{ borderRadius: 24, padding: 28 }}>
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>Correo</label>
            <input value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }} type="email" inputMode="email" placeholder="tu@empresa.cl"
              style={{ width: "100%", borderRadius: 14, padding: "14px 16px", background: "rgba(0,0,0,0.04)", border: "1px solid var(--border-glass)", color: "var(--text-main)", outline: "none" }} />
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>Contraseña</label>
            <input value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }} type="password" placeholder="••••••••" onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              style={{ width: "100%", borderRadius: 14, padding: "14px 16px", background: "rgba(0,0,0,0.04)", border: "1px solid var(--border-glass)", color: "var(--text-main)", outline: "none" }} />
          </div>

          {error && (
            <div className="fade-in" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, borderRadius: 14, padding: "12px 14px", marginBottom: 16, background: "var(--color-danger-bg)", color: "var(--color-danger)" }}>
              <TriangleAlert size={16} style={{ flexShrink: 0 }} /> {error}
            </div>
          )}

          <button onClick={handleSubmit} disabled={loading} className="btn-tap btn-accent"
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 15, fontWeight: 600, borderRadius: 14, padding: "14px 0", border: "none", opacity: loading ? 0.7 : 1 }}>
            {loading ? <Loader2 size={18} className="spin" /> : <Lock size={17} />}
            {loading ? "Verificando…" : "Ingresar a Bitácora"}
          </button>

          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border-glass)", textAlign: "center" }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Accesos Demo</p>
            <p className="font-mono" style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.8 }}>mauricio@test.cl · test123</p>
            <p className="font-mono" style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.8 }}>carlitos@test.cl · test123</p>
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
    <article className="glass-panel fade-in" style={{ borderRadius: 20, padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        <span className="font-mono" style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 8, background: "var(--accent)", color: "#fff" }}>N°{foliostr(folio.folioNumber)}</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 8, background: cfg.bg, color: cfg.color }}>
          <CatIcon size={12} /> {folio.category}
        </span>
        <span style={{ marginLeft: "auto", fontSize: 9, fontWeight: 700, padding: "4px 8px", borderRadius: 6, textTransform: "uppercase", letterSpacing: "0.06em", background: isDraft ? "rgba(0,0,0,0.05)" : "var(--color-success-bg)", color: isDraft ? "var(--text-muted)" : "var(--color-success)" }}>
          {isDraft ? "Borrador" : "Firmado"}
        </span>
      </div>

      <h3 className="font-display" style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.4, marginBottom: 8 }}>{folio.title}</h3>
      <p style={{ fontSize: 13, lineHeight: 1.7, color: "var(--text-muted)", marginBottom: 10 }}>{folio.body}</p>

      {folio.resultado && (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, padding: "5px 12px", borderRadius: 8, marginBottom: 10, background: folio.resultado === "Aprobado" ? "var(--color-success-bg)" : "var(--color-danger-bg)", color: folio.resultado === "Aprobado" ? "var(--color-success)" : "var(--color-danger)" }}>
          {folio.resultado === "Aprobado" ? <CircleCheck size={13} /> : <CircleX size={13} />} {folio.resultado}
        </span>
      )}

      {folio.refFolio && <p style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}><Link2 size={13} /> Ref. Folio N°{foliostr(folio.refFolio)}</p>}

      {/* Photos attached */}
      {folio.photos && folio.photos.length > 0 && (
        <div className="photo-grid" style={{ marginBottom: 12 }}>
          {folio.photos.map((p) => <img key={p.id} src={p.preview} alt={p.name} />)}
        </div>
      )}

      <div style={{ paddingTop: 12, marginTop: 10, borderTop: "1px solid var(--border-glass)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 500, color: "var(--text-muted)" }}>{folio.creatorName}</p>
          <p style={{ fontSize: 10, color: "var(--text-muted)", opacity: 0.6 }}>{formatDateTime(folio.createdAt)}</p>
        </div>
        {!isDraft && currentRole.canCreate && (
          <button onClick={() => onAmend(folio)} className="btn-tap" style={{ padding: "8px 16px", borderRadius: 10, fontSize: 12, fontWeight: 600, background: "rgba(0,0,0,0.04)", color: "var(--text-muted)", border: "1px solid var(--border-glass)", minHeight: 36 }}>Enmendar</button>
        )}
      </div>

      {canQuickResolve && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, paddingTop: 12 }}>
          <button onClick={() => onResolve(folio.id, "Aprobado")} className="btn-tap" style={{ padding: "10px 0", borderRadius: 10, fontSize: 13, fontWeight: 600, display: "flex", justifyContent: "center", alignItems: "center", gap: 6, background: "var(--color-success-bg)", color: "var(--color-success)", border: "none" }}><CircleCheck size={16} /> Aprobar</button>
          <button onClick={() => onResolve(folio.id, "Rechazado")} className="btn-tap" style={{ padding: "10px 0", borderRadius: 10, fontSize: 13, fontWeight: 600, display: "flex", justifyContent: "center", alignItems: "center", gap: 6, background: "var(--color-danger-bg)", color: "var(--color-danger)", border: "none" }}><CircleX size={16} /> Rechazar</button>
        </div>
      )}
    </article>
  );
}

function ProjectScreen({ project, folios }) {
  const firmados = folios.filter((f) => f.status === "firmado").length;
  const incidentes = folios.filter((f) => f.category === "Incidente").length;

  return (
    <div className="fade-in" style={{ padding: 20 }}>
      <div className="glass-panel" style={{ borderRadius: 22, padding: 24, marginBottom: 16, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, right: 0, width: 140, height: 140, borderRadius: "50%", background: "var(--accent-glow)", filter: "blur(60px)", pointerEvents: "none" }} />
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 16, position: "relative", zIndex: 1 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: "var(--accent-glow)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Building2 size={22} /></div>
          <div>
            <p className="font-display" style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.3 }}>{project.name}</p>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}><MapPin size={12} /> {project.address}</p>
          </div>
        </div>
        <div className="font-mono" style={{ fontSize: 11, color: "var(--text-muted)", background: "rgba(0,0,0,0.04)", padding: "8px 12px", borderRadius: 10, display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 18, position: "relative", zIndex: 1 }}><Hash size={13} /> {project.permit}</div>
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Avance</span>
            <span className="font-mono" style={{ fontSize: 14, fontWeight: 700, color: "var(--accent)" }}>{project.progress}%</span>
          </div>
          <div style={{ width: "100%", height: 8, borderRadius: 4, background: "rgba(0,0,0,0.08)", overflow: "hidden" }}>
            <div style={{ width: `${project.progress}%`, height: "100%", borderRadius: 4, background: `linear-gradient(90deg, var(--accent), var(--color-info))`, boxShadow: `0 0 12px var(--accent-glow)` }} />
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
        {[
          { label: "Folios", value: folios.length, color: "var(--accent)" },
          { label: "Firmados", value: firmados, color: "var(--color-success)" },
          { label: "Incidentes", value: incidentes, color: "var(--color-danger)" },
        ].map((s) => (
          <div key={s.label} className="glass-panel" style={{ borderRadius: 18, padding: 20, textAlign: "center" }}>
            <p className="font-display" style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</p>
            <p style={{ fontSize: 10, marginTop: 4, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="glass-panel" style={{ borderRadius: 14, padding: 16, display: "flex", alignItems: "center", gap: 12 }}>
        <Lock size={20} style={{ flexShrink: 0, color: "var(--accent)" }} />
        <span style={{ fontSize: 12, lineHeight: 1.6, color: "var(--text-muted)" }}>Los folios firmados son inmutables criptográficamente.</span>
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
  const [showNew, setShowNew] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) root.classList.add("dark"); else root.classList.remove("dark");
  }, [isDark]);

  const role = session?.role;
  const currentRole = role ? ROLES[role] : null;

  useEffect(() => {
    if (!session) return;
    let alive = true;
    (async () => {
      setLoading(true);
      try { const [proj, list] = await Promise.all([projectService.get(), folioService.list()]); if (!alive) return; setProject(proj); setFolios(list); }
      catch (e) { console.error(e); }
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, [session]);

  const nextFolioNumber = useMemo(() => Math.max(0, ...folios.map((f) => f.folioNumber)) + 1, [folios]);

  const visibleFolios = useMemo(() => {
    if (!role) return [];
    return folios
      .filter((f) => (categoryFilter === "Todas" ? true : f.category === categoryFilter))
      .filter((f) => { if (!search.trim()) return true; const q = search.toLowerCase(); return f.title.toLowerCase().includes(q) || f.body.toLowerCase().includes(q) || String(f.folioNumber).includes(q); })
      .sort((a, b) => b.folioNumber - a.folioNumber);
  }, [folios, role, categoryFilter, search]);

  const handleLogout = useCallback(() => { setSession(null); setProject(null); setFolios([]); setTab("bitacora"); setSearch(""); setCategoryFilter("Todas"); }, []);

  async function handleResolve(folioId, resultado) {
    await folioService.resolve(folioId, resultado);
    setFolios((prev) => prev.map((f) => (f.id === folioId ? { ...f, resultado } : f)));
  }
  function handleStartAmendment(folio) { alert("Enmienda iniciada para folio N° " + folio.folioNumber + ". (Demo)"); }
  function handleNewFolioSave(folio) { setFolios((prev) => [...prev, folio]); setShowNew(false); }

  if (!session) return <LoginScreen onLogin={setSession} isDark={isDark} toggleDark={() => setIsDark(!isDark)} />;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header className="glass-panel" style={{ position: "sticky", top: 0, zIndex: 30, padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, borderRadius: 0, borderTop: "none", borderLeft: "none", borderRight: "none" }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 0 18px var(--accent-glow)` }}>
          <BookMarked size={20} color="#fff" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 className="font-display" style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Libro de Obra</h1>
          <p style={{ fontSize: 11, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentRole.short} · {currentRole.name}</p>
        </div>
        <ThemeToggle isDark={isDark} toggleDark={() => setIsDark(!isDark)} />
        <button onClick={handleLogout} className="btn-tap glass-panel" style={{ width: 40, height: 40, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-danger)", minHeight: 40 }} aria-label="Salir">
          <LogOut size={18} />
        </button>
      </header>

      <main style={{ flex: 1, overflowY: "auto", paddingBottom: 110 }}>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "120px 0", color: "var(--text-muted)" }}>
            <Loader2 size={28} className="spin" style={{ marginBottom: 12, color: "var(--accent)" }} />
            <p style={{ fontSize: 12, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em" }}>Sincronizando…</p>
          </div>
        ) : tab === "obra" ? (
          <ProjectScreen project={project} folios={folios} />
        ) : (
          <div style={{ padding: 20 }}>
            <div style={{ position: "relative", marginBottom: 16 }}>
              <Search size={17} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar en bitácora…"
                className="glass-panel" style={{ width: "100%", borderRadius: 16, padding: "14px 14px 14px 42px", outline: "none", color: "var(--text-main)", fontSize: 14 }} />
            </div>
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 14, marginBottom: 6 }}>
              {["Todas", ...Object.keys(CATEGORY_CONFIG)].map((c) => {
                const active = categoryFilter === c;
                return (
                  <button key={c} onClick={() => setCategoryFilter(c)} className="btn-tap"
                    style={{ flexShrink: 0, fontSize: 12, fontWeight: 600, padding: "8px 16px", borderRadius: 10, border: "none", minHeight: 36,
                      background: active ? "var(--accent)" : "var(--bg-glass)", color: active ? "#fff" : "var(--text-main)",
                      boxShadow: active ? `0 4px 12px var(--accent-glow)` : "none" }}>
                    {c}
                  </button>
                );
              })}
            </div>
            {visibleFolios.length === 0 ? (
              <div style={{ textAlign: "center", padding: "80px 24px", color: "var(--text-muted)" }}>
                <ClipboardList size={36} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
                <p style={{ fontSize: 13 }}>No se encontraron folios.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {visibleFolios.map((folio) => <FolioCard key={folio.id} folio={folio} currentRole={currentRole} role={role} onAmend={handleStartAmendment} onResolve={handleResolve} />)}
              </div>
            )}
          </div>
        )}
      </main>

      {/* FAB */}
      {currentRole.canCreate && tab === "bitacora" && !loading && (
        <button onClick={() => setShowNew(true)} className="btn-tap btn-accent"
          style={{ position: "fixed", zIndex: 40, right: 20, bottom: 100, width: 56, height: 56, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", border: "none" }}>
          <Plus size={24} />
        </button>
      )}

      {/* Bottom Nav */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 30, padding: "10px 20px", paddingBottom: "max(10px, env(safe-area-inset-bottom))" }}>
        <nav className="glass-panel" style={{ borderRadius: 18, display: "flex", padding: 5, gap: 4 }}>
          {[
            { key: "bitacora", label: "Bitácora", Icon: BookMarked },
            { key: "obra", label: "Dashboard", Icon: Home },
          ].map(({ key, label, Icon }) => {
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

      {/* Modal crear folio */}
      {showNew && <NewFolioSheet role={role} nextFolioNumber={nextFolioNumber} onClose={() => setShowNew(false)} onSave={handleNewFolioSave} />}
    </div>
  );
}

export default function App() {
  return <ErrorBoundary><AppContent /></ErrorBoundary>;
}
