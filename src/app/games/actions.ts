
// This file was causing a syntax error because of leftover characters.
// This is the clean, correct version.
'use server';
import { adminDb } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { revalidatePath } from 'next/cache';
import type { Game, GameFormData, Team, TeamStats, Player, GameEventAction, UserFirestoreProfile, StatCategory, PlayerGameStats, Season, GameFormat, GameEvent } from '@/types';
import { getTeamsByCoach as getCoachTeams } from '@/app/teams/actions';
import { getPlayersFromIds } from '@/app/players/actions';
import { getUserProfileById } from '@/lib/actions/users/get-user-profile';


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
                date: (data.date as admin.firestore.Timestamp).toDate().toISOString(),
                createdAt: (data.createdAt as admin.firestore.Timestamp)?.toDate().toISOString(),
                updatedAt: (data.updatedAt as admin.firestore.Timestamp)?.toDate().toISOString(),
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
            createdAt: (data.createdAt as admin.firestore.Timestamp)?.toDate().toISOString(),
            updatedAt: (data.updatedAt as admin.firestore.Timestamp)?.toDate().toISOString(),
            timerStartedAt: (data.timerStartedAt as admin.firestore.Timestamp)?.toDate().toISOString() || null,
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

        const newGameData: Omit<Game, 'id' | 'createdAt' | 'updatedAt' | 'date'> = {
            homeTeamId: formData.homeTeamId,
            homeTeamClubId: homeTeamData.clubId,
            homeTeamName: homeTeamData.name,
            homeTeamLogoUrl: homeTeamData.logoUrl || null,
            awayTeamId: formData.awayTeamId,
            awayTeamClubId: awayTeamData.clubId,
            awayTeamName: awayTeamData.name,
            awayTeamLogoUrl: awayTeamData.logoUrl || null,
            location: formData.location,
            status: 'scheduled',
            seasonId: formData.seasonId,
            competitionCategoryId: formData.competitionCategoryId,
            gameFormatId: formData.gameFormatId || null,
            createdBy: userId,
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
        
        const homeTeamPlayers = playersByTeam.get(homeTeamId) || [];
        const awayTeamPlayers = playersByTeam.get(awayTeamId) || [];

        if (homeTeamPlayers.length < 5 || awayTeamPlayers.length < 5) {
            return { success: false, error: "Selected teams for test game do not have enough players (min 5)." };
        }

        const [homeTeamSnap, awayTeamSnap] = await Promise.all([
            adminDb.collection('teams').doc(homeTeamId).get(),
            adminDb.collection('teams').doc(awayTeamId).get(),
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
        
        const homeTeamPlayerIds = homeTeamPlayers.map(p => p.id);
        const awayTeamPlayerIds = awayTeamPlayers.map(p => p.id);
        
        const homeTeamOnCourtPlayerIds = homeTeamPlayerIds.slice(0, 5);
        const awayTeamOnCourtPlayerIds = awayTeamPlayers.slice(0, 5);
        
        const gameDateTime = new Date();
        const initialTeamStats: TeamStats = { onePointAttempts: 0, onePointMade: 0, twoPointAttempts: 0, twoPointMade: 0, threePointAttempts: 0, threePointMade: 0, fouls: 0, timeouts: 0, reboundsOffensive: 0, reboundsDefensive: 0, assists: 0, steals: 0, blocks: 0, turnovers: 0, blocksAgainst: 0, foulsReceived: 0, };
        
        const playerStats: { [playerId: string]: Partial<PlayerGameStats> } = {};
        [...homeTeamPlayers, ...awayTeamPlayers].forEach(player => {
            playerStats[player.id] = { ...initialPlayerStats, playerId: player.id, playerName: `${player.firstName} ${player.lastName}` };
        });

        const newGameData: Omit<Game, 'id' | 'createdAt' | 'updatedAt' | 'date'> = {
            homeTeamId, homeTeamClubId: homeTeamData.clubId, homeTeamName: homeTeamData.name, homeTeamLogoUrl: homeTeamData.logoUrl || null,
            awayTeamId, awayTeamClubId: awayTeamData.clubId, awayTeamName: awayTeamData.name, awayTeamLogoUrl: awayTeamData.logoUrl || null,
            location: 'Pista de Pruebas', status: 'scheduled',
            seasonId, competitionCategoryId, gameFormatId,
            createdBy: userId,
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

          if (updates.isTimerRunning === true && gameData.isTimerRunning === false) {
              finalUpdates.timerStartedAt = admin.firestore.FieldValue.serverTimestamp();
          } 
          else if (updates.isTimerRunning === false && gameData.isTimerRunning === true) {
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
            
            if (gameData.isTimerRunning === true && gameData.periodTimeRemainingSeconds !== undefined && gameData.timerStartedAt) {
                 const serverStopTime = Date.now();
                 const serverStartTime = (new Date(gameData.timerStartedAt as string)).getTime();
                 const elapsedSeconds = Math.max(0, Math.floor((serverStopTime - serverStartTime) / 1000));
                 
                 onCourtIds.forEach(pId => {
                    finalUpdates[`playerStats.${pId}.timePlayedSeconds`] = admin.firestore.FieldValue.increment(elapsedSeconds);
                 });
            } else if (gameData.isTimerRunning === false) {
                 const timeRemaining = typeof gameData.periodTimeRemainingSeconds === 'number' ? gameData.periodTimeRemainingSeconds : totalPeriodDuration;
                 const timePlayedThisRun = totalPeriodDuration - timeRemaining;
                 if (timePlayedThisRun > 0) {
                     onCourtIds.forEach(pId => {
                         finalUpdates[`playerStats.${pId}.timePlayedSeconds`] = admin.firestore.FieldValue.increment(timePlayedThisRun);
                     });
                 }
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

const calculatePir = (stats: PlayerGameStats): number => {
    const points = stats.points || 0;
    const rebounds = (stats.reb_def || 0) + (stats.reb_off || 0);
    const assists = stats.assists || 0;
    const steals = stats.steals || 0;
    const blocks = stats.blocks || 0;
    const foulsDrawn = stats.fouls_received || 0;

    const missedFG = (stats.shots_attempted_2p || 0) - (stats.shots_made_2p || 0) + 
                     ((stats.shots_attempted_3p || 0) - (stats.shots_made_3p || 0));
    const missedFT = (stats.shots_attempted_1p || 0) - (stats.shots_made_1p || 0);
    const turnovers = stats.turnovers || 0;
    const shotsRejected = stats.blocks_against || 0;
    const foulsCommitted = stats.fouls || 0;
    
    const positive = points + rebounds + assists + steals + blocks + foulsDrawn;
    const negative = missedFG + missedFT + turnovers + shotsRejected + foulsCommitted;

    return positive - negative;
};


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
            
            const finalUpdates: { [key: string]: any } = { updatedAt: admin.firestore.FieldValue.serverTimestamp() };
            const playerStatsUpdates: { [playerId: string]: Partial<PlayerGameStats> } = {};

            const getPlayerStats = (pId: string): PlayerGameStats => {
                 const originalStats = gameData.playerStats?.[pId] || { ...initialPlayerStats, playerId: pId };
                 const currentUpdates = playerStatsUpdates[pId] || {};
                 return { ...originalStats, ...currentUpdates } as PlayerGameStats;
            }

            const updatePlayerStat = (pId: string, field: keyof PlayerGameStats, value: any) => {
                if (!playerStatsUpdates[pId]) playerStatsUpdates[pId] = {};
                (playerStatsUpdates[pId] as any)[field] = value;
            }

            const incrementPlayerStat = (pId: string, field: keyof PlayerGameStats, amount: number) => {
                const currentVal = getPlayerStats(pId)[field] || 0;
                updatePlayerStat(pId, field, (currentVal as number) + amount);
            }
            
            const actionHandlers: Partial<Record<GameEventAction, () => void>> = {
                shot_made_1p: () => { incrementPlayerStat(playerId, 'points', 1); incrementPlayerStat(playerId, 'shots_made_1p', 1); incrementPlayerStat(playerId, 'shots_attempted_1p', 1); finalUpdates[`${teamId}TeamScore`]=admin.firestore.FieldValue.increment(1); },
                shot_miss_1p: () => { incrementPlayerStat(playerId, 'shots_attempted_1p', 1); },
                shot_made_2p: () => { incrementPlayerStat(playerId, 'points', 2); incrementPlayerStat(playerId, 'shots_made_2p', 1); incrementPlayerStat(playerId, 'shots_attempted_2p', 1); finalUpdates[`${teamId}TeamScore`]=admin.firestore.FieldValue.increment(2); },
                shot_miss_2p: () => { incrementPlayerStat(playerId, 'shots_attempted_2p', 1); },
                shot_made_3p: () => { incrementPlayerStat(playerId, 'points', 3); incrementPlayerStat(playerId, 'shots_made_3p', 1); incrementPlayerStat(playerId, 'shots_attempted_3p', 1); finalUpdates[`${teamId}TeamScore`]=admin.firestore.FieldValue.increment(3); },
                shot_miss_3p: () => { incrementPlayerStat(playerId, 'shots_attempted_3p', 1); },
                rebound_defensive: () => { incrementPlayerStat(playerId, 'reb_def', 1); finalUpdates[`${teamId}TeamStats.reboundsDefensive`]=admin.firestore.FieldValue.increment(1); },
                rebound_offensive: () => { incrementPlayerStat(playerId, 'reb_off', 1); finalUpdates[`${teamId}TeamStats.reboundsOffensive`]=admin.firestore.FieldValue.increment(1); },
                assist: () => { incrementPlayerStat(playerId, 'assists', 1); finalUpdates[`${teamId}TeamStats.assists`]=admin.firestore.FieldValue.increment(1); },
                steal: () => { incrementPlayerStat(playerId, 'steals', 1); finalUpdates[`${teamId}TeamStats.steals`]=admin.firestore.FieldValue.increment(1); },
                block: () => { incrementPlayerStat(playerId, 'blocks', 1); finalUpdates[`${teamId}TeamStats.blocks`]=admin.firestore.FieldValue.increment(1); },
                turnover: () => { incrementPlayerStat(playerId, 'turnovers', 1); finalUpdates[`${teamId}TeamStats.turnovers`]=admin.firestore.FieldValue.increment(1); },
                foul: () => { incrementPlayerStat(playerId, 'fouls', 1); finalUpdates[`${teamId}TeamStats.fouls`]=admin.firestore.FieldValue.increment(1); },
                block_against: () => { incrementPlayerStat(playerId, 'blocks_against', 1); finalUpdates[`${teamId}TeamStats.blocksAgainst`]=admin.firestore.FieldValue.increment(1); },
                foul_received: () => { incrementPlayerStat(playerId, 'fouls_received', 1); finalUpdates[`${teamId === 'home' ? 'away' : 'home'}TeamStats.fouls`]=admin.firestore.FieldValue.increment(1); },
            };
            
            if (actionHandlers[action]) { actionHandlers[action]!(); }

            if (action.startsWith('shot_made')) {
                const points = parseInt(action.charAt(10), 10);
                (gameData.homeTeamOnCourtPlayerIds || []).forEach((pId: string) => { incrementPlayerStat(pId, 'plusMinus', teamId === 'home' ? points : -points); });
                (gameData.awayTeamOnCourtPlayerIds || []).forEach((pId: string) => { incrementPlayerStat(pId, 'plusMinus', teamId === 'away' ? points : -points); });
            }

            for (const pId in playerStatsUpdates) {
                const finalPlayerStats = getPlayerStats(pId);
                const newPir = calculatePir(finalPlayerStats);
                updatePlayerStat(pId, 'pir', newPir);
                finalUpdates[`playerStats.${pId}`] = admin.firestore.FieldValue.delete();
            }
             transaction.update(gameRef, finalUpdates);

             for(const pId in playerStatsUpdates){
                transaction.set(gameRef, { playerStats: { [pId]: getPlayerStats(pId) } }, { merge: true });
             }

            transaction.set(eventRef, { ...eventData, gameId, createdAt: admin.firestore.FieldValue.serverTimestamp(), createdBy: userId });
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
            const serverStartTime = (new Date(gameData.timerStartedAt as string)).getTime();
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
