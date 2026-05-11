-- ============================================================
-- partner_wine_menu — 파트너(업장) 가 판매 중인 와인 메뉴.
--
-- 양면 플랫폼의 "샵" 축 (icave_concept_updates §스마트오더). 파트너는 본인
-- 메뉴를 등록/수정/삭제할 수 있고, 일반 사용자는 wine catalog 페이지에서
-- "어디서 파나" 확인 가능.
--
-- 필드는 MVP 최소: price (원) + available (토글). 재고/glass-bottle 구분
-- 등은 v2 후보. 한 파트너가 같은 와인을 두 번 올릴 수 없음 (unique).
-- ============================================================

create table if not exists partner_wine_menu (
  id          bigint generated always as identity primary key,
  partner_id  uuid    not null references profiles(id) on delete cascade,
  wine_id     bigint  not null references wines(id)    on delete cascade,
  price       int     not null check (price >= 0),
  available   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (partner_id, wine_id)
);

create index if not exists partner_wine_menu_partner_idx on partner_wine_menu (partner_id);
-- 카탈로그 reverse lookup ("이 와인 파는 곳") 에 사용.
create index if not exists partner_wine_menu_wine_idx
  on partner_wine_menu (wine_id) where available = true;

alter table partner_wine_menu enable row level security;

-- Read: 누구나 (카탈로그 노출용)
drop policy if exists "partner_wine_menu_read" on partner_wine_menu;
create policy "partner_wine_menu_read" on partner_wine_menu
  for select using (true);

-- Insert: 본인 row + 파트너 자격 (profiles.is_partner = true) 보유
drop policy if exists "partner_wine_menu_insert_owner" on partner_wine_menu;
create policy "partner_wine_menu_insert_owner" on partner_wine_menu
  for insert to authenticated with check (
    auth.uid() = partner_id
    and exists (
      select 1 from profiles
      where id = auth.uid() and coalesce(is_partner, false) = true
    )
  );

-- Update / Delete: 본인 row 만 (파트너 자격 박탈된 후 정리 가능하도록 update에는 partner check 미적용)
drop policy if exists "partner_wine_menu_update_owner" on partner_wine_menu;
create policy "partner_wine_menu_update_owner" on partner_wine_menu
  for update to authenticated using (auth.uid() = partner_id);

drop policy if exists "partner_wine_menu_delete_owner" on partner_wine_menu;
create policy "partner_wine_menu_delete_owner" on partner_wine_menu
  for delete to authenticated using (auth.uid() = partner_id);

-- updated_at 자동 갱신
create or replace function _partner_wine_menu_touch() returns trigger
language plpgsql
as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$;

drop trigger if exists trg_partner_wine_menu_touch on partner_wine_menu;
create trigger trg_partner_wine_menu_touch
  before update on partner_wine_menu
  for each row execute function _partner_wine_menu_touch();
