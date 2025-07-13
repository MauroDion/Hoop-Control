
"use client";

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoginForm } from "@/components/auth/LoginForm";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Clock, ShieldX, Loader2 } from "lucide-react";

const RedirectingLoader = () => {
    const { user, loading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectUrl = searchParams.get("redirect") || "/dashboard";

    useEffect(() => {
        console.log("LoginPage (RedirectingLoader): Montado. user:", !!user, "loading:", loading);
        if (!loading && user) {
             setTimeout(() => {
                console.log('🔁 LoginPage: Redirigiendo a:', redirectUrl);
                router.push(redirectUrl);
            }, 0);
        }
    }, [user, loading, router, redirectUrl]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg text-muted-foreground">
                Usuario autenticado, redirigiendo a: {redirectUrl}
            </p>
        </div>
    );
};


export default function LoginPage() {
  const { user, loading } = useAuth();
  const searchParams = useSearchParams();
  const status = searchParams.get("status");

  console.log("LoginPage: Renderizando. user:", !!user, "loading:", loading);
  
  // If loading, show a generic checking state.
  if (loading) {
     return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg text-muted-foreground">Verificando sesión...</p>
        </div>
    );
  }

  // If NOT loading and a user object exists, render the RedirectingLoader.
  if (user) {
    return <RedirectingLoader />;
  }

  // If NOT loading and NO user, show the full login form.
  const renderStatusMessage = () => {
    switch (status) {
      case 'pending_approval':
        return (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertTitle>Cuenta Pendiente de Aprobación</AlertTitle>
            <AlertDescription>
              Tu registro ha sido enviado. Podrás iniciar sesión una vez que un administrador apruebe tu cuenta.
            </AlertDescription>
          </Alert>
        );
      case 'rejected':
        return (
          <Alert variant="destructive">
            <ShieldX className="h-4 w-4" />
            <AlertTitle>Acceso a la Cuenta Denegado</AlertTitle>
            <AlertDescription>
              El acceso a tu cuenta ha sido denegado. Por favor, contacta a un administrador para más información.
            </AlertDescription>
          </Alert>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-headline">¡Bienvenido de nuevo!</CardTitle>
          <CardDescription>Inicia sesión para acceder a tu panel.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {renderStatusMessage()}
          <LoginForm />
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                O continuar con
              </span>
            </div>
          </div>
          <GoogleSignInButton />
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            ¿No tienes una cuenta?{" "}
            <Link href="/register" className="font-semibold text-primary hover:underline">
              Regístrate
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
