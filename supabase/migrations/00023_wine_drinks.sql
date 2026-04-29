-- ============================================================
-- 와인 시음 이벤트 로그 — 한 와인 여러 번 마신 기록을 모두 누적.
--
-- collections.drink_date 는 단일 컬럼이라 마지막 1회만 저장 가능 → 별도
-- 이벤트 테이블로 분리. 셀러 "최근 마신 와인 리스트" 섹션의 데이터 소스.
--
-- 향후: collection_id 가 null + wine_id 만 있는 케이스 = 자기 셀러에 없는
-- 와인을 (모임/식당 등에서) 마셨을 때 직접 로그 (v2 search-to-log 흐름).
-- ============================================================

create table if not exists wine_drinks (
  id            bigint generated always as identity primary key,
  user_id       uuid not null references profiles(id) on delete cascade,
  -- 둘 중 하나는 반드시 있어야 함. collection_id 우선이지만 collection 삭제되어도
  -- 로그는 보존 (set null) — 마신 기록 자체는 사용자 자산.
  collection_id bigint references collections(id) on delete set null,
  wine_id       bigint references wines(id) on delete set null,
  drank_at      timestamptz not null default now(),
  rating        smallint check (rating between 1 and 5),
  note          text check (note is null or char_length(note) <= 1000),
  created_at    timestamptz default now(),
  constraint wine_drinks_target_required
    check (collection_id is not null or wine_id is not null)
);

create index if not exists idx_wine_drinks_user_recent
  on wine_drinks(user_id, drank_at desc);
create index if not exists idx_wine_drinks_collection
  on wine_drinks(collection_id);

-- ---- RLS ----
alter table wine_drinks enable row level security;

-- 본인 로그만 SELECT/INSERT/UPDATE/DELETE.
-- v2 에서 follows 기반 공유 또는 public 플래그 추가 예정.
drop policy if exists wine_drinks_owner_all on wine_drinks;
create policy wine_drinks_owner_all
  on wine_drinks
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
