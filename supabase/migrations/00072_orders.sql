-- ============================================================
-- orders — 파트너 와인 구매 예약 (옵션 2).
--
-- 2026-05-18: MVP 예약 시스템. PG 결제 X (현장 결제 / 직접 약속).
-- 상태 머신: pending → confirmed → picked_up / cancelled.
--
-- 흐름:
--   customer: 구매 요청 (status=pending)
--   partner:  승인 (confirmed) 또는 거절 (cancelled)
--   partner:  픽업 완료 (picked_up)
--   customer: pending 일 때만 본인 취소 가능
--
-- 재고 자동 감소 X — 파트너가 stock 컬럼 수동 관리.
-- ============================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'order_status') then
    create type order_status as enum ('pending', 'confirmed', 'picked_up', 'cancelled');
  end if;
end $$;

create table if not exists orders (
  id              bigserial primary key,
  customer_id     uuid not null references profiles(id) on delete cascade,
  partner_id      uuid not null references profiles(id) on delete cascade,
  wine_menu_id    bigint not null references partner_wine_menu(id) on delete cascade,
  wine_id         bigint not null references wines(id),
  quantity        integer not null default 1 check (quantity > 0),
  unit_price      integer not null check (unit_price >= 0),  -- snapshot at order time
  total_price     integer not null check (total_price >= 0),
  status          order_status not null default 'pending',
  customer_note   text,
  partner_note    text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- 인덱스 — 본인 customer / 본인 partner / 상태별 쿼리
create index if not exists idx_orders_customer on orders(customer_id, created_at desc);
create index if not exists idx_orders_partner  on orders(partner_id, status, created_at desc);
create index if not exists idx_orders_wine_menu on orders(wine_menu_id);

-- updated_at 자동
create or replace function trg_orders_set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists orders_set_updated_at on orders;
create trigger orders_set_updated_at before update on orders
  for each row execute function trg_orders_set_updated_at();

-- RLS
alter table orders enable row level security;

-- SELECT: 본인 (customer 또는 partner)
drop policy if exists "orders_select_own" on orders;
create policy "orders_select_own" on orders for select
  using (auth.uid() = customer_id or auth.uid() = partner_id);

-- INSERT: customer 가 본인 명의로만
drop policy if exists "orders_insert_customer" on orders;
create policy "orders_insert_customer" on orders for insert
  with check (auth.uid() = customer_id);

-- UPDATE: partner 는 status / partner_note, customer 는 pending 일 때 cancel 만
-- 단순화 위해 둘 다 own row 면 UPDATE 허용 — 컬럼 단위 제한은 app 단에서.
drop policy if exists "orders_update_party" on orders;
create policy "orders_update_party" on orders for update
  using (auth.uid() = customer_id or auth.uid() = partner_id);

-- DELETE 정책 없음 — 주문은 cancelled 상태로만 마감, hard delete X.
