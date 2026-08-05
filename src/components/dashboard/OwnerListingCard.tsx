import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button, buttonVariants } from "@/components/ui/Button";
import { formatCurrency, formatKm } from "@/lib/utils";
import { markListingSoldAction, reactivateListingAction } from "@/server/actions/listing.actions";
import type { OwnerListingData } from "@/server/data/listings";

const STATUS_LABEL: Record<OwnerListingData["status"], string> = {
  DRAFT: "Borrador",
  ACTIVE: "Activa",
  EXPIRED: "Vencida",
  SOLD: "Vendida",
};

export function OwnerListingCard({ listing }: { listing: OwnerListingData }) {
  return (
    <Card className="flex h-full flex-col overflow-hidden p-0">
      <div className="relative aspect-4/3 w-full bg-surface-muted">
        <Image src={listing.imageUrl} alt={listing.title} fill sizes="300px" className="object-cover" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {listing.featured && <Badge variant="featured">Destacado</Badge>}
          <Badge variant={listing.status === "ACTIVE" ? "success" : listing.status === "SOLD" ? "default" : "danger"}>
            {STATUS_LABEL[listing.status]}
          </Badge>
        </div>
      </div>
      <CardContent className="flex flex-1 flex-col gap-2 pt-4">
        <p className="truncate font-semibold text-navy">{listing.title}</p>
        <p className="font-bold text-primary">{formatCurrency(listing.price, listing.currency)}</p>
        <p className="text-xs text-muted-foreground">
          {formatKm(listing.mileageKm)} · {listing.year}
        </p>

        <div className="mt-auto flex flex-wrap gap-2 pt-2">
          <Link
            href={`/dashboard/publicaciones/${listing.id}/editar`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Editar
          </Link>
          {listing.status === "ACTIVE" ? (
            <form action={markListingSoldAction}>
              <input type="hidden" name="listingId" value={listing.id} />
              <Button type="submit" variant="ghost" size="sm">
                Marcar vendido
              </Button>
            </form>
          ) : listing.status !== "SOLD" ? (
            <form action={reactivateListingAction}>
              <input type="hidden" name="listingId" value={listing.id} />
              <Button type="submit" variant="ghost" size="sm">
                Reactivar
              </Button>
            </form>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
