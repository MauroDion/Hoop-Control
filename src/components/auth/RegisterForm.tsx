"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import React from "react";

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
import { useToast } from "@/hooks/use-toast";
import { auth, createUserWithEmailAndPassword, signOut, updateProfile } from "@/lib/firebase/client"; 
import { createFirestoreUserProfile } from "@/lib/actions/users";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  email: z.string().email({ message: "Dirección de email inválida." }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres." }),
});

export function RegisterForm() {
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    console.log("RegisterForm: onSubmit. values:", values);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const firebaseUser = userCredential.user;
      
      await updateProfile(firebaseUser, { displayName: values.name });
      
      // Immediately create the Firestore profile document after Auth user creation
      const profileResult = await createFirestoreUserProfile(firebaseUser.uid, {
        email: values.email,
        displayName: values.name,
        photoURL: firebaseUser.photoURL,
      });

      if (!profileResult.success) {
        throw new Error(profileResult.error || "No se pudo crear el perfil en la base de datos.");
      }

      // Sign the user out to force them to log in and complete onboarding
      await signOut(auth);

      toast({
        title: "¡Registro Exitoso!",
        description: "Tu cuenta ha sido creada. Ahora puedes iniciar sesión para completar tu perfil.",
        duration: 7000,
      });
      
      // Redirect to login page so they can proceed to the 'complete-registration' page
      router.push('/login');

    } catch (error: any) {
        console.error("Registration Error:", error);
        let errorMessage = "Ocurrió un error inesperado.";
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = "Este email ya está registrado. Por favor, inicia sesión.";
        }
        toast({ variant: "destructive", title: "Fallo en el Registro", description: errorMessage });
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
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {form.formState.isSubmitting ? "Registrando..." : "Crear Cuenta"}
          </Button>
        </form>
      </Form>
    </>
  );
}
