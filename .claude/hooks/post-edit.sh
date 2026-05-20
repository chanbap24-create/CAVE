#!/bin/bash
# Claude 가 Write 또는 Edit 한 직후 자동 실행.
# 목적: TypeScript 에러 즉시 발견 + prettier 자동 정렬.
# 매번 수동 `npx tsc --noEmit` 돌릴 필요 없게 자동화.
#
# Hook input: Claude Code 가 stdin 으로 JSON 보냄.
#   { "tool_input": { "file_path": "..." }, ... }
# 우리는 file_path 만 추출해서 .ts/.tsx 일 때만 검사.

set -e

# stdin 에서 JSON 받아 file_path 추출
INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# .ts / .tsx 파일이 아니면 즉시 종료 (mig SQL, md 등은 검사 X)
case "$FILE" in
  *.ts|*.tsx) ;;
  *) exit 0 ;;
esac

# apps/mobile 안 파일만 검사 (mobile 외 TS 는 별도 분리)
case "$FILE" in
  */apps/mobile/*) ;;
  *) exit 0 ;;
esac

cd "$CLAUDE_PROJECT_DIR/apps/mobile" || exit 0

# 1. prettier 자동 정렬 (없으면 skip)
if [ -f node_modules/.bin/prettier ]; then
  npx prettier --write "$FILE" 2>/dev/null || true
fi

# 2. tsc 빠른 체크 (전체 프로젝트 type 검사 — 5~10초)
#    기존 Known Debt (useDrinkCategories) 는 필터링.
TSC=$(npx tsc --noEmit 2>&1 | grep -v "useDrinkCategories" | head -5)
if [ -n "$TSC" ]; then
  echo "⚠️  TypeScript 신규 에러:" >&2
  echo "$TSC" >&2
fi

# 3. quick smoke — 큰 변경 (마이그레이션 / 새 페이지 / hook) 시 트리거.
#    빈번 호출 방지 위해 .ts/.tsx 의 새 함수 추가 또는 sql 일 때만.
if [[ "$FILE" == *.sql ]] || git diff --cached --name-only 2>/dev/null | grep -qE "(app/.*\.tsx|lib/hooks/use.*\.ts)$"; then
  if [ -x "$CLAUDE_PROJECT_DIR/scripts/smoke-test.sh" ]; then
    "$CLAUDE_PROJECT_DIR/scripts/smoke-test.sh" --quick 2>&1 | tail -3 >&2 || true
  fi
fi

exit 0
