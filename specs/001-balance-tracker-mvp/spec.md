# Feature Specification: Balance Tracker (Registro de Balance Trabajo/Aprendizaje)

**Feature Branch**: `docs/spec`

**Created**: 2026-10-08

**Status**: Draft

**Input**: User description: "Aplicación local-first para registrar tiempo dedicado a Trabajo y Aprendizaje, con entrada rápida, balance diario, tendencias semanales, corrección solo por eliminación y operación offline completa (especificación completa en los artículos I–IX de la constitución del proyecto)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Registro rápido de tiempo (Priority: P1)

Como usuario, quiero registrar en segundos una entrada indicando categoría
(Trabajo o Aprendizaje), una descripción breve y la duración (15, 30, 60,
120, 180 o 240 minutos), para llevar la cuenta de mi tiempo sin fricción.

**Why this priority**: Es la función núcleo; sin registro no existe el resto
del producto. Todo lo demás (balance, tendencias, corrección) depende de que
existen registros.

**Independent Test**: Puedo probarla completamente guardando varias entradas
y verificando que quedan almacenadas y disponibles para consulta, incluso
sin conexión.

**Acceptance Scenarios**:

1. **Given** estoy en la pantalla principal, **When** selecciono
   "Trabajo", escribo una descripción, elijo 60 minutos y guardo,
   **Then** la entrada aparece registrada con la fecha de hoy y el
   formulario queda vacío y listo para una nueva entrada.
2. **Given** quiero registrar una entrada, **When** intento guardar sin
   categoría, sin descripción o sin duración, **Then** el sistema no guarda
   nada y me indica de forma amigable qué dato falta.
3. **Given** acabo de guardar con éxito, **When** el sistema confirma el
   guardado, **Then** la barra de entrada se reinicia automáticamente y en
   silencio, sin requerir acción adicional de mi parte.
4. **Given** guardo una entrada, **When** ocurre un error de almacenamiento
   (por ejemplo, espacio agotado), **Then** veo una notificación discreta y
   amigable, nunca un mensaje técnico ni un desbordamiento de errores.

---

### User Story 2 - Balance diario (Priority: P2)

Como usuario, quiero ver, para un día determinado, el total de minutos en
Trabajo y el total en Aprendizaje de forma claramente diferenciada, para
entender mi distribución del día de un vistazo.

**Why this priority**: Es el valor informativo inmediato del producto;
convierte los registros en una decisión útil. Depende solo de existir
registros (US1).

**Independent Test**: Puedo probarla registrando entradas conocidas de cada
categoría y verificando que los totales mostrados coinciden con la suma
exacta.

**Acceptance Scenarios**:

1. **Given** hoy registré 120 min de Trabajo y 30 min de Aprendizaje,
   **When** abro el balance del día, **Then** veo "Trabajo: 120 min" y
   "Aprendizaje: 30 min" con colores visualmente opuestos.
2. **Given** no hay entradas para el día seleccionado, **When** abro el
   balance, **Then** veo totales en cero o un estado vacío amigable, sin
   errores.
3. **Given** las entradas de un día cambian (una nueva o una eliminación),
   **When** vuelvo a consultar el balance, **Then** los totales reflejan el
   cambio sin recargar la aplicación.

---

### User Story 3 - Tendencia semanal (Priority: P3)

Como usuario, quiero ver una gráfica de los últimos 7 días que compare
Trabajo vs. Aprendizaje, para detectar patrones de mi semana.

**Why this priority**: Aporta visión histórica; es valioso pero el usuario
obtiene valor mínimo con el balance diario si esta falta.

**Independent Test**: Puedo probarla creando registros en varios días
distintos y verificando que la gráfica muestra un punto/barra por día con
los totales correctos de cada categoría.

**Acceptance Scenarios**:

1. **Given** tengo registros en 3 de los últimos 7 días, **When** abro la
   tendencia semanal, **Then** veo una serie por día para Trabajo y otra
   para Aprendizaje, con los totales correctos y los días vacíos
   representados como cero.
2. **Given** la semana está incompleta, **When** abro la tendencia,
   **Then** siempre se muestran los 7 días en orden cronológico con las
   etiquetas en español.

---

### User Story 4 - Corrección mediante eliminación (Priority: P4)

Como usuario, quiero eliminar una entrada errónea y crearla de nuevo
correctamente, para corregir errores sin formularios de edición.

**Why this priority**: Es el único mecanismo de corrección del producto;
necesario para mantener la confianza en los datos, pero solo es relevante
cuando existe al menos un registro (US1).

**Independent Test**: Puedo probarla creando una entrada, eliminándola y
verificando que desaparece de todos los totales y gráficas, y que la
re-creada aparece correctamente.

**Acceptance Scenarios**:

1. **Given** veo una lista de entradas del día, **When** pulso "Eliminar"
   en una entrada y confirmo, **Then** la entrada desaparece y los totales
   del balance se recalculan de inmediato.
2. **Given** eliminé una entrada, **When** consulto balance y tendencia
   semanal, **Then** ningún total ni punto de la gráfica la incluye.
3. **Given** la eliminación falla por un error de almacenamiento, **When**
   se produce el fallo, **Then** veo una notificación amigable y la entrada
   permanece visible.

---

### User Story 5 - Uso sin conexión (Priority: P5)

Como usuario, quiero que la aplicación funcione por completo sin conexión
a internet, para registrar y consultar mi tiempo en cualquier lugar.

**Why this priority**: Es un diferenciador del producto local-first, pero
la app ya opera de forma útil en el dispositivo aunque no esté declarada
como instalable sin conexión desde el primer momento.

**Independent Test**: Puedo probarla cargando la aplicación una vez,
desconectando la red y verificando que registrar, ver balance, ver
tendencias y eliminar siguen operativos.

**Acceptance Scenarios**:

1. **Given** la aplicación ya se cargó al menos una vez, **When** pierdo la
   conexión, **Then** puedo registrar, consultar y eliminar entradas con el
   mismo comportamiento que en línea.
2. **Given** estoy sin conexión, **When** guardo una entrada, **Then** se
   persiste localmente y sobrevive al cierre y reapertura de la aplicación.

---

### Edge Cases

- ¿Qué sucede cuando el almacenamiento local excede su cuota? →
  guardar falla, el usuario ve una notificación amigable y ningún registro
  se guarda a medias.
- ¿Qué sucede si el dispositivo tiene la base de datos bloqueada por otra
  operación? → el sistema reintenta o informa con mensaje amigable; jamás
  expone un error técnico.
- ¿Qué sucede si se intenta guardar un valor de duración fuera del catálogo
  (ej. 45 minutos)? → la operación se rechaza; solo se admiten 15, 30, 60,
  120, 180 y 240 minutos.
- ¿Qué sucede si se envían varias entradas para el mismo día y categoría? →
  se permiten todas y se suman en el balance.
- ¿Qué pasa en un día sin registros al consultar balance o tendencia? →
  se muestran ceros/estados vacíos sin errores.
- ¿Qué sucede si el dispositivo tiene reloj desplazado y la fecha del día
  cambia mientras la app está abierta? → el balance se recalcula para el día
  consultado en el momento de la consulta.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST permitir registrar una entrada con categoría
  (Trabajo o Aprendizaje), descripción de texto libre y duración exacta de
  15, 30, 60, 120, 180 o 240 minutos.
- **FR-002**: El sistema MUST asignar a cada entrada la fecha del día
  calendario en que se creó y un sello de creación.
- **FR-003**: Cada entrada MUST tener un identificador único e inmutable.
- **FR-004**: El sistema MUST calcular y mostrar por día el total de minutos
  de Trabajo y el total de Aprendizaje por separado.
- **FR-005**: El sistema MUST mostrar una tendencia de los últimos 7 días
  con una serie por categoría, en orden cronológico, incluyendo días sin
  registros como cero.
- **FR-006**: El sistema MUST permitir eliminar entradas existentes,
  recalculando de inmediato balance y tendencia.
- **FR-007**: El sistema NO MUST ofrecer edición de entradas existentes; la
  corrección se realiza eliminando y creando de nuevo.
- **FR-008**: Tras un guardado exitoso, la barra de entrada MUST
  reiniciarse automáticamente y de forma silenciosa.
- **FR-009**: Ante cualquier error de almacenamiento, el sistema MUST
  mostrar una notificación discreta y amigable; los detalles técnicos MUST
  permanecer ocultos para el usuario.
- **FR-010**: El sistema MUST operar de forma completa sin conexión a
  internet una vez cargado, persistiendo los datos en el dispositivo y
  sobreviviendo al cierre de la aplicación.
- **FR-011**: Toda la interfaz MUST estar en español; los rótulos de
  categoría deben diferenciarse visualmente con colores opuestos y
  contrastantes.
- **FR-012**: El sistema NO MUST requerir cuentas, servidores ni sincronización.

### Key Entities

- **Registro de tiempo (Time Entry)**: una cantidad de tiempo dedicada a
  una categoría en un día concreto.
  - **Categoría**: Trabajo o Aprendizaje (mutuamente excluyente).
  - **Descripción**: texto libre que resume qué se hizo.
  - **Duración**: uno de los seis valores permitidos, en minutos.
  - **Fecha**: día calendario (YYYY-MM-DD); clave principal de consulta.
  - **Identificador único**: UUID para referencia y eliminación.
  - **Sello de creación**: instante temporal de alta del registro.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un usuario puede registrar una entrada completa en menos de
  10 segundos desde la pantalla principal.
- **SC-002**: Tras guardar, el balance del día refleja la nueva entrada en
  menos de 1 segundo percibido por el usuario.
- **SC-003**: 100% de los errores de almacenamiento se presentan como
  mensajes amigables; ningún usuario ve un mensaje técnico o de programador.
- **SC-004**: Con la red desconectada, el 100% de las funciones
  (registrar, balance, tendencia, eliminar) siguen operativas.
- **SC-005**: El balance diario coincide en 100% de los casos con la suma
  exacta de los minutos registrados por categoría para ese día.
- **SC-006**: Un usuario puede localizar y eliminar una entrada errónea en
  menos de 15 segundos.
- **SC-007**: La tendencia semanal muestra los 7 días con valores correctos
  el 100% de las veces que hay registros en el periodo.

## Assumptions

- Usuario individual en un solo dispositivo; no hay cuentas multiusuario
  ni sincronización entre dispositivos.
- Los datos viven únicamente en el dispositivo (local-first); borrar los
  datos del navegador elimina el historial de forma irreversible.
- La "fecha" de una entrada es el día calendario local del dispositivo.
- La corrección de errores se hace únicamente con eliminar + crear de
  nuevo; no habrá formularios de edición.
- Múltiples entradas del mismo día y categoría se permiten y se suman.
- La interfaz de usuario y los textos visibles están en español.
- El catálogo de duraciones (15, 30, 60, 120, 180, 240 minutos) es fijo
  para la primera versión; no hay valores personalizados.
