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

## Pendiente para pasar de "prototipo" a "listo para producción"
- [ ] Probar manualmente en el navegador: registro, login, publicar con fotos, destacar, editar, marcar vendido
- [ ] Deploy a Vercel (cargar las mismas variables de `.env` como Environment Variables del proyecto)
- [ ] Integración real de Mercado Pago (reemplaza la aprobación simulada)
- [ ] Content-Security-Policy estricta
- [ ] Rate limiting distribuido (Redis / Upstash) para despliegue multi-instancia
- [ ] Permitir borrar/reordenar fotos ya subidas al editar una publicación (hoy solo se pueden agregar más)
