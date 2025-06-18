
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
    const newTeamData: Omit<Team, "id"> = {
      name: formData.name.trim(),
      clubId: clubId,
      // seasonId: formData.seasonId || null, // For future expansion
      // competitionCategoryId: formData.competitionCategoryId || null, // For future expansion
      createdAt: serverTimestamp() as Timestamp, // Cast needed because serverTimestamp returns a sentinel
      updatedAt: serverTimestamp() as Timestamp, // Cast needed
      createdByUserId: userId,
    };

    const docRef = await addDoc(collection(db, "teams"), newTeamData);
    
    // Revalidate path to the club's page or a teams list page if it exists
    revalidatePath(`/clubs/${clubId}`);
    // revalidatePath(`/clubs/${clubId}/teams`); // If you have a specific teams list page for a club

    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error("Error creating team:", error);
    return { success: false, error: error.message || "Failed to create team." };
  }
}
