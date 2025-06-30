"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import React from "react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Season, SeasonFormData, Team, CompetitionCategory } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { createSeason, updateSeason } from "@/app/seasons/actions";
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Trash2, PlusCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const competitionSchema = z.object({
  competitionCategoryId: z.string().min(1, "Debe seleccionar una categoría."),
  teamIds: z.array(z.string()).min(1, "Debe seleccionar al menos un equipo."),
});

const seasonFormSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
  status: z.enum(["active", "archived", "upcoming"], { required_error: "Debe seleccionar un estado." }),
  competitions: z.array(competitionSchema).min(1, "Debe configurar al menos una competición."),
});

interface SeasonFormProps {
  allTeams: Team[];
  allCategories: CompetitionCategory[];
  onFormSubmit: () => void;
  season?: Season | null;
}

export function SeasonForm({ allTeams, allCategories, onFormSubmit, season }: SeasonFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<z.infer<typeof seasonFormSchema>>({
    resolver: zodResolver(seasonFormSchema),
    defaultValues: {
      name: season?.name || "",
      status: season?.status || "upcoming",
      competitions: season?.competitions || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "competitions",
  });
  
  React.useEffect(() => {
    if (season) {
        form.reset({
            name: season.name,
            status: season.status,
            competitions: season.competitions || [],
        });
    }
  }, [season, form]);

  async function onSubmit(values: z.infer<typeof seasonFormSchema>) {
    if (!user) return;
    const result = season 
        ? await updateSeason(season.id, values, user.uid)
        : await createSeason(values, user.uid);

    if (result.success) {
      toast({ 
          title: season ? "Temporada Actualizada" : "Temporada Creada",
          description: `La temporada ha sido ${season ? 'actualizada' : 'creada'} con éxito.` 
        });
      onFormSubmit();
    } else {
      toast({ variant: "destructive", title: "Error", description: result.error });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre de la Temporada</FormLabel>
                <FormControl><Input placeholder="Ej: Temporada 2024/25" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="upcoming">Próxima</SelectItem>
                    <SelectItem value="active">Activa</SelectItem>
                    <SelectItem value="archived">Archivada</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Separator />
        
        <div>
          <h3 className="text-lg font-medium mb-2">Competiciones de la Temporada</h3>
          {fields.map((field, index) => (
            <div key={field.id} className="p-4 border rounded-md mb-4 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold">Competición #{index + 1}</h4>
                <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>
                  <Trash2 className="h-4 w-4 mr-2"/>Eliminar
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name={`competitions.${index}.competitionCategoryId`}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Categoría</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Selecciona una categoría..."/></SelectTrigger></FormControl>
                                <SelectContent>
                                    {allCategories.map(cat => (
                                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                  />
                  <FormField
                      control={form.control}
                      name={`competitions.${index}.teamIds`}
                      render={() => (
                          <FormItem>
                              <FormLabel>Equipos Participantes</FormLabel>
                              <ScrollArea className="h-40 w-full rounded-md border p-4">
                                  {allTeams.map((team) => (
                                      <FormField
                                          key={team.id}
                                          control={form.control}
                                          name={`competitions.${index}.teamIds`}
                                          render={({ field }) => (
                                              <FormItem key={team.id} className="flex flex-row items-start space-x-3 space-y-0 mb-2">
                                                  <FormControl>
                                                      <Checkbox
                                                          checked={field.value?.includes(team.id)}
                                                          onCheckedChange={(checked) => {
                                                              return checked
                                                                  ? field.onChange([...(field.value || []), team.id])
                                                                  : field.onChange(field.value?.filter((value) => value !== team.id));
                                                          }}
                                                      />
                                                  </FormControl>
                                                  <FormLabel className="text-sm font-normal">{team.name}</FormLabel>
                                              </FormItem>
                                          )}
                                      />
                                  ))}
                              </ScrollArea>
                              <FormMessage />
                          </FormItem>
                      )}
                  />
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => append({ competitionCategoryId: "", teamIds: [] })}
          >
            <PlusCircle className="h-4 w-4 mr-2"/>Añadir Competición
          </Button>
           <FormField
            control={form.control}
            name="competitions"
            render={() => (<FormMessage/>)}
           />
        </div>

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {season ? 'Guardar Cambios' : 'Crear Temporada'}
        </Button>
      </form>
    </Form>
  );
}
