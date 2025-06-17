
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

// New types for User Profile and Approval Flow
export type UserProfileStatus = 'pending_approval' | 'approved' | 'rejected';

// Updated to match Firestore document IDs from the image
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
  profileType: ProfileType;
  selectedClubId: string;
  status: UserProfileStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  // roles?: string[]; // Future: for super_admin, etc.
}

export interface Club {
  id: string;
  name: string;
  approved?: boolean; 
  createdAt?: Timestamp;
}

// Option for profile type select dropdown, loaded from Firestore
export interface ProfileTypeOption {
  id: ProfileType; // Ensures the ID matches one of the allowed ProfileType values
  label: string;
}
