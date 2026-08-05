"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import { VEHICLE_TYPES, CONDITION_OPTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useVehicleTaxonomy } from "@/hooks/useVehicleTaxonomy";
import type { VehicleType } from "@/generated/prisma/client";

export function CatalogFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [tipo, setTipo] = React.useState<VehicleType | "">(
    (searchParams.get("tipo") as VehicleType | null) ?? ""
  );
  const [marca, setMarca] = React.useState(searchParams.get("marca") ?? "");
  const [modelo, setModelo] = React.useState(searchParams.get("modelo") ?? "");
  const [anio, setAnio] = React.useState(searchParams.get("anio") ?? "");
  const [condicion, setCondicion] = React.useState(searchParams.get("condicion") ?? "");
  const [moneda, setMoneda] = React.useState(searchParams.get("moneda") ?? "ARS");
  const [precioMin, setPrecioMin] = React.useState(searchParams.get("precioMin") ?? "");
  const [precioMax, setPrecioMax] = React.useState(searchParams.get("precioMax") ?? "");
  const [kmMin, setKmMin] = React.useState(searchParams.get("kmMin") ?? "");
  const [kmMax, setKmMax] = React.useState(searchParams.get("kmMax") ?? "");

  const { brands, models, years } = useVehicleTaxonomy(tipo, marca, modelo);

  function applyFilters() {
    const params = new URLSearchParams();
    if (tipo) params.set("tipo", tipo);
    if (marca) params.set("marca", marca);
    if (modelo) params.set("modelo", modelo);
    if (anio) params.set("anio", anio);
    if (condicion) params.set("condicion", condicion);
    if (precioMin || precioMax) params.set("moneda", moneda);
    if (precioMin) params.set("precioMin", precioMin);
    if (precioMax) params.set("precioMax", precioMax);
    if (kmMin) params.set("kmMin", kmMin);
    if (kmMax) params.set("kmMax", kmMax);
    router.push(params.toString() ? `${pathname}?${params.toString()}` : pathname);
  }

  function clearFilters() {
    setTipo("");
    setMarca("");
    setModelo("");
    setAnio("");
    setCondicion("");
    setMoneda("ARS");
    setPrecioMin("");
    setPrecioMax("");
    setKmMin("");
    setKmMax("");
    router.push(pathname);
  }

  return (
    <div className="space-y-5 self-start rounded-2xl border border-border bg-surface p-5 shadow-card">
      <div>
        <Label htmlFor="f-tipo">Tipo de vehículo</Label>
        <Select
          id="f-tipo"
          value={tipo}
          onChange={(e) => {
            setTipo(e.target.value as VehicleType | "");
            setMarca("");
            setModelo("");
          }}
        >
          <option value="">Todos los tipos</option>
          {VEHICLE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="f-marca">Marca</Label>
        <Select
          id="f-marca"
          value={marca}
          onChange={(e) => {
            setMarca(e.target.value);
            setModelo("");
          }}
        >
          <option value="">Todas las marcas</option>
          {brands.map((b) => (
            <option key={b.id} value={b.slug}>
              {b.name}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="f-modelo">Modelo</Label>
        <Select
          id="f-modelo"
          value={modelo}
          onChange={(e) => setModelo(e.target.value)}
          disabled={!marca}
        >
          <option value="">Todos los modelos</option>
          {models.map((m) => (
            <option key={m.id} value={m.slug}>
              {m.name}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="f-anio">Año</Label>
        <Select id="f-anio" value={anio} onChange={(e) => setAnio(e.target.value)}>
          <option value="">Cualquier año</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="f-condicion">Condición</Label>
        <Select id="f-condicion" value={condicion} onChange={(e) => setCondicion(e.target.value)}>
          <option value="">Nuevo o usado</option>
          {CONDITION_OPTIONS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </Select>
      </div>

      <hr className="border-border" />

      <div>
        <Label>Precio</Label>
        <div className="mb-2 flex gap-1">
          {(["ARS", "USD"] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setMoneda(c)}
              className={cn(
                "rounded-md border px-2 py-1 text-xs font-medium",
                moneda === c ? "border-primary text-primary" : "border-border text-muted-foreground"
              )}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            inputMode="numeric"
            placeholder="Mín"
            value={precioMin}
            onChange={(e) => setPrecioMin(e.target.value.replace(/\D/g, ""))}
          />
          <Input
            inputMode="numeric"
            placeholder="Máx"
            value={precioMax}
            onChange={(e) => setPrecioMax(e.target.value.replace(/\D/g, ""))}
          />
        </div>
      </div>

      <div>
        <Label>Kilometraje</Label>
        <div className="flex gap-2">
          <Input
            inputMode="numeric"
            placeholder="Mín"
            value={kmMin}
            onChange={(e) => setKmMin(e.target.value.replace(/\D/g, ""))}
          />
          <Input
            inputMode="numeric"
            placeholder="Máx"
            value={kmMax}
            onChange={(e) => setKmMax(e.target.value.replace(/\D/g, ""))}
          />
        </div>
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
