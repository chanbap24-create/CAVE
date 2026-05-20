# Maestro E2E Tests

모바일 앱 시나리오 자동 테스트.

## 설치 (1회)

```bash
curl -Ls "https://get.maestro.mobile.dev" | bash
# 또는 brew tap mobile-dev-inc/tap && brew install maestro
```

설치 후 PATH 확인:
```bash
maestro --version
```

## 실행

```bash
# 시뮬레이터 / 디바이스 띄워놓고
maestro test .maestro/01_label_scan.yaml
maestro test .maestro/                    # 전체
```

## 사전 조건

- iOS 시뮬레이터 또는 Android 에뮬레이터 실행 중
- 앱 빌드 + 설치됨 (`expo run:ios` / `expo run:android`)
- **테스트 계정 로그인된 상태** — 로그인 자동화는 별도 flow

## flow 작성 규칙

- 한 파일 = 한 시나리오 (라벨 스캔 / 구매 / 모임 등록 등)
- `appId: com.icellar.app` 고정
- 텍스트 매칭은 한글 / 영문 OR 패턴 (regex: true) — 디자인 톤 변경시 깨지지 않게
- 좌표 (`point: "70%, 30%"`) 는 최후 수단, 가능한 텍스트로

## 핵심 시나리오 (작성 예정)

- [x] `01_label_scan.yaml` — 라벨 스캔 → 등록 → 셀러 반영
- [ ] `02_purchase_flow.yaml` — 카탈로그 → 구매 → 셀러 자동 등록
- [ ] `03_partner_register.yaml` — 파트너 와인 등록 / 수정 / 삭제
- [ ] `04_gathering_join.yaml` — 모임 신청 → 호스트 승인
- [ ] `05_back_nav.yaml` — 각 detail → 뒤로가기 = 정확한 탭 복귀

## 결과 활용

```bash
maestro test .maestro/ --format=junit > maestro-results.xml
```

JUnit XML → CI 통합 또는 Claude Code agent (`feature-qa`) 가 파싱.
