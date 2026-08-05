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
- **Recuperar contraseña simulado**: el formulario de "Recuperar contraseña" no envía ningún email real todavía (no hay proveedor de emails configurado); siempre muestra el mismo mensaje genérico. Integrar un proveedor de email + tokens de reseteo queda pendiente.
- **Foto de perfil sin editor de recorte**: la imagen se centra y recorta automáticamente dentro del círculo (`object-cover`), pero no hay una herramienta para que el usuario reposicione manualmente el recorte.

## Historial de errores resueltos

_(Se completa a medida que se detectan y corrigen errores post-lanzamiento del prototipo)_

| Fecha | Descripción | Estado |
|---|---|---|
| 2026-08-05 | La página de detalle de publicación devolvía error 500 (`Functions cannot be passed directly to Client Components`) al pasar íconos como referencia de componente a `VerticalTabs` desde un Server Component. | Resuelto — se pasa el ícono ya renderizado como JSX. |
