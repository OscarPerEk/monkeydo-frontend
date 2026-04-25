export interface TargetWord {
  index: number;
  sentence_index: number;
  word: string;
  excluded?: boolean;
}

export interface LessonDetail {
  id: string;
  title: string;
  text_source: string;
  target_data: TargetWord[];
  range_start_index: number | null;
  range_end_index: number | null;
}

export interface LessonSummary {
  id: string;
  title: string;
}

export interface FolderOut {
  id: string;
  name: string;
  lessons: LessonSummary[];
}

export interface SidebarData {
  folders: FolderOut[];
  root_lessons: LessonSummary[];
}
