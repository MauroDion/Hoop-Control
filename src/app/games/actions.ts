
'use server';
import { adminDb } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { revalidatePath } from 'next/cache';
import type { Game, GameFormData, Team, TeamStats, Player, GameEventAction, UserFirestoreProfile, StatCategory, PlayerGameStats, Season, GameFormat, GameEvent } from '@/types';
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
    reb_def: 0, reb_off: 0, assists: 0, steals: 0, blocks: 0, turnovers: 0,
    fouls: 0, blocks_against: 0, fouls_received: 0,
    pir: 0, plusMinus: 0
};

// --- Helper function to sync time ---
function calculateTimePlayedSync(
    gameData: Game
): { elapsedSeconds: number, newRemainingTime: number } {
    if (!gameData.isTimerRunning || !gameData.timerStartedAt) {
        return { elapsedSeconds: 0, newRemainingTime: gameData.periodTimeRemainingSeconds || 0 };
    }
    const timerStartedAtMs = new Date(gameData.timerStartedAt).getTime();
    if (isNaN(timerStartedAtMs)) {
         return { elapsedSeconds: 0, newRemainingTime: gameData.periodTimeRemainingSeconds || 0 };
    }
    const nowMs = Date.now();
    const elapsedSeconds = Math.max(0, Math.floor((nowMs - timerStartedAtMs) / 1000));
    const newRemainingTime = Math.max(0, (gameData.periodTimeRemainingSeconds || 0) - elapsedSeconds);
    return { elapsedSeconds, newRemainingTime };
}


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
            const allSeasons = await adminDb.collection('seasons').get();
            const activeSeasonDoc = allSeasons.docs.find(doc => doc.data().status === 'active');
            
            if (activeSeasonDoc) {
                seasonsSnapshot = { docs: [activeSeasonDoc] } as any;
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
        const initialTeamStats: TeamStats = { onePointAttempts: 0, onePointMade: 0, twoPointAttempts: 0, twoPointMade: 0, threePointAttempts: 0, threePointMade: 0, fouls: 0, timeouts: 0, reboundsOffensive: 0, reboundsDefensive: 0, assists: 0, steals: 0, blocks: 0, turnovers: 0, blocksAgainst: 0, foulsReceived: 0, };
        
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
  if (!adminDb) return { success: false, error: "Database not initialized." };
  
  try {
    const gameRef = adminDb.collection('games').doc(gameId);

    await adminDb.runTransaction(async (transaction) => {
        const gameDoc = await transaction.get(gameRef);
        if (!gameDoc.exists) throw new Error("Game not found.");

        let gameData = gameDoc.data() as Game;
        gameData.timerStartedAt = gameData.timerStartedAt ? (gameData.timerStartedAt as any).toDate().toISOString() : null;
        
        let finalUpdates: { [key: string]: any } = { ...updates, updatedAt: admin.firestore.FieldValue.serverTimestamp() };

        if (gameData.isTimerRunning) {
            const { elapsedSeconds, newRemainingTime } = calculateTimePlayedSync(gameData);
            if (elapsedSeconds > 0) {
                finalUpdates.periodTimeRemainingSeconds = newRemainingTime;
                
                const playerStatsCopy = JSON.parse(JSON.stringify(gameData.playerStats || {}));
                const onCourtIds = [...(gameData.homeTeamOnCourtPlayerIds || []), ...(gameData.awayTeamOnCourtPlayerIds || [])];
                onCourtIds.forEach(pId => {
                    if (playerStatsCopy[pId]) {
                        playerStatsCopy[pId].timePlayedSeconds = (playerStatsCopy[pId].timePlayedSeconds || 0) + elapsedSeconds;
                    }
                });
                finalUpdates.playerStats = playerStatsCopy;
            }
        }
        
        if (updates.isTimerRunning === true && !gameData.isTimerRunning) {
            finalUpdates.timerStartedAt = admin.firestore.FieldValue.serverTimestamp();
        } else if (updates.isTimerRunning === false && gameData.isTimerRunning) {
            finalUpdates.timerStartedAt = null;
        }

        if (updates.status === 'inprogress' && gameData.status === 'scheduled') {
            const gameFormatDoc = await adminDb.collection('gameFormats').doc(gameData.gameFormatId!).get();
            const gameFormat = gameFormatDoc.data() as GameFormat;
            finalUpdates.periodTimeRemainingSeconds = (gameFormat.periodDurationMinutes || 10) * 60;
        }

        transaction.update(gameRef, finalUpdates);
    });
    
    return { success: true };
  } catch (error: any) {
    console.error("Error updating live game state:", error);
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
            
            let gameData = gameDoc.data() as Game;
            gameData.timerStartedAt = gameData.timerStartedAt ? (gameData.timerStartedAt as any).toDate().toISOString() : null;

            if(!gameData.gameFormatId) throw new Error("Game format not defined for this game.");
            const gameFormatSnap = await adminDb.collection('gameFormats').doc(gameData.gameFormatId).get();
            if (!gameFormatSnap.exists) throw new Error("Game format not found");
            const gameFormat = gameFormatSnap.data() as GameFormat;
            
            let finalUpdates: { [key: string]: any } = { updatedAt: admin.firestore.FieldValue.serverTimestamp() };

            if(gameData.isTimerRunning) {
                const { elapsedSeconds, newRemainingTime } = calculateTimePlayedSync(gameData);
                const playerStatsCopy = JSON.parse(JSON.stringify(gameData.playerStats || {}));

                if (elapsedSeconds > 0) {
                    const onCourtIds = [...(gameData.homeTeamOnCourtPlayerIds || []), ...(gameData.awayTeamOnCourtPlayerIds || [])];
                    onCourtIds.forEach(pId => {
                        if (playerStatsCopy[pId]) {
                            playerStatsCopy[pId].timePlayedSeconds = (playerStatsCopy[pId].timePlayedSeconds || 0) + elapsedSeconds;
                        }
                    });
                }
                finalUpdates.playerStats = playerStatsCopy;
            }
            
            finalUpdates.isTimerRunning = false;
            finalUpdates.timerStartedAt = null;
            
            const currentPeriod = gameData.currentPeriod || 1;
            const maxPeriods = gameFormat.numPeriods || 4;
            
            const onCourtIds = [...(gameData.homeTeamOnCourtPlayerIds || []), ...(gameData.awayTeamOnCourtPlayerIds || [])];
            const playerStatsForPeriodUpdate = JSON.parse(JSON.stringify(finalUpdates.playerStats || gameData.playerStats || {}));
            onCourtIds.forEach(pId => {
                if (playerStatsForPeriodUpdate[pId]) {
                    const periodsPlayedSet = new Set(playerStatsForPeriodUpdate[pId].periodsPlayedSet || []);
                    periodsPlayedSet.add(currentPeriod);
                    playerStatsForPeriodUpdate[pId].periodsPlayedSet = Array.from(periodsPlayedSet);
                    playerStatsForPeriodUpdate[pId].periodsPlayed = periodsPlayedSet.size;
                }
            });
            finalUpdates.playerStats = playerStatsForPeriodUpdate;

            if (currentPeriod < maxPeriods) {
                finalUpdates.currentPeriod = currentPeriod + 1;
                finalUpdates.periodTimeRemainingSeconds = (gameFormat.periodDurationMinutes || 10) * 60;
            } else {
                finalUpdates.status = 'completed';
                finalUpdates.periodTimeRemainingSeconds = 0;
            }

            transaction.update(gameRef, finalUpdates);
        });
        return { success: true };
    } catch (error: any) {
        console.error("Error ending period:", error);
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
            let gameData = gameDoc.data() as Game;
             gameData.timerStartedAt = gameData.timerStartedAt ? (gameData.timerStartedAt as any).toDate().toISOString() : null;
            
            let playerStatsCopy = JSON.parse(JSON.stringify(gameData.playerStats || {}));
            const serverTimestamp = admin.firestore.FieldValue.serverTimestamp();
            let finalUpdates: { [key: string]: any } = { updatedAt: serverTimestamp };

            const { elapsedSeconds, newRemainingTime } = calculateTimePlayedSync(gameData);
            if (elapsedSeconds > 0) {
                finalUpdates.periodTimeRemainingSeconds = newRemainingTime;
                finalUpdates.timerStartedAt = serverTimestamp;
                const onCourtIds = [...(gameData.homeTeamOnCourtPlayerIds || []), ...(gameData.awayTeamOnCourtPlayerIds || [])];
                onCourtIds.forEach(pId => {
                    if (playerStatsCopy[pId]) {
                        playerStatsCopy[pId].timePlayedSeconds = (playerStatsCopy[pId].timePlayedSeconds || 0) + elapsedSeconds;
                    }
                });
            }

            const { action, teamId, playerId } = eventData;
            
            if (playerId && !playerStatsCopy[playerId]) {
                const playerDoc = await adminDb.collection('players').doc(playerId).get();
                const playerName = playerDoc.exists ? `${playerDoc.data()?.firstName} ${playerDoc.data()?.lastName}` : 'Unknown Player';
                playerStatsCopy[playerId] = { ...initialPlayerStats, playerId, playerName };
            }
            const currentPlayerStats = playerId ? playerStatsCopy[playerId] : null;

            const scoreField = `${teamId}TeamScore`;
            const statsField = `${teamId}TeamStats`;
            
             if (action === 'timeout') {
                if(!gameData.gameFormatId) throw new Error("Game format not defined for this game.");
                const gameFormatSnap = await adminDb.collection('gameFormats').doc(gameData.gameFormatId).get();
                if (!gameFormatSnap.exists) throw new Error("Game format not found");
                const gameFormat = gameFormatSnap.data() as GameFormat;
                const requiredPlayers = gameFormat.name?.includes('3v3') ? 3 : 5;
                const teamOnCourtCount = (teamId === 'home' ? gameData.homeTeamOnCourtPlayerIds?.length : gameData.awayTeamOnCourtPlayerIds?.length) ?? 0;
                if (teamOnCourtCount !== requiredPlayers) {
                    throw new Error(`El equipo debe tener ${requiredPlayers} jugadores en pista para pedir tiempo muerto.`);
                }
            }

            const actionHandlers: Partial<Record<GameEventAction, () => void>> = {
                shot_made_1p: () => { if(currentPlayerStats) { currentPlayerStats.points+=1; currentPlayerStats.shots_made_1p+=1; currentPlayerStats.shots_attempted_1p+=1; finalUpdates[scoreField] = (finalUpdates[scoreField] ?? gameData[scoreField] ?? 0) + 1; }},
                shot_miss_1p: () => { if(currentPlayerStats) { currentPlayerStats.shots_attempted_1p+=1; }},
                shot_made_2p: () => { if(currentPlayerStats) { currentPlayerStats.points+=2; currentPlayerStats.shots_made_2p+=1; currentPlayerStats.shots_attempted_2p+=1; finalUpdates[scoreField] = (finalUpdates[scoreField] ?? gameData[scoreField] ?? 0) + 2; }},
                shot_miss_2p: () => { if(currentPlayerStats) { currentPlayerStats.shots_attempted_2p+=1; }},
                shot_made_3p: () => { if(currentPlayerStats) { currentPlayerStats.points+=3; currentPlayerStats.shots_made_3p+=1; currentPlayerStats.shots_attempted_3p+=1; finalUpdates[scoreField] = (finalUpdates[scoreField] ?? gameData[scoreField] ?? 0) + 3; }},
                shot_miss_3p: () => { if(currentPlayerStats) { currentPlayerStats.shots_attempted_3p+=1; }},
                rebound_defensive: () => { if(currentPlayerStats) { currentPlayerStats.reb_def+=1; finalUpdates[`${statsField}.reboundsDefensive`] = (gameData[statsField]?.reboundsDefensive || 0) + 1; }},
                rebound_offensive: () => { if(currentPlayerStats) { currentPlayerStats.reb_off+=1; finalUpdates[`${statsField}.reboundsOffensive`] = (gameData[statsField]?.reboundsOffensive || 0) + 1; }},
                assist: () => { if(currentPlayerStats) { currentPlayerStats.assists+=1; finalUpdates[`${statsField}.assists`] = (gameData[statsField]?.assists || 0) + 1; }},
                steal: () => { if(currentPlayerStats) { currentPlayerStats.steals+=1; finalUpdates[`${statsField}.steals`] = (gameData[statsField]?.steals || 0) + 1; }},
                block: () => { if(currentPlayerStats) { currentPlayerStats.blocks+=1; finalUpdates[`${statsField}.blocks`] = (gameData[statsField]?.blocks || 0) + 1; }},
                turnover: () => { if(currentPlayerStats) { currentPlayerStats.turnovers+=1; finalUpdates[`${statsField}.turnovers`] = (gameData[statsField]?.turnovers || 0) + 1; }},
                foul: () => { if(currentPlayerStats) { currentPlayerStats.fouls+=1; finalUpdates[`${statsField}.fouls`] = (gameData[statsField]?.fouls || 0) + 1; }},
                block_against: () => { if(currentPlayerStats) { currentPlayerStats.blocks_against+=1; }},
                foul_received: () => { if(currentPlayerStats) { currentPlayerStats.fouls_received+=1; }},
                team_foul: () => { finalUpdates[`${statsField}.fouls`] = (gameData[statsField]?.fouls || 0) + 1 },
                timeout: () => { finalUpdates[`${statsField}.timeouts`] = (gameData[statsField]?.timeouts || 0) + 1 },
            };
            
            if (actionHandlers[action]) {
                actionHandlers[action]!();
            }

            if (action.startsWith('shot_made')) {
                const points = parseInt(action.charAt(10), 10);
                
                (gameData.homeTeamOnCourtPlayerIds || []).forEach((pId: string) => {
                    if (!playerStatsCopy[pId]) playerStatsCopy[pId] = {...initialPlayerStats, playerId: pId, playerName: 'On-Court Player'};
                    playerStatsCopy[pId].plusMinus = (playerStatsCopy[pId].plusMinus || 0) + (teamId === 'home' ? points : -points);
                });
                (gameData.awayTeamOnCourtPlayerIds || []).forEach((pId: string) => {
                    if (!playerStatsCopy[pId]) playerStatsCopy[pId] = {...initialPlayerStats, playerId: pId, playerName: 'On-Court Player'};
                     playerStatsCopy[pId].plusMinus = (playerStatsCopy[pId].plusMinus || 0) + (teamId === 'away' ? points : -points);
                });
            }

            if (currentPlayerStats) {
                 const { points, reb_off, reb_def, assists, steals, blocks, fouls_received, shots_attempted_2p, shots_attempted_3p, shots_made_2p, shots_made_3p, shots_attempted_1p, shots_made_1p, turnovers, fouls, blocks_against } = currentPlayerStats;
                 currentPlayerStats.pir = (points + (reb_off || 0) + (reb_def || 0) + assists + steals + blocks + fouls_received) - ((shots_attempted_2p + shots_attempted_3p - (shots_made_2p + shots_made_3p)) + (shots_attempted_1p - shots_made_1p) + turnovers + fouls + blocks_against);
            }
            
            finalUpdates.playerStats = playerStatsCopy;
            
            const eventGameTime = finalUpdates.periodTimeRemainingSeconds ?? gameData.periodTimeRemainingSeconds ?? 0;
            transaction.set(eventRef, { ...eventData, gameId, createdBy: userId, createdAt: serverTimestamp, gameTimeSeconds: eventGameTime });
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

        let gameData = gameDoc.data() as Game;
        gameData.timerStartedAt = gameData.timerStartedAt ? (gameData.timerStartedAt as any).toDate().toISOString() : null;
        
        const onCourtField = teamType === 'home' ? 'homeTeamOnCourtPlayerIds' : 'awayTeamOnCourtPlayerIds';
        let onCourtIds = (gameData[onCourtField] as string[] || []);
        
        const serverTimestamp = admin.firestore.FieldValue.serverTimestamp();
        let finalUpdates: { [key: string]: any } = { updatedAt: serverTimestamp };
        const baseEventPayload = { gameId, teamId: teamType, period, gameTimeSeconds, createdAt: serverTimestamp, createdBy: userId };
        
        let newPlayerStats = JSON.parse(JSON.stringify(gameData.playerStats || {}));
        const { elapsedSeconds, newRemainingTime } = calculateTimePlayedSync(gameData);
        if (elapsedSeconds > 0) {
            finalUpdates.periodTimeRemainingSeconds = newRemainingTime;
            finalUpdates.timerStartedAt = serverTimestamp;
            const currentOnCourt = [...(gameData.homeTeamOnCourtPlayerIds || []), ...(gameData.awayTeamOnCourtPlayerIds || [])];
            currentOnCourt.forEach(pId => {
                if (newPlayerStats[pId]) {
                    newPlayerStats[pId].timePlayedSeconds = (newPlayerStats[pId].timePlayedSeconds || 0) + elapsedSeconds;
                }
            });
        }

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

            if (!newPlayerStats[playerIn.id]) {
                newPlayerStats[playerIn.id] = { ...initialPlayerStats, playerId: playerIn.id, playerName: playerIn.name };
            }
        } else {
            throw new Error("Player is already on court.");
        }

        finalUpdates[onCourtField] = onCourtIds;
        finalUpdates.playerStats = newPlayerStats;
        transaction.update(gameRef, finalUpdates);
    });
    return { success: true };
  } catch (error: any) {
    console.error("Error substituting player:", error);
    return { success: false, error: error.message };
  }
}

