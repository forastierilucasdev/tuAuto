export type VehicleCardData = {
  slug: string;
  title: string;
  price: number;
  currency: "ARS" | "USD";
  year: number;
  mileageKm: number;
  imageUrl: string;
  featured: boolean;
  vehicleType: string;
};
