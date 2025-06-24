"use client";

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle, Database, Wand2 } from 'lucide-react';
import { seedDatabase } from './actions';
import { useToast } from '@/hooks/use-toast';
import { getUserProfileById } from '@/app/users/actions';
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

export default function SeederPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [verifying, setVerifying] = useState(true);

  React.useEffect(() => {
    if (!authLoading && user) {
      getUserProfileById(user.uid)
        .then(profile => {
          if (profile?.profileTypeId !== 'super_admin') {
            setError('Acceso Denegado. Solo los Super Admins pueden poblar la base de datos.');
          } else {
            setIsSuperAdmin(true);
          }
        })
        .finally(() => setVerifying(false));
    } else if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  const handleSeedDatabase = async () => {
    setLoading(true);
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
    setLoading(false);
  };
  
  if (authLoading || verifying) {
    return (
       <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4">Verificando permisos...</p>
      </div>
    )
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
          {error && (
            <div className="flex flex-col items-center justify-center text-center">
              <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
              <h2 className="text-xl font-semibold text-destructive">Error</h2>
              <p className="text-muted-foreground">{error}</p>
            </div>
          )}
          
          {isSuperAdmin && !error && (
            <div className="text-center p-6 border-2 border-dashed rounded-lg">
                <Wand2 className="mx-auto h-12 w-12 text-muted-foreground mb-4"/>
                <h3 className="text-xl font-semibold">¿Listo para empezar?</h3>
                <p className="text-muted-foreground my-2">
                    Hacer clic en el botón de abajo borrará las colecciones existentes (incluyendo **todos los perfiles de usuario**) y las llenará con un nuevo conjunto de datos de prueba: 5 clubs, 5 categorías por club, 25 equipos, ~200 jugadores y 1 temporada activa.
                </p>
                <p className="text-sm font-bold text-destructive my-4">
                    <AlertTriangle className="inline-block h-4 w-4 mr-1" />
                    ¡Esta acción no se puede deshacer!
                </p>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                     <Button disabled={loading} size="lg" variant="destructive">
                        {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Database className="mr-2 h-5 w-5" />}
                        {loading ? 'Poblando...' : 'Poblar Base de Datos de Prueba'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción es irreversible. Se borrarán permanentemente las colecciones de usuarios, clubs, equipos, jugadores y temporadas, y se reemplazarán con datos de prueba.
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
          )}

        </CardContent>
      </Card>
    </div>
  );
}
