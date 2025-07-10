"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
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
import type { Player, PlayerFormData } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { createPlayer, updatePlayer } from "@/lib/actions/players";
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from "lucide-react";
import React from 'react';

const playerFormSchema = z.object({
  firstName: z.string().min(1, "El nombre es obligatorio."),
  lastName: z.string().min(1, "El apellido es obligatorio."),
  jerseyNumber: z.coerce.number().optional().nullable(),
  position: z.string().optional().nullable(),
});

interface PlayerFormProps {
  teamId: string;
  clubId: string;
  onFormSubmit: () => void;
  player?: Player | null; // For edit mode
}

export function PlayerForm({ teamId, clubId, onFormSubmit, player }: PlayerFormProps) {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const form = useForm<z.infer<typeof playerFormSchema>>({
    resolver: zodResolver(playerFormSchema),
    defaultValues: {
      firstName: player?.firstName || "",
      lastName: player?.lastName || "",
      jerseyNumber: player?.jerseyNumber || undefined,
      position: player?.position || "",
    },
  });

  React.useEffect(() => {
    form.reset({
      firstName: player?.firstName || "",
      lastName: player?.lastName || "",
      jerseyNumber: player?.jerseyNumber || undefined,
      position: player?.position || "",
    });
  }, [player, form]);

  async function onSubmit(values: z.infer<typeof playerFormSchema>) {
    if (authLoading || !user) {
      toast({ variant: "destructive", title: "Error de autenticación", description: "Debes haber iniciado sesión." });
      return;
    }

    const result = player
      ? await updatePlayer(player.id, values, clubId, teamId)
      : await createPlayer(values, teamId, clubId, user.uid);

    if (result.success) {
      toast({
        title: player ? "Jugador Actualizado" : "Jugador Añadido",
        description: `El jugador "${values.firstName} ${values.lastName}" ha sido ${player ? 'actualizado' : 'añadido'} correctamente.`,
      });
      if (!player) form.reset();
      onFormSubmit();
    } else {
      toast({
        variant: "destructive",
        title: player ? "Error al actualizar" : "Error al añadir jugador",
        description: result.error || "Ocurrió un error inesperado.",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                    <Input placeholder="Ej: Lionel" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Apellido</FormLabel>
                <FormControl>
                    <Input placeholder="Ej: Messi" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
            control={form.control}
            name="jerseyNumber"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Dorsal (Opcional)</FormLabel>
                <FormControl>
                    <Input type="number" placeholder="Ej: 10" {...field} onChange={e => field.onChange(e.target.value === '' ? null : e.target.value)} value={field.value ?? ''}/>
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="position"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Posición (Opcional)</FormLabel>
                <FormControl>
                    <Input placeholder="Ej: Delantero" {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        
        <Button type="submit" className="w-full sm:w-auto" disabled={form.formState.isSubmitting || authLoading}>
          {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {player ? "Guardar Cambios" : "Añadir Jugador"}
        </Button>
      </form>
    </Form>
  );
}
