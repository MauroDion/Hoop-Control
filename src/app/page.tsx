import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { Dribbble } from 'lucide-react';

export default async function HomePage() {

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-6 bg-gradient-to-br from-background to-secondary/30 rounded-xl shadow-2xl">
      <div className="max-w-2xl">
        <div className="mb-10 shadow-lg">
          <Image 
            src={"https://placehold.co/600x300.png"} 
            alt="Hoop Control Platform Illustration" 
            width={600} 
            height={300} 
            priority 
            className="rounded-lg object-cover"
            data-ai-hint="basketball court"
          />
        </div>
        <h1 className="text-5xl md:text-6xl font-headline font-extrabold mb-6 text-primary tracking-tight flex justify-center items-center gap-4">
          <Dribbble className="h-16 w-16" />
          Hoop Control
        </h1>
        <p className="text-lg md:text-xl text-foreground/80 mb-10 leading-relaxed">
          Seguimiento de partidos de baloncesto  simplificado. Gestiona equipos, jugadores y estadísticas en vivo.
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
          Impulsado por tecnología de KILRON SOFTWARE
        </p>
      </div>
    </div>
  );
}
