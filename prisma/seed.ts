import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  PrismaClient,
  type VehicleType,
  type Currency,
  type ListingStatus,
  type VehicleCondition,
  type TransmissionType,
} from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "");
}

// --- Taxonomia: marca -> { tipo de vehiculo -> modelos } -------------------
const TAXONOMY: Record<string, Partial<Record<VehicleType, string[]>>> = {
  Toyota: { AUTO: ["Corolla", "Yaris"], CAMIONETA: ["Hilux", "SW4"] },
  Volkswagen: { AUTO: ["Gol", "Polo", "Vento"], CAMIONETA: ["Amarok", "Tiguan Allspace"] },
  Ford: { AUTO: ["Focus", "Fiesta", "Ka", "EcoSport"], CAMIONETA: ["Ranger"] },
  Chevrolet: { AUTO: ["Onix", "Cruze", "Prisma"], CAMIONETA: ["S10"] },
  Fiat: { AUTO: ["Cronos", "Argo", "Palio"], CAMIONETA: ["Toro", "Strada"] },
  Renault: { AUTO: ["Sandero", "Logan", "Duster"], CAMIONETA: ["Oroch"] },
  Peugeot: { AUTO: ["208", "308", "Partner"] },
  Honda: { AUTO: ["Civic", "HR-V", "Fit"], MOTO: ["Wave 110S", "CB 190R", "XR 150L"] },
  BMW: { AUTO: ["Serie 3"], CAMIONETA: ["X1"] },
  Yamaha: { MOTO: ["YBR 125", "FZ 25", "MT-03"] },
  Kawasaki: { MOTO: ["Ninja 400", "Z900"] },
  Zanella: { MOTO: ["ZB 110", "RX 150"] },
  Motomel: { MOTO: ["Skua 150", "CG 150"] },
  Trek: { BICICLETA: ["Marlin 7", "Domane"] },
  Oxford: { BICICLETA: ["Spider", "BMX Trick"] },
  Xiaomi: { MONOPATIN: ["Mi Electric Scooter 3", "Pro 2"] },
  Explora: { MONOPATIN: ["E9 Max", "S2 Pro"] },
  Quicksilver: { LANCHA: ["Activ 675", "605 Sundeck"] },
  Bavaria: { BARCO: ["Cruiser 34", "S30"] },
  Beneteau: { BARCO: ["Oceanis 35"] },
};

const SELLERS = [
  {
    key: "particular1",
    email: "juan.perez@example.com",
    fullName: "Juan Pérez",
    dni: "30111222",
    phone: "+5491122334455",
    accountType: "PARTICULAR" as const,
  },
  {
    key: "particular2",
    email: "maria.gomez@example.com",
    fullName: "María Gómez",
    dni: "28555666",
    phone: "+5491133445566",
    accountType: "PARTICULAR" as const,
  },
  {
    key: "agencia1",
    email: "contacto@nortemotors.com.ar",
    fullName: "Diego Fernández",
    dni: "27888999",
    phone: "+5491144556677",
    accountType: "AGENCIA" as const,
    business: {
      businessName: "Norte Motors",
      cuit: "30-71234567-1",
      city: "San Isidro",
      province: "Buenos Aires",
      address: "Av. Libertador 1234",
      description: "Agencia multimarca con más de 15 años en el mercado.",
    },
  },
  {
    key: "agencia2",
    email: "ventas@surautos.com.ar",
    fullName: "Lucía Ramírez",
    dni: "29222333",
    phone: "+5491155667788",
    accountType: "CONCESIONARIA" as const,
    business: {
      businessName: "Sur Autos",
      cuit: "30-71987654-2",
      city: "La Plata",
      province: "Buenos Aires",
      address: "Calle 7 N° 850",
      description: "Concesionaria oficial especializada en camionetas y usados certificados.",
    },
  },
  {
    key: "agencia3",
    email: "info@premiumcars.com.ar",
    fullName: "Martín Ibáñez",
    dni: "31444555",
    phone: "+5491166778899",
    accountType: "CONCESIONARIA" as const,
    business: {
      businessName: "Premium Cars",
      cuit: "30-71456789-3",
      city: "Córdoba",
      province: "Córdoba",
      address: "Ruta 20 Km 5.5",
      description: "Concesionaria oficial de vehículos premium y náutica de alta gama.",
    },
  },
];

type SeedListing = {
  vehicleType: VehicleType;
  brand: string;
  model: string;
  year: number;
  price: number;
  currency: Currency;
  mileageKm: number | null;
  status: ListingStatus;
  featured: boolean;
  seller: string;
  city: string;
  province: string;
  condition?: VehicleCondition;
  version?: string;
  negotiable?: boolean;
  trade?: boolean;
  financing?: boolean;
  contactAddress?: string;
};

const NOW = new Date();
const daysFromNow = (days: number) => new Date(NOW.getTime() + days * 24 * 60 * 60 * 1000);

// Modelos que en la vida real suelen ofrecerse con caja automática/asistida.
const ASSISTED_TRANSMISSION_MODELS = new Set(["Serie 3", "X1", "Tiguan Allspace", "SW4", "Civic", "HR-V"]);

function resolveCondition(item: SeedListing): VehicleCondition {
  if (item.condition) return item.condition;
  return item.mileageKm !== null && item.mileageKm < 800 ? "NUEVO" : "USADO";
}

function resolveTransmission(item: SeedListing): TransmissionType | null {
  if (item.vehicleType !== "AUTO" && item.vehicleType !== "CAMIONETA") return null;
  return ASSISTED_TRANSMISSION_MODELS.has(item.model) ? "ASISTIDA" : "MECANICA";
}

const LISTINGS: SeedListing[] = [
  { vehicleType: "AUTO", brand: "Ford", model: "Focus", year: 2022, price: 15200000, currency: "ARS", mileageKm: 34600, status: "ACTIVE", featured: true, seller: "particular1", city: "CABA", province: "Buenos Aires", version: "2.0 SE", negotiable: true },
  { vehicleType: "CAMIONETA", brand: "Volkswagen", model: "Tiguan Allspace", year: 2021, price: 28900000, currency: "ARS", mileageKm: 44200, status: "ACTIVE", featured: true, seller: "agencia1", city: "San Isidro", province: "Buenos Aires", version: "Highline", financing: true, contactAddress: "Av. Libertador 1234" },
  { vehicleType: "CAMIONETA", brand: "BMW", model: "X1", year: 2022, price: 22000, currency: "USD", mileageKm: 21500, status: "ACTIVE", featured: true, seller: "agencia3", city: "Córdoba", province: "Córdoba", version: "sDrive20i", financing: true, contactAddress: "Ruta 20 Km 5.5" },
  { vehicleType: "AUTO", brand: "Toyota", model: "Corolla", year: 2023, price: 21500000, currency: "ARS", mileageKm: 0, status: "ACTIVE", featured: true, seller: "agencia1", city: "San Isidro", province: "Buenos Aires", condition: "NUEVO", version: "XEI CVT", financing: true, contactAddress: "Av. Libertador 1234" },
  { vehicleType: "CAMIONETA", brand: "Toyota", model: "Hilux", year: 2020, price: 32000, currency: "USD", mileageKm: 68000, status: "ACTIVE", featured: true, seller: "agencia2", city: "La Plata", province: "Buenos Aires", financing: true },
  { vehicleType: "MOTO", brand: "Honda", model: "CB 190R", year: 2023, price: 3800000, currency: "ARS", mileageKm: 4200, status: "ACTIVE", featured: true, seller: "particular2", city: "Rosario", province: "Santa Fe", negotiable: true },

  { vehicleType: "AUTO", brand: "Volkswagen", model: "Gol", year: 2019, price: 8900000, currency: "ARS", mileageKm: 78000, status: "ACTIVE", featured: false, seller: "particular1", city: "CABA", province: "Buenos Aires", negotiable: true, trade: true },
  { vehicleType: "AUTO", brand: "Chevrolet", model: "Onix", year: 2021, price: 11800000, currency: "ARS", mileageKm: 39800, status: "ACTIVE", featured: false, seller: "particular2", city: "Rosario", province: "Santa Fe", version: "LTZ" },
  { vehicleType: "AUTO", brand: "Fiat", model: "Cronos", year: 2020, price: 9600000, currency: "ARS", mileageKm: 55200, status: "ACTIVE", featured: false, seller: "agencia1", city: "San Isidro", province: "Buenos Aires", version: "Drive", financing: true },
  { vehicleType: "AUTO", brand: "Renault", model: "Sandero", year: 2018, price: 7400000, currency: "ARS", mileageKm: 91000, status: "ACTIVE", featured: false, seller: "particular1", city: "CABA", province: "Buenos Aires", negotiable: true, trade: true },
  { vehicleType: "AUTO", brand: "Peugeot", model: "208", year: 2022, price: 13900000, currency: "ARS", mileageKm: 18700, status: "ACTIVE", featured: false, seller: "agencia2", city: "La Plata", province: "Buenos Aires", version: "Allure", financing: true },
  { vehicleType: "AUTO", brand: "Honda", model: "Civic", year: 2017, price: 12500000, currency: "ARS", mileageKm: 102000, status: "ACTIVE", featured: false, seller: "particular2", city: "Rosario", province: "Santa Fe", version: "EXL", trade: true },
  { vehicleType: "AUTO", brand: "Ford", model: "EcoSport", year: 2019, price: 10800000, currency: "ARS", mileageKm: 64500, status: "ACTIVE", featured: false, seller: "agencia1", city: "San Isidro", province: "Buenos Aires", financing: true },
  { vehicleType: "AUTO", brand: "BMW", model: "Serie 3", year: 2020, price: 27000, currency: "USD", mileageKm: 41000, status: "ACTIVE", featured: false, seller: "agencia3", city: "Córdoba", province: "Córdoba", version: "320i" },

  { vehicleType: "CAMIONETA", brand: "Ford", model: "Ranger", year: 2021, price: 29500, currency: "USD", mileageKm: 52000, status: "ACTIVE", featured: false, seller: "agencia2", city: "La Plata", province: "Buenos Aires", version: "XLT", financing: true },
  { vehicleType: "CAMIONETA", brand: "Chevrolet", model: "S10", year: 2019, price: 24800, currency: "USD", mileageKm: 88000, status: "ACTIVE", featured: false, seller: "particular1", city: "CABA", province: "Buenos Aires", negotiable: true },
  { vehicleType: "CAMIONETA", brand: "Fiat", model: "Toro", year: 2022, price: 20500000, currency: "ARS", mileageKm: 19800, status: "ACTIVE", featured: false, seller: "agencia1", city: "San Isidro", province: "Buenos Aires", financing: true },
  { vehicleType: "CAMIONETA", brand: "Renault", model: "Oroch", year: 2020, price: 16200000, currency: "ARS", mileageKm: 61200, status: "EXPIRED", featured: false, seller: "particular2", city: "Rosario", province: "Santa Fe" },
  { vehicleType: "CAMIONETA", brand: "Toyota", model: "SW4", year: 2018, price: 38000, currency: "USD", mileageKm: 95000, status: "SOLD", featured: false, seller: "agencia3", city: "Córdoba", province: "Córdoba" },

  { vehicleType: "MOTO", brand: "Yamaha", model: "MT-03", year: 2022, price: 6200000, currency: "ARS", mileageKm: 8900, status: "ACTIVE", featured: false, seller: "particular1", city: "CABA", province: "Buenos Aires", negotiable: true },
  { vehicleType: "MOTO", brand: "Zanella", model: "RX 150", year: 2021, price: 2100000, currency: "ARS", mileageKm: 15400, status: "ACTIVE", featured: false, seller: "particular2", city: "Rosario", province: "Santa Fe" },
  { vehicleType: "MOTO", brand: "Motomel", model: "Skua 150", year: 2020, price: 1650000, currency: "ARS", mileageKm: 22000, status: "ACTIVE", featured: false, seller: "agencia2", city: "La Plata", province: "Buenos Aires", financing: true },
  { vehicleType: "MOTO", brand: "Kawasaki", model: "Ninja 400", year: 2023, price: 9800000, currency: "ARS", mileageKm: 0, status: "ACTIVE", featured: false, seller: "agencia3", city: "Córdoba", province: "Córdoba", condition: "NUEVO", financing: true },
  { vehicleType: "MOTO", brand: "Honda", model: "Wave 110S", year: 2019, price: 1450000, currency: "ARS", mileageKm: 34000, status: "EXPIRED", featured: false, seller: "particular1", city: "CABA", province: "Buenos Aires" },

  { vehicleType: "BICICLETA", brand: "Trek", model: "Marlin 7", year: 2023, price: 980000, currency: "ARS", mileageKm: null, status: "ACTIVE", featured: false, seller: "particular2", city: "Rosario", province: "Santa Fe", negotiable: true },
  { vehicleType: "BICICLETA", brand: "Oxford", model: "BMX Trick", year: 2022, price: 320000, currency: "ARS", mileageKm: null, status: "ACTIVE", featured: false, seller: "particular1", city: "CABA", province: "Buenos Aires" },
  { vehicleType: "BICICLETA", brand: "Trek", model: "Domane", year: 2021, price: 1450000, currency: "ARS", mileageKm: null, status: "SOLD", featured: false, seller: "agencia1", city: "San Isidro", province: "Buenos Aires" },

  { vehicleType: "MONOPATIN", brand: "Xiaomi", model: "Mi Electric Scooter 3", year: 2023, price: 410000, currency: "ARS", mileageKm: null, status: "ACTIVE", featured: false, seller: "particular2", city: "Rosario", province: "Santa Fe", condition: "NUEVO" },
  { vehicleType: "MONOPATIN", brand: "Explora", model: "E9 Max", year: 2022, price: 350000, currency: "ARS", mileageKm: null, status: "ACTIVE", featured: false, seller: "particular1", city: "CABA", province: "Buenos Aires" },

  { vehicleType: "LANCHA", brand: "Quicksilver", model: "Activ 675", year: 2020, price: 45000, currency: "USD", mileageKm: null, status: "ACTIVE", featured: false, seller: "agencia3", city: "Córdoba", province: "Córdoba", financing: true },
  { vehicleType: "LANCHA", brand: "Quicksilver", model: "605 Sundeck", year: 2018, price: 31000, currency: "USD", mileageKm: null, status: "ACTIVE", featured: false, seller: "agencia3", city: "Córdoba", province: "Córdoba" },

  { vehicleType: "BARCO", brand: "Bavaria", model: "Cruiser 34", year: 2017, price: 98000, currency: "USD", mileageKm: null, status: "ACTIVE", featured: false, seller: "agencia3", city: "Córdoba", province: "Córdoba" },
  { vehicleType: "BARCO", brand: "Beneteau", model: "Oceanis 35", year: 2019, price: 145000, currency: "USD", mileageKm: null, status: "ACTIVE", featured: false, seller: "agencia3", city: "Córdoba", province: "Córdoba", financing: true },
];

async function main() {
  console.log("Seed: usuarios...");
  const passwordHash = await bcrypt.hash("Seed1234!", 12);
  const userByKey = new Map<string, string>();

  for (const seller of SELLERS) {
    const user = await prisma.user.upsert({
      where: { email: seller.email },
      update: {
        accountType: seller.accountType,
        fullName: seller.fullName,
        phone: seller.phone,
      },
      create: {
        email: seller.email,
        passwordHash,
        accountType: seller.accountType,
        fullName: seller.fullName,
        dni: seller.dni,
        phone: seller.phone,
      },
    });
    userByKey.set(seller.key, user.id);

    if ("business" in seller && seller.business) {
      await prisma.agencyProfile.upsert({
        where: { userId: user.id },
        update: {
          businessName: seller.business.businessName,
          city: seller.business.city,
          province: seller.business.province,
          address: seller.business.address,
          description: seller.business.description,
        },
        create: {
          userId: user.id,
          businessName: seller.business.businessName,
          cuit: seller.business.cuit,
          city: seller.business.city,
          province: seller.business.province,
          address: seller.business.address,
          description: seller.business.description,
        },
      });
    }
  }

  console.log("Seed: taxonomia (marcas y modelos)...");
  const modelByKey = new Map<string, string>(); // `${brand}::${vehicleType}::${model}` -> modelId

  for (const [brandName, byType] of Object.entries(TAXONOMY)) {
    const brand = await prisma.brand.upsert({
      where: { slug: slugify(brandName) },
      update: {},
      create: { name: brandName, slug: slugify(brandName) },
    });

    for (const [vehicleType, models] of Object.entries(byType) as [VehicleType, string[]][]) {
      for (const modelName of models) {
        const model = await prisma.model.upsert({
          where: { brandId_vehicleType_name: { brandId: brand.id, vehicleType, name: modelName } },
          update: {},
          create: {
            name: modelName,
            slug: slugify(modelName),
            vehicleType,
            brandId: brand.id,
          },
        });
        modelByKey.set(`${brandName}::${vehicleType}::${modelName}`, model.id);
      }
    }
  }

  console.log("Seed: publicaciones...");
  for (const [index, item] of LISTINGS.entries()) {
    const modelId = modelByKey.get(`${item.brand}::${item.vehicleType}::${item.model}`);
    const brand = await prisma.brand.findUniqueOrThrow({ where: { slug: slugify(item.brand) } });
    if (!modelId) throw new Error(`Modelo no encontrado en taxonomía: ${item.brand} ${item.model}`);

    const title = `${item.brand} ${item.model} ${item.year}`;
    const slug = `${slugify(title)}-${index}`;
    const userId = userByKey.get(item.seller);
    if (!userId) throw new Error(`Vendedor no encontrado: ${item.seller}`);

    const sharedData = {
      vehicleType: item.vehicleType,
      brandId: brand.id,
      modelId,
      year: item.year,
      title,
      version: item.version,
      description: `${title} en excelente estado. Publicación de prueba generada por el seed de tuAuto.`,
      condition: resolveCondition(item),
      transmission: resolveTransmission(item),
      price: item.price,
      currency: item.currency,
      priceNegotiable: item.negotiable ?? false,
      acceptsTrade: item.trade ?? false,
      acceptsFinancing: item.financing ?? false,
      mileageKm: item.mileageKm ?? undefined,
      city: item.city,
      province: item.province,
      contactAddress: item.contactAddress,
      status: item.status,
      featured: item.featured,
      featuredUntil: item.featured ? daysFromNow(21) : null,
      expiresAt: item.status === "EXPIRED" ? daysFromNow(-3) : daysFromNow(60),
      soldAt: item.status === "SOLD" ? daysFromNow(-10) : null,
    };

    const listing = await prisma.listing.upsert({
      where: { slug },
      update: sharedData,
      create: {
        ...sharedData,
        slug,
        userId,
        publishedAt: NOW,
        images: {
          create: [0, 1, 2].map((n) => ({
            url: `https://picsum.photos/seed/tuauto-${slug}-${n}/800/600`,
            order: n,
          })),
        },
      },
    });
    void listing;
  }

  console.log("Seed: planes...");
  await prisma.plan.upsert({
    where: { code: "FEATURE_15D" },
    update: {},
    create: { code: "FEATURE_15D", name: "Destacado 15 días", price: 5000, durationDays: 15 },
  });
  await prisma.plan.upsert({
    where: { code: "FEATURE_30D" },
    update: {},
    create: { code: "FEATURE_30D", name: "Destacado 30 días", price: 9000, durationDays: 30 },
  });
  await prisma.plan.upsert({
    where: { code: "FEATURE_LISTING" },
    update: {},
    // Plan usado por la pantalla dedicada "Destacar anuncio" (por publicación,
    // desde "Mis publicaciones"). Precio provisorio, se va a ajustar luego.
    create: { code: "FEATURE_LISTING", name: "Destacar anuncio", price: 9999, durationDays: 30 },
  });
  // Packs de publicaciones (precios provisorios, se van a ajustar luego).
  await prisma.plan.upsert({
    where: { code: "PUBLICATIONS_PACK_1" },
    update: {},
    create: { code: "PUBLICATIONS_PACK_1", name: "1 publicación", price: 2000, quantity: 1 },
  });
  await prisma.plan.upsert({
    where: { code: "PUBLICATIONS_PACK_5" },
    update: {},
    create: { code: "PUBLICATIONS_PACK_5", name: "5 publicaciones", price: 8000, quantity: 5 },
  });
  await prisma.plan.upsert({
    where: { code: "PUBLICATIONS_PACK_10" },
    update: {},
    create: { code: "PUBLICATIONS_PACK_10", name: "10 publicaciones", price: 15000, quantity: 10 },
  });
  await prisma.plan.upsert({
    where: { code: "PUBLICATIONS_PACK_20" },
    update: {},
    create: { code: "PUBLICATIONS_PACK_20", name: "20 publicaciones", price: 25000, quantity: 20 },
  });
  await prisma.plan.upsert({
    where: { code: "AGENCY_MONTHLY" },
    update: {},
    create: {
      code: "AGENCY_MONTHLY",
      name: "Suscripción concesionaria mensual",
      price: 25000,
      durationDays: 30,
    },
  });

  console.log("Seed completado.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
