
import type { Timestamp } from 'firebase/firestore';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'inprogress' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDate?: Timestamp | null; // Firestore Timestamp for dates
  createdAt: Timestamp;
  updatedAt: Timestamp;
  userId: string; // To associate task with a user
}

// For forms, especially date handling, as Firestore Timestamps are not directly usable in HTML date inputs
export interface TaskFormData {
  title: string;
  description?: string;
  status: 'todo' | 'inprogress' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string | null; // String for HTML date input, will be converted to Timestamp
}

export interface BcsjdApiDataItem {
  id: string | number;
  name: string;
  value: string | number;
  category: string;
  lastUpdated: string; // ISO date string
}

export type UserProfileStatus = 'pending_approval' | 'approved' | 'rejected';

// Updated to match Firestore document IDs from the image and collection structure
export type ProfileType = 
  | 'club_admin' 
  | 'coach' 
  | 'coordinator' 
  | 'parent_guardian' 
  | 'player' 
  | 'scorer' 
  | 'super_admin' 
  | 'user';

export interface UserFirestoreProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  profileTypeId: ProfileType; // Corrected field name
  clubId: string; // Corrected field name
  status: UserProfileStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Club {
  id: string;
  name: string;
  approved?: boolean; 
  createdAt?: Timestamp;
}

export interface ProfileTypeOption {
  id: ProfileType; 
  label: string;
}
