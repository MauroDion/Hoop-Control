"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { finalizeNewUserProfile } from "@/app/users/actions";
import { getApprovedClubs } from "@/app/clubs/actions";
import { getProfileTypeOptions } from "@/app/profile-types/actions";
import type { Club, ProfileType, ProfileTypeOption } from "@/types";
import { Loader2, UserCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const formSchema = z.object({
  profileType: z.enum([ 'club_admin', 'coach', 'coordinator', 'parent_guardian', 'player', 'scorer', 'super_admin', 'user' ], {
    errorMap: () => ({ message: "Please select a valid profile type." })
  }),
  selectedClubId: z.string().min(1, { message: "Please select a club." }),
});

export default function CompleteRegistrationPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loadingClubs, setLoadingClubs] = useState(true);
  const [profileTypeOptions, setProfileTypeOptions] = useState<ProfileTypeOption[]>([]);
  const [loadingProfileTypes, setLoadingProfileTypes] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoadingClubs(true);
      setLoadingProfileTypes(true);
      try {
        const [fetchedClubs, fetchedProfileTypes] = await Promise.all([ getApprovedClubs(), getProfileTypeOptions() ]);
        setClubs(Array.isArray(fetchedClubs) ? fetchedClubs : []);
        setProfileTypeOptions(Array.isArray(fetchedProfileTypes) ? fetchedProfileTypes.filter(pt => pt.id !== 'super_admin') : []);
      } catch (error: any) {
        toast({ variant: "destructive", title: "Error Loading Data", description: error.message || "Could not load data."});
      } finally {
        setLoadingClubs(false);
        setLoadingProfileTypes(false);
      }
    }
    fetchData();
  }, [toast]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
        toast({ variant: "destructive", title: "Authentication Error", description: "User not found. Please sign in again." });
        return;
    }
    
    try {
      const idToken = await user.getIdToken();
      const profileResult = await finalizeNewUserProfile(idToken, {
        displayName: user.displayName || user.email || 'New User',
        profileType: values.profileType,
        selectedClubId: values.selectedClubId,
      });

      if (!profileResult.success) {
        throw new Error(profileResult.error || "Failed to create user profile on the server.");
      }

      toast({
        title: "Registration Complete",
        description: "Your profile has been created and is pending approval.",
        duration: 7000,
      });
      
      await logout();
      router.push('/login?status=pending_approval');

    } catch (error: any) {
        toast({ variant: "destructive", title: "Registration Failed", description: error.message });
    }
  }

  if (authLoading || !user) {
      return (
        <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      );
  }

  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <UserCheck className="mx-auto h-12 w-12 text-primary" />
          <CardTitle className="text-3xl font-headline">Completa tu Perfil</CardTitle>
          <CardDescription>¡Bienvenido, {user.displayName}! Por favor, proporciona algunos detalles más para continuar.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="profileType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tu Rol</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={loadingProfileTypes || profileTypeOptions.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Selecciona tu rol" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {profileTypeOptions.map((type) => (
                            <SelectItem key={type.id} value={type.id}>{type.label}</SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="selectedClubId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tu Club</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={loadingClubs || clubs.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Selecciona tu club" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clubs.map((club) => (
                             <SelectItem key={club.id} value={club.id}>{club.name}</SelectItem>
                           )
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || loadingClubs || loadingProfileTypes}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Completar Registro
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
