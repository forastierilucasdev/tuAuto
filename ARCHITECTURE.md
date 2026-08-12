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
  components/
    Providers.tsx        SessionProvider de Auth.js (client) que envuelve toda la app en el layout raíz
    ui/                  Button, Input, PasswordInput, Select, Textarea, Label, Card, Badge, FieldError,
                         VerticalTabs, SlideOverPanel (panel deslizable genérico izq/der), UserAvatar (foto o iniciales)
    layout/              Header (reactivo a la sesión vía useSession, con CTA "Publicar anuncio"), AccountMenu, Footer
    home/                HeroSearch
    vehicles/            VehicleCard, CatalogFilters, CatalogFiltersDrawer (usa SlideOverPanel), VehicleGallery (con lightbox), CategoryGrid
    forms/               LoginForm, RegisterForm, ProfileForm (avatar + DNI editable, reutilizado en la página completa y en el AccountMenu),
                         ChangePasswordForm, ForgotPasswordForm, ListingForm (wizard), AddPaymentMethodForm
    dashboard/           OwnerListingCard, DashboardNav (barra mobile + sidebar desktop)
  hooks/
    useVehicleTaxonomy.ts  Cascada Tipo→Marca→Modelo→Año reutilizada por HeroSearch, CatalogFilters y ListingForm
    useBodyScrollLock.ts   Bloquea el scroll del body mientras un panel/modal está abierto
  lib/
    auth.ts              Config de Auth.js (incluye trustHost: true para producción)
    prisma.ts            Singleton de PrismaClient (con adapter-pg, usa DATABASE_URL)
    supabase-storage.ts  Subida a Supabase Storage (server-only): fotos de publicaciones (bucket público "listing-images"), avatares (bucket público "avatars"), fotos de portada de agencia/concesionaria (bucket público "agency-logos") y DNI de verificación (bucket privado "verifications")
    image-validation.ts  Whitelist de tipos MIME y validación de tamaño, compartida entre publicaciones y avatar
    rate-limit.ts        Limitador in-memory (ver limitaciones en ERRORES.md)
    constants.ts         VEHICLE_TYPES, CONDITION_OPTIONS, TRANSMISSION_OPTIONS, ACCOUNT_TYPE_LABELS, NAV_LINKS, SITE_NAME
    validations/         shared.ts (primitivas: email, password, dni, cuit, teléfono, nombre — única fuente de verdad),
                         auth.ts, profile.ts (incluye changePasswordSchema), listing.ts
    utils.ts             cn, formatCurrency, formatKm, slugify, buildWhatsAppLink, getInitials
  server/
    data/                Único punto de acceso a Prisma: users, listings, taxonomy, agencies, payments
    actions/             Server Actions ("use server"): validan con Zod y delegan a /data
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
- **Plan / PaymentMethod / Payment**: estructura lista para Mercado Pago; `PaymentMethod` nunca guarda datos de tarjeta, solo un alias visible. `Plan.quantity` es exclusivo de los packs de publicaciones (`PUBLICATIONS_PACK_*`, null en el resto). Ver sección 7.
- **VerificationRequest**: solicitud de verificación de identidad (datos personales + foto de DNI frente/dorso). Las fotos se guardan en el bucket **privado** `verifications` (a diferencia de `listing-images`/`avatars`, nunca se genera una URL pública, solo se guarda la ruta interna). Queda en `PENDING` — todavía no hay panel de administración para aprobar/rechazar (ver `ERRORES.md`). `User.isVerified` es lo que se muestra como "Perfil verificado" una vez aprobada manualmente en la base.
- **Cupo de publicaciones**: contadores en `User`, a propósito separados para que "publicaciones realizadas" no suba cada vez que se pausa/reactiva la misma publicación:
  - `activationCount` ("Publicaciones realizadas" en la UI) suma **una única vez por publicación**, la primera vez que se publica de verdad (alta directa o borrador→publicar).
  - `quotaConsumed` es un contador acumulado (nunca baja) que se compara contra el cupo total disponible: `FREE_PUBLICATION_QUOTA (10) + purchasedPublications + cupoDeSuscripciónVigente - quotaConsumed`. `purchasedPublications` (Compra, permanente) y el cupo de una suscripción vigente (`subscriptionQuota`, temporal — ver sección 7) se suman; el de la suscripción deja de contar solo cuando `subscriptionExpiresAt` pasa, sin tocar `quotaConsumed` — así el cupo restante cae solo, sin cron.
  - `pendingFeaturedVouchers`: créditos de "destacar" pendientes de aplicar (comprados como parte del combo "Publicación 30 días + 7 días destacado", eligiendo aplicarlo a la próxima publicación en vez de a una existente — ver sección 7). Se consumen en la próxima publicación/reactivación, junto con el cupo.
  - Todo esto se calcula en **un solo lugar**, `loadActivationContext(userId)` (`server/data/listings.ts`): devuelve el cupo disponible, hasta cuándo va a vencer la publicación (el ciclo normal de 30 días, o `subscriptionExpiresAt` si hay una suscripción activa — así todos los avisos publicados/reactivados bajo una suscripción vencen juntos) y si corresponde aplicar un voucher de destacado pendiente. `createListing()`/`updateOwnedListing()`/`reactivateListing()` lo consultan antes de armar su transacción, en vez de repetir esta lógica cada uno.
  - `getReactivationCost(status)` sigue centralizando si una reactivación consume cupo/cuenta como publicación nueva. Se hace cumplir de verdad: las tres funciones tiran `QuotaExceededError` si no queda cupo y la transición lo consume (guardar como borrador y reactivar desde Reservada/Pausada nunca consumen cupo).
- **Destacado con vencimiento efectivo**: `featured`/`featuredUntil` se leen siempre a través de `getEffectiveFeatured(featured, featuredUntil)` (mismo patrón que `getEffectiveStatus` para el status) — un destacado vencido deja de contar como destacado sin que nada lo reescriba en la base. Las consultas que separan destacados del resto (catálogo, home) lo resuelven en el propio `WHERE` de Prisma en vez de traer todo y filtrar en JS.

## 5. Filtros en cascada del catálogo

Tipo → Marca → Modelo → Año se resuelven contra las tablas de taxonomía (no contra texto libre de las publicaciones), evitando duplicados ("Toyota" vs "toyota"). La cascada está centralizada en el hook `src/hooks/useVehicleTaxonomy.ts`, que llama a Server Actions (`server/actions/taxonomy.actions.ts`) para poblar cada select — lo usan **tres** componentes cliente distintos: `HeroSearch` (buscador principal del home), `CatalogFilters` (filtros del catálogo) y `ListingForm` (alta de publicación), evitando triplicar la misma lógica de efectos.

`CatalogFilters` y `HeroSearch` navegan con query params (`?tipo=&marca=&modelo=&anio=&condicion=`) que la página de catálogo (servidor) usa para consultar `getCatalogResults()`. `ListingForm` en cambio usa la cascada para completar los campos de un `Listing` nuevo.

Año, Condición, Precio y Kilometraje son atributos de `Listing`, filtrados dinámicamente. **El precio se filtra dentro de una única moneda a la vez** (selector ARS/USD en el filtro): combinar ambas monedas en un mismo rango numérico daría resultados sin sentido sin una tasa de conversión real (ver `ERRORES.md`).

## 6. Seguridad

- **Contraseñas**: hash con `bcryptjs` (cost factor 12), nunca se loguean ni se devuelven al cliente. `server/data/users.ts` solo expone funciones que seleccionan columnas explícitas (nunca `passwordHash`), excepto `findUserForAuth()`, documentada como de uso exclusivo dentro de `authorize()` de Auth.js.
- **Inyección SQL**: Prisma parametriza todas las queries. Prohibido `$queryRawUnsafe`/`$queryRaw` con concatenación de strings (no se usa en ningún punto del código).
- **XSS**: React escapa JSX por defecto; no se usa `dangerouslySetInnerHTML` en ningún componente.
- **CSRF**: Server Actions de Next.js verifican `Origin` vs `Host` automáticamente; Auth.js protege sus propios endpoints (`/api/auth/*`).
- **Autorización en profundidad**: cada Server Action de mutación sobre una publicación (`updateOwnedListing`, `markListingAsSold`, `setListingPauseStatus`, `deleteOwnedListing`, `reorderListingImages`, destacar vía pago) revalida que el recurso pertenece al usuario autenticado — no se confía solo en `proxy.ts` (defensa contra IDOR vía URL directa). El chequeo de sesión (`const session = await auth(); if (!session?.user) redirect("/login")`, repetido ~13 veces) está centralizado en `requireSession()` (`server/auth-helpers.ts`) para las acciones que redirigen; las que devuelven un error inline en vez de redirigir (`addPaymentMethodAction`, `changePasswordAction`) siguen chequeando `session?.user` a mano a propósito.
- **Sesiones (JWT) e invalidación**: `session.strategy: "jwt"`, sin tabla de sesiones server-side. `User.sessionVersion` (incrementado en `updatePassword`) viaja dentro del JWT y se revalida contra el valor vigente en la base en cada request (callback `jwt` de `lib/auth.ts`) — si no coincide (o la cuenta se desactivó), la sesión se invalida ahí mismo. Esto evita que una cookie robada (XSS, malware, red comprometida) siga sirviendo después de que el dueño cambie su contraseña, sin depender de que el JWT expire solo (30 días, default de Auth.js v5). `ChangePasswordForm` cierra la sesión actual explícitamente (`signOut`) tras un cambio exitoso, ya que también queda invalidada.
- **Rate limiting**: `lib/rate-limit.ts` usa Redis (`@upstash/ratelimit` + `@upstash/redis`, sliding window) si `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` están configuradas en el entorno — preciso con cualquier cantidad de instancias serverless. Sin esas variables, cae a un Map in-memory por proceso (solo sirve para desarrollo local o un único proceso). Dos capas: por email/usuario (evita fuerza bruta sobre una cuenta puntual) y por IP (`getClientIp`, vía `x-forwarded-for`; evita enumerar cuentas probando un email distinto por request) en login (`authorize()` de Auth.js y `loginAction`), registro y recuperar contraseña.
- **Carga de archivos**: whitelist explícita de tipos MIME (`jpeg/png/webp/gif/avif`, nunca `image/svg+xml`), tamaño máximo 5MB, máximo 6 fotos por publicación, todo validado en el servidor (nunca solo en el cliente). **Limitación conocida**: la validación de tipo mira el `Content-Type` que declara el cliente, no los magic bytes del contenido — alguien armando el `multipart/form-data` a mano podría subir un archivo no-imagen disfrazado (queda en un bucket público, servido con el content-type que declaró). El path final en Storage se genera 100% server-side (`${userId}/${timestamp}-${index}.${ext}`), nunca a partir del nombre de archivo del cliente (sin riesgo de path traversal). Las fotos de DNI (verificación de perfil) van a un bucket **privado** (`verifications`), distinto de los buckets públicos `listing-images`/`avatars`/`agency-logos` — nunca quedan accesibles por URL directa.
- **Denegación de servicio**: `getCatalogResults` (única query pública alcanzable sin sesión) pagina "resto del catálogo" (`CATALOG_PAGE_SIZE = 24`) y capa "destacados" (`FEATURED_CATALOG_LIMIT = 12`) — antes traía todos los resultados sin límite en cada visita/filtro. `purchaseFeatureByDays` (carrito de "destacar por día") rechaza lotes de más de `MAX_FEATURE_CART_ITEMS = 30` líneas y deduplica por `listingId`.
- **Headers HTTP**: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` siempre; en producción además `Content-Security-Policy` (sin nonces — `script-src`/`style-src` llevan `'unsafe-inline'` porque Next.js necesita inline scripts propios para hidratar; sigue bloqueando carga de scripts de otro origen) y `Strict-Transport-Security` (`next.config.ts`). No se aplican en desarrollo para no romper el websocket de Hot Module Reload de Turbopack.
- **Secrets**: `.env` nunca se commitea (ver `.gitignore`, con excepción explícita de `.env.example`); la service role key de Supabase solo se usa en `lib/supabase-storage.ts` (server-only).
- **Idempotencia de pagos**: `Payment.providerPaymentId` es `@unique` (nulos permitidos) — pensado para cuando el webhook real de Mercado Pago pueda reenviar la misma notificación más de una vez (entrega at-least-once): un segundo `create()` con el mismo ID de pago del proveedor va a fallar por esta constraint en vez de acreditar cupo/destacado dos veces. Hoy los pagos son mock e instantáneos (ver sección 7), así que esto es preparación, no protección de un flujo real todavía.
- **Datos de pago**: no se solicita número de tarjeta ni CVV, ni siquiera simulado — solo un alias de método de pago.

## 7. Pagos y monetización — estado actual (mock)

Todo funciona end-to-end pero con **aprobación simulada e instantánea**, sin conexión real a la API de Mercado Pago. Reemplaza un modelo provisorio anterior (packs 1/5/10/20, "Destacar anuncio" a precio fijo, suscripción de concesionaria sin efecto real) por el definitivo, repartido en 3 secciones bajo **Administrador de anuncios** (panel "Mi cuenta" y barra lateral del dashboard):

- **Resumen** (`/dashboard/anuncios`): agregación de solo lectura (publicaciones disponibles/realizadas/destacadas, destacados pendientes, estado de la suscripción, reservadas/inactivas/vendidas) — no agrega lógica nueva, reusa `getAvailablePublications`/`getOwnerListingGroups`/`getSubscriptionStatus`.
- **Mis publicaciones** (`/dashboard/publicaciones`): sin cambios de fondo, ver sección 4.
- **Mis compras** (`/dashboard/compra`, `?modo=individual|suscripcion`):
  - **Pago individual**:
    - `purchasePublicationPack()` (plan `PUBLICATIONS_PACK_1`, "Publicación 30 días", $4.999): suma 1 a `User.purchasedPublications` (permanente) — sin cambios respecto al mecanismo de packs original, solo se dejó un único tamaño.
    - `purchaseFeatureCombo()` (plan `PUBLICATION_30D_FEATURED_7D`, $14.999): dos ramas, elegidas en un wizard cliente (`FeatureComboWizard`). Con `{ listingId }` aplica directo sobre una publicación propia activa: renueva su vencimiento (vía `loadActivationContext`, respeta una suscripción activa) y la destaca 7 días — no toca cupo, es un boost pago directo. Con `{ forNextListing: true }` suma 1 a `purchasedPublications` y 1 a `pendingFeaturedVouchers`, que se consumen solos en la próxima publicación/reactivación.
    - `purchaseFeatureByDays()` (plan `FEATURE_PER_DAY`, precio **por día**): recibe un array de `{listingId, days}` (carrito, componente cliente `DestacarPorDiasCarrito` con botón "Agregar elemento"). Cada línea se valida server-side (propiedad, ACTIVE, no destacada ya) y `days` se recorta a `[1, días restantes de esa publicación]` — si una sola línea no es válida, se rechaza el lote completo en vez de cobrar parcial. El botón "Destacar anuncio" de cada card en "Mis publicaciones" linkea acá con `?destacar={listingId}` para preseleccionarla.
    - También vive acá "Anuncios destacados" (vista previa de lo ya destacado) e "Historial de pagos" (antes en Método de pago).
  - **Suscripciones**: `purchaseSubscription()` (planes `SUBSCRIPTION_5/10/30`, 5/10/30 publicaciones por 30 días) **escribe** (no suma) `User.subscriptionQuota`/`subscriptionExpiresAt` — contratar una suscripción nueva reemplaza la anterior, no se apilan. El cupo es temporal: se pierde solo si `subscriptionExpiresAt` pasa sin renovarse (ver `loadActivationContext`, sección 4).
- **Método de pago** (`/dashboard/pago`): solo métodos guardados (`PaymentMethod`, alias visible, nunca datos de tarjeta).
- Los `Plan` disponibles vienen del seed: `PUBLICATIONS_PACK_1`, `PUBLICATION_30D_FEATURED_7D`, `FEATURE_PER_DAY`, `SUBSCRIPTION_5/10/30`. Los códigos del modelo provisorio (`PUBLICATIONS_PACK_5/10/20`, `FEATURE_LISTING`, `FEATURE_15D`, `FEATURE_30D`, `AGENCY_MONTHLY`) quedan con `isActive: false` — no se borran porque el historial de pagos (`Payment.planCode`) sigue apuntando a esos códigos para compras ya hechas.

Para integrar Mercado Pago real: reemplazar las funciones de `server/data/payments.ts` por la creación de una preferencia de pago (Checkout Pro) y agregar un Route Handler `app/api/mercadopago/webhook/route.ts` que reciba la confirmación y recién ahí aplique el efecto (destacar/publicar/suscribir), en vez de aprobar instantáneamente. Variables ya reservadas en `.env.example`: `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_PUBLIC_KEY`.

## 8. Despliegue

- **Base de datos**: Supabase (Postgres).
  - `DATABASE_URL` (puerto 6543, "Transaction pooler"): usado en runtime por `src/lib/prisma.ts` vía `@prisma/adapter-pg`, apto para funciones serverless.
  - `DIRECT_URL` (puerto 5432, conexión directa/session pooler): usado únicamente por la CLI de Prisma (`prisma migrate`, `prisma studio`) configurada en `prisma.config.ts`, porque el pooler transaccional no soporta prepared statements ni el shadow database que requieren las migraciones.
- **Storage**: Supabase Storage, bucket público `listing-images` (autogenerado en el primer upload).
- **Hosting**: Vercel. Variables de entorno de `.env.example` deben cargarse en Vercel (Project Settings → Environment Variables), no en el repositorio.

---

_Este documento se actualiza a medida que avanza el desarrollo. Ver `TASKS.md` para el checklist de progreso y `CHANGELOG.md` para el historial de cambios._
