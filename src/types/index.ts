export interface Post {
  id: string;
  title: string;
  content: string;
  author_id: string;
  created_at: string;
  profiles?: { email: string };
}

export interface Comment {
  id: string;
  post_id: string;
  content: string;
  author_id: string;
  created_at: string;
  profiles?: { email: string };
}

export interface ConfigItem {
  id: string;
  title: string;
  description: string | null;
  images: string[] | null;
  status: 'planning' | 'in_progress' | 'completed' | 'on_hold';
  priority: 'high' | 'medium' | 'low';
  progress: number;
  start_date: string | null;
  end_date: string | null;
  assignee: string | null;
  is_current: boolean | null;
  author_id: string;
  created_at: string;
  updated_at: string | null;
}
