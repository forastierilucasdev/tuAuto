import Link from "next/link";

/** Mismo patrón de paginación que `/catalogo` — reusado por los 5 listados del panel admin. */
export function AdminPagination({
  page,
  totalPages,
  baseHref,
  params,
}: {
  page: number;
  totalPages: number;
  baseHref: string;
  params: URLSearchParams;
}) {
  if (totalPages <= 1) return null;

  function pageHref(targetPage: number) {
    const next = new URLSearchParams(params);
    if (targetPage > 1) next.set("pagina", String(targetPage));
    else next.delete("pagina");
    const query = next.toString();
    return query ? `${baseHref}?${query}` : baseHref;
  }

  return (
    <div className="mt-6 flex items-center justify-center gap-3">
      {page > 1 ? (
        <Link href={pageHref(page - 1)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-muted">
          Anterior
        </Link>
      ) : (
        <span className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground opacity-50">Anterior</span>
      )}
      <span className="text-sm text-muted-foreground">Página {page} de {totalPages}</span>
      {page < totalPages ? (
        <Link href={pageHref(page + 1)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-muted">
          Siguiente
        </Link>
      ) : (
        <span className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground opacity-50">Siguiente</span>
      )}
    </div>
  );
}
