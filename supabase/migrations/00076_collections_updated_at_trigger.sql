-- ============================================================
-- collections.updated_at — UPDATE 시 자동 갱신 트리거.
--
-- 2026-05-18: 같은 와인 재등록 시 quantity 만 합쳐지면서 row 위치(생성순) 가
-- 그대로라 사용자가 "방금 추가했는데 뒤에 묻혀" 인지. updated_at 을 매 UPDATE 마다
-- bump 해서 셀러를 updated_at desc 로 정렬하면 최신 등록/수정이 항상 위로.
-- ============================================================

create or replace function trg_collections_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists collections_set_updated_at on collections;
create trigger collections_set_updated_at
  before update on collections
  for each row execute function trg_collections_set_updated_at();
