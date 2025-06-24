'use server';

import { adminDb } from '@/lib/firebase/admin';
import admin from 'firebase-admin';

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
        console.log('Iniciando el proceso de borrado de datos existentes...');
        // WARNING: This will delete all users, teams, players etc.
        const collectionsToDelete = ['gameFormats', 'competitionCategories', 'clubs', 'user_profiles', 'teams', 'players', 'seasons'];
        for (const collection of collectionsToDelete) {
            console.log(`Borrando colección: ${collection}...`);
            await deleteCollection(collection);
            console.log(`Colección ${collection} borrada.`);
        }
        
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

        const allTeamsData = [];

        // --- 4. Users, Teams, Players ---
        let userCounter = 1;
        for (const club of clubs) {
            // Create 1 Coordinator per Club
            const coordName = `${getRandomItem(firstNamesMasculine)} ${getRandomItem(lastNames)}`;
            const coordId = `user-coord-${userCounter}`;
            const coordinator = {
                uid: coordId,
                displayName: coordName,
                email: `${coordName.toLowerCase().replace(/\s/g, '.')}@example.com`,
                profileTypeId: 'coordinator',
                clubId: club.id,
                status: 'approved',
                createdAt: serverTimestamp,
                updatedAt: serverTimestamp,
            };
            batch.set(adminDb.collection('user_profiles').doc(coordId), coordinator);
            userCounter++;
            
            for(const category of categories) {
                 // Create 1-2 Coaches per Team
                const coachIds = [];
                const numCoaches = 1 + Math.floor(Math.random() * 2); // 1 or 2
                 for (let i = 0; i < numCoaches; i++) {
                    const coachName = `${getRandomItem(firstNamesFeminine)} ${getRandomItem(lastNames)}`;
                    const coachId = `user-coach-${userCounter}`;
                    coachIds.push(coachId);
                    const coach = {
                        uid: coachId,
                        displayName: coachName,
                        email: `${coachName.toLowerCase().replace(/\s/g, '.')}@example.com`,
                        profileTypeId: 'coach',
                        clubId: club.id,
                        status: 'approved',
                        createdAt: serverTimestamp,
                        updatedAt: serverTimestamp,
                    };
                    batch.set(adminDb.collection('user_profiles').doc(coachId), coach);
                    userCounter++;
                 }

                // Create 1 Team per Category per Club
                const teamId = `${club.shortName?.toLowerCase()}-${category.id}`;
                const team = {
                    id: teamId,
                    name: `${club.name} ${category.name}`,
                    clubId: club.id,
                    competitionCategoryId: category.id,
                    coachIds: coachIds,
                    coordinatorIds: [coordId],
                    createdAt: serverTimestamp,
                    updatedAt: serverTimestamp
                };
                batch.set(adminDb.collection('teams').doc(team.id), team);
                allTeamsData.push(team);

                // Create 8-9 Players per Team
                const numPlayers = 8 + Math.floor(Math.random() * 2);
                for (let p = 0; p < numPlayers; p++) {
                    const playerName = generatePlayerName(category.isFeminine);
                    const player = {
                        ...playerName,
                        jerseyNumber: 4 + p,
                        position: ['Base', 'Escolta', 'Alero', 'Ala-Pívot', 'Pívot'][p % 5],
                        teamId: team.id,
                        createdAt: serverTimestamp
                    };
                    batch.set(adminDb.collection('players').doc(), player);
                }
            }
        }

        // --- 5. Season ---
        const season2425 = {
            name: 'Temporada 2024-2025',
            status: 'active',
            competitions: categories.map(category => {
                return {
                    competitionCategoryId: category.id,
                    teamIds: allTeamsData.filter(t => t.competitionCategoryId === category.id).map(t => t.id)
                }
            })
        };
        batch.set(adminDb.collection('seasons').doc('season-24-25'), season2425);
        
        await batch.commit();

        console.log('Base de datos poblada con éxito.');
        return { success: true };
    } catch (error: any) {
        console.error('Error al poblar la base de datos:', error);
        return { success: false, error: `Se ha producido un error en el servidor: ${error.message}` };
    }
}
