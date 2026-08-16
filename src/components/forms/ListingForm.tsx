"use client";

import * as React from "react";
import { useActionState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, ChevronLeft, ChevronRight, ImagePlus, Star, X } from "lucide-react";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { Button, buttonVariants } from "@/components/ui/Button";
import { FieldError } from "@/components/ui/FieldError";
import { Modal } from "@/components/ui/Modal";
import {
  VEHICLE_TYPES,
  CONDITION_OPTIONS,
  TRANSMISSION_OPTIONS,
  PENDING_APPROVAL_MESSAGE,
  conditionLabel,
  mileageUnitFor,
  transmissionLabel,
  usesTransmission,
  vehicleTypeLabel,
} from "@/lib/constants";
import { useVehicleTaxonomy } from "@/hooks/useVehicleTaxonomy";
import { useLocationTaxonomy } from "@/hooks/useLocationTaxonomy";
import { VehicleNotListedModal, type PendingVehicle } from "@/components/forms/VehicleNotListedModal";
import { LocalityNotListedModal, type PendingLocality } from "@/components/forms/LocalityNotListedModal";
import { cn, formatCurrency, formatKm } from "@/lib/utils";
import {
  createListingAction,
  deleteListingImageAction,
  reorderListingImagesAction,
  updateListingAction,
  type ListingActionState,
} from "@/server/actions/listing.actions";
import type { VehicleCondition } from "@/generated/prisma/client";

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
      /** Si la publicación va a volver a estar activa al guardar (borrador/reservada/pausada/vencida). */
      isReactivation: boolean;
      /** Código de `VehicleTypeCatalog` (ej. "AUTO"). */
      vehicleType: string;
      brandSlug: string;
      brandName: string;
      modelSlug: string;
      modelName: string;
      /** Slug de la versión ya resuelta (si la publicación tiene `versionId`) — `null` si es de antes de este catálogo o nunca se cargó una. */
      versionSlug: string | null;
      versionName: string | null;
      /** Mismo criterio que `versionSlug`/`versionName` — `null` si es de antes de estas tablas o nunca se resolvió. */
      provinceSlug: string | null;
      provinceName: string | null;
      localitySlug: string | null;
      localityName: string | null;
      year: number;
      defaultValues: {
        /** Texto libre histórico — solo se usa para el aviso cuando no hay `versionSlug` resuelto. */
        version: string | null;
        condition: VehicleCondition;
        transmission: "MECANICA" | "ASISTIDA" | null;
        description: string | null;
        price: number;
        currency: "ARS" | "USD";
        priceNegotiable: boolean;
        acceptsTrade: boolean;
        acceptsFinancing: boolean;
        mileageKm: number | null;
        /** Texto libre histórico — solo se usa para el aviso cuando no hay `provinceSlug`/`localitySlug` resueltos. */
        city: string | null;
        province: string | null;
        contactAddress: string | null;
      };
      existingImages: ExistingImage[];
      /** Solo panel admin: reemplaza `updateListingAction`/`deleteListingImageAction`/`reorderListingImagesAction` por las variantes de admin (sin chequeo de ownership, permiso validado server-side por `requireAdminPermission`+`requireSuperAdminRole`). Sin esto, el wizard se comporta exactamente igual que para el dueño. */
      updateAction?: typeof updateListingAction;
      deleteImageAction?: (listingId: string, imageId: string, reason?: string) => Promise<ListingActionState>;
      reorderImagesAction?: (listingId: string, orderedImageIds: string[]) => Promise<ListingActionState>;
      /** Solo panel admin: pide un motivo (modal aparte) antes de borrar una foto — nunca se le muestra al dueño, queda en el registro de auditoría. */
      requireDeleteReason?: boolean;
    }
);

const initialState: ListingActionState = undefined;

type StepId = "datos" | "precio" | "ubicacion" | "contacto" | "fotos" | "observaciones" | "revisar";

export function ListingForm(props: ListingFormProps) {
  const isEdit = props.mode === "edit";
  const isReactivation = isEdit ? props.isReactivation : false;
  const action = isEdit ? (props.updateAction ?? updateListingAction) : createListingAction;
  const [state, formAction, pending] = useActionState(action, initialState);

  // --- Datos principales (bloqueados en modo "edit": vienen de la publicación existente) ---
  const [vehicleType, setVehicleType] = React.useState(isEdit ? props.vehicleType : "");
  const [brandSlug, setBrandSlug] = React.useState(isEdit ? props.brandSlug : "");
  const [modelSlug, setModelSlug] = React.useState(isEdit ? props.modelSlug : "");
  const [versionSlug, setVersionSlug] = React.useState(isEdit ? (props.versionSlug ?? "") : "");
  const [year, setYear] = React.useState(isEdit ? String(props.year) : "");
  const [transmission, setTransmission] = React.useState(
    isEdit ? (props.defaultValues.transmission ?? "") : ""
  );
  const [condition, setCondition] = React.useState(isEdit ? props.defaultValues.condition : "USADO");
  const { brands, models, versions } = useVehicleTaxonomy(vehicleType, brandSlug, modelSlug);
  const selectedBrandName =
    brands.find((b) => b.slug === brandSlug)?.name ?? (isEdit ? props.brandName : "");
  const selectedModelName =
    models.find((m) => m.slug === modelSlug)?.name ?? (isEdit ? props.modelName : "");
  const selectedVersionName =
    versions.find((v) => v.slug === versionSlug)?.name ?? (isEdit ? (props.versionName ?? "") : "");
  // "¿Tu vehículo no está en la lista?" — solo tiene sentido al publicar
  // (nunca en modo edición, una publicación pendiente no se edita con el
  // wizard hasta que se apruebe, ver la página que lo renderiza). Mientras
  // esté seteado, reemplaza el bloque Tipo/Marca/Modelo/Versión/Año normal
  // por un resumen fijo (ver el paso "datos" más abajo).
  const [pendingVehicle, setPendingVehicle] = React.useState<PendingVehicle | null>(null);
  // El tipo "efectivo" alimenta las reglas de km/transmisión aunque el
  // vehículo esté pendiente (su Tipo sigue siendo real, elegido en el modal).
  const effectiveVehicleType = pendingVehicle ? pendingVehicle.vehicleType : vehicleType;
  // El wizard se adapta según el tipo de vehículo: kilometraje solo en
  // autos/camionetas/monopatines, "horas de uso" en lanchas/barcos, y
  // transmisión solo en autos/camionetas (ver lib/constants.ts).
  const mileageUnit = mileageUnitFor(effectiveVehicleType);
  const showTransmission = usesTransmission(effectiveVehicleType);

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
  const [provinceSlug, setProvinceSlug] = React.useState(isEdit ? (props.provinceSlug ?? "") : "");
  const [localitySlug, setLocalitySlug] = React.useState(isEdit ? (props.localitySlug ?? "") : "");
  const { provinces, localities } = useLocationTaxonomy(provinceSlug);
  const selectedProvinceName =
    provinces.find((p) => p.slug === provinceSlug)?.name ?? (isEdit ? (props.provinceName ?? "") : "");
  const selectedLocalityName =
    localities.find((l) => l.slug === localitySlug)?.name ?? (isEdit ? (props.localityName ?? "") : "");
  // "¿No encontrás tu localidad?" — mismo criterio que `pendingVehicle`.
  const [pendingLocality, setPendingLocality] = React.useState<PendingLocality | null>(null);

  // --- Contacto ---
  const [contactAddress, setContactAddress] = React.useState(
    isEdit ? (props.defaultValues.contactAddress ?? "") : ""
  );

  // --- Fotos ---
  const [existingImages, setExistingImages] = React.useState<ExistingImage[]>(
    isEdit ? props.existingImages : []
  );
  const [deletingImageId, setDeletingImageId] = React.useState<string | null>(null);
  const [deleteImageError, setDeleteImageError] = React.useState<string>();
  const [reordering, setReordering] = React.useState(false);
  const [reorderError, setReorderError] = React.useState<string>();
  const [photos, setPhotos] = React.useState<{ file: File; preview: string }[]>([]);
  const remainingSlots = Math.max(0, MAX_IMAGES - existingImages.length - photos.length);

  // Solo panel admin (`requireDeleteReason`): en vez de borrar al toque, se
  // abre un modal chico pidiendo el motivo — se guarda en auditoría, nunca
  // se le muestra al dueño. Para el dueño, `pendingDeleteImageId` nunca se
  // usa y el click borra directo, como siempre.
  const [pendingDeleteImageId, setPendingDeleteImageId] = React.useState<string | null>(null);
  const [deleteReason, setDeleteReason] = React.useState("");

  async function performRemoveImage(imageId: string, reason?: string) {
    if (!isEdit) return;
    setDeleteImageError(undefined);
    setDeletingImageId(imageId);
    const result = await (props.deleteImageAction ?? deleteListingImageAction)(props.listingId, imageId, reason);
    setDeletingImageId(null);
    if (result?.error) {
      setDeleteImageError(result.error);
      return;
    }
    setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
  }

  function requestRemoveImage(imageId: string) {
    if (isEdit && props.requireDeleteReason) {
      setDeleteReason("");
      setPendingDeleteImageId(imageId);
      return;
    }
    void performRemoveImage(imageId);
  }

  async function confirmRemoveImageWithReason() {
    if (!pendingDeleteImageId) return;
    if (deleteReason.trim().length < 3) {
      setDeleteImageError("Contanos el motivo de la eliminación.");
      return;
    }
    await performRemoveImage(pendingDeleteImageId, deleteReason.trim());
    setPendingDeleteImageId(null);
  }

  async function moveExistingImage(index: number, direction: -1 | 1) {
    if (!isEdit || reordering) return;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= existingImages.length) return;

    const reordered = [...existingImages];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];

    const previous = existingImages;
    setExistingImages(reordered);
    setReorderError(undefined);
    setReordering(true);
    const result = await (props.reorderImagesAction ?? reorderListingImagesAction)(
      props.listingId,
      reordered.map((img) => img.id)
    );
    setReordering(false);
    if (result?.error) {
      setExistingImages(previous);
      setReorderError(result.error);
    }
  }

  // --- Observaciones ---
  const [description, setDescription] = React.useState(
    isEdit ? (props.defaultValues.description ?? "") : ""
  );

  const STEPS: { id: StepId; label: string }[] = [
    { id: "datos", label: "Datos principales" },
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

  // Una vez que se llega a la pantalla de revisión (por "Siguiente" o
  // saltando directo con un click en el círculo), se activan los avisos de
  // campos obligatorios faltantes en todos los pasos, no solo en el actual.
  const [hasReachedReview, setHasReachedReview] = React.useState(false);

  function goToStep(index: number) {
    setStepIndex(index);
    if (STEPS[index].id === "revisar") setHasReachedReview(true);
  }

  type MissingField = { stepIndex: number; stepLabel: string; fieldLabel: string };
  const missingFields: MissingField[] = [];
  const datosStepIndex = STEPS.findIndex((s) => s.id === "datos");
  const precioStepIndex = STEPS.findIndex((s) => s.id === "precio");
  const fotosStepIndex = STEPS.findIndex((s) => s.id === "fotos");

  if (!isEdit && !pendingVehicle) {
    if (!vehicleType) missingFields.push({ stepIndex: datosStepIndex, stepLabel: "Datos principales", fieldLabel: "Tipo de vehículo" });
    if (!brandSlug) missingFields.push({ stepIndex: datosStepIndex, stepLabel: "Datos principales", fieldLabel: "Marca" });
    if (!modelSlug) missingFields.push({ stepIndex: datosStepIndex, stepLabel: "Datos principales", fieldLabel: "Modelo" });
    if (!year) missingFields.push({ stepIndex: datosStepIndex, stepLabel: "Datos principales", fieldLabel: "Año" });
  }
  if (!price) missingFields.push({ stepIndex: precioStepIndex, stepLabel: "Precio", fieldLabel: "Precio" });
  if (!isEdit && photos.length === 0) {
    missingFields.push({ stepIndex: fotosStepIndex, stepLabel: "Fotos", fieldLabel: "Al menos una foto" });
  }

  // Con datos cargados a mano (vehículo y/o localidad), la publicación
  // queda pendiente de aprobación en vez de publicarse directo — ver el
  // aviso en el paso "revisar" y el modal de confirmación más abajo.
  const hasPendingData = Boolean(pendingVehicle) || Boolean(pendingLocality);

  const showInvalid = (missing: boolean) => hasReachedReview && missing;

  function canProceed(): boolean {
    switch (currentStep) {
      case "datos":
        return pendingVehicle ? true : Boolean(vehicleType && brandSlug && modelSlug && year);
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
    goToStep(Math.min(stepIndex + 1, STEPS.length - 1));
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

  function handleFormKeyDown(event: React.KeyboardEvent<HTMLFormElement>) {
    if (event.key !== "Enter" || event.target instanceof HTMLTextAreaElement) return;
    // Evita el "submit implícito" del navegador: en un paso con un solo campo
    // de texto (ej. "Contacto"), tocar Enter/Listo en el teclado alcanza
    // para disparar el submit del <form> aunque el botón "Publicar" ni
    // siquiera esté en pantalla. Enter avanza de paso en vez de publicar.
    event.preventDefault();
    if (!isLastStep) goNext();
  }

  const [confirmPublishOpen, setConfirmPublishOpen] = React.useState(false);

  function submitListing(status?: "ACTIVE" | "DRAFT") {
    const formData = new FormData();

    if (isEdit) {
      formData.set("listingId", props.listingId);
    } else {
      formData.set("vehicleType", effectiveVehicleType);
      if (pendingVehicle) {
        formData.set("pendingBrandName", pendingVehicle.brandName);
        formData.set("pendingModelName", pendingVehicle.modelName);
        formData.set("pendingVersionName", pendingVehicle.versionName);
        formData.set("year", pendingVehicle.year);
      } else {
        formData.set("brandSlug", brandSlug);
        formData.set("modelSlug", modelSlug);
        formData.set("year", year);
      }
      if (status) formData.set("status", status);
    }

    if (!pendingVehicle) formData.set("versionSlug", versionSlug);
    // Solo se manda transmisión/kilometraje si el tipo de vehículo elegido
    // los usa — evita guardar un dato que no tiene sentido para ese tipo
    // (ej. transmisión en una moto, o km en una bicicleta).
    if (showTransmission) formData.set("transmission", transmission);
    formData.set("condition", condition);
    formData.set("price", price);
    formData.set("currency", currency);
    if (priceNegotiable) formData.set("priceNegotiable", "on");
    if (acceptsTrade) formData.set("acceptsTrade", "on");
    if (acceptsFinancing) formData.set("acceptsFinancing", "on");
    if (mileageUnit) formData.set("mileageKm", mileageKm);
    if (pendingLocality) {
      formData.set("provinceSlug", pendingLocality.provinceSlug);
      formData.set("pendingLocalityName", pendingLocality.localityName);
    } else {
      formData.set("localitySlug", localitySlug);
      formData.set("provinceSlug", provinceSlug);
    }
    formData.set("contactAddress", contactAddress);
    formData.set("description", description);
    for (const { file } of photos) formData.append("images", file);

    React.startTransition(() => {
      formAction(formData);
    });
  }

  function handleSubmit(event: React.FormEvent) {
    // Ya no hay ningún botón type="submit" en este form: todos los envíos
    // pasan por botones explícitos (ver más abajo) para no saltear el
    // diálogo de confirmación al publicar. Esto solo se dispara por un
    // submit implícito del navegador (Enter en el único campo de texto de
    // un paso) — lo bloqueamos sin hacer nada.
    event.preventDefault();
  }

  return (
    <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} className="max-w-2xl">
      {/* Indicador de pasos: círculos numerados unidos por una línea que se
          va pintando a medida que se avanza. Tocar un número salta directo
          a ese paso; el subtítulo centrado debajo siempre refleja el paso
          activo. */}
      <div className="mb-2 flex items-center">
        {STEPS.map((step, index) => (
          <React.Fragment key={step.id}>
            <button
              type="button"
              onClick={() => goToStep(index)}
              aria-label={`Ir a ${step.label}`}
              aria-current={index === stepIndex ? "step" : undefined}
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors",
                index < stepIndex
                  ? "border-primary bg-primary text-primary-foreground"
                  : index === stepIndex
                    ? "border-primary bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-2 ring-offset-surface"
                    : "border-border bg-surface text-muted-foreground"
              )}
            >
              {index < stepIndex ? <Check className="h-4 w-4" /> : index + 1}
            </button>
            {index < STEPS.length - 1 && (
              <div className={cn("h-0.5 flex-1 transition-colors", index < stepIndex ? "bg-primary" : "bg-border")} />
            )}
          </React.Fragment>
        ))}
      </div>
      <p className="mb-6 text-center text-sm font-semibold text-navy">{STEPS[stepIndex].label}</p>

      <div className="space-y-6 rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-6">
        {currentStep === "datos" && (
          <div className="space-y-5">
            {isEdit && (
              <p className="rounded-lg bg-surface-muted p-3 text-xs text-muted-foreground">
                El tipo, marca, modelo y año no se pueden editar — así evitamos que este anuncio termine
                usándose para publicar un vehículo distinto.
              </p>
            )}
            {pendingVehicle ? (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
                <p className="font-medium text-primary">Vehículo cargado a mano (pendiente de aprobación)</p>
                <p className="mt-1 text-foreground">
                  {pendingVehicle.vehicleTypeLabel} — {pendingVehicle.brandName} {pendingVehicle.modelName}{" "}
                  {pendingVehicle.versionName} ({pendingVehicle.year})
                </p>
                <button
                  type="button"
                  onClick={() => setPendingVehicle(null)}
                  className="mt-2 text-xs font-medium text-primary hover:underline"
                >
                  Quitar y elegir de la lista
                </button>
              </div>
            ) : (
              <>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="vehicleType">Tipo de vehículo</Label>
                    <Select
                      id="vehicleType"
                      value={vehicleType}
                      aria-invalid={showInvalid(!vehicleType)}
                      disabled={isEdit}
                      onChange={(e) => {
                        setVehicleType(e.target.value);
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
                    <Label htmlFor="brandSlug">Marca</Label>
                    <Select
                      id="brandSlug"
                      value={brandSlug}
                      aria-invalid={showInvalid(!brandSlug)}
                      onChange={(e) => {
                        setBrandSlug(e.target.value);
                        setModelSlug("");
                      }}
                      disabled={isEdit || !vehicleType}
                    >
                      <option value="">Elegí una marca</option>
                      {brands.map((b) => (
                        <option key={b.id} value={b.slug}>
                          {b.name}
                        </option>
                      ))}
                      {isEdit && !brands.some((b) => b.slug === brandSlug) && (
                        <option value={brandSlug}>{props.mode === "edit" ? props.brandName : ""}</option>
                      )}
                    </Select>
                    <FieldError messages={state?.fieldErrors?.brandSlug} />
                  </div>

                  <div>
                    <Label htmlFor="modelSlug">Modelo</Label>
                    <Select
                      id="modelSlug"
                      value={modelSlug}
                      aria-invalid={showInvalid(!modelSlug)}
                      onChange={(e) => {
                        setModelSlug(e.target.value);
                        setVersionSlug("");
                      }}
                      disabled={isEdit || !brandSlug}
                    >
                      <option value="">Elegí un modelo</option>
                      {models.map((m) => (
                        <option key={m.id} value={m.slug}>
                          {m.name}
                        </option>
                      ))}
                      {isEdit && !models.some((m) => m.slug === modelSlug) && (
                        <option value={modelSlug}>{props.mode === "edit" ? props.modelName : ""}</option>
                      )}
                    </Select>
                    <FieldError messages={state?.fieldErrors?.modelSlug} />
                  </div>

                  <div>
                    <Label htmlFor="versionSlug">Versión (opcional)</Label>
                    <Select
                      id="versionSlug"
                      value={versionSlug}
                      onChange={(e) => setVersionSlug(e.target.value)}
                      disabled={!modelSlug}
                    >
                      <option value="">Sin versión especificada</option>
                      {versions.map((v) => (
                        <option key={v.id} value={v.slug}>
                          {v.name}
                        </option>
                      ))}
                      {isEdit && versionSlug && !versions.some((v) => v.slug === versionSlug) && (
                        <option value={versionSlug}>{props.mode === "edit" ? (props.versionName ?? "") : ""}</option>
                      )}
                    </Select>
                    {isEdit && !versionSlug && props.defaultValues.version && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Versión actual (texto libre, de antes de este catálogo): &quot;{props.defaultValues.version}
                        &quot;. Si aparece en la lista, elegila para dejarla vinculada.
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="year">Año</Label>
                  <Select
                    id="year"
                    value={year}
                    aria-invalid={showInvalid(!year)}
                    disabled={isEdit}
                    onChange={(e) => setYear(e.target.value)}
                  >
                    <option value="">Elegí un año</option>
                    {YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </Select>
                  <FieldError messages={state?.fieldErrors?.year} />
                </div>

                {!isEdit && (
                  <VehicleNotListedModal
                    onSave={(data) => {
                      setPendingVehicle(data);
                      setBrandSlug("");
                      setModelSlug("");
                      setVersionSlug("");
                    }}
                  />
                )}
              </>
            )}

            {showTransmission && (
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
            )}

            <div className={cn("grid gap-5", mileageUnit && "sm:grid-cols-2")}>
              {mileageUnit && (
                <div>
                  <Label htmlFor="mileageKm">{mileageUnit === "km" ? "Kilometraje" : "Horas de uso"}</Label>
                  <Input
                    id="mileageKm"
                    inputMode="numeric"
                    value={mileageKm}
                    onChange={(e) => setMileageKm(e.target.value.replace(/\D/g, ""))}
                  />
                </div>
              )}
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

        {currentStep === "precio" && (
          <div className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="price">Precio</Label>
                <Input
                  id="price"
                  inputMode="numeric"
                  value={price}
                  aria-invalid={showInvalid(!price)}
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
              <p className="text-xs text-muted-foreground">
                Solo serán visibles en la publicación las opciones marcadas.
              </p>
            </div>
          </div>
        )}

        {currentStep === "ubicacion" && (
          <div className="space-y-5">
            {pendingLocality ? (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
                <p className="font-medium text-primary">Localidad cargada a mano (pendiente de aprobación)</p>
                <p className="mt-1 text-foreground">
                  {pendingLocality.provinceName} — {pendingLocality.localityName}
                </p>
                <button
                  type="button"
                  onClick={() => setPendingLocality(null)}
                  className="mt-2 text-xs font-medium text-primary hover:underline"
                >
                  Quitar y elegir de la lista
                </button>
              </div>
            ) : (
              <>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="provinceSlug">Provincia</Label>
                    <Select
                      id="provinceSlug"
                      value={provinceSlug}
                      onChange={(e) => {
                        setProvinceSlug(e.target.value);
                        setLocalitySlug("");
                      }}
                    >
                      <option value="">Elegí una provincia</option>
                      {provinces.map((p) => (
                        <option key={p.id} value={p.slug}>
                          {p.name}
                        </option>
                      ))}
                      {isEdit && provinceSlug && !provinces.some((p) => p.slug === provinceSlug) && (
                        <option value={provinceSlug}>{props.mode === "edit" ? (props.provinceName ?? "") : ""}</option>
                      )}
                    </Select>
                    {isEdit && !provinceSlug && props.defaultValues.province && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Provincia actual (texto libre, de antes de este catálogo): &quot;
                        {props.defaultValues.province}&quot;. Si aparece en la lista, elegila para dejarla vinculada.
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="localitySlug">Localidad</Label>
                    <Select
                      id="localitySlug"
                      value={localitySlug}
                      onChange={(e) => setLocalitySlug(e.target.value)}
                      disabled={!provinceSlug}
                    >
                      <option value="">{provinceSlug ? "Elegí una localidad" : "Elegí primero una provincia"}</option>
                      {localities.map((l) => (
                        <option key={l.id} value={l.slug}>
                          {l.name}
                        </option>
                      ))}
                      {isEdit && localitySlug && !localities.some((l) => l.slug === localitySlug) && (
                        <option value={localitySlug}>{props.mode === "edit" ? (props.localityName ?? "") : ""}</option>
                      )}
                    </Select>
                    {isEdit && !localitySlug && props.defaultValues.city && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Localidad actual (texto libre, de antes de este catálogo): &quot;{props.defaultValues.city}
                        &quot;. Si aparece en la lista, elegila para dejarla vinculada.
                      </p>
                    )}
                  </div>
                </div>
                {!isEdit && (
                  <LocalityNotListedModal
                    onSave={(data) => {
                      setPendingLocality(data);
                      setLocalitySlug("");
                    }}
                  />
                )}
              </>
            )}
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
                <p className="mb-2 text-xs text-muted-foreground">
                  Fotos actuales — la primera es la portada. Usá las flechas para reordenar.
                </p>
                <div className="flex flex-wrap gap-2">
                  {existingImages.map((img, index) => (
                    <div
                      key={img.id}
                      className={cn(
                        "relative h-20 w-28 overflow-hidden rounded-lg border-2",
                        index === 0 ? "border-primary" : "border-border"
                      )}
                    >
                      <Image src={img.url} alt="" fill sizes="112px" className="object-cover" />
                      {index === 0 && (
                        <span className="absolute left-1 top-1 rounded-full bg-primary p-1 text-primary-foreground">
                          <Star className="h-3 w-3 fill-current" />
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => requestRemoveImage(img.id)}
                        disabled={deletingImageId === img.id}
                        title="Quitar foto"
                        className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white hover:bg-black/70 disabled:opacity-50"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <div className="absolute bottom-1 left-1 flex gap-1">
                        <button
                          type="button"
                          onClick={() => moveExistingImage(index, -1)}
                          disabled={index === 0 || reordering}
                          title="Mover antes"
                          className="rounded-full bg-black/50 p-1 text-white hover:bg-black/70 disabled:opacity-30"
                        >
                          <ChevronLeft className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveExistingImage(index, 1)}
                          disabled={index === existingImages.length - 1 || reordering}
                          title="Mover después"
                          className="rounded-full bg-black/50 p-1 text-white hover:bg-black/70 disabled:opacity-30"
                        >
                          <ChevronRight className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {deleteImageError && <p className="mt-2 text-xs text-danger">{deleteImageError}</p>}
                {reorderError && <p className="mt-2 text-xs text-danger">{reorderError}</p>}
              </div>
            )}

            {remainingSlots > 0 && (
              <>
                <label
                  htmlFor="images"
                  className={cn(
                    "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center text-sm transition-colors hover:border-primary hover:text-primary",
                    showInvalid(!isEdit && photos.length === 0)
                      ? "border-danger text-danger"
                      : "border-border text-muted-foreground"
                  )}
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
            {missingFields.length > 0 && (
              <div className="rounded-lg border border-danger/40 bg-danger/5 p-3 text-danger">
                <p className="font-semibold">Datos pendientes de carga</p>
                <ul className="mt-1 list-inside list-disc">
                  {missingFields.map((field) => (
                    <li key={`${field.stepIndex}-${field.fieldLabel}`}>
                      <button
                        type="button"
                        onClick={() => setStepIndex(field.stepIndex)}
                        className="underline underline-offset-2"
                      >
                        {field.fieldLabel} ({field.stepLabel})
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {hasPendingData && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-primary">
                <p className="font-semibold">Esta publicación quedará pendiente de revisión</p>
                <p className="mt-1">
                  Cargaste datos que todavía no están en nuestro catálogo. Se publicará a la brevedad, luego de
                  aprobados los datos ingresados — mientras tanto quedará inactiva y no se descontará ninguna
                  publicación disponible de tu cuenta.
                </p>
              </div>
            )}
            <p>
              <span className="text-muted-foreground">Vehículo:</span>{" "}
              <span className="font-medium text-foreground">
                {pendingVehicle ? (
                  <>
                    {pendingVehicle.vehicleTypeLabel} {pendingVehicle.brandName} {pendingVehicle.modelName}{" "}
                    {pendingVehicle.year} ({pendingVehicle.versionName})
                  </>
                ) : (
                  <>
                    {vehicleTypeLabel(vehicleType)} {selectedBrandName} {selectedModelName} {year}
                    {selectedVersionName ? ` (${selectedVersionName})` : ""}
                  </>
                )}{" "}
                · {conditionLabel(condition)}
                {showTransmission && transmission ? ` · ${transmissionLabel(transmission)}` : ""}
              </span>
            </p>
            <p>
              <span className="text-muted-foreground">Precio:</span>{" "}
              <span className="font-medium text-foreground">
                {price ? formatCurrency(Number(price), currency) : "—"}
              </span>
            </p>
            {mileageUnit && (
              <p>
                <span className="text-muted-foreground">
                  {mileageUnit === "km" ? "Kilometraje" : "Horas de uso"}:
                </span>{" "}
                <span className="font-medium text-foreground">
                  {formatKm(mileageKm ? Number(mileageKm) : null, mileageUnit)}
                </span>
              </p>
            )}
            <p>
              <span className="text-muted-foreground">Ubicación:</span>{" "}
              <span className="font-medium text-foreground">
                {pendingLocality
                  ? `${pendingLocality.provinceName} - ${pendingLocality.localityName}`
                  : [selectedProvinceName, selectedLocalityName].filter(Boolean).join(" - ") || "—"}
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

      <div className="sticky bottom-0 z-10 mt-5 flex flex-col gap-3 border-t border-border bg-surface py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={goBack}
            disabled={stepIndex === 0}
          >
            Atrás
          </Button>
          {isEdit && (
            <Link
              href="/dashboard/publicaciones"
              className={cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto")}
            >
              Cancelar edición
            </Link>
          )}
        </div>

        {isLastStep ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {!isEdit && (
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                disabled={pending || missingFields.length > 0}
                onClick={() => submitListing("DRAFT")}
              >
                Guardar como borrador
              </Button>
            )}
            <Button
              type="button"
              className="w-full sm:w-auto"
              disabled={pending || missingFields.length > 0}
              size="lg"
              onClick={() => (isEdit && !isReactivation ? submitListing() : setConfirmPublishOpen(true))}
            >
              {pending ? "Guardando..." : isEdit ? "Guardar cambios" : "Publicar anuncio"}
              {!pending && <Check className="h-4 w-4" />}
            </Button>
          </div>
        ) : (
          <Button type="button" className="w-full sm:w-auto" onClick={goNext} disabled={!canProceed()}>
            Siguiente
          </Button>
        )}
      </div>

      <Modal
        open={confirmPublishOpen}
        onClose={() => setConfirmPublishOpen(false)}
        title={hasPendingData ? "¿Confirmás el envío a revisión?" : "¿Desea publicar tu anuncio?"}
      >
        <div className="space-y-3 text-sm">
          {hasPendingData ? (
            <p className="text-muted-foreground">{PENDING_APPROVAL_MESSAGE}</p>
          ) : (
            <p className="text-muted-foreground">¿Querés revisar los datos antes de publicar?</p>
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="primary" onClick={() => setConfirmPublishOpen(false)}>
              Sí, revisar
            </Button>
            <Button
              type="button"
              variant="success"
              onClick={() => {
                setConfirmPublishOpen(false);
                submitListing("ACTIVE");
              }}
            >
              {hasPendingData ? "Enviar a revisión" : "Publicar"}
            </Button>
          </div>
        </div>
      </Modal>

      {isEdit && props.requireDeleteReason && (
        <Modal
          open={pendingDeleteImageId !== null}
          onClose={() => setPendingDeleteImageId(null)}
          title="Eliminar foto"
        >
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">Contanos el motivo — queda en el registro de auditoría.</p>
            <div>
              <Label htmlFor="delete-image-reason">Motivo</Label>
              <Textarea
                id="delete-image-reason"
                rows={3}
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Ej: foto indebida..."
              />
            </div>
            {deleteImageError && <p className="text-danger">{deleteImageError}</p>}
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" size="sm" onClick={() => setPendingDeleteImageId(null)}>
                Cancelar
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={deletingImageId === pendingDeleteImageId}
                onClick={confirmRemoveImageWithReason}
              >
                {deletingImageId === pendingDeleteImageId ? "Eliminando..." : "Eliminar"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </form>
  );
}
