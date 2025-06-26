'use server';
import { adminDb } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { revalidatePath } from 'next/cache';
import type { Game, GameFormData, Team, TeamStats, StatCategory, GameEvent, GameEventAction, PlayerGameStats } from '@/types';
import { getTeamsByCoach as getCoachTeams } from '@/app/teams/actions';

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
        
        const initialStats: TeamStats = {
            onePointAttempts: 0, onePointMade: 0,
            twoPointAttempts: 0, twoPointMade: 0,
            threePointAttempts: 0, threePointMade: 0,
            fouls: 0, timeouts: 0, 
            reboundsOffensive: 0, reboundsDefensive: 0,
            assists: 0, steals: 0, blocks: 0, turnovers: 0,
            blocksAgainst: 0,
            foulsReceived: 0,
        };

        const newGameData = {
            homeTeamId: formData.homeTeamId,
            homeTeamClubId: homeTeamData.clubId,
            homeTeamName: homeTeamData.name,
            awayTeamId: formData.awayTeamId,
            awayTeamClubId: awayTeamData.clubId,
            awayTeamName: awayTeamData.name,
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
            scorerAssignments: {
                shots: null,
                fouls: null,
                timeouts: null,
                steals: null
            },
        };

        const docRef = await adminDb.collection('games').add(newGameData);
        revalidatePath('/games');
        return { success: true, id: docRef.id };

    } catch (error: any) {
        console.error('Error creating game:', error);
        return { success: false, error: error.message || "Failed to create game."};
    }
}

export async function getAllGames(): Promise<Game[]> {
    if (!adminDb) return [];
    try {
        const gamesRef = adminDb.collection('games');
        const snapshot = await gamesRef.get();
        const games = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                date: (data.date as admin.firestore.Timestamp).toDate().toISOString(),
                createdAt: data.createdAt ? (data.createdAt as admin.firestore.Timestamp).toDate().toISOString() : undefined,
                updatedAt: data.updatedAt ? (data.updatedAt as admin.firestore.Timestamp).toDate().toISOString() : undefined,
            } as Game;
        });
        return games;
    } catch (error: any) {
        console.error("Error fetching all games: ", error);
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
        } as Game;
    } catch (error: any) {
        return null;
    }
}

export async function getGameEvents(gameId: string): Promise<GameEvent[]> {
  if (!adminDb) return [];
  try {
    const eventsRef = adminDb.collection('games').doc(gameId).collection('events');
    const snapshot = await eventsRef.orderBy('createdAt', 'desc').limit(20).get();
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: (data.createdAt as admin.firestore.Timestamp).toDate().toISOString(),
      } as GameEvent;
    });
  } catch (error) {
    console.error("Error fetching game events:", error);
    return [];
  }
}

export async function getPlayerStatsForGame(gameId: string): Promise<PlayerGameStats[]> {
    if (!adminDb) return [];
    const eventsRef = adminDb.collection('games').doc(gameId).collection('events');
    const eventsSnap = await eventsRef.get();
    const events = eventsSnap.docs.map(doc => doc.data() as GameEvent);

    const playerStats: { [key: string]: Omit<PlayerGameStats, 'playerId'> } = {};

    const initializeStats = (playerId: string) => {
        if (!playerStats[playerId]) {
            playerStats[playerId] = {
                playerName: '', timePlayedSeconds: 0, periodsPlayed: 0,
                points: 0, shots_made_1p: 0, shots_attempted_1p: 0, shots_made_2p: 0, shots_attempted_2p: 0, shots_made_3p: 0, shots_attempted_3p: 0,
                reb_def: 0, reb_off: 0, assists: 0, steals: 0, blocks: 0, turnovers: 0, fouls: 0,
                blocks_against: 0, fouls_received: 0,
                pir: 0,
            };
        }
    };

    for (const event of events) {
        initializeStats(event.playerId);
        if (!playerStats[event.playerId].playerName) {
            playerStats[event.playerId].playerName = event.playerName;
        }

        switch (event.action) {
            case 'shot_made_1p':
                playerStats[event.playerId].points += 1;
                playerStats[event.playerId].shots_made_1p += 1;
                playerStats[event.playerId].shots_attempted_1p += 1;
                break;
            case 'shot_miss_1p':
                playerStats[event.playerId].shots_attempted_1p += 1;
                break;
            case 'shot_made_2p':
                playerStats[event.playerId].points += 2;
                playerStats[event.playerId].shots_made_2p += 1;
                playerStats[event.playerId].shots_attempted_2p += 1;
                break;
            case 'shot_miss_2p':
                playerStats[event.playerId].shots_attempted_2p += 1;
                break;
            case 'shot_made_3p':
                playerStats[event.playerId].points += 3;
                playerStats[event.playerId].shots_made_3p += 1;
                playerStats[event.playerId].shots_attempted_3p += 1;
                break;
            case 'shot_miss_3p':
                playerStats[event.playerId].shots_attempted_3p += 1;
                break;
            case 'rebound_defensive':
                playerStats[event.playerId].reb_def += 1;
                break;
            case 'rebound_offensive':
                playerStats[event.playerId].reb_off += 1;
                break;
            case 'assist':
                playerStats[event.playerId].assists += 1;
                break;
            case 'steal':
                playerStats[event.playerId].steals += 1;
                break;
            case 'block':
                playerStats[event.playerId].blocks += 1;
                break;
            case 'turnover':
                playerStats[event.playerId].turnovers += 1;
                break;
            case 'foul':
                playerStats[event.playerId].fouls += 1;
                break;
            case 'block_against':
                playerStats[event.playerId].blocks_against += 1;
                break;
            case 'foul_received':
                playerStats[event.playerId].fouls_received += 1;
                break;
        }
    }
    
    Object.values(playerStats).forEach(stats => {
        const totalRebounds = stats.reb_def + stats.reb_off;
        const fieldGoalsMade = stats.shots_made_2p + stats.shots_made_3p;
        const fieldGoalsAttempted = stats.shots_attempted_2p + stats.shots_attempted_3p;
        const freeThrowsMade = stats.shots_made_1p;
        const freeThrowsAttempted = stats.shots_attempted_1p;

        const missedFieldGoals = fieldGoalsAttempted - fieldGoalsMade;
        const missedFreeThrows = freeThrowsAttempted - freeThrowsMade;
        
        const pir = (stats.points + totalRebounds + stats.assists + stats.steals + stats.blocks + stats.fouls_received) - (missedFieldGoals + missedFreeThrows + stats.turnovers + stats.fouls + stats.blocks_against);
        stats.pir = isNaN(pir) ? 0 : pir;
    });

    return Object.entries(playerStats).map(([playerId, stats]) => ({
        playerId,
        ...stats,
    }));
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
  updates: Partial<Pick<Game, 'status' | 'currentPeriod' | 'periodTimeRemainingSeconds' | 'isTimerRunning'>>
): Promise<{ success: boolean; error?: string }> {
  if (!adminDb) return { success: false, error: "La base de datos no está inicializada." };
  
  const gameRef = adminDb.collection('games').doc(gameId);
  try {
    await adminDb.runTransaction(async (transaction) => {
        const gameDoc = await transaction.get(gameRef);
        if (!gameDoc.exists) throw new Error("El partido no existe.");
        
        const gameData = gameDoc.data() as Game;
        const updateData: { [key: string]: any } = { 
            ...updates,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        if (updates.status === 'inprogress' && gameData.status === 'scheduled') {
            const homeRoster = gameData.homeTeamPlayerIds || [];
            const awayRoster = gameData.awayTeamPlayerIds || [];

            if (homeRoster.length < 5 || awayRoster.length < 5) {
                throw new Error(`No se puede iniciar el partido. Se requieren al menos 5 jugadores por equipo. Local: ${homeRoster.length}, Visitante: ${awayRoster.length}.`);
            }
            
            updateData.homeTeamOnCourtPlayerIds = homeRoster.slice(0, 5);
            updateData.awayTeamOnCourtPlayerIds = awayRoster.slice(0, 5);
        }

        transaction.update(gameRef, updateData);
    });
    
    return { success: true };
  } catch (error: any) {
    console.error("Error al actualizar el estado del partido en vivo:", error);
    return { success: false, error: error.message || "No se pudo actualizar el estado del partido." };
  }
}

export async function recordGameEvent(
  gameId: string,
  event: Omit<GameEvent, 'id' | 'createdAt' | 'gameId'>
): Promise<{ success: boolean; error?: string }> {
  if (!adminDb) return { success: false, error: 'Database not initialized.' };

  const gameRef = adminDb.collection('games').doc(gameId);
  const eventRef = gameRef.collection('events').doc();
  const { action, teamId } = event;

  try {
    await adminDb.runTransaction(async (transaction) => {
      const updates: { [key: string]: any } = {
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      const statPrefix = teamId === 'home' ? 'homeTeamStats' : 'awayTeamStats';
      
      const pointMapping: { [key: string]: number } = {
        'shot_made_1p': 1, 'shot_made_2p': 2, 'shot_made_3p': 3,
      };

      if (pointMapping[action]) {
        const points = pointMapping[action];
        const scoreField = teamId === 'home' ? 'homeTeamScore' : 'awayTeamScore';
        updates[scoreField] = admin.firestore.FieldValue.increment(points);
      }

      const attemptMapping: { [key: string]: string } = {
        'shot_made_1p': 'onePointAttempts', 'shot_miss_1p': 'onePointAttempts',
        'shot_made_2p': 'twoPointAttempts', 'shot_miss_2p': 'twoPointAttempts',
        'shot_made_3p': 'threePointAttempts', 'shot_miss_3p': 'threePointAttempts',
      };

      if (attemptMapping[action]) {
        updates[`${statPrefix}.${attemptMapping[action]}`] = admin.firestore.FieldValue.increment(1);
      }
      
      const madeMapping: { [key: string]: string } = {
        'shot_made_1p': 'onePointMade', 'shot_made_2p': 'twoPointMade', 'shot_made_3p': 'threePointMade',
      };
       if (madeMapping[action]) {
        updates[`${statPrefix}.${madeMapping[action]}`] = admin.firestore.FieldValue.increment(1);
      }

      const otherStatsMapping: { [key in GameEventAction]?: string } = {
          'assist': 'assists',
          'steal': 'steals',
          'block': 'blocks',
          'turnover': 'turnovers',
          'foul': 'fouls',
          'rebound_offensive': 'reboundsOffensive',
          'rebound_defensive': 'reboundsDefensive',
          'block_against': 'blocksAgainst',
          'foul_received': 'foulsReceived',
      };

      if (otherStatsMapping[action]) {
          const statField = otherStatsMapping[action]!;
          updates[`${statPrefix}.${statField}`] = admin.firestore.FieldValue.increment(1);
      }
      
      transaction.set(eventRef, { ...event, gameId, createdAt: admin.firestore.FieldValue.serverTimestamp() });
      transaction.update(gameRef, updates);
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error recording game event:", error);
    return { success: false, error: error.message };
  }
}

export async function substitutePlayer(
    gameId: string, 
    teamId: 'home' | 'away', 
    playerInId: string, 
    playerOutId: string | null
): Promise<{ success: boolean; error?: string }> {
    if (!adminDb) return { success: false, error: 'La base de datos no está inicializada.' };

    const gameRef = adminDb.collection('games').doc(gameId);
    
    try {
        await adminDb.runTransaction(async (transaction) => {
            const gameDoc = await transaction.get(gameRef);
            if (!gameDoc.exists) throw new Error("Partido no encontrado.");

            const gameData = gameDoc.data() as Game;
            const onCourtField = teamId === 'home' ? 'homeTeamOnCourtPlayerIds' : 'awayTeamOnCourtPlayerIds';
            
            let onCourtIds: string[] = gameData[onCourtField] || [];
            
            if (playerOutId) {
                // Standard substitution: swap playerOut with playerIn
                const index = onCourtIds.indexOf(playerOutId);
                if (index > -1) {
                    onCourtIds[index] = playerInId;
                } else {
                    throw new Error("El jugador a sustituir no está en la pista.");
                }
            } else {
                // Adding a player to a non-full court
                if (onCourtIds.length >= 5) {
                    throw new Error("No puede haber más de 5 jugadores en pista.");
                }
                if (!onCourtIds.includes(playerInId)) {
                    onCourtIds.push(playerInId);
                }
            }

            transaction.update(gameRef, { [onCourtField]: onCourtIds });
        });
        return { success: true };
    } catch (error: any) {
        console.error("Error al sustituir jugador:", error);
        return { success: false, error: error.message };
    }
}
