import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col bg-surface-muted">
      <div className="flex justify-center py-8">
        <Link href="/" className="flex items-center rounded-md p-1.5">
          {/* eslint-disable-next-line @next/next/no-img-element -- mismo criterio que Header.tsx: SVG vía <img>, sin next/image */}
          <img src="/logo-v3.svg" alt={SITE_NAME} className="h-[clamp(2rem,6vw,2.75rem)] w-auto" />
        </Link>
      </div>
      <div className="flex flex-1 items-start justify-center px-4 pb-16">
        <div className="w-full max-w-md rounded-card border border-border bg-surface p-6 shadow-card sm:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
