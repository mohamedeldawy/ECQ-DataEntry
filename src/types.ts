export type Role = 'manager' | 'dataEntry' | 'quality';

export type CatalogType = 'teachers' | 'grades' | 'subjects' | 'lectures';

export interface CatalogItem {
  id: number;
  type: CatalogType;
  label: string;
  created_at: string;
}

export interface TaskFile {
  id: string;
  task_id: number;
  kind: 'raw' | 'prepared';
  name: string;
  size: number;
  uploaded_by: number;
  uploaded_at: string;
  url?: string; // base64 or blob URL
}

export interface Task {
  id: number;
  teacher_id: number;
  grade_id: number;
  subject_id: number;
  lecture_id: number;
  quality_id: number;
  data_entry_id: number | null;
  task_owner: 'dataEntry' | 'quality';
  start_date: string | null;
  delivery_date: string | null;
  lecture_schedule: string | null;
  asking_date: string | null;
  warning_date: string | null;
  shooting_date: string | null;
  created_at: string;
  updated_at: string;
  // joined fields
  teacher?: string;
  grade?: string;
  subject?: string;
  lecture?: string;
  quality_name?: string;
  data_entry_name?: string;
  raw_files: TaskFile[];
  prepared_files: TaskFile[];
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  subject_id: number | null;
  active: boolean;
  password?: string;
}
