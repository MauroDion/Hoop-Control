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
import { auth, createUserWithEmailAndPassword, signOut, type UserCredential } from "@/lib/firebase/client"; 
import { useRouter } from "next/navigation";
import { finalizeNewUserProfile } from "@/lib/actions/users";
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
    let userCredential: UserCredential | undefined;
    
    try {
      userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const firebaseUser = userCredential.user;

      if (!firebaseUser) {
        throw new Error("La creación del usuario falló, el objeto de usuario es nulo.");
      }
      
      const idToken = await firebaseUser.getIdToken();

      // Pass only the essential data. Role and Club will be selected after login.
      const profileResult = await finalizeNewUserProfile(idToken, {
        displayName: values.name,
      });

      if (!profileResult.success) {
        throw new Error(profileResult.error || "No se pudo crear el perfil de usuario en el servidor.");
      }

      toast({
        title: "Registro Enviado",
        description: "Tu cuenta ha sido creada y está pendiente de aprobación. Podrás iniciar sesión una vez que un administrador la apruebe.",
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
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {form.formState.isSubmitting ? "Registrando..." : "Crear Cuenta"}
          </Button>
        </form>
      </Form>
    </>
  );
}
