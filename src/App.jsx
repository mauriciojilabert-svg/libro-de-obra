import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  Building2, MapPin, Hash, TrendingUp, Search, Plus, X, ChevronLeft,
  CircleCheck, CircleX, TriangleAlert, Link2, ClipboardList,
  RefreshCcw, Lock, LogOut, BookMarked, Loader2, Home,
  Sun, Moon, Camera, Image, Save, Edit3, Eye,
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
/*  CONFIGURACIÓN                                                      */
/* ================================================================== */
const CATEGORY_CONFIG = {
  Instrucción: { color: "var(--color-info)", bg: "var(--color-info-bg)", Icon: ClipboardList },
  Avance: { color: "#2563EB", bg: "rgba(37,99,235,0.12)", Icon: TrendingUp },
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

const PROJECTS = [
  { id: 1, name: "Edificio Mirador del Parque", address: "Av. Las Industrias 4521, Renca, Santiago", permit: "DOM-RENCA-0142/2024", progress: 62 },
  { id: 2, name: "Condominio Los Aromos II", address: "Calle Los Nogales 890, Ñuñoa, Santiago", permit: "DOM-NUNOA-0087/2025", progress: 28 },
  { id: 3, name: "Centro Comercial Plaza Norte", address: "Av. Américo Vespucio 1200, Huechuraba", permit: "DOM-HUECH-0211/2024", progress: 91 },
  { id: 4, name: "Hospital Regional de Rancagua", address: "Av. Libertador B. O'Higgins 3500, Rancagua", permit: "DOM-RANC-0015/2025", progress: 12 },
];

const ALL_FOLIOS = {
  1: [
    { id: 11, folioNumber: 11, category: "Recepción de Partida", title: "Recepción de enfierradura de fundaciones eje A-B", body: "Se verifica en terreno la enfierradura de fundaciones corridas entre los ejes A y B, conforme a cuantía y diámetros indicados en plano EST-04 rev.2. Recubrimiento mínimo de 5 cm cumplido según NCh429.", resultado: "Aprobado", creatorRole: "ito", creatorName: "Carlos Reyes", createdAt: "2026-06-22T09:15:00", status: "firmado", signedAt: "2026-06-22T09:22:00", signature: { code: "AF3-991-KX" }, refFolio: null, geo: { lat: -33.4012, lng: -70.7289 }, photos: [], comments: [] },
    { id: 12, folioNumber: 12, category: "Incidente", title: "Rotura de matriz de agua potable en eje C-3", body: "Retroexcavadora CAT 320 impactó matriz de agua potable de 110 mm a 1,2 m de profundidad. Se corta suministro a las 10:47 hrs. Sin personal lesionado.", resultado: null, creatorRole: "constructor", creatorName: "Mauricio Jilabert", createdAt: "2026-06-25T10:55:00", status: "firmado", signedAt: "2026-06-25T11:03:00", signature: { code: "AF3-114-QP" }, refFolio: null, geo: null, photos: [], comments: [] },
    { id: 13, folioNumber: 13, category: "Instrucción", title: "Refuerzo de moldaje en losa nivel 2", body: "Se instruye reforzar apuntalamiento del moldaje de losa nivel 2, paño entre ejes 3-5 / B-D, por deflexión superior a la tolerancia. Plazo: inmediato.", resultado: null, creatorRole: "ito", creatorName: "Carlos Reyes", createdAt: "2026-06-29T08:40:00", status: "firmado", signedAt: "2026-06-29T08:44:00", signature: { code: "AF3-227-TV" }, refFolio: null, geo: null, photos: [], comments: [] },
    { id: 14, folioNumber: 14, category: "Avance", title: "Hormigonado de losa nivel 1 completado", body: "Se informa término de hormigonado de losa de entrepiso nivel 1, superficie total 480 m², resistencia H-30. Avance acumulado de obra gruesa: 62%.", resultado: null, creatorRole: "constructor", creatorName: "Mauricio Jilabert", createdAt: "2026-07-03T17:20:00", status: "firmado", signedAt: "2026-07-03T17:26:00", signature: { code: "AF3-305-LR" }, refFolio: null, geo: null, photos: [], comments: [] },
    { id: 15, folioNumber: 15, category: "Modificación", title: "Cambio de impermeabilización de cubierta", body: "Se propone modificar sistema de impermeabilización de cubierta desde membrana asfáltica a poliuretano líquido aplicado in situ. Pendiente cubicación de costo diferencial.", resultado: null, creatorRole: "constructor", creatorName: "Mauricio Jilabert", createdAt: "2026-07-10T12:05:00", status: "borrador", signedAt: null, signature: null, refFolio: null, geo: null, photos: [], comments: [] },
  ],
  2: [
    { id: 21, folioNumber: 1, category: "Avance", title: "Inicio de excavación de fundaciones", body: "Se da inicio a la excavación masiva de fundaciones en el sector A del condominio. Profundidad de proyecto: 2,5 m. Suelo tipo IV según mecánica de suelos.", resultado: null, creatorRole: "constructor", creatorName: "Mauricio Jilabert", createdAt: "2026-07-01T08:30:00", status: "firmado", signedAt: "2026-07-01T08:35:00", signature: { code: "AF2-101-AB" }, refFolio: null, geo: null, photos: [], comments: [] },
    { id: 22, folioNumber: 2, category: "Incidente", title: "Hallazgo arqueológico en excavación sector B", body: "Durante excavación a 1,8 m se encuentran restos cerámicos. Se paraliza faena en sector B y se notifica al Consejo de Monumentos Nacionales según protocolo.", resultado: null, creatorRole: "constructor", creatorName: "Mauricio Jilabert", createdAt: "2026-07-05T11:20:00", status: "firmado", signedAt: "2026-07-05T11:30:00", signature: { code: "AF2-102-CD" }, refFolio: null, geo: null, photos: [], comments: [] },
    { id: 23, folioNumber: 3, category: "Instrucción", title: "Modificación de trazado de fundaciones sector B", body: "Se instruye reubicar fundaciones del sector B 3 metros al norte para resguardar zona de hallazgo arqueológico. Nuevo trazado aprobado por calculista.", resultado: null, creatorRole: "ito", creatorName: "Carlos Reyes", createdAt: "2026-07-12T09:00:00", status: "borrador", signedAt: null, signature: null, refFolio: null, geo: null, photos: [], comments: [] },
  ],
  3: [
    { id: 31, folioNumber: 1, category: "Recepción de Partida", title: "Recepción de estructura metálica nivel 3", body: "Se recibe montaje de estructura metálica del nivel 3 del centro comercial. Conexiones soldadas verificadas por ensayo de ultrasonido. 100% aprobadas.", resultado: "Aprobado", creatorRole: "ito", creatorName: "Carlos Reyes", createdAt: "2026-05-15T10:00:00", status: "firmado", signedAt: "2026-05-15T10:10:00", signature: { code: "AF1-301-EF" }, refFolio: null, geo: null, photos: [], comments: [] },
    { id: 32, folioNumber: 2, category: "Avance", title: "Instalación completa de sistema HVAC", body: "Se informa término de instalación del sistema de climatización central. 48 unidades evaporadoras y 6 condensadoras instaladas según proyecto mecánico.", resultado: null, creatorRole: "constructor", creatorName: "Mauricio Jilabert", createdAt: "2026-06-20T16:00:00", status: "firmado", signedAt: "2026-06-20T16:08:00", signature: { code: "AF1-302-GH" }, refFolio: null, geo: null, photos: [], comments: [] },
    { id: 33, folioNumber: 3, category: "Avance", title: "Terminaciones de piso porcelanato nivel 1", body: "Completada la instalación de porcelanato 60x60 en todo el nivel 1 del centro comercial. Superficie total: 3.200 m². Pendiente fragüe en zona de food court.", resultado: null, creatorRole: "constructor", creatorName: "Mauricio Jilabert", createdAt: "2026-07-08T14:30:00", status: "firmado", signedAt: "2026-07-08T14:40:00", signature: { code: "AF1-303-IJ" }, refFolio: null, geo: null, photos: [], comments: [] },
  ],
  4: [
    { id: 41, folioNumber: 1, category: "Avance", title: "Instalación de faenas y cierre perimetral", body: "Se instala oficina de obra, bodega de materiales, baños químicos y cierre perimetral de malla Acmafor en todo el perímetro del terreno hospitalario.", resultado: null, creatorRole: "constructor", creatorName: "Mauricio Jilabert", createdAt: "2026-07-20T09:00:00", status: "firmado", signedAt: "2026-07-20T09:10:00", signature: { code: "AF4-401-KL" }, refFolio: null, geo: null, photos: [], comments: [] },
    { id: 42, folioNumber: 2, category: "Instrucción", title: "Protocolo de trabajo en zona de atención médica", body: "Se establece protocolo especial de trabajo por proximidad con pabellones en funcionamiento. Horario restringido de maquinaria pesada: 09:00 a 17:00 hrs.", resultado: null, creatorRole: "ito", creatorName: "Carlos Reyes", createdAt: "2026-07-22T08:15:00", status: "borrador", signedAt: null, signature: null, refFolio: null, geo: null, photos: [], comments: [] },
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
    if (!account || account.password !== password) throw new Error("Correo o contraseña incorrectos.");
    return { token: "mock.jwt." + btoa(email).slice(0, 12), role: account.role, user: ROLES[account.role] };
  },
};
const folioService = {
  async create(p) { await netDelay(300); return { ...p, createdAt: new Date().toISOString() }; },
  async resolve(id, r) { await netDelay(300); return { id, r }; },
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
    const folio = { id: Date.now(), folioNumber: nextFolioNumber, category, title: title.trim(), body: body.trim(), resultado: null, creatorRole: role, creatorName: currentRole.name, createdAt: new Date().toISOString(), status: "borrador", signedAt: null, signature: null, refFolio: null, geo: null, photos: photos.map((p) => ({ id: p.id, name: p.name, preview: p.preview })), comments: [] };
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
          {currentRole.categories.map((c) => { const active = category === c; const cfg = CATEGORY_CONFIG[c]; return (
            <button key={c} onClick={() => setCategory(c)} type="button" style={{ fontSize: 12, fontWeight: 600, padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer", background: active ? cfg.bg : "rgba(0,0,0,0.04)", color: active ? cfg.color : "var(--text-muted)" }}>{c}</button>
          ); })}
        </div>
        <label style={labelStyle}>Título</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Descripción breve…" style={inputStyle} />
        <label style={labelStyle}>Descripción detallada</label>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Descripción técnica…" rows={4} style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }} />
        <label style={labelStyle}>Evidencia fotográfica</label>
        <PhotoCapture photos={photos} onPhotosChange={setPhotos} />
        <button onClick={handleSave} disabled={saving || !title.trim() || !body.trim()} className="btn-tap btn-accent" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 15, fontWeight: 600, borderRadius: 14, padding: "14px 0", border: "none", marginTop: 20, opacity: (saving || !title.trim() || !body.trim()) ? 0.5 : 1 }}>
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
/*  DETALLE DE FOLIO (con edición si es borrador)                      */
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

  async function handleSave() {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    onUpdate({ ...folio, title: title.trim(), body: body.trim(), photos });
    setSaving(false);
    setEditing(false);
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
        {isDraft && !editing && (
          <button onClick={() => setEditing(true)} className="btn-tap" style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, border: "none", background: "var(--accent)", color: "#fff", fontWeight: 600, fontSize: 12, minHeight: 36 }}>
            <Edit3 size={14} /> Editar
          </button>
        )}
      </div>

      <div style={{ padding: 20, maxWidth: 600, margin: "0 auto" }}>
        {/* Status badges */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, padding: "5px 12px", borderRadius: 8, background: cfg.bg, color: cfg.color }}><CatIcon size={13} /> {folio.category}</span>
          <span style={{ fontSize: 10, fontWeight: 700, padding: "5px 10px", borderRadius: 6, textTransform: "uppercase", letterSpacing: "0.06em", background: isDraft ? "rgba(0,0,0,0.05)" : "var(--color-success-bg)", color: isDraft ? "var(--text-muted)" : "var(--color-success)" }}>{isDraft ? "Borrador" : "Firmado"}</span>
          {folio.resultado && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, padding: "5px 12px", borderRadius: 8, background: folio.resultado === "Aprobado" ? "var(--color-success-bg)" : "var(--color-danger-bg)", color: folio.resultado === "Aprobado" ? "var(--color-success)" : "var(--color-danger)" }}>
              {folio.resultado === "Aprobado" ? <CircleCheck size={13} /> : <CircleX size={13} />} {folio.resultado}
            </span>
          )}
        </div>

        {/* Editable content */}
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

        {/* Metadata */}
        {!editing && (
          <div className="glass-panel" style={{ borderRadius: 16, padding: 16, marginTop: 10 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 12 }}>
              <div><p style={{ color: "var(--text-muted)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", marginBottom: 2 }}>Creado por</p><p style={{ fontWeight: 600 }}>{folio.creatorName}</p></div>
              <div><p style={{ color: "var(--text-muted)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", marginBottom: 2 }}>Fecha</p><p style={{ fontWeight: 500 }}>{formatDateTime(folio.createdAt)}</p></div>
              {folio.signature && <div><p style={{ color: "var(--text-muted)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", marginBottom: 2 }}>Firma</p><p className="font-mono" style={{ fontWeight: 600 }}>{folio.signature.code}</p></div>}
              {folio.signedAt && <div><p style={{ color: "var(--text-muted)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", marginBottom: 2 }}>Firmado el</p><p style={{ fontWeight: 500 }}>{formatDateTime(folio.signedAt)}</p></div>}
            </div>
          </div>
        )}
      </div>
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
      {/* Current project */}
      <div className="glass-panel" style={{ borderRadius: 22, padding: 22, marginBottom: 16, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, right: 0, width: 120, height: 120, borderRadius: "50%", background: "var(--accent-glow)", filter: "blur(50px)", pointerEvents: "none" }} />
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14, position: "relative", zIndex: 1 }}>
          <div style={{ width: 42, height: 42, borderRadius: 14, background: "var(--accent-glow)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Building2 size={20} /></div>
          <div>
            <p className="font-display" style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.3 }}>{project.name}</p>
            <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}><MapPin size={11} /> {project.address}</p>
          </div>
        </div>
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Avance</span>
            <span className="font-mono" style={{ fontSize: 14, fontWeight: 700, color: "var(--accent)" }}>{project.progress}%</span>
          </div>
          <div style={{ width: "100%", height: 8, borderRadius: 4, background: "rgba(0,0,0,0.08)", overflow: "hidden" }}>
            <div style={{ width: `${project.progress}%`, height: "100%", borderRadius: 4, background: `linear-gradient(90deg, var(--accent), var(--color-info))`, boxShadow: `0 0 12px var(--accent-glow)`, transition: "width 0.6s ease" }} />
          </div>
        </div>
      </div>

      {/* Clickable stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
        {stats.map((s) => (
          <button key={s.label} onClick={() => onStatClick(s.filter)} className="glass-panel btn-tap" style={{ borderRadius: 16, padding: "18px 10px", textAlign: "center", cursor: "pointer", minHeight: "auto" }}>
            <p className="font-display" style={{ fontSize: 26, fontWeight: 700, color: s.color }}>{s.value}</p>
            <p style={{ fontSize: 10, marginTop: 3, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>{s.label}</p>
          </button>
        ))}
      </div>

      {/* All projects list */}
      <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Todas las Obras</p>
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
    try { onLogin(await authService.login(email, password)); } catch (e) { setError(e.message); setLoading(false); }
  }
  return (
    <div className="fade-in login-bg" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "40px 24px" }}>
      <div style={{ position: "absolute", top: 16, right: 16, zIndex: 10 }}><ThemeToggle isDark={isDark} toggleDark={toggleDark} /></div>
      <div style={{ width: "100%", maxWidth: 380, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div className="glass-panel" style={{ width: 60, height: 60, borderRadius: 18, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}><BookMarked size={30} style={{ color: "var(--accent)" }} /></div>
          <h1 className="font-display" style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 6 }}>Libro de Obra</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Bitácora digital de obra · Inmutable</p>
        </div>
        <div className="glass-panel" style={{ borderRadius: 24, padding: 28 }}>
          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>Correo</label>
            <input value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }} type="email" inputMode="email" placeholder="tu@empresa.cl" style={{ ...inputStyle, marginBottom: 0 }} />
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
            <p style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Accesos Demo</p>
            <p className="font-mono" style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.8 }}>mauricio@test.cl · test123</p>
            <p className="font-mono" style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.8 }}>carlitos@test.cl · test123</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  MAIN                                                               */
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

  useEffect(() => { const root = document.documentElement; if (isDark) root.classList.add("dark"); else root.classList.remove("dark"); }, [isDark]);

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
      .filter((f) => { if (!search.trim()) return true; const q = search.toLowerCase(); return f.title.toLowerCase().includes(q) || f.body.toLowerCase().includes(q) || String(f.folioNumber).includes(q); })
      .sort((a, b) => b.folioNumber - a.folioNumber);
  }, [folios, role, categoryFilter, search]);

  const handleLogout = useCallback(() => { setSession(null); setFoliosByProject({}); setTab("bitacora"); setSearch(""); setCategoryFilter("Todas"); setViewingFolio(null); }, []);

  function handleNewFolioSave(folio) {
    setFoliosByProject((prev) => ({ ...prev, [selectedProjectId]: [...(prev[selectedProjectId] || []), folio] }));
    setShowNew(false);
  }

  function handleUpdateFolio(updated) {
    setFoliosByProject((prev) => ({ ...prev, [selectedProjectId]: (prev[selectedProjectId] || []).map((f) => f.id === updated.id ? updated : f) }));
    setViewingFolio(updated);
  }

  function handleStatClick(filter) {
    setCategoryFilter(filter);
    setTab("bitacora");
  }

  if (!session) return <LoginScreen onLogin={setSession} isDark={isDark} toggleDark={() => setIsDark(!isDark)} />;

  // Folio detail overlay
  if (viewingFolio) {
    return <FolioDetail folio={viewingFolio} role={role} onClose={() => setViewingFolio(null)} onUpdate={handleUpdateFolio} />;
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header className="glass-panel" style={{ position: "sticky", top: 0, zIndex: 30, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, borderRadius: 0, borderTop: "none", borderLeft: "none", borderRight: "none" }}>
        <div style={{ width: 38, height: 38, borderRadius: 12, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 0 16px var(--accent-glow)` }}><BookMarked size={18} color="#fff" /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 className="font-display" style={{ fontSize: 15, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Libro de Obra</h1>
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
            {/* Project selector mini */}
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 12 }}>
              {PROJECTS.map((p) => (
                <button key={p.id} onClick={() => setSelectedProjectId(p.id)} className="btn-tap"
                  style={{ flexShrink: 0, fontSize: 11, fontWeight: 600, padding: "7px 14px", borderRadius: 10, border: "none", minHeight: 32,
                    background: p.id === selectedProjectId ? "var(--accent)" : "var(--bg-glass)", color: p.id === selectedProjectId ? "#fff" : "var(--text-muted)",
                    boxShadow: p.id === selectedProjectId ? `0 3px 10px var(--accent-glow)` : "none" }}>
                  {p.name.length > 18 ? p.name.slice(0, 18) + "…" : p.name}
                </button>
              ))}
            </div>

            <div style={{ position: "relative", marginBottom: 14 }}>
              <Search size={16} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar en bitácora…"
                className="glass-panel" style={{ width: "100%", borderRadius: 14, padding: "12px 12px 12px 40px", outline: "none", color: "var(--text-main)", fontSize: 13 }} />
            </div>

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

      {currentRole.canCreate && tab === "bitacora" && !loading && (
        <button onClick={() => setShowNew(true)} className="btn-tap btn-accent"
          style={{ position: "fixed", zIndex: 40, right: 20, bottom: 90, width: 54, height: 54, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", border: "none" }}><Plus size={24} /></button>
      )}

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
