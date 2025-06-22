
"use server";

import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/firebase/admin";
import admin from "firebase-admin";
import type { TeamFormData, Team, UserFirestoreProfile } from "@/types";

export async function createTeam(
  formData: TeamFormData,
  clubId: string,
  userId: string
): Promise<{ success: boolean; error?: string; id?: string }> {
  if (!userId) {
    return { success: false, error: "User not authenticated." };
  }
  if (!clubId) {
    return { success: false, error: "Club ID is missing." };
  }
  if (!formData.name || formData.name.trim() === "") {
    return { success: false, error: "Team name cannot be empty." };
  }

  if (!adminDb) {
    const errorMessage = "Firebase Admin SDK is not initialized. Team creation cannot proceed.";
    console.error("TeamActions (createTeam):", errorMessage);
    return { success: false, error: errorMessage };
  }

  try {
    const newTeamData: Omit<Team, "id" | "createdAt" | "updatedAt"> & { createdAt: any, updatedAt: any } = {
      name: formData.name.trim(),
      clubId: clubId,
      gameFormatId: formData.gameFormatId || null,
      competitionCategoryId: formData.competitionCategoryId || null,
      coachIds: formData.coachIds ? formData.coachIds.split(',').map(id => id.trim()).filter(id => id) : [],
      coordinatorIds: formData.coordinatorIds ? formData.coordinatorIds.split(',').map(id => id.trim()).filter(id => id) : [],
      playerIds: formData.playerIds ? formData.playerIds.split(',').map(id => id.trim()).filter(id => id) : [],
      logoUrl: formData.logoUrl || null,
      city: formData.city || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdByUserId: userId,
    };

    const docRef = await adminDb.collection("teams").add(newTeamData);
    
    revalidatePath(`/clubs/${clubId}`);
    // Potentially revalidate a general teams list page if one exists
    // revalidatePath(`/teams`); 

    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error("Error creating team:", error);
    return { success: false, error: error.message || "Failed to create team." };
  }
}

export async function getTeamsByClubId(clubId: string): Promise<Team[]> {
  console.log(`TeamActions: Attempting to fetch teams for clubId: ${clubId}`);
  if (!adminDb) {
    console.warn("TeamActions (getTeamsByClubId): Admin SDK not available. Returning empty array.");
    return [];
  }
  if (!clubId) {
    console.warn("TeamActions (getTeamsByClubId): clubId is required.");
    return [];
  }

  try {
    const teamsCollectionRef = adminDb.collection('teams');
    // Simplified query to avoid needing a composite index. We will sort in memory later.
    const q = teamsCollectionRef.where('clubId', '==', clubId);
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
      console.log(`TeamActions: No teams found for clubId: ${clubId}`);
      return [];
    }
    
    console.log(`TeamActions: Found ${querySnapshot.docs.length} teams for clubId: ${clubId}.`);
    
    const teams = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
        updatedAt: data.updatedAt ? data.updatedAt.toDate() : new Date(),
      } as Team;
    });

    // Sort the results in memory by creation date, newest first.
    teams.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return teams;
  } catch (error: any) {
    console.error(`TeamActions: Error fetching teams for club ${clubId}:`, error.message, error.stack);
     if (error.code === 'failed-precondition') {
        // This error is less likely now, but we keep the log just in case.
        console.error("TeamActions: Firestore query for teams failed. This could be a missing index for 'clubId'.");
    }
    return [];
  }
}

export async function getTeamById(teamId: string): Promise<Team | null> {
  console.log(`TeamActions: Attempting to fetch team by ID: ${teamId}`);
  if (!adminDb) {
    console.warn("TeamActions (getTeamById): Admin SDK not available. Returning null.");
    return null;
  }
  if (!teamId) {
    console.warn("TeamActions (getTeamById): teamId is required.");
    return null;
  }

  try {
    const teamDocRef = adminDb.collection('teams').doc(teamId);
    const docSnap = await teamDocRef.get();

    if (!docSnap.exists) {
      console.warn(`TeamActions: No team found with ID: ${teamId}`);
      return null;
    }
    
    const data = docSnap.data()!;
    console.log(`TeamActions: Found team: ${data.name}`);
    
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
      updatedAt: data.updatedAt ? data.updatedAt.toDate() : new Date(),
    } as Team;
  } catch (error: any) {
    console.error(`TeamActions: Error fetching team by ID ${teamId}:`, error.message, error.stack);
    return null;
  }
}

export async function getAllTeams(): Promise<Team[]> {
  console.log(`TeamActions: Attempting to fetch all teams.`);
  if (!adminDb) {
    console.warn("TeamActions (getAllTeams): Admin SDK not available. Returning empty array.");
    return [];
  }

  try {
    const teamsCollectionRef = adminDb.collection('teams');
    const querySnapshot = await teamsCollectionRef.orderBy('name', 'asc').get();

    if (querySnapshot.empty) {
      console.log(`TeamActions: No teams found.`);
      return [];
    }
    
    console.log(`TeamActions: Found ${querySnapshot.docs.length} total teams.`);
    
    const teams = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
        updatedAt: data.updatedAt ? data.updatedAt.toDate() : new Date(),
      } as Team;
    });
    
    return teams;
  } catch (error: any) {
    console.error(`TeamActions: Error fetching all teams:`, error.message, error.stack);
    if (error.code === 'failed-precondition' && error.message.includes("index")) {
        console.error("TeamActions: Firestore query failed. This is likely due to a missing Firestore index. Please create an index on the 'name' field (ascending) for the 'teams' collection.");
    }
    return [];
  }
}

export async function getTeamsByCoach(userId: string): Promise<Team[]> {
  console.log(`TeamActions: Attempting to fetch teams for coach userId: ${userId}`);
  if (!adminDb) {
    console.warn("TeamActions (getTeamsByCoach): Admin SDK not available. Returning empty array.");
    return [];
  }
  if (!userId) {
    console.warn("TeamActions (getTeamsByCoach): userId is required.");
    return [];
  }

  try {
    const teamsCollectionRef = adminDb.collection('teams');
    const q = teamsCollectionRef.where('coachIds', 'array-contains', userId);
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
      console.log(`TeamActions: No teams found for coach: ${userId}`);
      return [];
    }
    
    console.log(`TeamActions: Found ${querySnapshot.docs.length} teams for coach: ${userId}.`);
    
    const teams = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
        updatedAt: data.updatedAt ? data.updatedAt.toDate() : new Date(),
      } as Team;
    });

    teams.sort((a, b) => a.name.localeCompare(b.name));
    
    return teams;
  } catch (error: any) {
    console.error(`TeamActions: Error fetching teams for coach ${userId}:`, error.message, error.stack);
    if (error.code === 'failed-precondition' && error.message.includes("index")) {
        console.error("TeamActions: Firestore query failed. This is likely due to a missing Firestore index. Please create an index on the 'coachIds' field for the 'teams' collection.");
    }
    return [];
  }
}

export async function updateTeamCoaches(
    teamId: string,
    coachIds: string[],
    actorId: string // The UID of the user performing the action
): Promise<{ success: boolean; error?: string }> {
    if (!adminDb) return { success: false, error: "Database not initialized." };
    if (!actorId) return { success: false, error: "User not authenticated." };
    
    try {
        const teamRef = adminDb.collection('teams').doc(teamId);
        const teamSnap = await teamRef.get();
        if (!teamSnap.exists) {
            return { success: false, error: "Team not found." };
        }
        // We need to cast to a type that we know has `clubId` and `coordinatorIds`
        const teamData = teamSnap.data() as Team;

        const actorProfileSnap = await adminDb.collection('user_profiles').doc(actorId).get();
        if (!actorProfileSnap.exists) {
            return { success: false, error: "Action performer profile not found."};
        }
        const actorProfile = actorProfileSnap.data() as UserFirestoreProfile;

        // Permission Check
        const isSuperAdmin = actorProfile.profileTypeId === 'super_admin';
        const isClubAdmin = actorProfile.profileTypeId === 'club_admin' && actorProfile.clubId === teamData.clubId;
        const isCoordinator = actorProfile.profileTypeId === 'coordinator' && teamData.coordinatorIds?.includes(actorId);

        if (!isSuperAdmin && !isClubAdmin && !isCoordinator) {
            return { success: false, error: "You do not have permission to manage this team's coaches." };
        }

        await teamRef.update({
            coachIds: coachIds,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        
        revalidatePath(`/clubs/${teamData.clubId}/teams/${teamId}`);
        return { success: true };

    } catch (error: any) {
        console.error(`Error updating coaches for team ${teamId}:`, error);
        return { success: false, error: error.message || "Failed to update coaches." };
    }
}
