---
description: 로컬 마이그레이션 파일 vs 원격 DB 상태 diff
---

`supabase/migrations/` 의 모든 파일을 list 하고, 각각이 원격 DB 에 적용됐는지 확인해줘.

방법:
1. 로컬 파일 ls
2. `npx supabase db query --linked` 로 `supabase_migrations.schema_migrations` 테이블 조회
3. diff 표시: 로컬에만 있음 (= 미적용) / 원격에만 있음 (= 파일 분실 위험) / 양쪽 모두 (정상)

결과 표 + 미적용 항목이 있으면 `/db-push <file>` 로 적용 권장.
