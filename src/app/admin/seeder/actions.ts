
'use server';

import { adminDb } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { Game, Player, Season, Team, TeamStats, UserFirestoreProfile } from '@/types';

// Helper function to delete all documents in a collection
async function deleteCollection(collectionPath: string, batchSize: number = 100) {
    if (!adminDb) return;
    const collectionRef = adminDb.collection(collectionPath);
    const query = collectionRef.orderBy('__name__').limit(batchSize);

    return new Promise((resolve, reject) => {
        deleteQueryBatch(query, resolve).catch(reject);
    });
}

async function deleteQueryBatch(query: admin.firestore.Query, resolve: (value: unknown) => void) {
    if (!adminDb) return;
    const snapshot = await query.get();

    const batchSize = snapshot.size;
    if (batchSize === 0) {
        resolve(true);
        return;
    }

    const batch = adminDb.batch();
    snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });
    await batch.commit();

    process.nextTick(() => {
        deleteQueryBatch(query, resolve);
    });
}

// Helper to delete documents based on a query (e.g., seeded users).
async function deleteDocumentsByQuery(query: admin.firestore.Query, batchSize: number = 100) {
    if (!adminDb) return;
    
    const snapshot = await query.limit(batchSize).get();
    
    if (snapshot.size === 0) {
        return;
    }
    
    const batch = adminDb.batch();
    snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });
    await batch.commit();
    
    if (snapshot.size === batchSize) {
        process.nextTick(() => {
            deleteDocumentsByQuery(query, batchSize);
        });
    }
}


// --- Data for Seeder ---
const firstNamesMasculine = ["Hugo", "Lucas", "Mateo", "Leo", "Daniel", "Pablo", "Álvaro", "Adrián", "Manuel", "Enzo", "Martín", "Javier", "Marcos", "Alejandro", "David"];
const firstNamesFeminine = ["Lucía", "Sofía", "Martina", "María", "Julia", "Paula", "Valeria", "Emma", "Daniela", "Carla", "Alba", "Noa", "Olivia", "Sara", "Carmen"];
const lastNames = ["García", "Rodríguez", "González", "Fernández", "López", "Martínez", "Sánchez", "Pérez", "Gómez", "Martín", "Jiménez", "Ruiz", "Hernández", "Díaz", "Moreno", "Álvarez", "Romero"];

function getRandomItem<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generatePlayerName(isFeminine: boolean) {
    const firstName = isFeminine ? getRandomItem(firstNamesFeminine) : getRandomItem(firstNamesMasculine);
    return {
        firstName,
        lastName: `${getRandomItem(lastNames)} ${getRandomItem(lastNames)}`
    }
}


export async function seedDatabase(): Promise<{ success: boolean; error?: string }> {
    if (!adminDb) {
        return { success: false, error: 'La base de datos del admin no está inicializada.' };
    }

    try {
        console.log('Iniciando el proceso de borrado de datos de prueba...');
        
        // Collections to be completely wiped out.
        const collectionsToDelete = ['gameFormats', 'competitionCategories', 'clubs', 'teams', 'players', 'seasons', 'games'];
        for (const collection of collectionsToDelete) {
            console.log(`Borrando colección: ${collection}...`);
            await deleteCollection(collection);
            console.log(`Colección ${collection} borrada.`);
        }
        
        // ** SAFEGUARD ** Only delete users marked as seeded to preserve manual users.
        console.log("Borrando solo perfiles de usuario de prueba (seeded)...");
        const seederUsersQuery = adminDb.collection('user_profiles').where('isSeeded', '==', true);
        await deleteDocumentsByQuery(seederUsersQuery);
        console.log("Perfiles de usuario de prueba borrados. Los usuarios manuales permanecen.");
        
        console.log('Proceso de borrado completado. Iniciando la carga de nuevos datos...');

        const batch = adminDb.batch();
        const serverTimestamp = admin.firestore.FieldValue.serverTimestamp();

        // --- 1. Game Formats ---
        const gameFormat5v5 = { id: '5v5-standard', name: 'Estándar 5v5', numPeriods: 4, periodDurationMinutes: 10, defaultTotalTimeouts: 4 };
        const gameFormat3v3 = { id: '3v3-half', name: '3v3 Media Pista', numPeriods: 1, periodDurationMinutes: 15, defaultTotalTimeouts: 2 };
        batch.set(adminDb.collection('gameFormats').doc(gameFormat5v5.id), gameFormat5v5);
        batch.set(adminDb.collection('gameFormats').doc(gameFormat3v3.id), gameFormat3v3);

        // --- 2. Competition Categories ---
        const categories = [
            { id: 'u10-mixto', name: 'U10 Mixto', level: 10, gameFormatId: gameFormat5v5.id, isFeminine: false },
            { id: 'u12-masculino', name: 'U12 Masculino', level: 12, gameFormatId: gameFormat5v5.id, isFeminine: false },
            { id: 'u14-femenino', name: 'U14 Femenino', level: 14, gameFormatId: gameFormat5v5.id, isFeminine: true },
            { id: 'u16-masculino', name: 'U16 Masculino', level: 16, gameFormatId: gameFormat5v5.id, isFeminine: false },
            { id: 'senior-femenino', name: 'Senior Femenino', level: 99, gameFormatId: gameFormat5v5.id, isFeminine: true },
        ];
        categories.forEach(cat => batch.set(adminDb.collection('competitionCategories').doc(cat.id), {name: cat.name, level: cat.level, gameFormatId: cat.gameFormatId}));

        // --- 3. Clubs ---
        const clubs = [
            { id: 'club-estudiantes', name: 'Club Estudiantes Madrid', shortName: 'ESTU', city_name: 'Madrid', province_name: 'Madrid' },
            { id: 'club-valencia', name: 'Valencia Basket Club', shortName: 'VBC', city_name: 'Valencia', province_name: 'Valencia' },
            { id: 'club-baskonia', name: 'Saski Baskonia', shortName: 'BKN', city_name: 'Vitoria-Gasteiz', province_name: 'Álava' },
            { id: 'club-joventut', name: 'Club Joventut Badalona', shortName: 'CJB', city_name: 'Badalona', province_name: 'Barcelona' },
            { id: 'club-unicaja', name: 'Unicaja Málaga', shortName: 'UNI', city_name: 'Málaga', province_name: 'Málaga' },
        ];
        clubs.forEach(club => batch.set(adminDb.collection('clubs').doc(club.id), {...club, approved: true, createdAt: serverTimestamp}));

        const allTeamsData: Team[] = [];

        // --- 4. Users, Teams, Players ---
        let userCounter = 1;
        for (const club of clubs) {
            const coordName = `${getRandomItem(firstNamesMasculine)} ${getRandomItem(lastNames)}`;
            const coordId = `user-coord-${userCounter}`;
            const coordinator: Omit<UserFirestoreProfile, 'createdAt' | 'updatedAt'> = {
                uid: coordId, displayName: coordName, email: `${coordName.toLowerCase().replace(/\s/g, '.')}@example.com`,
                profileTypeId: 'coordinator', clubId: club.id, status: 'approved', isSeeded: true, onboardingCompleted: true,
            };
            batch.set(adminDb.collection('user_profiles').doc(coordId), {...coordinator, createdAt: serverTimestamp, updatedAt: serverTimestamp });
            userCounter++;
            
            for(const category of categories) {
                const coachIds: string[] = [];
                for (let i = 0; i < 2; i++) {
                    const coachName = `${getRandomItem(firstNamesFeminine)} ${getRandomItem(lastNames)}`;
                    const coachId = `user-coach-${userCounter}`;
                    coachIds.push(coachId);
                    const coach: Omit<UserFirestoreProfile, 'createdAt' | 'updatedAt'> = {
                        uid: coachId, displayName: coachName, email: `${coachName.toLowerCase().replace(/\s/g, '.')}@example.com`,
                        profileTypeId: 'coach', clubId: club.id, status: 'approved', isSeeded: true, onboardingCompleted: true,
                    };
                    batch.set(adminDb.collection('user_profiles').doc(coachId), {...coach, createdAt: serverTimestamp, updatedAt: serverTimestamp});
                    userCounter++;
                 }

                const teamId = `${club.shortName?.toLowerCase()}-${category.id}`;
                const teamDocRef = adminDb.collection('teams').doc(teamId);
                const teamData: Partial<Team> = {
                    id: teamId, name: `${club.name} ${category.name}`, clubId: club.id,
                    competitionCategoryId: category.id, coachIds, coordinatorIds: [coordId],
                };
                batch.set(teamDocRef, {...teamData, createdAt: serverTimestamp, updatedAt: serverTimestamp });
                allTeamsData.push(teamData as Team);

                for (let p = 0; p < 9; p++) {
                    const playerName = generatePlayerName(category.isFeminine);
                    const player: Partial<Player> = {
                        ...playerName, jerseyNumber: 4 + p, teamId: teamId,
                    };
                    batch.set(adminDb.collection('players').doc(), {...player, createdAt: serverTimestamp});
                }
            }
        }

        // --- 5. Season ---
        const activeSeasonId = 'season-24-25';
        const season2425: Partial<Season> = {
            name: 'Temporada 2024-2025', status: 'active',
            competitions: categories.map(category => ({
                competitionCategoryId: category.id,
                teamIds: allTeamsData.filter(t => t.competitionCategoryId === category.id).map(t => t.id)
            }))
        };
        batch.set(adminDb.collection('seasons').doc(activeSeasonId), {...season2425, createdAt: serverTimestamp, updatedAt: serverTimestamp});
        
         // --- 6. Completed Games ---
        console.log('Creando partidos de ejemplo...');
        for (const category of categories) {
            const teamsInCategory = allTeamsData.filter(t => t.competitionCategoryId === category.id);
            if (teamsInCategory.length < 2) continue;

            for (let i = 0; i < teamsInCategory.length; i += 2) {
                if (i + 1 < teamsInCategory.length) {
                    const homeTeam = teamsInCategory[i];
                    const awayTeam = teamsInCategory[i + 1];

                    const gameDate = new Date();
                    gameDate.setDate(gameDate.getDate() - Math.floor(Math.random() * 30));
                    
                    const homeTeamScore = Math.floor(Math.random() * 40) + 50;
                    const awayTeamScore = Math.floor(Math.random() * 40) + 50;

                    const initialStats: Omit<TeamStats, 'foulsReceived'> = {
                        onePointAttempts: 10, onePointMade: 8, twoPointAttempts: 20, twoPointMade: 10,
                        threePointAttempts: 15, threePointMade: 5, fouls: Math.floor(Math.random() * 10) + 5,
                        timeouts: Math.floor(Math.random() * 4), reboundsOffensive: Math.floor(Math.random() * 10) + 5,
                        reboundsDefensive: Math.floor(Math.random() * 20) + 10, assists: Math.floor(Math.random() * 15) + 5,
                        steals: Math.floor(Math.random() * 10), blocks: Math.floor(Math.random() * 5),
                        turnovers: Math.floor(Math.random() * 10) + 5, blocksAgainst: 0,
                    };

                    const gameData = {
                        homeTeamId: homeTeam.id, homeTeamClubId: homeTeam.clubId, homeTeamName: homeTeam.name,
                        awayTeamId: awayTeam.id, awayTeamClubId: awayTeam.clubId, awayTeamName: awayTeam.name,
                        date: admin.firestore.Timestamp.fromDate(gameDate), location: `${homeTeam.clubId.split('-')[1]} Arena`,
                        status: 'completed', seasonId: activeSeasonId, competitionCategoryId: category.id, gameFormatId: category.gameFormatId,
                        homeTeamScore, awayTeamScore, homeTeamStats: initialStats, awayTeamStats: { ...initialStats },
                        currentPeriod: gameFormat5v5.numPeriods, isTimerRunning: false, periodTimeRemainingSeconds: 0,
                        createdBy: 'system-seeder', createdAt: serverTimestamp, updatedAt: serverTimestamp,
                    };
                    const gameRef = adminDb.collection('games').doc();
                    batch.set(gameRef, gameData);
                }
            }
        }
        
        await batch.commit();

        console.log('Base de datos poblada con éxito.');
        return { success: true };
    } catch (error: any) {
        console.error('Error al poblar la base de datos:', error);
        return { success: false, error: `Se ha producido un error en el servidor: ${error.message}` };
    }
}
