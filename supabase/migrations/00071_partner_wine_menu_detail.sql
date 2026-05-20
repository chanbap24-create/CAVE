-- ============================================================
-- partner_wine_menu — 상세 등록 페이지용 필드 추가.
--
-- 2026-05-18: 파트너가 단순 가격만 등록하던 것을 데일리샷 스타일 상세 정보
-- (정가/할인 표시 + 코멘트 + 재고 + 빈티지 override + 자체 사진) 까지 받음.
--
-- 모든 추가 컬럼 nullable — 기존 행 깨지지 않음.
-- ============================================================

alter table partner_wine_menu
  add column if not exists original_price integer,        -- 정가 (할인% 계산용). null 이면 할인 표시 X
  add column if not exists note text,                     -- 한 줄 코멘트 ("매장 한정", "마지막 1병")
  add column if not exists stock integer,                 -- 재고 수량 (null = 표시 안 함)
  add column if not exists vintage_year smallint,         -- 빈티지 override (null 이면 wines.vintage_year)
  add column if not exists photo_url text;                -- 자체 사진 (null 이면 wines.image_url)

-- 가격 정합 — original_price 있으면 price(판매가) <= original_price
-- (할인 시나리오만 허용; 인상은 안 됨).
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'partner_wine_menu_price_check'
  ) then
    alter table partner_wine_menu
      add constraint partner_wine_menu_price_check
      check (original_price is null or price <= original_price);
  end if;
end $$;

-- stock 음수 방지
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'partner_wine_menu_stock_check'
  ) then
    alter table partner_wine_menu
      add constraint partner_wine_menu_stock_check
      check (stock is null or stock >= 0);
  end if;
end $$;
