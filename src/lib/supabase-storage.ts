import "server-only";
import { createClient } from "@supabase/supabase-js";

const LISTING_IMAGES_BUCKET = "listing-images";
const AVATARS_BUCKET = "avatars";
const AGENCY_LOGOS_BUCKET = "agency-logos";
const VERIFICATIONS_BUCKET = "verifications";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("Faltan las credenciales de Supabase Storage (ver .env.example).");
  }
  return createClient(url, serviceRoleKey, { auth: { persistSession: false } });
}

const bucketsReady = new Map<string, Promise<void>>();

// Crea el bucket la primera vez que hace falta, para no requerir un paso
// manual extra de setup en Supabase Storage. `public` controla si los
// archivos son accesibles por URL directa (fotos de publicaciones/avatares)
// o requieren pasar siempre por el cliente admin (documentación de DNI).
function ensureBucket(bucket: string, fileSizeLimit: string, isPublic: boolean) {
  let ready = bucketsReady.get(bucket);
  if (!ready) {
    ready = (async () => {
      const client = getAdminClient();
      const { data } = await client.storage.getBucket(bucket);
      if (!data) {
        await client.storage.createBucket(bucket, { public: isPublic, fileSizeLimit });
      }
    })();
    bucketsReady.set(bucket, ready);
  }
  return ready;
}

// Extensión derivada del content-type validado por el servidor, nunca del
// nombre de archivo que manda el cliente (evita inyectar caracteres/paths
// raros en la ruta de storage a través del filename).
const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

async function uploadImage(bucket: string, fileSizeLimit: string, file: File, path: string) {
  const extension = EXTENSION_BY_MIME[file.type];
  if (!extension) {
    throw new Error(`Formato de imagen no soportado: ${file.type}`);
  }

  await ensureBucket(bucket, fileSizeLimit, true);
  const client = getAdminClient();

  const fullPath = `${path}.${extension}`;
  const { error } = await client.storage.from(bucket).upload(fullPath, file, {
    contentType: file.type,
    upsert: true,
  });
  if (error) throw new Error(`No se pudo subir la imagen: ${error.message}`);

  const { data } = client.storage.from(bucket).getPublicUrl(fullPath);
  return data.publicUrl;
}

export function uploadListingImage(file: File, listingId: string, index: number) {
  return uploadImage(LISTING_IMAGES_BUCKET, "5MB", file, `${listingId}/${Date.now()}-${index}`);
}

export function uploadAvatarImage(file: File, userId: string) {
  return uploadImage(AVATARS_BUCKET, "2MB", file, `${userId}/${Date.now()}`);
}

export function uploadAgencyLogo(file: File, userId: string) {
  return uploadImage(AGENCY_LOGOS_BUCKET, "2MB", file, `${userId}/${Date.now()}`);
}

/**
 * A diferencia de `uploadImage`, este bucket es privado: no genera una URL
 * pública, devuelve la ruta interna del archivo. Son fotos de DNI, PII
 * sensible — nunca deben quedar accesibles por URL directa como las fotos
 * de publicaciones o el avatar.
 */
async function uploadPrivateImage(bucket: string, fileSizeLimit: string, file: File, path: string) {
  const extension = EXTENSION_BY_MIME[file.type];
  if (!extension) {
    throw new Error(`Formato de imagen no soportado: ${file.type}`);
  }

  await ensureBucket(bucket, fileSizeLimit, false);
  const client = getAdminClient();

  const fullPath = `${path}.${extension}`;
  const { error } = await client.storage.from(bucket).upload(fullPath, file, {
    contentType: file.type,
    upsert: true,
  });
  if (error) throw new Error(`No se pudo subir la imagen: ${error.message}`);

  return fullPath;
}

export function uploadVerificationDocument(file: File, userId: string, side: "frente" | "dorso") {
  return uploadPrivateImage(VERIFICATIONS_BUCKET, "5MB", file, `${userId}/${side}-${Date.now()}`);
}

/**
 * Único lugar que puede volver visible una foto de DNI: URL temporal (5
 * minutos), usada solo por el panel de admin (`/admin/identidad`) al
 * revisar una solicitud — nunca una URL pública ni persistida.
 */
export async function getVerificationDocumentSignedUrl(path: string): Promise<string | null> {
  const client = getAdminClient();
  const { data, error } = await client.storage.from(VERIFICATIONS_BUCKET).createSignedUrl(path, 5 * 60);
  if (error) return null;
  return data.signedUrl;
}
