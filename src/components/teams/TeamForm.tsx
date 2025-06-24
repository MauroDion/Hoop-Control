"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TeamFormData, GameFormat, CompetitionCategory, UserFirestoreProfile, Team } from "@/types";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { createTeam, updateTeam } from "@/app/teams/actions";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "../ui/separator";

const teamFormSchema = z.object({
  name: z.string().min(2, "El nombre del equipo debe tener al menos 2 caracteres.").max(100, "El nombre del equipo debe tener 100 caracteres o menos."),
  competitionCategoryId: z.string().min(1, "La categoría de competición es obligatoria."),
  gameFormatId: z.string().optional().nullable(),
  coachIds: z.array(z.string()).optional().default([]),
  coordinatorIds: z.array(z.string()).optional().default([]),
});

interface TeamFormProps {
  clubId: string;
  gameFormats: GameFormat[];
  competitionCategories: CompetitionCategory[];
  coaches: UserFirestoreProfile[];
  coordinators: UserFirestoreProfile[];
  onFormSubmit?: () => void;
  team?: Team; // For edit mode
}

export function TeamForm({ clubId, gameFormats, competitionCategories, coaches, coordinators, onFormSubmit, team }: TeamFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const form = useForm<z.infer<typeof teamFormSchema>>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: {
      name: team?.name || "",
      competitionCategoryId: team?.competitionCategoryId || "",
      gameFormatId: team?.gameFormatId || undefined,
      coachIds: team?.coachIds || [],
      coordinatorIds: team?.coordinatorIds || [],
    },
  });

  const { watch, setValue, reset } = form;
  const selectedCompetitionId = watch("competitionCategoryId");

  useEffect(() => {
    if (team) {
      reset({
        name: team.name,
        competitionCategoryId: team.competitionCategoryId || "",
        gameFormatId: team.gameFormatId,
        coachIds: team.coachIds || [],
        coordinatorIds: team.coordinatorIds || [],
      });
    }
  }, [team, reset]);

  useEffect(() => {
    if (selectedCompetitionId) {
      const category = competitionCategories.find(c => c.id === selectedCompetitionId);
      if (category && category.gameFormatId) {
        setValue("gameFormatId", category.gameFormatId, { shouldValidate: true });
      } else {
        setValue("gameFormatId", null, { shouldValidate: true });
      }
    }
  }, [selectedCompetitionId, competitionCategories, setValue]);

  async function onSubmit(values: z.infer<typeof teamFormSchema>) {
    if (authLoading || !user) {
      toast({ variant: "destructive", title: "Error de autenticación", description: "Debes haber iniciado sesión." });
      return;
    }

    const result = team 
      ? await updateTeam(team.id, values, user.uid)
      : await createTeam(values, clubId, user.uid);
      
    if (result.success) {
      toast({
        title: team ? "Equipo Actualizado" : "Equipo Creado",
        description: `El equipo "${values.name}" ha sido ${team ? 'actualizado' : 'creado'} correctamente.`,
      });
      if (!team) form.reset();
      if (onFormSubmit) onFormSubmit();
      
    } else {
      toast({
        variant: "destructive",
        title: team ? "Error al actualizar" : "Error en la creación",
        description: result.error || "Ocurrió un error inesperado.",
      });
    }
  }
  
  const selectedGameFormatName = gameFormats.find(f => f.id === watch("gameFormatId"))?.name;

  if (authLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del Equipo</FormLabel>
              <FormControl>
                <Input placeholder="Introduce el nombre del equipo (ej: U12 Águilas)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="competitionCategoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoría de Competición</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                value={field.value}
                disabled={competitionCategories.length === 0}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={competitionCategories.length === 0 ? "No hay categorías disponibles" : "Selecciona una categoría"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {competitionCategories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormItem>
          <FormLabel>Formato de Partido</FormLabel>
          <FormControl>
              <Input 
                value={selectedGameFormatName || "Se selecciona automáticamente según la categoría"} 
                disabled 
              />
          </FormControl>
           <FormDescription>
            El formato del partido lo determina la categoría de la competición.
          </FormDescription>
          <FormMessage />
        </FormItem>
        
        <Separator />
        
        <FormField
          control={form.control}
          name="coachIds"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">Asignar Entrenadores</FormLabel>
                <FormDescription>
                  Selecciona entre los entrenadores aprobados para este club.
                </FormDescription>
              </div>
              <div className="space-y-2">
                {coaches.length > 0 ? coaches.map((item) => (
                  <FormField
                    key={item.uid}
                    control={form.control}
                    name="coachIds"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={item.uid}
                          className="flex flex-row items-center space-x-3"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(item.uid)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...(field.value || []), item.uid])
                                  : field.onChange(
                                      field.value?.filter(
                                        (value) => value !== item.uid
                                      )
                                    )
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal text-sm">
                            {item.displayName} <span className="text-muted-foreground">({item.email})</span>
                          </FormLabel>
                        </FormItem>
                      )
                    }}
                  />
                )) : <p className="text-sm text-muted-foreground italic">No se encontraron entrenadores para este club.</p>}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Separator />

         <FormField
          control={form.control}
          name="coordinatorIds"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">Asignar Coordinadores</FormLabel>
                <FormDescription>
                  Selecciona entre los coordinadores aprobados para este club.
                </FormDescription>
              </div>
              <div className="space-y-2">
                {coordinators.length > 0 ? coordinators.map((item) => (
                  <FormField
                    key={item.uid}
                    control={form.control}
                    name="coordinatorIds"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={item.uid}
                          className="flex flex-row items-center space-x-3"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(item.uid)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...(field.value || []), item.uid])
                                  : field.onChange(
                                      field.value?.filter(
                                        (value) => value !== item.uid
                                      )
                                    )
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal text-sm">
                            {item.displayName} <span className="text-muted-foreground">({item.email})</span>
                          </FormLabel>
                        </FormItem>
                      )
                    }}
                  />
                )) : <p className="text-sm text-muted-foreground italic">No se encontraron coordinadores para este club.</p>}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full sm:w-auto" disabled={form.formState.isSubmitting || authLoading}>
          {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {form.formState.isSubmitting ? (team ? "Guardando..." : "Creando...") : (team ? "Guardar Cambios" : "Crear Equipo")}
        </Button>
      </form>
    </Form>
  );
}
