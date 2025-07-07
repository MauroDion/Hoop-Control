"use server";

import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/firebase/admin";
import admin from 'firebase-admin';
import type { Task, TaskFormData } from "@/types";

export async function createTask(formData: TaskFormData, userId: string): Promise<{ success: boolean; error?: string, id?: string }> {
  if (!userId) {
    return { success: false, error: "User not authenticated." };
  }
  if (!adminDb) {
    return { success: false, error: "Database not initialized."};
  }

  try {
    const newTaskData = {
      ...formData,
      dueDate: formData.dueDate ? admin.firestore.Timestamp.fromDate(new Date(formData.dueDate)) : null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      userId: userId,
    };
    const docRef = await adminDb.collection("tasks").add(newTaskData);
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
  if (!adminDb) {
    return { success: false, error: "Database not initialized."};
  }
  try {
    const taskRef = adminDb.collection("tasks").doc(id);
    const taskSnap = await taskRef.get();
    
    if (!taskSnap.exists || taskSnap.data()?.userId !== userId) {
      return { success: false, error: "Permission denied or task not found."};
    }

    const updateData: { [key: string]: any } = { ...formData, updatedAt: admin.firestore.FieldValue.serverTimestamp() };
    if (formData.dueDate) {
      updateData.dueDate = admin.firestore.Timestamp.fromDate(new Date(formData.dueDate));
    } else if (formData.dueDate === null) {
      updateData.dueDate = null;
    }
    
    await taskRef.update(updateData);
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
  if (!adminDb) {
    return { success: false, error: "Database not initialized."};
  }
  try {
    const taskRef = adminDb.collection("tasks").doc(id);
    const taskSnap = await taskRef.get();
    if (!taskSnap.exists() || taskSnap.data()?.userId !== userId) {
      return { success: false, error: "Permission denied or task not found."};
    }
    await taskRef.delete();
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
  if (!adminDb) {
    return [];
  }
  try {
    const q = adminDb.collection("tasks").where("userId", "==", userId);
    const querySnapshot = await q.get();
    const tasks = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            dueDate: data.dueDate ? data.dueDate.toDate() : null,
            createdAt: data.createdAt.toDate(),
            updatedAt: data.updatedAt.toDate(),
        } as Task
    });
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
  if (!adminDb) {
    return null;
  }
  try {
    const taskRef = adminDb.collection("tasks").doc(id);
    const taskSnap = await taskRef.get();
    
    if (taskSnap.exists() && taskSnap.data()?.userId === userId) {
       const data = taskSnap.data()!;
       return {
            id: taskSnap.id,
            ...data,
            dueDate: data.dueDate ? data.dueDate.toDate() : null,
            createdAt: data.createdAt.toDate(),
            updatedAt: data.updatedAt.toDate(),
        } as Task;
    }
    return null;
  } catch (error) {
    console.error("Error fetching task by ID:", error);
    return null;
  }
}
