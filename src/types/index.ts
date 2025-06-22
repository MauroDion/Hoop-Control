import type { Timestamp } from 'firebase/firestore';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'inprogress' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date | null; // Changed from Timestamp
  createdAt: Date; // Changed from Timestamp
  updatedAt: Date; // Changed from Timestamp
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
  createdAt: Date; // Changed from Timestamp
  updatedAt: Date; // Changed from Timestamp
}

// ViewModel for admin user management page
export interface UserProfileAdminView extends UserFirestoreProfile {
  clubName?: string;
  profileTypeLabel?: string;
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
  createdAt?: Date; // Changed from Timestamp
}

export interface ClubFormData {
  name: string;
  shortName?: string;
  province_name?: string;
  city_name?: string;
  logoUrl?: string;
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
  coordinatorIds?: string[];
  gameFormatId?: string | null; // Refers to GameFormat.id
  competitionCategoryId?: string | null; // Refers to CompetitionCategory.id
  playerIds?: string[];
  logoUrl?: string | null;
  city?: string | null;
  createdAt: Date; // Changed from Timestamp
  updatedAt: Date; // Changed from Timestamp
  createdByUserId: string;
}

export interface TeamFormData {
  name: string;
  coachIds?: string; // Comma-separated string for form input
  coordinatorIds?: string;
  gameFormatId?: string | null;
  competitionCategoryId?: string | null;
  playerIds?: string; // Comma-separated string for form input
  logoUrl?: string | null;
  city?: string | null;
}

export interface Season {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  status: 'draft' | 'active' | 'archived';
  competitions: Array<{
    competitionCategoryId: string;
    teamIds: string[];
  }>;
  createdBy?: string; // UID
  createdAt?: Date;
}

export interface SeasonFormData {
  name: string;
  startDate: string;
  endDate: string;
  status: 'draft' | 'active' | 'archived';
  competitions: Array<{
    competitionCategoryId: string;
    teamIds: string[];
  }>;
}

export interface GameFormat {
  id: string; // Firestore document ID
  name: string;
  description?: string;
  numPeriods?: number;
  periodDurationMinutes?: number;
  defaultTotalTimeouts?: number;
  minPeriodsPlayerMustPlay?: number;
  createdAt?: Date; // Changed from Timestamp
}

export interface CompetitionCategory {
  id: string; // Firestore document ID
  name: string;
  description?: string;
  level?: number;
  createdAt?: Date; // Changed from Timestamp
  updatedAt?: Date; // Changed from Timestamp
}

export interface Player {
  id: string;
  firstName: string;
  lastName: string;
  jerseyNumber?: number;
  position?: string;
  teamId?: string;
  createdBy?: string; // UID
  createdAt?: Date; // Changed from Timestamp
}

export interface PlayerFormData {
  firstName: string;
  lastName: string;
  jerseyNumber?: number | null;
  position?: string | null;
}

export interface Game {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string; // denormalized
  awayTeamName: string; // denormalized
  date: Date;
  location: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  homeTeamPlayerIds?: string[];
  awayTeamPlayerIds?: string[];
  homeTeamScore?: number;
  awayTeamScore?: number;
  createdBy: string; // user id
  createdAt: Date;
  updatedAt: Date;
  // New fields for season integration
  seasonId: string;
  gameFormatId?: string | null;
  competitionCategoryId: string;
}

export interface GameFormData {
  homeTeamId: string;
  awayTeamId: string;
  date: string; // From date input
  time: string; // From time input
  location: string;
  seasonId: string;
  competitionCategoryId: string;
  gameFormatId?: string | null;
}
