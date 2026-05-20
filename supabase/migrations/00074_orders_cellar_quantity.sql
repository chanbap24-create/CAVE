-- ============================================================
-- orders → collections 트리거 — 주문 수량을 collections.quantity 에 반영.
--
-- 2026-05-18: 이전 트리거는 default quantity (1) 만 들어가서 5병 주문해도
-- 셀러엔 1병만 표시. 주문 수량을 그대로 전달.
-- ============================================================

create or replace function trg_orders_add_to_cellar()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into collections (
    user_id, wine_id, source, quantity, purchase_price, purchase_date, is_public
  ) values (
    new.customer_id, new.wine_id, 'shop_purchase',
    new.quantity, new.unit_price, current_date, true
  );
  return new;
end;
$$;
