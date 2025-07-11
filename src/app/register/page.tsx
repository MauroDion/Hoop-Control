import { RegisterForm } from "@/components/auth/RegisterForm";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-headline">Crear una Cuenta</CardTitle>
          <CardDescription>Únete a la plataforma Hoop Control hoy.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <RegisterForm />
           <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                O regístrate con
              </span>
            </div>
          </div>
          <GoogleSignInButton />
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            ¿Ya tienes una cuenta?{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Inicia sesión
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
