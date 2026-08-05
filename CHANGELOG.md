# Changelog

Todas las modificaciones relevantes del proyecto se documentan en este archivo.
Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).

## [Unreleased]

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
