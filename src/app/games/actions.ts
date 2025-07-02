
'use server';
import { adminDb } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { revalidatePath } from 'next/cache';
import type { Game, GameFormData, Team, TeamStats, Player, GameEvent, GameEventAction, UserFirestoreProfile, StatCategory, PlayerGameStats, Season, Child } from '@/types';
import { getTeamsByCoach as getCoachTeams } from '@/app/teams/actions';
import { getUserProfileById } from '@/app/users/actions';
import { getPlayersFromIds } from '../players/actions';

const initialPlayerStats: Omit<PlayerGameStats, 'playerId' | 'playerName'> = {
    timePlayedSeconds: 0,
    periodsPlayed: 0,
    periodsPlayedSet: [],
    points: 0, shots_made_1p: 0, shots_attempted_1p: 0,
    shots_made_2p: 0, shots_attempted_2p: 0,
    shots_made_3p: 0, shots_attempted_3p: 0,
    reb_def: 0, reb_off: 0, assists: 0, steals: 0, blocks: 0,
    turnovers: 0, blocks_against: 0, fouls_received: 0,
    pir: 0, plusMinus: 0
};


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
                timerStartedAt: data.timerStartedAt ? (data.timerStartedAt as admin.firestore.Timestamp).toDate().toISOString() : null,
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
        const gamesRef = adminDb.collection('games');
        const homeGamesQuery = gamesRef.where('homeTeamClubId', '==', clubId).get();
        const awayGamesQuery = gamesRef.where('awayTeamClubId', '==', clubId).get();

        const [homeGamesSnap, awayGamesSnap] = await Promise.all([homeGamesQuery, awayGamesQuery]);
        
        const gamesMap = new Map<string, Game>();
        const processSnapshot = (snap: admin.firestore.QuerySnapshot) => {
            snap.forEach(doc => {
                const gameData = doc.data();
                gamesMap.set(doc.id, {
                    id: doc.id,
                    ...gameData,
                    date: (gameData.date as admin.firestore.Timestamp).toDate().toISOString(),
                    createdAt: gameData.createdAt ? (gameData.createdAt as admin.firestore.Timestamp).toDate().toISOString() : undefined,
                    updatedAt: gameData.updatedAt ? (gameData.updatedAt as admin.firestore.Timestamp).toDate().toISOString() : undefined,
                    timerStartedAt: gameData.timerStartedAt ? (gameData.timerStartedAt as admin.firestore.Timestamp).toDate().toISOString() : null,
                } as Game);
            });
        };

        processSnapshot(homeGamesSnap);
        processSnapshot(awayGamesSnap);

        const games = Array.from(gamesMap.values());
        games.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Sort recent first

        return games;
    } catch (error: any) {
        console.error("Error fetching games by club:", error);
         if (error.code === 'failed-precondition') {
             console.error("Firestore query failed, missing index. Please create composite indexes for club game queries.");
        }
        return [];
    }
}


export async function getGamesByCoach(userId: string): Promise<Game[]> {
    if (!adminDb) return [];
    try {
        const coachTeams = await getCoachTeams(userId);
        if (coachTeams.length === 0) return [];
        const teamIds = coachTeams.map(team => team.id);
        
        if (teamIds.length === 0) return [];

        const gamesRef = adminDb.collection('games');
        const homeGamesQuery = gamesRef.where('homeTeamId', 'in', teamIds).get();
        const awayGamesQuery = gamesRef.where('awayTeamId', 'in', teamIds).get();

        const [homeGamesSnap, awayGamesSnap] = await Promise.all([homeGamesQuery, awayGamesQuery]);

        const gamesMap = new Map<string, Game>();
        const processSnapshot = (snap: admin.firestore.QuerySnapshot) => {
             snap.forEach(doc => {
                const gameData = doc.data();
                gamesMap.set(doc.id, {
                    id: doc.id,
                    ...gameData,
                    date: (gameData.date as admin.firestore.Timestamp).toDate().toISOString(),
                    createdAt: gameData.createdAt ? (gameData.createdAt as admin.firestore.Timestamp).toDate().toISOString() : undefined,
                    updatedAt: gameData.updatedAt ? (gameData.updatedAt as admin.firestore.Timestamp).toDate().toISOString() : undefined,
                    timerStartedAt: gameData.timerStartedAt ? (gameData.timerStartedAt as admin.firestore.Timestamp).toDate().toISOString() : null,
                } as Game);
            });
        };
       
        processSnapshot(homeGamesSnap);
        processSnapshot(awayGamesSnap);

        const games = Array.from(gamesMap.values());
        games.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return games;
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

        const childrenPlayerIds = Array.from(new Set(profile.children.map(c => c.playerId)));
        if (childrenPlayerIds.length === 0) return [];
        
        const allPlayers = await getPlayersFromIds(childrenPlayerIds);
        const teamIds = Array.from(new Set(allPlayers.map(p => p.teamId).filter(Boolean))) as string[];
        if (teamIds.length === 0) return [];
        
        const gamesRef = adminDb.collection('games');
        const homeGamesQuery = gamesRef.where('homeTeamId', 'in', teamIds).get();
        const awayGamesQuery = gamesRef.where('awayTeamId', 'in', teamIds).get();

        const [homeGamesSnap, awayGamesSnap] = await Promise.all([homeGamesQuery, awayGamesQuery]);

        const gamesMap = new Map<string, Game>();
        const processSnapshot = (snap: admin.firestore.QuerySnapshot) => {
             snap.forEach(doc => {
                const gameData = doc.data();
                gamesMap.set(doc.id, {
                    id: doc.id,
                    ...gameData,
                    date: (gameData.date as admin.firestore.Timestamp).toDate().toISOString(),
                    createdAt: gameData.createdAt ? (gameData.createdAt as admin.firestore.Timestamp).toDate().toISOString() : undefined,
                    updatedAt: gameData.updatedAt ? (gameData.updatedAt as admin.firestore.Timestamp).toDate().toISOString() : undefined,
                    timerStartedAt: gameData.timerStartedAt ? (gameData.timerStartedAt as admin.firestore.Timestamp).toDate().toISOString() : null,
                } as Game);
            });
        };
       
        processSnapshot(homeGamesSnap);
        processSnapshot(awayGamesSnap);

        const games = Array.from(gamesMap.values());
        games.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return games;

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

export async function createGame(formData: GameFormData, userId: string): Promise<{ success: boolean; error?: string; id?: string }> {
    if (!userId) return { success: false, error: "User not authenticated." };
    if (!adminDb) return { success: false, error: "Database not initialized."};

    try {
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
        
        const initialTeamStats: TeamStats = {
            onePointAttempts: 0, onePointMade: 0,
            twoPointAttempts: 0, twoPointMade: 0,
            threePointAttempts: 0, threePointMade: 0,
            fouls: 0, timeouts: 0, reboundsOffensive: 0,
            reboundsDefensive: 0, assists: 0, steals: 0, blocks: 0,
            turnovers: 0, blocksAgainst: 0, foulsReceived: 0,
        };

        const newGameData: Omit<Game, 'id'> = {
            homeTeamId: formData.homeTeamId,
            homeTeamClubId: homeTeamData.clubId,
            homeTeamName: homeTeamData.name,
            homeTeamLogoUrl: homeTeamData.logoUrl || null,
            awayTeamId: formData.awayTeamId,
            awayTeamClubId: awayTeamData.clubId,
            awayTeamName: awayTeamData.name,
            awayTeamLogoUrl: awayTeamData.logoUrl || null,
            date: gameDateTime.toISOString(),
            location: formData.location,
            status: 'scheduled',
            seasonId: formData.seasonId,
            competitionCategoryId: formData.competitionCategoryId,
            gameFormatId: formData.gameFormatId || null,
            createdBy: userId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            homeTeamScore: 0,
            awayTeamScore: 0,
            homeTeamStats: initialTeamStats,
            awayTeamStats: initialTeamStats,
            playerStats: {},
            currentPeriod: 1,
            isTimerRunning: false,
            periodTimeRemainingSeconds: 0,
            timerStartedAt: null,
            homeTeamPlayerIds: [],
            awayTeamPlayerIds: [],
            homeTeamOnCourtPlayerIds: [],
            awayTeamOnCourtPlayerIds: [],
        };

        const docRef = await adminDb.collection('games').add({
            ...newGameData,
            date: admin.firestore.Timestamp.fromDate(gameDateTime),
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        
        revalidatePath('/games');
        return { success: true, id: docRef.id };

    } catch (error: any) {
        console.error('Error creating game:', error);
        return { success: false, error: error.message || "Failed to create game."};
    }
}

export async function createTestGame(userId: string): Promise<{ success: boolean; error?: string; gameId?: string; }> {
    if (!adminDb) return { success: false, error: "Database not initialized." };

    try {
        let seasonsSnapshot = await adminDb.collection('seasons').where('status', '==', 'active').limit(1).get();

        if (seasonsSnapshot.empty) {
            console.warn("No active season found via indexed query, attempting direct fetch...");
            const allSeasons = await adminDb.collection('seasons').get();
            const activeSeasonDoc = allSeasons.docs.find(doc => doc.data().status === 'active');
            
            if (activeSeasonDoc) {
                seasonsSnapshot = { docs: [activeSeasonDoc] } as any;
                console.log("Found active season via direct fetch. Continuing.");
            } else {
                 return { success: false, error: "No active season found. Please seed the database or create an active season." };
            }
        }
        
        const seasonDoc = seasonsSnapshot.docs[0];
        const seasonId = seasonDoc.id;
        const season = seasonDoc.data() as Season;

        const allTeamIdsInSeason = Array.from(new Set(season.competitions.flatMap(c => c.teamIds || [])));
        if (allTeamIdsInSeason.length < 2) {
            return { success: false, error: "Not enough teams in the active season to create a match." };
        }
        
        const playersSnapshot = await adminDb.collection('players').where('teamId', 'in', allTeamIdsInSeason).get();
        const playersByTeam = new Map<string, Player[]>();
        playersSnapshot.forEach(doc => {
            const player = {id: doc.id, ...doc.data()} as Player;
            if (player.teamId) {
                if (!playersByTeam.has(player.teamId)) playersByTeam.set(player.teamId, []);
                playersByTeam.get(player.teamId)!.push(player);
            }
        });
        const allEligibleTeamIds = allTeamIdsInSeason.filter(teamId => (playersByTeam.get(teamId)?.length || 0) >= 5);

        const valenciaTeamIds = allEligibleTeamIds.filter(id => id.startsWith('vbc-'));
        if (valenciaTeamIds.length === 0) {
            return { success: false, error: "No eligible Valencia teams (with >= 5 players) found in the active season." };
        }
        
        const homeTeamId = valenciaTeamIds[Math.floor(Math.random() * valenciaTeamIds.length)];

        const opponentTeamIds = allEligibleTeamIds.filter(id => id !== homeTeamId);
        if (opponentTeamIds.length === 0) {
            return { success: false, error: "Found an eligible Valencia team, but no eligible opponent teams (with >= 5 players) to play against." };
        }
        const awayTeamId = opponentTeamIds[Math.floor(Math.random() * opponentTeamIds.length)];

        const [homeTeamSnap, awayTeamSnap, homePlayers, awayPlayers] = await Promise.all([
            adminDb.collection('teams').doc(homeTeamId).get(),
            adminDb.collection('teams').doc(awayTeamId).get(),
            getPlayersFromIds(playersByTeam.get(homeTeamId)?.map(p => p.id) || []),
            getPlayersFromIds(playersByTeam.get(awayTeamId)?.map(p => p.id) || []),
        ]);

        if (!homeTeamSnap.exists || !awayTeamSnap.exists) {
            return { success: false, error: "Could not fetch team data for the selected test teams." };
        }
        
        const homeTeamData = homeTeamSnap.data() as Team;
        const awayTeamData = awayTeamSnap.data() as Team;

        const competitionCategoryId = homeTeamData.competitionCategoryId;
        if (!competitionCategoryId) {
             return { success: false, error: "Selected Valencia team does not have a competition category assigned." };
        }

        const competitionCategorySnap = await adminDb.collection('competitionCategories').doc(competitionCategoryId).get();
        const gameFormatId = competitionCategorySnap.data()?.gameFormatId || null;
        
        const homeTeamPlayerIds = homePlayers.map(p => p.id);
        const awayTeamPlayerIds = awayPlayers.map(p => p.id);
        
        const homeTeamOnCourtPlayerIds = homeTeamPlayerIds.slice(0, 5);
        const awayTeamOnCourtPlayerIds = awayPlayers.slice(0, 5);
        
        const gameDateTime = new Date();
        const initialTeamStats: TeamStats = { onePointAttempts: 0, onePointMade: 0, twoPointAttempts: 0, twoPointMade: 0, threePointAttempts: 0, threePointMade: 0, fouls: 0, timeouts: 0, reboundsOffensive: 0, reboundsDefensive: 0, assists: 0, steals: 0, blocks: 0, turnovers: 0, blocksAgainst: 0, foulsReceived: 0 };
        
        const playerStats: { [playerId: string]: Partial<PlayerGameStats> } = {};
        [...homePlayers, ...awayPlayers].forEach(player => {
            playerStats[player.id] = { ...initialPlayerStats, playerId: player.id, playerName: `${player.firstName} ${player.lastName}` };
        });

        const newGameData: Omit<Game, 'id'> = {
            homeTeamId, homeTeamClubId: homeTeamData.clubId, homeTeamName: homeTeamData.name, homeTeamLogoUrl: homeTeamData.logoUrl || null,
            awayTeamId, awayTeamClubId: awayTeamData.clubId, awayTeamName: awayTeamData.name, awayTeamLogoUrl: awayTeamData.logoUrl || null,
            date: gameDateTime.toISOString(), location: 'Pista de Pruebas', status: 'scheduled',
            seasonId, competitionCategoryId, gameFormatId,
            createdBy: userId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
            homeTeamScore: 0, awayTeamScore: 0, homeTeamStats: initialTeamStats, awayTeamStats: initialTeamStats, playerStats,
            currentPeriod: 1, isTimerRunning: false, periodTimeRemainingSeconds: 0, timerStartedAt: null,
            homeTeamPlayerIds, awayTeamPlayerIds, homeTeamOnCourtPlayerIds, awayTeamOnCourtPlayerIds,
        };
        
        const gameRef = await adminDb.collection('games').add({
            ...newGameData,
            date: admin.firestore.Timestamp.fromDate(gameDateTime),
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        
        revalidatePath('/games');
        revalidatePath('/dashboard');

        return { success: true, gameId: gameRef.id };
    } catch (error: any) {
        console.error("Error creating test game:", error);
        return { success: false, error: error.message };
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
                homeTeamScore: Math.floor(Math.random() * 40) + 50,
                awayTeamScore: Math.floor(Math.random() * 40) + 50,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        });
        await batch.commit();
        
        revalidatePath('/games');
        revalidatePath('/dashboard');
        revalidatePath('/analysis');
        return { success: true, count: snapshot.size };
    } catch (error: any) {
        console.error("Error finishing test games:", error);
        return { success: false, error: error.message };
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
        
        const gameSnap = await gameRef.get();
        if (!gameSnap.exists) throw new Error("Game not found.");
        const gameData = gameSnap.data() as Game;
        const existingPlayerStats = gameData.playerStats || {};
        
        const updates: { [key: string]: any } = {};
        const newPlayersToFetch = playerIds.filter(pId => !existingPlayerStats[pId]);

        if (newPlayersToFetch.length > 0) {
            const players = await getPlayersFromIds(newPlayersToFetch);
            players.forEach(player => {
                const playerName = `${player.firstName} ${player.lastName}`;
                updates[`playerStats.${player.id}`] = { ...initialPlayerStats, playerId: player.id, playerName };
            });
        }

        const rosterField = isHomeTeam ? 'homeTeamPlayerIds' : 'awayTeamPlayerIds';
        updates[rosterField] = playerIds;
        updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();

        await gameRef.update(updates);
        
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
        
        const gameData = gameDoc.data() as any;
        if(!gameData) throw new Error("No se encontraron datos del partido.");

        const serverTimestamp = admin.firestore.FieldValue.serverTimestamp();
        const baseEventPayload = { gameId, teamId: 'system' as const, playerId: 'SYSTEM', playerName: 'System', createdAt: serverTimestamp, createdBy: userId };

        const updateData: { [key: string]: any } = { ...updates, updatedAt: serverTimestamp };

        if (updates.status === 'inprogress' && gameData.status === 'scheduled') {
            const startPeriodEventRef = gameRef.collection('events').doc();
            transaction.set(startPeriodEventRef, { ...baseEventPayload, action: 'period_start', period: 1, gameTimeSeconds: updates.periodTimeRemainingSeconds || 0 });
            updateData.currentPeriod = 1;
        }
        
        if (updates.isTimerRunning === true && !gameData.isTimerRunning) {
            updateData.timerStartedAt = serverTimestamp;
            const timerStartEventRef = gameRef.collection('events').doc();
            transaction.set(timerStartEventRef, { ...baseEventPayload, action: 'timer_start', period: gameData.currentPeriod || 1, gameTimeSeconds: gameData.periodTimeRemainingSeconds || 0 });
        } else if (updates.isTimerRunning === false && gameData.isTimerRunning) {
            const timerStartedAtTimestamp = gameData.timerStartedAt as admin.firestore.Timestamp | null;
            const startTimeMs = timerStartedAtTimestamp ? timerStartedAtTimestamp.toMillis() : Date.now();
            let timeElapsedSeconds = Math.round((Date.now() - startTimeMs) / 1000);

            if (!isFinite(timeElapsedSeconds) || timeElapsedSeconds < 0) {
              timeElapsedSeconds = 0;
            }
            
            const newRemainingTime = Math.max(0, (gameData.periodTimeRemainingSeconds || 0) - timeElapsedSeconds);
            updateData.periodTimeRemainingSeconds = newRemainingTime;

            const onCourtIds = [...(gameData.homeTeamOnCourtPlayerIds || []), ...(gameData.awayTeamOnCourtPlayerIds || [])];
            onCourtIds.forEach(playerId => {
                const currentStats = gameData.playerStats?.[playerId];
                if (currentStats) {
                    updateData[`playerStats.${playerId}.timePlayedSeconds`] = admin.firestore.FieldValue.increment(timeElapsedSeconds);
                }
            });
    
            const timerPauseEventRef = gameRef.collection('events').doc();
            transaction.set(timerPauseEventRef, { ...baseEventPayload, action: 'timer_pause', period: gameData.currentPeriod || 1, gameTimeSeconds: newRemainingTime });
            
            updateData.timerStartedAt = null;
        }
        
        if (updates.currentPeriod && updates.currentPeriod > (gameData.currentPeriod || 0)) {
            const oldPeriod = gameData.currentPeriod || 1;
            const periodEndEventRef = gameRef.collection('events').doc();
            transaction.set(periodEndEventRef, { ...baseEventPayload, action: 'period_end', period: oldPeriod, gameTimeSeconds: 0 });
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

            const assignments = gameData.scorerAssignments || {};
            const { action, playerId, teamId } = eventData;
            let requiredCategory: StatCategory | null = null;

            if (action.startsWith('shot')) requiredCategory = 'shots';
            else if (action.includes('foul')) requiredCategory = 'fouls';
            else if (['rebound_defensive', 'rebound_offensive', 'assist', 'steal', 'block', 'turnover', 'block_against'].includes(action)) requiredCategory = 'turnovers';
            
            if (requiredCategory && assignments[requiredCategory]?.uid !== userId && !isSuperAdmin) {
                 throw new Error(`No tienes permiso para anotar "${requiredCategory}".`);
            }

            transaction.set(eventRef, { ...eventData, gameId, createdBy: userId, createdAt: admin.firestore.FieldValue.serverTimestamp() });

            const scoreField = teamId === 'home' ? 'homeTeamScore' : 'awayTeamScore';
            const teamStatsField = teamId === 'home' ? 'homeTeamStats' : 'awayTeamStats';
            const playerStatsField = `playerStats.${playerId}`;
            
            const updates: { [key: string]: any } = {};
            const increment = admin.firestore.FieldValue.increment;
            
            const processScore = (points: number) => {
                const onCourtHome = gameData.homeTeamOnCourtPlayerIds || [];
                const onCourtAway = gameData.awayTeamOnCourtPlayerIds || [];
                if (teamId === 'home') {
                    onCourtHome.forEach(pId => { updates[`playerStats.${pId}.plusMinus`] = increment(points); });
                    onCourtAway.forEach(pId => { updates[`playerStats.${pId}.plusMinus`] = increment(-points); });
                } else {
                    onCourtAway.forEach(pId => { updates[`playerStats.${pId}.plusMinus`] = increment(points); });
                    onCourtHome.forEach(pId => { updates[`playerStats.${pId}.plusMinus`] = increment(-points); });
                }
            };
            
            const pirMapping: Partial<Record<GameEventAction, number>> = {
                shot_made_1p: 1, shot_miss_1p: -1,
                shot_made_2p: 2, shot_miss_2p: -1,
                shot_made_3p: 3, shot_miss_3p: -1,
                rebound_defensive: 1, rebound_offensive: 1,
                assist: 1, steal: 1, block: 1, foul_received: 1,
                turnover: -1, foul: -1, block_against: -1,
            };

            const actions: Partial<Record<GameEventAction, () => void>> = {
                shot_made_1p: () => { processScore(1); updates[scoreField] = increment(1); updates[`${teamStatsField}.onePointMade`] = increment(1); updates[`${teamStatsField}.onePointAttempts`] = increment(1); updates[`${playerStatsField}.points`] = increment(1); updates[`${playerStatsField}.shots_made_1p`] = increment(1); updates[`${playerStatsField}.shots_attempted_1p`] = increment(1); },
                shot_miss_1p: () => { updates[`${teamStatsField}.onePointAttempts`] = increment(1); updates[`${playerStatsField}.shots_attempted_1p`] = increment(1); },
                shot_made_2p: () => { processScore(2); updates[scoreField] = increment(2); updates[`${teamStatsField}.twoPointMade`] = increment(1); updates[`${teamStatsField}.twoPointAttempts`] = increment(1); updates[`${playerStatsField}.points`] = increment(2); updates[`${playerStatsField}.shots_made_2p`] = increment(1); updates[`${playerStatsField}.shots_attempted_2p`] = increment(1); },
                shot_miss_2p: () => { updates[`${teamStatsField}.twoPointAttempts`] = increment(1); updates[`${playerStatsField}.shots_attempted_2p`] = increment(1); },
                shot_made_3p: () => { processScore(3); updates[scoreField] = increment(3); updates[`${teamStatsField}.threePointMade`] = increment(1); updates[`${teamStatsField}.threePointAttempts`] = increment(1); updates[`${playerStatsField}.points`] = increment(3); updates[`${playerStatsField}.shots_made_3p`] = increment(1); updates[`${playerStatsField}.shots_attempted_3p`] = increment(1); },
                shot_miss_3p: () => { updates[`${teamStatsField}.threePointAttempts`] = increment(1); updates[`${playerStatsField}.shots_attempted_3p`] = increment(1); },
                rebound_defensive: () => { updates[`${teamStatsField}.reboundsDefensive`] = increment(1); updates[`${playerStatsField}.reb_def`] = increment(1); },
                rebound_offensive: () => { updates[`${teamStatsField}.reboundsOffensive`] = increment(1); updates[`${playerStatsField}.reb_off`] = increment(1); },
                assist: () => { updates[`${teamStatsField}.assists`] = increment(1); updates[`${playerStatsField}.assists`] = increment(1); },
                steal: () => { updates[`${teamStatsField}.steals`] = increment(1); updates[`${playerStatsField}.steals`] = increment(1); },
                block: () => { updates[`${teamStatsField}.blocks`] = increment(1); updates[`${playerStatsField}.blocks`] = increment(1); },
                turnover: () => { updates[`${teamStatsField}.turnovers`] = increment(1); updates[`${playerStatsField}.turnovers`] = increment(1); },
                foul: () => { updates[`${teamStatsField}.fouls`] = increment(1); updates[`${playerStatsField}.fouls`] = increment(1); },
                block_against: () => { updates[`${teamStatsField}.blocksAgainst`] = increment(1); updates[`${playerStatsField}.blocks_against`] = increment(1); },
                foul_received: () => { updates[`${teamStatsField}.foulsReceived`] = increment(1); updates[`${playerStatsField}.fouls_received`] = increment(1); },
            };

            actions[action]?.();
            
            if (pirMapping[action]) {
                updates[`${playerStatsField}.pir`] = increment(pirMapping[action]!);
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
        const profile = await getUserProfileById(userId);
        if (!profile) throw new Error("User profile not found.");

        let hasPermission = false;
        
        if (profile.profileTypeId === 'super_admin') {
            hasPermission = true;
        } else if (['club_admin', 'coordinator'].includes(profile.profileTypeId)) {
            const teamClubId = teamType === 'home' ? gameData.homeTeamClubId : gameData.awayTeamClubId;
            if (profile.clubId === teamClubId) {
                hasPermission = true;
            }
        } else if (profile.profileTypeId === 'coach') {
            const coachTeams = await getCoachTeams(userId);
            const teamId = teamType === 'home' ? gameData.homeTeamId : gameData.awayTeamId;
            if (coachTeams.some(t => t.id === teamId)) {
                hasPermission = true;
            }
        }
        
        if (!hasPermission) {
            throw new Error("No tienes permiso para realizar sustituciones en este equipo.");
        }

        const onCourtField = teamType === 'home' ? 'homeTeamOnCourtPlayerIds' : 'awayTeamOnCourtPlayerIds';
        let onCourtIds = gameData[onCourtField] || [];
        
        const serverTimestamp = admin.firestore.FieldValue.serverTimestamp();
        const baseEventPayload = { gameId, teamId: teamType, period, gameTimeSeconds, createdAt: serverTimestamp, createdBy: userId };

        if (playerOut) {
            onCourtIds = onCourtIds.filter(id => id !== playerOut.id);
            const eventOutRef = gameRef.collection('events').doc();
            transaction.set(eventOutRef, { ...baseEventPayload, action: 'substitution_out', playerId: playerOut.id, playerName: playerOut.name });
        }

        if (!onCourtIds.includes(playerIn.id)) {
            if (onCourtIds.length >= 5) {
                if (!playerOut) throw new Error("Court is full (5 players). You must select a player to substitute out.");
            }
            onCourtIds.push(playerIn.id);
            const eventInRef = gameRef.collection('events').doc();
            transaction.set(eventInRef, { ...baseEventPayload, action: 'substitution_in', playerId: playerIn.id, playerName: playerIn.name });

            const playerStatsField = `playerStats.${playerIn.id}.periodsPlayedSet`;
            const playerStats = gameData.playerStats?.[playerIn.id];
            const periodsPlayedSet = new Set(playerStats?.periodsPlayedSet || []);
            periodsPlayedSet.add(period);
            transaction.update(gameRef, {[`playerStats.${playerIn.id}.periodsPlayedSet`]: Array.from(periodsPlayedSet)});
            transaction.update(gameRef, {[`playerStats.${playerIn.id}.periodsPlayed`]: periodsPlayedSet.size});


        } else {
            throw new Error("Player is already on court.");
        }

        transaction.update(gameRef, { [onCourtField]: onCourtIds });
    });
    return { success: true };
  } catch (error: any) {
    console.error("Error substituting player:", error);
    return { success: false, error: error.message };
  }
}
