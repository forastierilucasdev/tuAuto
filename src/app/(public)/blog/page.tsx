import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/Card";

export const metadata: Metadata = { title: "Blog" };

const POSTS = [
  {
    slug: "como-tasar-tu-auto",
    title: "Cómo tasar tu auto antes de venderlo",
    excerpt: "Claves para llegar a un precio justo y vender más rápido.",
  },
  {
    slug: "documentacion-para-vender",
    title: "Qué documentación necesitás para vender tu vehículo",
    excerpt: "La checklist completa antes de publicar tu anuncio.",
  },
  {
    slug: "consejos-para-comprar-usado",
    title: "5 consejos para comprar un vehículo usado sin sorpresas",
    excerpt: "Qué revisar antes de cerrar la compra.",
  },
];

export default function BlogPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-navy sm:text-3xl">Blog</h1>
      <p className="mt-2 max-w-xl text-muted-foreground">
        Contenido de referencia para esta etapa de prototipo; el contenido editorial real se
        incorpora en una próxima etapa.
      </p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {POSTS.map((post) => (
          <Card key={post.slug}>
            <CardContent className="pt-5">
              <p className="font-semibold text-navy">{post.title}</p>
              <p className="mt-2 text-sm text-muted-foreground">{post.excerpt}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
