export interface TargetWord {
  index: number;
  sentence_index: number;
  source_word_index: number;
  word: string;
}

export interface LessonDetail {
  id: string;
  title: string;
  text_source: string;
  target_data: TargetWord[];
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
