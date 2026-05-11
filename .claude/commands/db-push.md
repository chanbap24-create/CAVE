---
description: 가장 최근 마이그레이션을 prefix 충돌 우회로 직접 적용
---

가장 최근의 `supabase/migrations/*.sql` 파일을 `npx supabase db query --linked --file` 으로 직접 적용해줘.

배경: 이 프로젝트는 마이그레이션 파일에 prefix 중복 (예: 00019_mux_uploads.sql + 00019_partner_gatherings.sql) 이 있어서 표준 `supabase db push` 가 duplicate key error 로 실패함. CLI 의 schema_migrations 추적과 분리해서 직접 SQL 만 적용하는 패턴 사용.

순서:
1. `ls -1 supabase/migrations | tail -1` 로 최신 파일 확인
2. `npx supabase db query --linked --file "supabase/migrations/<파일명>" -o json` 실행
3. 결과 검증 — 실패하면 에러 메시지 그대로 보여주기
4. 성공하면 검증 쿼리 1개 (해당 마이그레이션이 만든 테이블/컬럼/policy 가 있는지) 자동 실행

만약 사용자가 인자로 특정 파일명을 넘겼으면 그 파일을 적용 (`/db-push 00056_comment_likes.sql` 같이).
