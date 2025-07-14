
'use server';

import { adminDb, adminAuth } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import type { Game, Player, Season, Team, UserFirestoreProfile } from '@/types';

// Helper function to delete all documents in a collection
async function deleteCollection(db: admin.firestore.Firestore, collectionPath: string, batchSize: number = 100) {
    const collectionRef = db.collection(collectionPath);
    const query = collectionRef.orderBy('__name__').limit(batchSize);

    return new Promise((resolve, reject) => {
        deleteQueryBatch(db, query, resolve).catch(reject);
    });
}

async function deleteQueryBatch(db: admin.firestore.Firestore, query: admin.firestore.Query, resolve: (value: unknown) => void) {
    const snapshot = await query.get();

    const batchSize = snapshot.size;
    if (batchSize === 0) {
        resolve(true);
        return;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });
    await batch.commit();

    process.nextTick(() => {
        deleteQueryBatch(db, query, resolve);
    });
}

// Helper to delete documents based on a query (e.g., seeded users).
async function deleteDocumentsByQuery(db: admin.firestore.Firestore, query: admin.firestore.Query, batchSize: number = 100) {
    const snapshot = await query.limit(batchSize).get();
    
    if (snapshot.size === 0) {
        return;
    }
    
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });
    await batch.commit();
    
    if (snapshot.size === batchSize) {
        process.nextTick(() => {
            deleteDocumentsByQuery(db, query, batchSize);
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
    if (!adminDb || !adminAuth) {
        return { success: false, error: 'La base de datos del admin o la autenticación no están inicializadas.' };
    }
    
    const db = adminDb; // Local constant for type narrowing

    try {
        console.log('Iniciando el proceso de borrado de datos de prueba...');
        
        const collectionsToDelete = ['gameFormats', 'competitionCategories', 'clubs', 'teams', 'players', 'seasons', 'games'];
        for (const collection of collectionsToDelete) {
            console.log(`Borrando colección: ${collection}...`);
            await deleteCollection(db, collection);
            console.log(`Colección ${collection} borrada.`);
        }
        
        console.log("Borrando solo perfiles de usuario de prueba (seeded)...");
        const seederUsersQuery = db.collection('user_profiles').where('isSeeded', '==', true);
        await deleteDocumentsByQuery(db, seederUsersQuery);
        console.log("Perfiles de usuario de prueba borrados.");
        
        console.log('Proceso de borrado completado. Iniciando la carga de nuevos datos...');

        const batch = db.batch();
        const serverTimestamp = admin.firestore.FieldValue.serverTimestamp();

        // --- Create Super Admin ---
        const superAdminEmail = "mauro@hotmail.com";
        let superAdminUserRecord;
        try {
            superAdminUserRecord = await adminAuth.getUserByEmail(superAdminEmail);
            console.log(`Super admin user '${superAdminEmail}' already exists in Auth.`);
        } catch (error: any) {
            if (error.code === 'auth/user-not-found') {
                console.log(`Super admin user '${superAdminEmail}' not found in Auth. Please create it manually in the Firebase Console.`);
                // We proceed to create the profile anyway, it will be linked upon login.
            } else {
                throw error; // Re-throw other errors
            }
        }
        
        const superAdminUid = superAdminUserRecord ? superAdminUserRecord.uid : '7jCTpzm9aBbkz0KRk4qaiDsaKG32';
        const superAdminProfile: Omit<UserFirestoreProfile, 'createdAt' | 'updatedAt' | 'uid' | 'children'> = {
            displayName: "Mauro (Super Admin)",
            email: superAdminEmail,
            profileTypeId: 'super_admin',
            clubId: null, // Super admins don't belong to a club
            status: 'approved',
            isSeeded: true, // Mark as seeded to allow cleanup
            onboardingCompleted: true,
        };
        // Use a predictable UID based on email for the profile if the auth user doesn't exist yet.
        const superAdminProfileRef = db.collection('user_profiles').doc(superAdminUid);
        batch.set(superAdminProfileRef, {...superAdminProfile, uid: superAdminUid, createdAt: serverTimestamp, updatedAt: serverTimestamp });
        console.log(`Set up Firestore profile for super admin: ${superAdminEmail}`);


        // --- 1. Game Formats ---
        const gameFormat5v5 = { id: '5v5-standard', name: 'Estándar 5v5', numPeriods: 4, periodDurationMinutes: 10, defaultTotalTimeouts: 4 };
        const gameFormat3v3 = { id: '3v3-half', name: '3v3 Media Pista', numPeriods: 1, periodDurationMinutes: 15, defaultTotalTimeouts: 2 };
        batch.set(db.collection('gameFormats').doc(gameFormat5v5.id), gameFormat5v5);
        batch.set(db.collection('gameFormats').doc(gameFormat3v3.id), gameFormat3v3);

        // --- 2. Competition Categories ---
        const categories = [
            { id: 'u10-mixto', name: 'U10 Mixto', level: 10, gameFormatId: gameFormat5v5.id, isFeminine: false },
            { id: 'u12-masculino', name: 'U12 Masculino', level: 12, gameFormatId: gameFormat5v5.id, isFeminine: false },
            { id: 'u14-femenino', name: 'U14 Femenino', level: 14, gameFormatId: gameFormat5v5.id, isFeminine: true },
            { id: 'u16-masculino', name: 'U16 Masculino', level: 16, gameFormatId: gameFormat5v5.id, isFeminine: false },
            { id: 'senior-femenino', name: 'Senior Femenino', level: 99, gameFormatId: gameFormat5v5.id, isFeminine: true },
        ];
        categories.forEach(cat => batch.set(db.collection('competitionCategories').doc(cat.id), {name: cat.name, level: cat.level, gameFormatId: cat.gameFormatId, isFeminine: cat.isFeminine}));

        // --- 3. Clubs ---
        const clubs = [
            { id: 'club-estudiantes', name: 'Club Estudiantes Madrid', shortName: 'ESTU', city_name: 'Madrid', province_name: 'Madrid' },
            { id: 'club-valencia', name: 'Valencia Basket Club', shortName: 'VBC', city_name: 'Valencia', province_name: 'Valencia' },
            { id: 'club-baskonia', name: 'Saski Baskonia', shortName: 'BKN', city_name: 'Vitoria-Gasteiz', province_name: 'Álava' },
            { id: 'club-joventut', name: 'Club Joventut Badalona', shortName: 'CJB', city_name: 'Badalona', province_name: 'Barcelona' },
            { id: 'club-unicaja', name: 'Unicaja Málaga', shortName: 'UNI', city_name: 'Málaga', province_name: 'Málaga' },
        ];
        clubs.forEach(club => batch.set(db.collection('clubs').doc(club.id), {...club, approved: true, createdAt: serverTimestamp}));

        // --- Setup for Season Data ---
        const seasonCompetitionsMap = new Map<string, string[]>();
        categories.forEach(cat => seasonCompetitionsMap.set(cat.id, []));

        // --- 4. Users, Teams, Players ---
        let userCounter = 1;
        for (const club of clubs) {
            const coordName = `${getRandomItem(firstNamesMasculine)} ${getRandomItem(lastNames)}`;
            const coordId = `user-coord-${userCounter}`;
            const coordinator: Omit<UserFirestoreProfile, 'createdAt' | 'updatedAt' | 'uid' | 'children'> = {
                displayName: coordName, email: `${coordName.toLowerCase().replace(/\s/g, '.')}@example.com`,
                profileTypeId: 'coordinator', clubId: club.id, status: 'approved', isSeeded: true, onboardingCompleted: true,
            };
            batch.set(db.collection('user_profiles').doc(coordId), {...coordinator, uid: coordId, createdAt: serverTimestamp, updatedAt: serverTimestamp });
            userCounter++;
            
            for(const category of categories) {
                 const coachIds: string[] = [];
                for (let i = 0; i < 2; i++) {
                    const coachName = `${getRandomItem(firstNamesFeminine)} ${getRandomItem(lastNames)}`;
                    const coachId = `user-coach-${userCounter}`;
                    coachIds.push(coachId);
                    const coach: Omit<UserFirestoreProfile, 'createdAt' | 'updatedAt' | 'uid' | 'children'> = {
                        displayName: coachName, email: `${coachName.toLowerCase().replace(/\s/g, '.')}@example.com`,
                        profileTypeId: 'coach', clubId: club.id, status: 'approved', isSeeded: true, onboardingCompleted: true,
                    };
                    batch.set(db.collection('user_profiles').doc(coachId), {...coach, uid: coachId, createdAt: serverTimestamp, updatedAt: serverTimestamp});
                    userCounter++;
                 }

                const teamId = `${club.shortName?.toLowerCase()}-${category.id}`;
                const teamDocRef = db.collection('teams').doc(teamId);
                const teamData: any = {
                    id: teamId, name: `${club.name} ${category.name}`, clubId: club.id,
                    competitionCategoryId: category.id, coachIds, coordinatorIds: [coordId],
                    createdAt: serverTimestamp, updatedAt: serverTimestamp
                };
                batch.set(teamDocRef, teamData);
                
                seasonCompetitionsMap.get(category.id)?.push(teamId);

                for (let p = 0; p < 9; p++) {
                    const playerName = generatePlayerName(category.isFeminine);
                    const player: Partial<Player> = { ...playerName, jerseyNumber: 4 + p, teamId: teamId };
                    batch.set(db.collection('players').doc(), {...player, createdAt: serverTimestamp});
                }
            }
        }
        
        // --- 5. Season ---
        const seasonCompetitions = Array.from(seasonCompetitionsMap.entries()).map(([catId, teamIds]) => ({
            competitionCategoryId: catId,
            teamIds: teamIds
        }));

        const season2425 = {
            name: 'Temporada 2024-2025',
            status: 'active',
            competitions: seasonCompetitions,
            createdAt: serverTimestamp,
            updatedAt: serverTimestamp,
        };
        batch.set(db.collection('seasons').doc('season-24-25'), season2425);
        
        await batch.commit();

        console.log('Base de datos poblada con éxito.');
        return { success: true };
    } catch (error: any) {
        console.error('Error al poblar la base de datos:', error);
        return { success: false, error: `Se ha producido un error en el servidor: ${error.message}` };
    }
}
