
"use client"; // This page needs to be a client component for useEffect and useState

import React, { useEffect, useState } from 'react';
import { getKeyMetrics } from '@/lib/hoopControlApi';
import type { ApiDataItem } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart3, AlertTriangle, Loader2, RefreshCw, HelpCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ApiDataPage() {
  const [data, setData] = useState<ApiDataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isForbiddenError, setIsForbiddenError] = useState(false);
  const [isMockData, setIsMockData] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    setIsForbiddenError(false);
    setIsMockData(false);
    try {
      const result = await getKeyMetrics();
      setData(result.data);
      setIsMockData(result.isMock);
      if (result.isMock) {
         // This is not a critical error, just a state to show info to the user.
         console.warn("Displaying mock data because the real API call failed.");
      }
    } catch (err: any) {
      const errorMessage = err.message || "Fallo al obtener datos de la API.";
      setError(errorMessage);
      if (errorMessage.includes('403') || errorMessage.toLowerCase().includes('forbidden')) {
        setIsForbiddenError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-10">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg text-muted-foreground">Cargando datos de la API...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-10 bg-destructive/10 border border-destructive rounded-lg p-6">
          <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
          <h2 className="text-xl font-semibold text-destructive">Error al Obtener Datos</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          {isForbiddenError && (
            <div className="mt-4 mb-6 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 text-sm text-left">
              <div className="flex">
                <div className="py-1"><HelpCircle className="h-5 w-5 text-yellow-500 mr-3" /></div>
                <div>
                  Un error <strong>403 Prohibido</strong> significa que el servidor está denegando el acceso.
                  Razones comunes para esto incluyen:
                  <ul className="list-disc list-inside mt-2">
                    <li>La clave de API (<code>NEXT_PUBLIC_HOOP_CONTROL_API_KEY</code>) podría ser incorrecta, faltar o no estar autorizada para esta acción.</li>
                    <li>El servidor de la API podría tener restricciones de IP u otras medidas de seguridad.</li>
                  </ul>
                  <p className="mt-2">Por favor, revisa tu archivo <code>.env.local</code> para la clave de API y consulta la documentación o al administrador de la API.</p>
                </div>
              </div>
            </div>
          )}
          <p className="text-sm text-muted-foreground mb-4">
            Consejo: Abre las Herramientas de Desarrollador de tu navegador (F12), ve a la pestaña "Red" y actualiza. Busca las solicitudes fallidas (a menudo en rojo) para ver más detalles sobre el error y la URL específica que falló.
          </p>
          <Button onClick={fetchData} variant="destructive">
            <RefreshCw className="mr-2 h-4 w-4" /> Intentar de Nuevo
          </Button>
        </div>
      );
    }
    
    if (data.length === 0) {
        return (
             <div className="text-center py-10 border-2 border-dashed rounded-lg p-6">
                <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold">No Hay Datos Disponibles</h2>
                <p className="text-muted-foreground mb-4">No se pudo obtener ningún dato de la API en este momento.</p>
                <Button onClick={fetchData}>
                    <RefreshCw className="mr-2 h-4 w-4" /> Actualizar Datos
                </Button>
            </div>
        );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre de Métrica</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead>Última Actualización</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.id} className="hover:bg-muted/50">
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell>{item.value.toString()}</TableCell>
              <TableCell>{item.category}</TableCell>
              <TableCell>{format(new Date(item.lastUpdated), 'PPpp', { locale: es })}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-4xl font-headline font-bold text-primary flex items-center">
            <BarChart3 className="mr-3 h-10 w-10" /> Datos de la API de Hoop Control
          </h1>
          <p className="text-lg text-muted-foreground mt-1">Datos en vivo del sistema externo.</p>
        </div>
        <Button onClick={fetchData} disabled={loading} variant="outline" className="mt-4 sm:mt-0">
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar Datos
        </Button>
      </div>
      
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Resumen de Métricas Clave</CardTitle>
          <CardDescription>
            Mostrando información importante recuperada directamente de la API.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isMockData && !error && (
             <Alert className="mb-6 border-yellow-500 text-yellow-800">
                <Info className="h-4 w-4 text-yellow-600" />
                <AlertTitle>Modo de Demostración</AlertTitle>
                <AlertDescription>
                  Actualmente estás viendo datos de ejemplo. La conexión con la API real de Hoop Control no se pudo establecer. Para conectar con datos reales, asegúrate de que las variables <code>NEXT_PUBLIC_HOOP_CONTROL_API_BASE_URL</code> y <code>NEXT_PUBLIC_HOOP_CONTROL_API_KEY</code> están configuradas correctamente en tu entorno.
                </AlertDescription>
            </Alert>
          )}
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
}
