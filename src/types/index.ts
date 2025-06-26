import type { Timestamp } from 'firebase/firestore';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'inprogress' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface TaskFormData {
  title: string;
  description?: string;
  status: 'todo' | 'inprogress' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string | null;
}

export interface BcsjdApiDataItem {
  id: string | number;
  name: string;
  value: string | number;
  category: string;
  lastUpdated: string;
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
  createdAt: string;
  updatedAt: string;
}

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
  createdBy?: string;
  createdAt?: string;
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
  gameFormatId?: string | null;
  competitionCategoryId?: string | null;
  playerIds?: string[];
  logoUrl?: string | null;
  city?: string | null;
  createdAt: string;
  updatedAt: string;
  createdByUserId: string;
}

export interface TeamFormData {
  name: string;
  coachIds?: string[];
  coordinatorIds?: string[];
  gameFormatId?: string | null;
  competitionCategoryId?: string | null;
}

export interface GameFormat {
  id: string;
  name: string;
  description?: string;
  numPeriods?: number;
  periodDurationMinutes?: number;
  defaultTotalTimeouts?: number;
  minPeriodsPlayerMustPlay?: number;
  createdAt?: string;
  createdBy?: string;
}

export interface GameFormatFormData {
    name: string;
    description?: string;
    numPeriods?: number;
    periodDurationMinutes?: number;
    defaultTotalTimeouts?: number;
    minPeriodsPlayerMustPlay?: number;
}

export interface CompetitionCategory {
  id: string;
  name: string;
  description?: string;
  level?: number;
  gameFormatId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface CompetitionCategoryFormData {
  name: string;
  description?: string;
  level?: number;
  gameFormatId?: string | null;
}


export interface Player {
  id: string;
  firstName: string;
  lastName: string;
  jerseyNumber?: number;
  position?: string;
  teamId?: string;
  createdBy?: string;
  createdAt?: string;
}

export interface PlayerFormData {
  firstName: string;
  lastName: string;
  jerseyNumber?: number | null;
  position?: string | null;
}

export interface Season {
    id: string;
    name: string;
    status: 'active' | 'archived' | 'upcoming';
    competitions: {
        competitionCategoryId: string;
        teamIds: string[];
    }[];
    createdAt?: string;
    createdBy?: string;
    updatedAt?: string;
    updatedBy?: string;
}

export interface SeasonFormData {
  name: string;
  status: 'active' | 'archived' | 'upcoming';
  competitions: {
      competitionCategoryId: string;
      teamIds: string[];
  }[];
}

export interface TeamStats {
    onePointAttempts: number;
    onePointMade: number;
    twoPointAttempts: number;
    twoPointMade: number;
    threePointAttempts: number;
    threePointMade: number;
    fouls: number;
    timeouts: number;
    reboundsOffensive: number;
    reboundsDefensive: number;
    assists: number;
    steals: number;
    blocks: number;
    turnovers: number;
}

export type StatCategory = 'shots' | 'fouls' | 'timeouts' | 'steals';

export type GameEventAction = 
  | 'shot_made_1p' | 'shot_miss_1p'
  | 'shot_made_2p' | 'shot_miss_2p'
  | 'shot_made_3p' | 'shot_miss_3p'
  | 'rebound_offensive' | 'rebound_defensive'
  | 'assist'
  | 'steal'
  | 'block'
  | 'turnover'
  | 'foul';

export interface GameEvent {
    id: string;
    gameId: string;
    teamId: 'home' | 'away';
    playerId: string;
    playerName: string;
    action: GameEventAction;
    period: number;
    gameTimeSeconds: number;
    createdAt: string; // ISO string
}

export interface Game {
    id: string;
    homeTeamId: string;
    homeTeamClubId: string;
    homeTeamName: string;
    awayTeamId: string;
    awayTeamClubId: string;
    awayTeamName: string;
    date: string;
    location: string;
    status: 'scheduled' | 'inprogress' | 'completed' | 'cancelled';
    seasonId: string;
    competitionCategoryId: string;
    gameFormatId?: string | null;
    homeTeamPlayerIds?: string[];
    awayTeamPlayerIds?: string[];
    homeTeamOnCourtPlayerIds?: string[];
    awayTeamOnCourtPlayerIds?: string[];
    homeTeamScore?: number;
    awayTeamScore?: number;
    homeTeamStats?: TeamStats;
    awayTeamStats?: TeamStats;
    currentPeriod?: number;
    periodTimeRemainingSeconds?: number;
    isTimerRunning?: boolean;
    scorerAssignments?: {
      [key in StatCategory]?: {
        uid: string;
        displayName: string;
      } | null;
    };
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

export interface GameFormData {
    homeTeamId: string;
    awayTeamId: string;
    date: string;
    time: string;
    location: string;
    seasonId: string;
    competitionCategoryId: string;
    gameFormatId?: string | null;
}

export interface PlayerGameStats {
  playerId: string;
  playerName: string;
  points: number;
  shots_made_1p: number; shots_attempted_1p: number;
  shots_made_2p: number; shots_attempted_2p: number;
  shots_made_3p: number; shots_attempted_3p: number;
  reb_def: number;
  reb_off: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;
  pir: number; // Performance Index Rating
}

export interface BrandingSettings {
  appName?: string;
  logoHeaderUrl?: string;
  logoLoginUrl?: string;
  logoHeroUrl?: string;
}