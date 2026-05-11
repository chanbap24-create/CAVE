#!/bin/bash
# 사용자가 prompt 보낼 때마다 자동 실행 — 컨텍스트 주입.
# Claude 의 응답에 추가 system 메시지로 들어감.
#
# 효과: 매 prompt 마다 "지금 branch 뭐야?" "최근 커밋?" 같은 걸 안 물어봐도 됨.
# 의식적으로 무시하라고 명시한 정보 외엔 자동 컨텍스트로 활용.

cd "$CLAUDE_PROJECT_DIR" || exit 0

cat <<EOF
# Auto-context (project hook)
- Branch: $(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "(no git)")
- Recent commits:
$(git log --oneline -3 2>/dev/null | sed 's/^/  /')
- Pending migrations (most recent 3):
$(ls -1 supabase/migrations 2>/dev/null | tail -3 | sed 's/^/  /')
- Working tree changes (M/A/D count):
$(git status --short 2>/dev/null | wc -l | tr -d ' ') files
- 제품 방향성 첫 줄 (icave_concept_updates.md):
  $(head -1 docs/icave_concept_updates.md 2>/dev/null || echo "(missing)")
EOF

exit 0
