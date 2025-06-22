
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { SeasonFormData, Team, CompetitionCategory } from "@/types";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { createSeason } from "@/app/seasons/actions";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, PlusCircle, Trash2 } from "lucide-react";
import React from 'react';

const seasonFormSchema = z.object({
  name: z.string().min(3, "Season name must be at least 3 characters."),
  startDate: z.string().min(1, "Start date is required."),
  endDate: z.string().min(1, "End date is required."),
  status: z.enum(["draft", "active", "archived"]),
  competitions: z.array(z.object({
    competitionCategoryId: z.string().min(1, "Please select a category."),
    teamIds: z.array(z.string()).min(1, "Please select at least one team."),
  })).min(1, "Please add at least one competition."),
});


interface SeasonFormProps {
  allTeams: Team[];
  competitionCategories: CompetitionCategory[];
}

export function SeasonForm({ allTeams, competitionCategories }: SeasonFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<z.infer<typeof seasonFormSchema>>({
    resolver: zodResolver(seasonFormSchema),
    defaultValues: {
      name: "",
      startDate: "",
      endDate: "",
      status: "draft",
      competitions: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "competitions",
  });

  const { watch } = form;
  const watchedCompetitions = watch("competitions");

  async function onSubmit(values: z.infer<typeof seasonFormSchema>) {
    if (!user) {
      toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in." });
      return;
    }
    
    const result = await createSeason(values, user.uid);

    if (result.success) {
      toast({ title: "Season Created", description: `The season "${values.name}" has been successfully created.` });
      router.push("/seasons");
      router.refresh();
    } else {
      toast({ variant: "destructive", title: "Creation Failed", description: result.error || "An unexpected error occurred." });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader><CardTitle>Season Details</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>Season Name</FormLabel><FormControl><Input placeholder="e.g., 2024-2025 Regular Season" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="startDate" render={({ field }) => (
                  <FormItem><FormLabel>Start Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="endDate" render={({ field }) => (
                  <FormItem><FormLabel>End Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
            </div>
             <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem><FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl>
                        <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                    </Select>
                  <FormMessage /></FormItem>
                )}/>
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Competitions</CardTitle>
                <CardDescription>Add competitions to this season and assign teams to them.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {fields.map((field, index) => {
                    const selectedCategoryId = watchedCompetitions[index]?.competitionCategoryId;
                    const availableTeamsForCategory = allTeams.filter(t => t.competitionCategoryId === selectedCategoryId);
                    
                    return (
                    <Card key={field.id} className="p-4 relative bg-muted/30">
                        <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => remove(index)}>
                            <Trash2 className="h-4 w-4 text-destructive"/>
                        </Button>
                        <div className="space-y-4">
                            <FormField control={form.control} name={`competitions.${index}.competitionCategoryId`} render={({ field }) => (
                                <FormItem><FormLabel>Competition Category</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {competitionCategories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                <FormMessage /></FormItem>
                            )}/>
                            
                            {selectedCategoryId && (
                                <FormField control={form.control} name={`competitions.${index}.teamIds`} render={() => (
                                    <FormItem>
                                        <FormLabel>Select Teams</FormLabel>
                                        {availableTeamsForCategory.length > 0 ? (
                                             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 border rounded-md">
                                                {availableTeamsForCategory.map(team => (
                                                    <FormField key={team.id} control={form.control} name={`competitions.${index}.teamIds`} render={({ field: { onChange, value } }) => (
                                                        <FormItem className="flex items-center space-x-2">
                                                            <FormControl>
                                                                <Checkbox 
                                                                    checked={value?.includes(team.id)}
                                                                    onCheckedChange={checked => {
                                                                        const currentTeamIds = value || [];
                                                                        if (checked) {
                                                                            onChange([...currentTeamIds, team.id]);
                                                                        } else {
                                                                            onChange(currentTeamIds.filter(id => id !== team.id));
                                                                        }
                                                                    }}
                                                                />
                                                            </FormControl>
                                                            <FormLabel className="font-normal">{team.name}</FormLabel>
                                                        </FormItem>
                                                    )}/>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-muted-foreground p-4 border rounded-md">No teams found for this competition category.</p>
                                        )}
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                            )}
                        </div>
                    </Card>
                )})}

                <Button type="button" variant="outline" onClick={() => append({ competitionCategoryId: '', teamIds: [] })}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Competition
                </Button>
                <FormMessage>{form.formState.errors.competitions?.message}</FormMessage>

            </CardContent>
        </Card>

        <Button type="submit" className="w-full sm:w-auto" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating Season...</> : "Create Season"}
        </Button>
      </form>
    </Form>
  );
}
