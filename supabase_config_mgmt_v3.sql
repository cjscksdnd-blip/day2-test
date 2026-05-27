-- =============================================
-- 형상관리 updated_at 컬럼 추가 (Migration v3)
-- Supabase Dashboard > SQL Editor 에서 실행하세요
-- =============================================

ALTER TABLE public.config_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE OR REPLACE FUNCTION public.handle_config_item_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_config_item_updated ON public.config_items;
CREATE TRIGGER on_config_item_updated
  BEFORE UPDATE ON public.config_items
  FOR EACH ROW EXECUTE PROCEDURE public.handle_config_item_update();
