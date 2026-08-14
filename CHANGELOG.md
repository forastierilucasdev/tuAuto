# Changelog

Todas las modificaciones relevantes del proyecto se documentan en este archivo.
Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).

## [Unreleased]

### Added (2026-08-14) — Panel admin, Fase 2: sesión única, bloqueo por intentos fallidos, expiración por inactividad
Segunda ronda del bloque "Medidas de Autenticación y Acceso" que había quedado fuera de la Fase 1 (`TASKS.md` Fase 59) — el usuario eligió avanzar con "seguridad de sesión" primero (2FA, restricción por IP, exportación CSV y CRM de reportes siguen pendientes). **Alcance limitado a cuentas con `adminRole` seteado** — un usuario normal del marketplace nunca pasa por ninguna de estas reglas, a propósito: aplicarlas a cualquier cuenta abriría una forma de bloquear a un vendedor real fallando su contraseña a repetición.

- **Sesión única por admin**: cada login de admin exitoso incrementa `User.sessionVersion` — reutiliza el mismo mecanismo ya existente para invalidar sesiones por cambio de contraseña, sin tabla de sesiones nueva. Cualquier sesión de admin abierta en otro dispositivo/navegador se corta en su próximo request. Verificado con dos logins reales seguidos: la primera sesión pasa de `200` a `307` (redirige) apenas se loguea la segunda.
- **Bloqueo tras 5 intentos fallidos** (30 minutos), solo en cuentas de admin: mismo mensaje de error genérico que cualquier otro rechazo de login (no se diferencia "cuenta bloqueada" de "contraseña incorrecta" — evita que alguien probando emails al azar use esa diferencia como oráculo para descubrir cuáles son cuentas de admin). Desbloqueo manual disponible en `/admin/usuarios/[id]` ("Desbloquear inicio de sesión") para no tener que esperar los 30 minutos.
- **Expiración por inactividad (30 minutos)**, solo sesiones de admin: se guarda un timestamp de última actividad dentro del propio JWT (no en la base), refrescado en el mismo callback que ya revisa `sessionVersion` en cada request — un usuario normal no tiene este campo y conserva la duración de sesión de siempre.
- `tsc --noEmit`, `eslint`, `npm run build` limpios. Migración aditiva (`User.failedLoginAttempts`/`lockedUntil`) aplicada contra la base real. Verificado con script desechable (4 fallos no bloquean, el 5to sí, login correcto rechazado mientras dura el bloqueo, desbloqueo manual, `sessionVersion` +1 en cada login de admin) y con el servidor de desarrollo con logins reales: doble login de admin corta la sesión vieja; doble login de un usuario normal **no** afecta a la sesión anterior (multi-dispositivo intacto para cuentas no admin).

### Added (2026-08-14) — Panel de administración (`/admin`) con roles, auditoría y borrado lógico
Fase 1 de un pedido grande (spec completo pegado por el usuario, con 2FA/restricción por IP/exportación/alertas automáticas/CRM/tests incluidos) — se acotó explícitamente el alcance de esta ronda con el usuario antes de implementar (ver plan). Quedan fuera de esta ronda (documentado como pendiente, no implementado): 2FA, restricción por IP, sesión única por admin, bloqueo persistente de cuenta, exportación CSV/Excel, alertas automáticas por mail, auto-moderación, CRM de reportes/notas internas, documentación Swagger (no aplica, no hay API REST) y una suite de tests automatizados (no existe ninguna en el repo).

- **RBAC real, sin tabla configurable**: `User.adminRole` (`SUPERADMIN | EDITOR | LECTOR`, nullable — reutiliza login/contraseña/`sessionVersion` existentes, no una tabla de admins aparte). Matriz fija de permisos por módulo (`src/lib/admin-permissions.ts`): Lector solo lee, Editor lee+edita, Superadmin además elimina y gestiona roles de otros admins — validado **siempre server-side** (`requireAdminPermission()` como primera línea de cada Server Action de admin, igual que `requireSession()` en el resto de la app), nunca solo ocultando botones en la UI.
- **Borrado lógico** (`deletedAt` nuevo en `User` y `Listing`): "eliminar" desde el panel oculta de toda lectura pública/del dueño (catálogo, login, panel de publicaciones, etc. — se repasaron y actualizaron todas las queries existentes), pero la fila sigue en la base y se puede restaurar. Nunca reemplaza los borrados reales ya existentes (`deleteOwnedListing` del dueño sigue siendo un DELETE físico).
- **Auditoría** (`AdminAuditLog`, nuevo): cada acción de admin (banear, borrar, otorgar suscripción, destacar, cambiar rol, etc.) queda registrada con admin, IP, antes/después en JSON — visor de solo lectura en `/admin/auditoria`, visible para los 3 roles.
- **5 módulos**: Usuarios (ban/desban, borrado lógico, asignar rol — esto último exclusivo de Superadmin), Identidad (aprobar/rechazar verificación de DNI con URL firmada temporal de las fotos — exclusivo de Superadmin, gap que ya estaba documentado en `ERRORES.md`), Publicaciones (editar, cambiar estado, dar de baja), Suscripciones y Pagos (otorgar/renovar/cancelar suscripción, ajustar cupo comprado/vouchers, dar de baja un plan — el otorgamiento manual crea un `Payment` con `provider: "admin"` para quedar trazable en el historial del usuario, no es una mutación silenciosa), Destacados (destacar manual por días, quitar destacado antes de tiempo).
- **Sin `middleware.ts`** (decisión explícita, justificada en el plan): guard a nivel de `src/app/admin/layout.tsx` (`requireAdmin()`), consistente con el resto del proyecto que no tiene ningún middleware — la barrera real de seguridad sigue siendo el chequeo dentro de cada Server Action.
- Bootstrap del primer Superadmin: paso manual único, sin autoregistro (`forastierilucasdev@gmail.com`, cuenta creada para esto).
- `tsc --noEmit`, `eslint`, `npm run build` limpios. Migración aditiva (`AdminRole`, `User.adminRole`/`deletedAt`, `Listing.deletedAt`, `AdminAuditLog`) aplicada contra la base real. Verificado con script desechable (auditoría, borrado lógico de una publicación y de un usuario de prueba, invalidación de sesión simulada) y con el servidor de desarrollo: acceso anónimo a `/admin/*` → redirige a `/login`; usuario logueado sin rol → redirige a `/`; login real como Superadmin → `/admin/usuarios` carga con la insignia de rol.

### Changed (2026-08-12) — Tarjetas de "Pago individual" parejas, con el botón abajo
- Las 3 tarjetas (Publicación 30 días / Combo / Destacar por día) pasan a tener el mismo alto (ya se estiraban parejo por el grid, pero el botón "Comprar" quedaba pegado al precio con un hueco vacío debajo en las dos primeras) — ahora es `flex flex-col` + `mt-auto` en el contenido, así el botón/widget siempre queda pegado abajo del todo.
- Fondo `#888477` en las 3 tarjetas; título y monto centrados.
- `tsc --noEmit`, `eslint`, `npm run build` limpios.

### Changed (2026-08-12) — Ajuste fino de las tarjetas de "Pago individual"
- Título, precio y (en "Destacar por día") el sufijo "/ día" pasan al color `#010F40` — antes el precio era azul (`text-primary`).
- Título+precio quedan centrados verticalmente en el espacio de arriba de cada tarjeta (antes quedaban pegados arriba, con el hueco vacío abajo del precio en vez de arriba del botón).
- Precio dos tamaños más grande (`text-2xl` → `text-4xl`); botones "Comprar"/"Confirmar compra" dos tamaños más grande y en negrita (`text-sm` → `text-lg`, `font-bold`).
- En "Destacar por día", la lista que aparece después de "Agregar elemento" (nombre, días, precio, Total) también pasa a `#010F40`.
- `tsc --noEmit`, `eslint`, `npm run build` limpios.

### Changed (2026-08-13) — Botones parejos + "Total a pagar" + tokens de color centralizados
- Los 3 botones "Comprar" (Publicación 30 días, Combo, Destacar por día) y "Confirmar compra" pasan a tener la misma tipografía: `text-lg font-bold`, color `#010F40` en vez de blanco (el botón del Combo abre un modal y no tenía ninguno de estos estilos todavía — se empareja).
- En "Destacar por día": "Máx. {n}" también pasa a `#010F40`; la fila "Total" del carrito pasa a decir "Total a pagar"; el botón de confirmar deja de repetir el total en su texto (ahora dice simplemente "Confirmar compra", el total ya se ve arriba en "Total a pagar").
- Se centraliza el color de fondo (`#888477`) y de texto (`#010F40`) de estas tarjetas en `globals.css` como tokens de Tailwind (`bg-plan-card` / `text-plan-card-ink`, vía `--plan-card-bg`/`--plan-card-ink`) en vez de hex sueltos repetidos por archivo — para cambiar el estilo de estas tarjetas (o reutilizarlo en Suscripciones a futuro) alcanza con editar `globals.css` una sola vez.
- `tsc --noEmit`, `eslint`, `npm run build` limpios.

### Changed (2026-08-13) — Mismo formato aplicado a las tarjetas de Suscripciones
- Las tarjetas de "Suscripciones" adoptan el mismo formato que "Pago individual": fondo `bg-plan-card`, mismo alto con el botón pegado abajo, título+precio centrados verticalmente, precio en `text-4xl` y botón "Suscribirme" en `text-lg font-bold`, todo en `text-plan-card-ink` — reusando los tokens agregados en la ronda anterior, sin repetir hex.
- `tsc --noEmit`, `eslint`, `npm run build` limpios.

### Changed (2026-08-13) — Insignia "Destacado" con fondo #010F40 y letra #FAB005
- La insignia "Destacado" (variante `featured` de `Badge`) pasa de `bg-amber-100 text-amber-800` a fondo `#010F40` / letra `#FAB005`, centralizado en `globals.css` (`bg-featured`/`text-featured-ink`) — afecta a la vez a las tarjetas del catálogo (`VehicleCard`) y al panel del usuario (`OwnerListingCard`, que ya la mostraba mientras dura el período de destacado, calculado con `getEffectiveFeatured`).
- Nuevo: la insignia también se muestra en el detalle de la publicación (`/catalogo/[slug]`, al lado del título) — antes desaparecía al abrir la publicación, ahora se mantiene mientras la publicación siga destacada.
- `tsc --noEmit`, `eslint`, `npm run build` limpios.

### Changed (2026-08-13) — Borde #888477 en los botones de "Explorá por categoría"
- Los botones de categoría en el inicio (`CategoryGrid`) pasan de `border-border` (gris) a un borde mínimo (1px) del mismo color `#888477` que ya usan las tarjetas de "Mis compras" — reutiliza el token `border-plan-card` de `globals.css`, sin agregar uno nuevo.
- `tsc --noEmit`, `eslint`, `npm run build` limpios.

### Changed (2026-08-13) — Estrella en la insignia "Destacado"
- La insignia "Destacado" (variante `featured` de `Badge`) pasa a mostrar una estrella (`lucide-react`, rellena con el mismo color del texto) antes del texto — se agregó dentro del componente `Badge`, así aparece automáticamente en los 3 lugares que usan esta variante (catálogo, detalle de publicación, panel del usuario) sin tocar cada uno.
- `tsc --noEmit`, `eslint`, `npm run build` limpios.

### Added (2026-08-13) — "¿Buscás un auto en especial?": aviso por mail cuando se publique
- Nuevo bloque en el inicio, mismo formato que "¿Tenés un vehículo para vender?" (fondo navy, texto centrado), con botón "Cargar datos" → `/buscar-vehiculo`. De paso se corrige el texto del bloque de venta para incluir "agencia" (antes solo decía "particular o como concesionaria").
- Nueva página pública `/buscar-vehiculo`: formulario con apellido y nombre, correo, teléfono (obligatorios) y marca, modelo, año (desde/hasta), km (desde/hasta) (opcionales). Al enviar, muestra "¡Muchas gracias! Te contactaremos cuando tengamos novedades.".
- El envío se manda por mail a `soporte@motoresya.com.ar` reutilizando `sendSupportEmail` (mismo mecanismo que "Soporte") — hasta que haya una bandeja propia para esto. Sin `RESEND_API_KEY` configurada, devuelve el mismo error explícito ya usado en Soporte.
- El mismo CTA, en versión compacta (`VehicleRequestCta`), se agrega también en `/catalogo`: debajo de los filtros (sidebar en desktop, arriba de los resultados en mobile) y en el estado de "sin resultados".
- `tsc --noEmit`, `eslint`, `npm run build` limpios; verificado con el servidor de desarrollo (`/`, `/catalogo`, `/buscar-vehiculo` responden 200).

### Changed (2026-08-13) — Separación entre los dos bloques navy del inicio + botón "Contactarme"
- Los bloques "¿Tenés un vehículo para vender?" y "¿Buscás un auto en especial?" quedaban pegados (mismo `bg-navy`, sin separación) — se agrega una franja con el fondo de la página entre ambos.
- El botón de "¿Buscás un auto en especial?" pasa de "Cargar datos" a "Contactarme" — mismo cambio en el CTA compacto del catálogo (`VehicleRequestCta`).
- `tsc --noEmit`, `eslint`, `npm run build` limpios.

### Changed (2026-08-13) — `/buscar-vehiculo`: todos los campos obligatorios, contenido centrado, botón "Volver"
- Marca, modelo, año (desde/hasta) y km (desde/hasta) pasan de opcionales a obligatorios — se sacó "(opcional)" de las etiquetas y se agregó validación server-side (rango de año 1900–año actual+1, "hasta" ≥ "desde" en año y km).
- Botón "Cargar datos" → "Guardar y enviar".
- Título y bajada de la página quedan centrados; se agrega el botón "Volver" (a `/`), que faltaba.
- `tsc --noEmit`, `eslint`, `npm run build` limpios.

### Changed (2026-08-13) — Catálogo en mobile: CTA arriba de "Filtros" y título centrado
- Solo en mobile, la caja "¿Buscás un auto en especial?" pasa a mostrarse arriba del botón "Filtros" (antes quedaba debajo).
- El título "Catálogo" y el conteo de publicaciones quedan centrados en mobile (`lg:text-left` los devuelve a la izquierda en desktop, sin cambios ahí).
- `tsc --noEmit`, `eslint`, `npm run build` limpios.

### Changed (2026-08-13) — Botón "Inicio" en Catálogo
- Se agrega un botón "Volver" con el texto "Inicio" (a `/`) arriba del título — `BackButton` gana un prop `label` opcional (default `"Volver"`) en vez de tenerlo fijo, para poder personalizarlo acá sin tocar el resto de los usos existentes.
- `tsc --noEmit`, `eslint`, `npm run build` limpios.

### Added (2026-08-13) — "Concesionarias | Agencias destacadas" en el inicio
- Nueva sección en el inicio, arriba de "Publicaciones destacadas": combina las concesionarias y agencias con más publicaciones activas (`getFeaturedAgencies`, ya usada en `/concesionarias`), mostrando su foto de portada (`logoUrl`) en un carrusel horizontal con scroll (`overflow-x-auto`, sin autoplay) que arranca alineado a la izquierda — mismo patrón que ya usa la galería de fotos de una publicación para sus miniaturas.
- Nuevo componente `FeaturedAgenciesCarousel` (`src/components/home/`), cada tarjeta enlaza a `/concesionarias/[userId]`. Link "Ver todas" a `/concesionarias`.
- `tsc --noEmit`, `eslint`, `npm run build` limpios; verificado con el servidor de desarrollo (`/`, `/concesionarias` responden 200).

### Changed (2026-08-13) — Carrusel del inicio con el mismo alto que "Publicaciones destacadas" + botón Volver
- Las tarjetas del carrusel "Concesionarias | Agencias destacadas" eran mucho más chicas que las de "Publicaciones destacadas" (solo imagen chica + nombre) — se extrae `AgencyCard` (imagen, tipo, ubicación, cantidad de publicaciones, botón "Ver publicaciones") de `/concesionarias` a un componente compartido (`src/components/vehicles/AgencyCard.tsx`), usado ahora tanto en el listado de `/concesionarias` como en el carrusel del inicio — mismo alto y misma estructura que `VehicleCard`. Cada tarjeta del carrusel ocupa un ancho fijo (`w-64`/`sm:w-72`) dentro de la fila con scroll.
- Se agrega el botón "Volver" (a `/`) en `/concesionarias`, que faltaba.
- `tsc --noEmit`, `eslint`, `npm run build` limpios; verificado con el servidor de desarrollo (`/`, `/concesionarias` responden 200).

### Changed (2026-08-13) — "Publicaciones destacadas" del inicio pasa a carrusel
- La sección "Publicaciones destacadas" del inicio pasa de grilla fija a carrusel horizontal con scroll (`FeaturedListingsCarousel`, mismo patrón que `FeaturedAgenciesCarousel`: `VehicleCard` sin cambios, cada tarjeta en un ancho fijo `w-64`/`sm:w-72`) — solo en el inicio, el catálogo (`/catalogo`) sigue en grilla.
- `tsc --noEmit`, `eslint`, `npm run build` limpios.

### Added (2026-08-14) — Vistas reales por publicación, privadas para el dueño
- Nuevo contador `Listing.viewCount` (ya existía en el schema, sin usar) — ahora se incrementa de verdad, con vistas deduplicadas (una por visitante/día, no una por carga de página) vía una nueva tabla `ListingView` (única por publicación+visitante+día).
- El visitante se identifica por hash (SHA-256): `userId` si está logueado, o IP+user-agent si es anónimo — nunca se guarda la IP en texto plano.
- Se descartan bots/crawlers/previews conocidos (buscadores, WhatsApp/Telegram/Slack, `curl`/clientes HTTP) por user-agent, y nunca cuenta la vista del propio dueño.
- El conteo es privado: solo aparece en "Mis publicaciones" (`OwnerListingCard`, ícono de ojo), nunca en la publicación pública (`/catalogo/[slug]`).
- Registrado con `after()` (`next/server`, primer uso en el proyecto) para no atrasar la respuesta de la página.
- `tsc --noEmit`, `eslint`, `npm run build` limpios. Migración aditiva (`ListingView`) aplicada contra la base real. Verificado con un script desechable contra la base real (dedup mismo visitante/día, visitante distinto cuenta aparte, bot se descarta, usuario logueado cuenta por `userId`) y con el servidor de desarrollo (visita real por `curl` a una publicación — `viewCount` pasó de 0 a 1, fila de dedup creada correctamente) — datos de prueba revertidos al terminar.

### Added (2026-08-12) — "Soporte": reporte de errores por email
- Nueva pantalla `/dashboard/soporte` (link nuevo en el panel "Mi cuenta", debajo de "Cambiar contraseña" — separado del grupo "Anuncios" con su propio divisor): el usuario describe el error y opcionalmente adjunta una captura.
- El mail se arma y envía del lado del servidor con nombre/correo/teléfono del usuario logueado y fecha/hora — el formulario no los pide, así no dependen de que el usuario los tipee. Se manda a `soporte@motoresya.com.ar` con `replyTo` al correo del usuario.
- Nueva integración: [Resend](https://resend.com) (`lib/resend.ts`, `RESEND_API_KEY`/`RESEND_FROM_EMAIL` en `.env`) — sin la API Key todavía no cargada, el formulario muestra un error explícito en vez de fallar en silencio.
- `tsc --noEmit`, `eslint`, `npm run build` limpios (nueva ruta `/dashboard/soporte` registrada).
- Verificado con requests reales: `/dashboard/soporte` sin errores de servidor.
- Pendiente: cargar `RESEND_API_KEY` (cuenta gratis en resend.com) y verificar el dominio `motoresya.com.ar` ahí para que el mail salga realmente a `soporte@motoresya.com.ar` (sin verificar, Resend solo deja mandar desde un remitente de prueba a la propia casilla de la cuenta de Resend).

### Fixed (2026-08-12) — "Volver" ya no entra en loops (siempre navega hacia Inicio)
- `BackButton` usaba `router.back()` (el historial del navegador) — si entrabas a una pantalla hija por un camino distinto al esperado (ej. "Tipo de cuenta" desde el panel "Mi cuenta" estando en otra pantalla), "Volver" podía rebotarte entre dos pantallas en vez de salir. Pasa a recibir un `href` fijo por pantalla (ya no `"use client"`, es un Server Component simple) — cada pantalla tiene un padre determinístico en la jerarquía de la app, así que tocar "Volver" repetidas veces siempre termina en Inicio, sin loops. Actualizados los 13 usos (11 con `BackButton` + 2 que tenían su propio link ad-hoc, `password` y `tipo-cuenta`, ahora unificados al mismo componente y alineados a la derecha como el resto).
- Jerarquía: `anuncios`/`perfil` → Inicio; `publicaciones`/`compra` → `anuncios`; `publicaciones/nueva`/`publicaciones/[id]/editar` → `publicaciones`; `compra/historial` → `compra`; `perfil/tipo-cuenta`/`perfil/password`/`perfil/verificar` → `perfil`; `catalogo/[slug]` → `catalogo`; `concesionarias/[id]` → `concesionarias`.
- `tsc --noEmit`, `eslint`, `npm run build` limpios.

### Changed (2026-08-12) — Filtro de provincia y localidad
- Nuevo filtro "Provincia" (`Select`, lista fija de las 23 provincias + CABA) y "Localidad" (texto libre, `contains` sin distinguir mayúsculas) en el catálogo — desktop y mobile (mismo componente `CatalogFilters`, sin cambios en `CatalogFiltersDrawer`).
- El campo "Provincia" del wizard de publicar (`ListingForm`, paso Ubicación) pasa de texto libre a la misma lista fija — "Localidad" sigue siendo texto libre.
- `tsc --noEmit`, `eslint`, `npm run build` limpios.
- Verificado contra datos reales: `/catalogo?provincia=Buenos+Aires` baja el total de 38 a 18 publicaciones.

### Changed (2026-08-12) — Tipo de vehículo: plural en filtros, singular en el wizard
- `VEHICLE_TYPES` pasa a tener `label` (singular: "Auto", "Camioneta"...) y `labelPlural` (plural: "Autos", "Camionetas"...) — filtros de catálogo, buscador principal y "Explorá por categoría" usan el plural; el wizard de publicar (elegís el tipo de UN vehículo puntual) sigue en singular.
- `tsc --noEmit`, `eslint`, `npm run build` limpios.
- Verificado con requests reales: los 7 tipos aparecen en plural en home y catálogo.

### Changed (2026-08-12) — Header mobile: botón "Vende tu Auto" más chico
- En mobile quedaba más alto (`h-9` fijo) que la altura fluida del logo en pantallas angostas — pasa a `h-7`/texto más chico en mobile, vuelve al tamaño normal desde `md:`.

### Changed (2026-08-12) — Logo en Login/Registro/Recuperar contraseña
- El layout compartido de esas 3 pantallas (`(auth)/layout.tsx`) mostraba el texto "Motoresya" en vez del logo — ahora usa el mismo `<img>` que el header (`logo-v3.svg`, altura fluida con `clamp()`, sin `next/image`).
- `tsc --noEmit`, `eslint`, `npm run build` limpios.
- Verificado con requests reales: `/login` y `/registro` responden 200 y el HTML ya referencia `logo-v3.svg`.

### Fixed (2026-08-12) — Logo: recorte definitivo con detección automática del contenido
- Los 3 recortes anteriores (basados en leer a mano las coordenadas de los `<path>` del SVG) seguían cortando el texto "Motores" por arriba. Método nuevo, mucho más confiable: se renderiza el SVG completo a una imagen grande (sin ningún recorte, viewBox de sobra) y se usa `sharp` (ya instalado, usado por Next.js para optimizar imágenes) para detectar automáticamente el recuadro real del contenido no-blanco (`trim()`), en vez de adivinar coordenadas leyendo el XML. El bounding box resultante se convierte de vuelta a unidades del `viewBox` y se aplica con un margen chico (3%/6%).
- Confirmado visualmente esta vez (se generó y revisó una vista previa PNG antes de aplicar el cambio) — el logo completo "MotoresYA" con el ícono del auto se ve entero, sin cortes.
- Archivo renombrado `logo-v2.svg` → `logo-v3.svg` (de nuevo, para evitar que quede una copia vieja cacheada en el navegador o el CDN).
- `tsc --noEmit`, `eslint`, `npm run build` limpios.
- Verificado con requests reales: `logo-v3.svg` → 200, `logo-v2.svg` viejo → 404, la home ya referencia el archivo nuevo.

### Changed (2026-08-12) — "Tipo de cuenta" se muda a su propia pantalla, "Cambiar contraseña" arriba de "Cerrar sesión"
- El selector de tipo de cuenta (Particular/Agencia/Concesionaria) sale de "Mi perfil" y pasa a `/dashboard/perfil/tipo-cuenta` (nueva página, mismo patrón que "Cambiar contraseña"), con su propio componente `AccountTypeForm` — reusa `updateProfileAction` sin tocar su lógica, mandando como campos ocultos lo que no se edita en esa pantalla (nombre/DNI/teléfono y, si ya era negocio, ciudad/provincia/descripción/dirección/sitio web) para no perderlos.
- Panel "Mi cuenta": nuevo ítem "Tipo de cuenta" (con el valor actual — Particular/Agencia/Concesionaria — pintado en azul debajo del label) justo arriba de "Cambiar contraseña", que a su vez queda inmediatamente arriba de "Cerrar sesión".
- **Ajuste tras el primer pase**: todos los datos de negocio (Nombre de la agencia/concesionaria, CUIT, Ciudad, Provincia, Descripción, Foto de portada, Dirección, Sitio web — antes en "Mi perfil", junto con el selector de tipo) se mudan también a "Tipo de cuenta", no solo el selector — mismos campos, validaciones y diseño de antes, sin cambios. "Mi perfil" queda solo con lo personal (foto de perfil, email, nombre, DNI, teléfono).
- **Reordenado el panel "Mi cuenta"**: "Tipo de cuenta" pasa a estar entre "Mi perfil" y "Administrador de anuncios" (antes estaba más abajo, cerca de "Cambiar contraseña").
- `tsc --noEmit`, `eslint`, `npm run build` limpios (nueva ruta `/dashboard/perfil/tipo-cuenta` registrada).
- Verificado con requests reales: `/dashboard/perfil`, `/dashboard/perfil/tipo-cuenta`, `/dashboard/perfil/password` sin errores de servidor.

### Removed (2026-08-12) — "Método de pago" (ya no tiene función con Mercado Pago real)
- La pantalla `/dashboard/pago` solo guardaba un alias de texto libre, sin conexión real a nada — con Checkout Pro el medio de pago se elige siempre dentro del checkout de Mercado Pago. Se saca por completo: la página, el link en el panel "Mi cuenta" y en la barra lateral del dashboard, el formulario (`AddPaymentMethodForm`), la Server Action (`addPaymentMethodAction`) y las funciones de datos (`getPaymentMethods`/`addPaymentMethod`).
- **Se borra también la tabla `PaymentMethod`** de la base (estaba vacía — confirmado antes de migrar) — migración `DROP TABLE`, no solo se deja de usar.
- `tsc --noEmit`, `eslint`, `npm run build` limpios (`/dashboard/pago` ya no aparece en la lista de rutas).

### Added (2026-08-12) — Comprobante de pago en Historial de pagos
- Cada pago **Aprobado** en Historial de pagos suma un link "Ver comprobante" que abre un resumen propio de Motoresya (no es una factura legal — para eso hace falta facturación electrónica AFIP, un proyecto aparte): operación, comprador (nombre y correo), tipo de anuncio (Publicación/Suscripción/Destacar por día/Combo, derivado del código de plan), la publicación relacionada si corresponde, descripción, fecha, hora, medio de pago, estado y monto. Pagos pendientes/rechazados no tienen comprobante (no hubo una transacción real que respaldar).
- Nuevo componente `ComprobanteButton` (client), nueva consulta `getFullProfile` reusada en `historial/page.tsx` para el nombre/correo del comprador.
- `tsc --noEmit`, `eslint`, `npm run build` limpios.

### Changed (2026-08-12) — Accesos directos a comprar en "Mi cuenta" y Mis compras más visible en mobile
- **Panel "Mi cuenta"**: nueva sección "Anuncios" (con separador y etiqueta) debajo de "Administrador de anuncios", con 3 accesos directos: "Compra individual" (`/dashboard/compra?vista=individual`), "Compra suscripción" (`/dashboard/compra?vista=suscripcion`) y "Método de pago" (se mueve acá abajo, antes estaba suelto en la lista) — evita tener que entrar primero a "Administrador de anuncios" para llegar a comprar.
- **`ComprasTabs` (Pago individual/Suscripciones/Historial de pagos) en mobile**: las 3 opciones pasan a estar siempre visibles, apiladas y del mismo ancho, con un indicador tipo radio button de cuál está activa — antes había que tocar un botón para abrir un panel de filtros aparte y recién ahí ver las opciones. El componente ya no necesita estado de cliente (`"use client"` sacado, queda como Server Component).
- `tsc --noEmit`, `eslint`, `npm run build` limpios.
- Verificado con requests reales: `/dashboard/compra` y `/dashboard/compra?vista=suscripcion` sin errores de servidor.

### Added (2026-08-12) — Integración real de Mercado Pago (Checkout Pro)
Reemplaza la aprobación de pagos instantánea/simulada por el flujo real de Mercado Pago, en los 4 tipos de compra (pack de publicación, suscripción, destacar por día, combo).
- **Flujo de dos fases**: iniciar la compra (`purchaseX()` en `payments.ts`) ahora solo valida (lo mismo que antes, sin relajar nada), crea el `Payment` en `PENDING` y una preferencia de Checkout Pro, y redirige al comprador a Mercado Pago — nada se acredita todavía. La confirmación real llega por webhook (`POST /api/mercadopago/webhook`, nuevo Route Handler), que vuelve a pedirle el pago a la API de Mercado Pago por ID (nunca confía en el body de la notificación) y recién ahí aplica el efecto (`applyPaymentEffect`) — acreditar cupo, escribir la suscripción, destacar la publicación.
- **`Payment.metadata` (nuevo, `Json?`)**: guarda qué aplicar cuando se confirme un pago con líneas o una elección (carrito de "destacar por día", elección del combo) — packs y suscripciones no la necesitan, su efecto sale directo del `Plan`.
- **Un solo `Payment` por checkout en "destacar por día"**: antes se creaba un `Payment` por línea del carrito; ahora es uno solo (una preferencia de Mercado Pago = un pago, aunque tenga varios ítems), con las líneas guardadas en `metadata`.
- **Idempotencia real**: el webhook se apoya en `Payment.providerPaymentId` (`@unique`, agregado en la ronda de seguridad anterior) — dos notificaciones concurrentes para el mismo pago no acreditan dos veces.
- **Validación de firma del webhook**: HMAC-SHA256 sobre el header `x-signature` con `MERCADOPAGO_WEBHOOK_SECRET` (algoritmo documentado por Mercado Pago) — si no está configurado todavía, procesa igual con un warning (mismo criterio que Upstash).
- **Nueva pantalla `/dashboard/compra/resultado`**: adonde vuelve el comprador después de pagar (o no) en Mercado Pago — mensaje según `success`/`pending`/`failure`, sin aplicar nada client-side (la única fuente de verdad es el webhook).
- **UI**: `DestacarPorDiasCarrito`/`FeatureComboWizard` (invocadas directo desde el cliente, no `<form>`) ya no pueden usar `redirect()` server-side — mismo bug ya resuelto en Fase 21 — devuelven la URL de Mercado Pago y el cliente navega con `window.location.href`, primera vez que esta app sale hacia un dominio externo. `purchasePublicationPackAction`/`purchaseSubscriptionAction` (`<form action>`) siguen usando `redirect()`, ahora hacia Mercado Pago.
- Historial de pagos: los estados `Pendiente`/`Rechazado` se traducen en el badge (antes solo mostraba el enum en inglés — recién ahora pueden aparecer de verdad).
- `tsc --noEmit`, `eslint`, `npm run build` limpios.
- Verificado contra la base real: script desechable confirma que `applyPaymentEffect` acredita correctamente los 4 tipos de plan, que un reintento no vuelve a acreditar, y que el rechazo marca `REJECTED` — revertido al terminar. Verificado contra la API real de Mercado Pago (credenciales de prueba): creación de preferencia exitosa (`init_point`/`sandbox_init_point`), el webhook responde 200 ante un ID de pago inexistente y ante tópicos irrelevantes (`merchant_order`), y por `GET` (formato IPN clásico).
- **Fix durante la verificación**: Mercado Pago rechaza la preferencia entera (`auto_return invalid`) si `back_urls.success` no es una URL `https` válida — en desarrollo (`http://localhost`) se arma la preferencia igual pero sin `auto_return` (el comprador vuelve tocando el botón del checkout, no redirige solo).
- **Confirmado de punta a punta contra el deploy real** (`motores-ya-seven.vercel.app`): compra de "Publicación 30 días" ($4.999) con un comprador de prueba de Mercado Pago → pago aprobado → webhook recibido y validado → `Payment` pasó a `APPROVED` → `purchasedPublications` se acreditó. Nota para el futuro: el *vendedor* también tenía que ser una cuenta de prueba (no alcanza con que el comprador lo sea) — se resolvió creando un usuario de prueba con rol vendedor y usando sus credenciales de producción (`APP_USR-`, así lo indica el propio panel de Mercado Pago para una cuenta de prueba) en vez de las credenciales `TEST-` de la cuenta real del desarrollador (ver `ARCHITECTURE.md`).

### Added (2026-08-12) — Auditoría de seguridad integral y correcciones (previo a integrar Mercado Pago)
Auditoría completa del código (3 revisiones en paralelo: sesiones/auth/IDOR, inyección/uploads/DoS/headers, arquitectura de pagos/centralización) antes de sumar la integración real de Mercado Pago. Sin hallazgos en SQL injection (Prisma parametriza todo, sin `$queryRaw`), manipulación de precio desde el cliente (siempre se recalcula server-side desde `Plan`), IDOR (todas las mutaciones ya validaban ownership) ni fuga de secrets/logs. Correcciones aplicadas:
- **Invalidación de sesión al cambiar contraseña**: nuevo `User.sessionVersion`, viaja en el JWT y se revalida contra la base en cada request (`lib/auth.ts`) — una cookie robada deja de servir apenas la víctima cambia su contraseña, en vez de seguir válida hasta que el JWT expire solo (30 días). `ChangePasswordForm` cierra la sesión actual explícitamente después de un cambio exitoso, porque también queda invalidada.
- **Idempotencia de pagos**: `Payment.providerPaymentId` pasa a ser `@unique` (nulos permitidos) — prepara el terreno para cuando el webhook real de Mercado Pago pueda reenviar la misma notificación más de una vez.
- **Límite en el carrito de "Destacar por día"**: `purchaseFeatureByDays` rechaza lotes de más de 30 líneas y deduplica por publicación — antes aceptaba un array de cualquier tamaño desde el cliente.
- **Rate limiting por IP además de por email**: login, registro y recuperar contraseña ahora también limitan por IP (`getClientIp`, vía `x-forwarded-for`) — el límite por email solo no alcanzaba para evitar enumerar cuentas probando un email distinto en cada request.
- **Catálogo público paginado**: `/catalogo` traía TODAS las publicaciones activas sin límite en cada visita/filtro (alcanzable sin sesión, vector de DoS de solo lectura). Ahora pagina "resto del catálogo" (24 por página, con "Anterior"/"Siguiente") y capa "destacados" a 12.
- **Content-Security-Policy + HSTS**: se agregan en producción (`next.config.ts`) — CSP sin nonces (`'unsafe-inline'` en script/style porque Next.js hidrata con inline scripts propios), no se aplican en desarrollo para no romper el Hot Module Reload de Turbopack.
- **`requireSession()` centralizado** (`server/auth-helpers.ts`): reemplaza las ~13 repeticiones manuales de `const session = await auth(); if (!session?.user) redirect("/login")` en `listing.actions.ts`/`payment.actions.ts`/`verification.actions.ts`.
- `tsc --noEmit`, `eslint`, `npm run build` limpios (build de producción, para probar la CSP nueva).
- Verificado contra la base real: `sessionVersion` se incrementa correctamente, `providerPaymentId` duplicado se rechaza (dos `null` sí conviven) — revertido al terminar. Servidor en modo producción + curl: headers CSP/HSTS presentes, `/catalogo` con `?pagina=2`/`pagina=999`/`pagina=abc` responde 200 sin error.
- Pendiente (documentado, no bloqueante): cargar credenciales reales de Upstash; validar el contenido real (magic bytes) de las fotos subidas, no solo el `Content-Type` declarado.

### Added (2026-08-12) — Rate limiting distribuido (Upstash Redis)
- `lib/rate-limit.ts`: si `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` están configuradas, el límite de intentos se aplica sobre Redis (`@upstash/ratelimit`, sliding window) — preciso con cualquier cantidad de instancias serverless. Sin esas variables, sigue cayendo al Map in-memory de antes (mismo comportamiento que había, ahora como fallback explícito).
- `rateLimit()` pasa a ser async (antes era síncrona, porque el limitador in-memory no necesitaba esperar nada) — se actualizaron sus 5 usos (`auth.ts` login, `auth.actions.ts` registro/login/recuperar contraseña, `profile.actions.ts` cambiar contraseña) para hacer `await`.
- Warning en consola al arrancar si en producción no hay credenciales de Upstash configuradas (para notar el fallback in-memory antes de que sea un problema real en un despliegue con más de una instancia).
- Todavía no se cargaron credenciales reales de Upstash en este proyecto — queda listo para cuando se cree la base en upstash.com (documentado en `.env.example`).
- `tsc --noEmit`, `eslint`, `npm run build` limpios.
- Verificado: script desechable confirma que el fallback in-memory sigue permitiendo exactamente `max` intentos y bloqueando el siguiente con `retryAfterMs`, y que la conversión de `windowMs` al formato de duración de Upstash da el resultado esperado (revertido al terminar); requests reales confirmaron que las páginas de login/registro/recuperar siguen respondiendo 200.

### Added (2026-08-12) — Reordenar fotos ya subidas al editar una publicación
- **`ListingForm`**, paso "Fotos" al editar: cada foto ya subida suma flechas (◀ ▶) para moverla de posición; la primera pasa a marcarse con la misma estrella "portada" que ya usaban las fotos nuevas del wizard. Se guarda al toque (server action), sin esperar a "Guardar cambios" — mismo criterio que ya tenía "Quitar foto".
- **Fix relacionado**: `attachListingImages` asignaba `order` empezando siempre en 0 para las fotos nuevas — al editar y agregar más fotos, sus `order` chocaban con los de las que ya estaban (ambos arrancaban en 0). Ahora arranca después del `order` más alto existente.
- Nuevo `reorderListingImages`/`reorderListingImagesAction`, valida ownership y que la lista recibida coincide exactamente con las fotos actuales antes de persistir.
- `tsc --noEmit`, `eslint`, `npm run build` limpios.
- Verificado con un script desechable contra la base real: `attachListingImages` ya no duplica `order` al agregar sobre fotos existentes, reordenar invierte y persiste correctamente, y una lista con un id inválido se rechaza sin tocar la base — revertido al terminar.
- Verificado con requests reales: `/dashboard/publicaciones`, `/dashboard/publicaciones/nueva`, `/catalogo` sin errores de servidor.

### Fixed (2026-08-11) — Total del carrito de "Destacar por día" desincronizado, y ancho de los botones mobile de sub-nav
- **`DestacarPorDiasCarrito`**: si la publicación seleccionada ya estaba agregada al carrito, tocar +/- en el contador de días cambiaba el precio de la vista previa pero no la línea ya cargada — había que sacarla y volver a "Agregar elemento" para que el Total reflejara el cambio. Ahora, si la publicación elegida ya está en el carrito, +/- actualiza esa línea (y el Total) en vivo.
- **`AnunciosSubNav`/`ComprasTabs` (botón mobile)**: los dos botones que abren cada sub-nav ("Mis compras", "Pago individual") medían distinto porque se ajustaban al largo del texto (`inline-flex`). Pasan a `w-full` para que ambos ocupen el mismo ancho.

### Fixed (2026-08-07, noche) — Logo definitivamente cortado (esta vez con la medida real)
- Los dos recortes anteriores del `viewBox` se basaban en una detección incompleta del contenido (solo 2 `clipPath`, no los `<path>` con relleno que dibujan el ícono). Se midió el bounding box real de los 5 `<path>` que dibujan el logo (`x: 268–977`, `y: 568–881`) y se recortó con margen sobre esa medida exacta. El archivo se renombra a `public/logo-v2.svg` (de paso, fuerza a que el navegador/CDN no sirvan una copia vieja en caché con el mismo nombre).

### Changed (2026-08-07, noche) — Ajustes de Administrador de anuncios y Mis compras
- Se revierten los colores por sección del sub-nav (Resumen/Mis publicaciones/Mis compras) — vuelven a un solo color, como estaban antes de la ronda anterior.
- **Resumen**: "Publicaciones disponibles", "Destacados disponibles" y "Suscripción" cambian su link de "Ver" a "Comprar" (van a Mis compras); el resto sigue con "Ver" hacia la pestaña correspondiente de Mis publicaciones.
- **Mis compras**: se saca el layout de 3 columnas simultáneas de la ronda anterior. Ahora tiene su propio sub-nav horizontal (`ComprasTabs`, mismo lenguaje visual que el resto) con 3 opciones: "Pago individual" y "Suscripciones" son pestañas en la misma página (cada una ocupa todo el ancho al elegirla, igual que "Resumen"); "Historial de pagos" pasa a ser una página aparte y más simple (`/dashboard/compra/historial`, con su propio botón Volver) en vez de una sección más dentro de Mis compras.

### Fixed (2026-08-07, noche) — Logo recortado (el ícono del auto quedaba cortado)
- El recorte del `viewBox` del logo de la ronda anterior fue demasiado ajustado — no contemplaba una máscara/gradiente de trama (imagen embebida, transformada con `matrix(...)`) que se extiende más abajo que el resto del contenido, así que el ícono del auto quedaba cortado por debajo. Se volvió a recortar con un margen bastante más generoso (`public/logo.svg`).
- **Header**: el logo pasa a tener un tamaño fluido con `clamp()` (crece/achica junto con el ancho de la ventana en vez de saltar entre 2-3 tamaños fijos por breakpoint) y un padding propio en los 4 lados, separándolo del borde del header.

### Changed (2026-08-07, noche) — Administrador de anuncios: links "Ver", colores por sección y Mis compras reordenado
- **Resumen**: cada tarjeta (Publicaciones disponibles/realizadas/destacadas, Destacados disponibles, Reservadas, Inactivas, Vendidas, Suscripción) suma un link "Ver" a la sección correspondiente (Mis publicaciones filtrada por pestaña, o Mis compras). "Suscripción" pasa a ser la última tarjeta.
- **Sub-nav de Administrador de anuncios**: Resumen/Mis publicaciones/Mis compras tienen cada una su propio color cuando están seleccionadas (azul/verde/naranja, como fichas de carpeta) en vez de las 3 con el mismo azul — más fácil ubicarse de un vistazo.
- **Mis compras**: se saca el selector "Pago individual"/"Suscripciones" (antes solo se veía uno a la vez) — ahora las dos secciones se muestran juntas, al lado de "Historial de pagos", en 3 columnas simétricas con fondo distinto cada una (blanca, celeste, gris). En mobile se apilan con "Suscripciones" al final. Se sacan los contadores de publicaciones y "Anuncios destacados" de esta pantalla (ya están en Resumen).

### Changed (2026-08-07, noche) — Logo real, imagen de fondo del buscador y ajustes visuales
- **Logo**: el texto "Motoresya" del header se reemplaza por el logo (`public/logo.svg`), en mobile y desktop. Se usa `<img>` en vez de `next/image` a propósito: Next.js bloquea SVG en `next/image` salvo que se habilite `dangerouslyAllowSVG` (riesgo de XSS si el SVG trae script embebido), y un vector no gana nada de esa optimización de todos modos — cargado vía `<img>` el navegador tampoco ejecuta scripts embebidos en el SVG (a diferencia de inlinearlo en el DOM), así que es la opción simple y seguirá siendo segura. El archivo original tenía el logo ocupando menos del 15% del canvas (mucho espacio en blanco alrededor) — se recortó el `viewBox` del SVG para que el logo llene su caja en vez de verse diminuto.
- **Buscador principal**: la foto de fondo con el buscador embebido encima (antes solo en mobile) pasa a ser el mismo patrón en desktop — antes ahí la foto se mostraba aparte, al costado del texto/buscador. Nueva foto (`public/hero-bg.jpg`, la de fondo negro con el auto) reemplaza el placeholder de picsum.photos.
- **Buscador — versión mobile**: la tarjeta blanca opaca de los filtros pasaba a tapar casi toda la foto de fondo (por el campo nuevo de "Tipo de vendedor", quedaba más alta). Pasa a ser traslúcida con blur ("vidrio esmerilado") solo en mobile, con las etiquetas en blanco para que se lean sobre la foto oscura — cada campo (Select/Input) sigue siendo blanco sólido como antes, mismo criterio en desktop sin cambios.
- **`Select` (componente centralizado)**: el padding realmente simétrico de la ronda anterior causaba que valores largos como "Todos los vendedores" quedaran cortados antes de tiempo — se volvió a un padding derecho apenas mayor (le deja lugar a la flechita sin tapar el texto). El campo "Tipo de vendedor" del buscador principal también se ensanchó un poco.
- **Header — nav/logo mal centrados**: `Inicio | Catálogo | Concesionarias | Agencias | Blog | Contacto` quedaban corridos hacia la izquierda, y más todavía con sesión iniciada (el bloque de la derecha, "Publicar anuncio" + avatar, pesa más que el logo solo, así que la columna central de una grilla `auto 1fr auto` no queda centrada respecto al header completo). Ahora es `minmax(0,1fr) auto minmax(0,1fr)`: las dos columnas de los costados miden exactamente lo mismo entre sí pase lo que pase en su contenido, así el nav (o el logo, en mobile) queda centrado de verdad, con o sin sesión iniciada.
- **Home**: "Explorá por categoría" pasa a estar antes que "Publicaciones destacadas" (arriba de destacadas, debajo del buscador), en mobile y desktop.

### Fixed (2026-08-07, noche) — Logo gigante, foto de fondo recortada mal y tarjeta mobile poco transparente
- **Logo enorme** (mobile y desktop): el wrapper `<Link>` tenía `h-9`/`h-10` con el `<img>` en `h-full` — el preflight de Tailwind pone `height: auto` en `<img>`, y al no tener el wrapper un ancho propio terminaba usando el tamaño intrínseco del SVG (740×220, mucho más grande que el header) en vez de respetar la altura del contenedor. Se saca el wrapper de la ecuación: la altura fija va directo en el `<img>` (`h-8` desktop, `h-7` mobile), patrón más simple y confiable.
- **Foto de fondo recortada sin mostrar el auto** (mobile): `object-cover` sin posición explícita recorta desde el centro — como el auto de la foto está sobre el lado derecho, en pantallas angostas quedaba afuera del recorte. Se ancla a la derecha (`object-right`) para que el auto se siga viendo a cualquier ancho.
- **Tarjeta de filtros mobile poco transparente**: bajó de `bg-white/15` a `bg-white/8` (y menos blur) para que se note la foto de fondo alrededor de cada campo, no solo un blanco lechoso: además el degradado sobre la foto (mobile) se aclaró (`from-navy/70 via-navy/35 to-navy/5`, antes bastante más oscuro) — sigue alcanzando para que el texto blanco se lea, pero deja ver mucho más el auto.

### Added (2026-08-07, noche) — Modelo de negocio definitivo: Administrador de anuncios, Compra y Suscripciones
Reemplaza el modelo de monetización provisorio (packs 1/5/10/20, "Destacar anuncio" a precio fijo, suscripción de concesionaria sin efecto real) por el definitivo. Ver `ARCHITECTURE.md` para el diseño completo.

- **Fix de base necesario primero**: `Listing.featuredUntil` se escribía al destacar pero nunca se leía en ningún lado — un destacado nunca vencía solo. Nuevo `getEffectiveFeatured()` (mismo patrón que `getEffectiveStatus`), aplicado en catálogo, home, y "Mis publicaciones".
- **Nuevos campos en `User`** (migración aditiva): `subscriptionQuota`/`subscriptionExpiresAt` (cupo temporal de una suscripción activa — se pierde solo si vence sin renovarse) y `pendingFeaturedVouchers` (créditos de "destacar" pendientes de aplicar).
- **Motor de cupo centralizado** (`loadActivationContext` en `server/data/listings.ts`): un solo lugar decide, para cualquier publicación/reactivación, cuánto cupo queda disponible (gratis + comprado + suscripción vigente), hasta cuándo va a vencer (el ciclo normal de 30 días, o la fecha de la suscripción activa — así todos los avisos de una suscripción vencen juntos) y si hay un voucher de destacado pendiente para aplicar. Reemplaza la lógica duplicada que tenían `createListing`/`updateOwnedListing`/`reactivateListing`.
- **Administrador de anuncios** (nuevo ítem del panel "Mi cuenta" y de la barra lateral del dashboard, reemplaza los accesos sueltos a "Mis publicaciones"): 3 secciones bajo un mismo sub-nav (`AnunciosSubNav`, mismo lenguaje visual que las pestañas de Mis publicaciones):
  - **Resumen** (`/dashboard/anuncios`, nueva): publicaciones disponibles/realizadas/destacadas, destacados disponibles, suscripción activa (con vencimiento), reservadas/inactivas/vendidas.
  - **Mis publicaciones** (`/dashboard/publicaciones`, ya existía, ahora con el sub-nav arriba).
  - **Mis compras** (`/dashboard/compra`, nueva) — "Pago individual" | "Suscripciones":
    - Pago individual: **Publicación 30 días** ($4999), **Publicación 30 días + 7 días destacado** ($14999, wizard para elegir aplicarlo a una publicación existente o guardarlo para la próxima que publiques/reactives), **Destacar publicación por día** ($999/día, contador 1 a 1 recortado a los días que le quedan a la publicación, con carrito para destacar varias en una sola compra). Incluye "Anuncios destacados" e "Historial de pagos" (se mudaron desde Método de pago).
    - Suscripciones: 5/10/30 publicaciones por 30 días ($19999/$34999/$49999) — contratar una nueva reemplaza la anterior, no se apilan.
- **Método de pago** (`/dashboard/pago`) se simplifica: solo métodos guardados.
- Se elimina la pantalla dedicada "Destacar anuncio" (`/dashboard/publicaciones/[id]/destacar`) — el botón "Destacar anuncio" de cada publicación ahora abre Mis compras con esa publicación preseleccionada.
- **Panel "Mi cuenta"**: "Publicar anuncio" pasa a ser el primer ítem (ícono relleno en azul, como acceso destacado) y se agrega "Cambiar contraseña" (se saca del formulario de perfil, donde vivía antes).
- **Pausar/Reactivar/Vender ya no navegan** fuera de la pantalla — muestran un modal de confirmación corto ("Publicación pausada/reactivada/vendida", botón Aceptar) y la pantalla se queda donde estaba, así reactivar varias publicaciones seguidas no obliga a volver a entrar a "Inactivas" cada vez.
- **Detalle de publicación, pestaña Contacto**: ahora muestra la foto del vendedor (o el logo, si es agencia/concesionaria) junto a los datos de contacto, con una insignia "Vendedor verificado"/"Sin verificar".
- Verificado con `tsc`/`eslint`/`build` limpios, migración + seed aplicados contra la base real, un script desechable que confirma la aritmética del cupo/suscripción/voucher y el vencimiento efectivo de destacados, y requests reales a todas las rutas nuevas/afectadas sin errores de servidor.

### Changed (2026-08-07, noche) — Header unificado en todo el dashboard + saludo abreviado
- **El dashboard (Mi perfil, Mis publicaciones, Método de pago, etc.) ahora usa el mismo header que el resto del sitio** (`Header`, el mismo componente de las páginas públicas): nav completo, "Publicar anuncio", "Bienvenido, {nombre}" + ícono de cuenta en desktop, menú hamburguesa con "Mi cuenta"/"Cerrar sesión" en mobile. Antes tenía uno propio, más simple (solo logo + nombre + "Cerrar sesión", sin nav ni ícono de cuenta en mobile).
- Como consecuencia, se sacó el avatar duplicado que tenía `DashboardSidebarNav` arriba de la lista de secciones — ya lo provee el header, arriba de todo, igual que en cualquier otra pantalla.
- **"Bienvenido, {nombre}"** ahora muestra solo el primer nombre en vez del nombre completo (ej. "Bienvenido, Emiliano" en vez de "Bienvenido, Emiliano Insaurralde") — no aplica a cuentas de negocio, donde se sigue mostrando el nombre comercial completo (una razón social no tiene "nombre y apellido" para recortar).
- **Panel "Mi cuenta"**: ahora muestra el nombre completo (o la razón social, en Agencia/Concesionaria) debajo del título, con una línea divisoria antes de las opciones — mismo criterio en mobile y desktop.

### Fixed (2026-08-07, noche) — Mis publicaciones: "Publicar vehículo" y "Comprar publicaciones" con el mismo ancho
- Quedaban con distinto ancho (tamaños de botón distintos + "Comprar publicaciones" con más texto). Ahora los dos viven en una columna de ancho fijo compartido (`w-full` dentro de un contenedor común) y usan el mismo tamaño de botón.

### Changed (2026-08-07, noche) — Ajustes de Concesionarias/Agencias, menú mobile y Mis publicaciones
- **Concesionarias/Agencias — mismo ancho que el catálogo**: el contenedor pasa de `max-w-6xl` a `max-w-7xl` y la grilla de tarjetas de `lg:grid-cols-4` a `sm:grid-cols-2 xl:grid-cols-3`, igual que los resultados de vehículos.
- **Destacadas siguen al filtro de tipo, no a los de texto**: antes cualquier filtro (incluidos provincia/localidad) ocultaba las dos secciones de destacadas. Ahora "Concesionarias destacadas" se sigue mostrando si el filtro "Tipo" es Concesionaria (o está vacío), y "Agencias destacadas" si es Agencia (o vacío) — independiente de si hay provincia/localidad cargadas.
- **Menú hamburguesa mobile (logueado)**: "Mi perfil" pasa a llamarse "Mi cuenta" y ahora abre el mismo panel que el ícono de cuenta (antes navegaba a `/dashboard/perfil`, una pantalla distinta al panel). `AccountMenu` expone `open()` por ref para que el hamburguesa pueda disparar el mismo panel sin duplicarlo. "Mi cuenta" y "Cerrar sesión" quedan en negrita más marcada para que se destaquen del resto de los links de navegación.
- **Mis publicaciones — botones y contadores apilados** (desktop y mobile): "Publicar vehículo", "Comprar publicaciones", "Publicaciones realizadas" y "Publicaciones disponibles" pasan de una fila con salto de línea desprolijo a una columna, cada uno en su propia línea.
- **Mis publicaciones — pestañas a ancho completo en desktop**: Activas/Destacadas/Reservadas/Inactivas/Vendidas ahora se reparten todo el ancho disponible (`flex-1` cada una) en vez de quedar pegadas a la izquierda.
- **Mis publicaciones — selector de pestañas en mobile**: la barra horizontal (que había que desplazar) se reemplaza por un botón "Filtros" (mismo ícono que el catálogo) que abre un panel con las opciones una debajo de otra — se agrega "Todos" al principio de la lista — y tocar una aplica al toque, sin botón "Aplicar".

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
