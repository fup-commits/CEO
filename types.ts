
export enum TaskType {
  TODAY = 'today',
  CHECKLIST = 'checklist',
  YESTERDAY = 'yesterday'
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  type: TaskType;
  createdAt: number;
}

export interface Mail {
  id: string;
  from: string;
  subject: string;
  link: string;
  isNaver?: boolean;
}

export interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO string or date string
  end?: string;
  location?: string;
  description?: string;
  color?: string;
}

export interface DashboardState {
  unlocked: boolean;
  tasks: Task[];
}
