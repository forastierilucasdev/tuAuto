# Arquitectura — tuAuto

## 1. Resumen

tuAuto es un portal de compra/venta de vehículos (autos, camionetas, motos, bicicletas, monopatines, lanchas, barcos). Vendedores particulares y concesionarias publican anuncios; el público navega un catálogo con filtros en cascada.

Alcance de esta etapa: **prototipo funcional** con backend y base de datos reales, datos de prueba (seed), carga real de fotos, y un módulo de pagos con aprobación simulada (sin conexión real a Mercado Pago todavía).

## 2. Stack

| Capa | Tecnología | Motivo |
|---|---|---|
| Framework | Next.js 16 (App Router, TypeScript) | Full-stack en un repo, SSR/SEO para el catálogo público |
| UI | React 19 + Tailwind CSS v4 | Tokens de diseño centralizados vía `@theme` en `globals.css` |
| Componentes UI | Primitives propios en `src/components/ui` (patrón shadcn: CVA + Tailwind) | Reutilización total, sin dependencia de un registro externo |
| ORM / DB | Prisma 7 + `@prisma/adapter-pg` sobre PostgreSQL (Supabase) | Tipado end-to-end, migraciones versionadas, adapter obligatorio en Prisma 7 |
| Hosting | Vercel | Despliegue del frontend + funciones serverless (Server Actions / Route Handlers) |
| Auth | Auth.js v5 (Credentials provider, sesión JWT) | Librería madura en vez de auth casera; hashing con `bcryptjs` |
| Almacenamiento de imágenes | Supabase Storage | Carga de fotos de publicaciones desde el servidor (nunca se expone la service role key al cliente) |
| Pagos (futuro) | Mercado Pago | Mercado argentino (DNI/CUIT en el registro) |
| Validación | Zod v4 (schemas compartidos cliente/servidor) | Única fuente de verdad para reglas de validación |

### Cambios de Next.js 16 relevantes para este proyecto

- **`middleware.ts` → `proxy.ts`**: renombrado en Next 16 (misma funcionalidad, export `proxy` o default export). Este proyecto usa `src/proxy.ts`.
- **Cache Components (opt-in, NO usado acá)**: Next 16 permite un modelo de cacheo con `cacheComponents: true` que exige envolver todo acceso dinámico en `<Suspense>` explícitos. Como casi todas las páginas de este proyecto son inherentemente dinámicas (catálogo filtrado por `searchParams`, dashboard atado a sesión), se usa el **modelo de renderizado dinámico estándar** (el default sin Cache Components).
- **Páginas sin `searchParams`/`params` pero con datos de DB** (Home, Concesionarias) se marcan explícitamente con `export const dynamic = "force-dynamic"` — si no, Next intenta pre-renderizarlas como HTML estático **en build time**, lo que rompe el build si la base de datos no está disponible en ese momento (pasó durante el desarrollo, ver `CHANGELOG.md`).

## 3. Capas de la aplicación

Regla explícita para evitar duplicación de lógica: **ningún componente ni Server Action llama a Prisma directamente.** Todo pasa por `src/server/data/*`.

```
src/
  app/
    (public)/            page.tsx (home), catalogo/, catalogo/[slug]/,
                          concesionarias/, concesionarias/[id]/, blog/, contacto/
    (auth)/               login/, registro/, recuperar-password/
    (dashboard)/dashboard/ perfil/, publicaciones/, publicaciones/nueva/,
                           publicaciones/[id]/editar/, pago/  (todas protegidas)
    api/auth/[...nextauth]/  Route Handler de Auth.js
    api/mercadopago/webhook/  Route Handler que recibe las notificaciones de pago de Mercado Pago
  components/
    Providers.tsx        SessionProvider de Auth.js (client) que envuelve toda la app en el layout raíz
    ui/                  Button, Input, PasswordInput, Select, Textarea, Label, Card, Badge, FieldError,
                         VerticalTabs, SlideOverPanel (panel deslizable genérico izq/der), UserAvatar (foto o iniciales)
    layout/              Header (reactivo a la sesión vía useSession, con CTA "Publicar anuncio"), AccountMenu, Footer
    home/                HeroSearch
    vehicles/            VehicleCard, CatalogFilters, CatalogFiltersDrawer (usa SlideOverPanel), VehicleGallery (con lightbox), CategoryGrid
    forms/               LoginForm, RegisterForm, ProfileForm (avatar + DNI editable, reutilizado en la página completa y en el AccountMenu),
                         ChangePasswordForm, ForgotPasswordForm, ListingForm (wizard)
    dashboard/           OwnerListingCard, DashboardNav (barra mobile + sidebar desktop)
  hooks/
    useVehicleTaxonomy.ts  Cascada Tipo→Marca→Modelo→Año reutilizada por HeroSearch, CatalogFilters y ListingForm
    useBodyScrollLock.ts   Bloquea el scroll del body mientras un panel/modal está abierto
  lib/
    auth.ts              Config de Auth.js (incluye trustHost: true para producción)
    prisma.ts            Singleton de PrismaClient (con adapter-pg, usa DATABASE_URL)
    supabase-storage.ts  Subida a Supabase Storage (server-only): fotos de publicaciones (bucket público "listing-images"), avatares (bucket público "avatars"), fotos de portada de agencia/concesionaria (bucket público "agency-logos") y DNI de verificación (bucket privado "verifications")
    image-validation.ts  Whitelist de tipos MIME y validación de tamaño, compartida entre publicaciones y avatar
    rate-limit.ts        Limitador (Redis/Upstash si hay credenciales, si no in-memory — ver ARCHITECTURE.md §6)
    mercadopago.ts        Cliente de Mercado Pago (server-only): crea preferencias de Checkout Pro, pide pagos por ID, valida la firma del webhook
    constants.ts         VEHICLE_TYPES, CONDITION_OPTIONS, TRANSMISSION_OPTIONS, ACCOUNT_TYPE_LABELS, NAV_LINKS, SITE_NAME
    validations/         shared.ts (primitivas: email, password, dni, cuit, teléfono, nombre — única fuente de verdad),
                         auth.ts, profile.ts (incluye changePasswordSchema), listing.ts
    utils.ts             cn, formatCurrency, formatKm, slugify, buildWhatsAppLink, getInitials
  server/
    data/                Único punto de acceso a Prisma: users, listings, taxonomy, agencies, payments
    actions/             Server Actions ("use server"): validan con Zod y delegan a /data
    auth-helpers.ts       requireSession() — centraliza el chequeo de sesión repetido en las Server Actions
  generated/prisma/      Prisma Client generado (gitignored)
  proxy.ts               Protección de rutas /dashboard (reemplaza a "middleware.ts" en Next 16)
prisma/
  schema.prisma
  seed.ts                5 usuarios, ~20 marcas/modelos, ~30 publicaciones de prueba
```

## 4. Modelo de datos (resumen)

- **User**: cuenta base (email, hash de contraseña, tipo de cuenta, DNI, teléfono, nombre, `avatarUrl` opcional). `accountType` es `PARTICULAR | AGENCIA | CONCESIONARIA` — Agencia y Concesionaria son tipos de cuenta independientes (distinta etiqueta/registro), pero comparten la misma forma de perfil de negocio.
- **AgencyProfile**: datos adicionales 1:1 para cuentas `AGENCIA` o `CONCESIONARIA` (CUIT, nombre comercial, ciudad, dirección, logo). Separado de `User` para no tener columnas huérfanas en cuentas particulares, y para alimentar la página pública "Concesionarias". El nombre de la tabla quedó como `AgencyProfile` por continuidad histórica, pero representa a ambos tipos de cuenta de negocio.
- **Brand / Model**: taxonomía seedeada (no texto libre) para que el filtro en cascada Tipo→Marca→Modelo sea confiable. `Model.vehicleType` vincula cada modelo a un tipo de vehículo; una marca puede tener modelos de varios tipos (ej. Honda autos y motos).
- **Listing**: la publicación. Incluye `vehicleType`, `brand`, `model`, `year`, `version` (opcional, ej. "XEI CVT"), `condition` (NUEVO/USADO), `transmission` (MECANICA/ASISTIDA, opcional), `price` + `currency` (ARS o USD) + `priceNegotiable`/`acceptsTrade`/`acceptsFinancing` (checks que solo se muestran en el detalle si son `true`), `mileageKm`, `contactAddress` (opcional), `status` (`DRAFT | ACTIVE | RESERVADA | PAUSADA | EXPIRED | SOLD`) y `featured` + `featuredUntil`.
  - **`title` siempre se compone en el servidor** como `${brand.name} ${model.name} ${year}` (ver `createListing()` en `server/data/listings.ts`) — nunca es un campo de texto libre del formulario.
  - **`description`** ("Observaciones" en la UI) es opcional, sin longitud mínima.
  - **Regla de vencimiento (30 días, calculada al leer)**: `expiresAt` se fija al publicar/reactivar. No hay ningún cron que reescriba el status — `getEffectiveStatus(status, expiresAt)` en `server/data/listings.ts` trata como `EXPIRED` a cualquier `ACTIVE`/`RESERVADA`/`PAUSADA` cuyo `expiresAt` ya pasó, en el momento de leer (catálogo público, badges, elegibilidad de reactivación). El campo `status` en la base recién se actualiza de verdad cuando el dueño edita/reactiva la publicación. `SOLD` se marca manualmente por el vendedor desde "Mis publicaciones" y es terminal (no se puede editar, reactivar ni eliminar).
  - **`RESERVADA` vs `PAUSADA`**: ambos se activan desde el botón "Pausar" (con motivo). `RESERVADA` se sigue mostrando en el catálogo (`visibleStatusWhere()` incluye `ACTIVE` y `RESERVADA`, ambos sin vencer); `PAUSADA` se oculta como `EXPIRED`/`SOLD`. Reactivar (desde cualquiera de los tres, o desde `DRAFT`) pregunta "¿Querés editar los datos antes de volver a publicarla? Sí, editar / No, publicar / Cancelar": "Sí, editar" entra al formulario (`updateOwnedListing()` reactiva al guardar); "No, publicar" reactiva directo sin pasar por edición (`reactivateListing()`). `getReactivationCost(status)` en `server/data/listings.ts` define, por estado de origen, si la reactivación cuenta como "publicación nueva" y si consume cupo (ver más abajo) — Reservada/Pausada es gratis (mismo ciclo en curso), Vencida/Borrador consumen cupo.
- **Image**: fotos reales subidas por el vendedor a Supabase Storage (bucket público `listing-images`, creado automáticamente en el primer upload). El campo `order` determina cuál es la "foto destacada" (portada): la de `order = 0`, elegida por el vendedor al cargar el anuncio (ver `ListingForm`).
- **Plan / Payment**: estructura para Mercado Pago real (Checkout Pro). `Plan.quantity` es exclusivo de los packs de publicaciones (`PUBLICATIONS_PACK_*`, null en el resto). Ver sección 7.
- **VerificationRequest**: solicitud de verificación de identidad (datos personales + foto de DNI frente/dorso). Las fotos se guardan en el bucket **privado** `verifications` (a diferencia de `listing-images`/`avatars`, nunca se genera una URL pública, solo se guarda la ruta interna). Queda en `PENDING` — todavía no hay panel de administración para aprobar/rechazar (ver `ERRORES.md`). `User.isVerified` es lo que se muestra como "Perfil verificado" una vez aprobada manualmente en la base.
- **Cupo de publicaciones**: contadores en `User`, a propósito separados para que "publicaciones realizadas" no suba cada vez que se pausa/reactiva la misma publicación:
  - `activationCount` ("Publicaciones realizadas" en la UI) suma **una única vez por publicación**, la primera vez que se publica de verdad (alta directa o borrador→publicar).
  - `quotaConsumed` es un contador acumulado (nunca baja) que se compara contra el cupo total disponible: `FREE_PUBLICATION_QUOTA (10) + purchasedPublications + cupoDeSuscripciónVigente - quotaConsumed`. `purchasedPublications` (Compra, permanente) y el cupo de una suscripción vigente (`subscriptionQuota`, temporal — ver sección 7) se suman; el de la suscripción deja de contar solo cuando `subscriptionExpiresAt` pasa, sin tocar `quotaConsumed` — así el cupo restante cae solo, sin cron.
  - `pendingFeaturedVouchers`: créditos de "destacar" pendientes de aplicar (comprados como parte del combo "Publicación 30 días + 7 días destacado", eligiendo aplicarlo a la próxima publicación en vez de a una existente — ver sección 7). Se consumen en la próxima publicación/reactivación, junto con el cupo.
  - Todo esto se calcula en **un solo lugar**, `loadActivationContext(userId)` (`server/data/listings.ts`): devuelve el cupo disponible, hasta cuándo va a vencer la publicación (el ciclo normal de 30 días, o `subscriptionExpiresAt` si hay una suscripción activa — así todos los avisos publicados/reactivados bajo una suscripción vencen juntos) y si corresponde aplicar un voucher de destacado pendiente. `createListing()`/`updateOwnedListing()`/`reactivateListing()` lo consultan antes de armar su transacción, en vez de repetir esta lógica cada uno.
  - `getReactivationCost(status)` sigue centralizando si una reactivación consume cupo/cuenta como publicación nueva. Se hace cumplir de verdad: las tres funciones tiran `QuotaExceededError` si no queda cupo y la transición lo consume (guardar como borrador y reactivar desde Reservada/Pausada nunca consumen cupo).
- **Destacado con vencimiento efectivo**: `featured`/`featuredUntil` se leen siempre a través de `getEffectiveFeatured(featured, featuredUntil)` (mismo patrón que `getEffectiveStatus` para el status) — un destacado vencido deja de contar como destacado sin que nada lo reescriba en la base. Las consultas que separan destacados del resto (catálogo, home) lo resuelven en el propio `WHERE` de Prisma en vez de traer todo y filtrar en JS.

### 4.1. Vistas reales de una publicación

`Listing.viewCount` es un contador de vistas **deduplicadas** (una por visitante/día, no una por carga de página) y **privado** (solo se muestra en el panel del dueño, `OwnerListingCard` — nunca en la publicación pública). El registro vive en `src/lib/listing-views.ts`:

- El visitante se identifica con un hash (SHA-256, nunca la IP en texto plano): `userId` si está logueado (une vistas entre dispositivos), o `IP + user-agent` si es anónimo.
- La dedup usa una tabla aparte, `ListingView`, única por `(listingId, visitorHash, viewDate)` — refrescar la página el mismo día no vuelve a sumar. Se inserta con `create()` dentro de una `$transaction` junto con el `increment` de `Listing.viewCount`; un choque contra esa unique (`P2002`) significa "ya contado hoy", no un error real (mismo patrón de idempotencia que `Payment.providerPaymentId`, sección 7.3).
- Bots/crawlers/previews conocidos (buscadores, WhatsApp/Telegram/Slack link previews, `curl`/`wget`/clientes HTTP) se descartan por user-agent antes de tocar la base.
- El dueño mirando su propia publicación nunca cuenta como vista — se filtra en `catalogo/[slug]/page.tsx` antes de programar el registro.
- El registro se programa con `after()` (`next/server`) para no atrasar la respuesta de la página — primer uso de `after()` en el proyecto. `headers()` (IP, user-agent) se lee durante el render, **no** dentro del callback de `after()`, porque un Server Component no puede leer APIs de request ahí (ver `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/after.md`).

## 5. Filtros en cascada del catálogo

Tipo → Marca → Modelo → Año se resuelven contra las tablas de taxonomía (no contra texto libre de las publicaciones), evitando duplicados ("Toyota" vs "toyota"). La cascada está centralizada en el hook `src/hooks/useVehicleTaxonomy.ts`, que llama a Server Actions (`server/actions/taxonomy.actions.ts`) para poblar cada select — lo usan **tres** componentes cliente distintos: `HeroSearch` (buscador principal del home), `CatalogFilters` (filtros del catálogo) y `ListingForm` (alta de publicación), evitando triplicar la misma lógica de efectos.

`CatalogFilters` y `HeroSearch` navegan con query params (`?tipo=&marca=&modelo=&anio=&condicion=`) que la página de catálogo (servidor) usa para consultar `getCatalogResults()`. `ListingForm` en cambio usa la cascada para completar los campos de un `Listing` nuevo.

Año, Condición, Precio y Kilometraje son atributos de `Listing`, filtrados dinámicamente. **El precio se filtra dentro de una única moneda a la vez** (selector ARS/USD en el filtro): combinar ambas monedas en un mismo rango numérico daría resultados sin sentido sin una tasa de conversión real (ver `ERRORES.md`).

## 6. Seguridad

- **Contraseñas**: hash con `bcryptjs` (cost factor 12), nunca se loguean ni se devuelven al cliente. `server/data/users.ts` solo expone funciones que seleccionan columnas explícitas (nunca `passwordHash`), excepto `findUserForAuth()`, documentada como de uso exclusivo dentro de `authorize()` de Auth.js.
- **Inyección SQL**: Prisma parametriza todas las queries. Prohibido `$queryRawUnsafe`/`$queryRaw` con concatenación de strings (no se usa en ningún punto del código).
- **XSS**: React escapa JSX por defecto; no se usa `dangerouslySetInnerHTML` en ningún componente.
- **CSRF**: Server Actions de Next.js verifican `Origin` vs `Host` automáticamente; Auth.js protege sus propios endpoints (`/api/auth/*`).
- **Autorización en profundidad**: cada Server Action de mutación sobre una publicación (`updateOwnedListing`, `markListingAsSold`, `setListingPauseStatus`, `deleteOwnedListing`, `reorderListingImages`, destacar vía pago) revalida que el recurso pertenece al usuario autenticado — no se confía solo en `proxy.ts` (defensa contra IDOR vía URL directa). El chequeo de sesión (`const session = await auth(); if (!session?.user) redirect("/login")`, repetido ~13 veces) está centralizado en `requireSession()` (`server/auth-helpers.ts`) para las acciones que redirigen; las que devuelven un error inline en vez de redirigir (`changePasswordAction`) siguen chequeando `session?.user` a mano a propósito.
- **Sesiones (JWT) e invalidación**: `session.strategy: "jwt"`, sin tabla de sesiones server-side. `User.sessionVersion` (incrementado en `updatePassword`) viaja dentro del JWT y se revalida contra el valor vigente en la base en cada request (callback `jwt` de `lib/auth.ts`) — si no coincide (o la cuenta se desactivó), la sesión se invalida ahí mismo. Esto evita que una cookie robada (XSS, malware, red comprometida) siga sirviendo después de que el dueño cambie su contraseña, sin depender de que el JWT expire solo (30 días, default de Auth.js v5). `ChangePasswordForm` cierra la sesión actual explícitamente (`signOut`) tras un cambio exitoso, ya que también queda invalidada.
- **Rate limiting**: `lib/rate-limit.ts` usa Redis (`@upstash/ratelimit` + `@upstash/redis`, sliding window) si `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` están configuradas en el entorno — preciso con cualquier cantidad de instancias serverless. Sin esas variables, cae a un Map in-memory por proceso (solo sirve para desarrollo local o un único proceso). Dos capas: por email/usuario (evita fuerza bruta sobre una cuenta puntual) y por IP (`getClientIp`, vía `x-forwarded-for`; evita enumerar cuentas probando un email distinto por request) en login (`authorize()` de Auth.js y `loginAction`), registro y recuperar contraseña.
- **Carga de archivos**: whitelist explícita de tipos MIME (`jpeg/png/webp/gif/avif`, nunca `image/svg+xml`), tamaño máximo 5MB, máximo 6 fotos por publicación, todo validado en el servidor (nunca solo en el cliente). **Limitación conocida**: la validación de tipo mira el `Content-Type` que declara el cliente, no los magic bytes del contenido — alguien armando el `multipart/form-data` a mano podría subir un archivo no-imagen disfrazado (queda en un bucket público, servido con el content-type que declaró). El path final en Storage se genera 100% server-side (`${userId}/${timestamp}-${index}.${ext}`), nunca a partir del nombre de archivo del cliente (sin riesgo de path traversal). Las fotos de DNI (verificación de perfil) van a un bucket **privado** (`verifications`), distinto de los buckets públicos `listing-images`/`avatars`/`agency-logos` — nunca quedan accesibles por URL directa.
- **Denegación de servicio**: `getCatalogResults` (única query pública alcanzable sin sesión) pagina "resto del catálogo" (`CATALOG_PAGE_SIZE = 24`) y capa "destacados" (`FEATURED_CATALOG_LIMIT = 12`) — antes traía todos los resultados sin límite en cada visita/filtro. `purchaseFeatureByDays` (carrito de "destacar por día") rechaza lotes de más de `MAX_FEATURE_CART_ITEMS = 30` líneas y deduplica por `listingId`.
- **Headers HTTP**: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` siempre; en producción además `Content-Security-Policy` (sin nonces — `script-src`/`style-src` llevan `'unsafe-inline'` porque Next.js necesita inline scripts propios para hidratar; sigue bloqueando carga de scripts de otro origen) y `Strict-Transport-Security` (`next.config.ts`). No se aplican en desarrollo para no romper el websocket de Hot Module Reload de Turbopack.
- **Secrets**: `.env` nunca se commitea (ver `.gitignore`, con excepción explícita de `.env.example`); la service role key de Supabase solo se usa en `lib/supabase-storage.ts` (server-only).
- **Idempotencia de pagos**: `Payment.providerPaymentId` es `@unique` (nulos permitidos) — pensado para cuando el webhook real de Mercado Pago pueda reenviar la misma notificación más de una vez (entrega at-least-once): un segundo `create()` con el mismo ID de pago del proveedor va a fallar por esta constraint en vez de acreditar cupo/destacado dos veces. Hoy los pagos son mock e instantáneos (ver sección 7), así que esto es preparación, no protección de un flujo real todavía.
- **Datos de pago**: no se solicita número de tarjeta ni CVV, ni siquiera simulado — solo un alias de método de pago.

## 7. Pagos y monetización — Mercado Pago real (Checkout Pro)

Los 4 tipos de compra (pack de publicación, suscripción, destacar por día, combo) usan **Checkout Pro** de verdad — nada se acredita hasta que Mercado Pago confirma el pago por webhook. Repartido en 3 secciones bajo **Administrador de anuncios** (panel "Mi cuenta" y barra lateral del dashboard):

- **Resumen** (`/dashboard/anuncios`): agregación de solo lectura (publicaciones disponibles/realizadas/destacadas, destacados pendientes, estado de la suscripción, reservadas/inactivas/vendidas) — reusa `getAvailablePublications`/`getOwnerListingGroups`/`getSubscriptionStatus`.
- **Mis publicaciones** (`/dashboard/publicaciones`): sin cambios de fondo, ver sección 4.
- **Mis compras** (`/dashboard/compra`, `?vista=individual|suscripcion`): Pago individual (pack $4.999, combo $14.999, destacar por día $999/día con carrito) y Suscripciones (planes `SUBSCRIPTION_5/10/30`). "Historial de pagos" en `/dashboard/compra/historial`.

### Flujo de dos fases

1. **Iniciar la compra** (`src/server/data/payments.ts`, `purchasePublicationPack`/`purchaseSubscription`/`purchaseFeatureByDays`/`purchaseFeatureCombo`): corren las mismas validaciones de siempre (ownership, cupo, elegibilidad de la publicación, tope de 30 líneas en el carrito de destacar) y calculan el precio **siempre desde `Plan.price`** en la base, nunca desde el cliente. Crean un `Payment` en `PENDING` — si la compra tiene líneas (destacar por día) o una elección (combo), se guardan en `Payment.metadata` (`Json?`) para que el webhook sepa qué aplicar. Después crean una preferencia en Mercado Pago (`lib/mercadopago.ts`, `createMercadoPagoPreference`, SDK oficial `mercadopago`) con `external_reference = Payment.id` y devuelven la URL de checkout (`init_point`/`sandbox_init_point`). Nada se acredita todavía.
2. **Confirmación** (`POST /api/mercadopago/webhook`, Route Handler): Mercado Pago notifica cuando el pago cambia de estado. El handler **nunca confía en el body de la notificación** — vuelve a pedirle el pago a la API de Mercado Pago por ID (`getMercadoPagoPayment`), valida la firma `x-signature` (HMAC-SHA256 con `MERCADOPAGO_WEBHOOK_SECRET`, `verifyMercadoPagoSignature`), busca el `Payment` local por `external_reference` y, si el estado real es `approved`, llama `applyPaymentEffect(paymentId, providerPaymentId)` — recién ahí se acredita cupo, se destaca la publicación, etc. Si es `rejected`/`cancelled`, `markPaymentRejected`. Si es `pending`/`in_process`, no hace nada (espera la próxima notificación). Siempre responde `200` rápido (Mercado Pago reintenta si no hay `2xx`), salvo firma inválida (`401`).

### Redirección al checkout: dos patrones distintos

- `purchasePublicationPackAction`/`purchaseSubscriptionAction` son `<form action={...}>` — `redirect(url)` de Next.js funciona ahí incluso hacia un dominio externo.
- `purchaseFeatureByDaysAction`/`purchaseFeatureComboAction` se invocan directo desde el cliente (no `<form>`, necesitan mandar un array/objeto) — **no pueden usar `redirect()`** (mismo bug ya documentado en Fase 21/`ERRORES.md`: no resuelve la promesa del lado del cliente). Devuelven `{ redirectUrl }` y el componente cliente navega con `window.location.href`.

### Idempotencia

`Payment.providerPaymentId` es `@unique` (nulos permitidos) — si dos notificaciones del mismo pago llegan en paralelo, la segunda transacción falla por la constraint (capturado en el webhook como "ya procesado", no como error). Además, `applyPaymentEffect`/`markPaymentRejected` chequean `Payment.status === "PENDING"` antes de tocar nada, así que un reintento sobre un pago ya `APPROVED`/`REJECTED` no hace nada.

### `applyPaymentEffect` — motor de efectos, despachado por `planCode`

- Packs (`Plan.quantity` sin `durationDays`) → `purchasedPublications: {increment: quantity}`.
- Suscripciones (`Plan.quantity` + `durationDays`) → escribe (no suma) `subscriptionQuota`/`subscriptionExpiresAt`.
- `FEATURE_PER_DAY` → recorre `metadata.items` (carrito), aplica `featured`/`featuredUntil` por línea. Si una publicación dejó de ser elegible entre que se inició el pago y se confirmó (se vendió, venció), esa línea se saltea con un `console.warn` — **limitación conocida**: no hay reembolso automático, caso raro (ventana de minutos).
- `PUBLICATION_30D_FEATURED_7D` (combo) → misma lógica de siempre (`forNextListing` vs `listingId`), leyendo la elección desde `metadata.choice`.

### Otras limitaciones conocidas

- **Notificaciones a `localhost`**: Mercado Pago no puede llamar al webhook de un servidor local — solo se puede probar en un despliegue real (Vercel) o con un túnel (ej. ngrok). En dev, `getBaseUrl()` (`lib/mercadopago.ts`) arma URLs `http://localhost`, así que además se omite `auto_return` en la preferencia (Mercado Pago rechaza `auto_return` sin un `back_url.success` https válido) — el comprador vuelve tocando el botón del checkout en vez de que redirija solo, pero el flujo de ida (crear preferencia, pagar) sí se puede probar en dev.
- **`MERCADOPAGO_WEBHOOK_SECRET` opcional**: si no está configurado (falta crearlo en el panel de Mercado Pago), el webhook procesa las notificaciones igual pero sin validar la firma, con un `console.warn`.
- **Credenciales de un vendedor de prueba**: para que un pago de sandbox se apruebe, el vendedor también tiene que ser una cuenta de prueba (no alcanza con que el comprador lo sea) — si no, Mercado Pago rechaza el pago con "una de las partes... es de prueba". Se resuelve creando un usuario de prueba con rol vendedor (Developers → Cuentas de prueba), creando una app desde esa cuenta, y usando sus **credenciales de producción** (prefijo `APP_USR-`, no `TEST-` — así lo indica el propio panel para una cuenta de prueba) como `MERCADOPAGO_ACCESS_TOKEN`/`MERCADOPAGO_PUBLIC_KEY`. El webhook se configura en esa misma app (la firma se valida contra la app dueña de las credenciales activas). Verificado de punta a punta así contra el deploy real.

## 7.1. Soporte — reporte de errores por email

`/dashboard/soporte` (`SupportForm` + `submitSupportReportAction`): el usuario logueado describe un error y opcionalmente adjunta una captura — el nombre, correo, teléfono y la fecha/hora se agregan del lado del servidor (no los pide el formulario), no hay que confiar en que el usuario los tipee bien. El mail se manda con [Resend](https://resend.com) (`lib/resend.ts`) a `soporte@motoresya.com.ar` (mismo destino que el Contacto público, que sigue siendo una maqueta sin envío real), con `replyTo` al correo del usuario para poder responderle directo.

- **`RESEND_API_KEY` opcional pero necesaria para que funcione de verdad**: sin ella, `sendSupportEmail()` devuelve un error explícito ("El envío de reportes todavía no está configurado...") en vez de fallar en silencio o fingir éxito — a diferencia del patrón de Upstash/webhook secret (que caen a un fallback funcional), acá no hay una alternativa segura, o se manda el mail o no se manda.
- **`RESEND_FROM_EMAIL`**: sin verificar el dominio `motoresya.com.ar` en Resend, solo se puede mandar desde `onboarding@resend.dev` (remitente de prueba de Resend) y solo a la casilla verificada de esa cuenta de Resend — no a `soporte@motoresya.com.ar` todavía. Verificar el dominio en Resend (Domains) antes de depender de esto en producción.

## 7.2. Panel de administración (`/admin`)

RBAC real (no visual), auditoría y borrado lógico para gestionar usuarios, publicaciones, verificaciones de identidad, suscripciones/pagos y destacados. Fase 1 de un pedido más grande — ver `TASKS.md` Fase 59 y `ERRORES.md` para lo que queda explícitamente fuera (2FA, restricción por IP, sesión única, exportación, alertas automáticas, auto-moderación, CRM, tests).

- **Roles**: `User.adminRole` (`AdminRole?`: `SUPERADMIN | EDITOR | LECTOR`, `null` para el resto) — reutiliza el login normal en vez de un sistema de auth paralelo, y viaja en el JWT (`token.adminRole`) para no pegarle a la base en cada render, refrescado en cada request junto con `sessionVersion` (`getSessionState()` en `server/data/users.ts`, reemplaza a la vieja `getSessionVersion()` — ahora también invalida la sesión si `deletedAt` está seteado, mismo criterio que `!isActive`).
- **Permisos** (`src/lib/admin-permissions.ts`): matriz fija `{LECTOR, EDITOR, SUPERADMIN} × {usuarios, publicaciones, suscripciones, destacados, identidad, auditoria} × {read, edit, delete}`, hardcodeada a propósito (no una tabla configurable N:M — 3 roles fijos con la misma forma en todos los módulos no lo necesitan). `requireAdminPermission(module, action)` es la primera línea de **toda** Server Action de admin — la UI (botones deshabilitados/ocultos) lee del mismo cálculo (`getModulePermissions()`) pasado como prop desde el Server Component, nunca se recalcula en el cliente, pero nunca es la barrera real. Cambiar el rol de otro admin es la única acción que no entra en la matriz read/edit/delete (`requireSuperAdminRole`, exclusivo Superadmin) — igual que aprobar/rechazar una verificación de identidad (matriz: `identidad.edit` solo la tiene Superadmin).
- **Borrado lógico**: `deletedAt` en `User` y `Listing` — "eliminar" desde el panel las excluye de toda lectura pública/del dueño (repasadas y actualizadas: `visibleStatusWhere`, `getListingBySlug`, `getOwnerListingGroups`, `getOwnedListingForEdit`, `getListingForFeatureCheck`, `getFeaturableListings`, `assertOwnership`, login) pero la fila sigue físicamente en la base, restaurable. **No reemplaza** los DELETE físicos que ya existían para el propio dueño (`deleteOwnedListing`) — son dos mecanismos distintos a propósito. Banear (`isActive=false`) es reversible y **no** oculta las publicaciones del usuario — mismo criterio que ya tenía `isActive` (solo gatea el login).
- **Auditoría** (`AdminAuditLog`): una fila por acción de admin (`adminId`, `action`, `targetTable`/`targetId`, `changes` JSON con antes/después, IP, fecha) — escritura explícita (`logAdminAction()` en `server/data/admin/audit-log.ts`) al final de cada mutación, nunca vía hook automático de Prisma. Legible por los 3 roles (es metadata sobre datos que Lector ya puede ver).
- **Sin `middleware.ts`**: decisión explícita — el callback `jwt` de Auth.js ya hace un round-trip a la base en cada request, así que moverlo a middleware no ahorra ese costo. El guard vive en `src/app/admin/layout.tsx` (`requireAdmin()`), mismo patrón "guard donde se renderiza" que ya usa el resto del proyecto. La barrera de seguridad real es `requireAdminPermission()` dentro de cada Server Action.
- **Otorgar una suscripción manualmente** (`grantSubscription`) crea un `Payment` en `APPROVED` con `provider: "admin"` y `providerPaymentId: null` (la constraint única lo permite) en vez de solo tocar los campos de cupo del usuario — así queda trazable en su propio historial de pagos, no es una mutación silenciosa.
- **Identidad** reutiliza `VerificationRequest` (ya existía, sin panel para resolverla — gap documentado en `ERRORES.md`). Las fotos de DNI viven en el bucket privado `verifications`; el panel nunca genera una URL pública, solo una **firmada de 5 minutos** (`getVerificationDocumentSignedUrl()` en `lib/supabase-storage.ts`) para mostrarlas de forma temporal — `next.config.ts` tuvo que sumar el patrón `/storage/v1/object/sign/**` a `images.remotePatterns` (antes solo permitía `/object/public/**`).
- **Bootstrap**: sin autoregistro de admins. El primer SUPERADMIN se promovió a mano, una sola vez, con un script desechable (ya borrado) que crea la cuenta y setea `adminRole: "SUPERADMIN"` directo en la base — cualquier admin siguiente se crea desde el propio panel (`assignAdminRoleAction`, exclusivo Superadmin).

## 8. Despliegue

- **Base de datos**: Supabase (Postgres).
  - `DATABASE_URL` (puerto 6543, "Transaction pooler"): usado en runtime por `src/lib/prisma.ts` vía `@prisma/adapter-pg`, apto para funciones serverless.
  - `DIRECT_URL` (puerto 5432, conexión directa/session pooler): usado únicamente por la CLI de Prisma (`prisma migrate`, `prisma studio`) configurada en `prisma.config.ts`, porque el pooler transaccional no soporta prepared statements ni el shadow database que requieren las migraciones.
- **Storage**: Supabase Storage, bucket público `listing-images` (autogenerado en el primer upload).
- **Hosting**: Vercel. Variables de entorno de `.env.example` deben cargarse en Vercel (Project Settings → Environment Variables), no en el repositorio.

---

_Este documento se actualiza a medida que avanza el desarrollo. Ver `TASKS.md` para el checklist de progreso y `CHANGELOG.md` para el historial de cambios._
