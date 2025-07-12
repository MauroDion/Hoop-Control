
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
import { completeOnboardingProfile } from "@/lib/actions/users";
import { getApprovedClubs } from "@/lib/actions/clubs";
import { getProfileTypeOptions } from "@/lib/actions/profile-types";
import type { Club, ProfileType, ProfileTypeOption } from "@/types";
import { Loader2, UserCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const formSchema = z.object({
  profileType: z.enum([ 'club_admin', 'coach', 'coordinator', 'parent_guardian', 'player', 'scorer', 'super_admin', 'user' ], {
    errorMap: () => ({ message: "Por favor, selecciona un tipo de perfil válido." })
  }),
  selectedClubId: z.string().optional(),
}).refine((data) => {
    // A club is only required if the profile type is NOT super_admin.
    if (data.profileType !== 'super_admin') {
        return !!data.selectedClubId && data.selectedClubId.length > 0;
    }
    return true;
}, {
    message: "Por favor, selecciona un club.",
    path: ["selectedClubId"],
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
        // Allow 'super_admin' to be selected in the list
        setProfileTypeOptions(Array.isArray(fetchedProfileTypes) ? fetchedProfileTypes : []);
      } catch (error: any) {
        toast({ variant: "destructive", title: "Error al Cargar Datos", description: error.message || "No se pudieron cargar los datos."});
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
  
  const { watch } = form;
  const selectedProfileType = watch("profileType");

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
        toast({ variant: "destructive", title: "Error de Autenticación", description: "Usuario no encontrado. Por favor, inicia sesión de nuevo." });
        return;
    }
    
    try {
      const profileResult = await completeOnboardingProfile(user.uid, {
        profileType: values.profileType,
        selectedClubId: values.selectedClubId || null,
      });

      if (!profileResult.success) {
        throw new Error(profileResult.error || "No se pudo actualizar el perfil de usuario en el servidor.");
      }
      
      const isSuperAdmin = values.profileType === 'super_admin';

      toast({
        title: "Registro Completado",
        description: isSuperAdmin 
          ? "Tu perfil de super admin ha sido activado. Serás desconectado para iniciar sesión."
          : "Tu perfil ha sido creado y está pendiente de aprobación.",
        duration: 7000,
      });
      
      await logout();
      const redirectStatus = isSuperAdmin ? 'approved' : 'pending_approval';
      router.push(`/login?status=${redirectStatus}`);

    } catch (error: any) {
        toast({ variant: "destructive", title: "Fallo en el Registro", description: error.message });
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
                            <SelectItem key={type.id} value={type.id!}>{type.label}</SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {selectedProfileType !== 'super_admin' && (
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
                            ))
                            }
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              )}
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
