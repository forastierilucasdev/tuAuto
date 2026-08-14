"use client";

import * as React from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

type Changes = Record<string, unknown>;

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (typeof value === "string") {
    if (ISO_DATE_RE.test(value)) {
      const asDate = new Date(value);
      if (!Number.isNaN(asDate.getTime())) return asDate.toLocaleString("es-AR");
    }
    return value;
  }
  if (typeof value === "number") return String(value);
  return JSON.stringify(value);
}

/**
 * "Ver detalle" de una fila de Auditoría — arma la lista de campos a partir
 * del `changes.before`/`changes.after` que cada Server Action de admin ya
 * guarda (ver `logAdminAction`). Genérico a propósito: no hay un renderer
 * por tipo de acción, cualquier `{before, after}` con forma de objeto plano
 * se muestra igual, para no tener que actualizar este componente cada vez
 * que se agrega una acción nueva.
 */
export function AuditChangesModal({ before, after }: { before: Changes | null; after: Changes | null }) {
  const [open, setOpen] = React.useState(false);
  const keys = Array.from(new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]));

  if (keys.length === 0) return <span className="text-muted-foreground">—</span>;

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="text-sm font-medium text-primary hover:underline">
        Ver detalle
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Detalle del cambio">
        <dl className="text-sm">
          {keys.map((key) => {
            const hasBefore = before !== null && key in before;
            const hasAfter = after !== null && key in after;
            return (
              <div key={key} className="flex items-start justify-between gap-4 border-b border-border py-2 last:border-0">
                <dt className="font-mono text-xs text-muted-foreground">{key}</dt>
                <dd className="text-right font-medium text-foreground">
                  {hasBefore && <span className="text-muted-foreground">{formatValue(before![key])}</span>}
                  {hasBefore && hasAfter && " → "}
                  {hasAfter && <span>{formatValue(after![key])}</span>}
                </dd>
              </div>
            );
          })}
        </dl>
        <div className="mt-4 flex justify-end">
          <Button type="button" size="sm" onClick={() => setOpen(false)}>
            Cerrar
          </Button>
        </div>
      </Modal>
    </>
  );
}
