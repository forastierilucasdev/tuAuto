# Changelog

Todas las modificaciones relevantes del proyecto se documentan en este archivo.
Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).

## [Unreleased]

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
