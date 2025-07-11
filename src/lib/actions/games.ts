
'use server';
import { adminDb } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { revalidatePath } from 'next/cache';
import type { Game, GameFormData, Team, TeamStats, Player, GameEventAction, UserFirestoreProfile, StatCategory, PlayerGameStats, Season, GameFormat, GameEvent } from '@/types';
import { getTeamsByCoach as getCoachTeams } from '@/lib/actions/teams';
import { getUserProfileById } from '@/lib/actions/users';
import { getPlayersFromIds } from '@/lib/actions/players';

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
          
          const finalUpdates: { [key: string]: any } = { 
              ...updates,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          };

          const isStoppingTimer = updates.isTimerRunning === false && gameData.isTimerRunning === true;

          if (isStoppingTimer && gameData.timerStartedAt) {
              const serverStopTime = Date.now();
              const serverStartTime = (gameData.timerStartedAt as admin.firestore.Timestamp).toMillis();
              const elapsedSeconds = Math.max(0, Math.floor((serverStopTime - serverStartTime) / 1000));
              
              const onCourtIds = [...(gameData.homeTeamOnCourtPlayerIds || []), ...(gameData.awayTeamOnCourtPlayerIds || [])];
              onCourtIds.forEach(pId => {
                  finalUpdates[`playerStats.${pId}.timePlayedSeconds`] = admin.firestore.FieldValue.increment(elapsedSeconds);
              });

              finalUpdates.periodTimeRemainingSeconds = (gameData.periodTimeRemainingSeconds || 0) - elapsedSeconds;
              finalUpdates.timerStartedAt = null;
          } else if (updates.isTimerRunning === true && !gameData.isTimerRunning) {
              finalUpdates.timerStartedAt = admin.firestore.FieldValue.serverTimestamp();
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
            
            if (gameData.isTimerRunning === true && gameData.periodTimeRemainingSeconds !== undefined && gameData.timerStartedAt) {
                 const serverStopTime = Date.now();
                 const serverStartTime = (gameData.timerStartedAt as admin.firestore.Timestamp).toMillis();
                 const elapsedSeconds = Math.max(0, Math.floor((serverStopTime - serverStartTime) / 1000));
                 
                 onCourtIds.forEach(pId => {
                    finalUpdates[`playerStats.${pId}.timePlayedSeconds`] = admin.firestore.FieldValue.increment(elapsedSeconds);
                 });
                 finalUpdates.periodTimeRemainingSeconds = (gameData.periodTimeRemainingSeconds || 0) - elapsedSeconds;
            } else if (gameData.isTimerRunning === false && gameData.periodTimeRemainingSeconds !== undefined) {
                 const timePlayedThisRun = totalPeriodDuration - gameData.periodTimeRemainingSeconds;
                 onCourtIds.forEach(pId => {
                     finalUpdates[`playerStats.${pId}.timePlayedSeconds`] = admin.firestore.FieldValue.increment(timePlayedThisRun);
                 });
            }
            
            const maxPeriods = gameFormat?.numPeriods || 4;

            finalUpdates.isTimerRunning = false;
            finalUpdates.timerStartedAt = null;
            finalUpdates.updatedAt = admin.firestore.FieldValue.serverTimestamp();
            finalUpdates.homeTeamOnCourtPlayerIds = [];
            finalUpdates.awayTeamOnCourtPlayerIds = [];
            
            if (currentPeriod < maxPeriods) {
                finalUpdates.currentPeriod = currentPeriod + 1;
                finalUpdates.periodTimeRemainingSeconds = totalPeriodDuration;
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
            const gameFormatDoc = gameData.gameFormatId ? await adminDb.collection('gameFormats').doc(gameData.gameFormatId).get() : null;
            if(!gameFormatDoc || !gameFormatDoc.exists) throw new Error("Game format not found for substitution logic.");
            
            const requiredPlayers = gameFormatDoc.data()?.name?.includes('3v3') ? 3 : 5;
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
- src/lib/actions/players.ts:
```ts
'use server';

import { revalidatePath } from 'next/cache';
import { adminDb } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import type { PlayerFormData, Player } from '@/types';

export async function createPlayer(
  formData: PlayerFormData,
  teamId: string,
  clubId: string,
  userId: string
): Promise<{ success: boolean; error?: string; id?: string }> {
  if (!userId) {
    return { success: false, error: 'User not authenticated.' };
  }
  if (!teamId || !clubId) {
    return { success: false, error: 'Team ID or Club ID is missing.' };
  }
  if (!formData.firstName || !formData.lastName) {
    return { success: false, error: 'First name and last name are required.' };
  }

  if (!adminDb) {
    const errorMessage = 'Firebase Admin SDK is not initialized. Player creation cannot proceed.';
    console.error('PlayerActions (createPlayer):', errorMessage);
    return { success: false, error: errorMessage };
  }

  try {
    const newPlayerData = {
      ...formData,
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      teamId: teamId,
      jerseyNumber: formData.jerseyNumber ? Number(formData.jerseyNumber) : null,
      position: formData.position || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: userId,
    };

    const docRef = await adminDb.collection('players').add(newPlayerData);
    
    revalidatePath(`/clubs/${clubId}/teams/${teamId}`);

    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error('Error creating player:', error);
    return { success: false, error: error.message || 'Failed to create player.' };
  }
}


export async function updatePlayer(
  playerId: string,
  formData: PlayerFormData,
  clubId: string,
  teamId: string,
): Promise<{ success: boolean; error?: string }> {
   if (!playerId) {
    return { success: false, error: "Player ID is required." };
  }
  if (!adminDb) {
    return { success: false, error: "Database not initialized."};
  }
  try {
    const playerRef = adminDb.collection("players").doc(playerId);
    
    const updateData = {
      ...formData,
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      jerseyNumber: formData.jerseyNumber ? Number(formData.jerseyNumber) : null,
      position: formData.position || null,
    };
    
    await playerRef.update(updateData);

    revalidatePath(`/clubs/${clubId}/teams/${teamId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Error updating player:", error);
    return { success: false, error: error.message || "Failed to update player." };
  }
}

export async function deletePlayer(playerId: string, clubId: string, teamId: string): Promise<{ success: boolean; error?: string }> {
  if (!playerId) {
    return { success: false, error: "Player ID is required." };
  }
  if (!adminDb) {
    return { success: false, error: "Database not initialized."};
  }
  try {
    const playerRef = adminDb.collection("players").doc(playerId);
    await playerRef.delete();
    revalidatePath(`/clubs/${clubId}/teams/${teamId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting player:", error);
    return { success: false, error: error.message || "Failed to delete player." };
  }
}

export async function getPlayersByTeamId(teamId: string): Promise<Player[]> {
  if (!adminDb) {
    console.warn('PlayerActions (getPlayersByTeamId): Admin SDK not available. Returning empty array.');
    return [];
  }
  if (!teamId) {
    console.warn('PlayerActions (getPlayersByTeamId): teamId is required.');
    return [];
  }

  try {
    const playersCollectionRef = adminDb.collection('players');
    const q = playersCollectionRef.where('teamId', '==', teamId);
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
      return [];
    }
    
    const players = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt ? (data.createdAt as admin.firestore.Timestamp).toDate().toISOString() : undefined,
      } as Player;
    });

    players.sort((a, b) => (a.lastName || '').localeCompare(b.lastName || '') || (a.firstName || '').localeCompare(b.firstName || ''));
    
    return players;
  } catch (error: any) {
    console.error(`PlayerActions: Error fetching players for team ${teamId}:`, error.message, error.stack);
    return [];
  }
}

export async function getPlayersByClub(clubId: string): Promise<Player[]> {
    if (!adminDb) return [];
    if (!clubId) return [];

    const teamsRef = adminDb.collection('teams');
    const teamsQuery = teamsRef.where('clubId', '==', clubId);
    const teamsSnap = await teamsQuery.get();
    if (teamsSnap.empty) return [];

    const teamIds = teamsSnap.docs.map(doc => doc.id);
    if (teamIds.length === 0) return [];

    const playerChunks: Promise<admin.firestore.QuerySnapshot<admin.firestore.DocumentData>>[] = [];
    for (let i = 0; i < teamIds.length; i += 30) {
        const chunk = teamIds.slice(i, i + 30);
        const playersRef = adminDb.collection('players');
        const playersQuery = playersRef.where('teamId', 'in', chunk);
        playerChunks.push(playersQuery.get());
    }
    
    const allPlayersSnapshots = await Promise.all(playerChunks);
    const players: Player[] = [];
    
    allPlayersSnapshots.forEach(snapshot => {
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            players.push({
                id: doc.id,
                ...data,
                createdAt: data.createdAt ? (data.createdAt as admin.firestore.Timestamp).toDate().toISOString() : undefined,
            } as Player);
        });
    });

    players.sort((a, b) => (a.lastName || '').localeCompare(b.lastName || '') || (a.firstName || '').localeCompare(b.firstName || ''));
    
    return players;
}

export async function getPlayersFromIds(playerIds: string[]): Promise<Player[]> {
    if (!adminDb || playerIds.length === 0) return [];

    try {
        const playerChunks: Promise<admin.firestore.QuerySnapshot<admin.firestore.DocumentData>>[] = [];
        for (let i = 0; i < playerIds.length; i += 30) {
            const chunk = playerIds.slice(i, i + 30);
            const playersRef = adminDb.collection('players');
            const playersQuery = playersRef.where(admin.firestore.FieldPath.documentId(), 'in', chunk);
            playerChunks.push(playersQuery.get());
        }

        const allPlayersSnapshots = await Promise.all(playerChunks);
        const players: Player[] = [];
        
        allPlayersSnapshots.forEach(snapshot => {
            snapshot.docs.forEach(doc => {
                const data = doc.data();
                players.push({
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt ? (data.createdAt as admin.firestore.Timestamp).toDate().toISOString() : undefined,
                } as Player);
            });
        });

        return players;
    } catch (error: any) {
        console.error("Error fetching players by IDs:", error);
        return [];
    }
}
```
- src/lib/actions/seasons.ts:
```ts
'use server';
import { adminDb } from '@/lib/firebase/admin';
import type { Season, SeasonFormData } from '@/types';
import { revalidatePath } from 'next/cache';
import admin from 'firebase-admin';

export async function getSeasons(): Promise<Season[]> {
    if (!adminDb) return [];
    try {
        const seasonsRef = adminDb.collection('seasons');
        const snapshot = await seasonsRef.orderBy('name', 'desc').get();
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt ? (data.createdAt as admin.firestore.Timestamp).toDate().toISOString() : undefined,
                updatedAt: data.updatedAt ? (data.updatedAt as admin.firestore.Timestamp).toDate().toISOString() : undefined,
            } as Season;
        });
    } catch (error) {
        console.error("Error fetching seasons: ", error);
        return [];
    }
}

export async function getSeasonById(seasonId: string): Promise<Season | null> {
    if (!adminDb) return null;
    try {
        const seasonRef = adminDb.collection('seasons').doc(seasonId);
        const docSnap = await seasonRef.get();
        if (!docSnap.exists) {
            console.warn(`Could not find season with ID: ${seasonId}`);
            return null;
        }
        const data = docSnap.data()!;
        return {
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt ? (data.createdAt as admin.firestore.Timestamp).toDate().toISOString() : undefined,
            updatedAt: data.updatedAt ? (data.updatedAt as admin.firestore.Timestamp).toDate().toISOString() : undefined,
        } as Season;
    } catch (error: any) {
        console.error(`Error fetching season by ID ${seasonId}:`, error);
        return null;
    }
}

export async function createSeason(formData: SeasonFormData, userId: string): Promise<{ success: boolean; error?: string }> {
    if (!adminDb) return { success: false, error: 'Database not initialized' };
    if (!userId) return { success: false, error: 'User not authenticated' };
    
    try {
        const newSeason = {
            ...formData,
            createdBy: userId,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        await adminDb.collection('seasons').add(newSeason);
        revalidatePath('/seasons');
        return { success: true };
    } catch (error: any) {
        console.error("Error creating season:", error);
        return { success: false, error: error.message };
    }
}

export async function updateSeason(
    seasonId: string,
    formData: SeasonFormData,
    userId: string
): Promise<{ success: boolean; error?: string }> {
    if (!adminDb) return { success: false, error: 'Database not initialized' };
    if (!userId) return { success: false, error: 'User not authenticated' };
    
    try {
        const seasonRef = adminDb.collection('seasons').doc(seasonId);
        const updateData = {
            ...formData,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedBy: userId,
        };
        await seasonRef.update(updateData);
        
        revalidatePath('/seasons');
        revalidatePath(`/seasons/${seasonId}/edit`);

        return { success: true };
    } catch (error: any) {
        console.error("Error updating season:", error);
        return { success: false, error: error.message };
    }
}
```
- src/lib/actions/teams.ts:
```ts
'use server';

import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/firebase/admin";
import admin from "firebase-admin";
import type { TeamFormData, Team } from "@/types";

export async function createTeam(
  formData: TeamFormData,
  clubId: string,
  userId: string
): Promise<{ success: boolean; error?: string; id?: string }> {
  if (!userId) {
    return { success: false, error: "User not authenticated." };
  }
  if (!clubId) {
    return { success: false, error: "Club ID is missing." };
  }
  if (!formData.name || formData.name.trim() === "") {
    return { success: false, error: "Team name cannot be empty." };
  }

  if (!adminDb) {
    const errorMessage = "Firebase Admin SDK is not initialized. Team creation cannot proceed.";
    console.error("TeamActions (createTeam):", errorMessage);
    return { success: false, error: errorMessage };
  }

  try {
    const newTeamData: Omit<Team, "id" | "createdAt" | "updatedAt"> & { createdAt: any, updatedAt: any } = {
      name: formData.name.trim(),
      clubId: clubId,
      gameFormatId: formData.gameFormatId || null,
      competitionCategoryId: formData.competitionCategoryId || null,
      coachIds: formData.coachIds || [],
      coordinatorIds: formData.coordinatorIds || [],
      playerIds: [],
      logoUrl: null,
      city: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdByUserId: userId,
    };

    const docRef = await adminDb.collection("teams").add(newTeamData);
    
    revalidatePath(`/clubs/${clubId}`);
    revalidatePath(`/clubs/${clubId}/teams/new`);
    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error("Error creating team:", error);
    return { success: false, error: error.message || "Failed to create team." };
  }
}

export async function updateTeam(
  teamId: string,
  formData: TeamFormData,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  if (!userId) {
    return { success: false, error: "User not authenticated." };
  }
  if (!teamId) {
    return { success: false, error: "Team ID is missing." };
  }

  if (!adminDb) {
    return { success: false, error: "Database not initialized." };
  }

  try {
    const teamRef = adminDb.collection("teams").doc(teamId);
    // TODO: Add permission check here if needed
    
    const updateData = {
      name: formData.name.trim(),
      competitionCategoryId: formData.competitionCategoryId || null,
      gameFormatId: formData.gameFormatId || null,
      coachIds: formData.coachIds || [],
      coordinatorIds: formData.coordinatorIds || [],
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await teamRef.update(updateData);
    
    const teamSnap = await teamRef.get();
    const clubId = teamSnap.data()?.clubId;

    if (clubId) {
      revalidatePath(`/clubs/${clubId}`);
      revalidatePath(`/clubs/${clubId}/teams/${teamId}`);
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error updating team:", error);
    return { success: false, error: error.message || "Failed to update team." };
  }
}

export async function getTeamsByClubId(clubId: string): Promise<Team[]> {
  console.log(`TeamActions: Attempting to fetch teams for clubId: ${clubId}`);
  if (!adminDb) {
    console.warn("TeamActions (getTeamsByClubId): Admin SDK not available. Returning empty array.");
    return [];
  }
  if (!clubId) {
    console.warn("TeamActions (getTeamsByClubId): clubId is required.");
    return [];
  }

  try {
    const teamsCollectionRef = adminDb.collection('teams');
    const q = teamsCollectionRef.where('clubId', '==', clubId);
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
      console.log(`TeamActions: No teams found for clubId: ${clubId}`);
      return [];
    }
    
    console.log(`TeamActions: Found ${querySnapshot.docs.length} teams for clubId: ${clubId}.`);
    
    const teams = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt ? (data.createdAt as admin.firestore.Timestamp).toDate().toISOString() : undefined,
        updatedAt: data.updatedAt ? (data.updatedAt as admin.firestore.Timestamp).toDate().toISOString() : undefined,
      } as Team;
    });

    teams.sort((a, b) => new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime());
    
    return teams;
  } catch (error: any) {
    console.error(`TeamActions: Error fetching teams for club ${clubId}:`, error.message, error.stack);
     if (error.code === 'failed-precondition') {
        console.error("TeamActions: Firestore query for teams failed. This could be a missing index for 'clubId'.");
    }
    return [];
  }
}

export async function getTeamById(teamId: string): Promise<Team | null> {
  console.log(`TeamActions: Attempting to fetch team by ID: ${teamId}`);
  if (!adminDb) {
    console.warn("TeamActions (getTeamById): Admin SDK not available. Returning null.");
    return null;
  }
  if (!teamId) {
    console.warn("TeamActions (getTeamById): teamId is required.");
    return null;
  }

  try {
    const teamDocRef = adminDb.collection('teams').doc(teamId);
    const docSnap = await teamDocRef.get();

    if (!docSnap.exists) {
      console.warn(`TeamActions: No team found with ID: ${teamId}`);
      return null;
    }
    
    const data = docSnap.data()!;
    console.log(`TeamActions: Found team: ${data.name}`);
    
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt ? (data.createdAt as admin.firestore.Timestamp).toDate().toISOString() : undefined,
      updatedAt: data.updatedAt ? (data.updatedAt as admin.firestore.Timestamp).toDate().toISOString() : undefined,
    } as Team;
  } catch (error: any) {
    console.error(`TeamActions: Error fetching team by ID ${teamId}:`, error.message, error.stack);
    return null;
  }
}

export async function getAllTeams(): Promise<Team[]> {
    if (!adminDb) return [];
    try {
        const teamsRef = adminDb.collection('teams');
        const querySnapshot = await teamsRef.orderBy('name', 'asc').get();
        const teams = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt ? (data.createdAt as admin.firestore.Timestamp).toDate().toISOString() : undefined,
                updatedAt: data.updatedAt ? (data.updatedAt as admin.firestore.Timestamp).toDate().toISOString() : undefined,
            } as Team;
        });
        return teams;
    } catch (e: any) {
        if (e.code === 'failed-precondition') {
            console.error("Firestore error: Missing index for teams collection on 'name' field.");
        }
        return [];
    }
}

export async function getTeamsByCoach(userId: string): Promise<Team[]> {
    if (!adminDb) return [];
    try {
        const teamsRef = adminDb.collection('teams');
        const querySnapshot = await teamsRef.where('coachIds', 'array-contains', userId).get();
        return querySnapshot.docs.map(doc => {
            const data = doc.data();
             return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt ? (data.createdAt as admin.firestore.Timestamp).toDate().toISOString() : undefined,
                updatedAt: data.updatedAt ? (data.updatedAt as admin.firestore.Timestamp).toDate().toISOString() : undefined,
            } as Team;
        });
    } catch (e: any) {
        console.error("Error getting teams by coach:", e);
        return [];
    }
}
```
- src/lib/actions/tasks.ts:
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
- src/lib/actions/clubs.ts:
```ts
'use server';

import type { Club, ClubFormData } from '@/types';
import { adminDb } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { revalidatePath } from 'next/cache';

// This function will be used by the registration form to populate the clubs dropdown.
// It fetches all clubs to ensure new users can register.
export async function getApprovedClubs(): Promise<Club[]> {
  console.log("ClubActions: Attempting to fetch all clubs from Firestore using Admin SDK.");
  if (!adminDb) {
    console.warn("ClubActions (getApprovedClubs): Admin SDK not available. Returning empty array.");
    return [];
  }
  try {
    const clubsCollectionRef = adminDb.collection('clubs');
    // Query for all clubs and order them alphabetically by name
    const q = clubsCollectionRef.orderBy('name', 'asc');
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
      console.warn("ClubActions: No clubs found in 'clubs' collection. An index on 'name' (asc) may be required.");
      return [];
    }
    
    console.log(`ClubActions: Found ${querySnapshot.docs.length} clubs.`);
    
    const allClubs = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || `Unnamed Club (ID: ${doc.id})`,
        shortName: data.shortName,
        province_name: data.province_name,
        city_name: data.city_name,
        logoUrl: data.logoUrl,
        approved: data.approved,
        createdAt: data.createdAt ? (data.createdAt as admin.firestore.Timestamp).toDate().toISOString() : undefined,
      } as Club; 
    });
    
    console.log("ClubActions: Successfully fetched and sorted all clubs using Admin SDK.");
    return allClubs;
  } catch (error: any) {
    console.error('ClubActions: Error fetching clubs with Admin SDK:', error.message, error.stack);
    if (error.code === 'failed-precondition' && error.message.includes("index")) {
        console.error("ClubActions: Firestore query failed. This is likely due to a missing Firestore index. Please create an index on the 'name' field (ascending) for the 'clubs' collection.");
    }
    return []; // Return empty array on error
  }
}

// Action to create a new club (likely for an admin)
export async function createClub(
  formData: ClubFormData,
  userId: string
): Promise<{ success: boolean; error?: string; id?: string }> {
  if (!userId) {
    return { success: false, error: 'User not authenticated.' };
  }
  // In a real app, you would also check if the user has permission (e.g., is a super_admin)
  if (!adminDb) {
    return { success: false, error: 'Firebase Admin SDK not initialized.' };
  }
  try {
    const newClubData = {
      ...formData,
      approved: false, // New clubs should require approval
      createdBy: userId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await adminDb.collection('clubs').add(newClubData);
    revalidatePath('/clubs'); // Revalidate admin clubs page if it exists
    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error('Error creating club:', error);
    return { success: false, error: error.message || 'Failed to create club.' };
  }
}

// New action to update club approval status
export async function updateClubStatus(
  clubId: string,
  approved: boolean
): Promise<{ success: boolean; error?: string }> {
  console.log(`ClubActions: Attempting to update approved status for club ID: ${clubId} to '${approved}'.`);
  if (!clubId) {
    return { success: false, error: 'Club ID is required.' };
  }

  if (!adminDb) {
    console.error("ClubActions: Firebase Admin SDK is not initialized.");
    return { success: false, error: 'Server configuration error.' };
  }

  try {
    const clubRef = adminDb.collection('clubs').doc(clubId);
    await clubRef.update({
      approved: approved
    });
    console.log(`ClubActions: Successfully updated approved status for club ID: ${clubId} to '${approved}'.`);
    revalidatePath('/clubs'); // Revalidate the admin page
    revalidatePath(`/clubs/${clubId}`); // Revalidate the detail page
    return { success: true };
  } catch (error: any) {
    console.error(`ClubActions: Error updating status for club ID ${clubId}:`, error.message, error.stack);
    return { success: false, error: error.message || 'Failed to update club status.' };
  }
}

export async function getClubById(clubId: string): Promise<Club | null> {
    if (!adminDb) {
      console.error("ClubActions (getClubById): Admin SDK not initialized.");
      return null;
    }
    if (!clubId) {
      return null;
    }
    try {
        const clubDocRef = adminDb.collection('clubs').doc(clubId);
        const docSnap = await clubDocRef.get();

        if (!docSnap.exists) {
            console.warn(`ClubActions: No club found with ID: ${clubId}`);
            return null;
        }

        const data = docSnap.data()!;
        return {
            id: docSnap.id,
            name: data.name || `Unnamed Club (ID: ${docSnap.id})`,
            shortName: data.shortName,
            province_name: data.province_name,
            city_name: data.city_name,
            logoUrl: data.logoUrl,
            approved: data.approved,
            createdAt: data.createdAt ? (data.createdAt as admin.firestore.Timestamp).toDate().toISOString() : undefined,
        } as Club;

    } catch (error: any) {
        console.error(`ClubActions: Error fetching club by ID ${clubId}:`, error.message, error.stack);
        return null;
    }
}
```
- src/lib/actions/competition-categories.ts:
```ts
'use server';

import type { CompetitionCategory, CompetitionCategoryFormData } from '@/types';
import { adminDb } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { revalidatePath } from 'next/cache';

export async function getCompetitionCategories(): Promise<CompetitionCategory[]> {
  console.log("CompetitionCategoryActions: Attempting to fetch competition categories from Firestore using Admin SDK.");
  if (!adminDb) {
    console.warn("CompetitionCategoryActions (getCompetitionCategories): Admin SDK not available. Returning empty array.");
    return [];
  }
  try {
    const categoriesCollectionRef = adminDb.collection('competitionCategories');
    const querySnapshot = await categoriesCollectionRef.get();

    if (querySnapshot.empty) {
      console.warn("CompetitionCategoryActions: No documents found in 'competitionCategories' collection.");
      return [];
    }
    
    console.log(`CompetitionCategoryActions: Found ${querySnapshot.docs.length} documents in 'competitionCategories' collection.`);
    
    const allCategories = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || `Unnamed Category (ID: ${doc.id})`,
        description: data.description,
        level: data.level,
        gameFormatId: data.gameFormatId,
        createdAt: data.createdAt ? (data.createdAt as admin.firestore.Timestamp).toDate().toISOString() : undefined,
        updatedAt: data.updatedAt ? (data.updatedAt as admin.firestore.Timestamp).toDate().toISOString() : undefined,
      } as CompetitionCategory; 
    });
    
    allCategories.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    console.log("CompetitionCategoryActions: Successfully fetched and sorted categories using Admin SDK.");
    return allCategories;
  } catch (error: any) {
    console.error('CompetitionCategoryActions: Error fetching competition categories with Admin SDK:', error.message, error.stack);
    return [];
  }
}

export async function createCompetitionCategory(
  formData: CompetitionCategoryFormData,
  userId: string
): Promise<{ success: boolean; error?: string; id?: string }> {
  if (!userId) {
    return { success: false, error: 'User not authenticated.' };
  }
  if (!adminDb) {
    return { success: false, error: 'Database not initialized.' };
  }
  try {
    const newCategoryData = {
      ...formData,
      level: Number(formData.level) || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: userId,
    };

    const docRef = await adminDb.collection('competitionCategories').add(newCategoryData);
    revalidatePath('/admin/competition-categories');
    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error('Error creating competition category:', error);
    return { success: false, error: error.message || 'Failed to create category.' };
  }
}

export async function updateCompetitionCategory(
    categoryId: string,
    formData: CompetitionCategoryFormData,
    userId: string
): Promise<{ success: boolean; error?: string }> {
    if (!userId) return { success: false, error: 'User not authenticated.' };
    if (!adminDb) return { success: false, error: 'Database not initialized.' };
    
    try {
        const categoryRef = adminDb.collection('competitionCategories').doc(categoryId);
        const updateData = {
            ...formData,
            level: Number(formData.level) || null,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        await categoryRef.update(updateData);
        revalidatePath('/admin/competition-categories');
        return { success: true };
    } catch (error: any) {
        console.error(`Error updating category ${categoryId}:`, error);
        return { success: false, error: error.message || 'Failed to update category.' };
    }
}

export async function deleteCompetitionCategory(categoryId: string): Promise<{ success: boolean; error?: string }> {
    if (!adminDb) return { success: false, error: 'Database not initialized.' };
    try {
        await adminDb.collection('competitionCategories').doc(categoryId).delete();
        revalidatePath('/admin/competition-categories');
        return { success: true };
    } catch (error: any) {
        console.error(`Error deleting category ${categoryId}:`, error);
        return { success: false, error: error.message || 'Failed to delete category.' };
    }
}

```
- src/lib/actions/game-formats.ts:
```ts
'use server';

import type { GameFormat, GameFormatFormData } from '@/types';
import { adminDb } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { revalidatePath } from 'next/cache';

export async function getGameFormats(): Promise<GameFormat[]> {
  console.log("GameFormatActions: Attempting to fetch game formats from Firestore using Admin SDK.");
  if (!adminDb) {
    console.warn("GameFormatActions (getGameFormats): Admin SDK not available. Returning empty array.");
    return [];
  }
  try {
    const gameFormatsCollectionRef = adminDb.collection('gameFormats');
    const querySnapshot = await gameFormatsCollectionRef.get();

    if (querySnapshot.empty) {
      console.warn("GameFormatActions: No documents found in 'gameFormats' collection.");
      return [];
    }
    
    console.log(`GameFormatActions: Found ${querySnapshot.docs.length} documents in 'gameFormats' collection.`);
    
    const allGameFormats = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || `Unnamed Format (ID: ${doc.id})`,
        description: data.description,
        numPeriods: data.numPeriods,
        periodDurationMinutes: data.periodDurationMinutes,
        defaultTotalTimeouts: data.defaultTotalTimeouts,
        minPeriodsPlayerMustPlay: data.minPeriodsPlayerMustPlay,
        createdAt: data.createdAt ? (data.createdAt as admin.firestore.Timestamp).toDate().toISOString() : undefined,
      } as GameFormat; 
    });
    
    allGameFormats.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    
    console.log("GameFormatActions: Successfully fetched and sorted game formats using Admin SDK.");
    return allGameFormats;
  } catch (error: any) {
    console.error('GameFormatActions: Error fetching game formats with Admin SDK:', error.message, error.stack);
    return [];
  }
}

export async function getGameFormatById(formatId: string): Promise<GameFormat | null> {
    if (!adminDb) return null;
    try {
        const docRef = adminDb.collection('gameFormats').doc(formatId);
        const docSnap = await docRef.get();
        if (!docSnap.exists) {
            return null;
        }
        const data = docSnap.data() as Omit<GameFormat, 'id' | 'createdAt'> & { createdAt: admin.firestore.Timestamp };
        return { 
            id: docSnap.id, 
            ...data,
            createdAt: data.createdAt ? (data.createdAt as admin.firestore.Timestamp).toDate().toISOString() : undefined,
        } as GameFormat;
    } catch (error) {
        console.error(`Error getting game format by id ${formatId}:`, error);
        return null;
    }
}


export async function createGameFormat(
  formData: GameFormatFormData,
  userId: string
): Promise<{ success: boolean; error?: string; id?: string }> {
  if (!userId) {
    return { success: false, error: 'User not authenticated.' };
  }
  if (!adminDb) {
    return { success: false, error: 'Database not initialized.' };
  }
  try {
    const newFormatData = {
      ...formData,
      numPeriods: Number(formData.numPeriods) || null,
      periodDurationMinutes: Number(formData.periodDurationMinutes) || null,
      defaultTotalTimeouts: Number(formData.defaultTotalTimeouts) || null,
      minPeriodsPlayerMustPlay: Number(formData.minPeriodsPlayerMustPlay) || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: userId,
    };

    const docRef = await adminDb.collection('gameFormats').add(newFormatData);
    revalidatePath('/admin/game-formats');
    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error('Error creating game format:', error);
    return { success: false, error: error.message || 'Failed to create format.' };
  }
}

export async function updateGameFormat(
    formatId: string,
    formData: GameFormatFormData,
    userId: string
): Promise<{ success: boolean; error?: string }> {
    if (!userId) return { success: false, error: 'User not authenticated.' };
    if (!adminDb) return { success: false, error: 'Database not initialized.' };
    
    try {
        const formatRef = adminDb.collection('gameFormats').doc(formatId);
        const updateData = {
            ...formData,
            numPeriods: Number(formData.numPeriods) || null,
            periodDurationMinutes: Number(formData.periodDurationMinutes) || null,
            defaultTotalTimeouts: Number(formData.defaultTotalTimeouts) || null,
            minPeriodsPlayerMustPlay: Number(formData.minPeriodsPlayerMustPlay) || null,
        };
        await formatRef.update(updateData);
        revalidatePath('/admin/game-formats');
        return { success: true };
    } catch (error: any) {
        console.error(`Error updating format ${formatId}:`, error);
        return { success: false, error: error.message || 'Failed to update format.' };
    }
}

export async function deleteGameFormat(formatId: string): Promise<{ success: boolean; error?: string }> {
    if (!adminDb) return { success: false, error: 'Database not initialized.' };
    try {
        await adminDb.collection('gameFormats').doc(formatId).delete();
        revalidatePath('/admin/game-formats');
        return { success: true };
    } catch (error: any) {
        console.error(`Error deleting format ${formatId}:`, error);
        return { success: false, error: error.message || 'Failed to delete format.' };
    }
}
```
- src/lib/actions/seasons.ts:
```ts
'use server';
import { adminDb } from '@/lib/firebase/admin';
import type { Season, SeasonFormData } from '@/types';
import { revalidatePath } from 'next/cache';
import admin from 'firebase-admin';

export async function getSeasons(): Promise<Season[]> {
    if (!adminDb) return [];
    try {
        const seasonsRef = adminDb.collection('seasons');
        const snapshot = await seasonsRef.orderBy('name', 'desc').get();
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt ? (data.createdAt as admin.firestore.Timestamp).toDate().toISOString() : undefined,
                updatedAt: data.updatedAt ? (data.updatedAt as admin.firestore.Timestamp).toDate().toISOString() : undefined,
            } as Season;
        });
    } catch (error) {
        console.error("Error fetching seasons: ", error);
        return [];
    }
}

export async function getSeasonById(seasonId: string): Promise<Season | null> {
    if (!adminDb) return null;
    try {
        const seasonRef = adminDb.collection('seasons').doc(seasonId);
        const docSnap = await seasonRef.get();
        if (!docSnap.exists) {
            console.warn(`Could not find season with ID: ${seasonId}`);
            return null;
        }
        const data = docSnap.data()!;
        return {
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt ? (data.createdAt as admin.firestore.Timestamp).toDate().toISOString() : undefined,
            updatedAt: data.updatedAt ? (data.updatedAt as admin.firestore.Timestamp).toDate().toISOString() : undefined,
        } as Season;
    } catch (error: any) {
        console.error(`Error fetching season by ID ${seasonId}:`, error);
        return null;
    }
}

export async function createSeason(formData: SeasonFormData, userId: string): Promise<{ success: boolean; error?: string }> {
    if (!adminDb) return { success: false, error: 'Database not initialized' };
    if (!userId) return { success: false, error: 'User not authenticated' };
    
    try {
        const newSeason = {
            ...formData,
            createdBy: userId,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        await adminDb.collection('seasons').add(newSeason);
        revalidatePath('/seasons');
        return { success: true };
    } catch (error: any) {
        console.error("Error creating season:", error);
        return { success: false, error: error.message };
    }
}

export async function updateSeason(
    seasonId: string,
    formData: SeasonFormData,
    userId: string
): Promise<{ success: boolean; error?: string }> {
    if (!adminDb) return { success: false, error: 'Database not initialized' };
    if (!userId) return { success: false, error: 'User not authenticated' };
    
    try {
        const seasonRef = adminDb.collection('seasons').doc(seasonId);
        const updateData = {
            ...formData,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedBy: userId,
        };
        await seasonRef.update(updateData);
        
        revalidatePath('/seasons');
        revalidatePath(`/seasons/${seasonId}/edit`);

        return { success: true };
    } catch (error: any) {
        console.error("Error updating season:", error);
        return { success: false, error: error.message };
    }
}
```
- src/lib/actions/teams.ts:
```ts
'use server';

import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/firebase/admin";
import admin from "firebase-admin";
import type { TeamFormData, Team } from "@/types";

export async function createTeam(
  formData: TeamFormData,
  clubId: string,
  userId: string
): Promise<{ success: boolean; error?: string; id?: string }> {
  if (!userId) {
    return { success: false, error: "User not authenticated." };
  }
  if (!clubId) {
    return { success: false, error: "Club ID is missing." };
  }
  if (!formData.name || formData.name.trim() === "") {
    return { success: false, error: "Team name cannot be empty." };
  }

  if (!adminDb) {
    const errorMessage = "Firebase Admin SDK is not initialized. Team creation cannot proceed.";
    console.error("TeamActions (createTeam):", errorMessage);
    return { success: false, error: errorMessage };
  }

  try {
    const newTeamData: Omit<Team, "id" | "createdAt" | "updatedAt"> & { createdAt: any, updatedAt: any } = {
      name: formData.name.trim(),
      clubId: clubId,
      gameFormatId: formData.gameFormatId || null,
      competitionCategoryId: formData.competitionCategoryId || null,
      coachIds: formData.coachIds || [],
      coordinatorIds: formData.coordinatorIds || [],
      playerIds: [],
      logoUrl: null,
      city: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdByUserId: userId,
    };

    const docRef = await adminDb.collection("teams").add(newTeamData);
    
    revalidatePath(`/clubs/${clubId}`);
    revalidatePath(`/clubs/${clubId}/teams/new`);
    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error("Error creating team:", error);
    return { success: false, error: error.message || "Failed to create team." };
  }
}

export async function updateTeam(
  teamId: string,
  formData: TeamFormData,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  if (!userId) {
    return { success: false, error: "User not authenticated." };
  }
  if (!teamId) {
    return { success: false, error: "Team ID is missing." };
  }

  if (!adminDb) {
    return { success: false, error: "Database not initialized." };
  }

  try {
    const teamRef = adminDb.collection("teams").doc(teamId);
    // TODO: Add permission check here if needed
    
    const updateData = {
      name: formData.name.trim(),
      competitionCategoryId: formData.competitionCategoryId || null,
      gameFormatId: formData.gameFormatId || null,
      coachIds: formData.coachIds || [],
      coordinatorIds: formData.coordinatorIds || [],
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await teamRef.update(updateData);
    
    const teamSnap = await teamRef.get();
    const clubId = teamSnap.data()?.clubId;

    if (clubId) {
      revalidatePath(`/clubs/${clubId}`);
      revalidatePath(`/clubs/${clubId}/teams/${teamId}`);
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error updating team:", error);
    return { success: false, error: error.message || "Failed to update team." };
  }
}

export async function getTeamsByClubId(clubId: string): Promise<Team[]> {
  console.log(`TeamActions: Attempting to fetch teams for clubId: ${clubId}`);
  if (!adminDb) {
    console.warn("TeamActions (getTeamsByClubId): Admin SDK not available. Returning empty array.");
    return [];
  }
  if (!clubId) {
    console.warn("TeamActions (getTeamsByClubId): clubId is required.");
    return [];
  }

  try {
    const teamsCollectionRef = adminDb.collection('teams');
    const q = teamsCollectionRef.where('clubId', '==', clubId);
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
      console.log(`TeamActions: No teams found for clubId: ${clubId}`);
      return [];
    }
    
    console.log(`TeamActions: Found ${querySnapshot.docs.length} teams for clubId: ${clubId}.`);
    
    const teams = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt ? (data.createdAt as admin.firestore.Timestamp).toDate().toISOString() : undefined,
        updatedAt: data.updatedAt ? (data.updatedAt as admin.firestore.Timestamp).toDate().toISOString() : undefined,
      } as Team;
    });

    teams.sort((a, b) => new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime());
    
    return teams;
  } catch (error: any) {
    console.error(`TeamActions: Error fetching teams for club ${clubId}:`, error.message, error.stack);
     if (error.code === 'failed-precondition') {
        console.error("TeamActions: Firestore query for teams failed. This could be a missing index for 'clubId'.");
    }
    return [];
  }
}

export async function getTeamById(teamId: string): Promise<Team | null> {
  console.log(`TeamActions: Attempting to fetch team by ID: ${teamId}`);
  if (!adminDb) {
    console.warn("TeamActions (getTeamById): Admin SDK not available. Returning null.");
    return null;
  }
  if (!teamId) {
    console.warn("TeamActions (getTeamById): teamId is required.");
    return null;
  }

  try {
    const teamDocRef = adminDb.collection('teams').doc(teamId);
    const docSnap = await teamDocRef.get();

    if (!docSnap.exists) {
      console.warn(`TeamActions: No team found with ID: ${teamId}`);
      return null;
    }
    
    const data = docSnap.data()!;
    console.log(`TeamActions: Found team: ${data.name}`);
    
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt ? (data.createdAt as admin.firestore.Timestamp).toDate().toISOString() : undefined,
      updatedAt: data.updatedAt ? (data.updatedAt as admin.firestore.Timestamp).toDate().toISOString() : undefined,
    } as Team;
  } catch (error: any) {
    console.error(`TeamActions: Error fetching team by ID ${teamId}:`, error.message, error.stack);
    return null;
  }
}

export async function getAllTeams(): Promise<Team[]> {
    if (!adminDb) return [];
    try {
        const teamsRef = adminDb.collection('teams');
        const querySnapshot = await teamsRef.orderBy('name', 'asc').get();
        const teams = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt ? (data.createdAt as admin.firestore.Timestamp).toDate().toISOString() : undefined,
                updatedAt: data.updatedAt ? (data.updatedAt as admin.firestore.Timestamp).toDate().toISOString() : undefined,
            } as Team;
        });
        return teams;
    } catch (e: any) {
        if (e.code === 'failed-precondition') {
            console.error("Firestore error: Missing index for teams collection on 'name' field.");
        }
        return [];
    }
}

export async function getTeamsByCoach(userId: string): Promise<Team[]> {
    if (!adminDb) return [];
    try {
        const teamsRef = adminDb.collection('teams');
        const querySnapshot = await teamsRef.where('coachIds', 'array-contains', userId).get();
        return querySnapshot.docs.map(doc => {
            const data = doc.data();
             return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt ? (data.createdAt as admin.firestore.Timestamp).toDate().toISOString() : undefined,
                updatedAt: data.updatedAt ? (data.updatedAt as admin.firestore.Timestamp).toDate().toISOString() : undefined,
            } as Team;
        });
    } catch (e: any) {
        console.error("Error getting teams by coach:", e);
        return [];
    }
}
```
- src/lib/actions/users/index.ts:
```ts
'use server';

import { v4 as uuidv4 } from 'uuid';
import { adminAuth, adminDb, adminInitError } from '@/lib/firebase/admin';
import type { UserFirestoreProfile, ProfileType, UserProfileStatus, Child } from '@/types';
import { revalidatePath } from 'next/cache';
import admin from 'firebase-admin';

export async function finalizeNewUserProfile(
  idToken: string,
  data: { displayName: string; profileType?: ProfileType; selectedClubId?: string | null; }
): Promise<{ success: boolean; error?: string }> {
  if (!adminAuth || !adminDb) {
    return { success: false, error: `Server configuration error: ${adminInitError || 'Unknown admin SDK error.'}` };
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    
    await adminAuth.updateUser(uid, { displayName: data.displayName });

    const userProfileRef = adminDb.collection('user_profiles').doc(uid);
    const doc = await userProfileRef.get();

    if (doc.exists) {
      // User profile exists, this is likely the completion of onboarding
      await userProfileRef.update({
        profileTypeId: data.profileType,
        clubId: data.selectedClubId,
        onboardingCompleted: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      // New user from email/password, create stub profile
      const profileToSave: Omit<UserFirestoreProfile, 'createdAt' | 'updatedAt' | 'id'> = {
          uid: uid,
          email: decodedToken.email,
          displayName: data.displayName,
          photoURL: decodedToken.picture || null,
          profileTypeId: null,
          clubId: null,
          status: 'pending_approval' as UserProfileStatus,
          isSeeded: false,
          onboardingCompleted: false,
      };
      await userProfileRef.set({
        ...profileToSave, 
        createdAt: admin.firestore.FieldValue.serverTimestamp(), 
        updatedAt: admin.firestore.FieldValue.serverTimestamp() 
      });
    }
    
    return { success: true };

  } catch (error: any) {
    console.error(`Error finalizing user profile for user: ${idToken.substring(0, 10)}...:`, error);
    return { success: false, error: `Failed to finalize profile on server: ${error.message}` };
  }
}

export async function updateUserChildren(userId: string, children: Child[]): Promise<{ success: boolean; error?: string }> {
    if (!adminDb) {
        return { success: false, error: 'La base de datos no está inicializada.' };
    }
    try {
        const profileRef = adminDb.collection('user_profiles').doc(userId);
        await profileRef.update({
            children: children,
            onboardingCompleted: true, // Mark onboarding as complete once children are added/updated
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        revalidatePath('/profile/my-children');
        return { success: true };
    } catch(err: any) {
        return { success: false, error: "No se pudo actualizar la información."};
    }
}


export async function getUserProfileById(uid: string): Promise<UserFirestoreProfile | null> {
  if (!adminDb) {
    console.error("UserActions (getProfile): Firebase Admin SDK not initialized. Error:", adminInitError);
    return null;
  }
  
  if (!uid) return null;

  try {
    const userProfileRef = adminDb.collection('user_profiles').doc(uid);
    const docSnap = await userProfileRef.get();

    if (docSnap.exists) {
      const data = docSnap.data() as any;
      
      const serializableProfile = {
        ...data,
        createdAt: data.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate()?.toISOString() || new Date().toISOString(),
      };

      return { uid: docSnap.id, ...serializableProfile } as UserFirestoreProfile;
    } else {
      console.warn(`UserActions: No profile found for UID: ${uid} using Admin SDK.`);
      return null;
    }
  } catch (error: any) {
    console.error(`UserActions: Error fetching user profile for UID ${uid} with Admin SDK:`, error.message, error.stack);
    return null;
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
      const data = doc.data();
      return {
        uid: doc.id,
        ...data,
        createdAt: (data.createdAt as admin.firestore.Timestamp).toDate().toISOString(),
        updatedAt: (data.updatedAt as admin.firestore.Timestamp).toDate().toISOString(),
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

export async function getAllScorers(): Promise<UserFirestoreProfile[]> {
  if (!adminDb) {
    return [];
  }
  try {
    const usersRef = adminDb.collection('user_profiles');
    const q = usersRef.where('profileTypeId', '==', 'scorer').where('status', '==', 'approved');
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
      return [];
    }
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        uid: doc.id,
        ...data,
        createdAt: (data.createdAt as admin.firestore.Timestamp).toDate().toISOString(),
        updatedAt: (data.updatedAt as admin.firestore.Timestamp).toDate().toISOString(),
      } as UserFirestoreProfile;
    });
  } catch (error: any) {
    console.error("Error fetching all scorers:", error);
    return [];
  }
}
```
- src/lib/actions/profile-types.ts:
```ts
'use server';

import type { ProfileTypeOption, ProfileType } from '@/types';
import { adminDb } from '@/lib/firebase/admin';

// Helper function to check if a string is a valid ProfileType defined in src/types/index.ts
// This function MUST be updated if the ProfileType enum in src/types/index.ts changes.
function isValidProfileType(id: string): id is ProfileType {
  const validTypes: ProfileType[] = [
    'club_admin', 
    'coach', 
    'coordinator', 
    'parent_guardian', 
    'player', 
    'scorer', 
    'super_admin', 
    'user',
    null
  ];
  return validTypes.includes(id as ProfileType);
}

export async function getProfileTypeOptions(): Promise<ProfileTypeOption[]> {
  console.log("ProfileTypeActions: Attempting to fetch profile types from Firestore collection 'profileTypes' using Admin SDK. Ordering by 'label' asc.");
  
  if (!adminDb) {
      console.error("ProfileTypeActions: Firebase Admin SDK is not initialized. Cannot fetch profile types.");
      return [];
  }
  
  try {
    const profileTypesCollectionRef = adminDb.collection('profileTypes');
    // Order by label for consistent dropdown order
    const q = profileTypesCollectionRef.orderBy('label', 'asc');
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
      console.warn("ProfileTypeActions: No documents found in 'profileTypes' collection. An index on 'label' (asc) for 'profileTypes' collection is also required for ordering.");
      return [];
    }
    
    console.log(`ProfileTypeActions: Found ${querySnapshot.docs.length} documents in 'profileTypes' collection.`);
    
    const allProfileTypes = querySnapshot.docs.map(doc => {
      const data = doc.data();
      // Use the Firestore document ID as the 'id' for the profile type
      const typeId = doc.id; 
      const typeLabel = data.label;
      
      if (!isValidProfileType(typeId)) {
        console.warn(`ProfileTypeActions: Document ID "${typeId}" is not a valid ProfileType as defined in src/types. Skipping. Data:`, data);
        return null; // Skip this invalid entry
      }

      if (typeof typeLabel !== 'string' || !typeLabel.trim()) {
         console.warn(`ProfileTypeActions: Document with ID "${typeId}" has missing or empty 'label' field. Using fallback. Data:`, data);
         // Provide a fallback label or skip, depending on desired behavior. Here, using a fallback.
         return { id: typeId as ProfileType, label: `Unnamed Type (ID: ${typeId})` };
      }

      return {
        id: typeId as ProfileType, // Cast to ProfileType after validation
        label: typeLabel,
      };
    }).filter(Boolean) as ProfileTypeOption[]; // Filter out nulls and cast
    
    console.log("ProfileTypeActions: Successfully fetched and mapped profile types with Admin SDK:", JSON.stringify(allProfileTypes, null, 2));
    return allProfileTypes;
  } catch (error: any) {
    console.error('ProfileTypeActions: Error fetching profile types from Firestore with Admin SDK:', error.message, error.stack);
    if (error.code === 'failed-precondition' && error.message.includes("index")) {
        console.error("ProfileTypeActions: Firestore query failed. This is likely due to a missing index for ordering by 'label' on the 'profileTypes' collection. Please create this index in your Firestore settings: Collection ID 'profileTypes', Field 'label', Order 'Ascending'.");
    }
    return []; // Return empty array on error
  }
}
```
- src/lib/actions/tasks.ts:
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
- src/lib/actions/clubs.ts:
```ts

'use server';

import type { Club, ClubFormData } from '@/types';
import { adminDb } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { revalidatePath } from 'next/cache';

// This function will be used by the registration form to populate the clubs dropdown.
// It fetches all clubs to ensure new users can register.
export async function getApprovedClubs(): Promise<Club[]> {
  console.log("ClubActions: Attempting to fetch all clubs from Firestore using Admin SDK.");
  if (!adminDb) {
    console.warn("ClubActions (getApprovedClubs): Admin SDK not available. Returning empty array.");
    return [];
  }
  try {
    const clubsCollectionRef = adminDb.collection('clubs');
    // Query for all clubs and order them alphabetically by name
    const q = clubsCollectionRef.orderBy('name', 'asc');
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
      console.warn("ClubActions: No clubs found in 'clubs' collection. An index on 'name' (asc) may be required.");
      return [];
    }
    
    console.log(`ClubActions: Found ${querySnapshot.docs.length} clubs.`);
    
    const allClubs = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || `Unnamed Club (ID: ${doc.id})`,
        shortName: data.shortName,
        province_name: data.province_name,
        city_name: data.city_name,
        logoUrl: data.logoUrl,
        approved: data.approved,
        createdAt: data.createdAt ? (data.createdAt as admin.firestore.Timestamp).toDate().toISOString() : undefined,
      } as Club; 
    });
    
    console.log("ClubActions: Successfully fetched and sorted all clubs using Admin SDK.");
    return allClubs;
  } catch (error: any) {
    console.error('ClubActions: Error fetching clubs with Admin SDK:', error.message, error.stack);
    if (error.code === 'failed-precondition' && error.message.includes("index")) {
        console.error("ClubActions: Firestore query failed. This is likely due to a missing Firestore index. Please create an index on the 'name' field (ascending) for the 'clubs' collection.");
    }
    return []; // Return empty array on error
  }
}

// Action to create a new club (likely for an admin)
export async function createClub(
  formData: ClubFormData,
  userId: string
): Promise<{ success: boolean; error?: string; id?: string }> {
  if (!userId) {
    return { success: false, error: 'User not authenticated.' };
  }
  // In a real app, you would also check if the user has permission (e.g., is a super_admin)
  if (!adminDb) {
    return { success: false, error: 'Firebase Admin SDK not initialized.' };
  }
  try {
    const newClubData = {
      ...formData,
      approved: false, // New clubs should require approval
      createdBy: userId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await adminDb.collection('clubs').add(newClubData);
    revalidatePath('/clubs'); // Revalidate admin clubs page if it exists
    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error('Error creating club:', error);
    return { success: false, error: error.message || 'Failed to create club.' };
  }
}

// New action to update club approval status
export async function updateClubStatus(
  clubId: string,
  approved: boolean
): Promise<{ success: boolean; error?: string }> {
  console.log(`ClubActions: Attempting to update approved status for club ID: ${clubId} to '${approved}'.`);
  if (!clubId) {
    return { success: false, error: 'Club ID is required.' };
  }

  if (!adminDb) {
    console.error("ClubActions: Firebase Admin SDK is not initialized.");
    return { success: false, error: 'Server configuration error.' };
  }

  try {
    const clubRef = adminDb.collection('clubs').doc(clubId);
    await clubRef.update({
      approved: approved
    });
    console.log(`ClubActions: Successfully updated approved status for club ID: ${clubId} to '${approved}'.`);
    revalidatePath('/clubs'); // Revalidate the admin page
    revalidatePath(`/clubs/${clubId}`); // Revalidate the detail page
    return { success: true };
  } catch (error: any) {
    console.error(`ClubActions: Error updating status for club ID ${clubId}:`, error.message, error.stack);
    return { success: false, error: error.message || 'Failed to update club status.' };
  }
}

export async function getClubById(clubId: string): Promise<Club | null> {
    if (!adminDb) {
      console.error("ClubActions (getClubById): Admin SDK not initialized.");
      return null;
    }
    if (!clubId) {
      return null;
    }
    try {
        const clubDocRef = adminDb.collection('clubs').doc(clubId);
        const docSnap = await clubDocRef.get();

        if (!docSnap.exists) {
            console.warn(`ClubActions: No club found with ID: ${clubId}`);
            return null;
        }

        const data = docSnap.data()!;
        return {
            id: docSnap.id,
            name: data.name || `Unnamed Club (ID: ${docSnap.id})`,
            shortName: data.shortName,
            province_name: data.province_name,
            city_name: data.city_name,
            logoUrl: data.logoUrl,
            approved: data.approved,
            createdAt: data.createdAt ? (data.createdAt as admin.firestore.Timestamp).toDate().toISOString() : undefined,
        } as Club;

    } catch (error: any) {
        console.error(`ClubActions: Error fetching club by ID ${clubId}:`, error.message, error.stack);
        return null;
    }
}
```
- src/lib/actions/competition-categories.ts:
```ts
'use server';

import type { CompetitionCategory, CompetitionCategoryFormData } from '@/types';
import { adminDb } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { revalidatePath } from 'next/cache';

export async function getCompetitionCategories(): Promise<CompetitionCategory[]> {
  console.log("CompetitionCategoryActions: Attempting to fetch competition categories from Firestore using Admin SDK.");
  if (!adminDb) {
    console.warn("CompetitionCategoryActions (getCompetitionCategories): Admin SDK not available. Returning empty array.");
    return [];
  }
  try {
    const categoriesCollectionRef = adminDb.collection('competitionCategories');
    const querySnapshot = await categoriesCollectionRef.get();

    if (querySnapshot.empty) {
      console.warn("CompetitionCategoryActions: No documents found in 'competitionCategories' collection.");
      return [];
    }
    
    console.log(`CompetitionCategoryActions: Found ${querySnapshot.docs.length} documents in 'competitionCategories' collection.`);
    
    const allCategories = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || `Unnamed Category (ID: ${doc.id})`,
        description: data.description,
        level: data.level,
        gameFormatId: data.gameFormatId,
        createdAt: data.createdAt ? (data.createdAt as admin.firestore.Timestamp).toDate().toISOString() : undefined,
        updatedAt: data.updatedAt ? (data.updatedAt as admin.firestore.Timestamp).toDate().toISOString() : undefined,
      } as CompetitionCategory; 
    });
    
    allCategories.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    console.log("CompetitionCategoryActions: Successfully fetched and sorted categories using Admin SDK.");
    return allCategories;
  } catch (error: any) {
    console.error('CompetitionCategoryActions: Error fetching competition categories with Admin SDK:', error.message, error.stack);
    return [];
  }
}

export async function createCompetitionCategory(
  formData: CompetitionCategoryFormData,
  userId: string
): Promise<{ success: boolean; error?: string; id?: string }> {
  if (!userId) {
    return { success: false, error: 'User not authenticated.' };
  }
  if (!adminDb) {
    return { success: false, error: 'Database not initialized.' };
  }
  try {
    const newCategoryData = {
      ...formData,
      level: Number(formData.level) || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: userId,
    };

    const docRef = await adminDb.collection('competitionCategories').add(newCategoryData);
    revalidatePath('/admin/competition-categories');
    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error('Error creating competition category:', error);
    return { success: false, error: error.message || 'Failed to create category.' };
  }
}

export async function updateCompetitionCategory(
    categoryId: string,
    formData: CompetitionCategoryFormData,
    userId: string
): Promise<{ success: boolean; error?: string }> {
    if (!userId) return { success: false, error: 'User not authenticated.' };
    if (!adminDb) return { success: false, error: 'Database not initialized.' };
    
    try {
        const categoryRef = adminDb.collection('competitionCategories').doc(categoryId);
        const updateData = {
            ...formData,
            level: Number(formData.level) || null,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        await categoryRef.update(updateData);
        revalidatePath('/admin/competition-categories');
        return { success: true };
    } catch (error: any) {
        console.error(`Error updating category ${categoryId}:`, error);
        return { success: false, error: error.message || 'Failed to update category.' };
    }
}

export async function deleteCompetitionCategory(categoryId: string): Promise<{ success: boolean; error?: string }> {
    if (!adminDb) return { success: false, error: 'Database not initialized.' };
    try {
        await adminDb.collection('competitionCategories').doc(categoryId).delete();
        revalidatePath('/admin/competition-categories');
        return { success: true };
    } catch (error: any) {
        console.error(`Error deleting category ${categoryId}:`, error);
        return { success: false, error: error.message || 'Failed to delete category.' };
    }
}
```
- src/lib/actions/game-formats.ts:
```ts
'use server';

import type { GameFormat, GameFormatFormData } from '@/types';
import { adminDb } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { revalidatePath } from 'next/cache';

export async function getGameFormats(): Promise<GameFormat[]> {
  console.log("GameFormatActions: Attempting to fetch game formats from Firestore using Admin SDK.");
  if (!adminDb) {
    console.warn("GameFormatActions (getGameFormats): Admin SDK not available. Returning empty array.");
    return [];
  }
  try {
    const gameFormatsCollectionRef = adminDb.collection('gameFormats');
    const querySnapshot = await gameFormatsCollectionRef.get();

    if (querySnapshot.empty) {
      console.warn("GameFormatActions: No documents found in 'gameFormats' collection.");
      return [];
    }
    
    console.log(`GameFormatActions: Found ${querySnapshot.docs.length} documents in 'gameFormats' collection.`);
    
    const allGameFormats = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || `Unnamed Format (ID: ${doc.id})`,
        description: data.description,
        numPeriods: data.numPeriods,
        periodDurationMinutes: data.periodDurationMinutes,
        defaultTotalTimeouts: data.defaultTotalTimeouts,
        minPeriodsPlayerMustPlay: data.minPeriodsPlayerMustPlay,
        createdAt: data.createdAt ? (data.createdAt as admin.firestore.Timestamp).toDate().toISOString() : undefined,
      } as GameFormat; 
    });
    
    allGameFormats.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    
    console.log("GameFormatActions: Successfully fetched and sorted game formats using Admin SDK.");
    return allGameFormats;
  } catch (error: any) {
    console.error('GameFormatActions: Error fetching game formats with Admin SDK:', error.message, error.stack);
    return [];
  }
}

export async function getGameFormatById(formatId: string): Promise<GameFormat | null> {
    if (!adminDb) return null;
    try {
        const docRef = adminDb.collection('gameFormats').doc(formatId);
        const docSnap = await docRef.get();
        if (!docSnap.exists) {
            return null;
        }
        const data = docSnap.data() as Omit<GameFormat, 'id' | 'createdAt'> & { createdAt: admin.firestore.Timestamp };
        return { 
            id: docSnap.id, 
            ...data,
            createdAt: data.createdAt ? (data.createdAt as admin.firestore.Timestamp).toDate().toISOString() : undefined,
        } as GameFormat;
    } catch (error) {
        console.error(`Error getting game format by id ${formatId}:`, error);
        return null;
    }
}


export async function createGameFormat(
  formData: GameFormatFormData,
  userId: string
): Promise<{ success: boolean; error?: string; id?: string }> {
  if (!userId) {
    return { success: false, error: 'User not authenticated.' };
  }
  if (!adminDb) {
    return { success: false, error: 'Database not initialized.' };
  }
  try {
    const newFormatData = {
      ...formData,
      numPeriods: Number(formData.numPeriods) || null,
      periodDurationMinutes: Number(formData.periodDurationMinutes) || null,
      defaultTotalTimeouts: Number(formData.defaultTotalTimeouts) || null,
      minPeriodsPlayerMustPlay: Number(formData.minPeriodsPlayerMustPlay) || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: userId,
    };

    const docRef = await adminDb.collection('gameFormats').add(newFormatData);
    revalidatePath('/admin/game-formats');
    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error('Error creating game format:', error);
    return { success: false, error: error.message || 'Failed to create format.' };
  }
}

export async function updateGameFormat(
    formatId: string,
    formData: GameFormatFormData,
    userId: string
): Promise<{ success: boolean; error?: string }> {
    if (!userId) return { success: false, error: 'User not authenticated.' };
    if (!adminDb) return { success: false, error: 'Database not initialized.' };
    
    try {
        const formatRef = adminDb.collection('gameFormats').doc(formatId);
        const updateData = {
            ...formData,
            numPeriods: Number(formData.numPeriods) || null,
            periodDurationMinutes: Number(formData.periodDurationMinutes) || null,
            defaultTotalTimeouts: Number(formData.defaultTotalTimeouts) || null,
            minPeriodsPlayerMustPlay: Number(formData.minPeriodsPlayerMustPlay) || null,
        };
        await formatRef.update(updateData);
        revalidatePath('/admin/game-formats');
        return { success: true };
    } catch (error: any) {
        console.error(`Error updating format ${formatId}:`, error);
        return { success: false, error: error.message || 'Failed to update format.' };
    }
}

export async function deleteGameFormat(formatId: string): Promise<{ success: boolean; error?: string }> {
    if (!adminDb) return { success: false, error: 'Database not initialized.' };
    try {
        await adminDb.collection('gameFormats').doc(formatId).delete();
        revalidatePath('/admin/game-formats');
        return { success: true };
    } catch (error: any) {
        console.error(`Error deleting format ${formatId}:`, error);
        return { success: false, error: error.message || 'Failed to delete format.' };
    }
}

```
- src/lib/actions/players.ts:
```ts
'use server';

import { revalidatePath } from 'next/cache';
import { adminDb } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import type { PlayerFormData, Player } from '@/types';

export async function createPlayer(
  formData: PlayerFormData,
  teamId: string,
  clubId: string,
  userId: string
): Promise<{ success: boolean; error?: string; id?: string }> {
  if (!userId) {
    return { success: false, error: 'User not authenticated.' };
  }
  if (!teamId || !clubId) {
    return { success: false, error: 'Team ID or Club ID is missing.' };
  }
  if (!formData.firstName || !formData.lastName) {
    return { success: false, error: 'First name and last name are required.' };
  }

  if (!adminDb) {
    const errorMessage = 'Firebase Admin SDK is not initialized. Player creation cannot proceed.';
    console.error('PlayerActions (createPlayer):', errorMessage);
    return { success: false, error: errorMessage };
  }

  try {
    const newPlayerData = {
      ...formData,
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      teamId: teamId,
      jerseyNumber: formData.jerseyNumber ? Number(formData.jerseyNumber) : null,
      position: formData.position || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: userId,
    };

    const docRef = await adminDb.collection('players').add(newPlayerData);
    
    revalidatePath(`/clubs/${clubId}/teams/${teamId}`);

    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error('Error creating player:', error);
    return { success: false, error: error.message || 'Failed to create player.' };
  }
}


export async function updatePlayer(
  playerId: string,
  formData: PlayerFormData,
  clubId: string,
  teamId: string,
): Promise<{ success: boolean; error?: string }> {
   if (!playerId) {
    return { success: false, error: "Player ID is required." };
  }
  if (!adminDb) {
    return { success: false, error: "Database not initialized."};
  }
  try {
    const playerRef = adminDb.collection("players").doc(playerId);
    
    const updateData = {
      ...formData,
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      jerseyNumber: formData.jerseyNumber ? Number(formData.jerseyNumber) : null,
      position: formData.position || null,
    };
    
    await playerRef.update(updateData);

    revalidatePath(`/clubs/${clubId}/teams/${teamId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Error updating player:", error);
    return { success: false, error: error.message || "Failed to update player." };
  }
}

export async function deletePlayer(playerId: string, clubId: string, teamId: string): Promise<{ success: boolean; error?: string }> {
  if (!playerId) {
    return { success: false, error: "Player ID is required." };
  }
  if (!adminDb) {
    return { success: false, error: "Database not initialized."};
  }
  try {
    const playerRef = adminDb.collection("players").doc(playerId);
    await playerRef.delete();
    revalidatePath(`/clubs/${clubId}/teams/${teamId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting player:", error);
    return { success: false, error: error.message || "Failed to delete player." };
  }
}

export async function getPlayersByTeamId(teamId: string): Promise<Player[]> {
  if (!adminDb) {
    console.warn('PlayerActions (getPlayersByTeamId): Admin SDK not available. Returning empty array.');
    return [];
  }
  if (!teamId) {
    console.warn('PlayerActions (getPlayersByTeamId): teamId is required.');
    return [];
  }

  try {
    const playersCollectionRef = adminDb.collection('players');
    const q = playersCollectionRef.where('teamId', '==', teamId);
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
      return [];
    }
    
    const players = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt ? (data.createdAt as admin.firestore.Timestamp).toDate().toISOString() : undefined,
      } as Player;
    });

    players.sort((a, b) => (a.lastName || '').localeCompare(b.lastName || '') || (a.firstName || '').localeCompare(b.firstName || ''));
    
    return players;
  } catch (error: any) {
    console.error(`PlayerActions: Error fetching players for team ${teamId}:`, error.message, error.stack);
    return [];
  }
}

export async function getPlayersByClub(clubId: string): Promise<Player[]> {
    if (!adminDb) return [];
    if (!clubId) return [];

    const teamsRef = adminDb.collection('teams');
    const teamsQuery = teamsRef.where('clubId', '==', clubId);
    const teamsSnap = await teamsQuery.get();
    if (teamsSnap.empty) return [];

    const teamIds = teamsSnap.docs.map(doc => doc.id);
    if (teamIds.length === 0) return [];

    const playerChunks: Promise<admin.firestore.QuerySnapshot<admin.firestore.DocumentData>>[] = [];
    for (let i = 0; i < teamIds.length; i += 30) {
        const chunk = teamIds.slice(i, i + 30);
        const playersRef = adminDb.collection('players');
        const playersQuery = playersRef.where('teamId', 'in', chunk);
        playerChunks.push(playersQuery.get());
    }
    
    const allPlayersSnapshots = await Promise.all(playerChunks);
    const players: Player[] = [];
    
    allPlayersSnapshots.forEach(snapshot => {
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            players.push({
                id: doc.id,
                ...data,
                createdAt: data.createdAt ? (data.createdAt as admin.firestore.Timestamp).toDate().toISOString() : undefined,
            } as Player);
        });
    });

    players.sort((a, b) => (a.lastName || '').localeCompare(b.lastName || '') || (a.firstName || '').localeCompare(b.firstName || ''));
    
    return players;
}

export async function getPlayersFromIds(playerIds: string[]): Promise<Player[]> {
    if (!adminDb || playerIds.length === 0) return [];

    try {
        const playerChunks: Promise<admin.firestore.QuerySnapshot<admin.firestore.DocumentData>>[] = [];
        for (let i = 0; i < playerIds.length; i += 30) {
            const chunk = playerIds.slice(i, i + 30);
            const playersRef = adminDb.collection('players');
            const playersQuery = playersRef.where(admin.firestore.FieldPath.documentId(), 'in', chunk);
            playerChunks.push(playersQuery.get());
        }

        const allPlayersSnapshots = await Promise.all(playerChunks);
        const players: Player[] = [];
        
        allPlayersSnapshots.forEach(snapshot => {
            snapshot.docs.forEach(doc => {
                const data = doc.data();
                players.push({
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt ? (data.createdAt as admin.firestore.Timestamp).toDate().toISOString() : undefined,
                } as Player);
            });
        });

        return players;
    } catch (error: any) {
        console.error("Error fetching players by IDs:", error);
        return [];
    }
}
```
- src/lib/actions/seasons.ts:
```ts
'use server';
import { adminDb } from '@/lib/firebase/admin';
import type { Season, SeasonFormData } from '@/types';
import { revalidatePath } from 'next/cache';
import admin from 'firebase-admin';

export async function getSeasons(): Promise<Season[]> {
    if (!adminDb) return [];
    try {
        const seasonsRef = adminDb.collection('seasons');
        const snapshot = await seasonsRef.orderBy('name', 'desc').get();
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt ? (data.createdAt as admin.firestore.Timestamp).toDate().toISOString() : undefined,
                updatedAt: data.updatedAt ? (data.updatedAt as admin.firestore.Timestamp).toDate().toISOString() : undefined,
            } as Season;
        });
    } catch (error) {
        console.error("Error fetching seasons: ", error);
        return [];
    }
}

export async function getSeasonById(seasonId: string): Promise<Season | null> {
    if (!adminDb) return null;
    try {
        const seasonRef = adminDb.collection('seasons').doc(seasonId);
        const docSnap = await seasonRef.get();
        if (!docSnap.exists) {
            console.warn(`Could not find season with ID: ${seasonId}`);
            return null;
        }
        const data = docSnap.data()!;
        return {
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt ? (data.createdAt as admin.firestore.Timestamp).toDate().toISOString() : undefined,
            updatedAt: data.updatedAt ? (data.updatedAt as admin.firestore.Timestamp).toDate().toISOString() : undefined,
        } as Season;
    } catch (error: any) {
        console.error(`Error fetching season by ID ${seasonId}:`, error);
        return null;
    }
}

export async function createSeason(formData: SeasonFormData, userId: string): Promise<{ success: boolean; error?: string }> {
    if (!adminDb) return { success: false, error: 'Database not initialized' };
    if (!userId) return { success: false, error: 'User not authenticated' };
    
    try {
        const newSeason = {
            ...formData,
            createdBy: userId,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        await adminDb.collection('seasons').add(newSeason);
        revalidatePath('/seasons');
        return { success: true };
    } catch (error: any) {
        console.error("Error creating season:", error);
        return { success: false, error: error.message };
    }
}

export async function updateSeason(
    seasonId: string,
    formData: SeasonFormData,
    userId: string
): Promise<{ success: boolean; error?: string }> {
    if (!adminDb) return { success: false, error: 'Database not initialized' };
    if (!userId) return { success: false, error: 'User not authenticated' };
    
    try {
        const seasonRef = adminDb.collection('seasons').doc(seasonId);
        const updateData = {
            ...formData,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedBy: userId,
        };
        await seasonRef.update(updateData);
        
        revalidatePath('/seasons');
        revalidatePath(`/seasons/${seasonId}/edit`);

        return { success: true };
    } catch (error: any) {
        console.error("Error updating season:", error);
        return { success: false, error: error.message };
    }
}

```
- src/lib/actions/teams.ts:
```ts
'use server';

import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/firebase/admin";
import admin from "firebase-admin";
import type { TeamFormData, Team } from "@/types";

export async function createTeam(
  formData: TeamFormData,
  clubId: string,
  userId: string
): Promise<{ success: boolean; error?: string; id?: string }> {
  if (!userId) {
    return { success: false, error: "User not authenticated." };
  }
  if (!clubId) {
    return { success: false, error: "Club ID is missing." };
  }
  if (!formData.name || formData.name.trim() === "") {
    return { success: false, error: "Team name cannot be empty." };
  }

  if (!adminDb) {
    const errorMessage = "Firebase Admin SDK is not initialized. Team creation cannot proceed.";
    console.error("TeamActions (createTeam):", errorMessage);
    return { success: false, error: errorMessage };
  }

  try {
    const newTeamData: Omit<Team, "id" | "createdAt" | "updatedAt"> & { createdAt: any, updatedAt: any } = {
      name: formData.name.trim(),
      clubId: clubId,
      gameFormatId: formData.gameFormatId || null,
      competitionCategoryId: formData.competitionCategoryId || null,
      coachIds: formData.coachIds || [],
      coordinatorIds: formData.coordinatorIds || [],
      playerIds: [],
      logoUrl: null,
      city: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdByUserId: userId,
    };

    const docRef = await adminDb.collection("teams").add(newTeamData);
    
    revalidatePath(`/clubs/${clubId}`);
    revalidatePath(`/clubs/${clubId}/teams/new`);
    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error("Error creating team:", error);
    return { success: false, error: error.message || "Failed to create team." };
  }
}

export async function updateTeam(
  teamId: string,
  formData: TeamFormData,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  if (!userId) {
    return { success: false, error: "User not authenticated." };
  }
  if (!teamId) {
    return { success: false, error: "Team ID is missing." };
  }

  if (!adminDb) {
    return { success: false, error: "Database not initialized." };
  }

  try {
    const teamRef = adminDb.collection("teams").doc(teamId);
    // TODO: Add permission check here if needed
    
    const updateData = {
      name: formData.name.trim(),
      competitionCategoryId: formData.competitionCategoryId || null,
      gameFormatId: formData.gameFormatId || null,
      coachIds: formData.coachIds || [],
      coordinatorIds: formData.coordinatorIds || [],
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await teamRef.update(updateData);
    
    const teamSnap = await teamRef.get();
    const clubId = teamSnap.data()?.clubId;

    if (clubId) {
      revalidatePath(`/clubs/${clubId}`);
      revalidatePath(`/clubs/${clubId}/teams/${teamId}`);
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error updating team:", error);
    return { success: false, error: error.message || "Failed to update team." };
  }
}

export async function getTeamsByClubId(clubId: string): Promise<Team[]> {
  console.log(`TeamActions: Attempting to fetch teams for clubId: ${clubId}`);
  if (!adminDb) {
    console.warn("TeamActions (getTeamsByClubId): Admin SDK not available. Returning empty array.");
    return [];
  }
  if (!clubId) {
    console.warn("TeamActions (getTeamsByClubId): clubId is required.");
    return [];
  }

  try {
    const teamsCollectionRef = adminDb.collection('teams');
    const q = teamsCollectionRef.where('clubId', '==', clubId);
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
      console.log(`TeamActions: No teams found for clubId: ${clubId}`);
      return [];
    }
    
    console.log(`TeamActions: Found ${querySnapshot.docs.length} teams for clubId: ${clubId}.`);
    
    const teams = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt ? (data.createdAt as admin.firestore.Timestamp).toDate().toISOString() : undefined,
        updatedAt: data.updatedAt ? (data.updatedAt as admin.firestore.Timestamp).toDate().toISOString() : undefined,
      } as Team;
    });

    teams.sort((a, b) => new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime());
    
    return teams;
  } catch (error: any) {
    console.error(`TeamActions: Error fetching teams for club ${clubId}:`, error.message, error.stack);
     if (error.code === 'failed-precondition') {
        console.error("TeamActions: Firestore query for teams failed. This could be a missing index for 'clubId'.");
    }
    return [];
  }
}

export async function getTeamById(teamId: string): Promise<Team | null> {
  console.log(`TeamActions: Attempting to fetch team by ID: ${teamId}`);
  if (!adminDb) {
    console.warn("TeamActions (getTeamById): Admin SDK not available. Returning null.");
    return null;
  }
  if (!teamId) {
    console.warn("TeamActions (getTeamById): teamId is required.");
    return null;
  }

  try {
    const teamDocRef = adminDb.collection('teams').doc(teamId);
    const docSnap = await teamDocRef.get();

    if (!docSnap.exists) {
      console.warn(`TeamActions: No team found with ID: ${teamId}`);
      return null;
    }
    
    const data = docSnap.data()!;
    console.log(`TeamActions: Found team: ${data.name}`);
    
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt ? (data.createdAt as admin.firestore.Timestamp).toDate().toISOString() : undefined,
      updatedAt: data.updatedAt ? (data.updatedAt as admin.firestore.Timestamp).toDate().toISOString() : undefined,
    } as Team;
  } catch (error: any) {
    console.error(`TeamActions: Error fetching team by ID ${teamId}:`, error.message, error.stack);
    return null;
  }
}

export async function getAllTeams(): Promise<Team[]> {
    if (!adminDb) return [];
    try {
        const teamsRef = adminDb.collection('teams');
        const querySnapshot = await teamsRef.orderBy('name', 'asc').get();
        const teams = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt ? (data.createdAt as admin.firestore.Timestamp).toDate().toISOString() : undefined,
                updatedAt: data.updatedAt ? (data.updatedAt as admin.firestore.Timestamp).toDate().toISOString() : undefined,
            } as Team;
        });
        return teams;
    } catch (e: any) {
        if (e.code === 'failed-precondition') {
            console.error("Firestore error: Missing index for teams collection on 'name' field.");
        }
        return [];
    }
}

export async function getTeamsByCoach(userId: string): Promise<Team[]> {
    if (!adminDb) return [];
    try {
        const teamsRef = adminDb.collection('teams');
        const querySnapshot = await teamsRef.where('coachIds', 'array-contains', userId).get();
        return querySnapshot.docs.map(doc => {
            const data = doc.data();
             return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt ? (data.createdAt as admin.firestore.Timestamp).toDate().toISOString() : undefined,
                updatedAt: data.updatedAt ? (data.updatedAt as admin.firestore.Timestamp).toDate().toISOString() : undefined,
            } as Team;
        });
    } catch (e: any) {
        console.error("Error getting teams by coach:", e);
        return [];
    }
}
```
- src/lib/actions/tasks.ts:
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
- src/lib/actions/users.ts:
```ts
'use server';

import { v4 as uuidv4 } from 'uuid';
import { adminAuth, adminDb, adminInitError } from '@/lib/firebase/admin';
import type { UserFirestoreProfile, ProfileType, UserProfileStatus, Child } from '@/types';
import { revalidatePath } from 'next/cache';
import admin from 'firebase-admin';

export async function finalizeNewUserProfile(
  idToken: string,
  data: { displayName: string; profileType?: ProfileType; selectedClubId?: string | null; }
): Promise<{ success: boolean; error?: string }> {
  if (!adminAuth || !adminDb) {
    return { success: false, error: `Server configuration error: ${adminInitError || 'Unknown admin SDK error.'}` };
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    
    await adminAuth.updateUser(uid, { displayName: data.displayName });

    const userProfileRef = adminDb.collection('user_profiles').doc(uid);
    const doc = await userProfileRef.get();

    if (doc.exists) {
      // User profile exists, this is likely the completion of onboarding
      await userProfileRef.update({
        profileTypeId: data.profileType,
        clubId: data.selectedClubId,
        onboardingCompleted: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      // New user from email/password, create stub profile
      const profileToSave: Omit<UserFirestoreProfile, 'createdAt' | 'updatedAt' | 'id'> = {
          uid: uid,
          email: decodedToken.email,
          displayName: data.displayName,
          photoURL: decodedToken.picture || null,
          profileTypeId: null,
          clubId: null,
          status: 'pending_approval' as UserProfileStatus,
          isSeeded: false,
          onboardingCompleted: false,
      };
      await userProfileRef.set({
        ...profileToSave, 
        createdAt: admin.firestore.FieldValue.serverTimestamp(), 
        updatedAt: admin.firestore.FieldValue.serverTimestamp() 
      });
    }
    
    return { success: true };

  } catch (error: any) {
    console.error(`Error finalizing user profile for user: ${idToken.substring(0, 10)}...:`, error);
    return { success: false, error: `Failed to finalize profile on server: ${error.message}` };
  }
}

export async function updateUserChildren(userId: string, children: Child[]): Promise<{ success: boolean; error?: string }> {
    if (!adminDb) {
        return { success: false, error: 'La base de datos no está inicializada.' };
    }
    try {
        const profileRef = adminDb.collection('user_profiles').doc(userId);
        await profileRef.update({
            children: children,
            onboardingCompleted: true, // Mark onboarding as complete once children are added/updated
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        revalidatePath('/profile/my-children');
        return { success: true };
    } catch(err: any) {
        return { success: false, error: "No se pudo actualizar la información."};
    }
}


export async function getUserProfileById(uid: string): Promise<UserFirestoreProfile | null> {
  if (!adminDb) {
    console.error("UserActions (getProfile): Firebase Admin SDK not initialized. Error:", adminInitError);
    return null;
  }
  
  if (!uid) return null;

  try {
    const userProfileRef = adminDb.collection('user_profiles').doc(uid);
    const docSnap = await userProfileRef.get();

    if (docSnap.exists) {
      const data = docSnap.data() as any;
      
      const serializableProfile = {
        ...data,
        createdAt: data.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate()?.toISOString() || new Date().toISOString(),
      };

      return { uid: docSnap.id, ...serializableProfile } as UserFirestoreProfile;
    } else {
      console.warn(`UserActions: No profile found for UID: ${uid} using Admin SDK.`);
      return null;
    }
  } catch (error: any) {
    console.error(`UserActions: Error fetching user profile for UID ${uid} with Admin SDK:`, error.message, error.stack);
    return null;
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
      const data = doc.data();
      return {
        uid: doc.id,
        ...data,
        createdAt: (data.createdAt as admin.firestore.Timestamp).toDate().toISOString(),
        updatedAt: (data.updatedAt as admin.firestore.Timestamp).toDate().toISOString(),
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

export async function getAllScorers(): Promise<UserFirestoreProfile[]> {
  if (!adminDb) {
    return [];
  }
  try {
    const usersRef = adminDb.collection('user_profiles');
    const q = usersRef.where('profileTypeId', '==', 'scorer').where('status', '==', 'approved');
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
      return [];
    }
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        uid: doc.id,
        ...data,
        createdAt: (data.createdAt as admin.firestore.Timestamp).toDate().toISOString(),
        updatedAt: (data.updatedAt as admin.firestore.Timestamp).toDate().toISOString(),
      } as UserFirestoreProfile;
    });
  } catch (error: any) {
    console.error("Error fetching all scorers:", error);
    return [];
  }
}
```
- src/lib/firebase/admin.ts:
```ts
import admin from 'firebase-admin';

// This new exported variable will hold the specific initialization error.
export let adminInitError: string | null = null;

// This file is now only used in the Node.js runtime (API Routes).
// We ensure it's only initialized once.
if (!admin.apps.length) {
  // Diagnostic log to check if the environment variable is being read at all.
  const serviceAccountJsonString = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON;
  console.log(`Firebase Admin SDK: Checking for credentials. Found FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON variable of type '${typeof serviceAccountJsonString}' with length ${serviceAccountJsonString?.length ?? 0}.`);

  if (serviceAccountJsonString) {
    console.log('Firebase Admin SDK: Attempting to initialize using service account JSON...');
    try {
      const serviceAccount = JSON.parse(serviceAccountJsonString);
      
      // Basic validation of the parsed service account object
      if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
        throw new Error('Parsed service account JSON is missing essential fields (project_id, private_key, client_email).');
      }
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('Firebase Admin SDK: Initialized successfully using service account JSON.');

    } catch (e: any) {
      // Store the specific error message
      adminInitError = `Could not initialize using FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON. Error: ${e.message}`;
      // Use console.warn to avoid crashing the server in a loop
      console.warn(`Firebase Admin SDK: NON-FATAL FAILURE. ${adminInitError}`);
    }
  } else {
    // Store the specific error message
    adminInitError = 'FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON environment variable not found. This is required for local development.';
    console.warn(
      'Firebase Admin SDK: WARNING - ' + adminInitError +
      ' Attempting default initialization. This is expected in production on App Hosting.'
    );
    try {
        admin.initializeApp();
        console.log('Firebase Admin SDK: Default initialization successful.');
    } catch (e: any) {
        adminInitError = `Default initialization also failed. Error: ${e.message}`;
        // Use console.warn to avoid crashing the server in a loop
        console.warn(
          'Firebase Admin SDK: NON-FATAL FAILURE - ' + adminInitError
        );
    }
  }
}

// Export auth and firestore instances. They will be undefined if initialization failed.
const adminAuth = admin.apps.length ? admin.auth() : undefined;
const adminDb = admin.apps.length ? admin.firestore() : undefined;

if (!adminAuth || !adminDb) {
    // Update the error if it's still null but initialization failed for some other reason
    if (admin.apps.length === 0 && !adminInitError) {
        adminInitError = "Unknown error during Firebase Admin initialization.";
    }
    // Using console.warn instead of console.error to prevent the server process manager
    // from treating this as a fatal startup error and restarting the server in a loop.
    console.warn(`Firebase Admin SDK: WARNING - adminAuth or adminDb could not be exported because the SDK is not initialized. Error: ${adminInitError}`);
}

export { adminAuth, adminDb };
export default admin;
```
- src/lib/firebase/config.ts:
```ts
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function checkConfig(config: Record<string, string | undefined>, prefix: string): void {
  const missingKeys = Object.entries(config)
    .filter(([_, value]) => !value)
    .map(([key]) => `${prefix}${key.replace(/([A-Z])/g, '_$1').toUpperCase()}`);

  if (missingKeys.length > 0) {
    const message = `Warning: Firebase configuration is incomplete. Missing environment variables: ${missingKeys.join(', ')}. Please check your .env.local file.`;
    if (typeof window === 'undefined') { // Server-side
      console.warn(message);
    } else { // Client-side
      // Avoid logging verbose warnings in browser console during development if not critical for page load
      // but ensure developers are aware if core functionality might break.
      // For a real app, you might want to throw an error or show a UI message if essential config is missing.
      if (process.env.NODE_ENV === 'development') {
        console.warn(message);
      }
    }
  }
}

checkConfig(firebaseConfig, 'NEXT_PUBLIC_FIREBASE_');
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
- src/lib/utils.ts:
```ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```
- src/middleware.ts:
```ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_ONLY_PATHS = ['/login', '/register', '/reset-password'];
const ONBOARDING_PATHS = ['/profile/complete-registration', '/profile/my-children'];
const PROTECTED_PATH_PREFIXES = ['/dashboard', '/games', '/analysis', '/tasks', '/profile', '/admin', '/clubs', '/seasons'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('session')?.value;
  const isAuthed = !!sessionCookie;

  // Allow static assets, images, and API routes to pass through without checks
  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.includes('.')) {
    return NextResponse.next();
  }
  
  const isPublicOnlyPath = PUBLIC_ONLY_PATHS.includes(pathname);
  const isOnboardingPath = ONBOARDING_PATHS.some(p => pathname.startsWith(p));
  const isProtectedRoute = PROTECTED_PATH_PREFIXES.some(p => pathname.startsWith(p)) && !isOnboardingPath;
  const isRootPath = pathname === '/';

  if (isAuthed) {
    // If the user is authenticated, redirect them from public-only pages
    // and the root page to the dashboard.
    // Onboarding paths are allowed for authenticated users who need them.
    if (isPublicOnlyPath || isRootPath) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  } else { // Not authenticated
    // If the user is not authenticated, redirect them from protected routes
    // to the login page.
    if (isProtectedRoute) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }
  }
  
  // Allow the request to proceed if none of the above conditions are met.
  return NextResponse.next();
}

export const config = {
  // This matcher ensures the middleware runs on all paths except for the ones specified.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```
- src/teams/actions.ts:
```ts
'use server';

import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/firebase/admin";
import admin from "firebase-admin";
import type { TeamFormData, Team } from "@/types";

export async function createTeam(
  formData: TeamFormData,
  clubId: string,
  userId: string
): Promise<{ success: boolean; error?: string; id?: string }> {
  if (!userId) {
    return { success: false, error: "User not authenticated." };
  }
  if (!clubId) {
    return { success: false, error: "Club ID is missing." };
  }
  if (!formData.name || formData.name.trim() === "") {
    return { success: false, error: "Team name cannot be empty." };
  }

  if (!adminDb) {
    const errorMessage = "Firebase Admin SDK is not initialized. Team creation cannot proceed.";
    console.error("TeamActions (createTeam):", errorMessage);
    return { success: false, error: errorMessage };
  }

  try {
    const newTeamData: Omit<Team, "id" | "createdAt" | "updatedAt"> & { createdAt: any, updatedAt: any } = {
      name: formData.name.trim(),
      clubId: clubId,
      gameFormatId: formData.gameFormatId || null,
      competitionCategoryId: formData.competitionCategoryId || null,
      coachIds: formData.coachIds || [],
      coordinatorIds: formData.coordinatorIds || [],
      playerIds: [],
      logoUrl: null,
      city: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdByUserId: userId,
    };

    const docRef = await adminDb.collection("teams").add(newTeamData);
    
    revalidatePath(`/clubs/${clubId}`);
    revalidatePath(`/clubs/${clubId}/teams/new`);
    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error("Error creating team:", error);
    return { success: false, error: error.message || "Failed to create team." };
  }
}

export async function updateTeam(
  teamId: string,
  formData: TeamFormData,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  if (!userId) {
    return { success: false, error: "User not authenticated." };
  }
  if (!teamId) {
    return { success: false, error: "Team ID is missing." };
  }

  if (!adminDb) {
    return { success: false, error: "Database not initialized." };
  }

  try {
    const teamRef = adminDb.collection("teams").doc(teamId);
    // TODO: Add permission check here if needed
    
    const updateData = {
      name: formData.name.trim(),
      competitionCategoryId: formData.competitionCategoryId || null,
      gameFormatId: formData.gameFormatId || null,
      coachIds: formData.coachIds || [],
      coordinatorIds: formData.coordinatorIds || [],
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await teamRef.update(updateData);
    
    const teamSnap = await teamRef.get();
    const clubId = teamSnap.data()?.clubId;

    if (clubId) {
      revalidatePath(`/clubs/${clubId}`);
      revalidatePath(`/clubs/${clubId}/teams/${teamId}`);
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error updating team:", error);
    return { success: false, error: error.message || "Failed to update team." };
  }
}

export async function getTeamsByClubId(clubId: string): Promise<Team[]> {
  console.log(`TeamActions: Attempting to fetch teams for clubId: ${clubId}`);
  if (!adminDb) {
    console.warn("TeamActions (getTeamsByClubId): Admin SDK not available. Returning empty array.");
    return [];
  }
  if (!clubId) {
    console.warn("TeamActions (getTeamsByClubId): clubId is required.");
    return [];
  }

  try {
    const teamsCollectionRef = adminDb.collection('teams');
    const q = teamsCollectionRef.where('clubId', '==', clubId);
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
      console.log(`TeamActions: No teams found for clubId: ${clubId}`);
      return [];
    }
    
    console.log(`TeamActions: Found ${querySnapshot.docs.length} teams for clubId: ${clubId}.`);
    
    const teams = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt ? (data.createdAt as admin.firestore.Timestamp).toDate().toISOString() : undefined,
        updatedAt: data.updatedAt ? (data.updatedAt as admin.firestore.Timestamp).toDate().toISOString() : undefined,
      } as Team;
    });

    teams.sort((a, b) => new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime());
    
    return teams;
  } catch (error: any) {
    console.error(`TeamActions: Error fetching teams for club ${clubId}:`, error.message, error.stack);
     if (error.code === 'failed-precondition') {
        console.error("TeamActions: Firestore query for teams failed. This could be a missing index for 'clubId'.");
    }
    return [];
  }
}

export async function getTeamById(teamId: string): Promise<Team | null> {
  console.log(`TeamActions: Attempting to fetch team by ID: ${teamId}`);
  if (!adminDb) {
    console.warn("TeamActions (getTeamById): Admin SDK not available. Returning null.");
    return null;
  }
  if (!teamId) {
    console.warn("TeamActions (getTeamById): teamId is required.");
    return null;
  }

  try {
    const teamDocRef = adminDb.collection('teams').doc(teamId);
    const docSnap = await teamDocRef.get();

    if (!docSnap.exists) {
      console.warn(`TeamActions: No team found with ID: ${teamId}`);
      return null;
    }
    
    const data = docSnap.data()!;
    console.log(`TeamActions: Found team: ${data.name}`);
    
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt ? (data.createdAt as admin.firestore.Timestamp).toDate().toISOString() : undefined,
      updatedAt: data.updatedAt ? (data.updatedAt as admin.firestore.Timestamp).toDate().toISOString() : undefined,
    } as Team;
  } catch (error: any) {
    console.error(`TeamActions: Error fetching team by ID ${teamId}:`, error.message, error.stack);
    return null;
  }
}

export async function getAllTeams(): Promise<Team[]> {
    if (!adminDb) return [];
    try {
        const teamsRef = adminDb.collection('teams');
        const querySnapshot = await teamsRef.orderBy('name', 'asc').get();
        const teams = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt ? (data.createdAt as admin.firestore.Timestamp).toDate().toISOString() : undefined,
                updatedAt: data.updatedAt ? (data.updatedAt as admin.firestore.Timestamp).toDate().toISOString() : undefined,
            } as Team;
        });
        return teams;
    } catch (e: any) {
        if (e.code === 'failed-precondition') {
            console.error("Firestore error: Missing index for teams collection on 'name' field.");
        }
        return [];
    }
}

export async function getTeamsByCoach(userId: string): Promise<Team[]> {
    if (!adminDb) return [];
    try {
        const teamsRef = adminDb.collection('teams');
        const querySnapshot = await teamsRef.where('coachIds', 'array-contains', userId).get();
        return querySnapshot.docs.map(doc => {
            const data = doc.data();
             return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt ? (data.createdAt as admin.firestore.Timestamp).toDate().toISOString() : undefined,
                updatedAt: data.updatedAt ? (data.updatedAt as admin.firestore.Timestamp).toDate().toISOString() : undefined,
            } as Team;
        });
    } catch (e: any) {
        console.error("Error getting teams by coach:", e);
        return [];
    }
}
```
- src/users/actions.ts:
```ts
'use server';

import { v4 as uuidv4 } from 'uuid';
import { adminAuth, adminDb, adminInitError } from '@/lib/firebase/admin';
import type { UserFirestoreProfile, ProfileType, UserProfileStatus, Child } from '@/types';
import { revalidatePath } from 'next/cache';
import admin from 'firebase-admin';

export async function finalizeNewUserProfile(
  idToken: string,
  data: { displayName: string; profileType?: ProfileType; selectedClubId?: string | null; }
): Promise<{ success: boolean; error?: string }> {
  if (!adminAuth || !adminDb) {
    return { success: false, error: `Server configuration error: ${adminInitError || 'Unknown admin SDK error.'}` };
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    
    await adminAuth.updateUser(uid, { displayName: data.displayName });

    const userProfileRef = adminDb.collection('user_profiles').doc(uid);
    const doc = await userProfileRef.get();

    if (doc.exists) {
      // User profile exists, this is likely the completion of onboarding
      await userProfileRef.update({
        profileTypeId: data.profileType,
        clubId: data.selectedClubId,
        onboardingCompleted: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      // New user from email/password, create stub profile
      const profileToSave: Omit<UserFirestoreProfile, 'createdAt' | 'updatedAt' | 'id'> = {
          uid: uid,
          email: decodedToken.email,
          displayName: data.displayName,
          photoURL: decodedToken.picture || null,
          profileTypeId: null,
          clubId: null,
          status: 'pending_approval' as UserProfileStatus,
          isSeeded: false,
          onboardingCompleted: false,
      };
      await userProfileRef.set({
        ...profileToSave, 
        createdAt: admin.firestore.FieldValue.serverTimestamp(), 
        updatedAt: admin.firestore.FieldValue.serverTimestamp() 
      });
    }
    
    return { success: true };

  } catch (error: any) {
    console.error(`Error finalizing user profile for user: ${idToken.substring(0, 10)}...:`, error);
    return { success: false, error: `Failed to finalize profile on server: ${error.message}` };
  }
}

export async function updateUserChildren(userId: string, children: Child[]): Promise<{ success: boolean; error?: string }> {
    if (!adminDb) {
        return { success: false, error: 'La base de datos no está inicializada.' };
    }
    try {
        const profileRef = adminDb.collection('user_profiles').doc(userId);
        await profileRef.update({
            children: children,
            onboardingCompleted: true, // Mark onboarding as complete once children are added/updated
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        revalidatePath('/profile/my-children');
        return { success: true };
    } catch(err: any) {
        return { success: false, error: "No se pudo actualizar la información."};
    }
}


export async function getUserProfileById(uid: string): Promise<UserFirestoreProfile | null> {
  if (!adminDb) {
    console.error("UserActions (getProfile): Firebase Admin SDK not initialized. Error:", adminInitError);
    return null;
  }
  
  if (!uid) return null;

  try {
    const userProfileRef = adminDb.collection('user_profiles').doc(uid);
    const docSnap = await userProfileRef.get();

    if (docSnap.exists) {
      const data = docSnap.data() as any;
      
      const serializableProfile = {
        ...data,
        createdAt: data.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate()?.toISOString() || new Date().toISOString(),
      };

      return { uid: docSnap.id, ...serializableProfile } as UserFirestoreProfile;
    } else {
      console.warn(`UserActions: No profile found for UID: ${uid} using Admin SDK.`);
      return null;
    }
  } catch (error: any) {
    console.error(`UserActions: Error fetching user profile for UID ${uid} with Admin SDK:`, error.message, error.stack);
    return null;
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
      const data = doc.data();
      return {
        uid: doc.id,
        ...data,
        createdAt: (data.createdAt as admin.firestore.Timestamp).toDate().toISOString(),
        updatedAt: (data.updatedAt as admin.firestore.Timestamp).toDate().toISOString(),
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

export async function getAllScorers(): Promise<UserFirestoreProfile[]> {
  if (!adminDb) {
    return [];
  }
  try {
    const usersRef = adminDb.collection('user_profiles');
    const q = usersRef.where('profileTypeId', '==', 'scorer').where('status', '==', 'approved');
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
      return [];
    }
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        uid: doc.id,
        ...data,
        createdAt: (data.createdAt as admin.firestore.Timestamp).toDate().toISOString(),
        updatedAt: (data.updatedAt as admin.firestore.Timestamp).toDate().toISOString(),
      } as UserFirestoreProfile;
    });
  } catch (error: any) {
    console.error("Error fetching all scorers:", error);
    return [];
  }
}
```

