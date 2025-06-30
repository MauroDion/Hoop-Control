"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle, Database, Wand2 } from 'lucide-react';
import { seedDatabase } from './actions';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type PageState = 'loading' | 'error' | 'success';

export default function SeederPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [isSeeding, setIsSeeding] = useState(false);
  const [pageState, setPageState] = useState<PageState>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) {
      setPageState('loading');
      return;
    }
    if (!user) {
      router.replace('/login?redirect=/admin/seeder');
      return;
    }
    
    if (profile) {
      if (profile.profileTypeId === 'super_admin') {
        setPageState('success');
      } else {
        setError('Acceso Denegado. Solo los Super Admins pueden poblar la base de datos.');
        setPageState('error');
      }
    } else {
       setError("No se pudo cargar tu perfil. Es posible que no exista o haya un problema de configuración.");
       setPageState('error');
    }

  }, [user, profile, authLoading, router]);


  const handleSeedDatabase = async () => {
    setIsSeeding(true);
    setError(null);
    const result = await seedDatabase();
    if (result.success) {
      toast({
        title: '¡Base de Datos Poblada!',
        description: 'Se han añadido los datos de ejemplo correctamente. Refresca las otras páginas para ver los cambios.',
        duration: 7000,
      });
    } else {
      setError(result.error || 'Ha ocurrido un error desconocido.');
      toast({
        variant: 'destructive',
        title: 'Error al Poblar la Base de Datos',
        description: result.error,
      });
    }
    setIsSeeding(false);
  };
  
  if (pageState === 'loading') {
    return (
       <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4">Verificando permisos...</p>
      </div>
    )
  }

  if (pageState === 'error') {
     return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
            <h1 className="text-2xl font-semibold text-destructive">Error</h1>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button asChild><Link href="/dashboard">Volver al Panel</Link></Button>
        </div>
      );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline flex items-center">
            <Database className="mr-3 h-8 w-8 text-primary" />
            Poblador de Base de Datos (Seeder)
          </CardTitle>
          <CardDescription>
            Herramienta de desarrollo para llenar Firestore con un conjunto completo de datos de prueba.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="text-center p-6 border-2 border-dashed rounded-lg">
                <Wand2 className="mx-auto h-12 w-12 text-muted-foreground mb-4"/>
                <h3 className="text-xl font-semibold">¿Listo para empezar?</h3>
                <p className="text-muted-foreground my-2">
                    Hacer clic en el botón de abajo borrará las colecciones de prueba (clubs, equipos, etc.) y los perfiles de usuario de prueba, y los reemplazará con un nuevo conjunto de datos.
                </p>
                <p className="text-sm font-bold text-destructive my-4">
                    <AlertTriangle className="inline-block h-4 w-4 mr-1" />
                    ¡Esta acción es irreversible y afectará a todos los usuarios!
                </p>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                     <Button disabled={isSeeding} size="lg" variant="destructive">
                        {isSeeding ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Database className="mr-2 h-5 w-5" />}
                        {isSeeding ? 'Poblando...' : 'Poblar Base de Datos de Prueba'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción es irreversible. Se borrarán permanentemente las colecciones de prueba (partidos, temporadas, equipos, etc.) y los usuarios generados por el seeder para ser reemplazados con nuevos datos. Los usuarios reales no serán eliminados.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleSeedDatabase}
                        className="bg-destructive hover:bg-destructive/80"
                      >
                        Sí, poblar la base de datos
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
