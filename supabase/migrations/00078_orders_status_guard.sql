-- ============================================================
-- orders 컬럼 단위 권한 가드 — UPDATE RLS 가 row-level 만 잡으므로 트리거 추가.
--
-- 2026-05-19 보안: 기존 UPDATE 정책은 customer/partner 둘 다 모든 컬럼 수정 가능.
-- → customer 가 본인 주문 status='picked_up' 임의 설정 가능 (현장 결제 우회 위험).
--
-- 규칙:
--   customer: status 는 'cancelled' 로만, partner_note / unit_price / total_price 등 X
--   partner:  status 는 'picked_up' 또는 'cancelled' 로만, partner_note 자유, 그 외 X
--   둘 다:    customer_id / partner_id / wine_id / wine_menu_id / quantity / unit_price
--             / total_price / created_at — 수정 불가
-- ============================================================

create or replace function trg_orders_enforce_update_perms()
returns trigger
language plpgsql
as $$
declare
  uid uuid := auth.uid();
begin
  -- 변경 불가 컬럼 — 무조건 거부
  if new.customer_id is distinct from old.customer_id
     or new.partner_id is distinct from old.partner_id
     or new.wine_id is distinct from old.wine_id
     or new.wine_menu_id is distinct from old.wine_menu_id
     or new.quantity is distinct from old.quantity
     or new.unit_price is distinct from old.unit_price
     or new.total_price is distinct from old.total_price
     or new.created_at is distinct from old.created_at
  then
    raise exception 'orders: immutable columns cannot be changed';
  end if;

  -- customer 경로
  if uid = old.customer_id and uid <> old.partner_id then
    -- status 는 cancelled 로만 (cancel 자기 주문). 기타 컬럼 변경 X.
    if new.status is distinct from old.status and new.status <> 'cancelled' then
      raise exception 'orders: customer can only set status to cancelled';
    end if;
    if new.partner_note is distinct from old.partner_note then
      raise exception 'orders: customer cannot edit partner_note';
    end if;
    if new.customer_note is distinct from old.customer_note then
      raise exception 'orders: customer_note immutable after order placement';
    end if;
    return new;
  end if;

  -- partner 경로
  if uid = old.partner_id and uid <> old.customer_id then
    -- status 는 picked_up 또는 cancelled 만
    if new.status is distinct from old.status
       and new.status not in ('picked_up', 'cancelled') then
      raise exception 'orders: partner can only set status to picked_up or cancelled';
    end if;
    if new.customer_note is distinct from old.customer_note then
      raise exception 'orders: partner cannot edit customer_note';
    end if;
    return new;
  end if;

  -- 그 외 (정책상 도달 X — 안전망)
  raise exception 'orders: not authorized to update this row';
end;
$$;

drop trigger if exists orders_enforce_update_perms on orders;
create trigger orders_enforce_update_perms
  before update on orders
  for each row execute function trg_orders_enforce_update_perms();
