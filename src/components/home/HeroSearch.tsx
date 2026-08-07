"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { VEHICLE_TYPES, CONDITION_OPTIONS, ACCOUNT_TYPE_OPTIONS } from "@/lib/constants";
import { useVehicleTaxonomy } from "@/hooks/useVehicleTaxonomy";
import type { AccountType, VehicleType } from "@/generated/prisma/client";

export function HeroSearch() {
  const router = useRouter();
  const [tipo, setTipo] = React.useState<VehicleType | "">("");
  const [marca, setMarca] = React.useState("");
  const [modelo, setModelo] = React.useState("");
  const [anio, setAnio] = React.useState("");
  const [condicion, setCondicion] = React.useState("");
  const [vendedor, setVendedor] = React.useState<AccountType | "">("");

  const { brands, models, years } = useVehicleTaxonomy(tipo, marca, modelo);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (tipo) params.set("tipo", tipo);
    if (marca) params.set("marca", marca);
    if (modelo) params.set("modelo", modelo);
    if (anio) params.set("anio", anio);
    if (condicion) params.set("condicion", condicion);
    if (vendedor) params.set("vendedor", vendedor);
    router.push(`/catalogo${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-2xl bg-surface p-4 shadow-card sm:flex-row sm:flex-wrap sm:items-end"
    >
      <div className="sm:flex-1 sm:min-w-36">
        <label htmlFor="hero-tipo" className="mb-1.5 block text-xs font-medium text-muted-foreground">
          Tipo de vehículo
        </label>
        <Select
          id="hero-tipo"
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

      <div className="sm:flex-1 sm:min-w-36">
        <label htmlFor="hero-marca" className="mb-1.5 block text-xs font-medium text-muted-foreground">
          Marca
        </label>
        <Select
          id="hero-marca"
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

      <div className="sm:flex-1 sm:min-w-36">
        <label htmlFor="hero-modelo" className="mb-1.5 block text-xs font-medium text-muted-foreground">
          Modelo
        </label>
        <Select id="hero-modelo" value={modelo} onChange={(e) => setModelo(e.target.value)} disabled={!marca}>
          <option value="">Todos los modelos</option>
          {models.map((m) => (
            <option key={m.id} value={m.slug}>
              {m.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="sm:flex-1 sm:min-w-28">
        <label htmlFor="hero-anio" className="mb-1.5 block text-xs font-medium text-muted-foreground">
          Año
        </label>
        <Select id="hero-anio" value={anio} onChange={(e) => setAnio(e.target.value)}>
          <option value="">Cualquier año</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </Select>
      </div>

      <div className="sm:flex-1 sm:min-w-28">
        <label htmlFor="hero-condicion" className="mb-1.5 block text-xs font-medium text-muted-foreground">
          Condición
        </label>
        <Select id="hero-condicion" value={condicion} onChange={(e) => setCondicion(e.target.value)}>
          <option value="">Nuevo o usado</option>
          {CONDITION_OPTIONS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="sm:flex-1 sm:min-w-36">
        <label htmlFor="hero-vendedor" className="mb-1.5 block text-xs font-medium text-muted-foreground">
          Tipo de vendedor
        </label>
        <Select
          id="hero-vendedor"
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

      <Button type="submit" size="lg" className="w-full sm:w-auto">
        Buscar
      </Button>
    </form>
  );
}
