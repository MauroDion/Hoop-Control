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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CompetitionCategoryFormData, GameFormat, CompetitionCategory } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { createCompetitionCategory, updateCompetitionCategory } from "@/app/competition-categories/actions";
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

const NULL_VALUE = "none";

const categoryFormSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
  description: z.string().optional(),
  level: z.coerce.number().optional(),
  gameFormatId: z.string().optional().nullable().transform(val => val === NULL_VALUE ? null : val),
});

interface CompetitionCategoryFormProps {
  onFormSubmit: () => void;
  gameFormats: GameFormat[];
  category?: CompetitionCategory | null;
}

export function CompetitionCategoryForm({ onFormSubmit, gameFormats, category }: CompetitionCategoryFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<z.infer<typeof categoryFormSchema>>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: category?.name || "",
      description: category?.description || "",
      level: category?.level || undefined,
      gameFormatId: category?.gameFormatId || null,
    },
  });

  useEffect(() => {
    form.reset({
      name: category?.name || "",
      description: category?.description || "",
      level: category?.level || undefined,
      gameFormatId: category?.gameFormatId || null,
    })
  }, [category, form]);

  async function onSubmit(values: z.infer<typeof categoryFormSchema>) {
    if (!user) {
      toast({ variant: "destructive", title: "Error de autenticación" });
      return;
    }

    const result = category
        ? await updateCompetitionCategory(category.id, values, user.uid)
        : await createCompetitionCategory(values, user.uid);


    if (result.success) {
      toast({
        title: category ? "Categoría Actualizada" : "Categoría Creada",
        description: `La categoría "${values.name}" ha sido ${category ? 'actualizada' : 'creada'} con éxito.`,
      });
      form.reset();
      onFormSubmit();
    } else {
      toast({
        variant: "destructive",
        title: "Error en la operación",
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
              <FormLabel>Nombre de la Categoría</FormLabel>
              <FormControl>
                <Input placeholder="Ej: U14 Femenino" {...field} />
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
                <Textarea placeholder="Describe brevemente la categoría" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="level"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nivel (Ej: 14 para U14)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} onChange={(e) => field.onChange(e.target.valueAsNumber)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="gameFormatId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Formato de Partido por Defecto</FormLabel>
                <Select onValueChange={field.onChange} value={field.value ?? NULL_VALUE}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un formato" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={NULL_VALUE}>Ninguno</SelectItem>
                    {gameFormats.map(format => (
                        <SelectItem key={format.id} value={format.id}>{format.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {category ? 'Guardar Cambios' : 'Crear Categoría'}
        </Button>
      </form>
    </Form>
  );
}
