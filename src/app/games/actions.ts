
'use server';
import { adminDb } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { revalidatePath } from 'next/cache';
import type { Game, GameFormData, Team, TeamStats, Player, GameEvent, GameEventAction, UserFirestoreProfile, StatCategory, PlayerGameStats } from '@/types';
import { getTeamsByCoach, getAllTeams, getTeamsByClubId as getTeamsFromClub } from '@/app/teams/actions';
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

export async function assignScorer(
    gameId: string, 
    userId: string, 
    displayName: string, 
    category: StatCategory, 
    release: boolean = false
): Promise<{ success: boolean; error?: string }> {
    if (!adminDb) return { success: false, error: "Database not initialized." };

    const gameRef = adminDb.collection('games').doc(gameId);

    try {
        await adminDb.runTransaction(async (transaction) => {
            const gameDoc = await transaction.get(gameRef);
            if (!gameDoc.exists) throw new Error("Game not found.");
            
            const assignments = gameDoc.data()?.scorerAssignments || {};

            if (release) {
                if (assignments[category]?.uid === userId) {
                    transaction.update(gameRef, { [`scorerAssignments.${category}`]: null });
                } else {
                    // This can happen in a race condition, but it's not a critical failure.
                    console.warn(`User ${userId} tried to release a category not assigned to them.`);
                }
            } else {
                if (assignments[category] && assignments[category].uid !== userId) {
                    throw new Error(`Category "${category}" is already controlled by ${assignments[category].displayName}.`);
                }
                transaction.update(gameRef, { [`scorerAssignments.${category}`]: { uid: userId, displayName } });
            }
        });
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function recordGameEvent(
  gameId: string,
  userId: string,
  eventData: Omit<GameEvent, 'id' | 'gameId' | 'createdAt' | 'createdBy'>
): Promise<{ success: boolean; error?: string }> {
    if (!adminDb) return { success: false, error: 'Database not initialized' };
    
    const gameRef = adminDb.collection('games').doc(gameId);
    const eventRef = gameRef.collection('events').doc();

    try {
        await adminDb.runTransaction(async (transaction) => {
            const gameDoc = await transaction.get(gameRef);
            if (!gameDoc.exists) throw new Error("Game not found.");

            const gameData = gameDoc.data() as Game;
            const profile = await getUserProfileById(userId);
            const isSuperAdmin = profile?.profileTypeId === 'super_admin';

            // Permission check
            const assignments = gameData.scorerAssignments || {};
            const { action } = eventData;
            let requiredCategory: StatCategory | null = null;
            if (action.startsWith('shot')) requiredCategory = 'shots';
            else if (action.includes('foul')) requiredCategory = 'fouls';
            else if (['rebound_defensive', 'rebound_offensive', 'assist', 'steal', 'block', 'turnover', 'block_against'].includes(action)) requiredCategory = 'turnovers';
            
            if (requiredCategory && assignments[requiredCategory]?.uid !== userId && !isSuperAdmin) {
                 throw new Error(`You are not assigned to score "${requiredCategory}".`);
            }

            const newEvent: Omit<GameEvent, 'id'> = {
                ...eventData,
                gameId,
                createdBy: userId,
                createdAt: admin.firestore.FieldValue.serverTimestamp() as any, // Cast for transaction
            };
            transaction.set(eventRef, newEvent);

            const scoreField = eventData.teamId === 'home' ? 'homeTeamScore' : 'awayTeamScore';
            const statsField = eventData.teamId === 'home' ? 'homeTeamStats' : 'awayTeamStats';
            
            const updates: { [key: string]: any } = {};
            if (action === 'shot_made_1p') {
                updates[scoreField] = admin.firestore.FieldValue.increment(1);
                updates[`${statsField}.onePointAttempts`] = admin.firestore.FieldValue.increment(1);
                updates[`${statsField}.onePointMade`] = admin.firestore.FieldValue.increment(1);
            } else if (action === 'shot_miss_1p') {
                updates[`${statsField}.onePointAttempts`] = admin.firestore.FieldValue.increment(1);
            } else if (action === 'shot_made_2p') {
                updates[scoreField] = admin.firestore.FieldValue.increment(2);
                updates[`${statsField}.twoPointAttempts`] = admin.firestore.FieldValue.increment(1);
                updates[`${statsField}.twoPointMade`] = admin.firestore.FieldValue.increment(1);
            } else if (action === 'shot_miss_2p') {
                updates[`${statsField}.twoPointAttempts`] = admin.firestore.FieldValue.increment(1);
            } else if (action === 'shot_made_3p') {
                updates[scoreField] = admin.firestore.FieldValue.increment(3);
                updates[`${statsField}.threePointAttempts`] = admin.firestore.FieldValue.increment(1);
                updates[`${statsField}.threePointMade`] = admin.firestore.FieldValue.increment(1);
            } else if (action === 'shot_miss_3p') {
                 updates[`${statsField}.threePointAttempts`] = admin.firestore.FieldValue.increment(1);
            } else if (action === 'foul') {
                 updates[`${statsField}.fouls`] = admin.firestore.FieldValue.increment(1);
            } else if (action === 'steal') {
                 updates[`${statsField}.steals`] = admin.firestore.FieldValue.increment(1);
            }
            if (Object.keys(updates).length > 0) {
              transaction.update(gameRef, updates);
            }
        });
        return { success: true };
    } catch(error: any) {
        console.error("Error recording game event:", error);
        return { success: false, error: error.message };
    }
}

export async function substitutePlayer(
  gameId: string,
  userId: string,
  teamType: 'home' | 'away',
  playerIn: { id: string; name: string },
  playerOut: { id: string; name: string } | null,
  period: number,
  gameTimeSeconds: number
): Promise<{ success: boolean; error?: string }> {
  if (!adminDb) return { success: false, error: 'Database not initialized' };
  const gameRef = adminDb.collection('games').doc(gameId);

  try {
    await adminDb.runTransaction(async (transaction) => {
        const gameDoc = await transaction.get(gameRef);
        if (!gameDoc.exists) throw new Error("Game not found.");

        const gameData = gameDoc.data() as Game;
        const onCourtField = teamType === 'home' ? 'homeTeamOnCourtPlayerIds' : 'awayTeamOnCourtPlayerIds';
        let onCourtIds = gameData[onCourtField] || [];
        
        const serverTimestamp = admin.firestore.FieldValue.serverTimestamp();
        const baseEventPayload = { gameId, teamId: teamType, period, gameTimeSeconds, createdAt: serverTimestamp, createdBy: userId };

        if (playerOut) {
            onCourtIds = onCourtIds.filter(id => id !== playerOut.id);
            const eventOutRef = gameRef.collection('events').doc();
            transaction.set(eventOutRef, { ...baseEventPayload, action: 'substitution_out', playerId: playerOut.id, playerName: playerOut.name, playerOut });
        }

        if (!onCourtIds.includes(playerIn.id)) {
            if (onCourtIds.length >= 5) {
                if (!playerOut) throw new Error("Court is full (5 players). You must select a player to substitute out.");
            }
            onCourtIds.push(playerIn.id);
            const eventInRef = gameRef.collection('events').doc();
            transaction.set(eventInRef, { ...baseEventPayload, action: 'substitution_in', playerId: playerIn.id, playerName: playerIn.name, playerIn });
        } else {
            throw new Error("Player is already on court.");
        }

        transaction.update(gameRef, { [onCourtField]: onCourtIds });
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getPlayerStatsForGame(gameId: string): Promise<PlayerGameStats[]> {
    if (!adminDb) return [];

    try {
        const eventsRef = adminDb.collection('games').doc(gameId).collection('events');
        const eventsSnap = await eventsRef.orderBy('createdAt', 'asc').get();

        const playerStatsMap = new Map<string, Partial<PlayerGameStats> & { playerName: string }>();

        const getOrCreateStats = (playerId: string, playerName: string) => {
            if (!playerStatsMap.has(playerId)) {
                playerStatsMap.set(playerId, {
                    playerId, playerName, points: 0, shots_made_1p: 0, shots_attempted_1p: 0,
                    shots_made_2p: 0, shots_attempted_2p: 0, shots_made_3p: 0, shots_attempted_3p: 0,
                    reb_def: 0, reb_off: 0, assists: 0, steals: 0, blocks: 0, turnovers: 0,
                    fouls: 0, blocks_against: 0, fouls_received: 0, timePlayedSeconds: 0, periodsPlayed: 0
                });
            }
            return playerStatsMap.get(playerId)!;
        };

        eventsSnap.docs.forEach(doc => {
            const event = doc.data() as GameEvent;
            if (!event.playerId || event.playerId === 'SYSTEM') return;

            const stats = getOrCreateStats(event.playerId, event.playerName);

            switch (event.action) {
                case 'shot_made_1p': stats.points! += 1; stats.shots_made_1p! += 1; stats.shots_attempted_1p! += 1; break;
                case 'shot_miss_1p': stats.shots_attempted_1p! += 1; break;
                case 'shot_made_2p': stats.points! += 2; stats.shots_made_2p! += 1; stats.shots_attempted_2p! += 1; break;
                case 'shot_miss_2p': stats.shots_attempted_2p! += 1; break;
                case 'shot_made_3p': stats.points! += 3; stats.shots_made_3p! += 1; stats.shots_attempted_3p! += 1; break;
                case 'shot_miss_3p': stats.shots_attempted_3p! += 1; break;
                case 'rebound_defensive': stats.reb_def! += 1; break;
                case 'rebound_offensive': stats.reb_off! += 1; break;
                case 'assist': stats.assists! += 1; break;
                case 'steal': stats.steals! += 1; break;
                case 'block': stats.blocks! += 1; break;
                case 'block_against': stats.blocks_against! += 1; break;
                case 'turnover': stats.turnovers! += 1; break;
                case 'foul': stats.fouls! += 1; break;
                case 'foul_received': stats.fouls_received! += 1; break;
            }
        });

        const finalStats: PlayerGameStats[] = Array.from(playerStatsMap.values()).map(s => {
            const made_shots = (s.shots_made_1p || 0) + (s.shots_made_2p || 0) + (s.shots_made_3p || 0);
            const attempted_shots = (s.shots_attempted_1p || 0) + (s.shots_attempted_2p || 0) + (s.shots_attempted_3p || 0);
            const missed_shots = attempted_shots - made_shots;

            const pir = ((s.points || 0) + (s.reb_def || 0) + (s.reb_off || 0) + (s.assists || 0) + (s.steals || 0) + (s.blocks || 0) + (s.fouls_received || 0)) - 
                        (missed_shots + (s.turnovers || 0) + (s.blocks_against || 0) + (s.fouls || 0));
            
            const defaultFullStats: PlayerGameStats = {
                playerId: s.playerId || '', playerName: s.playerName || 'N/A', points: 0, shots_made_1p: 0, shots_attempted_1p: 0,
                shots_made_2p: 0, shots_attempted_2p: 0, shots_made_3p: 0, shots_attempted_3p: 0, reb_def: 0, reb_off: 0,
                assists: 0, steals: 0, blocks: 0, turnovers: 0, fouls: 0, blocks_against: 0, fouls_received: 0,
                timePlayedSeconds: 0, periodsPlayed: 0, pir: 0
            };

            return { ...defaultFullStats, ...s, pir };
        });

        return finalStats;

    } catch (err) {
        console.error("Error calculating player stats:", err);
        return [];
    }
}