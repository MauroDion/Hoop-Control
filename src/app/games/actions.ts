'use server';
import { adminDb } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { revalidatePath } from 'next/cache';
import type { Game, GameFormData, Team, TeamStats, Player, PlayerGameStats, GameEvent, GameEventAction } from '@/types';
import { getTeamsByCoach as getCoachTeams } from '@/app/teams/actions';

async function getPlayersFromIds(playerIds: string[]): Promise<Player[]> {
    if (!adminDb || !playerIds || playerIds.length === 0) return [];
    const playerRefs = playerIds.map(id => adminDb.collection('players').doc(id));
    const playerDocs = await adminDb.getAll(...playerRefs);
    return playerDocs
        .filter(doc => doc.exists)
        .map(doc => ({ id: doc.id, ...doc.data() } as Player));
}

// Action to create a new game
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

    const gameRef = adminDb.collection('games').doc(gameId);
    const [gameDoc, eventsSnap] = await Promise.all([
        gameRef.get(),
        gameRef.collection('events').orderBy('createdAt', 'asc').get()
    ]);

    if (!gameDoc.exists) return [];

    const gameData = { ...gameDoc.data(), createdAt: (gameDoc.data()?.createdAt as admin.firestore.Timestamp).toDate() } as Game;
    const events = eventsSnap.docs.map(doc => ({ ...doc.data(), createdAt: (doc.data().createdAt as admin.firestore.Timestamp).toDate() } as GameEvent));

    const stats: { [playerId: string]: PlayerGameStats } = {};

    const allPlayerIds = [...new Set([...(gameData.homeTeamPlayerIds || []), ...(gameData.awayTeamPlayerIds || [])])];
    if (allPlayerIds.length > 0) {
        const playerMap = new Map((await getPlayersFromIds(allPlayerIds)).map(p => [p.id, p]));

        allPlayerIds.forEach(playerId => {
            const player = playerMap.get(playerId);
            stats[playerId] = {
                playerId,
                playerName: player ? `${player.firstName} ${player.lastName}` : 'Desconocido',
                timePlayedSeconds: 0, periodsPlayed: 0, points: 0, shots_made_1p: 0, shots_attempted_1p: 0,
                shots_made_2p: 0, shots_attempted_2p: 0, shots_made_3p: 0, shots_attempted_3p: 0, reb_def: 0,
                reb_off: 0, assists: 0, steals: 0, blocks: 0, turnovers: 0, fouls: 0, blocks_against: 0, fouls_received: 0, pir: 0,
            };
        });
    }

    let onCourt = new Set<string>();
    let lastEventTime = new Date(gameData.createdAt).getTime();
    let isClockRunning = false;
    let currentPeriod = 1;
    const playerPeriods = new Map<string, Set<number>>();
    
    for (const event of events) {
        const eventTime = event.createdAt.getTime();
        
        if (isClockRunning) {
            const timeDeltaSeconds = (eventTime - lastEventTime) / 1000;
            if (timeDeltaSeconds > 0) {
                onCourt.forEach(playerId => {
                    if (stats[playerId]) {
                        stats[playerId].timePlayedSeconds += timeDeltaSeconds;
                        if (!playerPeriods.has(playerId)) playerPeriods.set(playerId, new Set());
                        playerPeriods.get(playerId)!.add(currentPeriod);
                    }
                });
            }
        }
        lastEventTime = eventTime;

        switch (event.action) {
            case 'period_start': currentPeriod = event.period; isClockRunning = false; break;
            case 'timer_start': isClockRunning = true; break;
            case 'timer_pause': case 'period_end': isClockRunning = false; break;
            case 'substitution_in': onCourt.add(event.playerId); break;
            case 'substitution_out': onCourt.delete(event.playerId); break;
            case 'shot_made_1p': if(stats[event.playerId]) { stats[event.playerId].points++; stats[event.playerId].shots_made_1p++; stats[event.playerId].shots_attempted_1p++; } break;
            case 'shot_miss_1p': if(stats[event.playerId]) stats[event.playerId].shots_attempted_1p++; break;
            case 'shot_made_2p': if(stats[event.playerId]) { stats[event.playerId].points += 2; stats[event.playerId].shots_made_2p++; stats[event.playerId].shots_attempted_2p++; } break;
            case 'shot_miss_2p': if(stats[event.playerId]) stats[event.playerId].shots_attempted_2p++; break;
            case 'shot_made_3p': if(stats[event.playerId]) { stats[event.playerId].points += 3; stats[event.playerId].shots_made_3p++; stats[event.playerId].shots_attempted_3p++; } break;
            case 'shot_miss_3p': if(stats[event.playerId]) stats[event.playerId].shots_attempted_3p++; break;
            case 'rebound_defensive': if(stats[event.playerId]) stats[event.playerId].reb_def++; break;
            case 'rebound_offensive': if(stats[event.playerId]) stats[event.playerId].reb_off++; break;
            case 'assist': if(stats[event.playerId]) stats[event.playerId].assists++; break;
            case 'steal': if(stats[event.playerId]) stats[event.playerId].steals++; break;
            case 'block': if(stats[event.playerId]) stats[event.playerId].blocks++; break;
            case 'turnover': if(stats[event.playerId]) stats[event.playerId].turnovers++; break;
            case 'foul': if(stats[event.playerId]) stats[event.playerId].fouls++; break;
            case 'block_against': if(stats[event.playerId]) stats[event.playerId].blocks_against++; break;
            case 'foul_received': if(stats[event.playerId]) stats[event.playerId].fouls_received++; break;
        }
    }
    
    Object.values(stats).forEach(s => {
        const totalRebounds = s.reb_def + s.reb_off;
        const fieldGoalsMade = s.shots_made_2p + s.shots_made_3p;
        const fieldGoalsAttempted = s.shots_attempted_2p + s.shots_attempted_3p;
        const missedFieldGoals = fieldGoalsAttempted - fieldGoalsMade;
        const missedFreeThrows = s.shots_attempted_1p - s.shots_made_1p;
        
        s.pir = (s.points + totalRebounds + s.assists + s.steals + s.blocks + s.fouls_received) - (missedFieldGoals + missedFreeThrows + s.turnovers + s.fouls + s.blocks_against);
        s.timePlayedSeconds = Math.round(s.timePlayedSeconds);
        s.periodsPlayed = playerPeriods.get(s.playerId)?.size || 0;
    });
    
    return Object.values(stats);
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
  const eventsRef = gameRef.collection('events');

  try {
    await adminDb.runTransaction(async (transaction) => {
        const gameDoc = await transaction.get(gameRef);
        if (!gameDoc.exists) throw new Error("El partido no existe.");
        
        const gameData = gameDoc.data() as Game;
        const updateData: { [key: string]: any } = { 
            ...updates,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        const createEvent = (action: GameEventAction, teamId: 'home' | 'away' | 'system', playerId: string, playerName: string) => {
            const period = updates.currentPeriod && updates.currentPeriod > (gameData.currentPeriod || 1) ? updates.currentPeriod : (gameData.currentPeriod || 1);
            const event: Omit<GameEvent, 'id' | 'createdAt'> = {
                gameId,
                teamId: teamId === 'system' ? 'home' : teamId,
                playerId,
                playerName,
                action,
                period,
                gameTimeSeconds: updates.periodTimeRemainingSeconds ?? gameData.periodTimeRemainingSeconds ?? 0,
            };
            transaction.set(eventsRef.doc(), { ...event, createdAt: admin.firestore.FieldValue.serverTimestamp() });
        };
        
        if (updates.status === 'inprogress' && gameData.status === 'scheduled') {
            const homeRoster = gameData.homeTeamPlayerIds || [];
            const awayRoster = gameData.awayTeamPlayerIds || [];
            if (homeRoster.length < 5 || awayRoster.length < 5) throw new Error(`No se puede iniciar el partido. Se requieren al menos 5 jugadores por equipo. Local: ${homeRoster.length}, Visitante: ${awayRoster.length}.`);
            
            const startingHome = homeRoster.slice(0, 5);
            const startingAway = awayRoster.slice(0, 5);
            updateData.homeTeamOnCourtPlayerIds = startingHome;
            updateData.awayTeamOnCourtPlayerIds = startingAway;

            const [homePlayers, awayPlayers] = await Promise.all([
                getPlayersFromIds(startingHome),
                getPlayersFromIds(startingAway)
            ]);

            createEvent('period_start', 'system', 'SYSTEM', 'System');
            homePlayers.forEach(p => createEvent('substitution_in', 'home', p.id, `${p.firstName} ${p.lastName}`));
            awayPlayers.forEach(p => createEvent('substitution_in', 'away', p.id, `${p.firstName} ${p.lastName}`));
        }

        if (updates.status === 'completed' && gameData.status === 'inprogress') {
            createEvent('period_end', 'system', 'SYSTEM', 'System');
        }

        if (updates.isTimerRunning === true && gameData.isTimerRunning === false) createEvent('timer_start', 'system', 'SYSTEM', 'System');
        if (updates.isTimerRunning === false && gameData.isTimerRunning === true) createEvent('timer_pause', 'system', 'SYSTEM', 'System');

        if (updates.currentPeriod && updates.currentPeriod > (gameData.currentPeriod || 1)) {
            createEvent('period_end', 'system', 'SYSTEM', 'System');
            createEvent('period_start', 'system', 'SYSTEM', 'System');
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
  if (!adminDb) return { success: false, error: 'Database not initialized' };

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
    playerIn: { id: string, name: string },
    playerOut: { id: string, name: string } | null,
    period: number,
    gameTimeSeconds: number
): Promise<{ success: boolean; error?: string }> {
    if (!adminDb) return { success: false, error: 'La base de datos no está inicializada.' };

    const gameRef = adminDb.collection('games').doc(gameId);
    const eventsRef = gameRef.collection('events');
    
    try {
        await adminDb.runTransaction(async (transaction) => {
            const gameDoc = await transaction.get(gameRef);
            if (!gameDoc.exists) throw new Error("Partido no encontrado.");

            const gameData = gameDoc.data() as Game;
            const onCourtField = teamId === 'home' ? 'homeTeamOnCourtPlayerIds' : 'awayTeamOnCourtPlayerIds';
            
            let onCourtIds: string[] = gameData[onCourtField] || [];
            
            if (playerOut) {
                const index = onCourtIds.indexOf(playerOut.id);
                if (index > -1) {
                    onCourtIds.splice(index, 1, playerIn.id);
                    const outEvent: Omit<GameEvent, 'id' | 'createdAt'> = { gameId, teamId, playerId: playerOut.id, playerName: playerOut.name, action: 'substitution_out', period, gameTimeSeconds };
                    transaction.set(eventsRef.doc(), { ...outEvent, createdAt: admin.firestore.FieldValue.serverTimestamp() });
                } else {
                    throw new Error("El jugador a sustituir no está en la pista.");
                }
            } else {
                if (onCourtIds.length >= 5) {
                    throw new Error("No puede haber más de 5 jugadores en pista.");
                }
                if (!onCourtIds.includes(playerIn.id)) {
                    onCourtIds.push(playerIn.id);
                }
            }
            
            const inEvent: Omit<GameEvent, 'id' | 'createdAt'> = { gameId, teamId, playerId: playerIn.id, playerName: playerIn.name, action: 'substitution_in', period, gameTimeSeconds };
            transaction.set(eventsRef.doc(), { ...inEvent, createdAt: admin.firestore.FieldValue.serverTimestamp() });
            
            transaction.update(gameRef, { [onCourtField]: onCourtIds });
        });
        return { success: true };
    } catch (error: any) {
        console.error("Error al sustituir jugador:", error);
        return { success: false, error: error.message };
    }
}
