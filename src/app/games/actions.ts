'use server';
import { adminDb } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { revalidatePath } from 'next/cache';
import type { Game, GameFormData, Team, TeamStats, StatCategory, GameEvent, GameEventAction } from '@/types';
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
                date: data.date.toDate().toISOString(),
                createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : undefined,
                updatedAt: data.updatedAt ? data.updatedAt.toDate().toISOString() : undefined,
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
            date: data.date.toDate().toISOString(),
            createdAt: data.createdAt?.toDate().toISOString(),
            updatedAt: data.updatedAt?.toDate().toISOString(),
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
        createdAt: data.createdAt.toDate().toISOString(),
      } as GameEvent;
    });
  } catch (error) {
    console.error("Error fetching game events:", error);
    return [];
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
  updates: Partial<Pick<Game, 'status' | 'currentPeriod' | 'periodTimeRemainingSeconds' | 'isTimerRunning'>>
): Promise<{ success: boolean; error?: string }> {
  if (!adminDb) return { success: false, error: "La base de datos no está inicializada." };
  
  try {
    const gameRef = adminDb.collection('games').doc(gameId);
    
    const updateData: { [key: string]: any } = { 
        ...updates,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await gameRef.update(updateData);
    
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
