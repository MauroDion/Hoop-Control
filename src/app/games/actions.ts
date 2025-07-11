
'use server';
import { adminDb } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { revalidatePath } from 'next/cache';
import type { Game, GameFormData, Team, TeamStats, Player, GameEventAction, UserFirestoreProfile, StatCategory, PlayerGameStats, Season, GameFormat, GameEvent } from '@/types';
import { getTeamsByCoach as getCoachTeams } from '@/lib/actions/teams';
import { getUserProfileById } from '@/lib/actions/users';
import { getPlayersFromIds } from '@/app/players/actions';

const initialPlayerStats: Omit<PlayerGameStats, 'playerId' | 'playerName'> = {
    timePlayedSeconds: 0,
    periodsPlayed: 0,
    periodsPlayedSet: [],
    points: 0, shots_made_1p: 0, shots_attempted_1p: 0,
    shots_made_2p: 0, shots_attempted_2p: 0,
    shots_made_3p: 0, shots_attempted_3p: 0,
    reb_def: 0, reb_off: 0, assists: 0, steals: 0, blocks: 0, turnovers: 0,
    fouls: 0, blocks_against: 0, fouls_received: 0,
    pir: 0, plusMinus: 0
};

// --- Public Actions ---

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
                date: (data.date as admin.firestore.Timestamp).toDate(),
                createdAt: data.createdAt ? (data.createdAt as admin.firestore.Timestamp).toDate() : new Date(),
                updatedAt: data.updatedAt ? (data.updatedAt as admin.firestore.Timestamp).toDate() : new Date(),
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
                    date: (gameData.date as admin.firestore.Timestamp).toDate(),
                } as Game);
            });
        };

        processSnapshot(homeGamesSnap);
        processSnapshot(awayGamesSnap);

        const games = Array.from(gamesMap.values());
        games.sort((a, b) => b.date.getTime() - a.date.getTime()); // Sort recent first

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
                    date: (gameData.date as admin.firestore.Timestamp).toDate(),
                } as Game);
            });
        };
       
        processSnapshot(homeGamesSnap);
        processSnapshot(awayGamesSnap);

        const games = Array.from(gamesMap.values());
        games.sort((a, b) => b.date.getTime() - a.date.getTime());

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
                    date: (gameData.date as admin.firestore.Timestamp).toDate(),
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
            date: (data.date as admin.firestore.Timestamp).toDate(),
            createdAt: data.createdAt ? (data.createdAt as admin.firestore.Timestamp).toDate() : new Date(),
            updatedAt: data.updatedAt ? (data.updatedAt as admin.firestore.Timestamp).toDate() : new Date(),
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
            date: gameDateTime,
            location: formData.location,
            status: 'scheduled',
            seasonId: formData.seasonId,
            competitionCategoryId: formData.competitionCategoryId,
            gameFormatId: formData.gameFormatId || null,
            createdBy: userId,
            createdAt: new Date(),
            updatedAt: new Date(),
            homeTeamScore: 0,
            awayTeamScore: 0,
            homeTeamStats: initialTeamStats,
            awayTeamStats: initialTeamStats,
            playerStats: {},
            currentPeriod: 1,
            isTimerRunning: false,
            periodTimeRemainingSeconds: 0,
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
        const seasonsSnapshot = await adminDb.collection('seasons').where('status', '==', 'active').limit(1).get();

        if (seasonsSnapshot.empty) {
            return { success: false, error: "No active season found. Please seed the database or create an active season." };
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
        const initialTeamStats: TeamStats = { onePointAttempts: 0, onePointMade: 0, twoPointAttempts: 0, twoPointMade: 0, threePointAttempts: 0, threePointMade: 0, fouls: 0, timeouts: 0, reboundsOffensive: 0, reboundsDefensive: 0, assists: 0, steals: 0, blocks: 0, turnovers: 0, blocksAgainst: 0, foulsReceived: 0, };
        
        const playerStats: { [playerId: string]: Partial<PlayerGameStats> } = {};
        [...homePlayers, ...awayPlayers].forEach(player => {
            playerStats[player.id] = { ...initialPlayerStats, playerId: player.id, playerName: `${player.firstName} ${player.lastName}` };
        });

        const newGameData: Omit<Game, 'id'> = {
            homeTeamId, homeTeamClubId: homeTeamData.clubId, homeTeamName: homeTeamData.name, homeTeamLogoUrl: homeTeamData.logoUrl || null,
            awayTeamId, awayTeamClubId: awayTeamData.clubId, awayTeamName: awayTeamData.name, awayTeamLogoUrl: awayTeamData.logoUrl || null,
            date: gameDateTime, location: 'Pista de Pruebas', status: 'scheduled',
            seasonId, competitionCategoryId, gameFormatId,
            createdBy: userId, createdAt: new Date(), updatedAt: new Date(),
            homeTeamScore: 0, awayTeamScore: 0, homeTeamStats: initialTeamStats, awayTeamStats: initialTeamStats, playerStats,
            currentPeriod: 1, isTimerRunning: false, periodTimeRemainingSeconds: 0,
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
  updates: Partial<Pick<Game, 'status' | 'isTimerRunning' | 'periodTimeRemainingSeconds'>>
): Promise<{ success: boolean; error?: string }> {
  if (!adminDb) return { success: false, error: "La base de datos no está inicializada." };
  
  const gameRef = adminDb.collection('games').doc(gameId);
  try {
      await adminDb.runTransaction(async (transaction) => {
          const gameDoc = await transaction.get(gameRef);
          if (!gameDoc.exists) throw new Error("Game not found.");
          
          const gameData = gameDoc.data() as Game;
          const wasTimerRunning = gameData.isTimerRunning;
          const isNowRunning = updates.isTimerRunning;

          const finalUpdates: { [key: string]: any } = { ...updates, updatedAt: admin.firestore.FieldValue.serverTimestamp() };

          if (isNowRunning === true && wasTimerRunning === false) {
              finalUpdates.timerStartedAt = admin.firestore.FieldValue.serverTimestamp();
          } else if (isNowRunning === false && wasTimerRunning === true) {
              if (updates.periodTimeRemainingSeconds !== undefined) {
                  finalUpdates.periodTimeRemainingSeconds = updates.periodTimeRemainingSeconds;
              }
              finalUpdates.timerStartedAt = null;
          }
          transaction.update(gameRef, finalUpdates);
      });
      return { success: true };
  } catch (error: any) {
      console.error("Error updating live game state:", error.message);
      return { success: false, error: error.message };
  }
}

export async function endCurrentPeriod(gameId: string, userId: string): Promise<{ success: boolean, error?: string }> {
    if (!adminDb) return { success: false, error: "Database not initialized." };
    const gameRef = adminDb.collection('games').doc(gameId);

    try {
        await adminDb.runTransaction(async (transaction) => {
            const gameDoc = await transaction.get(gameRef);
            if (!gameDoc.exists) throw new Error("Game not found.");
            
            const gameData = gameDoc.data() as Game;
            const gameFormatDoc = gameData.gameFormatId ? await adminDb.collection('gameFormats').doc(gameData.gameFormatId).get() : null;
            if (gameData.gameFormatId && (gameFormatDoc && !gameFormatDoc.exists)) throw new Error("Game format not found");
            const gameFormat = gameFormatDoc?.data() as GameFormat;
            
            const totalPeriodDuration = (gameFormat?.periodDurationMinutes || 10) * 60;
            const finalUpdates: { [key: string]: any } = {};
            const currentPeriod = gameData.currentPeriod || 1;
            
            const onCourtIds = [...(gameData.homeTeamOnCourtPlayerIds || []), ...(gameData.awayTeamOnCourtPlayerIds || [])];
            if (onCourtIds.length > 0) {
                 const timeToAdd = gameData.isTimerRunning ? 0 : gameData.periodTimeRemainingSeconds || 0;
                 if (timeToAdd > 0) {
                     onCourtIds.forEach(pId => {
                        finalUpdates[`playerStats.${pId}.timePlayedSeconds`] = admin.firestore.FieldValue.increment(timeToAdd);
                     });
                 }
            }
            
            const maxPeriods = gameFormat?.numPeriods || 4;

            finalUpdates.isTimerRunning = false;
            finalUpdates.timerStartedAt = null;
            finalUpdates.updatedAt = admin.firestore.FieldValue.serverTimestamp();
            finalUpdates.homeTeamOnCourtPlayerIds = [];
            finalUpdates.awayTeamOnCourtPlayerIds = [];
            finalUpdates.periodTimeRemainingSeconds = totalPeriodDuration;

            if (currentPeriod < maxPeriods) {
                finalUpdates.currentPeriod = currentPeriod + 1;
            } else {
                finalUpdates.status = 'completed';
                finalUpdates.periodTimeRemainingSeconds = 0;
            }
            
            transaction.update(gameRef, finalUpdates);
        });
        return { success: true };
    } catch (error: any) {
        console.error("Error ending period:", error.message);
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
            if (!profile) throw new Error("User profile not found.");
            
            const { action, teamId, playerId } = eventData;
            
            const isSuperAdmin = profile.profileTypeId === 'super_admin';
            let hasPermission = isSuperAdmin;
            if (!hasPermission) {
                const assignments = gameData.scorerAssignments || {};
                if (action.includes('shot')) { hasPermission = assignments.shots?.uid === userId; } 
                else if (action.includes('foul')) { hasPermission = assignments.fouls?.uid === userId; } 
                else { hasPermission = assignments.turnovers?.uid === userId; }
            }

            if (!hasPermission) {
                throw new Error("Acción no permitida. No tienes asignada esta categoría de estadísticas.");
            }
            
            let finalUpdates: { [key: string]: any } = { updatedAt: admin.firestore.FieldValue.serverTimestamp() };
            
            const pStatsPrefix = `playerStats.${playerId}`;
            const tStatsPrefix = `${teamId}TeamStats`;
            
            const actionHandlers: Partial<Record<GameEventAction, () => void>> = {
                shot_made_1p: () => { finalUpdates[`${pStatsPrefix}.points`] = admin.firestore.FieldValue.increment(1); finalUpdates[`${pStatsPrefix}.shots_made_1p`]=admin.firestore.FieldValue.increment(1); finalUpdates[`${pStatsPrefix}.shots_attempted_1p`]=admin.firestore.FieldValue.increment(1); finalUpdates[`${teamId}TeamScore`]=admin.firestore.FieldValue.increment(1); },
                shot_miss_1p: () => { finalUpdates[`${pStatsPrefix}.shots_attempted_1p`]=admin.firestore.FieldValue.increment(1); },
                shot_made_2p: () => { finalUpdates[`${pStatsPrefix}.points`]=admin.firestore.FieldValue.increment(2); finalUpdates[`${pStatsPrefix}.shots_made_2p`]=admin.firestore.FieldValue.increment(1); finalUpdates[`${pStatsPrefix}.shots_attempted_2p`]=admin.firestore.FieldValue.increment(1); finalUpdates[`${teamId}TeamScore`]=admin.firestore.FieldValue.increment(2); },
                shot_miss_2p: () => { finalUpdates[`${pStatsPrefix}.shots_attempted_2p`]=admin.firestore.FieldValue.increment(1); },
                shot_made_3p: () => { finalUpdates[`${pStatsPrefix}.points`]=admin.firestore.FieldValue.increment(3); finalUpdates[`${pStatsPrefix}.shots_made_3p`]=admin.firestore.FieldValue.increment(1); finalUpdates[`${pStatsPrefix}.shots_attempted_3p`]=admin.firestore.FieldValue.increment(1); finalUpdates[`${teamId}TeamScore`]=admin.firestore.FieldValue.increment(3); },
                shot_miss_3p: () => { finalUpdates[`${pStatsPrefix}.shots_attempted_3p`]=admin.firestore.FieldValue.increment(1); },
                rebound_defensive: () => { finalUpdates[`${pStatsPrefix}.reb_def`]=admin.firestore.FieldValue.increment(1); finalUpdates[`${tStatsPrefix}.reboundsDefensive`]=admin.firestore.FieldValue.increment(1); },
                rebound_offensive: () => { finalUpdates[`${pStatsPrefix}.reb_off`]=admin.firestore.FieldValue.increment(1); finalUpdates[`${tStatsPrefix}.reboundsOffensive`]=admin.firestore.FieldValue.increment(1); },
                assist: () => { finalUpdates[`${pStatsPrefix}.assists`]=admin.firestore.FieldValue.increment(1); finalUpdates[`${tStatsPrefix}.assists`]=admin.firestore.FieldValue.increment(1); },
                steal: () => { finalUpdates[`${pStatsPrefix}.steals`]=admin.firestore.FieldValue.increment(1); finalUpdates[`${tStatsPrefix}.steals`]=admin.firestore.FieldValue.increment(1); },
                block: () => { finalUpdates[`${pStatsPrefix}.blocks`]=admin.firestore.FieldValue.increment(1); finalUpdates[`${tStatsPrefix}.blocks`]=admin.firestore.FieldValue.increment(1); },
                turnover: () => { finalUpdates[`${pStatsPrefix}.turnovers`]=admin.firestore.FieldValue.increment(1); finalUpdates[`${tStatsPrefix}.turnovers`]=admin.firestore.FieldValue.increment(1); },
                foul: () => { finalUpdates[`${pStatsPrefix}.fouls`]=admin.firestore.FieldValue.increment(1); finalUpdates[`${tStatsPrefix}.fouls`]=admin.firestore.FieldValue.increment(1); },
                block_against: () => { finalUpdates[`${pStatsPrefix}.blocks_against`]=admin.firestore.FieldValue.increment(1); finalUpdates[`${tStatsPrefix}.blocksAgainst`]=admin.firestore.FieldValue.increment(1); },
                foul_received: () => { finalUpdates[`${pStatsPrefix}.fouls_received`]=admin.firestore.FieldValue.increment(1); finalUpdates[`${teamId === 'home' ? 'away' : 'home'}TeamStats.fouls`]=admin.firestore.FieldValue.increment(1); },
                team_foul: () => { finalUpdates[`${tStatsPrefix}.fouls`]=admin.firestore.FieldValue.increment(1); },
                timeout: () => { finalUpdates[`${tStatsPrefix}.timeouts`]=admin.firestore.FieldValue.increment(1); },
            };
            
            if (actionHandlers[action]) { actionHandlers[action]!(); }

            if (action.startsWith('shot_made')) {
                const points = parseInt(action.charAt(10), 10);
                (gameData.homeTeamOnCourtPlayerIds || []).forEach((pId: string) => { finalUpdates[`playerStats.${pId}.plusMinus`] = admin.firestore.FieldValue.increment(teamId === 'home' ? points : -points); });
                (gameData.awayTeamOnCourtPlayerIds || []).forEach((pId: string) => { finalUpdates[`playerStats.${pId}.plusMinus`] = admin.firestore.FieldValue.increment(teamId === 'away' ? points : -points); });
            }
            
            transaction.set(eventRef, { ...eventData, gameId, createdAt: admin.firestore.FieldValue.serverTimestamp(), createdBy: userId });
            transaction.update(gameRef, finalUpdates);
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
        const gameFormatDoc = gameData.gameFormatId ? await adminDb.collection('gameFormats').doc(gameData.gameFormatId).get() : null;
        if (gameData.gameFormatId && (gameFormatDoc && !gameFormatDoc.exists)) throw new Error("Game format not found");

        let playerStatsCopy = JSON.parse(JSON.stringify(gameData.playerStats || {}));
        const onCourtField = teamType === 'home' ? 'homeTeamOnCourtPlayerIds' : 'awayTeamOnCourtPlayerIds';
        let onCourtIds = (gameData[onCourtField] as string[] || []);
        
        const baseEventPayload = { gameId, teamId: teamType, period, gameTimeSeconds, createdAt: admin.firestore.FieldValue.serverTimestamp(), createdBy: userId };
        const finalUpdates: { [key: string]: any } = { updatedAt: admin.firestore.FieldValue.serverTimestamp() };

        if (gameData.isTimerRunning && gameData.timerStartedAt) {
            const serverStopTime = Date.now();
            const serverStartTime = (gameData.timerStartedAt as admin.firestore.Timestamp).toMillis();
            const elapsedSeconds = Math.max(0, Math.floor((serverStopTime - serverStartTime) / 1000));
            
            if (elapsedSeconds > 0) {
                const currentOnCourtIds = [...(gameData.homeTeamOnCourtPlayerIds || []), ...(gameData.awayTeamOnCourtPlayerIds || [])];
                currentOnCourtIds.forEach(pId => {
                    finalUpdates[`playerStats.${pId}.timePlayedSeconds`] = admin.firestore.FieldValue.increment(elapsedSeconds);
                });
            }
            finalUpdates.periodTimeRemainingSeconds = (gameData.periodTimeRemainingSeconds || 0) - elapsedSeconds;
            finalUpdates.timerStartedAt = admin.firestore.FieldValue.serverTimestamp();
        }

        if (playerOut) {
            onCourtIds = onCourtIds.filter(id => id !== playerOut.id);
            const eventOutRef = gameRef.collection('events').doc();
            transaction.set(eventOutRef, { ...baseEventPayload, action: 'substitution_out', playerId: playerOut.id, playerName: playerOut.name });
        }

        if (!onCourtIds.includes(playerIn.id)) {
            const requiredPlayers = gameFormatDoc?.data()?.name?.includes('3v3') ? 3 : 5;
            if (onCourtIds.length >= requiredPlayers) {
                if (!playerOut) throw new Error(`La pista está llena (${requiredPlayers} jugadores). Debes seleccionar a un jugador para sustituir.`);
            }
            onCourtIds.push(playerIn.id);
            
            const eventInRef = gameRef.collection('events').doc();
            transaction.set(eventInRef, { ...baseEventPayload, action: 'substitution_in', playerId: playerIn.id, playerName: playerIn.name });

            if (!playerStatsCopy[playerIn.id]) {
                playerStatsCopy[playerIn.id] = { ...initialPlayerStats, playerId: playerIn.id, playerName: playerIn.name };
            }
            
            const currentPeriods = new Set(playerStatsCopy[playerIn.id]?.periodsPlayedSet || []);
            if (!currentPeriods.has(period)) {
                currentPeriods.add(period);
                playerStatsCopy[playerIn.id].periodsPlayedSet = Array.from(currentPeriods);
                playerStatsCopy[playerIn.id].periodsPlayed = currentPeriods.size;
            }

        } else {
            throw new Error("El jugador ya está en la pista.");
        }
        
        finalUpdates.playerStats = playerStatsCopy;
        finalUpdates[onCourtField] = onCourtIds;

        transaction.update(gameRef, finalUpdates);
    });
    return { success: true };
  } catch (error: any) {
    console.error("Error substituting player:", error);
    return { success: false, error: error.message };
  }
}

```
- src/lib/hoopControlApi.ts:
```ts
import type { ApiDataItem } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_HOOP_CONTROL_API_BASE_URL || "https://api.hoopcontrol.example.com/v1";
const PUBLIC_API_KEY = process.env.NEXT_PUBLIC_HOOP_CONTROL_API_KEY;

interface FetchOptions extends RequestInit {}

async function fetchFromHoopControlApi<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (PUBLIC_API_KEY) {
     headers['X-API-Key'] = PUBLIC_API_KEY;
  }
  
  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    let errorBody;
    try {
      errorBody = await response.json();
    } catch (e) {
      errorBody = { message: response.statusText };
    }
    const errorMessage = `API request to ${endpoint} failed with status ${response.status}: ${errorBody?.message || 'Unknown error'}`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
  return response.json() as Promise<T>;
}


export async function getKeyMetrics(): Promise<{data: ApiDataItem[], isMock: boolean}> {
  try {
    const data = await fetchFromHoopControlApi<ApiDataItem[]>('/key-metrics');
    return { data, isMock: false };
  } catch (error) {
    console.warn("Hoop Control API fetch failed, returning mock data for UI purposes.");
    const mockData = [
      { id: 1, name: "Usuarios Activos (Ejemplo)", value: Math.floor(Math.random() * 1000), category: "Interacción", lastUpdated: new Date().toISOString() },
      { id: 2, name: "Datos Procesados (Ejemplo)", value: Math.floor(Math.random() * 10000) + " GB", category: "Operaciones", lastUpdated: new Date().toISOString() },
      { id: 3, name: "Disponibilidad del Sistema (Ejemplo)", value: "99.95%", category: "Fiabilidad", lastUpdated: new Date().toISOString() },
    ];
    return { data: mockData, isMock: true };
  }
}

```
- src/pages/api/auth/[...nextauth].ts:
```ts
// This file is being deleted.

```
- src/pages/api/restricted.ts:
```ts
// This file is being deleted.

```
- src/seasons/page.tsx:
```tsx
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { getUserProfileById } from '@/app/users/actions';
import { getSeasons } from './actions';
import { getAllTeams } from '@/app/teams/actions';
import { getCompetitionCategories } from '@/app/competition-categories/actions';

import type { Season, Team, CompetitionCategory } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle, CalendarCheck, PlusCircle, ChevronsUpDown, Edit } from 'lucide-react';
import { SeasonForm } from '@/components/seasons/SeasonForm';
import Link from 'next/link';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';


export default function ManageSeasonsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [allCategories, setAllCategories] = useState<CompetitionCategory[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!user) throw new Error("Autenticación requerida.");
      
      const profile = await getUserProfileById(user.uid);
      if (profile?.profileTypeId !== 'super_admin') {
        throw new Error('Acceso Denegado. Debes ser Super Admin para ver esta página.');
      }
      setIsSuperAdmin(true);

      const [fetchedSeasons, fetchedTeams, fetchedCategories] = await Promise.all([
        getSeasons(),
        getAllTeams(),
        getCompetitionCategories()
      ]);
      setSeasons(fetchedSeasons);
      setAllTeams(fetchedTeams);
      setAllCategories(fetchedCategories);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/login?redirect=/seasons');
      } else {
        fetchData();
      }
    }
  }, [user, authLoading, router, fetchData]);

  const getCategoryName = (id: string) => allCategories.find(c => c.id === id)?.name || id;

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4">Cargando datos de temporadas...</p>
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
    <div className="space-y-8">
       <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Crear Nueva Temporada</DialogTitle>
            <DialogDescription>
              Define una nueva temporada y configura sus competiciones y equipos participantes.
            </DialogDescription>
          </DialogHeader>
          <SeasonForm 
            allTeams={allTeams}
            allCategories={allCategories}
            onFormSubmit={() => {
              setIsFormOpen(false);
              fetchData();
            }}
          />
        </DialogContent>
      </Dialog>
      
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-headline font-bold text-primary flex items-center">
          <CalendarCheck className="mr-3 h-10 w-10" /> Gestionar Temporadas
        </h1>
        <Button onClick={() => setIsFormOpen(true)}>
            <PlusCircle className="mr-2 h-5 w-5" /> Crear Nueva Temporada
        </Button>
      </div>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle>Todas las Temporadas</CardTitle>
          <CardDescription>
            A continuación se muestra una lista de todas las temporadas del sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {seasons.length === 0 ? (
             <div className="text-center py-10 border-2 border-dashed rounded-lg">
                <CalendarCheck className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold">No se Encontraron Temporadas</h2>
                <p className="text-muted-foreground">Crea una para empezar a programar partidos.</p>
            </div>
          ) : (
             <div className="space-y-4">
              {seasons.map((season) => (
                <Collapsible key={season.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <h3 className="text-xl font-semibold">{season.name}</h3>
                      <Badge variant={season.status === 'active' ? 'default' : 'secondary'}>
                        {season.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button asChild variant="outline" size="sm">
                          <Link href={`/seasons/${season.id}/edit`}>
                              <Edit className="h-4 w-4 mr-2"/>
                              Editar
                          </Link>
                      </Button>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-9 p-0">
                          <ChevronsUpDown className="h-4 w-4" />
                          <span className="sr-only">Toggle</span>
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                  </div>
                  <CollapsibleContent className="space-y-3 pt-4">
                    {season.competitions?.map(comp => (
                      <div key={comp.competitionCategoryId} className="p-3 bg-muted/50 rounded-md">
                        <h4 className="font-medium">{getCategoryName(comp.competitionCategoryId)}</h4>
                        <p className="text-sm text-muted-foreground">{comp.teamIds.length} equipos participantes.</p>
                      </div>
                    ))}
                     {(!season.competitions || season.competitions.length === 0) && (
                       <p className="text-sm text-muted-foreground italic">Esta temporada no tiene competiciones configuradas.</p>
                     )}
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

```
- src/tasks/actions.ts:
```ts
"use server";

import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/firebase/admin";
import admin from 'firebase-admin';
import type { Task, TaskFormData } from "@/types";

export async function createTask(formData: TaskFormData, userId: string): Promise<{ success: boolean; error?: string, id?: string }> {
  if (!userId) {
    return { success: false, error: "User not authenticated." };
  }
  if (!adminDb) {
    return { success: false, error: "Database not initialized."};
  }

  try {
    const newTaskData = {
      ...formData,
      dueDate: formData.dueDate ? admin.firestore.Timestamp.fromDate(new Date(formData.dueDate)) : null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      userId: userId,
    };
    const docRef = await adminDb.collection("tasks").add(newTaskData);
    revalidatePath("/tasks");
    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error("Error creating task:", error);
    return { success: false, error: error.message || "Failed to create task." };
  }
}

export async function updateTask(id: string, formData: Partial<TaskFormData>, userId: string): Promise<{ success: boolean; error?: string }> {
   if (!userId) {
    return { success: false, error: "User not authenticated." };
  }
  if (!adminDb) {
    return { success: false, error: "Database not initialized."};
  }
  try {
    const taskRef = adminDb.collection("tasks").doc(id);
    const taskSnap = await taskRef.get();
    
    if (!taskSnap.exists || taskSnap.data()?.userId !== userId) {
      return { success: false, error: "Permission denied or task not found."};
    }

    const updateData: { [key: string]: any } = { ...formData, updatedAt: admin.firestore.FieldValue.serverTimestamp() };
    if (formData.dueDate) {
      updateData.dueDate = admin.firestore.Timestamp.fromDate(new Date(formData.dueDate));
    } else if (formData.dueDate === null) {
      updateData.dueDate = null;
    }
    
    await taskRef.update(updateData);
    revalidatePath("/tasks");
    revalidatePath(`/tasks/${id}`);
    revalidatePath(`/tasks/${id}/edit`);
    return { success: true };
  } catch (error: any) {
    console.error("Error updating task:", error);
    return { success: false, error: error.message || "Failed to update task." };
  }
}

export async function deleteTask(id: string, userId: string): Promise<{ success: boolean; error?: string }> {
  if (!userId) {
    return { success: false, error: "User not authenticated." };
  }
  if (!adminDb) {
    return { success: false, error: "Database not initialized."};
  }
  try {
    const taskRef = adminDb.collection("tasks").doc(id);
    const taskSnap = await taskRef.get();
    if (!taskSnap.exists() || taskSnap.data()?.userId !== userId) {
      return { success: false, error: "Permission denied or task not found."};
    }
    await taskRef.delete();
    revalidatePath("/tasks");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting task:", error);
    return { success: false, error: error.message || "Failed to delete task." };
  }
}

export async function getTasks(userId: string): Promise<Task[]> {
  if (!userId) {
    console.warn("getTasks called without userId.");
    return [];
  }
  if (!adminDb) {
    return [];
  }
  try {
    const q = adminDb.collection("tasks").where("userId", "==", userId);
    const querySnapshot = await q.get();
    const tasks = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            dueDate: data.dueDate ? (data.dueDate as admin.firestore.Timestamp).toDate().toISOString() : null,
            createdAt: (data.createdAt as admin.firestore.Timestamp).toDate().toISOString(),
            updatedAt: (data.updatedAt as admin.firestore.Timestamp).toDate().toISOString(),
        } as Task
    });
    return tasks;
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return [];
  }
}

export async function getTaskById(id: string, userId: string): Promise<Task | null> {
  if (!userId) {
     console.warn("getTaskById called without userId.");
    return null;
  }
  if (!adminDb) {
    return null;
  }
  try {
    const taskRef = adminDb.collection("tasks").doc(id);
    const taskSnap = await taskRef.get();
    
    if (taskSnap.exists() && taskSnap.data()?.userId === userId) {
       const data = taskSnap.data()!;
       return {
            id: taskSnap.id,
            ...data,
            dueDate: data.dueDate ? (data.dueDate as admin.firestore.Timestamp).toDate().toISOString() : null,
            createdAt: (data.createdAt as admin.firestore.Timestamp).toDate().toISOString(),
            updatedAt: (data.updatedAt as admin.firestore.Timestamp).toDate().toISOString(),
        } as Task;
    }
    return null;
  } catch (error) {
    console.error("Error fetching task by ID:", error);
    return null;
  }
}

```
- src/users/actions.ts:
```ts
'use server';

import { adminAuth, adminDb, adminInitError } from '@/lib/firebase/admin';
import type { UserFirestoreProfile, ProfileType, UserProfileStatus, Child } from '@/types';
import admin from 'firebase-admin';
import { revalidatePath } from 'next/cache';

export async function finalizeNewUserProfile(
  idToken: string,
  data: { profileType: ProfileType; selectedClubId?: string; displayName: string; }
): Promise<{ success: boolean; error?: string }> {
  if (!adminAuth || !adminDb) {
    console.error("UserActions (finalize): Firebase Admin SDK not initialized. Error:", adminInitError);
    return { success: false, error: `Server configuration error: ${adminInitError || 'Unknown admin SDK error.'}` };
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    await adminAuth.updateUser(uid, { displayName: data.displayName });
    
    const userProfileRef = adminDb.collection('user_profiles').doc(uid);
    
    if (data.profileType !== 'super_admin' && !data.selectedClubId) {
        return { success: false, error: "Club selection is required for this profile type."};
    }

    const profileToSave: any = {
        uid: uid,
        email: decodedToken.email || null,
        displayName: data.displayName,
        photoURL: decodedToken.picture || null,
        profileTypeId: data.profileType,
        clubId: data.profileType === 'super_admin' ? null : data.selectedClubId,
        status: 'pending_approval' as UserProfileStatus,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        isSeeded: false, // Mark as a real user
    };

    if (data.profileType === 'parent_guardian') {
      profileToSave.onboardingCompleted = false;
      profileToSave.children = [];
    } else {
      profileToSave.onboardingCompleted = true; // Admins and other roles are completed in one step.
    }
    
    await userProfileRef.set(profileToSave);
    
    return { success: true };

  } catch (error: any) {
    console.error(`UserActions (finalize): Error finalizing user profile. Error code: ${error.code}. Message: ${error.message}`);
    return { success: false, error: `Failed to finalize profile on server: ${error.message}` };
  }
}


export async function getUserProfileById(uid: string): Promise<UserFirestoreProfile | null> {
  if (!adminDb) {
    console.error("UserActions (getProfile): Firebase Admin SDK not initialized. Error:", adminInitError);
    return null;
  }
  
  try {
    const userProfileRef = adminDb.collection('user_profiles').doc(uid);
    const docSnap = await userProfileRef.get();

    if (docSnap.exists) {
      const data = docSnap.data()!;
      return { 
        uid: docSnap.id, 
        ...data,
        createdAt: (data.createdAt.toDate() as Date).toISOString(),
        updatedAt: (data.updatedAt.toDate() as Date).toISOString(),
       } as UserFirestoreProfile;
    } else {
      console.warn(`UserActions: No profile found for UID: ${uid} using Admin SDK.`);
      return null;
    }
  } catch (error: any) {
    console.error(`UserActions: Error fetching user profile for UID ${uid} with Admin SDK:`, error.message, error.stack);
    return null;
  }
}

export async function updateUserChildren(
  uid: string,
  children: Child[]
): Promise<{ success: boolean; error?: string }> {
  if (!adminDb) {
    return { success: false, error: 'Database not initialized.' };
  }
  if (!uid) {
    return { success: false, error: 'User not authenticated.' };
  }

  try {
    const userProfileRef = adminDb.collection('user_profiles').doc(uid);
    
    await userProfileRef.update({
      children: children,
      onboardingCompleted: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    revalidatePath('/profile/my-children');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error(`Error updating children for UID ${uid}:`, error);
    return { success: false, error: 'Failed to update children information.' };
  }
}

export async function getUsersByProfileTypeAndClub(
  profileType: ProfileType,
  clubId: string
): Promise<UserFirestoreProfile[]> {
  if (!adminDb) {
    console.error("UserActions (getUsersByProfileTypeAndClub): Admin SDK not initialized.");
    return [];
  }
  try {
    const usersRef = adminDb.collection('user_profiles');
    const q = usersRef.where('clubId', '==', clubId).where('profileTypeId', '==', profileType).where('status', '==', 'approved');
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
      return [];
    }
    
    const users = querySnapshot.docs.map(doc => {
      const data = doc.data()!;
      return {
        uid: doc.id,
        ...data,
        createdAt: (data.createdAt.toDate() as Date).toISOString(),
        updatedAt: (data.updatedAt.toDate() as Date).toISOString(),
      } as UserFirestoreProfile;
    });

    users.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));
    return users;

  } catch (error: any) {
    console.error(`Error fetching users by profile type '${profileType}' for club '${clubId}':`, error.message);
    if (error.code === 'failed-precondition' && error.message.includes("index")) {
        console.error("Firestore query failed. This is likely due to a missing composite index. Please create an index on 'clubId', 'profileTypeId', and 'status' for the 'user_profiles' collection.");
    }
    return [];
  }
}

```
- .firebaserc:
```json
{
  "projects": {
    "default": "hoopcontrol-bcsjd-web-app"
  }
}

```
- firebase.json:
```json
{
  "hosting": [
    {
      "source": ".",
      "target": "hoop-control-bcsjd-web-app-hosting",
      "frameworksBackend": {
        "region": "europe-west1"
      }
    }
  ]
}

```