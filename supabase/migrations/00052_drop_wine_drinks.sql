-- ============================================================
-- 마셨다 이벤트 로그(wine_drinks) 폐기.
--
-- 배경: 마셨다 처리와 테이스팅 노트가 사용자 입장에서 동일한 행동
-- (이 와인에 대한 인상을 적는다) 인데 두 곳으로 나뉘어 혼란스러웠음.
-- collections 에 이미 rating + tasting_note + tasting_note_updated_at
-- 이 있으므로 wine_drinks 의 별도 모델은 불필요.
--
-- "최근 마신 와인" 피드는 이제 collections.tasting_note IS NOT NULL
-- + tasting_note_updated_at desc 로 자연스럽게 누적된다.
-- (collections.tasting_note_updated_at 의 자동 touch 트리거는 00040 에서 도입.)
--
-- 데이터 보존 X — dev 단계라 손실 OK 로 결정.
-- ============================================================

drop table if exists wine_drinks cascade;
