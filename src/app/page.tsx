import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';

export default function HomePage() {
  // This page is now a simple Server Component.
  // It no longer contains client-side logic to check for authentication.
  // The middleware (`src/middleware.ts`) is solely responsible for redirecting
  // authenticated users away from this page to the /dashboard.
  // This approach simplifies the logic and prevents client-server race conditions.

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-6 bg-gradient-to-br from-background to-secondary/30 rounded-xl shadow-2xl">
      <div className="max-w-2xl">
        <Image 
          src="https://placehold.co/600x300.png" 
          alt="Ilustración de la plataforma Hoop Control" 
          width={600} 
          height={300} 
          priority 
          className="rounded-lg mb-10 shadow-lg"
          data-ai-hint="basketball court"
        />
        <h1 className="text-5xl md:text-6xl font-headline font-extrabold mb-6 text-primary tracking-tight">
          Bienvenido a Hoop Control
        </h1>
        <p className="text-lg md:text-xl text-foreground/80 mb-10 leading-relaxed">
          El seguimiento de partidos de baloncesto, simplificado. Gestiona equipos, jugadores y estadísticas en vivo, todo en un solo lugar.
        </p>
        <div className="space-x-6">
          <Button asChild size="lg" className="shadow-lg hover:shadow-primary/50 transition-shadow duration-300">
            <Link href="/login">Comenzar</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="shadow-lg hover:shadow-md transition-shadow duration-300">
            <Link href="/register">Crear Cuenta</Link>
          </Button>
        </div>
        <p className="mt-12 text-sm text-muted-foreground">
          Impulsado por tecnología moderna para una experiencia fluida.
        </p>
      </div>
    </div>
  );
}
