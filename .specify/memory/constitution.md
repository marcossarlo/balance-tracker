<!--
Sync Impact Report
==================
Version change: unversioned scaffold → 1.0.0 (initial ratification, MAJOR)

Modified principles (template placeholder → adopted article):
- [PRINCIPLE_1_NAME] → Artículo I: Library-First (Core Desacoplado)
- [PRINCIPLE_2_NAME] → Artículo II: Interfaces y Salidas Estructuradas
- [PRINCIPLE_3_NAME] → Artículo III: TDD Estricto (Innegociable)
- [PRINCIPLE_4_NAME] → Artículo IV: Gobernanza de Datos (Persistencia y Mutación)
- [PRINCIPLE_5_NAME] → Artículo V: Manejo de Errores, Seguridad y UI

Added principles:
- Artículo VI: Convenciones e Idioma
- Artículo VII: Simplicidad y Anti-Sobreingeniería
- Artículo VIII: Confianza en el Framework
- Artículo IX: Pruebas de Integración Reales

Added sections:
- Technical Stack & Data Model (fills [SECTION_2_NAME])
- Development Workflow (fills [SECTION_3_NAME])
- Governance rules (fills [GOVERNANCE_RULES])
- This Sync Impact Report (scratch; remove before commit)

Removed sections:
- All unresolved template placeholders and scaffold example comments

Resolved conflicts / decisions:
- Data model field language: schema MUST be English per Artículo VI
  (`category: 'WORK' | 'LEARNING'`, `description`, `timeValue`, `date`,
  `timestampCreation`), superseding the Spanish field names in the original
  spec block. User decision recorded at ratification time.

Deferred TODOs: none
-->
# BalanceTracker Constitution

## Core Principles

### Artículo I: Library-First (Core Desacoplado)
- Toda la lógica de negocio MUST residir en módulos TypeScript puros e
  independientes del framework, bajo `src/core` (o `src/lib`).
- Las operaciones de base de datos (Dexie), los cálculos de agregación diaria
  (sumatoria de minutos para `SplitDashboard`) y la transformación de series
  de tiempo para Recharts (`WeeklyTrends`) MUST ser funciones puras y
  testeables sin React.
- Los componentes de React actúan únicamente como capa de presentación
  "tonta" que consume estas librerías; contienen cero lógica de negocio.

**Rationale**: mantener el core desacoplado garantiza que la lógica sea
verificable por pruebas puras y reutilizable fuera de la UI.

### Artículo II: Interfaces y Salidas Estructuradas
- Las funciones del repositorio de datos MUST retornar `Promise<T>` estrictamente
  tipadas; los tipos de salida MUST estar definidos en la capa core.
- Las consultas por rango de días (índice `date`) MUST entregar arreglos
  limpios de objetos o estructuras agregadas pre-calculadas
  (ej. `{ work: 390, learning: 120 }`).
- Queda prohibido que los componentes de UI adivinen, normalicen ni
  transformen la forma de los datos en tiempo de renderizado.

**Rationale**: contratos tipados y pre-agregados eliminan clases enteras de
bugs de interpretación de datos en la capa visual.

### Artículo III: TDD Estricto (Innegociable)
- Queda prohibido escribir código de producción —especialmente componentes
  React— sin antes tener pruebas unitarias y de integración fallando (rojo).
- El ciclo Red-Green-Refactor MUST aplicarse obligatoriamente a la lógica del
  repositorio Dexie y a las funciones matemáticas de agregación antes de
  montar cualquier UI.

**Rationale**: el TDD estricto asegura que la lógica de persistencia y
cálculo sea correcta de forma independiente de la interfaz.

### Artículo IV: Gobernanza de Datos (Persistencia y Mutación)
- La fuente de verdad exclusiva y local-first es IndexedDB vía Dexie.js,
  garantizando operación offline completa.
- Se impone el patrón de "Inmutabilidad Simple": no existirán endpoints ni
  formularios de edición (`UPDATE`). Cualquier corrección de errores por parte
  del usuario se gestiona mediante eliminación (`DELETE`) y creación de un
  nuevo registro desde cero.

**Rationale**: eliminar la mutación reduce superficie de estados inconsistentes
y simplifica drásticamente el modelo de datos.

### Artículo V: Manejo de Errores, Seguridad y UI
- La capa del repositorio MUST capturar toda excepción de IndexedDB
  (cuota excedida, bloqueos de escritura, etc.) y traducirla a un error de
  dominio tipado; la UI MUST mostrar únicamente mensajes amigables, nunca
  stack traces ni errores crudos.
- `QuickEntryBar` MUST reiniciarse automáticamente y en silencio tras un
  guardado exitoso; ante error, el sistema emitirá una notificación discreta
  y amigable para el usuario.

**Rationale**: el usuario jamás debe exponerse a fallas internas del navegador
o del almacenamiento; la UI debe ser predecible incluso en modo offline.

### Artículo VI: Convenciones e Idioma
- **Código fuente, repositorio y base de datos:** estrictamente en inglés —
  nombres de variables, esquemas de BD y commits (ej.
  `category: 'WORK' | 'LEARNING'`, `timeValue`, `QuickEntryBar`,
  `SplitDashboard`).
- **Interfaz de usuario (UI) y especificaciones:** estrictamente en español
  (ej. "Trabajo", "Aprendizaje", "Eliminar", "Balance Semanal").
- **Diseño visual:** Tailwind CSS con diferenciación semántica clara y
  contrastante entre Trabajo y Aprendizaje (colores opuestos).

**Rationale**: la separación de idiomas por capa elimina ambigüedad y mantiene
consistencia entre código, BD y UI.

### Artículo VII: Simplicidad y Anti-Sobreingeniería
El MVP se limita a 3 capas arquitectónicas exclusivas:
1. **Capa de Datos:** configuración Dexie y queries.
2. **Capa de Integración:** custom hooks nativos de React
   (ej. `useDailyBalance`, `useWeeklyTrends`).
3. **Capa de Presentación:** componentes React.

- Queda prohibido el uso de gestores de estado global complejos (Redux,
  Zustand, u equivalentes).
- El estado se manejará localmente y se derivará de las consultas a la base de
  datos.

**Rationale**: la restricción a tres capas evita abstracciones prematuras y
mantiene el mantenimiento del MVP trivial.

### Artículo VIII: Confianza en el Framework
- Se MUST usar las herramientas del stack de forma idiomática y directa:
  Dexie.js y Recharts se consumirán con sus APIs nativas.
- Queda prohibido crear wrappers genéricos, capas de abstracción innecesarias
  o adaptadores sobre Dexie.js o Recharts.

**Rationale**: el uso directo preserva la trazabilidad, evita pérdida de
rendimiento y simplifica el mantenimiento.

### Artículo IX: Pruebas de Integración Reales
- Las pruebas de la capa de persistencia MUST ejecutarse contra una base de
  datos real en memoria (Dexie + `fake-indexeddb` + Vitest).
- Queda prohibido el uso excesivo de mocks sobre métodos nativos de Dexie; el
  objetivo es garantizar que la indexación (especialmente el índice de `date`)
  y las consultas operen bajo condiciones reales de ejecución.

**Rationale**: solo una BD real en memoria valida el comportamiento efectivo
de índices y consultas.

## Technical Stack & Data Model

- **Stack:** React + Vite, Tailwind CSS, `vite-plugin-pwa` (PWA offline).
- **Persistencia local:** Dexie.js (IndexedDB).
- **Visualización:** Recharts.
- **Esquema Dexie (nombres estrictamente en inglés, Artículo VI):**

| Campo | Tipo | Restricción |
| --- | --- | --- |
| `id` | UUID | Identificador único del registro |
| `category` | `'WORK' \| 'LEARNING'` | Categoría de la entrada |
| `description` | String | Descripción libre |
| `timeValue` | Entero (minutos) | Uno de: 15, 30, 60, 120, 180, 240 |
| `date` | ISO `YYYY-MM-DD` | Índice principal (rango de días) |
| `timestampCreation` | Unix timestamp | Momento de creación del registro |

## Development Workflow

- TDD obligatorio (Artículo III): toda función de repositorio y agregación
  se prueba en rojo antes de implementarse.
- Las pruebas de persistencia corren con Vitest + `fake-indexeddb`
  (Artículo IX) — sin mocks de Dexie.
- La UI se construye solo después de que la capa de datos tenga cobertura
  verde; los componentes son presentación pura (Artículos I y VII).
- Commits en inglés, siguiendo el formato convencional del repositorio
  (Artículo VI).

## Governance

- Esta constitución es suprema sobre toda práctica de desarrollo del
  proyecto; cualquier PR o revisión MUST verificar su cumplimiento.
- Enmiendas: requieren edición de este archivo, incremento de versión según
  semver, actualización del reporte de impacto (HTML comment temporal) y
  mención en el mensaje de commit.
- **Política de versionado:** MAJOR = eliminación o redefinición de
  principios; MINOR = principio o sección nueva / expansión material;
  PATCH = aclaraciones, redacción, correcciones tipográficas.
- **Revisión de cumplimiento:** antes de cada merge se revisa el cumplimiento
  de los 9 artículos; la complejidad añadida MUST justificarse explícitamente
  contra el Artículo VII.
- Racional/precedencia: en conflicto entre un mandato de esta constitución y
  una convención de librería o hábito previo, prevalece esta constitución.

**Version**: 1.0.0 | **Ratified**: 2026-10-08 | **Last Amended**: 2026-10-08
