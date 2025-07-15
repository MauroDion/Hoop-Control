
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { Separator } from '@/components/ui/separator';

export default function LoginPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { branding } = useAuth();
    const { appName, logoLoginUrl } = branding;

    const status = searchParams.get('status');

    return (
        <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
            <div className="w-full max-w-md space-y-6">
                {status === 'pending_approval' && (
                    <Alert variant="default" className="bg-green-50 border-green-200">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertTitle className="text-green-800">¡Registro Enviado!</AlertTitle>
                        <AlertDescription className="text-green-700">
                            Tu solicitud de registro ha sido recibida. Un administrador la revisará pronto. Recibirás una notificación por correo electrónico una vez que tu cuenta sea aprobada.
                        </AlertDescription>
                    </Alert>
                )}
                 {status === 'approved' && (
                    <Alert variant="default" className="bg-green-50 border-green-200">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertTitle className="text-green-800">¡Perfil Activado!</AlertTitle>
                        <AlertDescription className="text-green-700">
                            Tu cuenta de super admin ha sido activada. Por favor, inicia sesión para continuar.
                        </AlertDescription>
                    </Alert>
                )}
                {status === 'rejected' && (
                     <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Acceso Denegado</AlertTitle>
                        <AlertDescription>
                            Tu cuenta no ha sido aprobada. Si crees que esto es un error, por favor contacta con el soporte.
                        </AlertDescription>
                    </Alert>
                )}

                <Card className="shadow-xl">
                    <CardHeader className="text-center">
                        {logoLoginUrl ? (
                             <div className="relative h-24 w-full">
                                <Image src={logoLoginUrl} alt={appName || "Hoop Control Logo"} fill style={{objectFit: 'contain'}} />
                            </div>
                        ) : (
                             <CardTitle className="text-3xl font-headline">{appName || "Hoop Control"}</CardTitle>
                        )}
                        <CardDescription>
                            Inicia sesión para acceder a tu panel de control
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                       <GoogleSignInButton />
                    </CardContent>
                    <CardFooter>
                       <p className="text-xs text-muted-foreground text-center w-full">Al iniciar sesión, aceptas nuestros Términos de Servicio y Política de Privacidad.</p>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
