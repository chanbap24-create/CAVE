---
description: public 스키마 RLS 점검 (Supabase advisors 포함)
---

Supabase MCP 의 `get_advisors` 또는 직접 SQL 로 i-cellar 프로젝트 (qtnyfxuhnlbyhhppbkrg) 의 보안 lint 를 조회해줘. 우선순위 ERROR / WARN / INFO 별로 분류.

특히 확인할 것:
1. `rls_disabled_in_public` (ERROR) — 결제·민감 테이블이 노출되었는지
2. `rls_enabled_no_policy` (INFO) — 의도된 lockdown 인지 vs 실수
3. `function_search_path_mutable` (WARN) — SECURITY DEFINER 함수 격리

CLAUDE.md 의 보안 룰 (특히 00014~00016 security_hardening 패턴) 과 비교해 위반 여부도 짚어줘.

만약 ERROR 가 있으면 lock-down SQL 도 함께 제안 (alter table ... enable row level security).
