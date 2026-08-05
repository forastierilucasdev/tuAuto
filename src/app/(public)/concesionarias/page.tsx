import type { Metadata } from "next";
import Link from "next/link";
import { Building2, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { getAgencies } from "@/server/data/agencies";

export const metadata: Metadata = { title: "Concesionarias" };

export const dynamic = "force-dynamic";

export default async function ConcesionariasPage() {
  const agencies = await getAgencies();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-navy sm:text-3xl">Concesionarias</h1>
      <p className="mt-1 text-muted-foreground">Agencias y concesionarias que publican en tuAuto.</p>

      {agencies.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
          Todavía no hay concesionarias registradas.
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {agencies.map((agency) => (
            <Link key={agency.userId} href={`/concesionarias/${agency.userId}`}>
              <Card className="h-full transition-shadow hover:shadow-card-hover">
                <CardContent className="space-y-2 pt-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <p className="font-semibold text-navy">{agency.businessName}</p>
                  {(agency.city || agency.province) && (
                    <p className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      {[agency.city, agency.province].filter(Boolean).join(", ")}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {agency.activeListings} publicaci{agency.activeListings === 1 ? "ón activa" : "ones activas"}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
