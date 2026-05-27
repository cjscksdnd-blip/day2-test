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
