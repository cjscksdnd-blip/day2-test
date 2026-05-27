-- =============================================
-- 형상관리 테이블 설정
-- Supabase Dashboard > SQL Editor 에서 실행하세요
-- =============================================

create table if not exists public.config_items (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  status text not null default 'planning'
    check (status in ('planning', 'in_progress', 'completed', 'on_hold')),
  priority text not null default 'medium'
    check (priority in ('high', 'medium', 'low')),
  progress integer not null default 0
    check (progress >= 0 and progress <= 100),
  start_date date,
  end_date date,
  author_id uuid references auth.users on delete cascade not null,
  created_at timestamptz default now()
);

alter table public.config_items enable row level security;

create policy "config_items are viewable by everyone"
  on public.config_items for select using (true);

create policy "authenticated users can insert config_items"
  on public.config_items for insert with check (auth.uid() = author_id);

create policy "users can update own config_items"
  on public.config_items for update using (auth.uid() = author_id);

create policy "users can delete own config_items"
  on public.config_items for delete using (auth.uid() = author_id);

create index if not exists config_items_created_at_idx on public.config_items(created_at desc);
create index if not exists config_items_status_idx on public.config_items(status);
