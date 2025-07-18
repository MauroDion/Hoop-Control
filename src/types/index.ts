
import type { Timestamp } from 'firebase/firestore';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'inprogress' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  userId: string;
}

export interface TaskFormData {
  title: string;
  description?: string;
  status: 'todo' | 'inprogress' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string | null;
}

export interface ApiDataItem {
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
  | 'user'
  | null; // Allow null for new users
  
export interface Child {
  id: string; // for React key
  playerId: string;
}

export interface UserFirestoreProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  profileTypeId: ProfileType;
  clubId: string | null;
  status: UserProfileStatus;
  createdAt: string | Date;
  updatedAt: string | Date;
  isSeeded?: boolean;
  onboardingCompleted?: boolean;
  children?: Child[];
  teamsAsCoach?: Team[];
}

export interface UserProfileAdminView extends UserFirestoreProfile {
  clubName?: string;
  profileTypeLabel?: string;
}

export interface Club {
  id: string;
  name: string;
  shortName: string | null;
  province_name: string | null;
  city_name: string | null;
  logoUrl: string | null;
  approved: boolean;
  createdAt: string | Date | null;
  createdBy?: string;
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
  gameFormatId: string | null;
  competitionCategoryId: string | null;
  playerIds?: string[];
  logoUrl: string | null;
  city: string | null;
  createdAt: string | Date | null;
  updatedAt: string | Date | null;
  createdByUserId: string | null;
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
  description: string | null;
  numPeriods: number | null;
  periodDurationMinutes: number | null;
  defaultTotalTimeouts: number | null;
  minPeriodsPlayerMustPlay: number | null;
  createdAt: string | Date | null;
  createdBy: string | null;
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
  description: string | null;
  level: number | null;
  isFeminine: boolean;
  gameFormatId: string | null;
  createdAt: string | Date | null;
  updatedAt: string | Date | null;
  createdBy: string | null;
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
  jerseyNumber: number | null;
  position: string | null;
  teamId: string | null;
  createdBy: string | null;
  createdAt: string | Date | null;
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
    createdAt: string | Date | null;
    createdBy: string | null;
    updatedAt: string | Date | null;
    updatedBy: string | null;
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
    blocksAgainst: number;
    foulsReceived: number;
}

export type StatCategory = 'shots' | 'fouls' | 'turnovers';

export type GameEventAction = 
  | 'shot_made_1p' | 'shot_miss_1p'
  | 'shot_made_2p' | 'shot_miss_2p'
  | 'shot_made_3p' | 'shot_miss_3p'
  | 'rebound_offensive' | 'rebound_defensive'
  | 'assist'
  | 'steal'
  | 'block'
  | 'turnover'
  | 'foul'
  | 'block_against'
  | 'foul_received'
  | 'team_foul'
  | 'timeout'
  | 'substitution_in' | 'substitution_out'
  | 'period_start' | 'period_end'
  | 'timer_start' | 'timer_pause';

export interface GameEvent {
    id: string;
    gameId: string;
    teamId: 'home' | 'away' | 'system';
    playerId?: string;
    playerName?: string;
    action: GameEventAction;
    period: number;
    gameTimeSeconds: number;
    createdAt: string | Date;
    createdBy: string;
    playerIn?: { id: string, name: string };
    playerOut?: { id: string, name: string };
}

export interface PlayerGameStats {
  playerId: string;
  playerName: string;
  timePlayedSeconds: number;
  periodsPlayed: number;
  periodsPlayedSet: number[];
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
  blocks_against: number;
  fouls_received: number;
  pir: number;
  plusMinus: number;
}

export interface Game {
    id: string;
    homeTeamId: string;
    homeTeamClubId: string;
    homeTeamName: string;
    awayTeamId: string;
    awayTeamClubId: string;
    awayTeamName: string;
    homeTeamLogoUrl: string | null;
    awayTeamLogoUrl: string | null;
    date: string | Date;
    location: string;
    status: 'scheduled' | 'inprogress' | 'completed' | 'cancelled';
    seasonId: string;
    competitionCategoryId: string;
    gameFormatId: string | null;
    homeTeamPlayerIds: string[];
    awayTeamPlayerIds: string[];
    homeTeamOnCourtPlayerIds: string[];
    awayTeamOnCourtPlayerIds: string[];
    homeTeamScore: number;
    awayTeamScore: number;
    homeTeamStats: TeamStats;
    awayTeamStats: TeamStats;
    playerStats: { [playerId: string]: Partial<PlayerGameStats> };
    teamFoulsByPeriod: {
      home: { [period: number]: number };
      away: { [period: number]: number };
    };
    currentPeriod: number;
    periodTimeRemainingSeconds: number;
    isTimerRunning: boolean;
    timerStartedAt: string | Date | null;
    scorerAssignments: {
      [key in StatCategory]?: {
        uid: string;
        displayName: string;
      } | null;
    };
    createdBy: string;
    createdAt: string | Date;
    updatedAt: string | Date;
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

export interface BrandingSettings {
  appName?: string;
  logoHeaderUrl?: string | null;
  logoLoginUrl?: string | null;
  logoHeroUrl?: string | null;
}
