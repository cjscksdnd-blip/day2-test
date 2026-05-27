-- =============================================
-- 형상관리 담당자 컬럼 추가 (Migration v2)
-- Supabase Dashboard > SQL Editor 에서 실행하세요
-- =============================================
ALTER TABLE public.config_items ADD COLUMN IF NOT EXISTS assignee TEXT;
