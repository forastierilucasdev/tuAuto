# Changelog

Todas las modificaciones relevantes del proyecto se documentan en este archivo.
Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).

## [Unreleased]

### Changed (2026-08-07, noche) — Concesionarias y Agencias: filtro por tipo, panel de filtros unificado y padding simétrico
- **Padding simétrico en `Select`** (componente centralizado, usado en todos los filtros de la app): tenía `px-3 pr-9` para dejarle lugar a la flechita, así que el valor quedaba visiblemente corrido hacia la izquierda dentro del campo. Ahora es `px-3` en los dos lados (con `overflow-hidden`/`text-ellipsis` para valores largos) y la flechita se superpone como decoración en vez de reservar espacio — corrige la asimetría en todos los `Select` de la app de una sola vez.
- **`/concesionarias` ahora usa el mismo patrón de filtros que el catálogo**: panel fijo en la barra lateral en desktop, panel deslizable con botón "Filtros" en mobile (antes era un simple formulario arriba de los resultados) — mismo componente visual (`AgencyFilters`/`AgencyFiltersDrawer`, mismo contenedor que `CatalogFilters`).
- **Nuevo filtro "Tipo"** (Concesionarias / Agencias / Todos) en ese panel. El título de la sección de resultados se adapta: "Todas las concesionarias" si el filtro es Concesionaria, "Todas las agencias" si es Agencia, "Todos los resultados" si no se aclaró el tipo.
- **"Concesionarias destacadas" y "Agencias destacadas"** ahora son dos secciones separadas (antes una sola sin distinguir tipo) — se muestran solo cuando no hay ningún filtro activo. Reutilizan la misma función de datos parametrizada por tipo (`getFeaturedAgencies(accountType)`), sin duplicar la lógica.
- Cada tarjeta de la grilla ahora indica si es Concesionaria o Agencia (útil en la vista sin filtrar, donde se mezclan ambos tipos).
- El link "Concesionarias" del menú de navegación pasa a "Concesionarias | Agencias" y el título de la página a "Concesionarias y Agencias", reflejando que ahora incluye a las dos.

### Added (2026-08-07, noche) — Filtro de tipo de vendedor y buscador de concesionarias
- **Filtro "Tipo de vendedor"** (Particular / Agencia / Concesionaria) agregado al buscador principal (`HeroSearch`) y al panel de filtros del catálogo (`CatalogFilters`), aplicando sobre `Listing.user.accountType` en `buildWhere` (`server/data/listings.ts`).
- **Página `/concesionarias` rediseñada**: buscador exclusivo por provincia y localidad (texto libre, igual criterio que el resto de la app), sección "Concesionarias destacadas" (las 4 con más publicaciones visibles) cuando no hay filtros activos, y tarjetas con el mismo formato que los resultados de vehículos (foto de portada, nombre, provincia/localidad, cantidad de publicaciones, botón "Ver publicaciones").
- **Página de detalle de concesionaria** (`/concesionarias/[id]`) ahora muestra la foto de portada, la dirección y el sitio web (si los cargó), además de la descripción y el listado de publicaciones activas que ya existía.
- **Nueva sección "Datos comerciales" en Mi perfil** (solo Agencia/Concesionaria): foto de portada (nuevo bucket `agency-logos` en Supabase Storage, mismo patrón que la foto de perfil), dirección y sitio web — se guardan en los campos `logoUrl`/`address`/`website` de `AgencyProfile`, que ya existían en el schema pero no se exponían todavía.
- El contador de "publicaciones" de la tarjeta de concesionaria ahora usa el mismo criterio de visibilidad que "Ver publicaciones" (activa o reservada, no vencida) en vez de solo `status = ACTIVE` — antes podía mostrar un número distinto al que aparecía al entrar.

### Fixed (2026-08-07, noche) — Botón "Publicar" del diálogo de reactivar quedaba trabado en "Publicando..."
- `reactivateListingAction` se invoca directo desde el cliente (no como `<form action>`), y un `redirect()` server-side dentro de una Server Action invocada así no resuelve la promesa del lado del cliente — el botón quedaba en estado de carga para siempre y nunca navegaba. Se cambió la acción para que devuelva `{ slug }` en vez de redirigir, y `OwnerListingCard` navega con `router.push()` (mismo patrón ya usado en `PublishedListingModal`).

### Added (2026-08-07, noche) — Campos del wizard adaptados por tipo de vehículo
- El paso "Datos principales" del wizard (alta y edición), el catálogo (detalle, tarjetas, filtros) y "Mis publicaciones" ahora se adaptan según el tipo de vehículo elegido, centralizado en `mileageUnitFor()`/`usesTransmission()` (`lib/constants.ts`):
  - **Kilometraje**: solo Auto, Camioneta y Monopatín.
  - **Horas de uso** (mismo campo `mileageKm`, otra etiqueta): Lancha y Barco.
  - **Ninguno de los dos**: Moto y Bicicleta.
  - **Transmisión**: solo Auto y Camioneta.
- Al enviar el formulario, los campos que no aplican al tipo elegido directamente no se mandan (evita guardar un dato sin sentido, ej. transmisión en una moto).
- El filtro de Km del catálogo también se adapta: si elegís un tipo sin Km/Horas se oculta (y se limpia el filtro si tenía algo cargado); si elegís Lancha/Barco pasa a "Horas de uso"; sin tipo elegido (todos mezclados) se mantiene el filtro genérico de Km.

### Fixed (2026-08-07, noche) — "Volver" en Mis publicaciones recorría cada pestaña
- Cambiar de pestaña (Activas/Destacadas/Reservadas/Inactivas/Vendidas) apilaba una entrada nueva en el historial del navegador en cada click, así que "Volver" te hacía recorrer pestaña por pestaña en vez de salir de la pantalla. Se agregó la prop `replace` a esos links (Next.js reemplaza la entrada actual en vez de apilar una nueva) — el resto de los "Volver" de la app siguen usando el historial normal, este cambio es puntual a esta pantalla.

### Changed (2026-08-07, noche) — Header desktop: avatar a la derecha, panel desde la derecha
- En la versión de escritorio, el logo se queda a la izquierda y el avatar ("EI" + "Bienvenido, ...") pasa a la punta derecha del header, después de "Publicar anuncio" — antes estaba pegado al logo, a la izquierda. Al tocarlo, el panel de la cuenta ahora abre desde la derecha (antes siempre desde la izquierda, sin importar dónde estuviera el avatar). En mobile no cambia nada (avatar arriba a la izquierda, panel desde la izquierda, como ya estaba).
- `AccountMenu` ahora acepta `panelSide` ("left" por defecto, "right" para este caso) en vez de tener el lado fijo.
- Menú de 3 líneas (mobile): con sesión iniciada, debajo de "Contacto" se agregó una línea divisoria y los accesos "Mi perfil" y "Cerrar sesión".

### Fixed (2026-08-07, tarde) — Segunda pasada de botones: relleno sólido y bordes faltantes
- La primera pasada de colores (variantes `outline-*`, borde + texto de color) no era lo que se pedía — se reemplazó por **relleno sólido con letra blanca**: nueva variante `success` (verde) y se reutilizan `primary` (azul) y `destructive` (rojo, ya existía) para los tres botones de decisión.
- **"No, publicar" → "Publicar"** en todos lados: el prefijo "No," confundía a simple vista sobre una acción positiva. Aplica al diálogo de reactivar (`OwnerListingCard`) y al diálogo de confirmar publicación (`ListingForm`, donde además faltaba corregirle el color — seguía usando el azul por defecto).
- **`ListingForm` — diálogo "¿Desea publicar?"**: "Sí, revisar" pasa a azul (`primary`), "Publicar" a verde (`success`).
- **Variante `outline` reforzada**: borde más oscuro y más grueso (`border-2 border-slate-300`, antes `border border-border` casi invisible sobre blanco) — afecta a todos los botones que la usan sin tocar cada uno por separado (Atrás, Guardar como borrador, Cancelar edición, Editar, etc.).
- **Botones sin borde corregidos** (usaban `variant="ghost"`, sin borde en absoluto): Pausar, Marcar vendido, Reactivar, Eliminar (card), Cerrar (anuncio publicado), Cancelar (eliminar y marcar vendido), Cancelar edición — todos pasan a `outline` (neutro, con borde). La variante `ghost` queda definida pero sin ningún uso actual en la app (se documentó en el propio archivo para qué reservarla).

### Fixed (2026-08-07) — Contador de publicaciones y colores de botones centralizados
- **Bug**: "Publicaciones realizadas" y "Publicaciones disponibles" cambiaban cada vez que se reactivaba una publicación (incluso desde Reservada/Pausada), como si fuera una publicación nueva cada vez. Ahora se separan dos conceptos:
  - `activationCount` ("Publicaciones realizadas") suma **una única vez por publicación**, la primera vez que se publica de verdad — reactivar la misma publicación nunca la vuelve a sumar.
  - `quotaConsumed` (nuevo campo, define "Publicaciones disponibles") suma en ese mismo primer publish, y **además** cuando una publicación **vencida** se reactiva (arranca un ciclo nuevo, consume cupo) — pero reactivar desde Reservada o Pausada sigue siendo gratis (mismo ciclo en curso, no consume cupo ni pide cupo disponible).
  - Se recalcularon ambos contadores para todas las cuentas existentes, contando publicaciones distintas realmente publicadas (`publishedAt` no nulo), ya que habían quedado inflados por el bug.
- **Botones del diálogo de reactivar**: se centralizaron 3 variantes nuevas en `buttonVariants` (`outline-primary`, `outline-success`, `outline-danger` — borde + texto de color, mismo lenguaje visual reutilizable en cualquier diálogo futuro) y se aplicaron: "Sí, editar" azul, "No, publicar" verde, "Cancelar" rojo — los tres con borde visible (antes "Cancelar" usaba `ghost`, sin borde).

### Added (2026-08-07) — Modal de confirmación al marcar como vendida, con datos opcionales
- "Marcar vendido" ya no cambia el estado con un solo click: ahora abre un modal de confirmación (evita marcar como vendida por error) con campos **opcionales** para el registro del vendedor — nunca se muestran en el catálogo público: fecha de venta (precargada con la de hoy, editable), datos del comprador, precio real de venta y condiciones. Se guardan en `Listing.buyerInfo`/`realSalePrice`/`saleConditions` (nuevos campos). Si cargaste un precio real de venta, la tarjeta lo muestra junto a "Vendida el ...".

### Changed (2026-08-06, noche) — Reactivar sin editar, y fecha de venta en vez de vencimiento
- **Reactivar (Reservada/Pausada/Vencida)**: el mensaje cambió a "¿Querés editar los datos de la publicación antes de volver a publicarla?" con tres opciones: **"Sí, editar"** (entra al formulario de edición, como antes), **"No, publicar"** (reactiva de inmediato sin tocar ningún dato) y **"Cancelar"**. Antes la única forma de reactivar era pasando por edición. Aplica igual sin importar si la publicación estaba Reservada o Pausada. Para un borrador, el texto se adapta ("...antes de publicarla", ya que nunca estuvo publicado).
- **Fecha de venta**: al marcar una publicación como vendida, la tarjeta ahora muestra "Vendida el dd/mm/aaaa" (usa `soldAt`, ya se guardaba en la base) en vez de "Publicado el ... · Vence en N días" — una publicación vendida no tiene fecha de vencimiento que mostrar.

### Fixed (2026-08-06, noche) — Pausar/Reservar no cambiaba el estado, layout y navegación
- **Bug crítico**: "Pausar" (tanto "marcar como reservada" como "pausar") no cambiaba el estado, la publicación quedaba Activa. Causa: el botón de confirmación tenía `type="submit"` (para disparar el Server Action del `<form>`) y a la vez un `onClick` que cerraba el modal — al cerrar el modal, React desmonta el `<form>` (vive en un Portal) *dentro del mismo evento de click*, así que el navegador cancelaba el envío del formulario antes de que el Server Action llegara a ejecutarse. Se movió el cierre del modal al `onSubmit` del `<form>` con un `setTimeout(…, 0)`, para que el cierre ocurra recién después de que el envío ya se disparó. Confirmado con un update directo a la base que la lógica de guardado en sí siempre estuvo bien — el problema era puramente la carrera en el cliente.
- **"Volver" después de "Ver publicación"**: al tocar "Ver publicación" en el mensaje de éxito, y después "Volver" desde el catálogo, se volvía a mostrar el mensaje "tu publicación fue publicada" — porque la URL con `?published=...` seguía en el historial del navegador. Ahora "Ver publicación" reemplaza esa entrada del historial antes de navegar al catálogo.
- **Orden de "Volver" en todas las pantallas**: pasó a ir siempre arriba de todo, en su propia fila, seguido del título y recién después el contenido (fotos, formulario, etc.) — antes en el detalle del catálogo el orden se invertía en mobile (fotos antes que el título) y en el resto de las pantallas "Volver" iba al lado del título en la misma fila. Aplica a catálogo, Mi perfil, Mis publicaciones, Publicar vehículo, Editar publicación, Destacar anuncio, Verificar perfil y Método de pago.
- **Botones del último paso del wizard desbordaban en mobile**: "Atrás"/"Cancelar edición"/"Guardar como borrador"/"Publicar anuncio" (o "Guardar cambios") se amontonaban en una sola fila sin wrap. Ahora se apilan en columna en mobile y vuelven a una fila en pantallas más anchas.
- **Eliminar fotos ya subidas al editar**: cada foto existente en el paso "Fotos" del editor ahora tiene una cruz para quitarla (borra la fila en la base; el archivo en Supabase Storage queda huérfano, mismo límite ya documentado para eliminar una publicación entera). No se puede quitar la última foto — la publicación necesita al menos una.

### Fixed (2026-08-06) — Las publicaciones vendidas no se podían abrir
- `OwnerListingCard` solo hacía clickeable la foto/título cuando el estado era Activa o Reservada (los únicos visibles en el catálogo público). Se quedó desactualizado tras agregar que el dueño puede ver su propia publicación en cualquier estado (`getListingBySlug` ya lo permitía desde una ronda anterior) — ahora todas las tarjetas de "Mis publicaciones" son clickeables, sin importar el estado. Sigue sin ser accesible para otros visitantes (404) si no está Activa/Reservada.

### Added (2026-08-06) — Rediseño completo del ciclo de vida de publicaciones
- **Nuevos estados y pestañas**: "Mis publicaciones" pasa de 3 a 5 pestañas: **Activas**, **Destacadas**, **Reservadas** (antes agrupada en "Inactivas"), **Inactivas** (Borrador + Pausada + Vencida) y **Vendidas**. Vendida es de solo lectura: sin Editar, Reactivar ni Eliminar.
- **Vencimiento automático (30 días)**: se acorta el plazo de publicación de 60 a 30 días. El vencimiento se calcula **al leer**, sin ningún proceso en segundo plano — si `expiresAt` ya pasó, la publicación se trata como "Vencida" (catálogo público, badges, elegibilidad para reactivar) aunque en la base todavía diga `ACTIVE`/`RESERVADA`/`PAUSADA`. Reactivarla vuelve a correr el plazo desde cero.
- **Cupo de publicaciones**: cuenta con 10 publicaciones gratuitas (`FREE_PUBLICATION_QUOTA`). "Mis publicaciones" ahora muestra "Publicaciones realizadas" y "Publicaciones disponibles", con un botón "Comprar publicaciones". **El cupo se hace cumplir de verdad**: publicar (o reactivar) sin publicaciones disponibles devuelve un error explícito en vez de guardar.
- **Packs de publicaciones**: nueva sección "Comprar publicaciones" en Método de pago con 4 packs (1, 5, 10 y 20 — este último recomendado para cuentas Agencia/Concesionaria), que suman al cupo disponible al pagar (mock instantáneo, igual que el resto de los pagos).
- **Sección "Anuncios destacados"**: reemplaza la vieja tarjeta "Destacar una publicación" (con selector de publicación) en Método de pago — ahora es una lista de las publicaciones ya destacadas del usuario. Destacar una publicación puntual se hace desde su propia pantalla dedicada (`/dashboard/publicaciones/[id]/destacar`, de una ronda anterior).
- **Wizard de publicar**: el paso "Datos principales" (tipo/marca/modelo/año) ahora también se muestra al **editar** una publicación existente, pero con esos 4 campos bloqueados — antes ese paso se omitía por completo en edición y solo se mostraba un texto plano, lo que impedía ver/tocar versión, transmisión, condición y kilometraje al editar (quedaban inaccesibles). Ahora si son editables.
- **Confirmación unificada antes de publicar**: "¿Desea publicar tu anuncio?" con **"Sí, revisar"** (te quedás en el formulario) / **"No, publicar"** — se dispara tanto al crear un anuncio nuevo como al reactivar un borrador/reservada/pausada/vencida por edición. "Guardar como borrador" es ahora un botón aparte (sin diálogo) solo en la creación. Al publicar de verdad, el mensaje pasa a ser "Tu anuncio fue publicado con éxito" con un botón "Ver publicación".
- **Indicador de pasos**: el círculo del paso activo ahora se pinta relleno con el color de marca (antes solo tenía el borde coloreado), para que se note mejor en qué paso estás.
- **Botones simétricos**: Editar / Marcar vendido / Pausar / Reactivar / Eliminar en cada tarjeta de "Mis publicaciones" ahora se acomodan en una grilla de 2 columnas de igual ancho, en vez de un `flex-wrap` con anchos dispares.
- **Contador de días y fecha de publicación**: cada tarjeta muestra "Publicado el dd/mm/aaaa · Vence en N días" (privado, solo visible para el dueño).
- **Botón "Volver"** agregado a la página de detalle del catálogo (`/catalogo/[slug]`), y ahora el dueño puede abrir su propia publicación en cualquier estado (borrador, pausada, vencida, vendida) desde "Mis publicaciones" — antes esas páginas devolvían 404 porque el detalle público solo mostraba Activas/Reservadas.

### Fixed (2026-08-06, madrugada) — Error de servidor al publicar con fotos (Vercel)
- **Bug crítico en producción**: Next.js limita el body de un Server Action a **1MB por defecto**. El wizard de publicar permite subir hasta 6 fotos de 5MB c/u (30MB en total), así que cualquier publicación con fotos reales de verdad superaba el límite — la request se cortaba antes de llegar al código de la app, y el navegador mostraba un error de servidor genérico ("This page couldn't load"). Se subió el límite a 32MB (`experimental.serverActions.bodySizeLimit` en `next.config.ts`).

### Added (2026-08-06, madrugada) — Confirmación de publicar/borrador, borradores, y varios ajustes de "Mis publicaciones"
- **Confirmación al publicar**: el último paso del wizard de "Publicar vehículo" ahora abre un diálogo "¿Desea publicar tu anuncio?" con dos opciones: **"Sí, publicar"** (como antes) o **"No, guardar como borrador"**. El estado `DRAFT` (ya existía en el schema pero no se usaba) ahora es un flujo real: un borrador no cuenta para "Publicaciones realizadas" hasta que se publica de verdad, aparece en la pestaña "Inactivas" de Mis publicaciones, y se publica editándolo y guardando (mismo mecanismo que reactivar).
- **"Bienvenido, {nombre}"**: al lado del avatar en el header público (desktop), muestra el nombre del usuario o, si es Agencia/Concesionaria, el nombre comercial.
- **"Cancelar edición"**: nuevo botón en el wizard cuando se edita una publicación existente, para volver a "Mis publicaciones" sin guardar cambios.
- **Editar/Eliminar solo si no está vendida**: publicaciones con estado "Vendida" ya no muestran los botones "Editar" ni "Eliminar" en Mis publicaciones.
- **Contador renombrado**: "Publicaciones activadas hasta ahora" ahora dice **"Publicaciones realizadas"**. (Queda pendiente para más adelante: un contador "Publicaciones disponibles" con un botón "Comprar pack de publicaciones" cuando llegue a 0 — ver `TASKS.md`.)
- **Checklist de precio**: se agregó la aclaración "Solo serán visibles en la publicación las opciones marcadas" debajo de los checks de negociable/permuta/financiamiento.

### Fixed (2026-08-06, noche) — Sesión no se actualizaba al loguearse, "Resumen" en desuso todavía accesible
- **Bug crítico**: el login (y el registro) llamaban a `signIn()` de Auth.js **desde el servidor** (dentro de una Server Action, con `redirectTo`). Eso deja la cookie de sesión bien seteada, pero el `SessionProvider` del cliente (de donde lee `useSession()` en el Header/AccountMenu) nunca se entera del cambio — solo se sincroniza cuando el sign-in se dispara desde el cliente. Resultado: después de loguearse, el header podía mostrar "sin sesión" hasta hacer un refresh manual, por ejemplo al tocar el logo y navegar a Inicio. Se cambió `LoginForm` y `RegisterForm` para que la validación (formato, rate limiting, alta de usuario) siga pasando por la Server Action, pero el `signIn()` real ahora se dispara desde el cliente (`next-auth/react`), que sí sincroniza `SessionProvider` correctamente.
- **Redirección post-login**: ahora es a la pantalla inicial ("/") por defecto. Si `proxy.ts` te redirigió a `/login` por intentar entrar a una pantalla protegida sin sesión, después de loguearte volvés a esa pantalla (`callbackUrl`, saneado contra open-redirect).
- **`/dashboard` (raíz) en desuso**: esa pantalla ("Hola [nombre], cuenta tipo: ...") era el viejo "Resumen", reemplazado hace unas rondas por "Mi perfil" — pero la ruta seguía existiendo y mostrándose si alguien caía ahí (ej. como pantalla por defecto post-login). Ahora `/dashboard` redirige a `/dashboard/perfil`.
- **Header, logueado/deslogueado**: se agregó "Ingresar" al lado de "Contacto" en la nav de desktop, y "Iniciar sesión" al menú de 3 líneas en mobile — antes la única entrada visible al login era el botón "Vende tu Auto".
- **"Publicar anuncio" en mobile**: en vez de un botón fijo pegado debajo del header, ahora es un botón flotante en la parte inferior de la pantalla que aparece al scrollear, se mantiene visible 20 segundos y desaparece solo si la pantalla queda quieta.

### Fixed (2026-08-06) — Publicación automática sin tocar "Publicar"
- **Bug crítico**: el wizard de publicar solo renderiza los campos del paso activo, así que en un paso con un único campo de texto (ej. "Contacto", con la Dirección como único input) el navegador dispara un *submit implícito* del `<form>` al tocar Enter/"Listo" en el teclado — aunque el botón "Publicar anuncio" ni siquiera esté en pantalla (solo existe en el último paso). Esto publicaba el anuncio con los datos cargados hasta ese momento, sin que el usuario tocara el botón. Se agregaron dos capas de defensa en `ListingForm`: (1) un `onKeyDown` en el `<form>` que intercepta Enter y avanza de paso en vez de dejar que el navegador someta el formulario, y (2) un chequeo dentro de `handleSubmit` que ignora cualquier intento de submit si el usuario no está en el último paso, sin importar qué lo haya disparado.

### Added (2026-08-06) — Estados de publicación (Reservada/Pausada), verificación de perfil y destacar por anuncio
- **Nuevos estados de publicación**: además de Activa/Vencida/Vendida, ahora existen **Reservada** (se sigue mostrando en el catálogo, para indicar que está en proceso de venta) y **Pausada** (deja de mostrarse hasta reactivarla). El botón "Pausar" en una publicación activa abre un diálogo con las dos opciones, cada una con su propia aclaración ("se va a seguir mostrando..." / "va a dejar de mostrarse...") antes de confirmar.
- **Reactivar**: para publicaciones reservadas, pausadas o vencidas aparece "Reactivar", que primero pregunta si querés conservar tus datos ("Sí, editar") y te lleva al formulario de edición — al guardar los cambios, la publicación vuelve a estar activa automáticamente. Una publicación **vendida** no se puede reactivar.
- **Eliminar anuncio**: nueva opción disponible en cualquier estado, con confirmación explícita antes de borrar (acción irreversible).
- **Contador de activaciones**: cada vez que una publicación del usuario pasa a estado Activa (alta o reactivación) se incrementa un contador (`activationCount` en `User`), visible en "Mis publicaciones". Todavía no bloquea nada — es la base para un futuro límite de publicaciones gratuitas.
- **Mensaje "Anuncio publicado"**: al crear una publicación, "Mis publicaciones" muestra un modal con un botón "Ver" (lleva al anuncio en el catálogo) y una cruz para cerrar. Las publicaciones activas o reservadas ahora son clickeables desde "Mis publicaciones" y abren su página de detalle en el catálogo.
- **Destacar por publicación**: en la pestaña Activas, cada publicación no destacada tiene un botón dorado "Destacar anuncio" que lleva a una pantalla dedicada (`/dashboard/publicaciones/[id]/destacar`) con los beneficios (más visibilidad, primeros resultados, más posibilidades de venta), el costo ($9.999, provisorio) y un botón "Pagar" — reutiliza el mismo mecanismo mock de pago instantáneo que "Método de pago".
- **Verificación de perfil**: nuevo botón "Verificar perfil" en "Mi perfil" que lleva a un formulario (`/dashboard/perfil/verificar`) donde se confirman los datos personales y se sube una foto del DNI (frente y dorso). Al enviar, muestra el mensaje "Analizaremos tu documentación a la brevedad...". Las fotos de DNI se guardan en un bucket **privado** de Supabase Storage (`verifications`, a diferencia de `listing-images`/`avatars` que son públicos) — nunca quedan accesibles por URL directa. Por ahora la solicitud queda en estado `PENDING`; todavía no hay panel de administración para aprobar/rechazar (ver ERRORES.md).

### Changed (2026-08-06, madrugada) — Reordenamiento de headers, botones "Volver" y wizard de publicación
- **Sidebar desktop del dashboard**: el avatar del `AccountMenu` ahora usa tamaño `md` y quedó centrado horizontalmente arriba de la lista de secciones (antes quedaba chico y pegado a la izquierda).
- **"Resumen" → "Mi perfil"**: el ítem de navegación del dashboard que antes apuntaba a `/dashboard` con la etiqueta "Resumen" ahora apunta a `/dashboard/perfil` con la etiqueta "Mi perfil", coherente con el resto de los accesos a esa pantalla.
- **Header del dashboard (mobile)**: reordenado a `[avatar] [logo centrado] [Cerrar sesión]` con un grid de 3 columnas, igual que el header público — antes el orden no era consistente entre ambos headers.
- **`AccountMenu`**: el panel deslizable ahora suma "Publicar anuncio" (va a `/dashboard/publicaciones/nueva`) y, después de un separador, "Cerrar sesión" (`signOut` de `next-auth/react`, en rojo) — antes había que cerrar el panel y buscar el botón de salir en otro lado.
- **Header público (logueado)**: reordenado a `[avatar] [logo centrado] [hamburguesa]`. El botón "Publicar anuncio" se sacó de la fila del header y ahora es un botón azul redondeado, centrado, en una fila propia justo debajo del header (solo mobile; en desktop se mantiene a la derecha del header).
- **Mis publicaciones**: el botón "Volver" se separó de "Publicar vehículo" — ahora "Volver" queda arriba a la derecha, al lado del título, y "Publicar vehículo" pasó a su propia fila debajo.
- **Publicar vehículo**: le faltaba un botón para volver atrás; se agregó `BackButton` a la derecha del título.
- **Wizard de publicación (`ListingForm`)**: el indicador de pasos se rediseñó como una barra de progreso — círculos numerados que se pintan (con tilde) a medida que se completan los pasos anteriores, unidos por una línea que se va rellenando, y un subtítulo centrado debajo con el nombre del paso activo. En el paso final ("Revisar"), si falta completar algún campo obligatorio (tipo, marca, modelo, año, precio o al menos una foto), aparece un cartel "Datos pendientes de carga" con la lista de campos faltantes (cada uno es un link que salta directo a su paso) y los campos correspondientes se marcan con borde rojo; el botón de publicar queda deshabilitado hasta completarlos.

### Changed (2026-08-06, noche)
- Se sacó la barra horizontal de navegación del dashboard en mobile (Resumen / Mis publicaciones / Método de pago) — quedaba redundante con el menú del `AccountMenu`. Ese menú ahora vive directo en el header del dashboard (al lado del logo) en mobile, para no perder el único punto de acceso a esas pantallas.

### Fixed (2026-08-06, tarde-noche) — Panel de cuenta encerrado en el header
- **Bug crítico**: `SlideOverPanel` se renderizaba como hijo del `Header`, que tiene `backdrop-blur` — esa propiedad CSS crea su propio "containing block" para elementos `fixed`, así que el panel quedaba atrapado dentro de los 64px de alto del header en vez de ocupar toda la pantalla. Ahora se monta con un Portal de React directo a `document.body`, evitando cualquier ancestro con `transform`/`filter`/`backdrop-filter` que pueda repetir el problema en el futuro.

### Changed (2026-08-06, tarde-noche) — Rediseño del menú de cuenta
- El panel del avatar ya no muestra el formulario de perfil embebido: ahora es un **menú de navegación** vertical (Mi perfil / Mis publicaciones / Método de pago) que desliza desde la **izquierda** (mismo mecanismo que el drawer de filtros), y cada opción lleva a su pantalla completa.
- El ícono de cuenta (foto o iniciales) se movió a la **izquierda** del header, tanto en el header público como en la barra del dashboard (mobile y desktop) — antes estaba a la derecha.
- Cada pantalla de cuenta (Mi perfil, Mis publicaciones, Método de pago) tiene un botón **"Volver"** a la derecha (`BackButton`, reutilizable, usa el historial del navegador).
- **Tipo de cuenta editable**: dentro de "Mi perfil" ahora se puede cambiar entre Particular / Agencia / Concesionaria. Pasar a un tipo de negocio pide razón social y CUIT (con chequeo de unicidad); pasar a Particular elimina el perfil de agencia/concesionaria asociado. Los schemas de perfil (`updateProfileSchema`) ahora reutilizan los mismos schemas del registro (`auth.ts`) vía `.omit()`, en vez de duplicar las reglas de validación.

### Fixed (2026-08-06, más tarde)
- El menú del dashboard (`DashboardNav`) todavía tenía "Mi perfil" como un link normal a la página completa `/dashboard/perfil`, en vez de usar el mismo trigger de avatar + panel deslizable (`AccountMenu`) que ya se había armado para el header público. Quedaban dos formas distintas de llegar al perfil según por dónde entrabas. Ahora `AccountMenu` se reutiliza también en la barra mobile y en la barra lateral desktop del dashboard — "Mi perfil" ya no es un ítem de navegación, es el mismo trigger en todos lados.

### Added (2026-08-06, noche) — Sesión logueada: publicar, cuenta y contraseña
- **Header logueado**: cuando hay sesión, el CTA cambia de "Vende tu Auto" a **"Publicar anuncio"** (va directo a `/dashboard/publicaciones/nueva`) — centrado en mobile, a la derecha en desktop (grid de 3 columnas para centrar de forma robusta sin importar el ancho de los elementos vecinos).
- **AccountMenu**: junto al CTA aparece la foto de perfil (o las iniciales si no cargó una) con el texto "Mi perfil" debajo (mobile) o al lado (desktop). Al tocar, abre un panel deslizable desde la derecha con el `ProfileForm` — el mismo componente que usa la página completa `/dashboard/perfil`, reutilizado tal cual.
- **`SlideOverPanel`**: se extrajo el panel deslizable genérico (izquierda o derecha, fondo oscuro, cruz para cerrar) desde `CatalogFiltersDrawer`, que ahora lo reutiliza en vez de tener su propia implementación duplicada.
- **DNI editable**: el perfil ahora permite cambiar el DNI (antes era de solo lectura), con la misma validación y chequeo de unicidad que en el registro.
- **Cambiar contraseña (real)**: nueva pantalla `/dashboard/perfil/password` para usuarios logueados — a diferencia de "Recuperar contraseña" (mock, sin email), esta sí actualiza la contraseña de verdad: pide la contraseña actual, la valida contra el hash guardado, y solo ahí guarda la nueva.
- Primitivas de validación (`email`, `password`, `dni`, `cuit`, `teléfono`, `nombre`) centralizadas en `lib/validations/shared.ts`, reutilizadas por `auth.ts` y `profile.ts` en vez de estar duplicadas.

### Fixed (2026-08-06, tarde)
- El dashboard no tenía ninguna navegación visible en mobile: la barra lateral (`Mi perfil`, `Mis publicaciones`, `Método de pago`) tenía `hidden md:block` sin reemplazo, así que logueado desde el celular no había forma de llegar a esas secciones. Se agregó `DashboardMobileNav`, una fila horizontal scrolleable debajo del header del dashboard, solo en mobile.
- El botón de cerrar (X) del lightbox de fotos a veces no respondía al toque: le faltaba `z-10` (las flechas de anterior/siguiente sí lo tenían), así que el contenedor de la imagen lo tapaba en el orden de pintado y absorbía el click.

### Changed (2026-08-06) — Rebranding, sesión persistente, filtros mobile y perfil
- **Renombrado el proyecto a "Motoresya"** (antes "tuAuto"): nombre de la app, metadata, mensaje de WhatsApp, textos de Concesionarias/Contacto y `package.json`. El repositorio de GitHub no se renombró (queda a decisión del usuario).
- **Sesión persistente**: se agregó `SessionProvider` (Auth.js) envolviendo la app (`src/components/Providers.tsx`) y el `Header` ahora lee el estado de sesión con `useSession()` en vez de mostrar siempre "Vende tu Auto" — evita que quede una vista "desactualizada" al navegar hacia atrás con el botón del navegador. Logueado, el botón pasa a decir "Mi cuenta" y lleva al dashboard.
- **Header mobile**: se agregó el botón "Vende tu Auto"/"Mi cuenta" al lado del ícono de menú (antes solo estaba dentro del desplegable).
- **Hero del home**: en mobile ahora es una foto de fondo a página completa con degradé oscuro y el buscador superpuesto encima (como pediste); en desktop se mantiene el layout separado (texto/buscador a un lado, foto al otro).
- **Filtros del catálogo en mobile**: dejaron de ocupar espacio fijo arriba de los resultados. Ahora los resultados se muestran primero, con un botón "Filtros" (arriba a la derecha) que abre un panel deslizable desde la izquierda (`CatalogFiltersDrawer`), con cruz para cerrar o alternando el mismo botón. En desktop se mantiene la barra lateral fija de siempre.
- **Login**: contraseña con botón de mostrar/ocultar (`PasswordInput`, reutilizado también en el registro) y link "¿Olvidaste tu contraseña?" a una página de recuperación (`/recuperar-password`) — mockeada por ahora, sin envío real de emails (ver `ERRORES.md`).
- **Mi perfil**: nuevo campo `avatarUrl` en `User` (migración `20260805140549_user_avatar`). El formulario de perfil permite subir una foto que se centra y recorta dentro de un círculo, con vista previa inmediata; se sube a un bucket nuevo de Supabase Storage (`avatars`) al guardar. Se extrajo la validación de imágenes (`lib/image-validation.ts`) y la subida a Storage (`uploadAvatarImage`) a helpers compartidos con la carga de fotos de publicaciones, en vez de duplicar la lógica.

### Changed (2026-08-05, noche) — Ajuste responsive del detalle de publicación
- `VerticalTabs` ya no usa pestañas-píldora en mobile (se cortaban / no entraban en pantalla): en mobile todas las secciones se listan apiladas una debajo de la otra, con un ícono + título liviano en vez de botones con borde, aprovechando el scroll vertical natural del teléfono. En desktop (`sm:` en adelante) se mantiene el comportamiento de pestañas verticales clásico.
- En la página de detalle, el orden de Título/Galería de fotos ahora depende del tamaño de pantalla (vía `order-*` de flexbox): en mobile las fotos van primero y el título después; en desktop el título va primero y las fotos después.

### Changed (2026-08-05, tarde) — Rediseño de búsqueda, publicación y detalle
- **Tercer tipo de cuenta**: se agregó `CONCESIONARIA` como tipo de cuenta independiente de `AGENCIA` (antes unificados). Migración `20260805121035_listing_details_and_account_types`.
- **Nuevos campos en `Listing`**: `version`, `condition` (Nuevo/Usado), `transmission` (Mecánica/Asistida), `priceNegotiable`, `acceptsTrade`, `acceptsFinancing`, `contactAddress`; `description` ("Observaciones") pasó a ser opcional.
- **El título de la publicación ahora siempre se compone en el servidor** como Marca + Modelo + Año — dejó de ser un campo de texto libre del formulario.
- Buscador principal (home) reconstruido con la cascada completa Tipo → Marca → Modelo → Año + Condición (antes solo tenía Marca/Modelo/Año).
- Filtros del catálogo: se sumó Condición (Nuevo/Usado).
- Nuevo hook `useVehicleTaxonomy` que centraliza la cascada Tipo→Marca→Modelo→Año, reutilizado por el buscador, los filtros de catálogo y el formulario de publicar (antes duplicado en dos componentes).
- Tarjetas de resultado (`VehicleCard`) rediseñadas con fila de íconos: kilometraje, ubicación (provincia - localidad), tipo de vendedor, condición + año.
- Página de detalle rediseñada: galería con lightbox modal (click para expandir a pantalla completa, cerrar con cruz o Escape, navegación con flechas/teclado), y un nuevo componente reutilizable `VerticalTabs` que agrupa Datos principales / Precio / Ubicación / Observaciones / Contacto en pestañas (verticales en desktop, fila horizontal en mobile). Botón de WhatsApp con el texto pre-armado pedido por el usuario.
- Formulario de publicar (`ListingForm`) reconstruido de cero como wizard de varios pasos (Datos → Precio → Ubicación → Contacto → Fotos → Observaciones → Publicar/Guardar), con indicador de progreso y selección de foto de portada (destacada con una estrella).
- Seed actualizado: 2 de las 3 cuentas de negocio ahora son `CONCESIONARIA`, y las 33 publicaciones de prueba tienen valores realistas de versión, condición, transmisión y checks de precio.

### Fixed (2026-08-05, tarde)
- `VerticalTabs` recibía referencias a componentes de ícono (función) como prop desde un Server Component, lo cual React no puede serializar cruzando el límite servidor→cliente (`Functions cannot be passed directly to Client Components`). Se corrigió pasando el ícono ya renderizado (`<Info className="..." />`) en vez de la referencia al componente.

### Added (2026-08-05)
- Base de datos Supabase conectada: migración inicial aplicada (`20260805103908_init`) y datos de prueba sembrados contra la base real (5 usuarios, marcas/modelos, 33 publicaciones).
- Repositorio Git inicializado y publicado en GitHub (`forastierilucasdev/tuAuto`).

### Added

**Base del proyecto**
- Scaffold con Next.js 16 (App Router, TypeScript, Tailwind CSS v4, ESLint), Prisma 7 con driver adapter `@prisma/adapter-pg`, Auth.js v5, Zod v4, bcryptjs, cliente de Supabase, Lucide Icons.
- Documentación del proyecto: `TASKS.md` (checklist de progreso), `ARCHITECTURE.md`, `ERRORES.md`, `CHANGELOG.md`.
- Design system centralizado (tokens de color/sombra/radio en `globals.css`) y componentes UI reutilizables (`Button`, `Input`, `Select`, `Textarea`, `Label`, `Card`, `Badge`, `FieldError`).
- Layout público (Header con navegación + "Vende tu Auto", Footer), Home (hero, buscador, destacados, categorías), Contacto y Blog (contenido de muestra).

**Datos y autenticación**
- Modelo de datos completo en Prisma (`User`, `AgencyProfile`, `Brand`, `Model`, `Listing`, `Image`, `Plan`, `PaymentMethod`, `Payment`) y script de seed (5 usuarios, ~20 marcas/modelos, ~30 publicaciones de prueba).
- Autenticación con Auth.js (Credentials + JWT), registro diferenciado por tipo de cuenta (particular / concesionaria-agencia), login, rate limiting in-memory, y `proxy.ts` protegiendo `/dashboard/**`.

**Catálogo público**
- Catálogo con filtro en cascada Tipo → Marca → Modelo → Año, más filtros de precio (por moneda) y kilometraje sobre los resultados, separando publicaciones destacadas del resto.
- Página de detalle de publicación con galería de fotos y botón de contacto por WhatsApp.
- Directorio de "Concesionarias" y perfil público de cada agencia con sus publicaciones activas.

**Dashboard de usuario**
- Gestión de perfil (particular y agencia).
- "Mis publicaciones" con pestañas Destacadas / Activas / Inactivas.
- Publicar anuncio nuevo (con la misma cascada Tipo→Marca→Modelo del catálogo) con carga real de fotos a Supabase Storage.
- Editar publicación, marcar como vendida, reactivar una publicación vencida.
- "Método de pago": alias de pago, contratación de planes para destacar publicaciones o suscripción de agencia, con aprobación simulada instantánea (sin integración real de Mercado Pago todavía) e historial de pagos.

### Security
- Headers HTTP (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`) en `next.config.ts`.
- Validación server-side (Zod) en todos los formularios, independiente de la validación de cliente.
- Autorización por pertenencia (ownership) revalidada en cada Server Action de mutación sobre publicaciones, no solo en `proxy.ts`.
- Carga de imágenes con whitelist estricta de tipos MIME, límite de tamaño/cantidad, y extensión de archivo derivada del content-type validado (no del nombre de archivo del cliente).
- `passwordHash` nunca sale de la capa de datos hacia un componente cliente (auditado explícitamente).

### Fixed
- Home y Concesionarias forzadas a renderizado dinámico (`export const dynamic = "force-dynamic"`) porque Next.js 16 intentaba pre-renderizarlas como HTML estático en build time, lo que rompía el build al depender de la base de datos.

### Known limitations
Ver `ERRORES.md` para el detalle completo (pagos simulados, sin CSP estricta todavía, sin panel de administración, edición de publicaciones no permite cambiar tipo/marca/modelo/año, etc).
