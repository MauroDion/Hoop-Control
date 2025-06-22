
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { GameFormData, Team, GameFormat, CompetitionCategory, Season } from "@/types";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { createGame } from "@/app/games/actions";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import React, { useState, useMemo, useEffect } from 'react';

const gameFormSchema = z.object({
  seasonId: z.string().min(1, "You must select a season."),
  competitionCategoryId: z.string().min(1, "You must select a competition."),
  homeTeamId: z.string().min(1, "You must select a home team."),
  awayTeamId: z.string().min(1, "You must select an away team."),
  date: z.string().min(1, "A date is required."),
  time: z.string().min(1, "A time is required."),
  location: z.string().min(3, "Location must be at least 3 characters."),
  gameFormatId: z.string().optional().nullable(),
}).refine(data => data.homeTeamId !== data.awayTeamId, {
    message: "Home and away teams cannot be the same.",
    path: ["awayTeamId"],
});


interface GameFormProps {
  coachTeams: Team[];
  allTeams: Team[];
  gameFormats: GameFormat[];
  competitionCategories: CompetitionCategory[];
  seasons: Season[];
}

export function GameForm({ coachTeams, allTeams, gameFormats, competitionCategories, seasons }: GameFormProps) {
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
      return eligibleTeams.filter(et => coachTeams.some(ct => ct.id === et.id));
  }, [eligibleTeams, coachTeams]);

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
      toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in." });
      return;
    }
    
    // The form data already matches GameFormData type
    const result = await createGame(values, user.uid);

    if (result.success) {
      toast({
        title: "Game Scheduled",
        description: `The game has been successfully scheduled.`,
      });
      router.push("/games");
      router.refresh();
    } else {
      toast({
        variant: "destructive",
        title: "Scheduling Failed",
        description: result.error || "An unexpected error occurred.",
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
              <FormLabel>1. Select Season</FormLabel>
              <Select onValueChange={value => {
                  field.onChange(value);
                  setValue('competitionCategoryId', '');
                  setValue('homeTeamId', '');
                  setValue('awayTeamId', '');
              }} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an active season" />
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
              <FormLabel>2. Select Competition</FormLabel>
              <Select onValueChange={value => {
                  field.onChange(value);
                  setValue('homeTeamId', '');
                  setValue('awayTeamId', '');
              }} value={field.value} disabled={!selectedSeasonId || availableCompetitions.length === 0}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={!selectedSeasonId ? "First select a season" : "Select a competition"} />
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
              <FormLabel>3. Select Home Team (Your Team)</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={!selectedCompetitionId || homeTeamOptions.length === 0}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={!selectedCompetitionId ? "First select competition" : "Select your team"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {homeTeamOptions.map(team => (
                    <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {homeTeamOptions.length === 0 && selectedCompetitionId && <p className="text-sm text-muted-foreground mt-1">You do not coach any teams registered in this competition.</p>}
              <FormMessage />
            </FormItem>
          )}
        />

         <FormField
          control={form.control}
          name="awayTeamId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>4. Select Away Team (Opponent)</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={!selectedHomeTeamId || awayTeamOptions.length === 0}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={!selectedHomeTeamId ? "First select home team" : "Select opponent"} />
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
                <FormLabel>Date</FormLabel>
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
                <FormLabel>Time</FormLabel>
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
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input placeholder="e.g., City Park, Field 4" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormItem>
            <FormLabel>Game Format</FormLabel>
            <FormControl>
                <Input 
                    value={selectedGameFormatName || "Automatically selected based on competition"} 
                    disabled 
                />
            </FormControl>
            <FormDescription>
                The game format is determined by the selected competition.
            </FormDescription>
            <FormMessage />
        </FormItem>

        <Button type="submit" className="w-full sm:w-auto" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Scheduling Game...
            </>
          ) : (
            "Schedule Game"
          )}
        </Button>
      </form>
    </Form>
  );
}
