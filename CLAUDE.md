# Cave Project Rules

## Development Rules
1. 많은 부분을 수정해야 한다면 반드시 사용자에게 물어보고 진행할 것
2. 하나의 파일에 코드를 다 넣지 말고, 기능별로 모듈화 할 것
3. 요청이 명확하지 않을 때 추론 및 실행하지 말고 우선 사용자의 설명을 제대로 이해했는지 확인할 것

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
