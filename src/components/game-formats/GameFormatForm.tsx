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
import { Textarea } from "@/components/ui/textarea";
import type { GameFormatFormData } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { createGameFormat } from "@/app/game-formats/actions";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

const formatSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
  description: z.string().optional(),
  numPeriods: z.coerce.number().optional(),
  periodDurationMinutes: z.coerce.number().optional(),
  defaultTotalTimeouts: z.coerce.number().optional(),
  minPeriodsPlayerMustPlay: z.coerce.number().optional(),
});

interface GameFormatFormProps {
  onFormSubmit: () => void;
}

export function GameFormatForm({ onFormSubmit }: GameFormatFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<z.infer<typeof formatSchema>>({
    resolver: zodResolver(formatSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formatSchema>) {
    if (!user) {
      toast({ variant: "destructive", title: "Error de autenticación" });
      return;
    }

    const result = await createGameFormat(values, user.uid);

    if (result.success) {
      toast({
        title: "Formato Creado",
        description: `El formato de partido "${values.name}" ha sido creado.`,
      });
      form.reset();
      onFormSubmit();
    } else {
      toast({
        variant: "destructive",
        title: "Error al Crear",
        description: result.error || "Ocurrió un error inesperado.",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del Formato</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Estándar 5vs5" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción (Opcional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Describe las reglas clave o el uso de este formato" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <FormField
                control={form.control}
                name="numPeriods"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Nº Períodos</FormLabel>
                    <FormControl>
                    <Input type="number" placeholder="4" {...field} onChange={(e) => field.onChange(e.target.valueAsNumber)} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="periodDurationMinutes"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Duración (min)</FormLabel>
                    <FormControl>
                    <Input type="number" placeholder="10" {...field} onChange={(e) => field.onChange(e.target.valueAsNumber)} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="defaultTotalTimeouts"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Tiempos Muertos</FormLabel>
                    <FormControl>
                    <Input type="number" placeholder="4" {...field} onChange={(e) => field.onChange(e.target.valueAsNumber)} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="minPeriodsPlayerMustPlay"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Mín. Períodos / Jugador</FormLabel>
                    <FormControl>
                    <Input type="number" placeholder="1" {...field} onChange={(e) => field.onChange(e.target.valueAsNumber)} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
        </div>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Crear Formato de Partido
        </Button>
      </form>
    </Form>
  );
}
