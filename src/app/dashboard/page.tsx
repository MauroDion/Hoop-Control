"use client";

import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Building, CheckSquare, Users, AlertTriangle, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Dummy data - replace with actual data fetching
const summaryData = {
  activeProjects: 5,
  completedTasks: 120,
  teamMembers: 15,
  alerts: 2,
};

// Placeholder for API data state
interface ApiData {
  keyMetric: string;
  value: number | string;
}
const bcsjdApiSampleData: ApiData[] = [
  { keyMetric: "Progreso General", value: "75%" },
  { keyMetric: "Uso del Presupuesto", value: "60%" },
];


export default function DashboardPage() {
  const { user, profile, loading: authLoading } = useAuth();

  const renderClubManagement = () => {
    if (authLoading || !profile) {
      return (
        <div className="flex items-center">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          <span>Cargando información de usuario...</span>
        </div>
      );
    }
    
    if (profile.profileTypeId === 'super_admin') {
      return (
        <>
          <p className="text-sm text-muted-foreground">
            Como Super Admin, tienes control total sobre clubs y equipos.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button asChild>
              <Link href={`/clubs`}>
                <Building className="mr-2 h-5 w-5" /> Gestionar Clubs
              </Link>
            </Button>
          </div>
        </>
      );
    }
    
    if (profile.clubId) {
       return (
        <>
          <p className="text-sm text-muted-foreground">
            Puedes gestionar los equipos de tu club.
          </p>
          <Button asChild>
            <Link href={`/clubs/${profile.clubId}`}>
              <Users className="mr-2 h-5 w-5" /> Gestionar mi Club
            </Link>
          </Button>
        </>
      );
    }

    return (
      <div className="flex items-center text-muted-foreground">
        <AlertTriangle className="mr-2 h-5 w-5 text-yellow-500" />
        <span>Tu perfil no está asociado a un club.</span>
      </div>
    );
  };
  
  if (authLoading || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h1 className="text-2xl font-headline font-semibold">Verificando sesión...</h1>
        <p className="text-muted-foreground">Por favor, espera.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 bg-card rounded-lg shadow-lg">
        <div>
          <h1 className="text-4xl font-headline font-bold text-primary">¡Bienvenido, {user.displayName || user.email}!</h1>
          <p className="text-lg text-muted-foreground mt-1">Este es un resumen de tu espacio de trabajo en Hoop Control.</p>
        </div>
        <Image 
          src="https://placehold.co/150x150.png" 
          alt="Avatar de usuario o imagen decorativa" 
          width={100} 
          height={100} 
          className="rounded-full shadow-md hidden sm:block"
          data-ai-hint="professional avatar"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proyectos Activos</CardTitle>
            <Building className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{summaryData.activeProjects}</div>
            <p className="text-xs text-muted-foreground">+2 desde el mes pasado</p>
          </CardContent>
        </Card>
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tareas Completadas</CardTitle>
            <CheckSquare className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{summaryData.completedTasks}</div>
            <p className="text-xs text-muted-foreground">+15 esta semana</p>
          </CardContent>
        </Card>
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Miembros del Equipo</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{summaryData.teamMembers}</div>
            <p className="text-xs text-muted-foreground">Todos activos</p>
          </CardContent>
        </Card>
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas Críticas (Ejemplo)</CardTitle>
            <AlertTriangle className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summaryData.alerts}</div>
            <p className="text-xs text-muted-foreground">Esto es una tarjeta de ejemplo</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline flex items-center">
            Gestión de Club y Equipos
          </CardTitle>
          <CardDescription>Gestiona los detalles de tu club y crea nuevos equipos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderClubManagement()}
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline flex items-center">
            <BarChart className="mr-3 h-6 w-6 text-accent" />
            Resumen de la API
          </CardTitle>
          <CardDescription>Métricas clave obtenidas de la API integrada.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {bcsjdApiSampleData.map((item) => (
            <div key={item.keyMetric} className="p-4 border rounded-md bg-secondary/30">
              <h3 className="text-sm font-medium text-muted-foreground">{item.keyMetric}</h3>
              <p className="text-2xl font-bold text-primary">{item.value}</p>
            </div>
          ))}
           <div className="p-4 border rounded-md bg-secondary/30 flex items-center justify-center">
             <Image 
                src="https://placehold.co/300x150.png" 
                alt="Gráfico de ejemplo" 
                width={300} 
                height={150} 
                className="rounded shadow"
                data-ai-hint="data chart"
              />
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
