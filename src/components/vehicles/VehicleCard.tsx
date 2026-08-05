import Image from "next/image";
import Link from "next/link";
import { Building2, Gauge, MapPin, Tag, User } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatKm } from "@/lib/utils";
import { accountTypeLabel, conditionLabel, isBusinessAccountType } from "@/lib/constants";
import type { VehicleCardData } from "@/types/vehicle";

export function VehicleCard({ vehicle }: { vehicle: VehicleCardData }) {
  const location = [vehicle.province, vehicle.city].filter(Boolean).join(" - ");
  const SellerIcon = isBusinessAccountType(vehicle.sellerAccountType) ? Building2 : User;

  return (
    <Link href={`/catalogo/${vehicle.slug}`} className="group block h-full">
      <Card className="flex h-full flex-col overflow-hidden p-0 transition-shadow hover:shadow-card-hover">
        <div className="relative aspect-4/3 w-full overflow-hidden bg-surface-muted">
          <Image
            src={vehicle.imageUrl}
            alt={vehicle.title}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {vehicle.featured && (
            <Badge variant="featured" className="absolute left-3 top-3">
              Destacado
            </Badge>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2 p-4">
          <p className="truncate font-semibold text-navy">{vehicle.title}</p>
          <p className="text-lg font-bold text-primary">
            {formatCurrency(vehicle.price, vehicle.currency)}
          </p>
          <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Gauge className="h-3.5 w-3.5" />
              {formatKm(vehicle.mileageKm)}
            </span>
            {location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {location}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <SellerIcon className="h-3.5 w-3.5" />
              {accountTypeLabel(vehicle.sellerAccountType)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Tag className="h-3.5 w-3.5" />
              {conditionLabel(vehicle.condition)} · {vehicle.year}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
