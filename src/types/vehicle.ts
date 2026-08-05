export type VehicleCardData = {
  slug: string;
  title: string;
  price: number;
  currency: "ARS" | "USD";
  year: number;
  mileageKm: number | null;
  imageUrl: string;
  featured: boolean;
  vehicleType: string;
  condition: "NUEVO" | "USADO";
  city: string | null;
  province: string | null;
  sellerAccountType: "PARTICULAR" | "AGENCIA" | "CONCESIONARIA";
};
