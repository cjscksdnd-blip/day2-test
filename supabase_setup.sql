-- =============================================
-- Supabase 게시판 앱 스키마 설정
-- Supabase Dashboard > SQL Editor 에서 실행하세요
-- =============================================

-- profiles 테이블 (auth.users 와 연결)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- auth.users 에 새 유저 생성 시 profiles 자동 생성 트리거
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- posts 테이블
create table if not exists public.posts (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content text not null,
  author_id uuid references auth.users on delete cascade not null,
  created_at timestamptz default now()
);

alter table public.posts enable row level security;

-- 게시글 RLS 정책
create policy "posts are viewable by everyone"
  on public.posts for select using (true);

create policy "authenticated users can insert posts"
  on public.posts for insert with check (auth.uid() = author_id);

create policy "users can update own posts"
  on public.posts for update using (auth.uid() = author_id);

create policy "users can delete own posts"
  on public.posts for delete using (auth.uid() = author_id);

-- comments 테이블
create table if not exists public.comments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts on delete cascade not null,
  content text not null,
  author_id uuid references auth.users on delete cascade not null,
  created_at timestamptz default now()
);

alter table public.comments enable row level security;

-- 댓글 RLS 정책
create policy "comments are viewable by everyone"
  on public.comments for select using (true);

create policy "authenticated users can insert comments"
  on public.comments for insert with check (auth.uid() = author_id);

create policy "users can delete own comments"
  on public.comments for delete using (auth.uid() = author_id);

-- 인덱스
create index if not exists posts_created_at_idx on public.posts(created_at desc);
create index if not exists comments_post_id_idx on public.comments(post_id);
