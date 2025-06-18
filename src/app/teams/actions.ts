
"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/firebase/client";
import {
  collection,
  addDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
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

  try {
    const newTeamData: Omit<Team, "id" | "createdAt" | "updatedAt"> & { createdAt: any, updatedAt: any } = {
      name: formData.name.trim(),
      clubId: clubId,
      gameFormatId: formData.gameFormatId || null,
      competitionCategoryId: formData.competitionCategoryId || null,
      coachIds: formData.coachIds ? formData.coachIds.split(',').map(id => id.trim()).filter(id => id) : [],
      playerIds: formData.playerIds ? formData.playerIds.split(',').map(id => id.trim()).filter(id => id) : [],
      logoUrl: formData.logoUrl || null,
      city: formData.city || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdByUserId: userId,
    };

    const docRef = await addDoc(collection(db, "teams"), newTeamData);
    
    revalidatePath(`/clubs/${clubId}`);
    // Potentially revalidate a general teams list page if one exists
    // revalidatePath(`/teams`); 

    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error("Error creating team:", error);
    return { success: false, error: error.message || "Failed to create team." };
  }
}

// Future actions like getTeamsByClub, getTeamById, updateTeam, deleteTeam will go here.
