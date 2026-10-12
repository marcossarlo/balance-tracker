# Quickstart: Validación del Rediseño Visual (004-ui-redesign-dark-mode)

**Feature**: `004-ui-redesign-dark-mode` | **Date**: 2026-10-12

Guía de validación end-to-end del rediseño. No incluye implementación; los
detalles de tareas viven en `tasks.md` (Phase 2) y los contratos en
`contracts/`.

## 0. Prerrequisitos

- Node.js ≥ 20 y npm instalados.
- Rama de trabajo: `004-ui-redesign-dark-mode` (ya creada).
- Sin red requerida tras el primer `npm install` (la app es offline-first;
  las fuentes se auto-alojan — ver research R2).

## 1. Instalación y suite completa

```bash
npm install          # incluye las dependencias nuevas del rediseño
npm test             # vitest run — toda la suite (unidad + componente + integración)
npm run build        # tsc -b && vite build — tipado estricto + bundle PWA
```

**Resultado esperado**:

- `npm test`: 100% verde, incluyendo la **suite preexistente** como
  regresión (integración fake-indexeddb intacta — FR-012) y los nuevos
  tests de `balance-verdict`, `entry-grouping`, `theme`,
  `computeGrowthSeries` y componentes RTL.
- `npm run build`: sin errores TypeScript; el bundle incluye woff2 de
  Instrument Serif y Geist (verificable en `dist/assets/`).

## 2. Validación manual de la interfaz

```bash
npm run dev          # servidor local de Vite
```

Abrir `http://localhost:5173` y verificar:

### 2.1 Estructura y estética (US1, FR-001/FR-004/FR-014)

- [ ] Eyebrow bicolor (mitad `--work`, mitad `--learning`) + nombre "Balance Tracker".
- [ ] Título serif "Hoy" (o nombre del día si no es hoy) + fecha larga en cursiva gris.
- [ ] Navegación: botones outline anterior / "Hoy" / siguiente; exportar/importar; sol/luna.
- [ ] Superficies planas, bordes 1px, sin gradientes ni orbes; columna `max-w-6xl` centrada.
- [ ] Cifras grandes (totales) en serif con `tabular-nums`.

### 2.2 Registro rápido pegajoso (US2, FR-005)

- [ ] La barra permanece visible al hacer scroll (sticky `top-3`).
- [ ] Input grande con placeholder "¿En qué invertiste tu tiempo?".
- [ ] Selector segmentado: al elegir "Aprendizaje", la opción activa y los
      botones de tiempo (15m/30m/1h/2h/4h) se tiñen en ocre.
- [ ] "Registrar" (icono Enter) guarda; la barra se limpia sola; Enter
      desde el input envía.
- [ ] Sin categoría/descripción/duración: mensaje `role="alert"` en español,
      nada se guarda.

### 2.3 Medidor de equilibrio (US3, FR-006)

- [ ] Barra `h-3` dividida en azul/ocre con marca fina al 50%.
- [ ] Con registros 3:1 la barra refleja la proporción y cambia el
      titular (veredicto); con 50/50 muestra el mensaje de equilibrio.
- [ ] Línea inferior "% operación · 50/50 · crecimiento %" con colores.
- [ ] Día sin registros: veredicto "empty", sin errores en consola.

### 2.4 Tarjetas por categoría (US4, FR-007)

- [ ] Dos columnas en desktop; una sola columna estrecha (probar ~360px
      en devtools — sin scroll horizontal desde 320px, FR-010).
- [ ] Cabecera teñida al 10% con total de horas serif grande.
- [ ] Lista compacta con editar/eliminar (feature 003 conservada).
- [ ] Categoría vacía: texto atenuado de estado vacío.

### 2.5 Tema claro/oscuro (US5, FR-008, SC-001)

- [ ] Botón sol/luna alterna TODO al instante (incluye gráfica y tooltips).
- [ ] Recargar la página: se mantiene el tema elegido (localStorage `bt:theme`).
- [ ] Primera visita en ventana incórita con preferencia OS oscura: arranca oscuro.
- [ ] Sin parpadeo blanco al cargar (script anti-FOUC).
- [ ] Contraste AA de texto/bordes en ambos modos (SC-004).

### 2.6 Tendencia de 7 días (US6, FR-009)

- [ ] Pestañas "Horas" y "% Crecimiento" (`role="tab"`).
- [ ] Gráfica de líneas: 2 series en sus colores (Horas); cuadrícula solo
- [ ] horizontal; sin líneas de eje; puntos pequeños; trazo ~2.5px.
- [ ] Tooltip con superficie `--popover` del tema activo.
- [ ] Leyenda de segmentos cortos de color debajo de la gráfica.

### 2.7 Accesibilidad y regresión (FR-011/FR-012)

- [ ] Tab completo: header → barra → medidor → tarjetas → tendencia → pie,
      con foco visible (`ring`) en cada control.
- [ ] `getByRole` funciona: radiogroup de categoría, meter del balance,
      tabs de la tendencia, alert de validación.
- [ ] Exportar/importar JSON siguen operativos desde la cabecera.
- [ ] Modo offline (DevTools → Network → Offline): registrar, navegar
      días, eliminar y ver datos siguen funcionando tras el primer load.

## 3. Validación PWA offline de fuentes

```bash
npm run build && npm run preview
```

Con el preview abierto, cortar la red y recargar: la app carga con las
fuentes correctas (Instrument Serif en títulos/cifras, Geist en interfaz),
sin fetch a fuentes remotas.

## 4. Referencias

- Contratos: [`contracts/`](./contracts/)
- Decisiones técnicas: [`research.md`](./research.md)
- Modelo de datos/derivados: [`data-model.md`](./data-model.md)
- Spec: [`spec.md`](./spec.md)
