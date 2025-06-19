"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-6">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-6" />
        <h1 className="text-3xl font-headline font-bold mb-2">Loading Application...</h1>
        <p className="text-muted-foreground">Please wait while we prepare your experience.</p>
      </div>
    );
  }

  if (user) {
     // This state should ideally not be reached due to useEffect redirect, but as a fallback:
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-6">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-6" />
        <h1 className="text-3xl font-headline font-bold mb-2">Redirecting...</h1>
        <p className="text-muted-foreground">Taking you to your dashboard.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-6 bg-gradient-to-br from-background to-secondary/30 rounded-xl shadow-2xl">
      <div className="max-w-2xl">
        <Image 
          src="https://placehold.co/600x300.png" 
          alt="BCSJD Platform Illustration" 
          width={600} 
          height={300} 
          priority 
          className="rounded-lg mb-10 shadow-lg"
          data-ai-hint="collaboration team"
        />
        <h1 className="text-5xl md:text-6xl font-headline font-extrabold mb-6 text-primary tracking-tight">
          Welcome to the BCSJD Web Application
        </h1>
        <p className="text-lg md:text-xl text-foreground/80 mb-10 leading-relaxed">
          Streamline your workflows, manage critical data, and collaborate effectively with our integrated platform. Built for performance and ease of use.
        </p>
        <div className="space-x-6">
          <Button asChild size="lg" className="shadow-lg hover:shadow-primary/50 transition-shadow duration-300">
            <Link href="/login">Get Started</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="shadow-lg hover:shadow-md transition-shadow duration-300">
            <Link href="/register">Create Account</Link>
          </Button>
        </div>
        <p className="mt-12 text-sm text-muted-foreground">
          Powered by modern technology for a seamless experience.
        </p>
      </div>
    </div>
  );
}
