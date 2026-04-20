# Cave Project Rules

## Development Rules
1. 많은 부분을 수정해야 한다면 반드시 사용자에게 물어보고 진행할 것
2. 하나의 파일에 코드를 다 넣지 말고, 기능별로 모듈화 할 것
3. 요청이 명확하지 않을 때 추론 및 실행하지 말고 우선 사용자의 설명을 제대로 이해했는지 확인할 것
4. **중복 즉시 추출**: 같은 헬퍼/상수/env 로드가 2개 이상 파일에 나타나면 곧바로 공용 모듈로 추출할 것
   - Edge Functions 공용: `supabase/functions/_shared/`
   - 모바일 공용: `apps/mobile/lib/` (훅은 `lib/hooks/`, 유틸은 `lib/utils/`)
5. **파일 크기 상한**: 한 화면/컴포넌트 파일은 약 200줄 이하 유지. 초과 시 hooks/subcomponents로 분할
6. **매직 넘버 금지**: TTL, rate limit, threshold 등은 `_shared` 또는 `lib/config` 상수로

## Business Rules
- Gathering 참가비는 에스크로 방식 설계:
  1. 참가자 결제 → 플랫폼이 보관
  2. 모임 완료 후 → 모든 참가자의 동의(확인) 필요
  3. 전원 동의 시 → 호스트에게 정산
- 결제 연동 시 이 구조를 고려하여 DB/API 설계할 것
  - payment_status: pending/held/release_requested/released/refunded
  - 참가자별 confirmation 필요 (gathering_members에 confirmed 필드)
- Gathering 장소는 향후 제휴 업장(venues 테이블)과 연결 예정
  - 현재는 텍스트 입력, 추후 업장 검색/선택 방식으로 전환
  - 업장 연결 시 예약 + 수수료 모델 적용
- **Mux 업로드**: 사용자당 시간당 10건 rate limit (`mux_uploads` 테이블 기반)
- **Mux 재생 토큰**: 2시간 TTL. 업로더 본인 또는 posts RLS상 볼 수 있는 사용자에게만 발급
- **Wine Vision**: 사용자당 시간당 10건 rate limit (`vision_calls` 테이블 기반). 모델 기본값 `claude-opus-4-7` — cost 이슈 생기면 `_shared/anthropic.ts::WINE_VISION_MODEL` 에서 교체

## Architecture
- **Monorepo**: `apps/mobile/` (Expo + React Native) + `supabase/` (migrations + Edge Functions)
- **미디어**:
  - 이미지 → Supabase Storage (`post-images` 버킷)
  - 비디오 → Mux (업로드 URL → PUT → `mux-status` polling → playback_id)
- **인증 토큰 저장**: `expo-secure-store` (폴백: AsyncStorage). `apps/mobile/lib/secureStorage.ts` 참조
- **Edge Function 공용 유틸**: `supabase/functions/_shared/` (cors, auth, supabase 클라이언트, mux)

## Conventions
- **경로 alias**: `@/` (tsconfig paths)
- **마이그레이션 파일명**: `supabase/migrations/NNNNN_description.sql` (5자리 zero-pad)
- **스타일**: 컴포넌트 파일 하단에 `StyleSheet.create` co-locate
- **컬러 팔레트**: primary `#7b2d4e`, text `#222 / #999`, bg `#fff / #fafafa / #f5f5f5`, danger `#ed4956`
- **훅 반환 형식**: 가급적 `{ data, loading, refetch }` 또는 `{ 상태값들, 액션들 }` 그룹화
- **Edge Function 패턴**: `handlePreflight → requireUser → 비즈니스 로직 → json()` 순서

## Secrets (Supabase)
Edge Functions에서 사용하는 환경변수. 배포 전 `supabase secrets set` 으로 설정:

**필수**
- `MUX_TOKEN_ID`, `MUX_TOKEN_SECRET` — Mux API 액세스
- `MUX_SIGNING_KEY_ID`, `MUX_SIGNING_PRIVATE_KEY` — signed playback JWT (2026-04 도입)
- `ANTHROPIC_API_KEY` — Claude Vision (wine-vision Edge Function, 2026-04 도입)
- `SUPABASE_SERVICE_ROLE_KEY` — 대부분 환경에서 자동 주입, 직접 설정 필요한 경우도 있음

**선택**
- `MUX_CORS_ORIGIN` — 미설정 시 `"*"` 폴백. 웹 추가 시 해당 도메인 설정

**배포 절차**
```bash
supabase db push                          # 마이그레이션 적용
supabase functions deploy <function-name> # Edge Function 배포
```

## Known Debt
- `apps/mobile/lib/hooks/` 28개 훅이 manual `useState + useEffect` 패턴 — TanStack Query 도입 검토 중
- `useDrinkCategories.ts`에 pre-existing tsc 에러 2건 (PromiseLike 타입)
- Gathering 에스크로 스키마 미구현 (`posts.payment_status`, `gathering_members.confirmed` 컬럼 부재)
- venues 테이블 연동 미구현 (현재 gathering 장소는 자유 텍스트)

## 작업 시 참고
- 새 기능 추가 전 `supabase/migrations/` 최신 번호 확인
- RLS 정책 변경 시 `00014~00016_security_hardening*.sql` 스타일 참조 (SECURITY DEFINER, idempotent guards, 근거 주석)
- Mux 관련 변경 시 `_shared/mux.ts` 상수부터 확인
