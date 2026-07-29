# 📋 Libro de Obra Digital — Contexto del Proyecto

> Última actualización: 28 de julio de 2026
> Repositorio: https://github.com/mauriciojilabert-svg/libro-de-obra
> Producción: https://libro-de-obra-iota.vercel.app

---

## 🎯 Descripción

Aplicación web móvil (Mobile-First) que digitaliza el **Libro de Obra** utilizado en la industria de la construcción chilena. Funciona como una bitácora legal, foliada e inmutable, donde constructores, inspectores técnicos (ITO) y mandantes pueden registrar avances, incidentes, instrucciones y recepciones de partida de forma digital.

El proyecto nació como un archivo JSX único (`libro-de-obra-digital.jsx`) y fue migrado a un proyecto Vite + React completo, desplegado en Vercel con integración continua desde GitHub.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología | Versión/Detalle |
|------|-----------|-----------------|
| **Framework** | React | 18.x |
| **Bundler** | Vite | 8.1.5 |
| **CSS** | Tailwind CSS | v4 (con `@import "tailwindcss"`) |
| **Íconos** | Lucide React | Última versión (nombres actualizados: `CircleCheck`, `CircleX`, `TriangleAlert`) |
| **Tipografías** | Google Fonts | Outfit (display), Inter (body), JetBrains Mono (código) |
| **Hosting** | Vercel | CI/CD automático desde branch `main` |
| **Repositorio** | GitHub | `mauriciojilabert-svg/libro-de-obra` |

---

## 📁 Estructura del Proyecto

```
LibroDeObra/
├── index.html              # HTML base (lang="es", Google Fonts, notranslate)
├── package.json            # Dependencias y scripts
├── vite.config.js          # Configuración de Vite + plugin Tailwind
├── src/
│   ├── main.jsx            # Entry point (ReactDOM.createRoot)
│   ├── index.css           # Sistema de diseño completo (variables, glass, animaciones)
│   └── App.jsx             # Aplicación completa (componentes, servicios, datos)
├── old_files/
│   └── libro-de-obra-digital.jsx  # Archivo JSX original (backup)
└── dist/                   # Build de producción (generado por Vite)
```

---

## 🎨 Sistema de Diseño

### Modo Claro (por defecto)
- Fondo: `#F4F6F8` (gris claro)
- Paneles: Glassmorphism con `rgba(255,255,255,0.92)` + `backdrop-blur(16px)`
- Acento principal: `#3B82F6` (azul)
- Bordes: `rgba(255,255,255,0.5)` (sutiles)

### Modo Oscuro (toggle ☀️/🌙)
- Fondo: `#141921` (azul oscuro cálido)
- Paneles: `rgba(22,28,40,0.94)` + blur
- Acento principal: `#2DD4BF` (teal/turquesa) — diferente al modo claro
- Degradados ambientales con teal + ámbar

### Categorías y Colores
| Categoría | Color | Background |
|-----------|-------|------------|
| Instrucción | Indigo `#6366F1` | `rgba(99,102,241,0.12)` |
| Avance | Azul `#2563EB` | `rgba(37,99,235,0.12)` |
| Recepción de Partida | Verde `#10B981` | `rgba(16,185,129,0.15)` |
| Incidente | Rojo `#EF4444` | `rgba(239,68,68,0.15)` |
| Modificación | Ámbar `#F59E0B` | `rgba(245,158,11,0.15)` |

---

## 👤 Usuarios y Roles

### Credenciales de Acceso (Demo)
| Correo | Contraseña | Rol |
|--------|-----------|-----|
| `mauricio@test.cl` | `test123` | Constructor |
| `carlitos@test.cl` | `test123` | ITO |

### Permisos por Rol
| Permiso | Constructor | ITO |
|---------|:-----------:|:---:|
| Crear folios | ✅ | ✅ |
| Categorías disponibles | Avance, Incidente, Modificación, Recepción | Instrucción, Incidente, Recepción |
| Aprobar/Rechazar | ❌ | ✅ |
| Editar borradores | ✅ | ✅ |

> **Nota:** Se eliminó el rol "Mandante" en la última iteración para simplificar la demo.

---

## 🏗️ Obras Ficticias (Datos Demo)

| ID | Nombre | Dirección | Avance | Folios |
|----|--------|-----------|--------|--------|
| 1 | Edificio Mirador del Parque | Av. Las Industrias 4521, Renca | 62% | 5 |
| 2 | Condominio Los Aromos II | Calle Los Nogales 890, Ñuñoa | 28% | 3 |
| 3 | Centro Comercial Plaza Norte | Av. Américo Vespucio 1200, Huechuraba | 91% | 3 |
| 4 | Hospital Regional de Rancagua | Av. Libertador B. O'Higgins 3500 | 12% | 2 |

---

## ✅ Funcionalidades Implementadas

### Core
- [x] Login con validación de credenciales (mock, preparado para JWT real)
- [x] Capa de servicios API-ready (`authService`, `folioService`, `projectService`)
- [x] ErrorBoundary para evitar pantallas en blanco ante errores

### Bitácora
- [x] Listado de folios con búsqueda por texto y filtro por categoría
- [x] Selector de obra (proyecto) en la parte superior de la bitácora
- [x] Crear nuevo folio como borrador con categoría, título y descripción
- [x] **Captura de fotos** desde cámara del celular o galería (múltiples, con preview y eliminación)
- [x] Vista detalle de folio al tocar una tarjeta
- [x] **Edición de folios en estado borrador** (título, descripción, fotos)
- [x] Folios firmados son de solo lectura (inmutables)
- [x] Badges visuales de estado (Borrador/Firmado) y resultado (Aprobado/Rechazado)
- [x] Botones de Aprobar/Rechazar para el rol ITO en incidentes y recepciones

### Dashboard
- [x] Información del proyecto seleccionado (nombre, dirección, permiso, avance)
- [x] Barra de progreso con gradiente animado
- [x] **Stats clickables** (Folios → ver todos, Firmados → filtrar firmados, Incidentes → filtrar incidentes)
- [x] Listado de todas las obras con indicador de obra activa
- [x] Selector de obra desde el dashboard

### UI/UX
- [x] Modo claro por defecto + toggle de modo oscuro (paleta teal/ámbar)
- [x] Navegación inferior flotante estilo "isla" con animación
- [x] FAB (Floating Action Button) para crear folios
- [x] Animaciones de entrada (fade + slide)
- [x] Safe area handling para notch/barra de navegación del celular
- [x] Anti-zoom en inputs para iOS (`font-size: 16px`)
- [x] Prevención de Google Translate (`notranslate`)

---

## 🐛 Bugs Resueltos

1. **Pantalla en blanco post-login (Vercel):** Los íconos de `lucide-react` habían cambiado de nombre (`CheckCircle2` → `CircleCheck`, `AlertTriangle` → `TriangleAlert`). Solucionado actualizando todos los imports.
2. **Error `insertBefore` en Chrome Android:** Google Translate del navegador modificaba el DOM de React causando crash. Solucionado con `<html lang="es" translate="no">` y `<meta name="google" content="notranslate">`.
3. **Warning de CSS `@import` order:** El `@import url()` de Google Fonts estaba después de reglas CSS. Movido al `<link>` en `index.html`.
4. **Categoría "Avance" invisible:** Tenía color gris sobre fondo gris. Cambiado a azul `#2563EB`.
5. **Modal demasiado transparente:** El panel del modal de crear folio usaba glassmorphism y se veían los folios detrás. Cambiado a fondo sólido `var(--bg-canvas)`.

---

## 🔮 Pendientes / Roadmap Futuro

- [ ] **Backend real:** Django REST Framework o Node.js + PostgreSQL
- [ ] **Autenticación JWT** con refresh tokens
- [ ] **Firma Electrónica Avanzada (FEA):** Integración con proveedor chileno (e-Sign, Acepta, etc.)
- [ ] **Geolocalización real** al crear folios (GPS del celular)
- [ ] **Almacenamiento de fotos** en cloud (S3 / Cloudinary / Supabase Storage)
- [ ] **PWA:** Service worker para funcionamiento offline en terreno
- [ ] **Exportar a PDF** el libro de obra completo
- [ ] **Notificaciones push** cuando se crea un folio o se requiere aprobación
- [ ] **Rol Mandante:** Reactivar con permisos de solo lectura + comentarios

---

## 🚀 Comandos Útiles

```bash
# Desarrollo local
npm run dev

# Build de producción
npm run build

# Preview del build
npm run preview

# Subir cambios a producción (Vercel autodeploy)
git add .
git commit -m "descripción del cambio"
git push origin main
```

---

## 📝 Notas Importantes

- **Todos los datos son mock (en memoria).** Al recargar la página se pierden los folios creados por el usuario. Esto es intencional para el MVP/demo.
- **La capa de servicios** (`authService`, `folioService`, `projectService`) está diseñada para reemplazarse 1:1 por llamadas `fetch()` a un backend real sin modificar los componentes.
- **Las fotos capturadas** se almacenan como `ObjectURL` del navegador (temporales). En producción se subirían a un servicio de almacenamiento.
- **El proyecto usa Tailwind CSS v4** con la nueva sintaxis `@import "tailwindcss"` y `@theme {}`. No usa `tailwind.config.js`.
