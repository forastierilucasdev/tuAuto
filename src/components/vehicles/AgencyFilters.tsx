"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import type { AgencyAccountType } from "@/server/data/agencies";

// Solo Agencia/Concesionaria tienen sentido acá (a diferencia del filtro
// "Tipo de vendedor" del catálogo, que también incluye Particular) — con
// etiquetas en plural, consistente con los encabezados de la página
// ("Todas las concesionarias" / "Todas las agencias").
const TIPO_OPTIONS: { value: AgencyAccountType; label: string }[] = [
  { value: "CONCESIONARIA", label: "Concesionarias" },
  { value: "AGENCIA", label: "Agencias" },
];

export function AgencyFilters({ onApply }: { onApply?: () => void } = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [provincia, setProvincia] = React.useState(searchParams.get("provincia") ?? "");
  const [localidad, setLocalidad] = React.useState(searchParams.get("localidad") ?? "");
  const [tipo, setTipo] = React.useState<AgencyAccountType | "">(
    (searchParams.get("tipo") as AgencyAccountType | null) ?? ""
  );

  function applyFilters() {
    const params = new URLSearchParams();
    if (provincia) params.set("provincia", provincia);
    if (localidad) params.set("localidad", localidad);
    if (tipo) params.set("tipo", tipo);
    router.push(params.toString() ? `${pathname}?${params.toString()}` : pathname);
    onApply?.();
  }

  function clearFilters() {
    setProvincia("");
    setLocalidad("");
    setTipo("");
    router.push(pathname);
    onApply?.();
  }

  return (
    <div className="space-y-5 self-start rounded-2xl border border-border bg-surface p-5 shadow-card">
      <div>
        <Label htmlFor="f-tipo">Tipo</Label>
        <Select id="f-tipo" value={tipo} onChange={(e) => setTipo(e.target.value as AgencyAccountType | "")}>
          <option value="">Todos</option>
          {TIPO_OPTIONS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="f-provincia">Provincia</Label>
        <Input
          id="f-provincia"
          value={provincia}
          onChange={(e) => setProvincia(e.target.value)}
          placeholder="Ej: Buenos Aires"
        />
      </div>

      <div>
        <Label htmlFor="f-localidad">Localidad</Label>
        <Input
          id="f-localidad"
          value={localidad}
          onChange={(e) => setLocalidad(e.target.value)}
          placeholder="Ej: La Plata"
        />
      </div>

      <div className="flex gap-2 pt-1">
        <Button type="button" onClick={applyFilters} className="flex-1">
          Aplicar filtros
        </Button>
        <Button type="button" variant="outline" onClick={clearFilters}>
          Limpiar
        </Button>
      </div>
    </div>
  );
}
