import Link from "next/link";
import { VEHICLE_TYPES } from "@/lib/constants";

export function CategoryGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
      {VEHICLE_TYPES.map(({ value, labelPlural, icon: Icon }) => (
        <Link
          key={value}
          href={`/catalogo?tipo=${value}`}
          className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface px-4 py-5 text-center shadow-card transition-shadow hover:shadow-card-hover"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </span>
          <span className="text-sm font-medium text-foreground">{labelPlural}</span>
        </Link>
      ))}
    </div>
  );
}
