"use server";

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
      playerIds: [], // Player list starts empty
      logoUrl: null, // Inherit from club or manage separately
      city: null, // Inherit from club or manage separately
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdByUserId: userId,
    };

    const docRef = await adminDb.collection("teams").add(newTeamData);
    
    revalidatePath(`/clubs/${clubId}`);
    
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
