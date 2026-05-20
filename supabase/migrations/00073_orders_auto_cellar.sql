-- ============================================================
-- orders → collections 자동 등록 트리거.
--
-- 2026-05-18: 구매 요청 시 해당 와인이 customer 셀러에 자동 등록.
-- source='shop_purchase' 로 마크 (profile stats 의 '구매' 카운트에 합산).
-- purchase_price 도 구매 단가 snapshot, purchase_date 자동.
--
-- 정책: INSERT (status=pending) 시점에 즉시 등록.
-- 사용자가 "주문 → 바로 셀러에 떴음" 인지. 취소되어도 collection 은 남김
-- (사용자가 수동 제거 가능). 이유: 같은 와인 재주문 시 중복 막기보단 사용자 의도.
-- ============================================================

create or replace function trg_orders_add_to_cellar()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into collections (
    user_id, wine_id, source, purchase_price, purchase_date, is_public
  ) values (
    new.customer_id, new.wine_id, 'shop_purchase',
    new.unit_price, current_date, true
  );
  return new;
end;
$$;

drop trigger if exists orders_add_to_cellar on orders;
create trigger orders_add_to_cellar
  after insert on orders
  for each row execute function trg_orders_add_to_cellar();
