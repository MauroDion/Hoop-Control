"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { GameFormData, Team, GameFormat, CompetitionCategory, Season, UserFirestoreProfile } from "@/types";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { createGame } from "@/lib/actions/games";
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from "lucide-react";
import React, { useMemo, useEffect } from 'react';

const gameFormSchema = z.object({
  seasonId: z.string().min(1, "Debes seleccionar una temporada."),
  competitionCategoryId: z.string().min(1, "Debes seleccionar una competición."),
  homeTeamId: z.string().min(1, "Debes seleccionar un equipo local."),
  awayTeamId: z.string().min(1, "Debes seleccionar un equipo visitante."),
  date: z.string().min(1, "La fecha es obligatoria."),
  time: z.string().min(1, "La hora es obligatoria."),
  location: z.string().min(3, "La ubicación debe tener al menos 3 caracteres."),
  gameFormatId: z.string().optional().nullable(),
}).refine(data => data.homeTeamId !== data.awayTeamId, {
    message: "El equipo local y visitante no pueden ser el mismo.",
    path: ["awayTeamId"],
});


interface GameFormProps {
  userProfile: UserFirestoreProfile | null;
  coachTeams: Team[];
  allTeams: Team[];
  gameFormats: GameFormat[];
  competitionCategories: CompetitionCategory[];
  seasons: Season[];
}

export function GameForm({ userProfile, coachTeams, allTeams, gameFormats, competitionCategories, seasons }: GameFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<z.infer<typeof gameFormSchema>>({
    resolver: zodResolver(gameFormSchema),
    defaultValues: {
      seasonId: "",
      competitionCategoryId: "",
      homeTeamId: "",
      awayTeamId: "",
      date: "",
      time: "",
      location: "",
      gameFormatId: undefined,
    },
  });

  const { watch, setValue } = form;
  const selectedSeasonId = watch('seasonId');
  const selectedCompetitionId = watch('competitionCategoryId');
  const selectedHomeTeamId = watch('homeTeamId');

  const selectedSeason = useMemo(() => seasons.find(s => s.id === selectedSeasonId), [seasons, selectedSeasonId]);
  
  const availableCompetitions = useMemo(() => {
    if (!selectedSeason) return [];
    return selectedSeason.competitions.map(sc => {
        return competitionCategories.find(cc => cc.id === sc.competitionCategoryId);
    }).filter((c): c is CompetitionCategory => !!c);
  }, [selectedSeason, competitionCategories]);

  const eligibleTeams = useMemo(() => {
    if (!selectedSeason || !selectedCompetitionId) return [];
    const competition = selectedSeason.competitions.find(c => c.competitionCategoryId === selectedCompetitionId);
    if (!competition) return [];
    return allTeams.filter(t => competition.teamIds.includes(t.id));
  }, [selectedSeason, selectedCompetitionId, allTeams]);

  const homeTeamOptions = useMemo(() => {
    if (!userProfile) return [];

    if (['super_admin', 'club_admin', 'coordinator'].includes(userProfile.profileTypeId)) {
      return eligibleTeams;
    }

    if (userProfile.profileTypeId === 'coach') {
      return eligibleTeams.filter(et => coachTeams.some(ct => ct.id === et.id));
    }
    
    return [];
  }, [eligibleTeams, coachTeams, userProfile]);

  const awayTeamOptions = useMemo(() => {
      return eligibleTeams.filter(et => et.id !== selectedHomeTeamId);
  }, [eligibleTeams, selectedHomeTeamId]);

  useEffect(() => {
    if (selectedCompetitionId) {
        const category = availableCompetitions.find(c => c.id === selectedCompetitionId);
        if (category && category.gameFormatId) {
            setValue("gameFormatId", category.gameFormatId, { shouldValidate: true });
        } else {
            setValue("gameFormatId", null, { shouldValidate: true });
        }
    }
  }, [selectedCompetitionId, availableCompetitions, setValue]);
  
  const selectedGameFormatName = gameFormats.find(f => f.id === watch("gameFormatId"))?.name;

  async function onSubmit(values: z.infer<typeof gameFormSchema>) {
    if (!user) {
      toast({ variant: "destructive", title: "Error de autenticación", description: "Debes iniciar sesión." });
      return;
    }
    
    const result = await createGame(values, user.uid);

    if (result.success) {
      toast({
        title: "Partido Programado",
        description: `El partido ha sido programado con éxito.`,
      });
      router.push("/games");
      router.refresh();
    } else {
      toast({
        variant: "destructive",
        title: "Error al Programar",
        description: result.error || "Ocurrió un error inesperado.",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="seasonId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>1. Selecciona la Temporada</FormLabel>
              <Select onValueChange={value => {
                  field.onChange(value);
                  setValue('competitionCategoryId', '');
                  setValue('homeTeamId', '');
                  setValue('awayTeamId', '');
              }} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una temporada activa" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {seasons.map(season => (
                    <SelectItem key={season.id} value={season.id}>{season.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="competitionCategoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>2. Selecciona la Competición</FormLabel>
              <Select onValueChange={value => {
                  field.onChange(value);
                  setValue('homeTeamId', '');
                  setValue('awayTeamId', '');
              }} value={field.value || ""} disabled={!selectedSeasonId || availableCompetitions.length === 0}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={!selectedSeasonId ? "Primero selecciona una temporada" : "Selecciona una competición"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableCompetitions.map(comp => (
                    <SelectItem key={comp.id} value={comp.id}>{comp.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="homeTeamId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>3. Selecciona el Equipo Local</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={!selectedCompetitionId || homeTeamOptions.length === 0}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={!selectedCompetitionId ? "Primero selecciona competición" : "Selecciona el equipo local"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {homeTeamOptions.map(team => (
                    <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {userProfile?.profileTypeId === 'coach' && homeTeamOptions.length === 0 && selectedCompetitionId && <p className="text-sm text-muted-foreground mt-1">No entrenas a ningún equipo registrado en esta competición.</p>}
              <FormMessage />
            </FormItem>
          )}
        />

         <FormField
          control={form.control}
          name="awayTeamId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>4. Selecciona el Equipo Visitante (Oponente)</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={!selectedHomeTeamId || awayTeamOptions.length === 0}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={!selectedHomeTeamId ? "Primero selecciona el equipo local" : "Selecciona el oponente"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {awayTeamOptions.map(team => (
                    <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Fecha</FormLabel>
                <FormControl>
                    <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="time"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Hora</FormLabel>
                <FormControl>
                    <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ubicación</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Polideportivo Municipal, Pista 4" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormItem>
            <FormLabel>Formato del Partido</FormLabel>
            <FormControl>
                <Input 
                    value={selectedGameFormatName || "Se selecciona automáticamente según la competición"} 
                    disabled 
                />
            </FormControl>
            <FormDescription>
                El formato del partido lo determina la categoría de la competición.
            </FormDescription>
            <FormMessage />
        </FormItem>

        <Button type="submit" className="w-full sm:w-auto" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Programando Partido...
            </>
          ) : (
            "Programar Partido"
          )}
        </Button>
      </form>
    </Form>
  );
}
