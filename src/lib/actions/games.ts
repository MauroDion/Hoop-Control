

'use server';
import { adminDb } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { revalidatePath } from 'next/cache';
import type { Game, GameFormData, Team, TeamStats, Player, GameEventAction, UserFirestoreProfile, StatCategory, PlayerGameStats, Season, GameFormat, GameEvent } from '@/types';
import { getTeamsByCoach as getCoachTeams } from '@/app/teams/actions';
import { getUserProfileById } from '@/lib/actions/users/get-user-profile';
import { getPlayersFromIds } from '@/app/players/actions';
import { getGameFormatById as getFormat } from '@/lib/actions/game-formats';


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

const gameToSerializable = (doc: admin.firestore.DocumentSnapshot): Game => {
    const data = doc.data()!;
    return {
        id: doc.id,
        ...data,
        date: (data.date as admin.firestore.Timestamp).toDate().toISOString(),
        createdAt: data.createdAt ? (data.createdAt as admin.firestore.Timestamp).toDate().toISOString() : 'N/A',
        updatedAt: data.updatedAt ? (data.updatedAt as admin.firestore.Timestamp).toDate().toISOString() : 'N/A',
        timerStartedAt: data.timerStartedAt ? (data.timerStartedAt as admin.firestore.Timestamp).toDate().toISOString() : null,
    } as Game;
}

// --- Public Actions ---

export async function getAllGames(): Promise<Game[]> {
    if (!adminDb) return [];
    try {
        const gamesRef = adminDb.collection('games');
        const snapshot = await gamesRef.orderBy('date', 'desc').get();
        return snapshot.docs.map(gameToSerializable);
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
        
        homeGamesSnap.forEach(doc => gamesMap.set(doc.id, gameToSerializable(doc)));
        awayGamesSnap.forEach(doc => gamesMap.set(doc.id, gameToSerializable(doc)));

        const games = Array.from(gamesMap.values());
        games.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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
    if (!adminDb || !userId) return [];
    try {
        const coachTeams = await getCoachTeams(userId);
        if (coachTeams.length === 0) return [];
        const teamIds = coachTeams.map(team => team.id);
        
        if (teamIds.length === 0) return [];

        const gamesRef = adminDb.collection('games');
        // Firestore 'in' queries are limited to 30 values.
        // We will need to chunk if a coach has more than 30 teams.
        const teamIdChunks: string[][] = [];
        for (let i = 0; i < teamIds.length; i += 30) {
            teamIdChunks.push(teamIds.slice(i, i + 30));
        }

        const gamePromises: Promise<admin.firestore.QuerySnapshot<admin.firestore.DocumentData>>[] = [];
        teamIdChunks.forEach(chunk => {
            const homeQuery = gamesRef.where('homeTeamId', 'in', chunk).get();
            const awayQuery = gamesRef.where('awayTeamId', 'in', chunk).get();
            gamePromises.push(homeQuery, awayQuery);
        });

        const gameSnapshots = await Promise.all(gamePromises);
        
        const gamesMap = new Map<string, Game>();
        gameSnapshots.forEach(snapshot => {
            snapshot.forEach(doc => gamesMap.set(doc.id, gameToSerializable(doc)));
        });

        const games = Array.from(gamesMap.values());
        games.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return games;
    } catch (error: any) {
        console.error("Error fetching games by coach:", error);
        return [];
    }
}

export async function getGamesByParent(userId: string): Promise<Game[]> {
    if (!adminDb || !userId) return [];
    try {
        const profile = await getUserProfileById(userId);
        if (!profile || profile.profileTypeId !== 'parent_guardian' || !profile.children || profile.children.length === 0) {
            return []; 
        }

        const childrenPlayerIds = Array.from(new Set(profile.children.map(c => c.playerId)));
        if (childrenPlayerIds.length === 0) return [];
        
        const allPlayers = await getPlayersFromIds(childrenPlayerIds);
        const teamIds = Array.from(new Set(allPlayers.map(p => p.teamId).filter((id): id is string => !!id)));
        if (teamIds.length === 0) return [];
        
        const gamesRef = adminDb.collection('games');
        const homeGamesQuery = gamesRef.where('homeTeamId', 'in', teamIds).get();
        const awayGamesQuery = gamesRef.where('awayTeamId', 'in', teamIds).get();

        const [homeGamesSnap, awayGamesSnap] = await Promise.all([homeGamesQuery, awayGamesQuery]);

        const gamesMap = new Map<string, Game>();
        homeGamesSnap.forEach(doc => gamesMap.set(doc.id, gameToSerializable(doc)));
        awayGamesSnap.forEach(doc => gamesMap.set(doc.id, gameToSerializable(doc)));

        const games = Array.from(gamesMap.values());
        games.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return games;

    } catch (error: any) {
        console.error("Error fetching games by parent:", error);
        return [];
    }
}

export async function getGameById(gameId: string): Promise<Game | null> {
    if (!adminDb || !gameId) return null;
    try {
        const gameRef = adminDb.collection('games').doc(gameId);
        const docSnap = await gameRef.get();
        if (!docSnap.exists) {
            return null;
        }
        return gameToSerializable(docSnap);
    } catch (error: any) {
        return null;
    }
}

export async function createGame(formData: GameFormData, userId: string): Promise<{ success: boolean; error?: string; id?: string }> {
    if (!userId) return { success: false, error: "User not authenticated." };
    if (!adminDb) return { success: false, error: "Database not initialized."};

    try {
        const [homeTeamSnap, awayTeamSnap, gameFormat] = await Promise.all([
            adminDb.collection('teams').doc(formData.homeTeamId).get(),
            adminDb.collection('teams').doc(formData.awayTeamId).get(),
            formData.gameFormatId ? getFormat(formData.gameFormatId) : Promise.resolve(null),
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

        const initialTime = (gameFormat?.periodDurationMinutes ?? 10) * 60;

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
            teamFoulsByPeriod: { home: {}, away: {} },
            currentPeriod: 1,
            isTimerRunning: false,
            periodTimeRemainingSeconds: initialTime,
            homeTeamPlayerIds: [],
            awayTeamPlayerIds: [],
            homeTeamOnCourtPlayerIds: [],
            awayTeamOnCourtPlayerIds: [],
            timerStartedAt: null,
            scorerAssignments: {},
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
        
        const gameFormat = gameFormatId ? await getFormat(gameFormatId) : null;
        const initialTime = (gameFormat?.periodDurationMinutes ?? 10) * 60;
        
        const homeTeamPlayerIds = homeTeamPlayers.map(p => p.id);
        const awayTeamPlayerIds = awayTeamPlayers.map(p => p.id);
        
        const homeTeamOnCourtPlayerIds = homeTeamPlayerIds.slice(0, 5);
        const awayTeamOnCourtPlayerIds = awayTeamPlayerIds.slice(0, 5);
        
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
            teamFoulsByPeriod: { home: {}, away: {} },
            currentPeriod: 1, isTimerRunning: false, periodTimeRemainingSeconds: initialTime,
            homeTeamPlayerIds, awayTeamPlayerIds, homeTeamOnCourtPlayerIds, awayTeamOnCourtPlayerIds,
            timerStartedAt: null, scorerAssignments: {},
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

          if (updates.isTimerRunning === true && !gameData.isTimerRunning) {
              finalUpdates.timerStartedAt = admin.firestore.FieldValue.serverTimestamp();
          } else if (updates.isTimerRunning === false && gameData.isTimerRunning) {
              const timerStartedAtMs = (gameData.timerStartedAt as admin.firestore.Timestamp)?.toMillis();
              if (timerStartedAtMs) {
                  const elapsedSeconds = Math.floor((Date.now() - timerStartedAtMs) / 1000);
                  const newTimeRemaining = Math.max(0, (gameData.periodTimeRemainingSeconds ?? 0) - elapsedSeconds);
                  finalUpdates.periodTimeRemainingSeconds = newTimeRemaining;
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
            const format = gameData.gameFormatId ? await getFormat(gameData.gameFormatId) : null;
            if (gameData.gameFormatId && !format) throw new Error("Game format not found");
            
            const totalPeriodDuration = (format?.periodDurationMinutes ?? 10) * 60;
            const currentPeriod = gameData.currentPeriod ?? 1;
            const finalUpdates: { [key: string]: any } = {};
            const playerStatsCopy = JSON.parse(JSON.stringify(gameData.playerStats || {}));

            // --- TIME PLAYED CALCULATION ---
            const onCourtIds = [...(gameData.homeTeamOnCourtPlayerIds || []), ...(gameData.awayTeamOnCourtPlayerIds || [])];
            
            // Calculate time played this period. It's the total duration minus whatever was left.
            const timeRemaining = gameData.periodTimeRemainingSeconds ?? 0;
            const timePlayedInPeriod = totalPeriodDuration - timeRemaining;

            if (timePlayedInPeriod > 0) {
                 onCourtIds.forEach(pId => {
                    if (!playerStatsCopy[pId]) playerStatsCopy[pId] = { ...initialPlayerStats };
                    playerStatsCopy[pId].timePlayedSeconds = (playerStatsCopy[pId].timePlayedSeconds || 0) + timePlayedInPeriod;
                 });
            }
            finalUpdates.playerStats = playerStatsCopy;
            // --- END TIME PLAYED CALCULATION ---
            
            const maxPeriods = format?.numPeriods ?? 4;
            if (currentPeriod < maxPeriods) {
                finalUpdates.currentPeriod = currentPeriod + 1;
                finalUpdates.periodTimeRemainingSeconds = totalPeriodDuration;
            } else {
                finalUpdates.status = 'completed';
                finalUpdates.periodTimeRemainingSeconds = 0;
            }
            
            finalUpdates.isTimerRunning = false;
            finalUpdates.timerStartedAt = null;
            finalUpdates.homeTeamOnCourtPlayerIds = [];
            finalUpdates.awayTeamOnCourtPlayerIds = [];
            finalUpdates.updatedAt = admin.firestore.FieldValue.serverTimestamp();
            
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
                    transaction.update(gameRef, { [`scorerAssignments.${category}`]: admin.firestore.FieldValue.delete() });
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
            
            // Create a deep copy of the game data to modify in memory
            const newGameData = JSON.parse(JSON.stringify(gameData));
            const newPlayerStats: { [key: string]: PlayerGameStats } = newGameData.playerStats || {};

            const getPlayerStats = (pId: string): PlayerGameStats => {
                 if (!newPlayerStats[pId]) {
                    newPlayerStats[pId] = { ...initialPlayerStats, playerId: pId, playerName: '' };
                }
                return newPlayerStats[pId];
            };

            const actingPlayerStats = getPlayerStats(playerId);
            actingPlayerStats.playerName = eventData.playerName;

            if (action === 'foul' && (actingPlayerStats.fouls || 0) >= 5) {
                throw new Error("El jugador ya tiene 5 faltas y está expulsado.");
            }

            let pointsScored = 0;
            switch(action) {
                case 'shot_made_1p': actingPlayerStats.points += 1; actingPlayerStats.shots_made_1p += 1; actingPlayerStats.shots_attempted_1p += 1; pointsScored = 1; break;
                case 'shot_miss_1p': actingPlayerStats.shots_attempted_1p += 1; break;
                case 'shot_made_2p': actingPlayerStats.points += 2; actingPlayerStats.shots_made_2p += 1; actingPlayerStats.shots_attempted_2p += 1; pointsScored = 2; break;
                case 'shot_miss_2p': actingPlayerStats.shots_attempted_2p += 1; break;
                case 'shot_made_3p': actingPlayerStats.points += 3; actingPlayerStats.shots_made_3p += 1; actingPlayerStats.shots_attempted_3p += 1; pointsScored = 3; break;
                case 'shot_miss_3p': actingPlayerStats.shots_attempted_3p += 1; break;
                case 'rebound_defensive': actingPlayerStats.reb_def += 1; break;
                case 'rebound_offensive': actingPlayerStats.reb_off += 1; break;
                case 'assist': actingPlayerStats.assists += 1; break;
                case 'steal': actingPlayerStats.steals += 1; break;
                case 'block': actingPlayerStats.blocks += 1; break;
                case 'turnover': actingPlayerStats.turnovers += 1; break;
                case 'block_against': actingPlayerStats.blocks_against += 1; break;
                case 'foul': actingPlayerStats.fouls += 1; break;
                case 'foul_received': actingPlayerStats.fouls_received += 1; break;
            }
            
            if (pointsScored > 0) {
                if (teamId === 'home') newGameData.homeTeamScore += pointsScored;
                else newGameData.awayTeamScore += pointsScored;
                
                (newGameData.homeTeamOnCourtPlayerIds || []).forEach((pId: string) => { getPlayerStats(pId).plusMinus += (teamId === 'home' ? pointsScored : -pointsScored) });
                (newGameData.awayTeamOnCourtPlayerIds || []).forEach((pId: string) => { getPlayerStats(pId).plusMinus += (teamId === 'away' ? pointsScored : -pointsScored) });
            }
            
            const affectedPlayerIds = new Set<string>([playerId]);
            if(pointsScored > 0) {
                (newGameData.homeTeamOnCourtPlayerIds || []).forEach((pId: string) => affectedPlayerIds.add(pId));
                (newGameData.awayTeamOnCourtPlayerIds || []).forEach((pId: string) => affectedPlayerIds.add(pId));
            }
            
            affectedPlayerIds.forEach(pId => {
                const stats = getPlayerStats(pId);
                if (stats) stats.pir = calculatePir(stats);
            });
            
            if (action === 'foul') {
                const teamFouls = newGameData.teamFoulsByPeriod[teamId]?.[gameData.currentPeriod] || 0;
                if (!newGameData.teamFoulsByPeriod[teamId]) newGameData.teamFoulsByPeriod[teamId] = {};
                newGameData.teamFoulsByPeriod[teamId][gameData.currentPeriod] = teamFouls + 1;
                
                if (actingPlayerStats.fouls >= 5) {
                   const onCourtField = teamId === 'home' ? 'homeTeamOnCourtPlayerIds' : 'awayTeamOnCourtPlayerIds';
                   newGameData[onCourtField] = (newGameData[onCourtField] || []).filter((id: string) => id !== playerId);
                }
            }
            
            const finalUpdates: {[key:string]: any} = {
                homeTeamScore: newGameData.homeTeamScore,
                awayTeamScore: newGameData.awayTeamScore,
                playerStats: newPlayerStats,
                teamFoulsByPeriod: newGameData.teamFoulsByPeriod,
                homeTeamOnCourtPlayerIds: newGameData.homeTeamOnCourtPlayerIds,
                awayTeamOnCourtPlayerIds: newGameData.awayTeamOnCourtPlayerIds,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            };

            transaction.update(gameRef, finalUpdates);
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
        const finalUpdates: { [key: string]: any } = { updatedAt: admin.firestore.FieldValue.serverTimestamp() };

        if ((gameData.playerStats?.[playerIn.id]?.fouls || 0) >= 5) {
            throw new Error(`El jugador ${playerIn.name} está expulsado y no puede entrar.`);
        }
        
        const onCourtField = teamType === 'home' ? 'homeTeamOnCourtPlayerIds' : 'awayTeamOnCourtPlayerIds';
        let onCourtIds = [...(gameData[onCourtField] as string[] || [])];
        
        const baseEventPayload = { gameId, teamId: teamType, period, gameTimeSeconds, createdAt: admin.firestore.FieldValue.serverTimestamp(), createdBy: userId };

        if (playerOut) {
            onCourtIds = onCourtIds.filter(id => id !== playerOut.id);
            const eventOutRef = gameRef.collection('events').doc();
            transaction.set(eventOutRef, { ...baseEventPayload, action: 'substitution_out', playerId: playerOut.id, playerName: playerOut.name });
        }
        
        const gameFormatDoc = gameData.gameFormatId ? await adminDb.collection('gameFormats').doc(gameData.gameFormatId).get() : null;
        if(!gameFormatDoc || !gameFormatDoc.exists) throw new Error("Game format not found for substitution logic.");
        const requiredPlayers = gameFormatDoc.data()?.name?.includes('3v3') ? 3 : 5;

        if (onCourtIds.length >= requiredPlayers && !playerOut) {
             throw new Error(`La pista está llena (${requiredPlayers} jugadores). Debes seleccionar a un jugador para sustituir.`);
        }

        if (!onCourtIds.includes(playerIn.id)) {
            onCourtIds.push(playerIn.id);
            
            const eventInRef = gameRef.collection('events').doc();
            transaction.set(eventInRef, { ...baseEventPayload, action: 'substitution_in', playerId: playerIn.id, playerName: playerIn.name });

            // Ensure player stats object exists
            if (!gameData.playerStats?.[playerIn.id]) {
                finalUpdates[`playerStats.${playerIn.id}`] = { ...initialPlayerStats, playerId: playerIn.id, playerName: playerIn.name };
            }
            
            const currentPeriods = new Set(gameData.playerStats?.[playerIn.id]?.periodsPlayedSet || []);
            if (!currentPeriods.has(period)) {
                currentPeriods.add(period);
                 finalUpdates[`playerStats.${playerIn.id}.periodsPlayedSet`] = Array.from(currentPeriods);
                 finalUpdates[`playerStats.${playerIn.id}.periodsPlayed`] = admin.firestore.FieldValue.increment(1);
            }

        } else {
            throw new Error("El jugador ya está en la pista.");
        }
        
        finalUpdates[onCourtField] = onCourtIds;

        transaction.update(gameRef, finalUpdates);
    });
    return { success: true };
  } catch (error: any) {
    console.error("Error substituting player:", error);
    return { success: false, error: error.message };
  }
}
