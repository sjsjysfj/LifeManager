// src/types/index.ts

export type TaskType = 'study' | 'life' | 'habit';
export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface Task {
  id: string;
  title: string;
  description?: string; // Markdown supported
  type: TaskType;
  status: TaskStatus;
  dueDate: string; // YYYY-MM-DD
  isDailyPlan: boolean;
  planDate?: string;
  createdAt: string;
}

export interface Habit {
  id: string;
  name: string;
  targetValue: number;
  unit: string;
  icon?: string;
}

export interface HabitLog {
  [habitId: string]: number;
}

export interface FocusLog {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  duration: number; // minutes
  tag: string;
  content?: string; // Markdown supported
  isConcurrent?: boolean; // Whether this task overlaps with others (allowed by user)
}

export interface DailyJournal {
  date: string; // YYYY-MM-DD
  lifeLog: string; // HTML/Markdown
  tomorrowPlan: string;
}

export interface DBData {
  tasks: Task[];
  habits: Habit[];
  habitLogs: { [date: string]: HabitLog };
  focusLogs: FocusLog[];
  journals: { [date: string]: DailyJournal };
}
