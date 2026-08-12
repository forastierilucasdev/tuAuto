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
