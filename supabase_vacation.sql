-- =============================================
-- 휴가관리 테이블 설정
-- Supabase Dashboard > SQL Editor 에서 실행
-- =============================================

create table if not exists public.vacations (
  id            uuid default gen_random_uuid() primary key,
  employee_name text not null,
  start_date    date not null,
  end_date      date not null,
  vacation_type text not null default '연차',
  reason        text,
  created_at    timestamptz default now()
);

-- RLS 활성화
alter table public.vacations enable row level security;

-- 누구나 조회 가능
create policy "Public read vacations"
  on public.vacations for select using (true);

-- 누구나 등록 가능 (인증 불필요)
create policy "Public insert vacations"
  on public.vacations for insert with check (true);

-- 누구나 삭제 가능 (인증 불필요)
create policy "Public delete vacations"
  on public.vacations for delete using (true);

-- 조회 성능 인덱스
create index if not exists vacations_dates_idx
  on public.vacations(start_date, end_date);
