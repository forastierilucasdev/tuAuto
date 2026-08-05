# Changelog

Todas las modificaciones relevantes del proyecto se documentan en este archivo.
Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).

## [Unreleased]

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
