import { auth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/Card";

export default async function DashboardHomePage() {
  const session = await auth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Hola, {session?.user?.name}</h1>
        <p className="mt-1 text-muted-foreground">
          Desde acá gestionás tu perfil, tus publicaciones y tu método de pago.
        </p>
      </div>

      <Card>
        <CardContent className="pt-5 text-sm text-muted-foreground">
          Cuenta tipo: <span className="font-medium text-foreground">{session?.user?.accountType}</span>
        </CardContent>
      </Card>
    </div>
  );
}
