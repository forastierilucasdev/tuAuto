"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

// Lista provisoria para la búsqueda rápida del hero. Se reemplaza por la
// taxonomía real (tabla Brand) una vez conectada la base de datos (Fase 2/3).
const BRANDS = [
  "Toyota",
  "Volkswagen",
  "Ford",
  "Chevrolet",
  "Fiat",
  "Renault",
  "Peugeot",
  "Honda",
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 20 }, (_, i) => CURRENT_YEAR - i);

export function HeroSearch() {
  const router = useRouter();
  const [brand, setBrand] = React.useState("");
  const [year, setYear] = React.useState("");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (brand) params.set("marca", brand);
    if (year) params.set("anio", year);
    router.push(`/catalogo${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-3 rounded-2xl bg-surface p-4 shadow-card sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end"
    >
      <div>
        <label htmlFor="hero-marca" className="mb-1.5 block text-xs font-medium text-muted-foreground">
          Marca
        </label>
        <Select id="hero-marca" value={brand} onChange={(e) => setBrand(e.target.value)}>
          <option value="">Todas las marcas</option>
          {BRANDS.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <label htmlFor="hero-modelo" className="mb-1.5 block text-xs font-medium text-muted-foreground">
          Modelo
        </label>
        <Select id="hero-modelo" disabled defaultValue="">
          <option value="">Todos los modelos</option>
        </Select>
      </div>

      <div>
        <label htmlFor="hero-anio" className="mb-1.5 block text-xs font-medium text-muted-foreground">
          Año
        </label>
        <Select id="hero-anio" value={year} onChange={(e) => setYear(e.target.value)}>
          <option value="">Cualquier año</option>
          {YEARS.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </Select>
      </div>

      <Button type="submit" size="lg" className="w-full sm:w-auto">
        Buscar Vehículos
      </Button>
    </form>
  );
}
