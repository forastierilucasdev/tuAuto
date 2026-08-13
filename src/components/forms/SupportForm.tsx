"use client";

import * as React from "react";
import { useActionState } from "react";
import { ImagePlus } from "lucide-react";
import { submitSupportReportAction, type SupportActionState } from "@/server/actions/support.actions";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";

const initialState: SupportActionState = undefined;

/** Nombre/correo/teléfono del usuario y fecha/hora se agregan del lado del servidor — el formulario solo pide la descripción y, opcional, una captura. */
export function SupportForm() {
  const [state, formAction, pending] = useActionState(submitSupportReportAction, initialState);
  const [fileName, setFileName] = React.useState<string | null>(null);

  if (state?.success) {
    return (
      <p className="text-sm text-success">
        ¡Gracias! Recibimos tu reporte — lo vamos a revisar a la brevedad.
      </p>
    );
  }

  return (
    <form action={formAction} className="max-w-lg space-y-5">
      <div>
        <Label htmlFor="description">Describí el error</Label>
        <Textarea
          id="description"
          name="description"
          rows={5}
          placeholder="Contanos qué estabas haciendo y qué pasó..."
          required
        />
      </div>

      <div>
        <Label htmlFor="screenshot">Captura de pantalla (opcional)</Label>
        <label
          htmlFor="screenshot"
          className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-border p-4 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <ImagePlus className="h-5 w-5 shrink-0" />
          {fileName ?? "Hacé click para adjuntar una imagen (JPG/PNG, máx. 5MB)"}
        </label>
        <input
          id="screenshot"
          name="screenshot"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          className="hidden"
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
        />
      </div>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Enviando..." : "Enviar reporte"}
      </Button>
    </form>
  );
}
