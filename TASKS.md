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

## Pendiente para pasar de "prototipo" a "listo para producción"
- [ ] Probar manualmente en el navegador: registro, login, publicar con fotos, destacar, editar, marcar vendido
- [ ] Deploy a Vercel (cargar las mismas variables de `.env` como Environment Variables del proyecto)
- [ ] Integración real de Mercado Pago (reemplaza la aprobación simulada)
- [ ] Content-Security-Policy estricta
- [ ] Rate limiting distribuido (Redis / Upstash) para despliegue multi-instancia
