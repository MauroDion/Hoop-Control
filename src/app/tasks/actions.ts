"use server";

import { revalidatePath } from "next/cache";
import { db, auth as firebaseAuth } from "@/lib/firebase/client"; // Using client SDK for auth, db
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import type { Task, TaskFormData } from "@/types";

// Helper to get current user ID (server-side)
// Note: Firebase Admin SDK would be more robust for strict server-side auth.
// This approach relies on the client SDK's auth state, which might not be ideal
// for pure server actions if not careful. For true server-side, pass userId or verify ID token.
// However, with Next.js Server Actions, the auth state might be available if firebase client is initialized correctly.
// For this example, we'll assume `firebaseAuth.currentUser` is available or we'd pass `userId`.

const getCurrentUserId = (): string | null => {
  // This is a simplification. In a real app, you'd get the user ID
  // from a verified session token or pass it to the action.
  // `firebaseAuth.currentUser` might not be reliably populated in Server Actions
  // without specific setup or by passing an ID token.
  // For now, let's simulate or require it to be passed if this doesn't work.
  // A more robust way for server actions is to use Firebase Admin SDK with an ID token.
  // Or, ensure client passes userId from its auth state.
  // For this scaffold, we'll assume it's being called from a client that has auth.
  if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR) {
    return "test-user-id"; // For local emulator testing
  }
  // This will likely be null in a pure server action.
  // A better pattern is to get userId on the client and pass it to the server action.
  // Or decode an ID token if provided.
  // For simplicity in this scaffold, we will proceed but flag this as an area for improvement.
  return firebaseAuth.currentUser?.uid || null;
};


export async function createTask(formData: TaskFormData, userId: string): Promise<{ success: boolean; error?: string, id?: string }> {
  if (!userId) {
    return { success: false, error: "User not authenticated." };
  }

  try {
    const newTaskData = {
      ...formData,
      dueDate: formData.dueDate ? Timestamp.fromDate(new Date(formData.dueDate)) : null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      userId: userId,
    };
    const docRef = await addDoc(collection(db, "tasks"), newTaskData);
    revalidatePath("/tasks");
    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error("Error creating task:", error);
    return { success: false, error: error.message || "Failed to create task." };
  }
}

export async function updateTask(id: string, formData: Partial<TaskFormData>, userId: string): Promise<{ success: boolean; error?: string }> {
   if (!userId) {
    return { success: false, error: "User not authenticated." };
  }
  try {
    const taskRef = doc(db, "tasks", id);
    // Simple check, proper Firestore rules are needed for security
    // const taskSnap = await getDoc(taskRef);
    // if (taskSnap.exists() && taskSnap.data().userId !== userId) {
    //   return { success: false, error: "Permission denied."};
    // }

    const updateData: Partial<Task> = { ...formData, updatedAt: serverTimestamp() } as Partial<Task>;
    if (formData.dueDate) {
      updateData.dueDate = Timestamp.fromDate(new Date(formData.dueDate));
    } else if (formData.dueDate === null) {
      updateData.dueDate = null;
    }
    
    await updateDoc(taskRef, updateData);
    revalidatePath("/tasks");
    revalidatePath(`/tasks/${id}`);
    revalidatePath(`/tasks/${id}/edit`);
    return { success: true };
  } catch (error: any) {
    console.error("Error updating task:", error);
    return { success: false, error: error.message || "Failed to update task." };
  }
}

export async function deleteTask(id: string, userId: string): Promise<{ success: boolean; error?: string }> {
  if (!userId) {
    return { success: false, error: "User not authenticated." };
  }
  try {
    // Similar permission check as in updateTask would be good here.
    await deleteDoc(doc(db, "tasks", id));
    revalidatePath("/tasks");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting task:", error);
    return { success: false, error: error.message || "Failed to delete task." };
  }
}

export async function getTasks(userId: string): Promise<Task[]> {
  if (!userId) {
    console.warn("getTasks called without userId.");
    return [];
  }
  try {
    const q = query(collection(db, "tasks"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    const tasks = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
    return tasks;
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return [];
  }
}

export async function getTaskById(id: string, userId: string): Promise<Task | null> {
  if (!userId) {
     console.warn("getTaskById called without userId.");
    return null;
  }
  try {
    const taskRef = doc(db, "tasks", id);
    const taskSnap = await getDocs(query(collection(db, "tasks"), where("userId", "==", userId), where("__name__", "==", id))); // Ensure user owns task
    
    if (!taskSnap.empty && taskSnap.docs[0].exists()) {
      return { id: taskSnap.docs[0].id, ...taskSnap.docs[0].data() } as Task;
    }
    return null;
  } catch (error) {
    console.error("Error fetching task by ID:", error);
    return null;
  }
}
