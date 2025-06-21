
"use client";

import { ClubForm } from "@/components/clubs/ClubForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { getUserProfileById } from '@/app/users/actions';
import { Loader2, AlertTriangle, Building, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NewClubPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/login?redirect=/clubs/new');
      return;
    }

    const verifyAdmin = async () => {
      const profile = await getUserProfileById(user.uid);
      if (profile?.profileTypeId === 'super_admin') {
        setIsSuperAdmin(true);
      }
      setLoading(false);
    };
    verifyAdmin();

  }, [user, authLoading, router]);

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4">Verifying permissions...</p>
      </div>
    );
  }

  if (!isSuperAdmin) {
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold text-destructive">Access Denied</h1>
        <p className="text-muted-foreground">You must be a Super Admin to create a new club.</p>
        <Button onClick={() => router.push('/dashboard')} className="mt-4">Go to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Button variant="outline" size="sm" asChild className="mb-6">
        <Link href="/clubs">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Club Management
        </Link>
      </Button>
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline flex items-center">
            <Building className="mr-3 h-8 w-8 text-primary" />
            Create New Club
          </CardTitle>
          <CardDescription>Fill in the details below to register a new club in the system.</CardDescription>
        </CardHeader>
        <CardContent>
          <ClubForm />
        </CardContent>
      </Card>
    </div>
  );
}
