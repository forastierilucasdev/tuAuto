"use client";

import * as React from "react";
import { useActionState } from "react";
import Image from "next/image";
import { ImagePlus } from "lucide-react";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { FieldError } from "@/components/ui/FieldError";
import { VEHICLE_TYPES } from "@/lib/constants";
import {
  getBrandsForTypeAction,
  getModelsForBrandAction,
} from "@/server/actions/taxonomy.actions";
import {
  createListingAction,
  updateListingAction,
  type ListingActionState,
} from "@/server/actions/listing.actions";
import type { VehicleType } from "@/generated/prisma/client";

type Option = { id: string; name: string; slug: string };

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 40 }, (_, i) => CURRENT_YEAR + 1 - i);

type ListingFormProps =
  | { mode: "create" }
  | {
      mode: "edit";
      listingId: string;
      vehicleTypeLabel: string;
      brandName: string;
      modelName: string;
      year: number;
      defaultValues: {
        title: string;
        description: string;
        price: number;
        currency: "ARS" | "USD";
        mileageKm: number | null;
        city: string | null;
        province: string | null;
      };
      existingImages: { id: string; url: string }[];
    };

const initialState: ListingActionState = undefined;

export function ListingForm(props: ListingFormProps) {
  const action = props.mode === "create" ? createListingAction : updateListingAction;
  const [state, formAction, pending] = useActionState(action, initialState);

  const [vehicleType, setVehicleType] = React.useState<VehicleType | "">("");
  const [brand, setBrand] = React.useState("");
  const [model, setModel] = React.useState("");
  const [brands, setBrands] = React.useState<Option[]>([]);
  const [models, setModels] = React.useState<Option[]>([]);
  const [previews, setPreviews] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (props.mode !== "create") return;
    getBrandsForTypeAction(vehicleType || undefined).then(setBrands);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleType]);

  React.useEffect(() => {
    if (props.mode !== "create") return;
    const request = brand ? getModelsForBrandAction(brand, vehicleType || undefined) : Promise.resolve([]);
    request.then(setModels);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brand, vehicleType]);

  function handleFilesChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    setPreviews(files.map((file) => URL.createObjectURL(file)));
  }

  return (
    <form action={formAction} className="max-w-2xl space-y-6">
      {props.mode === "edit" && <input type="hidden" name="listingId" value={props.listingId} />}

      {props.mode === "create" ? (
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="vehicleType">Tipo de vehículo</Label>
            <Select
              id="vehicleType"
              name="vehicleType"
              value={vehicleType}
              onChange={(e) => {
                setVehicleType(e.target.value as VehicleType | "");
                setBrand("");
                setModel("");
              }}
              required
            >
              <option value="">Elegí un tipo</option>
              {VEHICLE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
            <FieldError messages={state?.fieldErrors?.vehicleType} />
          </div>

          <div>
            <Label htmlFor="year">Año</Label>
            <Select id="year" name="year" defaultValue="" required>
              <option value="">Elegí un año</option>
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </Select>
            <FieldError messages={state?.fieldErrors?.year} />
          </div>

          <div>
            <Label htmlFor="brandSlug">Marca</Label>
            <Select
              id="brandSlug"
              name="brandSlug"
              value={brand}
              onChange={(e) => {
                setBrand(e.target.value);
                setModel("");
              }}
              disabled={!vehicleType}
              required
            >
              <option value="">Elegí una marca</option>
              {brands.map((b) => (
                <option key={b.id} value={b.slug}>
                  {b.name}
                </option>
              ))}
            </Select>
            <FieldError messages={state?.fieldErrors?.brandSlug} />
          </div>

          <div>
            <Label htmlFor="modelSlug">Modelo</Label>
            <Select
              id="modelSlug"
              name="modelSlug"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              disabled={!brand}
              required
            >
              <option value="">Elegí un modelo</option>
              {models.map((m) => (
                <option key={m.id} value={m.slug}>
                  {m.name}
                </option>
              ))}
            </Select>
            <FieldError messages={state?.fieldErrors?.modelSlug} />
          </div>
        </div>
      ) : (
        <div className="rounded-lg bg-surface-muted p-3 text-sm text-muted-foreground">
          {props.vehicleTypeLabel} · {props.brandName} {props.modelName} · {props.year}
          <p className="mt-1 text-xs">
            El tipo, marca, modelo y año no se pueden editar. Contactá a soporte si necesitás
            corregirlos.
          </p>
        </div>
      )}

      <div>
        <Label htmlFor="title">Título del anuncio</Label>
        <Input
          id="title"
          name="title"
          placeholder="Ej: Toyota Corolla XEI 2022"
          defaultValue={props.mode === "edit" ? props.defaultValues.title : ""}
          required
        />
        <FieldError messages={state?.fieldErrors?.title} />
      </div>

      <div>
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          name="description"
          rows={5}
          defaultValue={props.mode === "edit" ? props.defaultValues.description : ""}
          required
        />
        <FieldError messages={state?.fieldErrors?.description} />
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <Label htmlFor="price">Precio</Label>
          <Input
            id="price"
            name="price"
            inputMode="numeric"
            defaultValue={props.mode === "edit" ? props.defaultValues.price : ""}
            required
          />
          <FieldError messages={state?.fieldErrors?.price} />
        </div>
        <div>
          <Label htmlFor="currency">Moneda</Label>
          <Select id="currency" name="currency" defaultValue={props.mode === "edit" ? props.defaultValues.currency : "ARS"}>
            <option value="ARS">ARS</option>
            <option value="USD">USD</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="mileageKm">Kilometraje</Label>
          <Input
            id="mileageKm"
            name="mileageKm"
            inputMode="numeric"
            defaultValue={props.mode === "edit" ? (props.defaultValues.mileageKm ?? "") : ""}
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="city">Ciudad</Label>
          <Input id="city" name="city" defaultValue={props.mode === "edit" ? (props.defaultValues.city ?? "") : ""} />
        </div>
        <div>
          <Label htmlFor="province">Provincia</Label>
          <Input
            id="province"
            name="province"
            defaultValue={props.mode === "edit" ? (props.defaultValues.province ?? "") : ""}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="images">
          {props.mode === "create" ? "Fotos (hasta 6)" : "Agregar más fotos (opcional)"}
        </Label>

        {props.mode === "edit" && props.existingImages.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {props.existingImages.map((img) => (
              <div key={img.id} className="relative h-20 w-28 overflow-hidden rounded-lg border border-border">
                <Image src={img.url} alt={props.defaultValues.title} fill sizes="112px" className="object-cover" />
              </div>
            ))}
          </div>
        )}

        <label
          htmlFor="images"
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-6 text-center text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <ImagePlus className="h-6 w-6" />
          Hacé click para elegir imágenes (JPG/PNG, máx. 5MB c/u)
        </label>
        <input
          id="images"
          name="images"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          multiple
          className="hidden"
          onChange={handleFilesChange}
        />

        {previews.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {previews.map((src) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={src}
                src={src}
                alt=""
                className="h-20 w-28 rounded-lg border border-border object-cover"
              />
            ))}
          </div>
        )}
      </div>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <Button type="submit" disabled={pending} size="lg">
        {pending ? "Guardando..." : props.mode === "create" ? "Publicar anuncio" : "Guardar cambios"}
      </Button>
    </form>
  );
}
