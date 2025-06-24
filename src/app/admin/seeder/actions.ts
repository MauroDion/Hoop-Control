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


export async function seedDatabase(): Promise<{ success: boolean; error?: string }> {
    if (!adminDb) {
        return { success: false, error: 'La base de datos del admin no está inicializada.' };
    }

    try {
        console.log('Iniciando el proceso de borrado de datos existentes...');
        // Clean up existing data to prevent duplicates and conflicts
        const collectionsToDelete = [
            'gameFormats', 
            'competitionCategories', 
            'clubs', 
            'user_profiles_seeder_temp', // Using a temporary name to avoid deleting real users
            'teams', 
            'players', 
            'seasons'
        ];
        
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
        const catU12M = { id: 'u12-masculino', name: 'U12 Masculino', level: 12, gameFormatId: gameFormat5v5.id };
        const catU14F = { id: 'u14-femenino', name: 'U14 Femenino', level: 14, gameFormatId: gameFormat5v5.id };
        const catSenior3v3 = { id: 'senior-3v3', name: 'Senior 3v3 Mixto', level: 99, gameFormatId: gameFormat3v3.id };
        batch.set(adminDb.collection('competitionCategories').doc(catU12M.id), catU12M);
        batch.set(adminDb.collection('competitionCategories').doc(catU14F.id), catU14F);
        batch.set(adminDb.collection('competitionCategories').doc(catSenior3v3.id), catSenior3v3);

        // --- 3. Clubs ---
        const clubEstudiantes = { id: 'club-estudiantes', name: 'Club Estudiantes Madrid', shortName: 'ESTU', city_name: 'Madrid', province_name: 'Madrid', approved: true, createdAt: serverTimestamp };
        const clubValencia = { id: 'club-valencia', name: 'Valencia Basket Club', shortName: 'VBC', city_name: 'Valencia', province_name: 'Valencia', approved: true, createdAt: serverTimestamp };
        batch.set(adminDb.collection('clubs').doc(clubEstudiantes.id), clubEstudiantes);
        batch.set(adminDb.collection('clubs').doc(clubValencia.id), clubValencia);

        // --- 4. Dummy Users (Coaches & Coordinators) ---
        // NOTE: These are only Firestore profiles. Corresponding Auth users must be created manually for them to log in.
        const users = [
            { uid: 'coach-01', displayName: 'Ana García', email: 'ana.coach@example.com', profileTypeId: 'coach', clubId: clubEstudiantes.id, status: 'approved' },
            { uid: 'coach-02', displayName: 'Carlos López', email: 'carlos.coach@example.com', profileTypeId: 'coach', clubId: clubEstudiantes.id, status: 'approved' },
            { uid: 'coach-03', displayName: 'Sara Martín', email: 'sara.coach@example.com', profileTypeId: 'coach', clubId: clubValencia.id, status: 'approved' },
            { uid: 'coord-01', displayName: 'David Fernández', email: 'david.coord@example.com', profileTypeId: 'coordinator', clubId: clubEstudiantes.id, status: 'approved' },
        ];
        users.forEach(user => {
            batch.set(adminDb.collection('user_profiles').doc(user.uid), { ...user, createdAt: serverTimestamp, updatedAt: serverTimestamp });
        });

        // --- 5. Teams ---
        const teams = [
            { id: 'estu-u12-a', name: 'Estudiantes U12 A', clubId: clubEstudiantes.id, competitionCategoryId: catU12M.id, coachIds: ['coach-01'], coordinatorIds: ['coord-01'] },
            { id: 'estu-u12-b', name: 'Estudiantes U12 B', clubId: clubEstudiantes.id, competitionCategoryId: catU12M.id, coachIds: ['coach-02'], coordinatorIds: ['coord-01'] },
            { id: 'val-u14-fem', name: 'Valencia U14 Femenino', clubId: clubValencia.id, competitionCategoryId: catU14F.id, coachIds: ['coach-03'] },
        ];
        teams.forEach(team => {
            batch.set(adminDb.collection('teams').doc(team.id), { ...team, createdAt: serverTimestamp, updatedAt: serverTimestamp });
        });

        // --- 6. Players ---
        const players = [
            // Estudiantes U12 A
            { firstName: 'Hugo', lastName: 'Gomez', jerseyNumber: 4, position: 'Base', teamId: 'estu-u12-a' },
            { firstName: 'Lucas', lastName: 'Vazquez', jerseyNumber: 5, position: 'Escolta', teamId: 'estu-u12-a' },
            { firstName: 'Mateo', lastName: 'Ruiz', jerseyNumber: 7, position: 'Alero', teamId: 'estu-u12-a' },
            { firstName: 'Leo', lastName: 'Jimenez', jerseyNumber: 10, position: 'Ala-Pívot', teamId: 'estu-u12-a' },
            { firstName: 'Daniel', lastName: 'Moreno', jerseyNumber: 12, position: 'Pívot', teamId: 'estu-u12-a' },
            // Estudiantes U12 B
            { firstName: 'Pablo', lastName: 'Alvarez', jerseyNumber: 6, position: 'Base', teamId: 'estu-u12-b' },
            { firstName: 'Álvaro', lastName: 'Romero', jerseyNumber: 8, position: 'Escolta', teamId: 'estu-u12-b' },
            // Valencia U14 Femenino
            { firstName: 'Lucía', lastName: 'Sanz', jerseyNumber: 4, position: 'Base', teamId: 'val-u14-fem' },
            { firstName: 'Martina', lastName: 'Castillo', jerseyNumber: 5, position: 'Escolta', teamId: 'val-u14-fem' },
            { firstName: 'Sofía', lastName: 'Garrido', jerseyNumber: 9, position: 'Alero', teamId: 'val-u14-fem' },
        ];
        players.forEach(player => {
            const playerRef = adminDb.collection('players').doc();
            batch.set(playerRef, { ...player, createdAt: serverTimestamp });
        });
        
        // --- 7. Seasons ---
        const season2425 = {
            id: 'season-24-25',
            name: 'Temporada 2024-2025',
            status: 'active',
            competitions: [
                {
                    competitionCategoryId: catU12M.id,
                    teamIds: ['estu-u12-a', 'estu-u12-b'],
                },
                {
                    competitionCategoryId: catU14F.id,
                    teamIds: ['val-u14-fem'],
                },
            ]
        };
        batch.set(adminDb.collection('seasons').doc(season2425.id), season2425);
        
        await batch.commit();

        console.log('Base de datos poblada con éxito.');
        return { success: true };
    } catch (error: any) {
        console.error('Error al poblar la base de datos:', error);
        return { success: false, error: `Se ha producido un error en el servidor: ${error.message}` };
    }
}
