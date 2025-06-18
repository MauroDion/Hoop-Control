
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
  profileTypeId: ProfileType;
  clubId: string;
  status: UserProfileStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Club {
  id: string;
  name: string;
  shortName?: string;
  province_code?: string;
  city_code?: string;
  province_name?: string;
  city_name?: string;
  logoUrl?: string;
  approved?: boolean;
  createdBy?: string; // UID
  createdAt?: Timestamp;
}

export interface ProfileTypeOption {
  id: ProfileType;
  label: string;
  description?: string;
  order?: number;
  assignableByUser?: boolean;
}

export interface Team {
  id: string;
  name: string;
  clubId: string;
  coachIds?: string[];
  gameFormatId?: string | null; // Refers to GameFormat.id
  competitionCategoryId?: string | null; // Refers to CompetitionCategory.id
  playerIds?: string[];
  logoUrl?: string | null;
  city?: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdByUserId: string;
}

export interface TeamFormData {
  name: string;
  coachIds?: string; // Comma-separated string for form input
  gameFormatId?: string | null;
  competitionCategoryId?: string | null;
  playerIds?: string; // Comma-separated string for form input
  logoUrl?: string | null;
  city?: string | null;
}

export interface Season {
  id: string;
  name: string;
  startDate: Timestamp;
  endDate: Timestamp;
  createdBy?: string; // UID
  createdAt?: Timestamp;
}

export interface GameFormat {
  id: string; // Firestore document ID
  name: string;
  description?: string;
  numPeriods?: number;
  periodDurationMinutes?: number;
  defaultTotalTimeouts?: number;
  minPeriodsPlayerMustPlay?: number;
  createdAt?: Timestamp;
}

export interface CompetitionCategory {
  id: string; // Firestore document ID
  name: string;
  description?: string;
  level?: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Player {
  id: string;
  firstName: string;
  lastName: string;
  jerseyNumber?: number;
  position?: string;
  teamId?: string;
  createdBy?: string; // UID
  createdAt?: Timestamp;
}
