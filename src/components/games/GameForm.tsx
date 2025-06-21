"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { GameFormData, Team, GameFormat, CompetitionCategory } from "@/types";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { createGame } from "@/app/games/actions";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import React from 'react';

const gameFormSchema = z.object({
  homeTeamId: z.string().min(1, "You must select a home team."),
  awayTeamId: z.string().min(1, "You must select an away team."),
  date: z.string().min(1, "A date is required."),
  time: z.string().min(1, "A time is required."),
  location: z.string().min(3, "Location must be at least 3 characters."),
  gameFormatId: z.string().optional().nullable(),
  competitionCategoryId: z.string().optional().nullable(),
}).refine(data => data.homeTeamId !== data.awayTeamId, {
    message: "Home and away teams cannot be the same.",
    path: ["awayTeamId"],
});


interface GameFormProps {
  coachTeams: Team[];
  allTeams: Team[];
  gameFormats: GameFormat[];
  competitionCategories: CompetitionCategory[];
}

export function GameForm({ coachTeams, allTeams, gameFormats, competitionCategories }: GameFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<z.infer<typeof gameFormSchema>>({
    resolver: zodResolver(gameFormSchema),
    defaultValues: {
      homeTeamId: "",
      awayTeamId: "",
      date: "",
      time: "",
      location: "",
      gameFormatId: undefined,
      competitionCategoryId: undefined,
    },
  });

  const { watch } = form;
  const selectedHomeTeamId = watch('homeTeamId');

  async function onSubmit(values: z.infer<typeof gameFormSchema>) {
    if (!user) {
      toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in." });
      return;
    }
    
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
          name="homeTeamId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Home Team</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your team" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {coachTeams.map(team => (
                    <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

         <FormField
          control={form.control}
          name="awayTeamId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Away Team (Opponent)</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedHomeTeamId}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select opponent" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {allTeams.filter(team => team.id !== selectedHomeTeamId).map(team => (
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
                control={form.control}
                name="competitionCategoryId"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Competition (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select competition" />
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
            <FormField
                control={form.control}
                name="gameFormatId"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Game Format (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
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
