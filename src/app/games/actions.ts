
'use server';
import { adminDb } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { revalidatePath } from 'next/cache';
import type { Game, GameFormData, Team, TeamStats, Player, GameEvent, GameEventAction, UserFirestoreProfile, StatCategory } from '@/types';
import { getTeamsByCoach as getCoachTeams, getAllTeams, getTeamsByClubId as getTeamsFromClub } from '@/app/teams/actions';
import { getUserProfileById } from '@/app/users/actions';
import { getSeasons } from '@/app/seasons/actions';
import { getCompetitionCategories } from '@/app/competition-categories/actions';
import { getGameFormats } from '@/app/game-formats/actions';
import { getPlayersByTeamId } from '../players/actions';


async function getPlayersFromIds(playerIds: string[]): Promise<Player[]> {
    if (!adminDb || !playerIds || playerIds.length === 0) return [];
    const playerRefs = playerIds.map(id => adminDb.collection('players').doc(id));
    const playerDocs = await adminDb.getAll(...playerRefs);
    return playerDocs
        .filter(doc => doc.exists)
        .map(doc => ({ id: doc.id, ...doc.data() } as Player));
}

export async function getTeamById(teamId: string): Promise<Team | null> {
    if (!adminDb || !teamId) return null;
    try {
        const doc = await adminDb.collection('teams').doc(teamId).get();
        if (!doc.exists) return null;
        const data = doc.data()!;
        return {
            id: doc.id,
            ...data,
            createdAt: (data.createdAt as admin.firestore.Timestamp).toDate().toISOString(),
            updatedAt: (data.updatedAt as admin.firestore.Timestamp).toDate().toISOString(),
        } as Team;
    } catch (e) {
        return null;
    }
}

// Action to create a new game
export async function createGame(formData: GameFormData, userId: string): Promise<{ success: boolean; error?: string; id?: string }> {
    if (!userId) return { success: false, error: "User not authenticated." };
    if (!adminDb) return { success: false, error: "Database not initialized."};

    try {
        const gameDate = new Date(`${formData.date}T00:00:00`); 
        const startOfDay = admin.firestore.Timestamp.fromDate(new Date(gameDate.setHours(0, 0, 0, 0)));
        const endOfDay = admin.firestore.Timestamp.fromDate(new Date(gameDate.setHours(23, 59, 59, 999)));

        const gamesOnDayQuery = adminDb.collection('games')
            .where('date', '>=', startOfDay)
            .where('date', '<=', endOfDay);
        
        const gamesOnDaySnap = await gamesOnDayQuery.get();

        const gameExists = gamesOnDaySnap.docs.some(doc => {
            const data = doc.data();
            return data.homeTeamId === formData.homeTeamId && data.awayTeamId === formData.awayTeamId;
        });

        if (gameExists) {
            return { success: false, error: 'Este partido (mismos equipos) ya ha sido programado para esta fecha.' };
        }

        const [homeTeamSnap, awayTeamSnap] = await Promise.all([
            adminDb.collection('teams').doc(formData.homeTeamId).get(),
            adminDb.collection('teams').doc(formData.awayTeamId).get()
        ]);

        if (!homeTeamSnap.exists || !awayTeamSnap.exists) {
            return { success: false, error: "One or both teams could not be found." };
        }
        const homeTeamData = homeTeamSnap.data() as Team;
        const awayTeamData = awayTeamSnap.data() as Team;

        const gameDateTime = new Date(`${formData.date}T${formData.time}`);
        
        const initialStats: TeamStats = {
            onePointAttempts: 0, onePointMade: 0, twoPointAttempts: 0, twoPointMade: 0,
            threePointAttempts: 0, threePointMade: 0, fouls: 0, timeouts: 0, 
            reboundsOffensive: 0, reboundsDefensive: 0, assists: 0, steals: 0,
            blocks: 0, turnovers: 0, blocksAgainst: 0, foulsReceived: 0,
        };

        const newGameData = {
            homeTeamId: formData.homeTeamId,
            homeTeamClubId: homeTeamData.clubId,
            homeTeamName: homeTeamData.name,
            homeTeamLogoUrl: homeTeamData.logoUrl || null,
            awayTeamId: formData.awayTeamId,
            awayTeamClubId: awayTeamData.clubId,
            awayTeamName: awayTeamData.name,
            awayTeamLogoUrl: awayTeamData.logoUrl || null,
            date: admin.firestore.Timestamp.fromDate(gameDateTime),
            location: formData.location,
            status: 'scheduled',
            seasonId: formData.seasonId,
            competitionCategoryId: formData.competitionCategoryId,
            gameFormatId: formData.gameFormatId || null,
            createdBy: userId,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            homeTeamScore: 0,
            awayTeamScore: 0,
            homeTeamStats: initialStats,
            awayTeamStats: initialStats,
            currentPeriod: 1,
            isTimerRunning: false,
            periodTimeRemainingSeconds: 0,
            timerStartedAt: null,
            homeTeamPlayerIds: [],
            awayTeamPlayerIds: [],
            homeTeamOnCourtPlayerIds: [],
            awayTeamOnCourtPlayerIds: [],
            scorerAssignments: {
                shots: null,
                fouls: null,
                turnovers: null,
            },
        };

        const docRef = await adminDb.collection('games').add(newGameData);
        revalidatePath('/games');
        return { success: true, id: docRef.id };

    } catch (error: any) {
        console.error('Error creating game:', error);
        if (error.code === 'failed-precondition' && error.message.includes('index')) {
            console.error("Firestore index required. Please create an index on 'games' collection for field: date (ascending or descending).");
             return { success: false, error: 'Error del servidor: Se requiere un índice de base de datos en el campo de fecha. Contacte al administrador.' };
        }
        return { success: false, error: error.message || "Failed to create game."};
    }
}

export async function createTestGame(userId: string): Promise<{ success: boolean; error?: string; gameId?: string }> {
    if (!adminDb) return { success: false, error: "La base de datos no está inicializada." };
    if (!userId) return { success: false, error: "Usuario no autenticado." };

    try {
        const profile = await getUserProfileById(userId);
        if (!profile || !['super_admin', 'club_admin', 'coordinator', 'coach'].includes(profile.profileTypeId)) {
            return { success: false, error: 'No tienes permiso para crear partidos de prueba.' };
        }

        const [allSeasons, allCategories, allFormats] = await Promise.all([
            getSeasons(),
            getCompetitionCategories(),
            getGameFormats(),
        ]);

        let teamsForTest: Team[];
        if (['club_admin', 'coordinator'].includes(profile.profileTypeId)) {
            teamsForTest = await getTeamsFromClub(profile.clubId);
        } else if (profile.profileTypeId === 'coach') {
             teamsForTest = await getCoachTeams(profile.uid);
             const otherTeams = (await getAllTeams()).filter(t => t.clubId !== profile.clubId);
             teamsForTest = [...teamsForTest, ...otherTeams];
        } else {
            teamsForTest = await getAllTeams();
        }
        
        if (teamsForTest.length < 2) {
            return { success: false, error: 'Se necesitan al menos dos equipos en el sistema para crear un partido de prueba. Ejecuta primero el poblador de datos (seeder).' };
        }
        
        const homeTeam = teamsForTest[0];
        const awayTeam = teamsForTest[1];

        if (!homeTeam || !awayTeam) {
             return { success: false, error: 'No se pudieron seleccionar los equipos para el partido de prueba.' };
        }

        const activeSeason = allSeasons.find(s => s.status === 'active');
        if (!activeSeason) return { success: false, error: 'No se encontró una temporada activa para el partido de prueba.' };

        const category = allCategories[0];
        if (!category) return { success: false, error: 'No se encontraron categorías de competición.' };
        
        const gameFormat = allFormats.find(f => f.id === category.gameFormatId) || allFormats[0];
        if (!gameFormat) return { success: false, error: 'No se encontraron formatos de partido.' };
        
        const [homePlayers, awayPlayers] = await Promise.all([
            getPlayersByTeamId(homeTeam.id),
            getPlayersByTeamId(awayTeam.id),
        ]);

        if (homePlayers.length < 5 || awayPlayers.length < 5) {
             return { success: false, error: 'Los equipos de prueba no tienen suficientes jugadores (mínimo 5). Ejecuta primero el poblador de datos (seeder).' };
        }

        const homeTeamPlayerIds = homePlayers.map(p => p.id);
        const awayTeamPlayerIds = awayPlayers.map(p => p.id);

        const gameDateTime = new Date();
        const initialStats: TeamStats = {
            onePointAttempts: 0, onePointMade: 0, twoPointAttempts: 0, twoPointMade: 0,
            threePointAttempts: 0, threePointMade: 0, fouls: 0, timeouts: 0, 
            reboundsOffensive: 0, reboundsDefensive: 0, assists: 0, steals: 0,
            blocks: 0, turnovers: 0, blocksAgainst: 0, foulsReceived: 0,
        };

        const newGameData = {
            homeTeamId: homeTeam.id,
            homeTeamClubId: homeTeam.clubId,
            homeTeamName: homeTeam.name,
            homeTeamLogoUrl: homeTeam.logoUrl || null,
            awayTeamId: awayTeam.id,
            awayTeamClubId: awayTeam.clubId,
            awayTeamName: awayTeam.name,
            awayTeamLogoUrl: awayTeam.logoUrl || null,
            date: admin.firestore.Timestamp.fromDate(gameDateTime),
            location: 'Pista de Pruebas',
            status: 'scheduled',
            seasonId: activeSeason.id,
            competitionCategoryId: category.id,
            gameFormatId: gameFormat.id,
            createdBy: userId,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            homeTeamScore: 0,
            awayTeamScore: 0,
            homeTeamStats: initialStats,
            awayTeamStats: initialStats,
            currentPeriod: 1,
            isTimerRunning: false,
            periodTimeRemainingSeconds: 0,
            timerStartedAt: null,
            homeTeamPlayerIds,
            awayTeamPlayerIds,
            homeTeamOnCourtPlayerIds: homeTeamPlayerIds.slice(0, 5),
            awayTeamOnCourtPlayerIds: awayTeamPlayerIds.slice(0, 5),
            scorerAssignments: {},
        };

        const docRef = await adminDb.collection('games').add(newGameData);
        revalidatePath('/games');
        return { success: true, gameId: docRef.id };

    } catch (error: any) {
        console.error('Error creando partido de prueba:', error);
        return { success: false, error: error.message || 'Error inesperado del servidor.' };
    }
}


export async function getAllGames(): Promise<Game[]> {
    if (!adminDb) return [];
    try {
        const gamesRef = adminDb.collection('games');
        const snapshot = await gamesRef.orderBy('date', 'desc').get();
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                date: (data.date as admin.firestore.Timestamp).toDate().toISOString(),
                createdAt: data.createdAt ? (data.createdAt as admin.firestore.Timestamp).toDate().toISOString() : undefined,
                updatedAt: data.updatedAt ? (data.updatedAt as admin.firestore.Timestamp).toDate().toISOString() : undefined,
            } as Game;
        });
    } catch (error: any) {
        console.error("Error fetching all games: ", error);
        if (error.code === 'failed-precondition') {
             console.error("Firestore query failed, missing index. Please create an index on 'games' collection by 'date' descending.");
        }
        return [];
    }
}

export async function getGamesByClub(clubId: string): Promise<Game[]> {
    if (!adminDb || !clubId) return [];
    try {
        const allGames = await getAllGames();
        return allGames.filter(game => game.homeTeamClubId === clubId || game.awayTeamClubId === clubId);
    } catch (error: any) {
        console.error("Error fetching games by club:", error);
        return [];
    }
}


export async function getGamesByCoach(userId: string): Promise<Game[]> {
    if (!adminDb) return [];
    try {
        const coachTeams = await getCoachTeams(userId);
        if (coachTeams.length === 0) {
            return [];
        }
        const teamIds = coachTeams.map(team => team.id);
        const allGames = await getAllGames();
        return allGames.filter(game => teamIds.includes(game.homeTeamId) || teamIds.includes(game.awayTeamId));
    } catch (error: any) {
        console.error("Error fetching games by coach:", error);
        return [];
    }
}

export async function getGamesByParent(userId: string): Promise<Game[]> {
    if (!adminDb) return [];
    try {
        const profile = await getUserProfileById(userId);
        if (!profile || profile.profileTypeId !== 'parent_guardian' || !profile.children || profile.children.length === 0) {
            return []; 
        }

        const childrenPlayerIds = new Set(profile.children.map(c => c.playerId));
        if (childrenPlayerIds.size === 0) return [];
        
        const allGames = await getAllGames();
        
        const playerTeams = new Map<string, string>();
        const allPlayers = await getPlayersFromIds(Array.from(childrenPlayerIds));
        const allTeamIds: string[] = [];
        allPlayers.forEach(p => {
            if(p.teamId) {
                playerTeams.set(p.id, p.teamId);
                if (!allTeamIds.includes(p.teamId)) {
                    allTeamIds.push(p.teamId);
                }
            }
        });

        return allGames.filter(game => {
             return allTeamIds.includes(game.homeTeamId) || allTeamIds.includes(game.awayTeamId);
        });

    } catch (error: any) {
        console.error("Error fetching games by parent:", error);
        return [];
    }
}

export async function getGameById(gameId: string): Promise<Game | null> {
    if (!adminDb) return null;
    try {
        const gameRef = adminDb.collection('games').doc(gameId);
        const docSnap = await gameRef.get();
        if (!docSnap.exists) {
            return null;
        }
        const data = docSnap.data()!;
        return {
            id: docSnap.id,
            ...data,
            date: (data.date as admin.firestore.Timestamp).toDate().toISOString(),
            createdAt: data.createdAt ? (data.createdAt as admin.firestore.Timestamp).toDate().toISOString() : undefined,
            updatedAt: data.updatedAt ? (data.updatedAt as admin.firestore.Timestamp).toDate().toISOString() : undefined,
            timerStartedAt: data.timerStartedAt ? (data.timerStartedAt as admin.firestore.Timestamp).toDate().toISOString() : null,
        } as Game;
    } catch (error: any) {
        return null;
    }
}

export async function updateGameRoster(
    gameId: string,
    playerIds: string[],
    isHomeTeam: boolean
): Promise<{ success: boolean; error?: string }> {
    if (!adminDb) return { success: false, error: "Database not initialized." };
    try {
        const gameRef = adminDb.collection('games').doc(gameId);
        
        const updateData = isHomeTeam 
            ? { homeTeamPlayerIds: playerIds } 
            : { awayTeamPlayerIds: playerIds };

        await gameRef.update({
            ...updateData,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        
        revalidatePath(`/games/${gameId}`);
        return { success: true };
    } catch (error: any) {
        console.error("Error updating game roster:", error);
        return { success: false, error: error.message || "Failed to update roster." };
    }
}

export async function updateLiveGameState(
  gameId: string,
  userId: string,
  updates: Partial<Pick<Game, 'status' | 'currentPeriod' | 'periodTimeRemainingSeconds' | 'isTimerRunning'>>
): Promise<{ success: boolean; error?: string }> {
  if (!adminDb) return { success: false, error: "La base de datos no está inicializada." };
  
  try {
    const profile = await getUserProfileById(userId);
    if (!profile || !['super_admin', 'club_admin', 'coordinator', 'coach'].includes(profile.profileTypeId)) {
        return { success: false, error: "No tienes permiso para modificar el estado del partido." };
    }

    const gameRef = adminDb.collection('games').doc(gameId);
    
    await adminDb.runTransaction(async (transaction) => {
        const gameDoc = await transaction.get(gameRef);
        if (!gameDoc.exists) throw new Error("El partido no existe.");
        
        const gameData = gameDoc.data() as Game;
        const serverTimestamp = admin.firestore.FieldValue.serverTimestamp();
        const baseEventPayload = { gameId, teamId: 'system' as const, playerId: 'SYSTEM', playerName: 'System', createdAt: serverTimestamp, createdBy: userId };

        const updateData: { [key: string]: any } = { ...updates, updatedAt: serverTimestamp };

        // Game starting for the first time
        if (updates.status === 'inprogress' && gameData.status === 'scheduled') {
            const startPeriodEventRef = gameRef.collection('events').doc();
            transaction.set(startPeriodEventRef, { ...baseEventPayload, action: 'period_start', period: 1, gameTimeSeconds: updates.periodTimeRemainingSeconds || 0 });
            updateData.currentPeriod = 1;
        }

        // Timer control
        if (updates.isTimerRunning === true && !gameData.isTimerRunning) {
            updateData.timerStartedAt = serverTimestamp;
            const timerStartEventRef = gameRef.collection('events').doc();
            transaction.set(timerStartEventRef, { ...baseEventPayload, action: 'timer_start', period: gameData.currentPeriod || 1, gameTimeSeconds: gameData.periodTimeRemainingSeconds || 0 });
        } else if (updates.isTimerRunning === false && gameData.isTimerRunning) {
            const lastStartedMillis = gameData.timerStartedAt ? new Date(gameData.timerStartedAt).getTime() : Date.now();
            const timeElapsedSeconds = Math.round((Date.now() - lastStartedMillis) / 1000);
            const newRemainingTime = Math.max(0, (gameData.periodTimeRemainingSeconds || 0) - timeElapsedSeconds);
            updateData.periodTimeRemainingSeconds = newRemainingTime;
            updateData.timerStartedAt = null;
            const timerPauseEventRef = gameRef.collection('events').doc();
            transaction.set(timerPauseEventRef, { ...baseEventPayload, action: 'timer_pause', period: gameData.currentPeriod || 1, gameTimeSeconds: newRemainingTime });
        }
        
        // Period changing
        if (updates.currentPeriod && updates.currentPeriod > (gameData.currentPeriod || 0)) {
            const oldPeriod = gameData.currentPeriod || 1;
            // End old period
            const periodEndEventRef = gameRef.collection('events').doc();
            transaction.set(periodEndEventRef, { ...baseEventPayload, action: 'period_end', period: oldPeriod, gameTimeSeconds: 0 });
            // Start new period
            const periodStartEventRef = gameRef.collection('events').doc();
            transaction.set(periodStartEventRef, { ...baseEventPayload, action: 'period_start', period: updates.currentPeriod, gameTimeSeconds: updates.periodTimeRemainingSeconds || 0 });
        }

        transaction.update(gameRef, updateData);
    });
    
    return { success: true };
  } catch (error: any) {
    console.error("Error al actualizar el estado del partido en vivo:", error);
    return { success: false, error: error.message || "No se pudo actualizar el estado del partido." };
  }
}

export async function finishAllTestGames(userId: string): Promise<{ success: boolean; error?: string; count?: number }> {
    if (!adminDb) return { success: false, error: 'Database not initialized.' };
    if (!userId) return { success: false, error: 'User not authenticated.' };
    
    const profile = await getUserProfileById(userId);
    if (!profile || profile.profileTypeId !== 'super_admin') {
        return { success: false, error: 'Permission denied.' };
    }

    try {
        const gamesRef = adminDb.collection('games');
        const query = gamesRef.where('location', '==', 'Pista de Pruebas').where('status', 'in', ['inprogress', 'scheduled']);
        const snapshot = await query.get();

        if (snapshot.empty) {
            return { success: true, count: 0 };
        }

        const batch = adminDb.batch();
        snapshot.docs.forEach(doc => {
            batch.update(doc.ref, { 
                status: 'completed',
                isTimerRunning: false,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        });
        await batch.commit();
        
        revalidatePath('/games');
        revalidatePath('/dashboard');
        return { success: true, count: snapshot.size };
    } catch (error: any) {
        console.error("Error finishing test games:", error);
        return { success: false, error: error.message };
    }
}


export async function finishAllInProgressGames(userId: string): Promise<{ success: boolean; error?: string; count?: number }> {
    if (!adminDb) return { success: false, error: 'Database not initialized.' };
    if (!userId) return { success: false, error: 'User not authenticated.' };
    
    const profile = await getUserProfileById(userId);
    if (!profile || profile.profileTypeId !== 'super_admin') {
        return { success: false, error: 'Permission denied.' };
    }

    try {
        const gamesRef = adminDb.collection('games');
        const query = gamesRef.where('status', '==', 'inprogress');
        const snapshot = await query.get();

        if (snapshot.empty) {
            return { success: true, count: 0 };
        }

        const batch = adminDb.batch();
        snapshot.docs.forEach(doc => {
            batch.update(doc.ref, { 
                status: 'completed', 
                isTimerRunning: false,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        });
        await batch.commit();

        revalidatePath('/games');
        revalidatePath('/dashboard');
        return { success: true, count: snapshot.size };
    } catch (error: any) {
        console.error("Error finishing all in-progress games:", error);
        return { success: false, error: error.message };
    }
}
