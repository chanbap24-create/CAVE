---
template: plan
version: 1.2
feature: gathering-photo-cutout
date: 2026-04-30
author: hajin
project: i-cellar
---

# 모임 커버 이미지 자동 누끼 (gathering-photo-cutout) Planning Document

> **Summary**: 모임 개설 시 사용자가 고른 사진의 피사체(와인병/사람/음식)를 자동으로 분리(누끼)하여 트레바리식 카드 hero에 적용한다.
>
> **Project**: i-cellar (셀러 + 큐레이션 모임 + 샵 양면 플랫폼)
> **Author**: hajin
> **Date**: 2026-04-30
> **Status**: Draft

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | 모임 카드 커버에 일반 사진을 그대로 넣으면 트레바리식 정돈된 hero 톤이 깨지고, 호스트가 별도 디자인 작업을 해야 한다. |
| **Solution** | iOS 17+ VisionKit subject lifting / Android ML Kit Subject Segmentation을 우선 사용하고, 미지원 단말은 원본 그대로 또는 remove.bg 폴백으로 처리한다. |
| **Function/UX Effect** | 사진 선택 → 1~2초 내 누끼 미리보기 → on/off 토글로 사용자가 비교 후 확정. 카드 hero 통일성 향상. |
| **Core Value** | "포토샵 없이도 트레바리급 모임 카드를 만들 수 있다"는 진입장벽 제거. 호스트 개설 전환율 상승 가설. |

---

## 1. Overview

### 1.1 Purpose

모임 카드의 커버 이미지를 정사각형 사진 그대로가 아니라 피사체만 분리한 PNG로 사용함으로써, `CardTemplateHero` 가 의도한 트레바리식 카드 톤(배경/카피와 피사체가 분리되어 보이는 레이어드 디자인)을 누구나 만들 수 있게 한다.

### 1.2 Background

- 2026-04-29 제품 방향성 변경 (`docs/icave_concept_updates.md`)으로 셀러가 첫 진입점이 되고 Discover가 트레바리화됨. 모임 카드의 시각 품질이 컨텐츠 큐레이션의 신뢰도와 직결.
- 현재 `GatheringCoverImageField` 는 `expo-image-picker` 의 `allowsEditing + aspect [1,1]` 만 사용. 와인병 사진을 정사각으로 자르면 라벨이 잘리거나 배경(테이블/벽지)이 카드 톤을 깨는 사례 다수 (호스트 피드백 - 인증 대기 중인 추정 사실).
- 가설: 누끼 적용 카드의 호스트 개설 완료율(이미지 선택 → 발행) 및 모임 카드 클릭률(CTR)이 의미 있게 상승.

### 1.3 Related Documents

- `docs/icave_concept_updates.md` — 제품 방향성 (트레바리식 카드 톤)
- `apps/mobile/components/CardTemplateHero.tsx` — 적용 대상 컴포넌트
- `apps/mobile/components/GatheringCoverImageField.tsx` — 현재 이미지 입력 컴포넌트
- `apps/mobile/lib/utils/imageUpload.ts` — 업로드 + 압축 파이프라인 (참조)

---

## 2. Scope

### 2.1 In Scope

- [ ] iOS 17+ subject lifting native module (Swift, VisionKit `ImageAnalyzer` + `ImageAnalysisInteraction.subject`)
- [ ] Android 단말 ML Kit Subject Segmentation (Kotlin)
- [ ] React Native bridge (`expo-modules-core` 기반 Expo Module) — 단일 함수 `extractSubject(uri): Promise<{ uri: string } | null>`
- [ ] `GatheringCoverImageField` 에 "배경 제거" 토글 추가 (기본 ON, 결과를 미리보기에서 비교)
- [ ] 누끼 결과를 PNG(투명 배경)로 캐시 후 `uploadImage` 파이프라인 재사용
- [ ] `CardTemplateHero` 에서 누끼 이미지일 경우 솔리드 배경 컬러(테마 팔레트) 위에 배치
- [ ] 미지원 단말 / 실패 시 원본 사진을 그대로 사용 (graceful degradation)

### 2.2 Out of Scope

- 서버사이드 누끼 (remove.bg, Cloudinary AI BG removal) — Phase 2 폴백 후보로만 검토, 이번 PDCA 에서는 미구현
- 셀프 호스팅 ML 모델 (rembg, U²-Net) — Deno Edge Function 환경 제약으로 제외
- 모임 외 영역(셀러 폴라로이드, 와인 인증, 프로필 사진) — 이번 범위 아님. 단, 모듈은 재사용 가능하게 설계.
- 누끼 결과 수동 보정 UI (브러시로 다듬기) — 제외
- 동영상 / 라이브 카메라 누끼 — 제외 (Mux 트랙과 별개)

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | 모임 개설 화면에서 커버 이미지 선택 후 1.5초 이내 누끼 미리보기를 보여준다 | High | Pending |
| FR-02 | "배경 제거" 토글로 원본 ↔ 누끼 결과를 비교할 수 있다 (기본 ON) | High | Pending |
| FR-03 | 누끼 결과는 PNG(알파 채널 보존)로 Supabase Storage 에 업로드된다 | High | Pending |
| FR-04 | iOS 17 미만 / 구형 Android / 피사체 인식 실패 시 원본 사진을 사용하고 토글을 숨긴다 | High | Pending |
| FR-05 | `CardTemplateHero` 가 누끼 이미지를 받으면 테마 팔레트 배경 위에 합성해 보여준다 | Medium | Pending |
| FR-06 | 누끼 처리 중 로딩 인디케이터(스켈레톤 또는 spinner)를 표시한다 | Medium | Pending |
| FR-07 | 누끼 모듈은 `apps/mobile/lib/native/subjectExtractor.ts` 단일 진입점으로 노출되어 향후 셀러/프로필 화면에서 재사용 가능 | Medium | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Performance | iOS A12 / Android Snapdragon 7-series 기준 1080×1080 이미지 누끼 < 1.5s | 디버그 로그 측정, 5회 평균 |
| Storage | 누끼 PNG 파일 크기 ≤ 원본 JPG의 200% (보통 1080×1080 기준 400~800KB) | Storage 객체 크기 로그 |
| Privacy | 사진을 외부 API로 전송하지 않음 (온디바이스 처리) | 코드 리뷰 + 네트워크 인스펙터 |
| Compatibility | iOS 16.x / Android 10 미만에서 크래시 없이 원본 사용 | 디바이스 매트릭스 수동 QA |
| Bundle size | 추가 native 의존성 ≤ +500KB (압축 후) | `expo prebuild --platform ios` 빌드 산출물 비교 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] iOS 17+ 단말에서 모임 개설 화면 → 사진 선택 → 누끼 미리보기 정상 동작
- [ ] Android 11+ ML Kit 지원 단말에서 동일 흐름 동작
- [ ] 미지원 단말(iOS 16, 구형 Android)에서 토글 미노출 + 원본 업로드 정상
- [ ] 누끼 PNG 가 Supabase `post-images` 버킷에 업로드되고 `CardTemplateHero` 에서 정상 렌더
- [ ] `GatheringCoverImageField` / `subjectExtractor` 모듈 단위로 README/주석에 사용법 기록
- [ ] CLAUDE.md "Known Debt" 또는 "Architecture" 섹션에 누끼 모듈 위치/제약 1줄 추가

### 4.2 Quality Criteria

- [ ] tsc 신규 에러 0건 (기존 `useDrinkCategories.ts` 2건 제외)
- [ ] iOS / Android 각각 실기기 1대 이상에서 골든패스 + 미지원 단말 fallback 검증
- [ ] 200줄 / 모듈화 룰 준수 (CLAUDE.md Development Rules #3, #6)

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| iOS subject lifting 결과가 얇은 와인잔 다리, 라벨 외곽선에서 부정확 | Medium | High | "배경 제거" 토글로 사용자가 직접 원본 선택 가능. 실패 시 자동 원본 사용. |
| Expo prebuild + native module 추가로 EAS 빌드 시간/복잡도 증가 | Medium | Medium | Expo Module 표준 템플릿 사용 (`expo-modules-create`). CI 빌드 시간 측정 후 결정. |
| Android ML Kit subject segmentation 모델이 첫 호출 시 다운로드(수MB) | Low | High | 첫 호출 시 silent download + 실패 시 원본 fallback. 재시도 X. |
| 누끼 PNG 파일 크기 폭증으로 storage 비용 증가 | Medium | Medium | `expo-image-manipulator` 로 PNG → 1080 long-edge 리사이즈 + (가능하면) WebP 알파 변환. |
| iOS subject lifting API 가 사용자 사진 라이브러리 권한 외 추가 권한을 요구할 가능성 | Low | Low | API 문서 확인. 사전 PoC로 검증 후 권한 흐름 설계. |
| 모듈을 만들었는데 호스트들이 토글을 OFF만 하는 등 채택 안 함 | Medium | Medium | 발행 후 1주간 토글 ON/OFF 비율 로그 (간단 이벤트만) → 폐기 결정 가능. |

---

## 6. Architecture Considerations

### 6.1 Project Level Selection

| Level | Characteristics | Recommended For | Selected |
|-------|-----------------|-----------------|:--------:|
| **Starter** | Simple structure | Static sites | ☐ |
| **Dynamic** | Feature-based modules, BaaS integration | Web apps with backend, fullstack | ☑ |
| **Enterprise** | Strict layer separation, DI, microservices | High-traffic systems | ☐ |

> i-cellar 는 이미 Dynamic 구조 (`apps/mobile` + `supabase/`). 본 기능은 모바일 클라이언트 한정.

### 6.2 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| 처리 위치 | 온디바이스 / 서버 API / 셀프호스팅 ML | **온디바이스** | 비용 0, 프라이버시(외부 전송 없음), 1회성 단발 호출에 최적 |
| iOS API | VisionKit subject lifting / Vision request `VNGenerateForegroundInstanceMaskRequest` | **VisionKit subject lifting (iOS 17+)** | Apple 공식 고수준 API. 정확도 검증됨. iOS 17 미만은 fallback |
| Android API | ML Kit Subject Segmentation / MediaPipe Image Segmenter | **ML Kit Subject Segmentation** | Google 공식, 모델 자동 다운로드, 재사용 사례 다수 |
| Native bridge | Expo Modules / `react-native-modules` 직접 / Turbo Native Module | **Expo Modules** | i-cellar 가 Expo 기반, prebuild 호환, 표준 템플릿 |
| 결과 포맷 | PNG / WebP (알파) | **PNG (Phase 1)** | 호환성 우선. WebP 알파는 Phase 2 최적화 후보. |
| Storage 경로 | 기존 `post-images` 버킷 / 신규 `gathering-covers` 버킷 | **기존 `post-images`** | 신규 버킷 추가 시 RLS 정책 작업 발생. 경로 prefix(`gatherings/{id}/cover.png`)로 충분. |

### 6.3 Folder Structure Preview

```
apps/mobile/
  modules/
    subject-extractor/        ← 신규 Expo Module
      ios/SubjectExtractorModule.swift
      android/SubjectExtractorModule.kt
      src/index.ts            ← extractSubject(uri) export
      expo-module.config.json
  lib/native/
    subjectExtractor.ts       ← 모듈 wrapper + 미지원 단말 감지
  components/
    GatheringCoverImageField.tsx  ← 토글 + 미리보기 비교 UI 추가
    CardTemplateHero.tsx          ← cutout 모드 분기 추가
```

> CLAUDE.md Development Rules #3 (모듈화), #6 (200줄 상한) 준수. `GatheringCoverImageField` 가 200줄 초과하면 토글 부분을 `CutoutToggle.tsx` 로 분리.

---

## 7. Convention Prerequisites

### 7.1 Existing Project Conventions

- [x] `CLAUDE.md` 존재 (Cave Project Rules)
- [x] `tsconfig.json` paths alias `@/`
- [x] `apps/mobile/lib/utils/` , `apps/mobile/lib/hooks/` 분리 컨벤션
- [ ] Expo native module 작성 가이드 — 본 PDCA 가 첫 사례. Design 문서에서 정립.

### 7.2 Conventions to Define/Verify

| Category | Current State | To Define | Priority |
|----------|---------------|-----------|:--------:|
| Native module 위치 | missing | `apps/mobile/modules/<name>/` (Expo 표준) | High |
| Native module wrapper | missing | `apps/mobile/lib/native/<name>.ts` 에서 platform/feature flag 처리 | High |
| 누끼 결과 캐시 키 | missing | `subject-cache-{hash(원본 uri)}.png`, FileSystem cacheDir | Medium |
| 미지원 단말 감지 | missing | `Platform.OS + Platform.Version` 기반 가드 헬퍼 | Medium |

### 7.3 Environment Variables Needed

| Variable | Purpose | Scope | To Be Created |
|----------|---------|-------|:-------------:|
| (없음) | 온디바이스 처리만 사용. Phase 2 에서 remove.bg 폴백 도입 시 추가 검토. | - | ☐ |

---

## 8. Open Questions

1. **현재 `glass` feature 가 Do phase 진행 중**. 이 기능과 충돌/병행 가능 여부는 Design 단계에서 확인.
2. **iOS 17 minimum target** — i-cellar 가 현재 어떤 iOS 최소버전을 타겟하는지 (`app.json` deployment target) 확인 필요. iOS 16 비중이 크면 우선순위 재검토.
3. **호스트 페르소나 검증** — "사진 한 장으로 모임 카드 완성" 가설을 1~2명 호스트와 사전 인터뷰할지, MVP 출시 후 데이터로 볼지.
4. **누끼 OFF 상태도 카드 디자인이 봐줄 만한가** — `CardTemplateHero` 의 fallback 디자인을 먼저 점검하고 시작.

---

## 9. Next Steps

1. [ ] iOS / Android 실기기 1회성 PoC (subject lifting + ML Kit 각각 단독 스크립트 또는 샘플 앱)
2. [ ] `/pdca design gathering-photo-cutout` — Design 문서 작성 (모듈 인터페이스, 캐시 정책, 토글 UX 와이어, fallback 정책)
3. [ ] `/pdca do gathering-photo-cutout` — Expo Module 스캐폴드 + 통합

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-30 | Initial draft | hajin |
