# Feature Specification: Editar Entradas del Día

**Feature Branch**: `003-edit-day-entries`

**Created**: 2026-10-12

**Status**: Draft

**Input**: User description: "Agregar un botón Editar en cada entrada del día"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Corregir una entrada desde la lista del día (Priority: P1)

Como usuario que está viendo las entradas de un día, quiero pulsar un botón
"Editar" en una entrada para modificar su categoría, descripción o duración,
sin tener que borrarla y volver a escribirla desde cero.

**Why this priority**: Es el núcleo de la solicitud: corregir errores de
registro de forma rápida. Sin este flujo, el usuario debe eliminar y recrear
la entrada manualmente, que es el proceso actual.

**Independent Test**: Puede probarse de forma independiente creando una
entrada, pulsando "Editar", cambiando la descripción, guardando y verificando
que la lista muestra la nueva descripción y que el balance diario se actualiza.

**Acceptance Scenarios**:

1. **Given** un día con al menos una entrada, **When** el usuario pulsa el
   botón "Editar" de esa entrada, **Then** aparece un formulario de edición
   prellenado con la categoría, descripción y duración actuales de la entrada.
2. **Given** el formulario de edición abierto con datos prellenados, **When**
   el usuario cambia la descripción y guarda, **Then** la lista de entradas
   muestra la descripción actualizada y el balance diario refleja cualquier
   cambio de duración o categoría.
3. **Given** el formulario de edición abierto, **When** el usuario cancela,
   **Then** no se aplican cambios y la lista de entradas queda intacta.

---

### User Story 2 - Editar entradas de días pasados (Priority: P2)

Como usuario que consultó un día pasado mediante el selector de día, quiero
poder editar también las entradas de ese día, no solo las de hoy.

**Why this priority**: La lista de entradas ya muestra cualquier día
seleccionado; el botón de editar debe ser coherente con ese comportamiento.
Prioridad secundaria porque el caso principal es corregir el día en curso.

**Independent Test**: Seleccionar un día pasado en el selector, pulsar
"Editar" en una entrada de ese día, modificar la duración, guardar y
verificar que la entrada del día pasado quedó actualizada.

**Acceptance Scenarios**:

1. **Given** un día pasado seleccionado en el selector de día con entradas
   registradas, **When** el usuario pulsa "Editar" en una entrada, **Then**
   el formulario de edición se abre prellenado con los datos de esa entrada.
2. **Given** una entrada de un día pasado en edición, **When** el usuario
   guarda los cambios, **Then** la entrada permanece asociada a su fecha
   original (no se mueve a otro día).

---

### Edge Cases

- ¿Qué sucede cuando el usuario intenta guardar una edición con la
  descripción vacía? → Se muestra un mensaje de validación y el formulario
  permanece abierto sin aplicar cambios.
- ¿Qué sucede si la operación de edición falla por un problema de
  almacenamiento? → Se muestra un mensaje de error amigable y la entrada
  original permanece intacta y sin modificar.
- ¿Qué sucede si el usuario intenta editar una entrada mientras la lista
  está cargando? → El botón "Editar" no está disponible hasta que la lista
  termine de cargar.
- ¿Qué sucede al editar una entrada y cambiar solo la categoría? → El
  balance diario y las tendencias semanales se recalculan con la nueva
  categoría (el tiempo se reasigna de Trabajo a Aprendizaje o viceversa).
- ¿Qué sucede si la eliminación del registro original se completa pero la
  creación del registro nuevo falla (fallo parcial del borrar-y-recrear)? →
  El sistema MUST intentar completar la operación y, ante fallo definitivo,
  MUST informar al usuario de que la edición no se pudo completar; el riesgo
  de pérdida parcial se mitiga realizando ambas operaciones de forma
  consecutiva e inmediata.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST mostrar un botón "Editar" en cada entrada de la
  lista de entradas del día.
- **FR-002**: Al pulsar "Editar", el sistema MUST abrir un formulario de
  edición prellenado con la categoría, descripción y duración actuales de la
  entrada.
- **FR-003**: El formulario de edición MUST permitir modificar la categoría
  (Trabajo/Aprendizaje), la descripción y la duración.
- **FR-004**: El formulario de edición NO MUST permitir modificar la fecha de
  la entrada; esta permanece asociada al día en que fue creada.
- **FR-005**: Al guardar la edición, el sistema MUST aplicar los cambios y
  actualizar el balance diario y las tendencias semanales para reflejar los
  nuevos valores.
- **FR-006**: La edición MUST validar la entrada con las mismas reglas que la
  creación de entradas nuevas (categoría válida, descripción de 1 a 200
  caracteres, duración dentro del catálogo permitido).
- **FR-007**: Cancelar la edición MUST descartar todos los cambios y volver a
  la lista de entradas sin modificar.
- **FR-008**: La edición MUST implementarse mediante el patrón de
  borrar-y-recrear: al guardar, el sistema elimina el registro original y
  crea uno nuevo con los datos actualizados, preservando la fecha original.
  El identificador y la marca de creación del registro resultante serán
  nuevos. Esto cumple con el patrón de Inmutabilidad Simple del Artículo IV
  de la Constitución, que prohíbe operaciones UPDATE directas.
- **FR-009**: Las operaciones de edición fallidas MUST mostrar un mensaje de
  error amigable y dejar la entrada original sin cambios.
- **FR-010**: El botón "Editar" MUST estar disponible tanto para entradas del
  día actual como para entradas de días pasados seleccionados en el selector
  de día.

### Key Entities

- **TimeEntry**: Entidad existente que representa un registro de tiempo con
  id, categoría, descripción, duración, fecha y marca de creación. La edición
  preserva la asociación de la entrada con su fecha original; el registro
  resultante tendrá un nuevo identificador y una nueva marca de creación.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Los usuarios pueden corregir un registro erróneo en menos de
  30 segundos (frente al proceso actual de borrar y re-registrar que toma
  aproximadamente 1 minuto).
- **SC-002**: Después de guardar una edición, el balance diario refleja el
  cambio de forma inmediata, sin requerir recarga manual de la página.
- **SC-003**: El 95% de las operaciones de edición se completan con éxito sin
  errores en el primer intento.
- **SC-004**: No se observan inconsistencias de datos (entradas en días
  incorrectos, balances desincronizados) después de realizar operaciones de
  edición.

## Assumptions

- El formulario de edición reutiliza el mismo conjunto de campos que el
  formulario de nueva entrada (categoría, descripción, duración).
- La edición está disponible para cualquier entrada mostrada en la lista del
  día seleccionado, incluyendo entradas de días pasados.
- La fecha de la entrada es inmutable a través del flujo de edición; cambiar
  la fecha de una entrada existente está fuera de alcance.
- Las reglas de validación de entrada para ediciones son idénticas a las de
  la creación de entradas nuevas.
- La edición se persiste mediante el patrón borrar-y-recrear elegido como
  resolución del conflicto con el Artículo IV de la Constitución: el usuario
  no percibe diferencia en la experiencia, pero el registro resultante tendrá
  un nuevo identificador y marca de creación. Esto no altera el balance
  diario ni las tendencias, que se derivan de los campos de categoría,
  duración y fecha.
