#!/bin/bash
# Smoke test — 기능 만든 직후 빠르게 코드 / DB 무결성 검증.
#
# 사용:
#   ./scripts/smoke-test.sh           # 전체
#   ./scripts/smoke-test.sh --quick    # tsc 만 (3초)
#
# Exit code: 0 = OK, 1 = 실패. CI / Claude Code agent 가 결과 활용.

set -e
cd "$(dirname "$0")/.."

QUICK=false
[[ "$1" == "--quick" ]] && QUICK=true

PASS=0
FAIL=0
pass() { echo "  ✓ $1"; PASS=$((PASS+1)); }
fail() { echo "  ✗ $1" >&2; FAIL=$((FAIL+1)); }

echo "─── 1. TypeScript 컴파일 ───"
TSC_OUT=$(cd apps/mobile && npx tsc --noEmit 2>&1 | grep -vE "(useDrinkCategories|node_modules)" || true)
if [[ -z "$TSC_OUT" ]]; then pass "tsc clean"
else
  fail "tsc errors:"
  echo "$TSC_OUT" | head -10 >&2
fi

if $QUICK; then exit $([ $FAIL -eq 0 ] && echo 0 || echo 1); fi

echo ""
echo "─── 2. 보안 — SQL 인젝션 패턴 ───"
# ilike / or 에 ${} interpolation 쓰는 파일 — 단, 같은 파일에 sanitizeSearch 있으면 OK
SUSPECTS=$(grep -rEln '\.(or|ilike)\([^)]*\$\{[^}]*\}' apps/mobile --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v node_modules || true)
INJ=""
for f in $SUSPECTS; do
  grep -q "sanitizeSearch" "$f" || INJ+="$f"$'\n'
done
if [[ -z "$INJ" ]]; then pass "ilike/or sanitize 됨"
else fail "unsanitized:"; echo "$INJ" | head -5 >&2
fi

echo ""
echo "─── 3. 보안 — Service Role 클라이언트 노출 ───"
# 우리 소스만 (node_modules 제외)
SR=$(grep -rEn "SERVICE_ROLE|SUPABASE_SERVICE" apps/mobile/{app,components,lib,constants} --include="*.ts" --include="*.tsx" 2>/dev/null | head -1 || true)
if [[ -z "$SR" ]]; then pass "service role 클라이언트 미노출"
else fail "service role 노출:"; echo "$SR" >&2
fi

echo ""
echo "─── 4. 코드 품질 — 200줄 초과 (warning) ───"
OVER=$(find apps/mobile/{app,components} -name "*.tsx" 2>/dev/null | xargs wc -l 2>/dev/null | awk '$1 > 200 && $2 != "total"' | wc -l | tr -d ' ')
if [[ "$OVER" -lt 20 ]]; then pass "200줄 초과 $OVER 개 (CLAUDE.md 권장)"
else fail "200줄 초과 $OVER 개 — 모듈화 권장"
fi

echo ""
echo "─── 5. 코드 품질 — console.log production 노이즈 ───"
CL=$(grep -rEn '^[^/]*console\.log\b' apps/mobile --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "node_modules\|__DEV__" | wc -l | tr -d ' ')
if [[ "$CL" == "0" ]]; then pass "console.log 없음"
else fail "console.log $CL 곳 — __DEV__ 가드 또는 제거"
fi

echo ""
echo "─── 6. DB — 마이그레이션 순번 충돌 ───"
DUP=$(ls supabase/migrations/*.sql 2>/dev/null | xargs -n1 basename | awk -F'_' '{print $1}' | sort | uniq -d | wc -l | tr -d ' ')
if [[ "$DUP" == "0" ]]; then pass "마이그레이션 prefix 중복 없음"
else fail "prefix 중복 $DUP 개"
fi

echo ""
echo "─────────────────────────"
echo "PASS: $PASS  FAIL: $FAIL"
exit $([ $FAIL -eq 0 ] && echo 0 || echo 1)
