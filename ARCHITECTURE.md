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
- **Cupo de publicaciones**: dos contadores en `User`, a propósito separados para que "publicaciones realizadas" no suba cada vez que se pausa/reactiva la misma publicación:
  - `activationCount` ("Publicaciones realizadas" en la UI) suma **una única vez por publicación**, la primera vez que se publica de verdad (alta directa o borrador→publicar).
  - `quotaConsumed` (junto con `purchasedPublications`, que suma al comprar un pack) define el cupo real: `FREE_PUBLICATION_QUOTA (10) + purchasedPublications - quotaConsumed` (`getAvailablePublications()`). Suma en el primer publish (igual que `activationCount`) y **además** cada vez que una publicación **vencida** se reactiva (arranca un ciclo nuevo) — reactivar desde Reservada/Pausada no toca ninguno de los dos contadores.
  - `getReactivationCost(status)` centraliza esta regla. Se hace cumplir de verdad: `createListing()`/`updateOwnedListing()`/`reactivateListing()` tiran `QuotaExceededError` si no queda cupo y la transición lo consume (guardar como borrador y reactivar desde Reservada/Pausada nunca consumen cupo).

## 5. Filtros en cascada del catálogo

Tipo → Marca → Modelo → Año se resuelven contra las tablas de taxonomía (no contra texto libre de las publicaciones), evitando duplicados ("Toyota" vs "toyota"). La cascada está centralizada en el hook `src/hooks/useVehicleTaxonomy.ts`, que llama a Server Actions (`server/actions/taxonomy.actions.ts`) para poblar cada select — lo usan **tres** componentes cliente distintos: `HeroSearch` (buscador principal del home), `CatalogFilters` (filtros del catálogo) y `ListingForm` (alta de publicación), evitando triplicar la misma lógica de efectos.

`CatalogFilters` y `HeroSearch` navegan con query params (`?tipo=&marca=&modelo=&anio=&condicion=`) que la página de catálogo (servidor) usa para consultar `getCatalogResults()`. `ListingForm` en cambio usa la cascada para completar los campos de un `Listing` nuevo.

Año, Condición, Precio y Kilometraje son atributos de `Listing`, filtrados dinámicamente. **El precio se filtra dentro de una única moneda a la vez** (selector ARS/USD en el filtro): combinar ambas monedas en un mismo rango numérico daría resultados sin sentido sin una tasa de conversión real (ver `ERRORES.md`).

## 6. Seguridad

- **Contraseñas**: hash con `bcryptjs` (cost factor 12), nunca se loguean ni se devuelven al cliente. `server/data/users.ts` solo expone funciones que seleccionan columnas explícitas (nunca `passwordHash`), excepto `findUserForAuth()`, documentada como de uso exclusivo dentro de `authorize()` de Auth.js.
- **Inyección SQL**: Prisma parametriza todas las queries. Prohibido `$queryRawUnsafe`/`$queryRaw` con concatenación de strings (no se usa en ningún punto del código).
- **XSS**: React escapa JSX por defecto; no se usa `dangerouslySetInnerHTML` en ningún componente.
- **CSRF**: Server Actions de Next.js verifican `Origin` vs `Host` automáticamente; Auth.js protege sus propios endpoints (`/api/auth/*`).
- **Autorización en profundidad**: cada Server Action de mutación sobre una publicación (`updateOwnedListing`, `markListingAsSold`, `setListingPauseStatus`, `deleteOwnedListing`, destacar vía pago) revalida que el recurso pertenece al usuario autenticado — no se confía solo en `proxy.ts` (defensa contra IDOR vía URL directa).
- **Rate limiting**: limitador in-memory por email en login/registro (`lib/rate-limit.ts`). **Limitación conocida**: no es preciso con múltiples instancias serverless; para producción reemplazar por `@upstash/ratelimit` + Redis (ver `ERRORES.md`).
- **Carga de archivos**: whitelist explícita de tipos MIME (`jpeg/png/webp/gif/avif`, nunca `image/svg+xml`), tamaño máximo 5MB, máximo 6 fotos por publicación, todo validado en el servidor (nunca solo en el cliente). La extensión del archivo en el path de Storage se deriva del content-type validado, no del nombre de archivo que manda el cliente. Las fotos de DNI (verificación de perfil) van a un bucket **privado** (`verifications`), distinto de los buckets públicos `listing-images`/`avatars` — nunca quedan accesibles por URL directa.
- **Headers HTTP**: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` configurados en `next.config.ts`. **Pendiente**: una Content-Security-Policy estricta (no se agregó todavía para no arriesgar romper el dev/build del prototipo; ver `ERRORES.md`).
- **Secrets**: `.env` nunca se commitea (ver `.gitignore`, con excepción explícita de `.env.example`); la service role key de Supabase solo se usa en `lib/supabase-storage.ts` (server-only).
- **Datos de pago**: no se solicita número de tarjeta ni CVV, ni siquiera simulado — solo un alias de método de pago.

## 7. Pagos — estado actual (mock)

La sección "Método de pago" (`/dashboard/pago`) funciona end-to-end pero con **aprobación simulada e instantánea**, sin conexión real a la API de Mercado Pago:

- `server/data/payments.ts` → `purchaseFeaturePlan()`: crea un `Payment` con `status: "APPROVED"` y, en la misma transacción, marca la publicación elegida como `featured: true` con `featuredUntil` según la duración del plan. Se usa desde la pantalla dedicada "Destacar anuncio" por publicación (`/dashboard/publicaciones/[id]/destacar`, plan `FEATURE_LISTING`, $9.999 provisorio) vía `payListingFeatureAction`.
- `purchasePublicationPack()`: crea un `Payment` y suma `plan.quantity` a `User.purchasedPublications` (packs `PUBLICATIONS_PACK_1/5/10/20`, sección "Comprar publicaciones" en `/dashboard/pago`).
- `purchaseSubscription()`: crea un `Payment` de suscripción (solo visible para cuentas de negocio — Agencia o Concesionaria — vía `isBusinessAccountType()`).
- `/dashboard/pago` también muestra "Anuncios destacados": la lista de publicaciones ya destacadas del usuario (no hay forma de elegir/destacar una publicación desde ahí — eso se hace desde su pantalla dedicada).
- Los `Plan` disponibles vienen del seed: `FEATURE_15D`, `FEATURE_30D` (histórico, sin UI que los use actualmente), `FEATURE_LISTING`, `PUBLICATIONS_PACK_1/5/10/20`, `AGENCY_MONTHLY`.

Para integrar Mercado Pago real: reemplazar `purchaseFeaturePlan`/`purchaseSubscription` por la creación de una preferencia de pago (Checkout Pro) y agregar un Route Handler `app/api/mercadopago/webhook/route.ts` que reciba la confirmación y recién ahí aplique el efecto (destacar/suscribir), en vez de aprobar instantáneamente. Variables ya reservadas en `.env.example`: `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_PUBLIC_KEY`.

## 8. Despliegue

- **Base de datos**: Supabase (Postgres).
  - `DATABASE_URL` (puerto 6543, "Transaction pooler"): usado en runtime por `src/lib/prisma.ts` vía `@prisma/adapter-pg`, apto para funciones serverless.
  - `DIRECT_URL` (puerto 5432, conexión directa/session pooler): usado únicamente por la CLI de Prisma (`prisma migrate`, `prisma studio`) configurada en `prisma.config.ts`, porque el pooler transaccional no soporta prepared statements ni el shadow database que requieren las migraciones.
- **Storage**: Supabase Storage, bucket público `listing-images` (autogenerado en el primer upload).
- **Hosting**: Vercel. Variables de entorno de `.env.example` deben cargarse en Vercel (Project Settings → Environment Variables), no en el repositorio.

---

_Este documento se actualiza a medida que avanza el desarrollo. Ver `TASKS.md` para el checklist de progreso y `CHANGELOG.md` para el historial de cambios._
