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
            Poblador de Base de Datos
          </CardTitle>
          <CardDescription>
            Usa esta herramienta para llenar tu base de datos de Firestore con datos de ejemplo para clubs, equipos, jugadores y más.
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
                    Hacer clic en el botón de abajo borrará las colecciones existentes y las llenará con nuevos datos de prueba. 
                    Esta acción no se puede deshacer.
                </p>
                <Button onClick={handleSeedDatabase} disabled={loading} size="lg">
                    {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Database className="mr-2 h-5 w-5" />}
                    {loading ? 'Poblando...' : 'Poblar Base de Datos de Prueba'}
                </Button>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
}
