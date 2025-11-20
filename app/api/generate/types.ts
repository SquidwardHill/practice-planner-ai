export interface PracticeBlock {
  time_slot: string;
  drill_name: string;
  category: string;
  duration: number;
  notes: string;
}

export interface PracticePlan {
  practice_title: string;
  total_duration_minutes: number;
  blocks: PracticeBlock[];
}

