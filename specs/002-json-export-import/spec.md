# Feature Specification: Exportar e Importar Datos (JSON)

**Feature Branch**: `specs/002-json-export-import`

**Created**: 2026-10-10

**Status**: Draft

**Input**: User description: "Añadir botón para exportar e importar datos en formato JSON"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Exportar todos los datos a un archivo JSON (Priority: P1)

Como usuario, quiero pulsar un botón de "Exportar datos" que descargue un
archivo JSON con todas mis entradas registradas (Trabajo y Aprendizaje),
para respaldar mi historial o llevármelo a otro dispositivo.

**Why this priority**: La exportación es la mitad autosuficiente de la
función: sin ella no hay respaldo ni migración, y no depende de la
importación para generar valor.

**Independent Test**: Puedo probarla por completo pulsando el botón y
verificando que se descarga un archivo legible que contiene exactamente
las entradas existentes.

**Acceptance Scenarios**:

1. **Given** tengo registradas varias entradas, **When** pulso "Exportar
   datos", **Then** se descarga un archivo JSON que incluye todas mis
   entradas con sus datos completos (categoría, descripción, duración,
   fecha, identificador y sello de creación).
2. **Given** no tengo ninguna entrada registrada, **When** pulso
   "Exportar datos", **Then** se descarga un archivo JSON válido sin
   entradas (estructura vacía), sin errores.
3. **Given** la exportación se inicia, **When** ocurre un error
   inesperado, **Then** veo una notificación amigable en español, nunca
   un mensaje técnico.

---

### User Story 2 - Importar datos desde un archivo JSON (Priority: P2)

Como usuario, quiero pulsar un botón de "Importar datos", elegir un
archivo JSON exportado previamente, y que sus entradas se añadan a mi
historial, para restaurar un respaldo o combinar datos de otro dispositivo.

**Why this priority**: Aporta la restauración del respaldo; es
complementaria a la exportación pero más delicada (modifica el
almacenamiento local), por eso priorizada después.

**Independent Test**: Puedo probarla exportando un respaldo, borrando o
usando otra instancia, importando el archivo y verificando que las
entradas del archivo aparecen en el historial y en los totales.

**Acceptance Scenarios**:

1. **Given** un archivo JSON válido exportado por la aplicación, **When** lo
   selecciono en "Importar datos", **Then** las entradas del archivo se
   añaden a mi historial y los balances y tendencias se actualizan.
2. **Given** el archivo contiene entradas cuyos identificadores ya existen
   en mi historial, **When** lo importo, **Then** esas entradas se omiten
   (sin duplicados) y solo se añaden las nuevas; veo un resumen con el
   número de entradas añadidas y omitidas.
3. **Given** el archivo no es JSON válido o no tiene la estructura
   esperada, **When** lo selecciono, **Then** no se importa nada, mi
   historial queda intacto y veo una notificación amigable en español.
4. **Given** el archivo contiene entradas con datos inválidos (categoría,
   duración o descripción fuera de las reglas del sistema), **When** lo
   selecciono, **Then** no se importa nada (todo o nada) y veo una
   notificación amigable indicando el problema.

---

### Edge Cases

- ¿Qué sucede si el usuario selecciona un archivo que no es JSON? → se
  rechaza con notificación amigable; nada cambia.
- ¿Qué sucede si el archivo JSON es gigante (cientos de miles de
  entradas)? → el sistema debe manejarlo sin congelar la interfaz más de
  unos pocos segundos; si supera un límite razonable se informa
  amigablemente.
- ¿Qué sucede si el archivo contiene entradas duplicadas entre sí? → se
  importa la primera aparición de cada identificador y las repetidas se
  omiten.
- ¿Qué sucede si el usuario cancela el selector de archivo? → no ocurre
  nada, sin notificaciones espurias.
- ¿Qué sucede si la importación falla a mitad por un error de
  almacenamiento? → no se persiste ninguna entrada parcial (importación
  atómica) y se notifica amigablemente.
- ¿Qué sucede al importar en un dispositivo sin conexión? → funciona
  igual: todo es local.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST ofrecer un botón "Exportar datos" que
  descargue un archivo JSON conteniendo todas las entradas del historial
  con todos sus campos y una marca de versión del formato.
- **FR-002**: El archivo exportado MUST ser un JSON válido, legible por la
  aplicación y estable entre sesiones (un archivo exportado hoy puede
  importarse en el futuro por la misma aplicación).
- **FR-003**: El sistema MUST ofrecer un botón "Importar datos" que permita
  seleccionar un archivo JSON del dispositivo.
- **FR-004**: La importación MUST combinar por identificador: las entradas
  cuyo identificador ya existe se omiten; solo se añaden las nuevas.
  Queda prohibida la eliminación o modificación de entradas existentes
  durante la importación.
- **FR-005**: La importación MUST ser atómica: si el archivo es inválido o
  contiene entradas inválidas, NO se persiste ninguna entrada.
- **FR-006**: El sistema MUST validar cada entrada importada con las
  mismas reglas que una entrada creada normalmente (categoría, duración
  del catálogo, descripción 1–200 caracteres, fecha con formato de día).
- **FR-007**: Tras una importación exitosa, el sistema MUST mostrar un
  resumen en español con el número de entradas añadidas y el número
  omitidas por duplicado, y MUST actualizar balance diario y tendencia
  semanal visibles.
- **FR-008**: Ante cualquier error (archivo ilegible, formato desconocido,
  datos inválidos, fallo de almacenamiento), el sistema MUST mostrar una
  notificación discreta y amigable en español y dejar los datos
  existentes intactos; jamás mensajes técnicos ni trazas.
- **FR-009**: Ambas operaciones MUST funcionar completamente sin conexión.

### Key Entities

- **Archivo de respaldo (Backup File)**: documento JSON generado por la
  exportación e interpretado por la importación.
  - **Marca de aplicación y versión de formato**: identifica el archivo
    como propio de la aplicación y permite rechazar formatos desconocidos.
  - **Fecha de exportación**: instante en que se creó el respaldo.
  - **Entradas**: lista de los registros de tiempo con todos sus campos
    (id, categoría, descripción, duración, fecha, sello de creación).

- **Registro de tiempo (Time Entry)**: la misma entidad del producto
  existente; la importación solo la añade, nunca la edita.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un usuario puede exportar y localizar su archivo de respaldo
  en menos de 15 segundos desde la pantalla principal.
- **SC-002**: Un archivo exportado y luego importado restaura el 100% de
  las entradas (0 perdidas) cuando no había duplicados.
- **SC-003**: Importar un archivo con entradas ya presentes añade
  exactamente las nuevas y omite exactamente las duplicadas (0 duplicados
  creados) el 100% de las veces.
- **SC-004**: Un archivo corrupto o inválido resulta en 0 entradas
  persistidas y una notificación amigable el 100% de las veces.
- **SC-005**: Una importación de 1.000 entradas completa en menos de
  5 segundos percibidos y la interfaz permanece usable.
- **SC-006**: Con la red desconectada, exportar e importar siguen
  operativos al 100%.

## Assumptions

- El formato del archivo es propio de la aplicación, con marca de
  aplicación y versión numérica; no se compromete compatibilidad con
  otros productos.
- Semántica de importación: **combinar sin duplicar** (por identificador),
  nunca reemplazar ni borrar; es el comportamiento más seguro para un
  respaldo local-first.
- La importación es atómica: todo o nada (misma filosofía de corrección
  por eliminación + recreación, sin edición).
- El nombre del archivo exportado sigue una convención legible con fecha
  (ej. prefijo del producto + fecha), decidida en la fase de diseño.
- Los botones se ubican en la pantalla principal junto a las acciones
  existentes; el selector de archivo usa el selector nativo del sistema.
- No hay límite superior estricto de tamaño en MVP; el caso "gigante" se
  maneja con validación amigable y sin congelar la interfaz.
- La interfaz del flujo (botones, resúmenes, notificaciones) está en
  español; nombres de campos del archivo en inglés, como el resto del
  código y los datos (Artículo VI de la constitución).
