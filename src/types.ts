export type Gender = 'Male' | 'Female' | 'Other';

export interface Athlete {
  id: string;
  name: string;
  age: number;
  primarySport: string;
  gender: Gender;
  schoolClass: string;
  createdAt: string;
  teacherId: string;
}

export type TrialType = 'sprint_50m' | 'sprint_100m' | 'long_jump' | 'high_jump' | 'shuttle_run';

export interface Trial {
  id: string;
  athleteId: string;
  teacherId: string;
  type: TrialType;
  value: number; // seconds or meters
  unit: 's' | 'm';
  timestamp: string;
  notes?: string;
}

export interface Badge {
  id: string;
  athleteId: string;
  badgeType: string;
  awardedAt: string;
  requirementMet: string;
}

export const TRIAL_LABELS: Record<TrialType, string> = {
  sprint_50m: '50m Sprint',
  sprint_100m: '100m Sprint',
  long_jump: 'Long Jump',
  high_jump: 'High Jump',
  shuttle_run: 'Shuttle Run',
};

export const BENCHMARKS: Record<TrialType, { gold: number; silver: number; bronze: number; unit: string }> = {
  sprint_50m: { gold: 7.0, silver: 8.0, bronze: 9.5, unit: 's' },
  sprint_100m: { gold: 12.5, silver: 14.0, bronze: 16.0, unit: 's' },
  long_jump: { gold: 5.5, silver: 4.5, bronze: 3.5, unit: 'm' },
  high_jump: { gold: 1.6, silver: 1.4, bronze: 1.2, unit: 'm' },
  shuttle_run: { gold: 9.0, silver: 10.5, bronze: 12.0, unit: 's' },
};
