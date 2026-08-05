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
- **Edición de publicaciones**: no se puede cambiar el tipo de vehículo, marca, modelo o año después de publicado (si el vendedor se equivocó, tiene que dar de baja y crear una publicación nueva). Tampoco se pueden eliminar fotos individuales ya subidas desde el formulario de edición, solo agregar más.
- **Sin Content-Security-Policy estricta todavía**: se configuraron headers de seguridad básicos (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`), pero falta una CSP granular — queda para el endurecimiento previo a producción.
- **Fotos genéricas en los datos de prueba**: las publicaciones del seed usan imágenes de stock (Picsum), no fotos reales.

## Historial de errores resueltos

_(Se completa a medida que se detectan y corrigen errores post-lanzamiento del prototipo)_

| Fecha | Descripción | Estado |
|---|---|---|
| — | — | — |
