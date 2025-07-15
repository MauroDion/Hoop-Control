
'use server';

import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/firebase/admin";
import admin from "firebase-admin";
import type { TeamFormData, Team } from "@/types";

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
      coachIds: formData.coachIds || [],
      coordinatorIds: formData.coordinatorIds || [],
      playerIds: [],
      logoUrl: null,
      city: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdByUserId: userId,
    };

    const docRef = await adminDb.collection("teams").add(newTeamData);
    
    revalidatePath(`/clubs/${clubId}`);
    revalidatePath(`/clubs/${clubId}/teams/new`);
    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error("Error creating team:", error);
    return { success: false, error: error.message || "Failed to create team." };
  }
}

export async function updateTeam(
  teamId: string,
  formData: TeamFormData,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  if (!userId) {
    return { success: false, error: "User not authenticated." };
  }
  if (!teamId) {
    return { success: false, error: "Team ID is missing." };
  }

  if (!adminDb) {
    return { success: false, error: "Database not initialized." };
  }

  try {
    const teamRef = adminDb.collection("teams").doc(teamId);
    
    const updateData = {
      name: formData.name.trim(),
      competitionCategoryId: formData.competitionCategoryId || null,
      gameFormatId: formData.gameFormatId || null,
      coachIds: formData.coachIds || [],
      coordinatorIds: formData.coordinatorIds || [],
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await teamRef.update(updateData);
    
    const teamSnap = await teamRef.get();
    const clubId = teamSnap.data()?.clubId;

    if (clubId) {
      revalidatePath(`/clubs/${clubId}`);
      revalidatePath(`/clubs/${clubId}/teams/${teamId}`);
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error updating team:", error);
    return { success: false, error: error.message || "Failed to update team." };
  }
}

export async function getTeamsByClubId(clubId: string): Promise<Team[]> {
  if (!adminDb) {
    return [];
  }
  if (!clubId) {
    return [];
  }

  try {
    const teamsCollectionRef = adminDb.collection('teams');
    const q = teamsCollectionRef.where('clubId', '==', clubId);
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
      return [];
    }
    
    const teams = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || '',
        clubId: data.clubId,
        coachIds: data.coachIds || [],
        coordinatorIds: data.coordinatorIds || [],
        gameFormatId: data.gameFormatId || null,
        competitionCategoryId: data.competitionCategoryId || null,
        playerIds: data.playerIds || [],
        logoUrl: data.logoUrl || null,
        city: data.city || null,
        createdAt: data.createdAt ? (data.createdAt as admin.firestore.Timestamp).toDate().toISOString() : null,
        updatedAt: data.updatedAt ? (data.updatedAt as admin.firestore.Timestamp).toDate().toISOString() : null,
        createdByUserId: data.createdByUserId || null
      } as Team;
    });

    teams.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    
    return teams;
  } catch (error: any) {
    console.error(`TeamActions: Error fetching teams for club ${clubId}:`, error.message, error.stack);
     if (error.code === 'failed-precondition') {
        console.error("TeamActions: Firestore query for teams failed. This could be a missing index for 'clubId'.");
    }
    return [];
  }
}

export async function getTeamById(teamId: string): Promise<Team | null> {
  if (!adminDb) {
    return null;
  }
  if (!teamId) {
    return null;
  }

  try {
    const teamDocRef = adminDb.collection('teams').doc(teamId);
    const docSnap = await teamDocRef.get();

    if (!docSnap.exists) {
      return null;
    }
    
    const data = docSnap.data()!;
    
    return {
      id: docSnap.id,
      name: data.name || '',
      clubId: data.clubId,
      coachIds: data.coachIds || [],
      coordinatorIds: data.coordinatorIds || [],
      gameFormatId: data.gameFormatId || null,
      competitionCategoryId: data.competitionCategoryId || null,
      playerIds: data.playerIds || [],
      logoUrl: data.logoUrl || null,
      city: data.city || null,
      createdAt: data.createdAt ? (data.createdAt as admin.firestore.Timestamp).toDate().toISOString() : null,
      updatedAt: data.updatedAt ? (data.updatedAt as admin.firestore.Timestamp).toDate().toISOString() : null,
      createdByUserId: data.createdByUserId || null
    } as Team;
  } catch (error: any) {
    console.error(`TeamActions: Error fetching team by ID ${teamId}:`, error.message, error.stack);
    return null;
  }
}

export async function getAllTeams(): Promise<Team[]> {
    if (!adminDb) return [];
    try {
        const teamsRef = adminDb.collection('teams');
        const querySnapshot = await teamsRef.orderBy('name', 'asc').get();
        const teams = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name || '',
                clubId: data.clubId,
                coachIds: data.coachIds || [],
                coordinatorIds: data.coordinatorIds || [],
                gameFormatId: data.gameFormatId || null,
                competitionCategoryId: data.competitionCategoryId || null,
                playerIds: data.playerIds || [],
                logoUrl: data.logoUrl || null,
                city: data.city || null,
                createdAt: data.createdAt ? (data.createdAt as admin.firestore.Timestamp).toDate().toISOString() : null,
                updatedAt: data.updatedAt ? (data.updatedAt as admin.firestore.Timestamp).toDate().toISOString() : null,
                createdByUserId: data.createdByUserId || null
            } as Team;
        });
        return teams;
    } catch (e: any) {
        if (e.code === 'failed-precondition') {
            console.error("Firestore error: Missing index for teams collection on 'name' field.");
        }
        return [];
    }
}

export async function getTeamsByCoach(userId: string): Promise<Team[]> {
    if (!adminDb || !userId) return [];
    try {
        const teamsRef = adminDb.collection('teams');
        const querySnapshot = await teamsRef.where('coachIds', 'array-contains', userId).get();
        return querySnapshot.docs.map(doc => {
            const data = doc.data();
             return {
                id: doc.id,
                name: data.name || '',
                clubId: data.clubId,
                coachIds: data.coachIds || [],
                coordinatorIds: data.coordinatorIds || [],
                gameFormatId: data.gameFormatId || null,
                competitionCategoryId: data.competitionCategoryId || null,
                playerIds: data.playerIds || [],
                logoUrl: data.logoUrl || null,
                city: data.city || null,
                createdAt: data.createdAt ? (data.createdAt as admin.firestore.Timestamp).toDate().toISOString() : null,
                updatedAt: data.updatedAt ? (data.updatedAt as admin.firestore.Timestamp).toDate().toISOString() : null,
                createdByUserId: data.createdByUserId || null
            } as Team;
        });
    } catch (e: any) {
        console.error("Error getting teams by coach:", e);
        return [];
    }
}
