// Whitelist explícita (no "image/*"): excluye formatos como image/svg+xml,
// que pueden contener script embebido y no son seguros de servir tal cual.
// Compartida entre la carga de fotos de publicaciones y la foto de perfil.
export const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

export function validateImageFile(file: File, maxSizeBytes: number): string | null {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return "Solo se permiten imágenes JPG, PNG, WEBP, GIF o AVIF.";
  }
  if (file.size > maxSizeBytes) {
    return `Cada imagen debe pesar menos de ${Math.round(maxSizeBytes / (1024 * 1024))}MB.`;
  }
  return null;
}
