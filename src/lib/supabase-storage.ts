import "server-only";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "listing-images";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("Faltan las credenciales de Supabase Storage (ver .env.example).");
  }
  return createClient(url, serviceRoleKey, { auth: { persistSession: false } });
}

let bucketReady: Promise<void> | null = null;

// Crea el bucket público la primera vez que hace falta, para no requerir un
// paso manual extra de setup en Supabase Storage.
function ensureBucket() {
  if (!bucketReady) {
    bucketReady = (async () => {
      const client = getAdminClient();
      const { data } = await client.storage.getBucket(BUCKET);
      if (!data) {
        await client.storage.createBucket(BUCKET, {
          public: true,
          fileSizeLimit: "5MB",
        });
      }
    })();
  }
  return bucketReady;
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

export async function uploadListingImage(file: File, listingId: string, index: number) {
  const extension = EXTENSION_BY_MIME[file.type];
  if (!extension) {
    throw new Error(`Formato de imagen no soportado: ${file.type}`);
  }

  await ensureBucket();
  const client = getAdminClient();

  const path = `${listingId}/${Date.now()}-${index}.${extension}`;

  const { error } = await client.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: true,
  });
  if (error) throw new Error(`No se pudo subir la imagen: ${error.message}`);

  const { data } = client.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
