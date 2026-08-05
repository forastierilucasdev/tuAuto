import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col bg-surface-muted">
      <div className="flex justify-center py-8">
        <Link href="/" className="text-xl font-extrabold tracking-tight text-navy">
          {SITE_NAME}
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
