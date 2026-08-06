# Errores conocidos y soporte

Este documento lista limitaciones y errores conocidos del sistema en su etapa actual (prototipo), para que el equipo de soporte y los usuarios sepan qué esperar y cómo reportar problemas nuevos.

## Cómo reportar un error nuevo

Al reportar un problema a soporte, incluir siempre:

1. **Qué intentabas hacer** (ej. "publicar un anuncio de moto").
2. **Qué esperabas que pasara** vs. **qué pasó realmente**.
3. **Usuario/email** con el que estabas logueado (nunca compartir la contraseña).
4. **Fecha y hora aproximada** del problema.
5. **Captura de pantalla**, si es posible.
6. **Pasos para reproducirlo**, si el error se repite.

## Limitaciones conocidas de esta etapa (prototipo)

- **Pagos**: la sección "Método de pago" aprueba los pagos de forma instantánea y simulada. La integración real con Mercado Pago está pendiente (ver `ARCHITECTURE.md`, sección Pagos).
- **Blog**: contenido de ejemplo, no editorial real todavía.
- **Rate limiting**: el límite de intentos de login/registro es en memoria; en un despliegue con múltiples instancias no es 100% preciso (ver `ARCHITECTURE.md`).
- **Sin rol de administrador**: agregar nuevas marcas/modelos al catálogo requiere una modificación manual de los datos semilla (`prisma/seed.ts`), no hay panel de administración todavía.
- **Filtro de precio por una sola moneda a la vez**: no se puede filtrar "ARS y USD combinados" en un mismo rango porque no hay una tasa de conversión real integrada.
- **Edición de publicaciones**: no se puede cambiar el tipo de vehículo, marca, modelo o año después de publicado (si el vendedor se equivocó, tiene que dar de baja y crear una publicación nueva). Tampoco se pueden eliminar ni reordenar fotos ya subidas desde el formulario de edición, solo agregar más — la selección de "foto destacada" (portada) solo aplica a publicaciones nuevas.
- **Título no editable**: el título de la publicación siempre es Marca + Modelo + Año, generado automáticamente; no hay forma de personalizarlo.
- **Sin Content-Security-Policy estricta todavía**: se configuraron headers de seguridad básicos (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`), pero falta una CSP granular — queda para el endurecimiento previo a producción.
- **Fotos genéricas en los datos de prueba**: las publicaciones del seed usan imágenes de stock (Picsum), no fotos reales.
- **Recuperar contraseña simulado**: el formulario de "Recuperar contraseña" (para cuando NO estás logueado, en `/login`) no envía ningún email real todavía; siempre muestra el mismo mensaje genérico. Es distinto de "Cambiar contraseña" (dentro de "Mi perfil", estando logueado), que sí funciona de verdad porque no depende de enviar un email.
- **Foto de perfil sin editor de recorte**: la imagen se centra y recorta automáticamente dentro del círculo (`object-cover`), pero no hay una herramienta para que el usuario reposicione manualmente el recorte.
- **Cambiar tipo de cuenta no refresca la sesión al instante**: la sesión usa JWT, así que si cambiás de Particular a Agencia (o viceversa) desde "Mi perfil", algunas partes de la app que leen el tipo de cuenta desde la sesión (no desde la base) pueden mostrar el valor viejo hasta volver a iniciar sesión. Los datos en la base sí se actualizan correctamente.
- **Verificación de perfil sin panel de administración**: las solicitudes de verificación (con las fotos de DNI) quedan guardadas en estado `PENDING`, pero todavía no hay ninguna pantalla para que un administrador las revise y las apruebe/rechace — `isVerified` en `User` no se puede activar todavía desde la app. Las fotos se guardan en un bucket privado de Supabase Storage, no accesibles por URL pública.
- **Contador de publicaciones activadas sin límite real**: `activationCount` se incrementa correctamente, pero por ahora es solo informativo — no hay ningún tope de publicaciones gratuitas configurado todavía.
- **Eliminar publicación no borra las fotos del Storage**: al eliminar un anuncio se borran sus filas de la base (imágenes incluidas, por cascada), pero los archivos ya subidos a Supabase Storage quedan huérfanos — no hay una limpieza automática todavía.

## Historial de errores resueltos

_(Se completa a medida que se detectan y corrigen errores post-lanzamiento del prototipo)_

| Fecha | Descripción | Estado |
|---|---|---|
| 2026-08-05 | La página de detalle de publicación devolvía error 500 (`Functions cannot be passed directly to Client Components`) al pasar íconos como referencia de componente a `VerticalTabs` desde un Server Component. | Resuelto — se pasa el ícono ya renderizado como JSX. |
| 2026-08-06 | Logueado desde el celular, no aparecía ninguna opción para ir a "Mi perfil" (el menú del dashboard estaba oculto en mobile sin reemplazo). | Resuelto — nueva barra de navegación horizontal en mobile. |
| 2026-08-06 | El botón X para cerrar el visor de fotos ampliado no respondía al toque en algunos casos. | Resuelto — faltaba `z-index` en ese botón. |
| 2026-08-06 | El panel de "Mi perfil" se abría encerrado dentro de la altura del header en vez de ocupar toda la pantalla. | Resuelto — el panel ahora se monta con un Portal a `document.body` (el `backdrop-blur` del header creaba un containing block para elementos `fixed`). |
| 2026-08-06 | El wizard de publicar un vehículo publicaba el anuncio automáticamente al completar los datos, sin que el usuario tocara "Publicar". | Resuelto — submit implícito del navegador en pasos con un solo campo de texto; se bloqueó con un guard en `handleSubmit` y se cambió el comportamiento de Enter para que avance de paso en vez de someter el formulario. |
| 2026-08-06 | Después de loguearse (sobre todo en mobile), el header seguía mostrando "sin sesión" hasta refrescar manualmente — por ejemplo al tocar el logo para ir a Inicio. | Resuelto — el sign-in se disparaba desde una Server Action (servidor), y `SessionProvider` del cliente no se enteraba del cambio. Se movió el `signIn()` real al cliente (`next-auth/react`) en `LoginForm`/`RegisterForm`. |
| 2026-08-06 | La pantalla "Hola [nombre], cuenta tipo: ..." (el viejo "Resumen") todavía aparecía en `/dashboard`, a pesar de haber sido reemplazada por "Mi perfil" varias rondas atrás. | Resuelto — `/dashboard` ahora redirige a `/dashboard/perfil`. |
| 2026-08-06 | En producción (Vercel), publicar un vehículo con fotos reales tiraba un error de servidor genérico ("This page couldn't load") en vez de crear la publicación. | Resuelto — el límite por defecto de Next.js para el body de un Server Action es 1MB; el wizard permite hasta 6 fotos de 5MB c/u. Se subió el límite a 32MB en `next.config.ts` (`experimental.serverActions.bodySizeLimit`). |
