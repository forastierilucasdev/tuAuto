"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import { VEHICLE_TYPES, CONDITION_OPTIONS, ACCOUNT_TYPE_OPTIONS, PROVINCIAS, mileageUnitFor } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useVehicleTaxonomy } from "@/hooks/useVehicleTaxonomy";
import type { AccountType, VehicleType } from "@/generated/prisma/client";

export function CatalogFilters({ onApply }: { onApply?: () => void } = {}) {
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
  const [vendedor, setVendedor] = React.useState<AccountType | "">(
    (searchParams.get("vendedor") as AccountType | null) ?? ""
  );
  const [provincia, setProvincia] = React.useState(searchParams.get("provincia") ?? "");
  const [localidad, setLocalidad] = React.useState(searchParams.get("localidad") ?? "");
  const [moneda, setMoneda] = React.useState(searchParams.get("moneda") ?? "ARS");
  const [precioMin, setPrecioMin] = React.useState(searchParams.get("precioMin") ?? "");
  const [precioMax, setPrecioMax] = React.useState(searchParams.get("precioMax") ?? "");
  const [kmMin, setKmMin] = React.useState(searchParams.get("kmMin") ?? "");
  const [kmMax, setKmMax] = React.useState(searchParams.get("kmMax") ?? "");

  const { brands, models, years } = useVehicleTaxonomy(tipo, marca, modelo);
  // Sin tipo elegido (todos mezclados) se muestra el filtro genérico de Km;
  // con un tipo elegido, se adapta (Horas para lanchas/barcos, oculto para
  // motos/bicicletas) — ver lib/constants.ts.
  const mileageUnit = tipo ? mileageUnitFor(tipo) : "km";

  function applyFilters() {
    const params = new URLSearchParams();
    if (tipo) params.set("tipo", tipo);
    if (marca) params.set("marca", marca);
    if (modelo) params.set("modelo", modelo);
    if (anio) params.set("anio", anio);
    if (condicion) params.set("condicion", condicion);
    if (vendedor) params.set("vendedor", vendedor);
    if (provincia) params.set("provincia", provincia);
    if (localidad) params.set("localidad", localidad);
    if (precioMin || precioMax) params.set("moneda", moneda);
    if (precioMin) params.set("precioMin", precioMin);
    if (precioMax) params.set("precioMax", precioMax);
    if (kmMin) params.set("kmMin", kmMin);
    if (kmMax) params.set("kmMax", kmMax);
    router.push(params.toString() ? `${pathname}?${params.toString()}` : pathname);
    onApply?.();
  }

  function clearFilters() {
    setTipo("");
    setMarca("");
    setModelo("");
    setAnio("");
    setCondicion("");
    setVendedor("");
    setProvincia("");
    setLocalidad("");
    setMoneda("ARS");
    setPrecioMin("");
    setPrecioMax("");
    setKmMin("");
    setKmMax("");
    router.push(pathname);
    onApply?.();
  }

  return (
    <div className="space-y-5 self-start rounded-2xl border border-border bg-surface p-5 shadow-card">
      <div>
        <Label htmlFor="f-tipo">Tipo de vehículo</Label>
        <Select
          id="f-tipo"
          value={tipo}
          onChange={(e) => {
            const nextTipo = e.target.value as VehicleType | "";
            setTipo(nextTipo);
            setMarca("");
            setModelo("");
            // Si el nuevo tipo no usa Km/Horas (moto, bicicleta), un filtro
            // de Km cargado de antes quedaría invisible pero seguiría
            // aplicando — se limpia para evitar ese filtro fantasma. "Todos
            // los tipos" (nextTipo vacío) sí conserva el filtro genérico.
            if (nextTipo && !mileageUnitFor(nextTipo)) {
              setKmMin("");
              setKmMax("");
            }
          }}
        >
          <option value="">Todos los tipos</option>
          {VEHICLE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.labelPlural}
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

      <div>
        <Label htmlFor="f-vendedor">Tipo de vendedor</Label>
        <Select
          id="f-vendedor"
          value={vendedor}
          onChange={(e) => setVendedor(e.target.value as AccountType | "")}
        >
          <option value="">Todos los vendedores</option>
          {ACCOUNT_TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="f-provincia">Provincia</Label>
        <Select id="f-provincia" value={provincia} onChange={(e) => setProvincia(e.target.value)}>
          <option value="">Todas las provincias</option>
          {PROVINCIAS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="f-localidad">Localidad</Label>
        <Input
          id="f-localidad"
          placeholder="Ej: Mar del Plata"
          value={localidad}
          onChange={(e) => setLocalidad(e.target.value)}
        />
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

      {mileageUnit && (
        <div>
          <Label>{mileageUnit === "km" ? "Kilometraje" : "Horas de uso"}</Label>
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
      )}

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
