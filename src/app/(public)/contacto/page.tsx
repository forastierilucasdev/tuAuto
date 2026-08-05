import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = { title: "Contacto" };

export default function ContactoPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-navy sm:text-3xl">Contacto</h1>
      <p className="mt-2 max-w-xl text-muted-foreground">
        ¿Tenés dudas sobre el portal? Escribinos y te respondemos a la brevedad.
      </p>

      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <Card>
          <CardContent className="space-y-4 pt-5">
            <div>
              <Label htmlFor="nombre">Nombre</Label>
              <Input id="nombre" name="nombre" placeholder="Tu nombre" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="tu@email.com" />
            </div>
            <div>
              <Label htmlFor="mensaje">Mensaje</Label>
              <Textarea id="mensaje" name="mensaje" placeholder="Contanos en qué te podemos ayudar" />
            </div>
            <Button type="button" className="w-full">
              Enviar mensaje
            </Button>
            <p className="text-xs text-muted-foreground">
              Este formulario es una maqueta de la etapa de prototipo; el envío real de mensajes
              se habilita en una próxima etapa.
            </p>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Mail className="mt-0.5 h-5 w-5 text-primary" />
            <div>
              <p className="font-medium text-foreground">Email</p>
              <p className="text-sm text-muted-foreground">soporte@motoresya.com.ar</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Phone className="mt-0.5 h-5 w-5 text-primary" />
            <div>
              <p className="font-medium text-foreground">Teléfono</p>
              <p className="text-sm text-muted-foreground">+54 11 5555-5555</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-5 w-5 text-primary" />
            <div>
              <p className="font-medium text-foreground">Oficina</p>
              <p className="text-sm text-muted-foreground">Buenos Aires, Argentina</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
