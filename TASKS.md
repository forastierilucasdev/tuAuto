# TASKS — Progreso de desarrollo (tuAuto)

Checklist de construcción del proyecto, agrupado por fases. Se actualiza a medida que se completa cada tarea.

> Convención: `[x]` hecho · `[ ]` pendiente · `[~]` en progreso

## Fase 0 — Scaffold y base del proyecto
- [x] Proyecto Next.js 16 (TypeScript, App Router, Tailwind v4, ESLint)
- [x] Instalación de dependencias: Prisma 7 + adapter-pg, Auth.js v5, zod, bcryptjs, @supabase/supabase-js, lucide-react
- [x] `.env.example` documentado
- [x] `TASKS.md`, `CHANGELOG.md`, `ARCHITECTURE.md`, `ERRORES.md` creados
- [x] Prisma inicializado (`prisma.config.ts`, driver adapter `@prisma/adapter-pg` + `pg`)
- [x] Credenciales reales de Supabase cargadas en `.env`

## Fase 1 — Design system y layout público
- [x] Tokens de diseño (colores marca, espaciados, sombras) en `globals.css`
- [x] Componentes UI reutilizables (`Button`, `Input`, `Select`, `Textarea`, `Label`, `Card`, `Badge`)
- [x] Header con navegación + botón "Vende tu Auto"
- [x] Footer
- [x] Home: hero + buscador Marca/Modelo/Año + destacados + categorías
- [x] Contacto (formulario maqueta) y Blog (contenido de muestra)
- [ ] Página Login / Registro (se construye en Fase 2 junto con Auth.js)
- [ ] Página Catálogo (se construye en Fase 3)

## Fase 2 — Modelo de datos y autenticación
- [x] Schema Prisma completo (usuarios, publicaciones, taxonomía, pagos)
- [x] Prisma Client generado (`prisma generate`) con driver adapter `@prisma/adapter-pg`
- [x] Migración inicial aplicada contra Supabase Postgres (`20260805103908_init`)
- [x] Script de seed listo y ejecutado contra la base real: 5 usuarios, ~20 marcas/modelos, 33 publicaciones
- [x] Auth.js configurado (Credentials + JWT)
- [x] Registro: Vendedor particular
- [x] Registro: Concesionaria/agencia
- [x] Login
- [x] Proxy (`proxy.ts`) protegiendo rutas de `/dashboard` (verificado: redirige a `/login?callbackUrl=...`)
- [x] Rate limiting en login/registro (in-memory)
- [x] Prueba end-to-end contra datos reales (base migrada y poblada, lecturas verificadas)

## Fase 3 — Catálogo público
- [x] Listado de catálogo (destacados primero, luego el resto)
- [x] Filtro en cascada: Tipo → Marca → Modelo → Año
- [x] Filtros de resultado: Precio (ARS/USD, una moneda a la vez) y Kilometraje
- [x] Página de detalle de publicación (con galería y botón de contacto por WhatsApp)
- [x] Página "Concesionarias" (directorio + perfil público con sus publicaciones)
- [x] Home conectado a publicaciones destacadas reales (ya no usa datos mock)
- [x] Verificado contra datos reales: home muestra destacados reales, catálogo cuenta 29 publicaciones ACTIVE (de 33 sembradas), directorio de concesionarias muestra las 3 agencias

## Fase 4 — Dashboard de usuario
- [x] Gestión de datos del perfil (particular y agencia)
- [x] "Mis publicaciones": pestañas Destacadas / Activas / Inactivas
- [x] Publicar nuevo anuncio (cascada Tipo→Marca→Modelo→Año + carga de fotos a Supabase Storage)
- [x] Editar publicación + marcar como vendido / reactivar vencida
- [x] Verificación: rutas de dashboard protegidas (redirigen a `/login` sin sesión)
- [ ] Prueba manual en navegador del flujo completo (registro → login → publicar con foto → destacar) — recomendado antes de dar por cerrado el prototipo

## Fase 5 — Pagos y cierre
- [x] Sección "Método de pago" (alias de pago, planes destacar/suscripción, historial — aprobación simulada instantánea)
- [x] Efecto real del pago mock: destacar publicación (`featured` + `featuredUntil`) al "pagar"
- [x] Revisión de seguridad final (headers, rate limit, fuga de `passwordHash` auditada, whitelist de uploads, SQL injection auditado — sin `$queryRaw`)
- [x] `npm run build` sin errores (TypeScript + producción)
- [x] Documentación final actualizada (`CHANGELOG.md`, `ARCHITECTURE.md`, `ERRORES.md`)

## Fase 6 — Rediseño de búsqueda, publicación y detalle (solicitado por el usuario)
- [x] Tercer tipo de cuenta: Particular / Agencia / Concesionaria (registro, perfil, badges)
- [x] Nuevos campos de publicación: versión, condición (Nuevo/Usado), transmisión (Mecánica/Asistida), checks (negociable/permuta/financiamiento), dirección de contacto; observaciones (antes "descripción") ahora opcional
- [x] Título siempre autogenerado (Marca + Modelo + Año), ya no es texto libre
- [x] Buscador principal (home) con cascada completa Tipo→Marca→Modelo→Año + Condición
- [x] Filtros de catálogo: se agregó Condición
- [x] Hook reutilizable `useVehicleTaxonomy` (cascada Tipo→Marca→Modelo→Año, usado por buscador, filtros y formulario de publicar)
- [x] Tarjetas de resultado rediseñadas: ícono de Km, Ubicación, Tipo de vendedor, Condición + Año
- [x] Detalle de publicación: galería con lightbox modal (click para expandir, cruz para cerrar, flechas), pestañas verticales reutilizables (`VerticalTabs`) para Datos principales / Precio / Ubicación / Observaciones / Contacto, botón de WhatsApp con texto pre-armado
- [x] Formulario de publicar reconstruido como wizard multi-paso (Datos → Precio → Ubicación → Contacto → Fotos → Observaciones → Publicar/Guardar), con selección de foto de portada
- [x] Todo responsive con flexbox (`flex-col` en mobile → `flex-row` en desktop)
- [x] Verificado contra datos reales: filtro Condición=Nuevo devuelve exactamente 3 publicaciones (las 3 sembradas como 0km), detalle de publicación renderiza pestañas y WhatsApp correctamente
- [ ] Prueba manual en navegador del wizard de publicar completo (los 7 pasos) y de la edición de una publicación existente

## Fase 7 — Rebranding, sesión persistente, mobile UX, perfil (solicitado por el usuario)
- [x] Proyecto renombrado a "Motoresya" (nombre en la app, metadata, WhatsApp, textos, `package.json`)
- [x] Sesión persistente vía `SessionProvider` + `useSession()` en el Header (ya no se ve "desactualizado" al volver atrás)
- [x] Botón "Vende tu Auto"/"Mi cuenta" visible junto al menú hamburguesa en mobile
- [x] Hero del home: foto de fondo con buscador superpuesto en mobile; separados en desktop
- [x] Catálogo mobile: resultados primero + botón "Filtros" que abre un panel deslizable desde la izquierda (cruz o el mismo botón para cerrar)
- [x] Login: mostrar/ocultar contraseña (`PasswordInput`, reutilizado en registro) + "¿Olvidaste tu contraseña?" (mock, sin envío de email real)
- [x] Mi perfil: subir foto de perfil, centrada y recortada dentro de un círculo (bucket nuevo `avatars` en Supabase Storage)
- [x] Verificado: build de producción limpio, `/`, `/catalogo`, `/login`, `/registro`, `/recuperar-password` responden 200 contra Supabase real
- [ ] Prueba manual en navegador: drawer de filtros en mobile, hero mobile, subir avatar y verificar que se vea centrado, mostrar/ocultar contraseña

## Fase 8 — Bugs reportados por el usuario tras probar en el celular
- [x] Dashboard sin navegación visible en mobile (no se podía llegar a "Mi perfil" logueado) → `DashboardMobileNav`
- [x] Botón X del visor de fotos ampliado no cerraba en algunos casos (faltaba `z-index`)
- [x] Verificado con login real (script contra `/api/auth/callback/credentials`) contra Supabase: `/dashboard/perfil` devuelve el nav mobile, el formulario y la carga de avatar

## Fase 9 — Diseño de la sesión logueada (solicitado por el usuario)
- [x] `SlideOverPanel` genérico (izq/der) extraído y reutilizado por `CatalogFiltersDrawer` y el nuevo `AccountMenu`
- [x] Header logueado: botón "Publicar anuncio" (centrado en mobile vía grid de 3 columnas, a la derecha en desktop) en vez de "Vende tu Auto"
- [x] `AccountMenu`: foto de perfil o iniciales + "Mi perfil", abre panel desde la derecha con el `ProfileForm` reutilizado (mismo componente que la página completa)
- [x] DNI editable en el perfil (antes solo lectura), con validación y chequeo de unicidad
- [x] Pantalla real de "Cambiar contraseña" (`/dashboard/perfil/password`) para usuarios logueados, distinta del mock de "recuperar contraseña"
- [x] Primitivas de validación centralizadas en `lib/validations/shared.ts`
- [x] Verificado con login real contra Supabase: DNI editable, link a cambiar contraseña, ambas pantallas nuevas responden 200
- [x] Corregido tras feedback del usuario: el panel quedaba encerrado en el header (bug de `backdrop-blur` + `fixed`) → Portal a `document.body`
- [x] Corregido tras feedback: el panel ahora es un menú de navegación (Mi perfil / Mis publicaciones / Método de pago), no el formulario embebido — desliza de izquierda a derecha, ícono a la izquierda
- [x] Botón "Volver" a la derecha en las 3 pantallas de cuenta
- [x] Tipo de cuenta editable desde "Mi perfil" (Particular ⇄ Agencia/Concesionaria), con creación/baja del perfil de negocio según corresponda
- [x] Verificado con login real (particular y agencia) contra Supabase: toggle de tipo de cuenta, campo CUIT condicional, botones Volver
- [ ] Prueba manual en navegador: animación del panel, tocar cada opción del menú, cambiar tipo de cuenta y confirmar que el formulario se adapta

## Fase 10 — Ajustes de headers, botones "Volver" y wizard de publicación (solicitado por el usuario)
- [x] Sidebar desktop del dashboard: avatar más grande (`md`) y centrado arriba de la lista de secciones
- [x] "Resumen" renombrado a "Mi perfil" en el nav del dashboard, apuntando a `/dashboard/perfil`
- [x] Header del dashboard mobile reordenado: avatar / logo centrado / Cerrar sesión
- [x] `AccountMenu`: se agregaron "Publicar anuncio" y "Cerrar sesión" al panel deslizable
- [x] Header público logueado reordenado: avatar / logo centrado / hamburguesa; "Publicar anuncio" pasó a un botón propio debajo del header (mobile)
- [x] "Mis publicaciones": botón "Volver" separado de "Publicar vehículo" (Volver arriba a la derecha, Publicar vehículo en su propia fila)
- [x] "Publicar vehículo": se agregó el botón "Volver" que faltaba
- [x] Wizard de publicar (`ListingForm`): barra de progreso con círculos numerados + línea de relleno, subtítulo centrado con el paso activo, cartel "Datos pendientes de carga" con campos en rojo y links directos al paso correspondiente en el último paso
- [x] `tsc --noEmit`, `eslint`, `npm run build` limpios
- [x] Verificado con login real contra Supabase: `/`, `/dashboard`, `/dashboard/publicaciones`, `/dashboard/publicaciones/nueva`, `/dashboard/perfil` responden 200 con el contenido esperado
- [ ] Prueba manual en navegador: animación y orden de los headers, barra de progreso del wizard, cartel de campos faltantes en rojo

## Fase 11 — Estados de publicación, verificación de perfil y destacar por anuncio (solicitado por el usuario)
- [x] Corregido bug crítico: el wizard publicaba automáticamente sin tocar "Publicar" (submit implícito del navegador en pasos con un solo campo de texto)
- [x] Estados nuevos `RESERVADA` y `PAUSADA` en el schema, con diálogo de motivo al pausar y aclaración de qué implica cada uno
- [x] Reactivar (reservada/pausada/vencida) vía "¿conservar tus datos? Sí, editar" → reactiva automáticamente al guardar la edición; vendida no se puede reactivar
- [x] Eliminar publicación (cualquier estado) con confirmación
- [x] Contador `activationCount` por usuario, incrementado cada vez que una publicación pasa a Activa, visible en "Mis publicaciones" (todavía sin uso para bloquear cupos)
- [x] Modal "Anuncio publicado" (Ver / cerrar) tras publicar; publicaciones activas/reservadas clickeables desde "Mis publicaciones"
- [x] Pantalla dedicada "Destacar anuncio" por publicación (beneficios, costo $9.999 provisorio, botón Pagar), reutiliza el mock de pago existente
- [x] Verificación de perfil: modelo `VerificationRequest`, bucket privado `verifications` en Supabase Storage (nunca público, a diferencia de listing-images/avatars), formulario con foto de DNI frente/dorso, mensaje de confirmación
- [x] `tsc --noEmit`, `eslint`, `npm run build` limpios
- [x] Verificado con login real contra Supabase: Mi perfil, Verificar perfil, Mis publicaciones (contador visible), pantalla Destacar de una publicación real, Editar
- [ ] Prueba manual en navegador: diálogo de pausar (Reservada/Pausada), reactivar, eliminar, modal de anuncio publicado, pantalla de destacar, subir fotos de DNI

## Fase 12 — Sesión post-login, header logueado/deslogueado y botón flotante (solicitado por el usuario)
- [x] Corregido bug crítico: `SessionProvider` no se enteraba del login/registro (sign-in disparado desde el servidor) hasta un refresh manual — ahora `signIn()` se dispara desde el cliente en `LoginForm`/`RegisterForm`
- [x] Redirección post-login a "/" por defecto, respetando `callbackUrl` saneado si venías de una pantalla protegida
- [x] `/dashboard` (raíz, la vieja pantalla "Resumen") ahora redirige a `/dashboard/perfil` en vez de mostrarse
- [x] Header: "Ingresar" al lado de Contacto en desktop, "Iniciar sesión" en el menú mobile de 3 líneas
- [x] "Publicar anuncio" en mobile: botón flotante que aparece al scrollear, dura 20s visible y desaparece si la pantalla queda quieta
- [x] `tsc --noEmit`, `eslint`, `npm run build` limpios
- [x] Verificado con requests reales: `/dashboard` sin sesión rebota a `/login?callbackUrl=...`, `/dashboard` con sesión rebota a `/dashboard/perfil`, `/` muestra "Ingresar" deslogueado
- [ ] Prueba manual en navegador (imprescindible acá): loguearse y confirmar que el header queda actualizado sin refrescar, tocar el logo después de loguearse, y el comportamiento del botón flotante al scrollear/quedarse quieto — todo esto depende de JS de cliente y no se puede verificar con curl

## Fase 13 — Confirmación de publicar/borrador, error de producción y ajustes de Mis publicaciones (solicitado por el usuario)
- [x] Corregido bug crítico de producción: `serverActions.bodySizeLimit` (default 1MB) cortaba la request al publicar con fotos reales — subido a 32MB
- [x] Confirmación "¿Desea publicar tu anuncio?" (Sí, publicar / No, guardar como borrador) en el último paso del wizard de creación
- [x] Estado `DRAFT` implementado de punta a punta: no incrementa el contador, aparece en "Inactivas", se publica editando y guardando
- [x] "Bienvenido, {nombre}" al lado del avatar en el header público (desktop) — nombre comercial para Agencia/Concesionaria
- [x] Botón "Cancelar edición" en el wizard al editar una publicación existente
- [x] Editar/Eliminar ocultos para publicaciones vendidas
- [x] Contador renombrado a "Publicaciones realizadas"
- [x] Aclaración "Solo serán visibles las opciones marcadas" en el checklist de precio
- [x] `tsc --noEmit`, `eslint`, `npm run build` limpios
- [x] Verificado: creación de un borrador a nivel de datos (no incrementa el contador, cae en el grupo correcto), páginas de Mis publicaciones/Editar responden 200 con los textos esperados
- [ ] Prueba manual en navegador: publicar con varias fotos reales (el bug de 1MB solo se manifestaba con archivos de tamaño real, no se puede reproducir con mocks livianos), diálogo de confirmación al publicar, botón "Cancelar edición"

## Fase 14 — Rediseño del ciclo de vida de publicaciones: 5 pestañas, vencimiento, cupo y packs (solicitado por el usuario)
- [x] 5 pestañas en Mis publicaciones: Activas, Destacadas, Reservadas, Inactivas (Borrador/Pausada/Vencida), Vendidas
- [x] Vendida es de solo lectura (sin Editar/Reactivar/Eliminar)
- [x] Vencimiento a los 30 días calculado al leer (sin cron), aplicado a catálogo público, badges y elegibilidad de reactivación
- [x] Cupo real de 10 publicaciones gratuitas + `purchasedPublications`, bloqueando publicar/reactivar en 0 disponibles
- [x] 4 packs de publicaciones (1/5/10/20, recomendado 20 para negocio) en nueva sección "Comprar publicaciones"
- [x] Sección "Anuncios destacados" (lista de destacadas del usuario) reemplaza la vieja tarjeta de destacar en Método de pago
- [x] Wizard: paso "Datos principales" también en edición, con tipo/marca/modelo/año bloqueados pero versión/transmisión/condición/km editables (antes inaccesibles al editar)
- [x] Diálogo unificado "¿Desea publicar? Sí, revisar / No, publicar" para crear, reactivar y publicar un borrador; "Guardar como borrador" como botón aparte sin diálogo
- [x] Mensaje "Tu anuncio fue publicado con éxito" con botón "Ver publicación", en creación y en reactivación
- [x] Indicador de pasos: círculo activo relleno con el color de marca
- [x] Botones de cada tarjeta (Editar/Marcar vendido/Pausar/Reactivar/Eliminar) alineados en grilla simétrica de 2 columnas
- [x] Contador de días para vencer + fecha de publicación en cada tarjeta (privado, solo el dueño)
- [x] Botón "Volver" en el detalle del catálogo; el dueño puede abrir su publicación en cualquier estado desde Mis publicaciones
- [x] `tsc --noEmit`, `eslint`, `npm run build` limpios
- [x] Verificado con login real contra Supabase: 5 pestañas, cupo/packs visibles, paso "Datos" bloqueado en edición, detalle de catálogo con Volver, pantalla de destacar
- [ ] Prueba manual en navegador (imprescindible): probar el flujo completo pausar→reactivar, publicar hasta agotar el cupo y comprar un pack, guardar un borrador y publicarlo después, y confirmar que el diálogo "Sí, revisar/No, publicar" se ve bien

## Fase 15 — Bugs reportados tras probar el rediseño de publicaciones (solicitado por el usuario)
- [x] Corregido bug crítico: "Pausar"/"Reservar" no cambiaba el estado (carrera entre cerrar el modal y el submit del Server Action)
- [x] Corregido: publicaciones vendidas (y cualquier estado) no se podían abrir desde "Mis publicaciones"
- [x] Corregido: "Volver" después de "Ver publicación" mostraba de nuevo el mensaje de éxito (URL stale en el historial)
- [x] "Volver" reordenado arriba de todo (fila propia), después el título, después el contenido — mismo orden en mobile y desktop, en catálogo, Mi perfil, Mis publicaciones, Publicar, Editar, Destacar, Verificar perfil y Método de pago
- [x] Botones del último paso del wizard ya no desbordan en mobile (se apilan en columna)
- [x] Eliminar fotos ya subidas al editar una publicación (con mínimo de una foto)
- [x] `tsc --noEmit`, `eslint`, `npm run build` limpios
- [x] Verificado con login real contra Supabase: páginas responden 200, orden Volver/título confirmado en el HTML; el fix de Pausar se confirmó leyendo el código (no reproducible por curl, ver ERRORES.md)
- [ ] Prueba manual en navegador (imprescindible): pausar/reservar una publicación y confirmar que cambia de estado, publicar y volver desde "Ver publicación", eliminar una foto al editar, y revisar que los botones no desborden en el celular

## Fase 16 — Reactivar sin editar y fecha de venta (solicitado por el usuario)
- [x] Nueva acción `reactivateListingAction`/`reactivateListing`: reactiva directo (sin pasar por edición), respeta el cupo de publicaciones
- [x] Modal de reactivar rediseñado: "¿Querés editar los datos de la publicación antes de volver a publicarla?" con Sí, editar / No, publicar / Cancelar — igual para Reservada, Pausada y Vencida
- [x] Publicación vendida muestra "Vendida el dd/mm/aaaa" en vez de "Publicado el... Vence en N días"
- [x] `tsc --noEmit`, `eslint`, `npm run build` limpios
- [x] Verificado contra la base real: reactivar sin editar cambia el estado y suma al contador de activaciones; `soldAt` se guarda al marcar vendida
- [ ] Prueba manual en navegador: los tres botones del diálogo de reactivar, y que la tarjeta de una publicación vendida muestre la fecha de venta

## Fase 17 — Modal de confirmación al vender, con datos opcionales (solicitado por el usuario)
- [x] Nuevos campos en `Listing`: `buyerInfo`, `realSalePrice`, `saleConditions` (todos opcionales, privados)
- [x] "Marcar vendido" abre un modal de confirmación en vez de cambiar el estado con un click (evita marcarla vendida por error)
- [x] Campos opcionales en el modal: fecha de venta (precargada con hoy), datos del comprador, precio real de venta, condiciones
- [x] La tarjeta muestra el precio real de venta junto a "Vendida el ..." cuando está cargado
- [x] `tsc --noEmit`, `eslint`, `npm run build` limpios
- [x] Verificado contra la base real: los 4 campos se guardan y se leen correctamente
- [ ] Prueba manual en navegador: completar el modal de venta con y sin los campos opcionales, confirmar que no se puede vender por accidente

## Fase 18 — Corrección del contador de publicaciones y botones centralizados (solicitado por el usuario)
- [x] Separados `activationCount` ("realizadas", una vez por publicación) y `quotaConsumed` (cupo real, suma también al reactivar una vencida)
- [x] Reactivar desde Reservada/Pausada es gratis (no consume cupo, no pide cupo disponible); desde Vencida sí consume cupo pero no vuelve a contar como "realizada"
- [x] Recalculados ambos contadores para las cuentas existentes (estaban inflados por el bug)
- [x] Variantes centralizadas `outline-primary`/`outline-success`/`outline-danger` en `buttonVariants`, aplicadas al diálogo de reactivar (Sí editar=azul, No publicar=verde, Cancelar=rojo, los tres con borde)
- [x] `tsc --noEmit`, `eslint`, `npm run build` limpios
- [x] Verificado contra la base real: Reservada/Pausada→Reactivar no cambia ningún contador; Vencida→Reactivar suma +1 solo a `quotaConsumed`
- [ ] Prueba manual en navegador: confirmar que "Publicaciones realizadas"/"disponibles" ya no suben con cada pausar/reactivar, y que los 3 botones del diálogo se ven con los colores correctos

## Fase 19 — Segunda pasada de botones: relleno sólido y bordes faltantes (solicitado por el usuario)
- [x] Nueva variante centralizada `success` (verde, relleno + letra blanca); se reutilizan `primary` (azul) y `destructive` (rojo) para el trío de decisión, en vez de las variantes "outline-color" de la ronda anterior
- [x] "No, publicar" renombrado a "Publicar" en todos lados (reactivar y confirmar publicación)
- [x] Diálogo "¿Desea publicar?" de `ListingForm`: "Sí, revisar" pasa a azul, "Publicar" a verde (antes quedaba azul por defecto sin querer)
- [x] Variante `outline` reforzada (borde más oscuro y grueso) en un solo lugar, beneficia a todos los botones que ya la usaban
- [x] Todos los botones que usaban `ghost` (sin borde) pasan a `outline`: Pausar, Marcar vendido, Reactivar, Eliminar, Cerrar, Cancelar (x2), Cancelar edición — `ghost` queda sin usos en la app
- [x] `tsc --noEmit`, `eslint`, `npm run build` limpios
- [ ] Prueba manual en navegador (imprescindible, es 100% visual): confirmar los colores y bordes en cada pantalla mencionada

## Fase 20 — Header desktop, menú mobile, Volver en Mis publicaciones y campos por tipo de vehículo (solicitado por el usuario)
- [x] Desktop: logo a la izquierda, avatar+saludo a la derecha del todo (después de "Publicar anuncio"), panel abre desde la derecha (`AccountMenu` con `panelSide`)
- [x] Menú de 3 líneas (mobile, con sesión iniciada): línea divisoria + "Mi perfil" + "Cerrar sesión" debajo de "Contacto"
- [x] "Volver" en Mis publicaciones ya no recorre cada pestaña (tabs con `replace` en vez de apilar historial)
- [x] Wizard, catálogo (detalle/tarjetas/filtros) y Mis publicaciones se adaptan por tipo de vehículo: Kilometraje (Auto/Camioneta/Monopatín), Horas de uso (Lancha/Barco), ninguno (Moto/Bicicleta), Transmisión (solo Auto/Camioneta)
- [x] `tsc --noEmit`, `eslint`, `npm run build` limpios
- [x] Verificado con requests reales: detalle de lancha muestra "Horas de uso", detalle de moto no muestra ni Km ni Horas ni Transmisión, detalle de auto muestra "Km"
- [ ] Prueba manual en navegador (imprescindible, depende de `useSession()` client-side): posición del avatar y lado del panel en desktop, contenido del menú mobile logueado, y que "Volver" en Mis publicaciones salga de la pantalla en un solo toque

## Fase 21 — Botón "Publicar" trabado en "Publicando..." al reactivar (solicitado por el usuario)
- [x] Diagnóstico: `redirect()` server-side dentro de una Server Action invocada directo desde el cliente (no `<form action>`) no resuelve la promesa del lado del cliente
- [x] `reactivateListingAction` devuelve `{ slug }` en vez de redirigir
- [x] `OwnerListingCard` navega con `router.push()` tras recibir el `slug` (mismo patrón que `PublishedListingModal`)
- [x] `tsc --noEmit`, `eslint`, `npm run build` limpios
- [ ] Prueba manual en navegador (imprescindible, es un bug de navegación client-side): reactivar una publicación pausada/reservada y confirmar que "Publicar" navega a Mis publicaciones sin quedar trabado

## Fase 22 — Filtro de vendedor y buscador de concesionarias (solicitado por el usuario)
- [x] Filtro "Tipo de vendedor" (Particular/Agencia/Concesionaria) en el buscador principal y en el panel de filtros del catálogo, aplicado en `buildWhere`
- [x] `/concesionarias` rediseñada: buscador por provincia y localidad, sección "Concesionarias destacadas" (top 4 por publicaciones visibles), tarjetas con el mismo formato que los resultados de vehículos
- [x] `/concesionarias/[id]`: foto de portada, dirección y sitio web
- [x] Sección "Datos comerciales" en Mi perfil (Agencia/Concesionaria): foto de portada, dirección, sitio web — nuevo bucket `agency-logos`
- [x] Contador de publicaciones de la tarjeta de concesionaria usa el mismo criterio de visibilidad que el listado real (antes solo contaba `ACTIVE`)
- [x] `tsc --noEmit`, `eslint`, `npm run build` limpios
- [x] Verificado con requests reales: `/concesionarias` (destacadas + listado + filtro sin resultados), `/concesionarias/[id]`, `/catalogo?vendedor=...` — todo 200, sin errores de servidor
- [ ] Prueba manual en navegador (imprescindible, depende de `useSession()`/formularios client-side): carga de foto de portada en Mi perfil, buscador de concesionarias, y el nuevo filtro de vendedor en el buscador principal y el catálogo

## Fase 23 — Padding simétrico en Select y unificación del panel de filtros de Concesionarias/Agencias (solicitado por el usuario)
- [x] `Select` (componente centralizado): padding simétrico `px-3` en los dos lados (antes `px-3 pr-9`, valor corrido a la izquierda); flechita ahora se superpone sin reservar espacio, con `overflow-hidden`/`text-ellipsis` para valores largos
- [x] `/concesionarias` usa el mismo patrón de filtros que el catálogo: sidebar fija en desktop + panel deslizable en mobile (`AgencyFilters`/`AgencyFiltersDrawer`, mismo contenedor visual que `CatalogFilters`)
- [x] Nuevo filtro "Tipo" (Concesionarias/Agencias/Todos); título de la sección de resultados adaptado ("Todas las concesionarias" / "Todas las agencias" / "Todos los resultados")
- [x] "Concesionarias destacadas" y "Agencias destacadas" como secciones separadas, visibles solo sin filtros activos, reutilizando `getFeaturedAgencies(accountType)` sin duplicar lógica
- [x] Tarjeta de cada agencia/concesionaria indica su tipo
- [x] Nav "Concesionarias" → "Concesionarias | Agencias"; título de la página → "Concesionarias y Agencias"
- [x] `tsc --noEmit`, `eslint`, `npm run build` limpios
- [x] Verificado con requests reales: sin filtros (destacadas x2 + "Todos los resultados"), `tipo=CONCESIONARIA`, `tipo=AGENCIA`, filtro sin resultados, y que el `Select` renderizado ya no tiene `pr-9` — todo 200, sin errores de servidor
- [ ] Prueba manual en navegador (imprescindible, es mayormente visual): padding simétrico en los selects de toda la app, el panel de filtros de Concesionarias/Agencias en desktop y mobile, y que las tarjetas y encabezados cambien correctamente al tocar cada opción del filtro "Tipo"

## Fase 24 — Ajustes de Concesionarias/Agencias, menú mobile y Mis publicaciones (solicitado por el usuario)
- [x] Concesionarias/Agencias: mismo ancho de tarjetas y contenedor que el catálogo (`max-w-7xl`, `xl:grid-cols-3`)
- [x] Destacadas (Concesionarias/Agencias) siguen al filtro "Tipo", no a los filtros de texto provincia/localidad
- [x] Menú hamburguesa mobile: "Mi perfil" → "Mi cuenta", abre el mismo panel que el ícono de cuenta (`AccountMenu` con ref); "Mi cuenta" y "Cerrar sesión" en negrita más marcada
- [x] Mis publicaciones: botones (Publicar vehículo, Comprar publicaciones) y contadores (realizadas, disponibles) apilados en columna, desktop y mobile
- [x] Mis publicaciones: pestañas a ancho completo en desktop
- [x] Mis publicaciones: selector de pestañas en mobile vía botón "Filtros" + panel deslizable con "Todos" + las 5 pestañas, aplica al toque
- [x] `tsc --noEmit`, `eslint`, `npm run build` limpios
- [x] Verificado con requests reales: ancho/grilla de `/concesionarias`, destacadas correctas en `tipo=CONCESIONARIA`/`tipo=AGENCIA`, `/dashboard/publicaciones` sin error de servidor (redirige a login sin sesión, esperado) — todo sin 500
- [ ] Prueba manual en navegador (imprescindible, es mayormente visual/interactivo y depende de `useSession()`): menú hamburguesa mobile logueado, panel "Mi cuenta" abriendo desde ahí, y el nuevo selector de pestañas de Mis publicaciones en mobile

## Fase 25 — "Publicar vehículo" y "Comprar publicaciones" con el mismo ancho (solicitado por el usuario)
- [x] Ambos botones comparten el mismo ancho (columna común `w-full`) y el mismo tamaño
- [x] `tsc --noEmit`, `eslint`, `npm run build` limpios
- [ ] Prueba manual en navegador (visual)

## Fase 26 — Header unificado en el dashboard y saludo abreviado (solicitado por el usuario)
- [x] Dashboard (`Mi perfil`, `Mis publicaciones`, `Método de pago`, etc.) usa el mismo `Header` que las páginas públicas — nav, "Publicar anuncio", "Bienvenido, {nombre}" + ícono de cuenta en desktop, hamburguesa con "Mi cuenta"/"Cerrar sesión" en mobile
- [x] Avatar duplicado sacado de `DashboardSidebarNav` (ya lo provee el header)
- [x] "Bienvenido" muestra solo el primer nombre (particular); nombre comercial completo en Agencia/Concesionaria
- [x] Panel "Mi cuenta": nombre completo (o razón social) + línea divisoria debajo del título, antes de las opciones — mobile y desktop
- [x] `tsc --noEmit`, `eslint`, `npm run build` limpios
- [x] Verificado con requests reales: todas las rutas del dashboard siguen redirigiendo a login sin sesión (307), sin errores de servidor
- [ ] Prueba manual en navegador (imprescindible, depende de `useSession()`): header consistente en las pantallas del dashboard, saludo abreviado, y el nombre completo + separador dentro del panel "Mi cuenta"

## Fase 27 — Modelo de negocio definitivo: Administrador de anuncios, Compra y Suscripciones (solicitado por el usuario)
- [x] Fix previo: vencimiento efectivo de "destacado" (`getEffectiveFeatured`), antes nunca se vencía solo
- [x] Migración aditiva en `User`: `subscriptionQuota`, `subscriptionExpiresAt`, `pendingFeaturedVouchers`
- [x] Motor de cupo centralizado (`loadActivationContext`) en `createListing`/`updateOwnedListing`/`reactivateListing`
- [x] Compra por día ("Destacar publicación") con contador recortado server-side + carrito para varias publicaciones
- [x] Combo "Publicación 30 días + 7 días destacado" con wizard (publicación existente vs. próxima publicación)
- [x] Suscripciones (5/10/30 por 30 días) con cupo temporal que se pierde al vencer sin renovar
- [x] Reemplazo de los planes viejos en el seed (desactivados, no borrados — el historial de pagos sigue apuntando a esos códigos)
- [x] Administrador de anuncios: Resumen (nueva) + Mis publicaciones + Mis compras (nueva), con `AnunciosSubNav` compartido
- [x] Método de pago simplificado a solo métodos guardados
- [x] Se elimina la pantalla dedicada "Destacar anuncio"; el botón en la card ahora abre Mis compras preseleccionada
- [x] Panel "Mi cuenta": Publicar anuncio arriba (ícono azul), Cambiar contraseña agregado, se saca del formulario de perfil
- [x] Pausar/Reactivar/Vender: modal de confirmación en vez de navegar fuera de la pantalla
- [x] Detalle de publicación: foto del vendedor/agencia + insignia de verificación en la pestaña Contacto
- [x] `tsc --noEmit`, `eslint`, `npm run build` limpios
- [x] `prisma migrate dev` + `prisma db seed` aplicados contra la base real
- [x] Script desechable verificado contra la DB real: aritmética de cupo/suscripción/voucher y vencimiento efectivo de destacados — revertido al terminar
- [x] Verificado con requests reales a `/dashboard/anuncios`, `/dashboard/compra` (ambos modos), `/dashboard/publicaciones`, `/dashboard/pago`, catálogo, home y detalle de publicación — sin errores de servidor
- [ ] Prueba manual en navegador (imprescindible, es la parte más grande e interactiva de la app): los 3 flujos de compra completos (publicación simple, combo con wizard, destacar por día con carrito), suscripciones, y que Pausar/Reactivar/Vender confirmen sin navegar

## Fase 28 — Logo real, imagen de fondo del buscador y ajustes visuales (solicitado por el usuario)
- [x] Logo (`public/logo.svg`) reemplaza el texto "Motoresya" del header, mobile y desktop — se recortó el `viewBox` del archivo, que traía mucho espacio en blanco y se veía diminuto
- [x] Buscador principal: mismo patrón "foto de fondo + buscador embebido" en desktop y mobile (antes solo mobile), con la foto nueva (`public/hero-bg.jpg`)
- [x] Buscador, mobile: tarjeta de filtros traslúcida con blur (antes opaca, tapaba la foto de fondo) + etiquetas blancas; cada campo sigue blanco sólido; sin cambios en desktop
- [x] `Select`: padding derecho ajustado para que valores largos ("Todos los vendedores") no queden cortados; campo "Tipo de vendedor" del buscador principal más ancho
- [x] Header: nav (desktop) y logo (mobile) centrados de verdad con `minmax(0,1fr) auto minmax(0,1fr)` — antes quedaban corridos a la izquierda, más con sesión iniciada
- [x] Home: "Explorá por categoría" pasa a estar antes que "Publicaciones destacadas"
- [x] `tsc --noEmit`, `eslint`, `npm run build` limpios
- [x] Verificado con requests reales: `logo.svg`/`hero-bg.jpg` responden 200, la clase de centrado del header y el nuevo orden de secciones de la home aparecen en el HTML
- [x] Fix: logo gigante (wrapper `h-full` sobre `<img>` caía al tamaño intrínseco del SVG por el preflight de Tailwind) — altura fija directo en el `<img>`
- [x] Fix: foto de fondo recortada centrada no mostraba el auto en mobile (el auto está a la derecha de la foto) — `object-right`
- [x] Fix: tarjeta de filtros mobile poco transparente — baja a `bg-white/8` + degradado de la foto más claro en mobile
- [x] `tsc --noEmit`, `eslint`, `npm run build` limpios otra vez
- [x] Verificado con requests reales que las clases nuevas (`h-8 w-auto`, `h-7 w-auto`, `object-right`, `bg-white/8`) aparecen en el HTML
- [ ] Prueba manual en navegador (visual, imprescindible: centrado del nav con/sin sesión, tarjeta traslúcida en mobile, tamaño del logo, que el auto se vea en mobile)

## Fase 29 — Administrador de anuncios: links, colores por sección, Mis compras reordenado, logo (solicitado por el usuario)
- [x] Logo recortado: el `viewBox` anterior no contemplaba la máscara/gradiente de trama que se extendía más abajo — recorte con margen más generoso
- [x] Header: logo con tamaño fluido (`clamp()`) + padding propio en los 4 lados
- [x] Resumen: cada tarjeta suma un link "Ver"; "Suscripción" pasa a ser la última
- [x] Sub-nav (Resumen/Mis publicaciones/Mis compras): color distinto por sección cuando está seleccionada
- [x] Mis compras: se saca el selector de modo, Pago individual + Suscripciones se muestran juntas al lado de Historial de pagos en 3 columnas simétricas con fondo distinto; mobile apila con Suscripciones al final; se sacan los contadores y "Anuncios destacados" (ya están en Resumen)
- [x] `tsc --noEmit`, `eslint`, `npm run build` limpios
- [x] Verificado con requests reales: clases fluidas del logo en el HTML, rutas del dashboard sin 500
- [ ] Prueba manual en navegador (visual, imprescindible: que el logo no se corte a ningún ancho, colores del sub-nav, layout de 3 columnas de Mis compras y su orden en mobile)

## Fase 30 — Logo (medida real esta vez), y Mis compras con sub-nav propio (solicitado por el usuario)
- [x] Logo: bounding box real medido desde los 5 `<path>` de relleno (no solo los `clipPath`) — recorte definitivo, archivo renombrado a `logo-v2.svg` (evita servir una copia vieja en caché)
- [x] Colores por sección del sub-nav revertidos a uno solo
- [x] Resumen: "Publicaciones disponibles"/"Destacados disponibles"/"Suscripción" con link "Comprar" en vez de "Ver"
- [x] Mis compras: sub-nav propio (`ComprasTabs`) con Pago individual/Suscripciones (pestañas en la misma página, full width) e Historial de pagos (página aparte, `/dashboard/compra/historial`, con botón Volver)
- [x] `tsc --noEmit`, `eslint`, `npm run build` limpios
- [x] Verificado con requests reales: `logo-v2.svg` 200, `logo.svg` viejo 404, rutas nuevas de Mis compras/historial sin 500
- [ ] Prueba manual en navegador (visual, imprescindible: que el logo se vea completo esta vez, y el sub-nav de Mis compras)

## Fase 31 — Bugs de Mis compras: total del carrito y ancho de botones mobile (solicitado por el usuario)
- [x] `DestacarPorDiasCarrito`: +/- ahora actualiza en vivo la línea ya agregada al carrito (antes el Total no reflejaba el cambio hasta sacar y re-agregar el elemento)
- [x] Botones mobile de `AnunciosSubNav`/`ComprasTabs` con el mismo ancho (`w-full` en vez de `inline-flex`)
- [x] `tsc --noEmit`, `eslint`, `npm run build` limpios
- [ ] Prueba manual en navegador: cambiar la cantidad de días de un elemento ya agregado al carrito y confirmar que el Total sube/baja, y que los dos botones mobile miden igual

## Fase 32 — Reordenar fotos ya subidas al editar (solicitado por el usuario)
- [x] `ListingForm`: flechas ◀ ▶ en cada foto ya subida para reordenar (se guarda al toque), primera foto marcada como portada con la misma estrella que las fotos nuevas
- [x] Fix: `attachListingImages` ya no colisiona el `order` de fotos nuevas con el de las existentes al editar
- [x] `reorderListingImages`/`reorderListingImagesAction`: valida ownership y que la lista coincide con las fotos actuales
- [x] `tsc --noEmit`, `eslint`, `npm run build` limpios
- [x] Verificado contra la base real (script desechable, revertido al terminar) y con requests reales sin errores de servidor
- [ ] Prueba manual en navegador: reordenar fotos al editar una publicación con varias fotos, confirmar que la portada cambia en el catálogo

## Fase 33 — Rate limiting distribuido con Upstash Redis (solicitado por el usuario)
- [x] `lib/rate-limit.ts`: usa `@upstash/ratelimit` + `@upstash/redis` (sliding window) si hay credenciales en el entorno; si no, cae al Map in-memory de antes
- [x] `rateLimit()` pasa a async; actualizados los 5 usos (login vía Auth.js, login/registro/recuperar contraseña como Server Actions, cambiar contraseña)
- [x] `.env.example` documenta `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` como opcionales
- [x] `tsc --noEmit`, `eslint`, `npm run build` limpios
- [x] Verificado: script desechable confirma el fallback in-memory y la conversión de duración (revertido al terminar); requests reales sin errores de servidor
- [ ] Falta cargar credenciales reales de Upstash (crear la base en upstash.com) y agregarlas a `.env`/Vercel para que el rate limiting sea realmente distribuido en producción
- [ ] Prueba manual en navegador: intentar loguearse mal más de 5 veces seguidas y confirmar el mensaje de "demasiados intentos"

## Fase 34 — Auditoría de seguridad integral y correcciones, previo a Mercado Pago (solicitado por el usuario)
- [x] Auditoría en 3 bloques paralelos: sesiones/auth/IDOR, inyección/uploads/DoS/headers, arquitectura de pagos/centralización — sin hallazgos en SQL injection, IDOR, manipulación de precio ni fuga de secrets
- [x] `sessionVersion` en `User`: invalida sesiones JWT al cambiar contraseña (viaja en el token, se revalida contra la base en cada request)
- [x] `ChangePasswordForm` cierra la sesión actual explícitamente tras un cambio exitoso
- [x] `Payment.providerPaymentId` único (idempotencia, preparación para el webhook real de Mercado Pago)
- [x] Límite de 30 líneas + deduplicado en el carrito de "Destacar por día" (`purchaseFeatureByDays`)
- [x] Rate limiting por IP (además de por email) en login, registro y recuperar contraseña
- [x] `/catalogo` paginado (24 por página) — antes traía todo sin límite, alcanzable sin sesión
- [x] Content-Security-Policy + Strict-Transport-Security en producción (`next.config.ts`)
- [x] `requireSession()` centralizado, reemplaza ~13 repeticiones manuales en Server Actions
- [x] Migración aplicada contra la base real (`sessionVersion`, `Payment_providerPaymentId_key`)
- [x] `tsc --noEmit`, `eslint`, `npm run build` (modo producción) limpios
- [x] Verificado contra la base real (script desechable, revertido al terminar) y con servidor en modo producción + curl (headers, paginación con casos límite)
- [ ] Prueba manual en navegador (imprescindible): cambiar la contraseña y confirmar que cierra la sesión con el mensaje explicativo; navegar la paginación del catálogo; revisar la consola del navegador por errores de CSP en cualquier pantalla
- [ ] Cargar credenciales reales de Upstash Redis en producción (ver Fase 33)
- [ ] Validar el contenido real (magic bytes) de las fotos subidas, no solo el `Content-Type` declarado por el cliente — queda para una ronda futura

## Fase 35 — Integración real de Mercado Pago, Checkout Pro (solicitado por el usuario)
- [x] Flujo de dos fases: `purchaseX()` valida y crea el `Payment` PENDING + preferencia de Checkout Pro; el webhook confirma y recién ahí aplica el efecto (`applyPaymentEffect`)
- [x] `Payment.metadata` (`Json?`, nuevo) guarda las líneas del carrito/elección del combo para cuando el webhook confirme
- [x] Un solo `Payment` por checkout en "destacar por día" (antes uno por línea)
- [x] Webhook `POST /api/mercadopago/webhook`: nunca confía en el body, vuelve a pedirle el pago a la API por ID, valida `x-signature`, idempotente (`providerPaymentId` único + chequeo de `status`)
- [x] Pantalla `/dashboard/compra/resultado` (vuelta del checkout)
- [x] `DestacarPorDiasCarrito`/`FeatureComboWizard`: `window.location.href` en vez de `redirect()` (no funciona en Server Actions invocadas directo desde el cliente)
- [x] Historial de pagos: traducidos los badges de estado
- [x] Credenciales de prueba cargadas en `.env` (Access Token + Public Key)
- [x] Migración `Payment.metadata` aplicada contra la base real
- [x] `tsc --noEmit`, `eslint`, `npm run build` limpios
- [x] Verificado contra la base real (script desechable: los 4 tipos de plan, idempotencia, rechazo — revertido al terminar) y contra la API real de Mercado Pago (creación de preferencia, webhook con ID inexistente/tópico irrelevante/GET)
- [x] `MERCADOPAGO_WEBHOOK_SECRET` cargado (panel de Mercado Pago Developers → Webhooks → "Pagos (legacy)" → clave secreta)
- [x] **Prueba manual de punta a punta contra el deploy real (`motores-ya-seven.vercel.app`)**: compra de "Publicación 30 días" ($4.999) con un comprador de prueba → aprobado en Mercado Pago → webhook recibido y validado → `Payment` pasó a `APPROVED` en Historial de pagos → `purchasedPublications` se incrementó en 1 en Resumen. Flujo confirmado end-to-end.
- [x] **Nota importante sobre credenciales de prueba**: para que un pago de sandbox se apruebe, el *vendedor* (no solo el comprador) tiene que ser una cuenta de prueba de Mercado Pago — usar las credenciales TEST de la cuenta real del desarrollador (con un comprador de prueba) da el error "una de las partes... es de prueba". La solución: crear un usuario de prueba con rol vendedor (Developers → Cuentas de prueba), loguearse como ese usuario, crear una app ahí, y usar sus **credenciales de producción** (prefijo `APP_USR-`, no `TEST-` — así lo indica el propio panel de Mercado Pago para una cuenta de prueba) como `MERCADOPAGO_ACCESS_TOKEN`/`MERCADOPAGO_PUBLIC_KEY`. El webhook también hay que configurarlo en ESA app (no en la del desarrollador real), porque la firma se valida contra la app dueña de las credenciales activas.
- [ ] Antes de cobrar de verdad: cambiar las credenciales de prueba (de la cuenta de vendedor de prueba) por las credenciales de producción de la cuenta real que va a cobrar

## Fase 68 — Destacados: filtro por usuario/fecha de alta, arreglo de overflow en Acciones (solicitado por el usuario)
- [x] Filtro por usuario (email/nombre) y por rango de fecha de alta (`createdAt` de la publicación) en `/admin/destacados`
- [x] Nueva columna "Usuario" en la tabla (antes no se mostraba, aunque ya se cargaba)
- [x] `FeaturedRowActions`: layout cambiado de una fila con `flex-wrap` a un stack vertical explícito (input+botón "Agregar días" en su propia fila, "Quitar destacado" debajo) — se veía roto/desbordado en la columna Acciones
- [x] `tsc --noEmit`, `eslint`, `npm run build` limpios; filtros verificados con lectura contra la base real
- [ ] Prueba manual en navegador

## Fase 67 — Cupo y suscripción: nombre del plan visible, contadores de vouchers otorgados/usados, botón Guardar (solicitado por el usuario)
- [x] `User.subscriptionPlanCode` (nuevo) — la tarjeta "Suscripción" (admin y `/dashboard/anuncios`) ahora muestra el nombre del plan vigente en vez de un cupo crudo que no bajaba (confundía, porque el cupo real vive en un solo pozo combinado — ver `loadActivationContext`)
- [x] `User.featuredVouchersGranted`/`featuredVouchersUsed` (nuevos, históricos, nunca decrecen) — se suman en paralelo a `pendingFeaturedVouchers` en cada sitio donde se otorga (combo "para la próxima publicación", ajuste manual admin) o se consume un voucher (`createListing`/`updateOwnedListing`/`reactivateListing`)
- [x] `/admin/usuarios/[id]`: bloque de cupo reordenado con los subtítulos pedidos — Suscripción (nombre+vencimiento) / Publicaciones compradas / Publicaciones realizadas / **Publicaciones disponibles** (cálculo combinado, destacado) / Vouchers de destacado compradas / utilizados / disponibles / Publicaciones totales
- [x] `/dashboard/anuncios` (vista del propio usuario): mismos subtítulos nuevos agregados a las tarjetas — el usuario ya veía "Publicaciones disponibles" decrementando solo; ahora también ve "Publicaciones compradas", "Vouchers de destacado comprados/utilizados"
- [x] Botones +1/-1 de "Publicaciones compradas"/"Vouchers de destacado" en el admin reemplazados por un campo de ajuste + botón "Guardar" (antes cada click impactaba al toque, sin confirmación)
- [x] Migración aditiva aplicada contra la base real (3 columnas nuevas en `User`), con backfill best-effort (`featuredVouchersGranted` = saldo actual donde había, no hay forma de reconstruir el resto)
- [x] `tsc --noEmit`, `eslint`, `npm run build` limpios
- [x] Verificado con scripts desechables contra la base real (otorgar suscripción sube "disponibles" en la cantidad correcta y resuelve el nombre del plan; ajuste de vouchers +3/-1 deja granted/used consistentes) — todo revertido después
- [ ] Prueba manual en navegador

## Fase 66 — Suscripciones y Pagos: editar plan, aprobar pago en efectivo, comprobante desde admin (solicitado por el usuario)
- [x] "Editar" junto a Dar de baja/Reactivar en la tabla de Planes (`EditPlanModal`): nombre, descripción, precio, duración y cantidad — impacta directo en `/dashboard/compra` (sin caché) y en lo que acredita la próxima compra de ese plan
- [x] Confirmado (sin cambios de código necesarios): dar de baja/reactivar/editar un plan ya impactaba directo en Comprar publicación/suscripción, y una promoción reactivada ya adopta el formato de su categoría hermana — no hay tarjetas ni tipos de plan separados en el código, es un único template por sección
- [x] Tabla de Pagos: fila PENDING ahora tiene "Aprobar (efectivo)" (`ReasonConfirmModal`, motivo obligatorio) — reusa `applyPaymentEffect` (la misma función que usa el webhook de Mercado Pago) para que el pago realmente acredite cupo/suscripción/destacado, no solo cambie el estado
- [x] Fila APPROVED ahora tiene "Ver comprobante" (reusa `ComprobanteButton` del dashboard del usuario)
- [x] Gap corregido de paso: `ComprobanteButton` mostraba "Medio de pago: Mercado Pago" hardcodeado incluso para pagos otorgados por admin — ahora refleja el `provider` real
- [x] `tsc --noEmit`, `eslint`, `npm run build` limpios
- [x] Verificado con script desechable contra la base real (editar plan y revertir; Payment de prueba PENDING→APPROVED con el mismo efecto de `applyPublicationPackEffect`, cupo acreditado, revertido y borrado) — sin login de admin disponible en esta sesión para el flujo completo por navegador
- [ ] Prueba manual en navegador

## Fase 65 — Destacados: rango desde-hasta, agregar días sin resetear, baja con motivo auditado (solicitado por el usuario)
- [x] Nueva columna `Listing.featuredSince` (migración aditiva) — marca el inicio del período de destacado vigente, nunca se pisa mientras siga vigente
- [x] `/admin/destacados`: columnas "Desde — Hasta" y "Días pendientes" (calculado, no se guarda)
- [x] "Agregar días" ahora **extiende** el vencimiento vigente (no lo resetea) si la publicación ya está destacada; si no, arranca un período nuevo desde ahora — mismo cambio aplicado a las 3 vías de compra (`purchaseFeatureByDays`, combo, voucher) que también setean `featuredSince` al arrancar un período
- [x] "Quitar destacado" pide motivo obligatorio (`ReasonConfirmModal`, nuevo componente reusable) — queda en el registro de auditoría junto al resto del cambio
- [x] `tsc --noEmit`, `eslint`, `npm run build` limpios
- [x] Verificado con script desechable contra la base real (nuevo período, extensión conserva `featuredSince`, baja anticipada, revertido) — sin login de admin disponible en esta sesión para probar el flujo end-to-end vía navegador
- [ ] Prueba manual en navegador

## Fase 64 — ID único de publicación visible + solicitado en Soporte (solicitado por el usuario)
- [x] `OwnerListingCard`: cada tarjeta muestra `ID: {listing.id}` (seleccionable) junto a un link "Reportar error" a `/dashboard/soporte?listingId=...`
- [x] `/dashboard/soporte` lee el `listingId` opcional de la URL y lo precarga en el formulario
- [x] `SupportForm`: nuevo campo opcional "ID de la publicación" (prellenado si vino por URL)
- [x] `submitSupportReportAction`: si se cargó un ID, se incluye en el correo enviado a soporte
- [x] `tsc --noEmit`, `eslint`, `npm run build` limpios
- [x] Verificado con servidor de desarrollo + login real (PowerShell): tarjeta muestra el ID correcto, el link "Reportar error" prellenó el campo en Soporte
- [ ] Prueba manual en navegador

## Fase 63 — Suspensión de cuentas/publicaciones, Identidad con observaciones (solicitado por el usuario)
- [x] Suspender publicación puntual (días+motivo): estado computado "Suspendida" (`getEffectiveStatus`), oculta del catálogo, visible en Inactivas del dueño con fecha+motivo, Editar/Eliminar/Marcar vendido ocultos mientras dura, se reactiva sola o el admin la reactiva
- [x] Suspender cuenta completa (días+motivo): NO banea (el usuario sigue logueándose), oculta todas sus publicaciones del catálogo, bloquea publicar/reactivar, estado visible en el menú de cuenta y detalle en `/dashboard/perfil/tipo-cuenta`
- [x] Identidad: "Rechazar" reemplazado por "Guardar observación" (sigue `PENDING`); columna "Identidad" en la lista de Usuarios
- [x] Componente `SuspendActionModal` reusable (días+motivo) para cuenta y publicación
- [x] Corregido de paso: colisión de claves `OR` entre `visibleStatusWhere()` y `effectivelyFeaturedWhere()` en `getCatalogResults`/`getFeaturedListings` (la última pisaba a la primera silenciosamente)
- [x] Gap-fix: bonificar publicaciones/destacados manualmente ahora deja un `Payment` trazable en el historial del usuario (antes no dejaba rastro visible para el usuario)
- [x] `tsc --noEmit`, `eslint`, `npm run build` limpios
- [x] Verificado con script desechable contra la base real y con servidor de desarrollo + login real
- [ ] Prueba manual en navegador (suspender una cuenta/publicación de prueba y confirmar en el catálogo y en el panel del usuario)

## Fase 62 — Acceso al panel admin desde el menú de cuenta (solicitado por el usuario)
- [x] "Panel de administración" en el menú "Mi cuenta", visible solo si `session.user.adminRole` está seteado
- [x] `tsc --noEmit`, `eslint`, `npm run build` limpios
- [ ] Prueba manual en navegador

## Fase 61 — Exportación CSV en el panel admin (solicitado por el usuario)
- [x] Botón "Exportar CSV" en Usuarios, Publicaciones y Suscripciones/Pagos, respeta los filtros/búsqueda actuales
- [x] Route Handler por módulo (`export/route.ts`), mismo permiso que ver la lista (`read`)
- [x] `lib/csv.ts`: CSV armado a mano (RFC 4180 + BOM UTF-8), sin dependencia nueva
- [x] `where` de Prisma compartido entre la vista paginada y la exportación completa, para que no se desincronicen los filtros
- [x] `tsc --noEmit`, `eslint`, `npm run build` limpios
- [x] Verificado con servidor de desarrollo + login real: sin sesión → `307`; 3 CSV descargan bien (headers, acentos); filtro aplicado devuelve solo lo que corresponde
- [ ] Prueba manual en navegador (confirmar que el CSV abre bien en Excel/Sheets)
- [ ] Sigue pendiente: 2FA, restricción por IP, alertas automáticas por mail, auto-moderación, buzón de reportes/CRM

## Fase 60 — Panel admin, Fase 2: sesión única, bloqueo por intentos fallidos, expiración por inactividad (solicitado por el usuario)
Alcance limitado a cuentas con `adminRole` — usuarios normales del marketplace no se ven afectados.

- [x] `User.failedLoginAttempts`/`lockedUntil` (migración aditiva) — bloqueo tras 5 intentos fallidos, 30 minutos, solo cuentas de admin
- [x] Mismo mensaje de error genérico bloqueado o no (evita un oráculo de "esta cuenta es admin")
- [x] Sesión única por admin: cada login exitoso incrementa `sessionVersion`, reutiliza la invalidación ya existente por cambio de contraseña
- [x] Expiración por inactividad (30 min) para sesiones de admin, vía timestamp dentro del propio JWT — sin afectar la duración de sesión de usuarios normales
- [x] Desbloqueo manual ("Desbloquear inicio de sesión") en `/admin/usuarios/[id]`, auditado
- [x] `tsc --noEmit`, `eslint`, `npm run build` limpios
- [x] Verificado con script desechable (umbral de bloqueo, rechazo con contraseña correcta mientras dura, desbloqueo, incremento de `sessionVersion`) y con logins reales contra el servidor de desarrollo: doble login de admin corta la sesión vieja (`200`→`307`); doble login de usuario normal no afecta la sesión anterior
- [ ] Prueba manual en navegador (loguearse como admin en dos navegadores distintos y confirmar que el primero se corta)
- [ ] Sigue pendiente del bloque de seguridad original: 2FA, restricción por IP, exportación CSV, alertas automáticas por mail, auto-moderación, buzón de reportes/CRM

## Fase 59 — Panel de administración `/admin`: RBAC, auditoría, borrado lógico (solicitado por el usuario)
Fase 1 de un pedido enterprise mucho más grande — alcance acotado explícitamente con el usuario antes de empezar (ver "Fuera de alcance" abajo).

- [x] Schema: `AdminRole` (`SUPERADMIN|EDITOR|LECTOR`) nullable en `User`, `deletedAt` en `User`/`Listing`, `AdminAuditLog`
- [x] Migración aditiva aplicada contra la base real (procedimiento no interactivo: `migrate diff` → carpeta a mano → `db execute` → `migrate resolve --applied` → `generate`)
- [x] Bootstrap: primer SUPERADMIN (`forastierilucasdev@gmail.com`, cuenta creada específicamente para esto)
- [x] `adminRole` viaja en el JWT/sesión (`types/next-auth.d.ts`, `auth.ts`, `getSessionState` — reemplaza a `getSessionVersion`, ahora también invalida sesión si `deletedAt`)
- [x] `deletedAt` excluido de todas las queries públicas/del dueño existentes (catálogo, login, panel de publicaciones, destacar, etc.)
- [x] `lib/admin-permissions.ts`: matriz de permisos por rol/módulo (Lectura/Editor/Eliminación), `requireAdmin`/`requireAdminPermission`/`requireSuperAdminRole` — validado siempre server-side, nunca solo en la UI
- [x] `AdminAuditLog`: escritura explícita (`logAdminAction`) al final de cada mutación de admin, con antes/después en JSON + IP; visor de solo lectura en `/admin/auditoria`
- [x] Módulo Usuarios: lista con búsqueda/filtros, detalle, banear/desbanear, borrado lógico/restaurar, asignar rol de admin (exclusivo Superadmin)
- [x] Módulo Identidad: cola de solicitudes de verificación de DNI con fotos (URL firmada temporal), aprobar/rechazar (exclusivo Superadmin) — cubre el gap ya documentado en `ERRORES.md`
- [x] Módulo Publicaciones: lista con búsqueda/filtros, detalle/edición (sin tocar cupo/reactivación, distinto de una edición del dueño), cambiar estado, dar de baja/restaurar
- [x] Módulo Suscripciones y Pagos: lista de pagos + planes, otorgar/renovar suscripción (crea un `Payment` trazable, `provider: "admin"`), cancelar suscripción, ajustar cupo comprado/vouchers, dar de baja un plan
- [x] Módulo Destacados: lista de publicaciones destacadas, destacar manual por días, quitar destacado antes de tiempo
- [x] UI: `/admin/layout.tsx` (guard `requireAdmin()`, sin `middleware.ts` — decisión explícita y justificada), `AdminHeader` (insignia de rol), `AdminSidebarNav`, botones deshabilitados por permiso, modales de confirmación en toda acción destructiva
- [x] `tsc --noEmit`, `eslint`, `npm run build` limpios
- [x] Verificado con script desechable contra la base real (auditoría, borrado lógico de publicación/usuario, invalidación de sesión simulada) y con servidor de desarrollo: anónimo → `/login`; logueado sin rol → `/`; login real como Superadmin → `/admin/usuarios` carga con la insignia de rol
- [ ] Prueba manual en navegador con los 3 roles (confirmar botones deshabilitados/ocultos para Lector/Editor)
- [ ] **Fuera de alcance en esta ronda** (a futuro, rondas separadas): 2FA, restricción por IP, sesión única por admin, bloqueo persistente de cuenta, exportación CSV/Excel, alertas automáticas por mail (bloqueado además por no tener `RESEND_API_KEY` real), auto-moderación, CRM de reportes/notas internas, documentación Swagger (no aplica), suite de tests automatizados (no existe ninguna en el repo)

## Fase 58 — Vistas reales por publicación, privadas para el dueño (solicitado por el usuario)
- [x] `Listing.viewCount` (ya existía sin usar) pasa a incrementarse de verdad, deduplicado por visitante/día (`ListingView`, nueva tabla, única por publicación+visitante+día)
- [x] Visitante identificado por hash SHA-256 (`userId` si está logueado, IP+user-agent si no) — nunca se guarda la IP en texto plano
- [x] Bots/crawlers/previews conocidos descartados por user-agent; la vista del propio dueño nunca cuenta
- [x] Conteo privado: solo visible en "Mis publicaciones" (`OwnerListingCard`), nunca en la publicación pública
- [x] Registrado con `after()` (`next/server`) para no atrasar la respuesta de la página — primer uso en el proyecto, verificado contra la doc de Next.js 16 antes de escribir el código (`node_modules/next/dist/docs`)
- [x] Migración aditiva (`ListingView`) aplicada contra la base real (procedimiento no interactivo ya usado: `migrate diff` → carpeta a mano → `db execute` → `migrate resolve --applied` → `generate`)
- [x] Verificado con script desechable contra la base real (dedup, visitante distinto, bot descartado, usuario logueado) y con servidor de desarrollo (visita real por `curl` → `viewCount` 0→1) — datos de prueba revertidos
- [x] `tsc --noEmit`, `eslint`, `npm run build` limpios
- [ ] Prueba manual en navegador (confirmar el contador en "Mis publicaciones" tras visitar la publicación logueado con otra cuenta o en incógnito)

## Fase 57 — "Publicaciones destacadas" del inicio pasa a carrusel (solicitado por el usuario)
- [x] Nuevo `FeaturedListingsCarousel` (mismo patrón que `FeaturedAgenciesCarousel`): scroll horizontal, `VehicleCard` sin cambios, ancho fijo por tarjeta
- [x] Solo en el inicio — `/catalogo` sigue en grilla
- [x] `tsc --noEmit`, `eslint`, `npm run build` limpios
- [ ] Prueba manual en navegador

## Fase 56 — Carrusel del inicio parejo con "Publicaciones destacadas" + Volver (solicitado por el usuario)
- [x] `AgencyCard` extraída de `/concesionarias` a componente compartido, reutilizada en el carrusel del inicio — mismo alto/estructura que `VehicleCard`
- [x] Cada tarjeta del carrusel con ancho fijo (`w-64`/`sm:w-72`)
- [x] Botón "Volver" agregado en `/concesionarias` (faltaba)
- [x] `tsc --noEmit`, `eslint`, `npm run build` limpios; verificado con servidor de desarrollo (`/`, `/concesionarias` → 200)
- [ ] Prueba manual en navegador

## Fase 55 — "Concesionarias | Agencias destacadas" en el inicio (solicitado por el usuario)
- [x] Nueva sección arriba de "Publicaciones destacadas", combina concesionarias y agencias destacadas (`getFeaturedAgencies`)
- [x] Carrusel horizontal con scroll (sin autoplay), foto de portada (`logoUrl`) de cada tarjeta, alineado a la izquierda
- [x] Link "Ver todas" a `/concesionarias`
- [x] `tsc --noEmit`, `eslint`, `npm run build` limpios; verificado con servidor de desarrollo (`/`, `/concesionarias` → 200)
- [ ] Prueba manual en navegador

## Fase 54 — Botón "Inicio" en Catálogo (solicitado por el usuario)
- [x] `BackButton` gana un prop `label` opcional (default "Volver") sin romper los usos existentes
- [x] Nuevo botón "Inicio" (a `/`) arriba del título en `/catalogo`
- [x] `tsc --noEmit`, `eslint`, `npm run build` limpios
- [ ] Prueba manual en navegador

## Fase 53 — Catálogo mobile: CTA arriba de Filtros + título centrado (solicitado por el usuario)
- [x] En mobile, "¿Buscás un auto en especial?" pasa a mostrarse arriba del botón "Filtros"
- [x] Título "Catálogo" y conteo centrados en mobile, sin cambios en desktop (`lg:text-left`)
- [x] `tsc --noEmit`, `eslint`, `npm run build` limpios
- [ ] Prueba manual en navegador

## Fase 52 — Ajustes a `/buscar-vehiculo` (solicitado por el usuario)
- [x] Todos los campos pasan a obligatorios (marca, modelo, año desde/hasta, km desde/hasta), con validación server-side (rango de año, "hasta" ≥ "desde")
- [x] Título y bajada centrados; botón "Cargar datos" → "Guardar y enviar"; se agrega el botón "Volver" (faltaba)
- [x] `tsc --noEmit`, `eslint`, `npm run build` limpios
- [ ] Prueba manual en navegador

## Fase 51 — Ajuste del bloque "¿Buscás un auto en especial?" (solicitado por el usuario)
- [x] Franja con el fondo de la página entre los dos bloques navy del inicio, antes quedaban pegados
- [x] Botón "Cargar datos" → "Contactarme" (inicio y CTA compacto del catálogo)
- [x] `tsc --noEmit`, `eslint`, `npm run build` limpios
- [ ] Prueba manual en navegador

## Fase 50 — "¿Buscás un auto en especial?": aviso por mail (solicitado por el usuario)
- [x] Bloque en el inicio, mismo formato que "¿Tenés un vehículo para vender?", botón "Cargar datos" → `/buscar-vehiculo`
- [x] Corrección de paso: el texto de "Tenés un vehículo para vender" ahora incluye "agencia"
- [x] Página `/buscar-vehiculo`: formulario (nombre, correo, teléfono obligatorios; marca, modelo, año desde/hasta, km desde/hasta opcionales)
- [x] Envío por mail a `soporte@motoresya.com.ar` reutilizando `sendSupportEmail` — mismo criterio "sin RESEND_API_KEY, error explícito" que Soporte
- [x] Mensaje de éxito: "¡Muchas gracias! Te contactaremos cuando tengamos novedades."
- [x] Mismo CTA en formato compacto (`VehicleRequestCta`) debajo de los filtros de `/catalogo` (desktop y mobile) y en el estado sin resultados
- [x] `tsc --noEmit`, `eslint`, `npm run build` limpios; verificado con servidor de desarrollo (`/`, `/catalogo`, `/buscar-vehiculo` → 200)
- [ ] Falta cargar `RESEND_API_KEY` y verificar el dominio en Resend para que el mail salga de verdad (mismo pendiente que Soporte, Fase 43)
- [ ] Prueba manual en navegador

## Fase 49 — Estrella en la insignia "Destacado" (solicitado por el usuario)
- [x] Estrella (`lucide-react`, rellena del color del texto) antes de "Destacado", agregada dentro de `Badge` para que aparezca en los 3 lugares que usan `variant="featured"` sin repetir código
- [x] `tsc --noEmit`, `eslint`, `npm run build` limpios
- [ ] Prueba manual en navegador

## Fase 48 — Borde #888477 en los botones de categoría (solicitado por el usuario)
- [x] `CategoryGrid` (inicio): borde mínimo (1px) `#888477` en vez de `border-border` gris, reutilizando el token `border-plan-card`
- [x] `tsc --noEmit`, `eslint`, `npm run build` limpios
- [ ] Prueba manual en navegador

## Fase 47 — Insignia "Destacado" con fondo #010F40 y letra #FAB005 (solicitado por el usuario)
- [x] Variante `featured` de `Badge` en `#010F40`/`#FAB005`, centralizado en `globals.css` (`bg-featured`/`text-featured-ink`)
- [x] Afecta catálogo (`VehicleCard`) y panel del usuario (`OwnerListingCard`, ya se mostraba mientras dura el destacado vía `getEffectiveFeatured`)
- [x] Agregada también en el detalle de la publicación (`/catalogo/[slug]`) — antes no aparecía ahí, se perdía al abrir la publicación
- [x] `tsc --noEmit`, `eslint`, `npm run build` limpios
- [ ] Prueba manual en navegador: confirmar que se ve en catálogo, detalle y panel del usuario mientras dure el destacado

## Fase 46 — Mismo formato de "Pago individual" aplicado a Suscripciones (solicitado por el usuario)
- [x] Fondo `bg-plan-card`, mismo alto con botón pegado abajo, título+precio centrados verticalmente
- [x] Precio en `text-4xl`, botón "Suscribirme" en `text-lg font-bold`, todo en `text-plan-card-ink`
- [x] Reutiliza los tokens `bg-plan-card`/`text-plan-card-ink` de `globals.css` agregados en la Fase 45, sin repetir hex
- [x] `tsc --noEmit`, `eslint`, `npm run build` limpios
- [ ] Prueba manual en navegador: confirmar contraste y alineación en la pestaña Suscripciones

## Fase 45 — Ajuste fino de las tarjetas de "Pago individual" (solicitado por el usuario)
- [x] Título, precio y "/ día" en color `#010F40` (antes el precio era azul `text-primary`)
- [x] Título+precio centrados verticalmente en el espacio de arriba de cada tarjeta
- [x] Precio dos tamaños más grande (`text-2xl` → `text-4xl`)
- [x] Botones "Comprar"/"Confirmar compra" dos tamaños más grande y en negrita (`text-sm` → `text-lg`, `font-bold`)
- [x] Lista de elementos agregados en "Destacar por día" también en `#010F40`
- [x] Los 3 botones "Comprar"/"Confirmar compra" con la misma tipografía y color `#010F40` (el del Combo, que abre un modal, no tenía ninguno de estos estilos)
- [x] "Máx. {n}" en `#010F40`; fila "Total" → "Total a pagar"; botón de confirmar ya no repite el total en su texto
- [x] Color de fondo/texto de estas tarjetas centralizado en `globals.css` (`bg-plan-card`/`text-plan-card-ink`) en vez de hex sueltos, para poder reutilizarlo en Suscripciones a futuro
- [x] `tsc --noEmit`, `eslint`, `npm run build` limpios
- [ ] Prueba manual en navegador: confirmar contraste y alineación sobre el fondo `#888477`

## Fase 44 — Tarjetas de "Pago individual" parejas (solicitado por el usuario)
- [x] Las 3 tarjetas del mismo alto con el botón/widget pegado abajo (`flex flex-col` + `mt-auto`)
- [x] Fondo `#888477`, título y monto centrados
- [x] `tsc --noEmit`, `eslint`, `npm run build` limpios
- [ ] Prueba manual en navegador: confirmar que se ve bien el contraste del texto sobre el fondo nuevo

## Fase 43 — "Soporte": reporte de errores por email (solicitado por el usuario)
- [x] Nueva pantalla `/dashboard/soporte` — descripción del error + captura opcional
- [x] El mail incluye nombre/correo/teléfono del usuario y fecha/hora, agregados del lado del servidor
- [x] Integración con Resend (`lib/resend.ts`) — sin `RESEND_API_KEY`, error explícito en vez de fallo silencioso
- [x] Panel "Mi cuenta": "Soporte" agregado debajo de "Cambiar contraseña", separado del grupo "Anuncios"
- [x] `tsc --noEmit`, `eslint`, `npm run build` limpios
- [x] Verificado con requests reales: `/dashboard/soporte` sin errores de servidor
- [ ] Falta cargar `RESEND_API_KEY` y verificar el dominio `motoresya.com.ar` en Resend para que el mail salga de verdad
- [ ] Prueba manual en navegador (imprescindible, una vez cargada la API Key): mandar un reporte con y sin captura, confirmar que llega el mail con los datos correctos

## Fase 42 — "Volver" sin loops, filtro de provincia/localidad, y ajustes chicos (solicitado por el usuario)
- [x] `BackButton`: `href` fijo en vez de `router.back()` — elimina los loops entre pantallas; jerarquía completa hasta Inicio en los 13 usos de la app
- [x] `password`/`tipo-cuenta`: unificados al mismo `BackButton` (antes tenían su propio link, mal alineado a la izquierda)
- [x] Filtro "Provincia" (lista fija) + "Localidad" (texto libre) en el catálogo (desktop y mobile)
- [x] "Provincia" del wizard de publicar pasa de texto libre a la misma lista fija
- [x] Tipo de vehículo: `VEHICLE_TYPES` con `label` (singular, wizard) y `labelPlural` (filtros/buscador/Explorá por categoría)
- [x] Header mobile: botón "Vende tu Auto" más chico (no más alto que el logo)
- [x] `tsc --noEmit`, `eslint`, `npm run build` limpios
- [x] Verificado con requests reales: las 13 rutas del árbol de "Volver" responden bien, filtro de provincia baja el total de 38 a 18 contra datos reales
- [ ] Prueba manual en navegador (imprescindible, es sobre todo visual/de navegación): recorrer "Volver" desde varias pantallas hijas y confirmar que siempre se llega a Inicio sin loops; probar el filtro de provincia/localidad; confirmar que el botón "Vende tu Auto" en mobile no se ve más grande que el logo

## Fase 41 — Logo en Login/Registro/Recuperar contraseña (solicitado por el usuario)
- [x] `(auth)/layout.tsx`: reemplaza el texto "Motoresya" por el logo (`logo-v3.svg`), mismo criterio que el header
- [x] `tsc --noEmit`, `eslint`, `npm run build` limpios
- [x] Verificado con requests reales: `/login`/`/registro` 200, HTML con `logo-v3.svg`
- [ ] Prueba manual en navegador: que el logo se vea bien centrado y proporcionado en login/registro/recuperar contraseña

## Fase 40 — Logo: recorte definitivo con detección automática (solicitado por el usuario)
- [x] Método nuevo: render completo del SVG a imagen grande + `sharp.trim()` detecta el recuadro real del contenido automáticamente, en vez de leer coordenadas del XML a mano (los 3 intentos anteriores fallaron con ese método)
- [x] Confirmado visualmente con una vista previa PNG antes de aplicar — logo completo, sin cortes
- [x] Archivo renombrado a `logo-v3.svg` (evita caché vieja)
- [x] `tsc --noEmit`, `eslint`, `npm run build` limpios
- [x] Verificado con requests reales: `logo-v3.svg` 200, `logo-v2.svg` viejo 404
- [ ] Prueba manual en navegador (visual, imprescindible — ya van 4 rondas en esto): confirmar que el logo se ve completo a cualquier ancho de ventana

## Fase 39 — "Tipo de cuenta" a su propia pantalla, orden del panel "Mi cuenta" (solicitado por el usuario)
- [x] Nueva página `/dashboard/perfil/tipo-cuenta` (`AccountTypeForm`) — reusa `updateProfileAction` sin tocar su lógica
- [x] Sacado el selector de tipo de cuenta de "Mi perfil" (`ProfileForm` ahora recibe el tipo fijo, ya no se cambia ahí)
- [x] Ajuste: todos los datos de negocio (nombre, CUIT, ciudad, provincia, descripción, foto de portada, dirección, sitio web) se mudan también a "Tipo de cuenta" — "Mi perfil" queda solo con lo personal
- [x] Reordenado: "Tipo de cuenta" pasa a estar entre "Mi perfil" y "Administrador de anuncios" en el panel "Mi cuenta"
- [x] Panel "Mi cuenta": ítem "Tipo de cuenta" con el valor actual en azul, arriba de "Cambiar contraseña" (que queda justo arriba de "Cerrar sesión")
- [x] `tsc --noEmit`, `eslint`, `npm run build` limpios
- [x] Verificado con requests reales sin errores de servidor
- [ ] Prueba manual en navegador (imprescindible): cambiar el tipo de cuenta desde la pantalla nueva (Particular→Agencia y viceversa) y confirmar que no se pierden ciudad/provincia/descripción/dirección/sitio web al ir y volver

## Fase 38 — Se elimina "Método de pago" (solicitado por el usuario)
- [x] Página `/dashboard/pago`, link en "Mi cuenta" y en la barra lateral, formulario, Server Action y funciones de datos eliminadas
- [x] Tabla `PaymentMethod` borrada de la base (estaba vacía) — migración aplicada
- [x] `tsc --noEmit`, `eslint`, `npm run build` limpios

## Fase 37 — Comprobante de pago en Historial de pagos (solicitado por el usuario)
- [x] "Ver comprobante" en cada pago Aprobado — modal con operación, comprador (nombre/correo), tipo de anuncio, publicación relacionada, descripción, fecha, hora, medio de pago, estado y monto
- [x] Aclarado que es un resumen propio, no una factura legal (AFIP queda como proyecto aparte si hace falta)
- [x] `tsc --noEmit`, `eslint`, `npm run build` limpios
- [ ] Prueba manual en navegador: abrir el comprobante del pago real ya aprobado y confirmar que los datos coinciden

## Fase 36 — Accesos directos a comprar y Mis compras más visible en mobile (solicitado por el usuario)
- [x] Panel "Mi cuenta": sección "Anuncios" nueva con Compra individual / Compra suscripción / Método de pago
- [x] `ComprasTabs` en mobile: 3 opciones siempre visibles y apiladas (antes escondidas en un panel de filtros), con indicador radio de la activa
- [x] `tsc --noEmit`, `eslint`, `npm run build` limpios
- [x] Verificado con requests reales sin errores de servidor
- [ ] Prueba manual en navegador (visual, imprescindible): panel "Mi cuenta" con la sección nueva, y las 3 filas de Mis compras en mobile

## Pendiente para pasar de "prototipo" a "listo para producción"
- [ ] Probar manualmente en el navegador: registro, login, publicar con fotos, destacar, editar, marcar vendido
- [ ] Deploy a Vercel (cargar las mismas variables de `.env` como Environment Variables del proyecto)
- [x] Integración real de Mercado Pago (Fase 35 — con credenciales de prueba; falta cambiar a producción y probar el webhook en un despliegue real)
- [x] Content-Security-Policy (Fase 34 — sin nonces, `'unsafe-inline'`; ver limitación conocida en `ERRORES.md`)
- [x] Rate limiting distribuido (Redis / Upstash) para despliegue multi-instancia (Fase 33 — código listo, faltan credenciales reales)
- [x] Permitir borrar/reordenar fotos ya subidas al editar una publicación (Fase 32)
- [ ] Validar el contenido real (magic bytes) de las fotos subidas (Fase 34)
