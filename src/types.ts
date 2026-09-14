export type Priority = 'High' | 'Medium' | 'Low';

export interface Task {
  id: string;
  title: string;
  startTime: string; // HH:mm (24h)
  duration: number; // in minutes
  priority: Priority;
  completed: boolean;
  category: string;
  notes?: string;
}

export type ScheduleHealth = 'ON_TRACK' | 'SLIPPING' | 'CRITICAL';

export interface DayStats {
  completedCount: number;
  totalCount: number;
  plannedMinutes: number;
  completedMinutes: number;
  remainingMinutes: number;
  availableMinutes: number;
  health: ScheduleHealth;
}
