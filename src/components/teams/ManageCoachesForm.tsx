"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { UserFirestoreProfile } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { updateTeamCoaches } from '@/app/teams/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormItem, FormLabel, FormControl, FormMessage, FormField } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Loader2, UserCheck } from 'lucide-react';

interface ManageCoachesFormProps {
  teamId: string;
  assignedCoachIds: string[];
  availableCoaches: UserFirestoreProfile[];
  onFormSubmit: () => void;
}

const formSchema = z.object({
  coachIds: z.array(z.string()).default([]),
});

export function ManageCoachesForm({ teamId, assignedCoachIds, availableCoaches, onFormSubmit }: ManageCoachesFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      coachIds: assignedCoachIds || [],
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
      return;
    }
    const result = await updateTeamCoaches(teamId, values.coachIds, user.uid);

    if (result.success) {
      toast({ title: 'Coaches Updated', description: 'The list of coaches for this team has been saved.' });
      onFormSubmit();
    } else {
      toast({ variant: 'destructive', title: 'Update Failed', description: result.error });
    }
  }

  return (
    <Card className="shadow-xl mt-8">
      <CardHeader>
        <CardTitle className="flex items-center"><UserCheck className="mr-3 h-6 w-6 text-primary" /> Assign Coaches</CardTitle>
        <CardDescription>Select the coaches who will manage this team.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="coachIds"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">Available Coaches in Club</FormLabel>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {availableCoaches.length > 0 ? (
                      availableCoaches.map((coach) => (
                        <FormField
                          key={coach.uid}
                          control={form.control}
                          name="coachIds"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 hover:bg-muted/50 transition-colors">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(coach.uid)}
                                  onCheckedChange={(checked) => {
                                    const currentIds = field.value || [];
                                    return checked
                                      ? field.onChange([...currentIds, coach.uid])
                                      : field.onChange(
                                          currentIds.filter(
                                            (value) => value !== coach.uid
                                          )
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal w-full cursor-pointer">
                                {coach.displayName || 'Unnamed Coach'}
                                <p className="text-xs text-muted-foreground">{coach.email}</p>
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))
                    ) : (
                        <p className="text-muted-foreground col-span-full">No users with the 'coach' profile type were found in this club.</p>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Coaches
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
