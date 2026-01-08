
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

export interface DashboardState {
  unlocked: boolean;
  tasks: Task[];
}
