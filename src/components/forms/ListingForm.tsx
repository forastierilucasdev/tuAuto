"use client";

import * as React from "react";
import { useActionState } from "react";
import Image from "next/image";
import { Check, ImagePlus, Star, X } from "lucide-react";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { FieldError } from "@/components/ui/FieldError";
import {
  VEHICLE_TYPES,
  CONDITION_OPTIONS,
  TRANSMISSION_OPTIONS,
  conditionLabel,
  transmissionLabel,
  vehicleTypeLabel,
} from "@/lib/constants";
import { useVehicleTaxonomy } from "@/hooks/useVehicleTaxonomy";
import { cn, formatCurrency, formatKm } from "@/lib/utils";
import {
  createListingAction,
  updateListingAction,
  type ListingActionState,
} from "@/server/actions/listing.actions";
import type { VehicleType } from "@/generated/prisma/client";

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 40 }, (_, i) => CURRENT_YEAR + 1 - i);
const MAX_IMAGES = 6;

type ExistingImage = { id: string; url: string };
type SellerInfo = { fullName: string; phone: string; businessName?: string };

type ListingFormProps = {
  seller: SellerInfo;
} & (
  | { mode: "create" }
  | {
      mode: "edit";
      listingId: string;
      vehicleTypeLabel: string;
      brandName: string;
      modelName: string;
      year: number;
      defaultValues: {
        description: string | null;
        price: number;
        currency: "ARS" | "USD";
        priceNegotiable: boolean;
        acceptsTrade: boolean;
        acceptsFinancing: boolean;
        mileageKm: number | null;
        city: string | null;
        province: string | null;
        contactAddress: string | null;
      };
      existingImages: ExistingImage[];
    }
);

const initialState: ListingActionState = undefined;

type StepId = "datos" | "precio" | "ubicacion" | "contacto" | "fotos" | "observaciones" | "revisar";

export function ListingForm(props: ListingFormProps) {
  const isEdit = props.mode === "edit";
  const action = isEdit ? updateListingAction : createListingAction;
  const [state, formAction, pending] = useActionState(action, initialState);

  // --- Datos principales (solo se cargan en modo "create") ---
  const [vehicleType, setVehicleType] = React.useState<VehicleType | "">("");
  const [brandSlug, setBrandSlug] = React.useState("");
  const [modelSlug, setModelSlug] = React.useState("");
  const [year, setYear] = React.useState("");
  const [version, setVersion] = React.useState("");
  const [transmission, setTransmission] = React.useState("");
  const [condition, setCondition] = React.useState("USADO");
  const { brands, models } = useVehicleTaxonomy(vehicleType, brandSlug, modelSlug);
  const selectedBrandName = brands.find((b) => b.slug === brandSlug)?.name ?? "";
  const selectedModelName = models.find((m) => m.slug === modelSlug)?.name ?? "";

  // --- Precio ---
  const [price, setPrice] = React.useState(isEdit ? String(props.defaultValues.price) : "");
  const [currency, setCurrency] = React.useState<"ARS" | "USD">(
    isEdit ? props.defaultValues.currency : "ARS"
  );
  const [priceNegotiable, setPriceNegotiable] = React.useState(
    isEdit ? props.defaultValues.priceNegotiable : false
  );
  const [acceptsTrade, setAcceptsTrade] = React.useState(isEdit ? props.defaultValues.acceptsTrade : false);
  const [acceptsFinancing, setAcceptsFinancing] = React.useState(
    isEdit ? props.defaultValues.acceptsFinancing : false
  );
  const [mileageKm, setMileageKm] = React.useState(
    isEdit ? String(props.defaultValues.mileageKm ?? "") : ""
  );

  // --- Ubicación ---
  const [city, setCity] = React.useState(isEdit ? (props.defaultValues.city ?? "") : "");
  const [province, setProvince] = React.useState(isEdit ? (props.defaultValues.province ?? "") : "");

  // --- Contacto ---
  const [contactAddress, setContactAddress] = React.useState(
    isEdit ? (props.defaultValues.contactAddress ?? "") : ""
  );

  // --- Fotos ---
  const existingImages = isEdit ? props.existingImages : [];
  const [photos, setPhotos] = React.useState<{ file: File; preview: string }[]>([]);
  const remainingSlots = Math.max(0, MAX_IMAGES - existingImages.length - photos.length);

  // --- Observaciones ---
  const [description, setDescription] = React.useState(
    isEdit ? (props.defaultValues.description ?? "") : ""
  );

  const STEPS: { id: StepId; label: string }[] = [
    ...(isEdit ? [] : [{ id: "datos" as const, label: "Datos principales" }]),
    { id: "precio", label: "Precio" },
    { id: "ubicacion", label: "Ubicación" },
    { id: "contacto", label: "Contacto" },
    { id: "fotos", label: "Fotos" },
    { id: "observaciones", label: "Observaciones" },
    { id: "revisar", label: isEdit ? "Guardar" : "Publicar" },
  ];

  const [stepIndex, setStepIndex] = React.useState(0);
  const currentStep = STEPS[stepIndex].id;
  const isLastStep = stepIndex === STEPS.length - 1;

  function canProceed(): boolean {
    switch (currentStep) {
      case "datos":
        return Boolean(vehicleType && brandSlug && modelSlug && year);
      case "precio":
        return Boolean(price);
      case "fotos":
        return isEdit || photos.length > 0;
      default:
        return true;
    }
  }

  function goNext() {
    if (!canProceed()) return;
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  }

  function goBack() {
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  function handlePhotosChange(event: React.ChangeEvent<HTMLInputElement>) {
    const newFiles = Array.from(event.target.files ?? []).slice(0, remainingSlots);
    setPhotos((prev) => [
      ...prev,
      ...newFiles.map((file) => ({ file, preview: URL.createObjectURL(file) })),
    ]);
    event.target.value = "";
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  function makeCover(index: number) {
    setPhotos((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.unshift(item);
      return copy;
    });
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const formData = new FormData();

    if (isEdit) {
      formData.set("listingId", props.listingId);
    } else {
      formData.set("vehicleType", vehicleType);
      formData.set("brandSlug", brandSlug);
      formData.set("modelSlug", modelSlug);
      formData.set("year", year);
      formData.set("version", version);
      formData.set("transmission", transmission);
      formData.set("condition", condition);
    }

    formData.set("price", price);
    formData.set("currency", currency);
    if (priceNegotiable) formData.set("priceNegotiable", "on");
    if (acceptsTrade) formData.set("acceptsTrade", "on");
    if (acceptsFinancing) formData.set("acceptsFinancing", "on");
    formData.set("mileageKm", mileageKm);
    formData.set("city", city);
    formData.set("province", province);
    formData.set("contactAddress", contactAddress);
    formData.set("description", description);
    for (const { file } of photos) formData.append("images", file);

    React.startTransition(() => {
      formAction(formData);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl">
      {/* Indicador de pasos */}
      <div className="mb-6 flex flex-wrap gap-2">
        {STEPS.map((step, index) => (
          <button
            key={step.id}
            type="button"
            onClick={() => setStepIndex(index)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              index === stepIndex
                ? "bg-primary text-primary-foreground"
                : index < stepIndex
                  ? "bg-primary/10 text-primary"
                  : "bg-surface-muted text-muted-foreground"
            )}
          >
            {index + 1}. {step.label}
          </button>
        ))}
      </div>

      <div className="space-y-6 rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-6">
        {currentStep === "datos" && (
          <div className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="vehicleType">Tipo de vehículo</Label>
                <Select
                  id="vehicleType"
                  value={vehicleType}
                  onChange={(e) => {
                    setVehicleType(e.target.value as VehicleType | "");
                    setBrandSlug("");
                    setModelSlug("");
                  }}
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
                <Select id="year" value={year} onChange={(e) => setYear(e.target.value)}>
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
                  value={brandSlug}
                  onChange={(e) => {
                    setBrandSlug(e.target.value);
                    setModelSlug("");
                  }}
                  disabled={!vehicleType}
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
                  value={modelSlug}
                  onChange={(e) => setModelSlug(e.target.value)}
                  disabled={!brandSlug}
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

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="version">Versión (opcional)</Label>
                <Input
                  id="version"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="Ej: XEI CVT"
                />
              </div>
              <div>
                <Label htmlFor="transmission">Transmisión</Label>
                <Select id="transmission" value={transmission} onChange={(e) => setTransmission(e.target.value)}>
                  <option value="">No especifica</option>
                  {TRANSMISSION_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="mileageKm">Kilometraje</Label>
                <Input
                  id="mileageKm"
                  inputMode="numeric"
                  value={mileageKm}
                  onChange={(e) => setMileageKm(e.target.value.replace(/\D/g, ""))}
                />
              </div>
              <div>
                <Label>Condición</Label>
                <div className="flex gap-2">
                  {CONDITION_OPTIONS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setCondition(c.value)}
                      className={cn(
                        "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                        condition === c.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground"
                      )}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {isEdit && currentStep !== "datos" && (
          <p className="rounded-lg bg-surface-muted p-3 text-xs text-muted-foreground">
            {props.vehicleTypeLabel} · {props.brandName} {props.modelName} · {props.year} — el tipo,
            marca, modelo y año no se pueden editar.
          </p>
        )}

        {currentStep === "precio" && (
          <div className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="price">Precio</Label>
                <Input
                  id="price"
                  inputMode="numeric"
                  value={price}
                  onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))}
                />
                <FieldError messages={state?.fieldErrors?.price} />
              </div>
              <div>
                <Label htmlFor="currency">Moneda</Label>
                <Select id="currency" value={currency} onChange={(e) => setCurrency(e.target.value as "ARS" | "USD")}>
                  <option value="ARS">ARS</option>
                  <option value="USD">USD</option>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={priceNegotiable}
                  onChange={(e) => setPriceNegotiable(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary"
                />
                Precio sujeto a negociación
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={acceptsTrade}
                  onChange={(e) => setAcceptsTrade(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary"
                />
                Acepta permuta
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={acceptsFinancing}
                  onChange={(e) => setAcceptsFinancing(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary"
                />
                Acepta financiamiento
              </label>
            </div>
          </div>
        )}

        {currentStep === "ubicacion" && (
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="province">Provincia</Label>
              <Input id="province" value={province} onChange={(e) => setProvince(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="city">Localidad</Label>
              <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
          </div>
        )}

        {currentStep === "contacto" && (
          <div className="space-y-5">
            <div className="rounded-lg bg-surface-muted p-3 text-sm text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">{props.seller.businessName ?? props.seller.fullName}</span>
              </p>
              <p>{props.seller.phone}</p>
              <p className="mt-1 text-xs">
                El nombre y el WhatsApp se toman de tu perfil. Podés editarlos desde &quot;Mi
                perfil&quot;.
              </p>
            </div>
            <div>
              <Label htmlFor="contactAddress">Dirección (opcional)</Label>
              <Input
                id="contactAddress"
                value={contactAddress}
                onChange={(e) => setContactAddress(e.target.value)}
                placeholder="Ej: Av. Libertador 1234"
              />
            </div>
          </div>
        )}

        {currentStep === "fotos" && (
          <div>
            <Label>{isEdit ? "Agregar más fotos (opcional)" : `Fotos (hasta ${MAX_IMAGES})`}</Label>

            {existingImages.length > 0 && (
              <div className="mb-3">
                <p className="mb-2 text-xs text-muted-foreground">Fotos actuales</p>
                <div className="flex flex-wrap gap-2">
                  {existingImages.map((img) => (
                    <div key={img.id} className="relative h-20 w-28 overflow-hidden rounded-lg border border-border">
                      <Image src={img.url} alt="" fill sizes="112px" className="object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {remainingSlots > 0 && (
              <>
                <label
                  htmlFor="images"
                  className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-6 text-center text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  <ImagePlus className="h-6 w-6" />
                  Hacé click para elegir imágenes (JPG/PNG, máx. 5MB c/u)
                </label>
                <input
                  id="images"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                  multiple
                  className="hidden"
                  onChange={handlePhotosChange}
                />
              </>
            )}

            {photos.length > 0 && (
              <div className="mt-3">
                <p className="mb-2 text-xs text-muted-foreground">
                  Tocá la estrella para elegir la foto destacada de la publicación.
                </p>
                <div className="flex flex-wrap gap-2">
                  {photos.map((photo, index) => (
                    <div
                      key={photo.preview}
                      className={cn(
                        "relative h-20 w-28 overflow-hidden rounded-lg border-2",
                        index === 0 ? "border-primary" : "border-border"
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photo.preview} alt="" className="h-full w-full object-cover" />
                      {index === 0 && (
                        <span className="absolute left-1 top-1 rounded-full bg-primary p-1 text-primary-foreground">
                          <Star className="h-3 w-3 fill-current" />
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => makeCover(index)}
                        title="Marcar como foto destacada"
                        className="absolute bottom-1 left-1 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
                      >
                        <Star className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        title="Quitar foto"
                        className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {currentStep === "observaciones" && (
          <div>
            <Label htmlFor="description">Observaciones (opcional)</Label>
            <Textarea
              id="description"
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contanos algún detalle adicional del vehículo..."
            />
            <FieldError messages={state?.fieldErrors?.description} />
          </div>
        )}

        {currentStep === "revisar" && (
          <div className="space-y-4 text-sm">
            {!isEdit && (
              <p>
                <span className="text-muted-foreground">Vehículo:</span>{" "}
                <span className="font-medium text-foreground">
                  {vehicleTypeLabel(vehicleType)} {selectedBrandName} {selectedModelName} {year}
                  {version ? ` (${version})` : ""} · {conditionLabel(condition)}
                  {transmission ? ` · ${transmissionLabel(transmission)}` : ""}
                </span>
              </p>
            )}
            <p>
              <span className="text-muted-foreground">Precio:</span>{" "}
              <span className="font-medium text-foreground">
                {price ? formatCurrency(Number(price), currency) : "—"}
              </span>
            </p>
            <p>
              <span className="text-muted-foreground">Kilometraje:</span>{" "}
              <span className="font-medium text-foreground">{formatKm(mileageKm ? Number(mileageKm) : null)}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Ubicación:</span>{" "}
              <span className="font-medium text-foreground">
                {[province, city].filter(Boolean).join(" - ") || "—"}
              </span>
            </p>
            <p>
              <span className="text-muted-foreground">Fotos:</span>{" "}
              <span className="font-medium text-foreground">
                {existingImages.length + photos.length} en total
              </span>
            </p>
            {state?.error && <p className="text-danger">{state.error}</p>}
          </div>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <Button type="button" variant="outline" onClick={goBack} disabled={stepIndex === 0}>
          Atrás
        </Button>

        {isLastStep ? (
          <Button type="submit" disabled={pending} size="lg">
            {pending ? "Guardando..." : isEdit ? "Guardar cambios" : "Publicar anuncio"}
            {!pending && <Check className="h-4 w-4" />}
          </Button>
        ) : (
          <Button type="button" onClick={goNext} disabled={!canProceed()}>
            Siguiente
          </Button>
        )}
      </div>
    </form>
  );
}
