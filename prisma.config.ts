import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// La CLI de Prisma (migrate, db push, studio) usa la conexión directa
// (DIRECT_URL, puerto 5432) porque el pooler transaccional de Supabase
// (DATABASE_URL, puerto 6543) no soporta prepared statements ni el
// shadow database que requieren las migraciones. La app en runtime usa
// su propio adapter con DATABASE_URL — ver src/lib/prisma.ts.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DIRECT_URL"),
  },
});
