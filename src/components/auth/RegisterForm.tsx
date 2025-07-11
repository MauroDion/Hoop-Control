"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import React, { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { auth, createUserWithEmailAndPassword, signOut, type UserCredential } from "@/lib/firebase/client"; 
import { useRouter } from "next/navigation";
import { finalizeNewUserProfile } from "@/lib/actions/users";
import { getApprovedClubs } from "@/lib/actions/clubs";
import { getProfileTypeOptions } from "@/lib/actions/profile-types";
import type { Club, ProfileType, ProfileTypeOption } from "@/types";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  email: z.string().email({ message: "Dirección de email inválida." }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres." }),
  profileType: z.enum([ 'club_admin', 'coach', 'coordinator', 'parent_guardian', 'player', 'scorer', 'super_admin', 'user' ], {
    errorMap: () => ({ message: "Por favor, selecciona un tipo de perfil válido." })
  }),
  selectedClubId: z.string().optional(),
}).refine((data) => {
    // selectedClubId is required if the profileType is NOT super_admin
    if (data.profileType !== 'super_admin') {
        return !!data.selectedClubId && data.selectedClubId.length > 0;
    }
    return true;
}, {
    message: "Por favor, selecciona un club.",
    path: ["selectedClubId"],
});


export function RegisterForm() {
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
        
        if (!Array.isArray(fetchedClubs)) console.warn("RegisterForm: Fetched clubs is not an array:", fetchedClubs);
        if (!Array.isArray(fetchedProfileTypes)) console.warn("RegisterForm: Fetched profile types is not an array:", fetchedProfileTypes);

      } catch (error: any) {
        console.error("RegisterForm: Failed to fetch data for form:", error);
        toast({ variant: "destructive", title: "Error al Cargar Datos", description: error.message || "No se pudieron cargar los clubs o tipos de perfil."});
        setClubs([]);
        setProfileTypeOptions([]);
      } finally {
        setLoadingClubs(false);
        setLoadingProfileTypes(false);
      }
    }
    fetchData();
  }, [toast]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });
  
  const { watch } = form;
  const selectedProfileType = watch("profileType");

  async function onSubmit(values: z.infer<typeof formSchema>) {
    let userCredential: UserCredential | undefined;
    
    try {
      userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const firebaseUser = userCredential.user;

      if (!firebaseUser) {
        throw new Error("La creación del usuario falló, el objeto de usuario es nulo.");
      }
      
      const idToken = await firebaseUser.getIdToken();

      const profileResult = await finalizeNewUserProfile(idToken, {
        displayName: values.name,
        profileType: values.profileType,
        selectedClubId: selectedProfileType === 'super_admin' ? null : values.selectedClubId!,
      });

      if (!profileResult.success) {
        throw new Error(profileResult.error || "No se pudo crear el perfil de usuario en el servidor.");
      }

      toast({
        title: "Registro Completado",
        description: "Tu perfil ha sido creado y está pendiente de aprobación.",
        duration: 7000,
      });
      
      await signOut(auth);
      router.push('/login?status=pending_approval');

    } catch (error: any) {
        toast({ variant: "destructive", title: "Fallo en el Registro", description: error.message });
    }
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre Completo</FormLabel>
                <FormControl>
                  <Input placeholder="Juan Pérez" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="tu@email.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contraseña</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
    </>
  );
}
