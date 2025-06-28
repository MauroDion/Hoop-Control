
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { v4 as uuidv4 } from 'uuid';

import { getUserProfileById, updateUserChildren } from '@/app/users/actions';
import { getTeamsByClubId } from '@/app/teams/actions';
import { getPlayersByClub } from '@/app/players/actions';

import type { UserFirestoreProfile, Child, Player, Team } from '@/types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, AlertTriangle, Users, Trash2, PlusCircle, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const childSchema = z.object({
  id: z.string(),
  teamId: z.string().min(1, "Debes seleccionar un equipo."),
  playerId: z.string().min(1, "Debes seleccionar un jugador."),
});

const formSchema = z.object({
  children: z.array(childSchema),
});

export default function MyChildrenPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [profile, setProfile] = useState<UserFirestoreProfile | null>(null);
    const [teams, setTeams] = useState<Team[]>([]);
    const [players, setPlayers] = useState<Player[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { children: [] },
    });
    
    const { control, watch } = form;

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'children',
    });

    const watchedChildren = watch('children');

    const isOnboarding = profile && !profile.onboardingCompleted;

    const fetchData = useCallback(async (uid: string) => {
        setLoadingData(true);
        setError(null);
        try {
            const fetchedProfile = await getUserProfileById(uid);
            if (!fetchedProfile || fetchedProfile.profileTypeId !== 'parent_guardian') {
                throw new Error("No tienes permiso para acceder a esta página.");
            }
            setProfile(fetchedProfile);
            
            const [fetchedTeams, fetchedPlayers] = await Promise.all([
                getTeamsByClubId(fetchedProfile.clubId),
                getPlayersByClub(fetchedProfile.clubId)
            ]);

            setTeams(fetchedTeams);
            setPlayers(fetchedPlayers);
            
            const defaultChildren = (fetchedProfile.children || []).map(child => {
                const player = fetchedPlayers.find(p => p.id === child.playerId);
                return {
                    id: child.id,
                    playerId: child.playerId,
                    teamId: player?.teamId || ''
                };
            });
            form.reset({ children: defaultChildren });

        } catch(err: any) {
            setError(err.message);
        } finally {
            setLoadingData(false);
        }
    }, [form]);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.replace('/login');
            return;
        }
        fetchData(user.uid);
    }, [user, authLoading, router, fetchData]);
    
    const onSubmit = async (data: z.infer<typeof formSchema>) => {
        if (!user) return;
        
        const childrenToSave: Child[] = data.children.map(c => ({
            id: c.id,
            playerId: c.playerId,
        }));
        
        const result = await updateUserChildren(user.uid, childrenToSave);
        
        if (result.success) {
            toast({ title: "Información Guardada", description: "La información de tus hijos/as ha sido actualizada." });
            router.push('/dashboard');
        } else {
            toast({ variant: 'destructive', title: 'Error al Guardar', description: result.error });
        }
    };
    
    const playerOptions = useMemo(() => {
        return watchedChildren.map(child => {
            const selectedTeamId = child.teamId;
            if (!selectedTeamId) return [];
            return players.filter(player => player.teamId === selectedTeamId);
        });
    }, [watchedChildren, players]);


    if (loadingData || authLoading) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center">
                <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
                <h1 className="text-2xl font-semibold text-destructive">Error</h1>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={() => router.push('/dashboard')} className="mt-4">Ir al Panel</Button>
            </div>
        );
    }
    
    return (
        <Card className="max-w-4xl mx-auto shadow-xl">
            <CardHeader>
                <CardTitle className="text-3xl font-headline flex items-center">
                   <Users className="mr-3 h-8 w-8 text-primary"/> Gestionar Hijos/as
                </CardTitle>
                <CardDescription>
                    {isOnboarding 
                        ? "Bienvenido/a. Por favor, añade la información de tu/s hijo/a/s para completar tu registro."
                        : "Añade, edita o elimina la información de tus hijos/as asociados a tu cuenta."
                    }
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        {fields.length > 0 && (
                            <div className="space-y-4">
                                {fields.map((field, index) => (
                                    <div key={field.id} className="p-4 border rounded-lg flex flex-col md:flex-row gap-4 items-start">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-grow">
                                            <FormField
                                                control={control}
                                                name={`children.${index}.teamId`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>1. Selecciona el Equipo</FormLabel>
                                                        <Select onValueChange={(value) => {
                                                            field.onChange(value);
                                                            form.setValue(`children.${index}.playerId`, '');
                                                        }} defaultValue={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Selecciona un equipo..." />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {teams.map(team => (
                                                                    <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={control}
                                                name={`children.${index}.playerId`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>2. Selecciona al Jugador</FormLabel>
                                                        <Select onValueChange={field.onChange} value={field.value} disabled={!watchedChildren[index]?.teamId || playerOptions[index]?.length === 0}>
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder={!watchedChildren[index]?.teamId ? "Primero selecciona equipo" : "Selecciona un jugador..."} />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {playerOptions[index]?.map(player => (
                                                                    <SelectItem key={player.id} value={player.id}>{player.firstName} {player.lastName}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="mt-2 md:mt-7 shrink-0">
                                            <Trash2 className="h-5 w-5 text-destructive"/>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                           <Button
                                type="button"
                                variant="outline"
                                onClick={() => append({ id: uuidv4(), teamId: '', playerId: '' })}
                            >
                                <PlusCircle className="mr-2 h-4 w-4" /> Añadir otro hijo/a
                            </Button>

                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                <Save className="mr-2 h-4 w-4" />
                                {isOnboarding ? 'Guardar y Continuar al Panel' : 'Guardar Cambios'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
