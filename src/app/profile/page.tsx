"use client";

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { auth, updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from '@/lib/firebase/client';
import React, { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserCircle, Edit3, ShieldAlert, AlertTriangle } from 'lucide-react';

const profileSchema = z.object({
  displayName: z.string().min(2, "El nombre debe tener al menos 2 caracteres.").optional(),
  email: z.string().email().optional(), // El email normalmente no se cambia aquí
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "La contraseña actual es requerida."),
  newPassword: z.string().min(6, "La nueva contraseña debe tener al menos 6 caracteres."),
  confirmPassword: z.string().min(6, "La confirmación de contraseña debe tener al menos 6 caracteres."),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});


export default function ProfilePage() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user?.displayName || "",
      email: user?.email || "",
    },
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (user) {
      profileForm.reset({
        displayName: user.displayName || "",
        email: user.email || "",
      });
    }
  }, [user, profileForm]);

  const handleProfileUpdate = async (values: z.infer<typeof profileSchema>) => {
    if (!auth.currentUser) return;
    try {
      await updateProfile(auth.currentUser, { displayName: values.displayName });
      toast({ title: "Perfil Actualizado", description: "Tu nombre de usuario ha sido actualizado." });
      setIsEditingProfile(false);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error al Actualizar", description: error.message });
    }
  };

  const handlePasswordUpdate = async (values: z.infer<typeof passwordSchema>) => {
    if (!auth.currentUser || !auth.currentUser.email) {
        toast({ variant: "destructive", title: "Error", description: "Usuario no encontrado o sin email." });
        return;
    }
    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email, values.currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      
      await updatePassword(auth.currentUser, values.newPassword);
      toast({ title: "Contraseña Actualizada", description: "Tu contraseña ha sido cambiada exitosamente." });
      passwordForm.reset();
    } catch (error: any) {
      console.error("Error al actualizar contraseña: ", error);
      toast({ variant: "destructive", title: "Fallo al Actualizar Contraseña", description: error.message || "Por favor, verifica tu contraseña actual." });
    }
  };
  
  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return names[0].substring(0, 2).toUpperCase();
  };

  if (loading) {
    return <p>Cargando perfil...</p>;
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-headline font-semibold text-destructive">Acceso Denegado</h1>
        <p className="text-muted-foreground">Por favor, inicia sesión para ver tu perfil.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div className="flex items-center space-x-4 p-6 bg-card rounded-lg shadow-lg">
        <Avatar className="h-24 w-24 border-2 border-primary">
          <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || 'Usuario'} />
          <AvatarFallback className="text-3xl">{getInitials(user.displayName || user.email)}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary">{user.displayName || 'Perfil de Usuario'}</h1>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle className="text-2xl font-headline flex items-center"><UserCircle className="mr-2 h-6 w-6 text-accent" />Información Personal</CardTitle>
            <CardDescription>Ve y actualiza tus datos personales.</CardDescription>
          </div>
          {!isEditingProfile && (
            <Button variant="outline" size="sm" onClick={() => setIsEditingProfile(true)}>
              <Edit3 className="mr-2 h-4 w-4" /> Editar
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(handleProfileUpdate)} className="space-y-4">
              <FormField
                control={profileForm.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de Usuario</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!isEditingProfile} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormItem>
                <FormLabel>Email</FormLabel>
                <Input type="email" value={user.email || ""} disabled />
                <p className="text-xs text-muted-foreground pt-1">El email no se puede cambiar.</p>
              </FormItem>
              {isEditingProfile && (
                <div className="flex space-x-2 pt-2">
                  <Button type="submit" disabled={profileForm.formState.isSubmitting}>
                    {profileForm.formState.isSubmitting ? "Guardando..." : "Guardar Cambios"}
                  </Button>
                  <Button variant="ghost" onClick={() => {
                    setIsEditingProfile(false);
                    profileForm.reset({ displayName: user.displayName || "", email: user.email || "" });
                  }}>
                    Cancelar
                  </Button>
                </div>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline flex items-center"><ShieldAlert className="mr-2 h-6 w-6 text-accent"/>Cambiar Contraseña</CardTitle>
          <CardDescription>Actualiza la contraseña de tu cuenta.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(handlePasswordUpdate)} className="space-y-4">
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña Actual</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nueva Contraseña</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar Nueva Contraseña</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={passwordForm.formState.isSubmitting} className="mt-2">
                {passwordForm.formState.isSubmitting ? "Actualizando..." : "Actualizar Contraseña"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
