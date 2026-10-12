# Feature Specification: Rediseño Visual de la Interfaz con Modo Oscuro/Claro

**Feature Branch**: `004-ui-redesign-dark-mode`

**Created**: 2026-10-12

**Status**: Draft

**Input**: User description: "Rediseño visual de la interfaz del Balance Tracker: implementar una interfaz moderna, limpia y responsive con soporte para modo claro/oscuro (Dark Mode). Organizar los registros en tarjetas atractivas con indicadores visuales de color según el balance, incorporar un selector de tema en la barra superior, medidor de equilibrio con veredicto, registro rápido pegajoso con selector segmentado de categoría y botones de tiempo, tendencia de 7 días con pestañas, tipografía serif para titulares y cifras grandes con sans moderna para la interfaz, paleta semántica de 5 colores con tokens para ambos modos, y accesibilidad completa."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Interfaz renovada con jerarquía tipográfica y dualidad de colores (Priority: P1)

Como usuario, quiero que la pantalla principal muestre una interfaz moderna y
aireada donde los números (totales de horas) sean grandes, protagonistas y
fáciles de leer, y donde cada categoría (Trabajo y Aprendizaje) tenga su
propio color aplicado de forma consistente en todos los componentes, para
entender mi balance de un vistazo sin esfuerzo.

**Why this priority**: Es el núcleo del rediseño; toda el valor de la
característica reside en que la nueva estética hace legible la información.
Sin esta base, el resto de historias no tiene impacto.

**Independent Test**: Puedo probarla abriendo la aplicación y verificando
que los totales se muestran en tipografía serif grande, que cada categoría
usa siempre el mismo color en tarjetas, selector, botones y gráfica, y que
la página respira (espaciado amplio, bordes finos, sin decoración gratuita).

**Acceptance Scenarios**:

1. **Given** estoy en la pantalla principal, **When** la observo,
   **Then** los totales por categoría se muestran en tipografía serif a
   tamaño destacado (equivalente a 60px) con cifras tabulares, y los
   titulares usan serif mientras la interfaz de uso usa una sans moderna.
2. **Given** hay registros de ambas categorías, **When** comparo los
   componentes (selector, botones de tiempo, tarjetas, medidor y gráfica),
   **Then** Trabajo aparece siempre en azul acero y Aprendizaje siempre en
   ocre/dorado, en ambos modos de tema.
3. **Given** la pantalla principal, **When** la reviso, **Then** no hay
   gradientes, orbes ni elementos decorativos sin función; las superficies
   son planas con bordes de 1px y sombras casi nulas.

---

### User Story 2 - Registro rápido mejorado y siempre accesible (Priority: P1)

Como usuario, quiero una barra de registro rápido fija arriba que permita
escribir la descripción, elegir la categoría con un selector segmentado y
marcar la duración con botones de tiempo que toman el color de la categoría
seleccionada, para registrar entradas con pocos clics y sin perder de vista
el formulario mientras desplazo.

**Why this priority**: El registro es la función núcleo del producto; el
rediseño debe preservarla y hacerla más rápida y cómoda, manteniendo el
cumplimiento del objetivo de menos de 10 segundos por entrada.

**Independent Test**: Puedo probarla registrando entradas con teclado y con
ratón, verificando que la barra permanece visible al hacer scroll, que los
botones de tiempo reflejan el color de la categoría elegida y que el
formulario se reinicia tras guardar.

**Acceptance Scenarios**:

1. **Given** estoy en la pantalla principal y desplazo hacia abajo,
   **When** consulto la zona superior, **Then** la barra de registro sigue
   visible (pegajosa) sin tapar el contenido de forma irreversible.
2. **Given** quiero registrar una entrada, **When** selecciono "Aprendizaje",
   **Then** el selector segmentado resalta la opción con el color ocre y los
   botones de tiempo (15m, 30m, 1h, 2h, 4h) adoptan ese mismo color.
3. **Given** escribo una descripción y elijo duración, **When** pulso
   "Registrar" o confirmo con Enter, **Then** la entrada se guarda, la barra
   se limpia sola y los totales se actualizan al instante.
4. **Given** intento guardar sin descripción o sin duración, **When** envío
   el formulario, **Then** no se guarda nada y veo un mensaje amigable de
   error accesible para lectores de pantalla.

---

### User Story 3 - Medidor de equilibrio con veredicto (Priority: P2)

Como usuario, quiero un medidor que muestre de un vistazo cómo se reparte mi
tiempo entre Trabajo (operación) y Aprendizaje (crecimiento), con un titular
que interprete el ratio como un veredicto y una barra dual animada con marca
en el 50%, para decidir con rapidez si mi día está desequilibrado.

**Why this priority**: Convierte los datos en interpretación; aporta el
valor informativo inmediato del balance diario, pero depende de que existan
registros y de la base estética (US1).

**Independent Test**: Puedo probarla creando registros con ratios conocidos
(80/20, 50/50, 100/0) y verificando que el veredicto, los porcentajes y la
proporción de la barra coinciden exactamente con los datos.

**Acceptance Scenarios**:

1. **Given** registré el doble de minutos de Trabajo que de Aprendizaje,
   **When** observo el medidor, **Then** la barra muestra la proporción
   correcta en los dos colores de categoría, con una marca fina en el 50%,
   y debajo se leen los porcentajes de operación y crecimiento.
2. **Given** el ratio está fuertemente desequilibrado, **When** veo el
   titular del medidor, **Then** muestra un veredicto en español que
   refleja la situación (por ejemplo, que lo urgente está canibalizando el
   tiempo de desarrollo).
3. **Given** cambian los registros del día, **When** se recalcula el
   medidor, **Then** las anchuras de la barra se animan suavemente hasta la
   nueva proporción.

---

### User Story 4 - Tarjetas de categoría con totales y estados vacíos (Priority: P2)

Como usuario, quiero ver mis registros del día organizados en dos tarjetas —
una por categoría— con cabecera teñida en el color de esa categoría, el
total de horas destacado y una lista compacta de las entradas, para revisar
y eliminar registros sin esfuerzo.

**Why this priority**: Organiza la información diaria en un formato
escaneable; mantiene las capacidades existentes de consulta y eliminación
en el nuevo diseño. Depende de US1.

**Independent Test**: Puedo probarla registrando varias entradas de cada
categoría y verificando totales, listas, cabeceras teñidas, estado vacío y
la eliminación de entradas.

**Acceptance Scenarios**:

1. **Given** tengo entradas de Trabajo y de Aprendizaje hoy, **When** veo
   las dos columnas de tarjetas, **Then** cada cabecera lleva su etiqueta y
   nombre con un toque del color de la categoría, y a la derecha el total de
   horas en serif grande.
2. **Given** una categoría no tiene entradas hoy, **When** veo su tarjeta,
   **Then** muestra un texto atenuado de estado vacío, sin errores.
3. **Given** veo una entrada en la lista, **When** uso la acción de
   eliminar y confirmo, **Then** la entrada desaparece y totales, medidor y
   gráfica se recalculan de inmediato.
4. **Given** una descripción es muy larga, **When** se muestra en la lista,
   **Then** se trunca sin romper el diseño de la tarjeta.

---

### User Story 5 - Modo oscuro y claro con preferencia persistente (Priority: P2)

Como usuario, quiero alternar entre modo claro y modo oscuro con un botón
de sol/luna en la cabecera, que la aplicación recuerde mi preferencia entre
sesiones y que ambos modos se vean igual de cuidados y legibles, para usar
la app cómodamente según la luz del entorno.

**Why this priority**: Es un diferenciador de experiencia explícitamente
solicitado; afecta a toda la interfaz pero no bloquea el valor principal
del rediseño.

**Independent Test**: Puedo probarla alternando el tema, recargando la
aplicación y verificando que la preferencia se mantiene y que la interfaz
completa cambia de tema al instante.

**Acceptance Scenarios**:

1. **Given** estoy en modo claro, **When** pulso el botón de tema,
   **Then** toda la interfaz cambia a modo oscuro al instante, sin recarga,
   con colores de categoría adaptados para conservar el contraste.
2. **Given** elegí modo oscuro, **When** cierro y vuelvo a abrir la
   aplicación, **Then** la app arranca en modo oscuro.
3. **Given** es la primera vez que abro la aplicación, **When** carga,
   **Then** el tema inicial respeta la preferencia del sistema (claro u
   oscuro) del dispositivo.
4. **Given** ambos modos, **When** comparo la jerarquía visual (texto,
   bordes, superficies), **Then** la estructura y las relaciones de
   contraste son equivalentes; ningún modo es una versión degradada.

---

### User Story 6 - Tendencia de 7 días con pestañas y leyenda (Priority: P3)

Como usuario, quiero una tarjeta de tendencia de los últimos 7 días con
pestañas para ver las horas o el porcentaje de crecimiento, una gráfica de
líneas limpia con leyenda, y una descripción dinámica, para detectar
patrones de la semana.

**Why this priority**: Aporta visión histórica; es valioso pero el usuario
obtiene el valor principal con el registro y el balance del día.

**Independent Test**: Puedo probarla creando registros en varios días y
verificando que ambas pestañas muestran los datos correctos con leyenda
asociada a cada línea.

**Acceptance Scenarios**:

1. **Given** tengo registros en varios días, **When** abro la tendencia en
   la pestaña "Horas", **Then** veo dos líneas (una por categoría, en sus
   colores) sobre los 7 días, con cuadrícula horizontal, sin líneas de eje
   y una leyenda de segmentos de color debajo.
2. **Given** cambio a la pestaña "% Crecimiento", **When** se actualiza la
   gráfica, **Then** veo los porcentajes de crecimiento por día con la
   misma estética y la leyenda correspondiente.
3. **Given** paso el puntero o enfoco un punto de la gráfica, **When** se
   muestra el detalle, **Then** aparece una etiqueta con los valores del
   día en un popover legible en el tema activo.

---

### Edge Cases

- **Día sin registros**: la tarjeta de cada categoría muestra estado vacío
  atenuado; el medidor muestra veredicto de "sin datos" o reparto neutro y
  la barra en cero sin romperse.
- **Ratio extremo (100/0 o 0/100)**: la barra se muestra de un solo color
  y el veredicto refleja el desequilibrio total; el porcentaje de la
  categoría ausente se muestra como 0%.
- **Cambio de tema con la aplicación abierta**: se aplica de inmediato a
  toda la interfaz, incluidos gráfica y tooltips, sin parpadeo ni recarga.
- **Preferencia de tema entre sesiones**: se conserva al cerrar y reabrir;
  si el usuario nunca eligió, se sigue la preferencia del sistema.
- **Pantallas muy angostas (móvil)**: las dos columnas se apilan en una
  sola; la interfaz no produce scroll horizontal y todos los controles
  siguen siendo alcanzables.
- **Movimiento reducido**: si el sistema indica preferencia por menos
  movimiento, la animación del medidor se omite o resulta instantánea.
- **Errores de almacenamiento**: se muestran como avisos amigables con
  role de alerta; nunca se exponen detalles técnicos.
- **Entradas con descripción vacía o demasiado larga**: se rechaza el
  guardado vacío; las descripciones largas se truncan visualmente en la
  lista sin afectar el layout.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La interfaz MUST aplicar una jerarquía tipográfica dual:
  serif elegante para titulares y cifras grandes —con cifras tabulares— y
  una sans moderna para interfaz y cuerpo; las etiquetas pequeñas van en
  mayúsculas con espaciado amplio.
- **FR-002**: La interfaz MUST definir una paleta semántica de 5 roles
  (fondo, tarjetas, texto/primario, categoría Trabajo, categoría
  Aprendizaje) más un color de aviso/error, con variantes equivalentes para
  modo claro y modo oscuro; los grises secundarios y bordes MUST derivarse
  de esos roles para mantener la misma jerarquía en ambos modos.
- **FR-003**: Cada categoría MUST tener un color propio aplicado de forma
  consistente en el selector segmentado, los botones de tiempo, las
  tarjetas, el medidor y la gráfica de tendencia.
- **FR-004**: La pantalla principal MUST organizar su contenido en una
  columna centrada con estas secciones: cabecera (eyebrow bicolor con nombre
  de la app, título "Hoy" con fecha larga en cursiva, navegación de días,
  exportar/importar y control de tema), barra de registro rápido pegajosa
  en la parte superior, medidor de equilibrio, dos columnas de tarjetas por
  categoría, tarjeta de tendencia de 7 días y pie de página.
- **FR-005**: La barra de registro rápido MUST permanecer visible al
  desplazar, incluir un campo de descripción con texto grande de ayuda, un
  selector segmentado accesible (semántica de grupo de radio) de categoría,
  botones de duración rápida (15m, 30m, 1h, 2h, 4h) teñidos con el color de
  la categoría seleccionada y un botón primario de registro; tras guardar
  exitosamente MUST reiniciarse automáticamente y en silencio.
- **FR-006**: El medidor de equilibrio MUST mostrar un titular que interprete
  el ratio operación/crecimiento como un veredicto en español, una barra
  horizontal dividida en los dos colores de categoría con marca en el 50% y
  anchuras animadas al recalcular, y una línea con los porcentajes de cada
  categoría; MUST exponer semántica de medidor accesible.
- **FR-007**: Cada tarjeta de categoría MUST mostrar cabecera teñida con el
  color de la categoría al 10% de opacidad, etiqueta y nombre de categoría,
  total de horas en serif grande, lista compacta de entradas del día con
  posibilidad de eliminación y estado vacío atenuado cuando no hay entradas.
- **FR-008**: El sistema MUST ofrecer alternancia de tema claro/oscuro desde
  la cabecera mediante un control sol/luna, aplicar el cambio al instante a
  toda la interfaz, activar el modo oscuro mediante clase en el elemento raíz
  y persistir la preferencia del usuario entre sesiones; en la primera visita
  MUST respetar la preferencia del sistema.
- **FR-009**: La tarjeta de tendencia MUST cubrir los últimos 7 días
  terminando en el día calendario actual, incluir pestañas "Horas" y
  "% Crecimiento", título serif, descripción dinámica, dos totales
  comparativos, gráfica de líneas con cuadrícula solo horizontal, sin líneas
  de eje, trazo grueso y puntos pequeños, tooltips con tokens de superficie
  emergente del tema activo y leyenda de líneas de color debajo.
- **FR-010**: Toda la interfaz MUST ser responsive mobile-first: en pantallas
  angostas las dos columnas se convierten en una sola y no hay scroll
  horizontal; los espaciados usan gaps consistentes (equivalente a 8–10
  unidades de la escala) entre secciones.
- **FR-011**: La interfaz MUST cumplir accesibilidad: etiquetas accesibles en
  controles de icono, etiquetas ocultas visualmente cuando procede, mensajes
  de error accesibles para lectores de pantalla, foco visible con anillo en
  todos los controles interactivos y uso correcto de roles semánticos
  (grupo de radio, medidor, alerta).
- **FR-012**: La aplicación MUST conservar intactas todas las funciones
  existentes: registro, balance diario, tendencia, eliminación de entradas,
  exportación/importación de datos y operación completa sin conexión.
- **FR-013**: Toda la interfaz MUST permanecer en español; los textos de
  veredicto, estados vacíos y ayudas MUST ser redactados en español.
- **FR-014**: El diseño MUST evitar gradientes, orbes y decoración sin
  función; las superficies son planas, con bordes finos de 1px, sombras
  casi nulas y un radio base de esquina consistente en toda la app.

### Key Entities

- **Registro de tiempo (Time Entry)**: sin cambios respecto a la versión
  anterior; la categoría, descripción, duración, fecha e identificador
  conservan su significado. El rediseño solo afecta a su presentación.
- **Preferencia de tema**: el modo elegido por el usuario (claro u oscuro)
  o, en su defecto, la preferencia del sistema detectada al first load; se
  conserva localmente en el dispositivo entre sesiones.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un usuario puede alternar entre modo claro y modo oscuro con
  un solo toque/clic, y la preferencia sobrevive al 100% de los cierres y
  reaperturas de la aplicación.
- **SC-002**: Tras el rediseño, un usuario sigue pudiendo registrar una
  entrada completa en menos de 10 segundos desde la pantalla principal.
- **SC-003**: En pantallas desde 320px de ancho hasta escritorio amplio,
  el 100% de las secciones es visible y usable sin scroll horizontal y sin
  solapamientos.
- **SC-004**: El texto y los controles de ambas interfaces (claro y oscuro)
  cumplen contraste mínimo AA en el 100% de los componentes verificados.
- **SC-005**: Los porcentajes y las proporciones de la barra del medidor
  coinciden con la suma exacta de minutos registrados por categoría en el
  100% de los casos.
- **SC-006**: Un usuario puede completar el registro (descripción,
  categoría y duración) usando únicamente el teclado, incluyendo la
  navegación por el selector segmentado y los botones de tiempo.
- **SC-007**: Tras guardar o eliminar una entrada, totales, medidor,
  tarjetas y tendencia reflejan el cambio en menos de 1 segundo percibido,
  sin recargar la aplicación.
- **SC-008**: El 100% de los textos visibles de la interfaz permanece en
  español tras el rediseño.

## Assumptions

- El tema inicial, sin preferencia previa guardada, sigue la preferencia del
  sistema del dispositivo; si esta no puede determinarse, se usa el modo
  claro.
- Los textos de veredicto del medidor se definen por bandas de ratio
  (por ejemplo: equilibrado cerca de 50/50, desequilibrado con claridad
  hacia una categoría, extremo en 100/0); las redacciones exactas se
  especifican durante la planificación manteniendo el tono en español.
- La funcionalidad de eliminación de entradas existente se conserva dentro
  de las nuevas tarjetas de categoría; no se añade edición de entradas.
- La exportación/importación de datos y la navegación por días se
  reubican en la cabecera del nuevo diseño conservando su comportamiento.
- Las familias tipográficas serif y sans especificadas en la dirección
  estética son el objetivo de diseño; si alguna no está disponible, se
  sustituye por la más cercana sin alterar la jerarquía.
- La gráfica de tendencia y la navegación de días mantienen la ventana de 7
  días que termina en el día calendario actual, independiente de la fecha
  seleccionada para el balance diario.
- Los datos existentes del usuario no requieren migración; el rediseño es
  puramente de presentación más la nueva preferencia de tema.
