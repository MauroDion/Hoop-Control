"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Link from "next/link";
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
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { useRouter } from "next/navigation";
import React from "react";

const formSchema = z.object({
  email: z.string().email({ message: "Dirección de email inválida." }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres." }),
});

export function LoginForm() {
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      // AuthContext will handle redirection now.
      toast({
        title: "Inicio de Sesión Exitoso",
        description: "¡Bienvenido de nuevo!",
      });
    } catch (error: any) {
      console.error("Error de inicio de sesión: ", error);
      toast({
        variant: "destructive",
        title: "Fallo en el Inicio de Sesión",
        description: error.code === 'auth/invalid-credential' 
          ? "Email o contraseña inválidos." 
          : error.message || "Email o contraseña inválidos.",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
               <div className="flex justify-end">
                 <Link href="/reset-password" passHref>
                    <Button variant="link" type="button" className="px-0 text-sm h-auto py-0">
                    ¿Olvidaste tu contraseña?
                    </Button>
                </Link>
               </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2 pt-2">
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Iniciando sesión..." : "Iniciar Sesión"}
            </Button>
            <Button type="button" variant="outline" className="w-full" onClick={() => router.push('/')}>
                Cancelar
            </Button>
        </div>
      </form>
    </Form>
  );
}
