---
template: design
version: 1.2
feature: gathering-photo-cutout
date: 2026-04-30
author: hajin
project: i-cellar
status: Draft
---

# 모임 커버 이미지 자동 누끼 (gathering-photo-cutout) Design Document

> **Summary**: 온디바이스 subject extraction native module을 추가하고, `GatheringCoverImageField` 에 layout-aware 토글을 붙여 누끼 PNG / 원본 JPG 중 하나를 선택해 기존 `cover_image_url` 컬럼에 저장한다.
>
> **Project**: i-cellar
> **Author**: hajin
> **Date**: 2026-04-30
> **Status**: Draft
> **Planning Doc**: [`gathering-photo-cutout.plan.md`](../../01-plan/features/gathering-photo-cutout.plan.md)

---

## 1. Overview

### 1.1 Design Goals

- 누끼 처리는 **온디바이스, 사용자 액션 1회 트리거(사진 선택 직후)**, 기존 업로드 파이프라인 무수정 통과
- 누끼가 효과 없는 layout(`cover` 풀블리드)에서는 토글을 **disable + 안내**로 시각적 노이즈 제거
- 미지원 단말 / 인식 실패 → **silent fallback to original**, 사용자가 모르는 사이 망가지지 않음
- 누끼 모듈은 향후 셀러/프로필 사진에서도 재사용 가능한 형태로 분리

### 1.2 Design Principles

- **DB 스키마 변경 0** — `cover_image_url` 컬럼 그대로 사용 (PNG/JPG 모두 수용). 향후 통계 필요해지면 별도 컬럼 추가 (YAGNI).
- **단방향 데이터** — `coverImageUri` 필드 하나만 form state에 존재. 누끼/원본 어느 쪽이든 같은 흐름.
- **Layout-aware UX** — 카드 layout에 따라 토글 가용성이 동적으로 바뀜.
- **Native module은 단일 함수만 노출** — `extractSubject(uri): Promise<string | null>`. 호출자는 platform 분기 모름.

---

## 2. Architecture

### 2.1 Component Diagram

```
┌──────────────────────────┐
│  GatheringForm           │  cardTemplate(layout) + coverImageUri 보유
│   ├── GatheringLivePreview            ← imageUri 그대로 렌더
│   └── GatheringCoverImageField        ← 토글 + 누끼 처리 트리거
│         ↓ (토글 ON 시)
│   ┌──────────────────────────────┐
│   │  lib/native/subjectExtractor │   wrapper: 미지원 감지 + 캐시
│   └──────────────────────────────┘
│         ↓
│   ┌──────────────────────────────┐
│   │ modules/subject-extractor    │   Expo Module (native)
│   │   ios/SubjectExtractorModule │   VisionKit (iOS 17+)
│   │   android/...Module          │   ML Kit Subject Segmentation
│   └──────────────────────────────┘
│         ↓
│   FileSystem cacheDirectory ← PNG 결과 저장
│         ↓ (form submit)
│   useCreateGathering → uploadImage → Supabase post-images
└──────────────────────────┘
```

### 2.2 Data Flow

```
[사진 선택]
  → ImagePicker → originalUri
  → GatheringCoverImageField state: { originalUri, cutoutUri: null, status: 'idle' }
  → 토글이 ON 이고 layout != 'cover'
     → extractSubject(originalUri) 호출 (status: 'processing')
        → 캐시 hit? 즉시 cutoutUri 세팅
        → miss? Native bridge → 결과 PNG cacheDir에 저장 → cutoutUri 세팅
        → 실패? cutoutUri = null + status: 'unsupported', 토글 OFF로 강제
  → onChange(currentlySelectedUri)
     ↑ 토글 상태와 cutoutUri 가용 여부에 따라 emit

[Form submit]
  → useCreateGathering(coverImageUri)
  → uploadImage(coverImageUri, `gathering-covers/${user.id}`)
     ↑ 확장자에 따라 PNG/JPEG로 자연 분기 (기존 imageUpload.ts 분기 활용)
  → cover_image_url 컬럼에 저장
```

### 2.3 Dependencies

| Component | Depends On | Purpose |
|-----------|-----------|---------|
| GatheringCoverImageField | lib/native/subjectExtractor | 누끼 트리거 + 결과 수신 |
| lib/native/subjectExtractor | modules/subject-extractor | platform-specific 호출 |
| modules/subject-extractor (ios) | VisionKit | subject lifting (iOS 17+) |
| modules/subject-extractor (android) | com.google.mlkit:segmentation-subject | Subject Segmentation |
| GatheringForm | GatheringCoverImageField | layout prop 전달 |

---

## 3. Data Model

### 3.1 DB Schema 변경

**없음.** 기존 `gatherings.cover_image_url text` 컬럼 그대로 사용.

| 항목 | 결정 | 근거 |
|------|------|------|
| 누끼 여부 별도 컬럼 (`cover_is_cutout boolean`) | **추가 안 함** | 통계 요구 없음 (YAGNI). 추후 필요 시 마이그레이션 1줄. |
| 원본/누끼 둘 다 저장 | **저장 안 함** | 사용자가 토글로 즉시 비교 후 하나 확정. 두 벌 저장은 storage 비용 + 정합성 부담. |
| Storage 경로 | `gathering-covers/{user.id}/{ts}.png` (또는 `.jpg`) | 기존 `useCreateGathering` 패턴 그대로. `imageUpload.ts` 가 ext 자동 처리. |

### 3.2 Form State 확장

`GatheringFormValue.coverImageUri: string | null` 은 **그대로**. 추가 state는 `GatheringCoverImageField` 내부에 캡슐화:

```typescript
// GatheringCoverImageField 내부 state (외부 노출 X)
type CutoutState =
  | { kind: 'empty' }                                  // 사진 미선택
  | { kind: 'idle';        original: string }          // 원본 선택, 누끼 미시도
  | { kind: 'processing';  original: string }          // 누끼 진행 중
  | { kind: 'ready';       original: string; cutout: string }   // 누끼 성공
  | { kind: 'unsupported'; original: string }          // 미지원/실패 → 토글 숨김
```

`onChange` 는 `kind === 'ready' && toggleOn ? cutout : original` 을 emit.

### 3.3 Native Module Interface

```typescript
// modules/subject-extractor/src/index.ts
export interface SubjectExtractorModule {
  isSupported(): boolean;                              // sync, platform/version check
  extractSubject(uri: string): Promise<string | null>; // 결과 PNG의 cacheDir URI, null = 실패
}
```

- `isSupported()` 내부 구현:
  - iOS: `if #available(iOS 17, *) { return true }` (runtime check, deployment target 안 올림)
  - Android: ML Kit Subject Segmentation 모듈 가용성 + `Build.VERSION.SDK_INT >= 24` (Android 7+)
- `extractSubject` 결과 PNG는 module 내부 cacheDirectory 에 저장. wrapper에서 LRU 캐시 키 관리.

---

## 4. API Specification

### 4.1 백엔드 API 변경

**없음.** 기존 Supabase Storage upload + `gatherings` insert 그대로.

| 영역 | 변경 사항 |
|------|----------|
| Edge Functions | 변경 없음 |
| RLS 정책 | 변경 없음 (기존 `post-images` 정책 적용) |
| 마이그레이션 | 변경 없음 |
| `useCreateGathering` | 변경 없음 — `coverImageUri` 인터페이스 그대로 |

### 4.2 Native Module API

```typescript
// 사용 예 (lib/native/subjectExtractor.ts)
import { extractSubject, isSubjectExtractionSupported } from '@/lib/native/subjectExtractor';

if (isSubjectExtractionSupported()) {
  const cutoutUri = await extractSubject(originalUri);
  // cutoutUri 가 null 이면 인식 실패 — 원본 사용
}
```

**호출 측 계약**:
- 입력 URI는 로컬 파일 (`file://...` 또는 `ph://...` iOS asset). 원격 URL 미지원.
- 캐시 키는 wrapper가 `hash(uri)` 로 관리. 동일 URI 재호출 시 native bridge 호출 안 함.
- 호출당 **timeout 5초**. 초과 시 `null` 반환 + 로그.

---

## 5. UI/UX Design

### 5.1 GatheringCoverImageField 화면 구조

```
┌────────────────────────────────────────────┐
│  ┌────────┐   ┌─────────────────────────┐  │
│  │  120²  │   │ [☑] 배경 자동 제거       │  │
│  │  preview│   │     원본 ↔ 누끼 비교     │  │
│  │        │   └─────────────────────────┘  │
│  └────────┘                                │
│  [✕ 이미지 삭제]                            │
└────────────────────────────────────────────┘

상태별:
- empty       → 토글 숨김, "커버 이미지 선택" placeholder
- idle/processing → 토글 disabled (loading spinner)
- ready       → 토글 enabled (기본 ON), 토글로 원본/누끼 미리보기 즉시 스왑
- unsupported → 토글 숨김, hint: "이 기기에선 자동 누끼를 지원하지 않아요"
- layout='cover' → 토글 disabled + hint: "현재 카드 디자인은 배경 사진을 그대로 써요"
```

### 5.2 Layout × Cutout 정책 매트릭스

| Layout | 누끼 효과 | 토글 기본값 | 동작 |
|--------|----------|-----------|------|
| `signature` | OK (75×75 코너 액자가 정돈됨) | ON | 누끼 PNG → 액자 안에 contain |
| `magazine` | 큼 (우측 풀밴드, 카드 bg와 합성) | ON | 누끼 PNG → magazineBand 영역 |
| `cover` | 부적합 (배경이 비어버림) | **disabled** | hint 표시, 원본 강제 사용 |

> 사용자가 layout을 `cover` 로 바꾸면 토글이 자동 disabled되고, 다시 다른 layout으로 돌아오면 직전 선택값(ready 상태면 ON) 복원.

### 5.3 GatheringLivePreview 상호작용

- `GatheringForm` 이 `coverImageUri` 만 넘기던 흐름 그대로. preview는 toggle/cutout 내부 사정을 모름.
- preview는 처리 중일 때 stale 이미지를 잠깐 보여줄 수 있음 — 의도된 동작 (깜빡임 방지).

### 5.4 에러/엣지 케이스 메시지

| 상황 | 메시지 (한국어) |
|------|----------------|
| iOS 16 / 구형 Android | "이 기기에선 자동 누끼를 지원하지 않아요" |
| Subject 인식 실패 | "사진에서 피사체를 찾지 못했어요. 원본을 사용할게요." (Toast, 1.5s) |
| 누끼 처리 5s 초과 | 같은 토스트, 원본 fallback |
| Layout = cover | "현재 카드 디자인은 배경 사진을 그대로 써요" (인라인 hint) |

---

## 6. File Structure

```
apps/mobile/
  modules/
    subject-extractor/                        ← 신규 Expo Module
      expo-module.config.json
      ios/
        SubjectExtractorModule.swift          (~80 lines)
      android/
        src/main/java/.../SubjectExtractorModule.kt   (~100 lines)
      src/
        index.ts                              ← native binding export (~20 lines)
        SubjectExtractorModule.types.ts       (~15 lines)
  lib/
    native/
      subjectExtractor.ts                     ← wrapper + LRU cache (~60 lines)
  components/
    GatheringCoverImageField.tsx              ← 기존 + 토글/상태 머신 (~150 lines, ≤200 룰)
    CutoutToggle.tsx                          ← 토글 sub-component (~40 lines, 분리)
```

> 만약 `GatheringCoverImageField` 가 200줄 초과하면 상태 머신을 `useCutoutImage` hook으로 분리하여 컴포넌트는 presentational만 유지.

---

## 7. Convention & Architecture Compliance

### 7.1 CLAUDE.md Development Rules 준수

| Rule | 준수 방식 |
|------|----------|
| #1 단순함 | 누끼 결과 보정 UI, 두 벌 저장, DB 컬럼 추가 모두 미도입 |
| #3 모듈화 | Expo Module / wrapper / form-field / sub-component 4계층 분리 |
| #5 중복 즉시 추출 | 누끼 사용처가 1곳뿐이므로 Phase 1에선 wrapper 그대로. 2번째 사용처(셀러 폴라로이드 등) 등장 즉시 hook 추출 |
| #6 200줄 상한 | `GatheringCoverImageField` 초과 가능성 → `useCutoutImage` hook으로 사전 대응 |
| #7 매직 넘버 금지 | timeout 5000, cache 최대 항목 수 등은 `lib/native/subjectExtractor.ts` 상단 상수 |

### 7.2 Architecture (CLAUDE.md)

- **모바일 공용**: `apps/mobile/lib/native/` 신규 디렉토리. 향후 다른 native module(예: HEIC 디코더, 카메라 필터)도 같은 곳에 모음.
- **Expo Module 위치**: `apps/mobile/modules/{name}/` (Expo 표준). 본 PDCA 가 첫 사례 — 추후 컨벤션 문서화 후보.

---

## 8. Implementation Order (for Do phase)

1. **PoC (별도 브랜치 권장)** — iOS 17 단말에서 VisionKit subject lifting 단독 호출 / Android에서 ML Kit Subject Segmentation 단독 호출. 각각 결과 PNG 품질 + 처리 시간 확인.
2. **Expo Module 스캐폴드** — `npx create-expo-module --local subject-extractor`, expo-module.config 작성, EAS dev build 한 번 구워서 brigde 통과 확인.
3. **iOS native** — `SubjectExtractorModule.swift` 구현 (`@available(iOS 17, *)` 가드, `ImageAnalysisInteraction.subject` 사용, PNG 인코딩 후 cacheDir 저장).
4. **Android native** — `SubjectExtractorModule.kt` 구현 (ML Kit Subject Segmentation, 마스크 적용 후 PNG 저장).
5. **Wrapper (`lib/native/subjectExtractor.ts`)** — LRU 캐시(최대 20개), timeout(5s), 미지원 단말 분기.
6. **`GatheringCoverImageField` 리팩터** — `useCutoutImage` hook 추가, 토글 UI, layout prop 수신.
7. **`GatheringForm`** — `cardTemplate` → layout 추출하여 prop으로 전달.
8. **수동 QA 매트릭스** — iOS 17 / iOS 16 / Android ML Kit 지원 / Android 미지원 4종 단말, 3 layout × 토글 ON/OFF.
9. **CLAUDE.md** Architecture 섹션에 Native module 위치 1줄 추가.

---

## 9. Risks (신규 발견)

| Risk | 발견 시점 | 대응 |
|------|----------|------|
| `cover` layout이 사실상 "사진 선택 = 배경" 패턴이라 누끼 토글 disable 시 사용자가 혼란 | Plan 후 코드 확인 | hint 문구로 안내. picker에서 cover 선택 시 toast로 한 번 더 안내 검토 (Phase 2) |
| Form state가 `coverImageUri` 단일 필드라 누끼/원본 토글 시 매 호출 `set('coverImageUri', ...)` 가 부모 리렌더 | 코드 확인 | preview는 cached 이미지라 비용 낮음. 실측 후 필요 시 디바운스 |
| EAS build에 native module 포함 시 첫 빌드 실패 가능성 (Expo Module 표준 따름) | 일반 | dev build로 사전 검증, prebuild log 확인 |
| iOS subject lifting이 `ph://` asset URI를 직접 받는지, file copy 필요한지 미확인 | Plan 후 | PoC에서 1순위 검증 항목 |

---

## 10. Next Steps

1. [ ] `/pdca do gathering-photo-cutout` — Implementation 가이드 생성 후 위 9단계 순서대로 진행
2. [ ] PoC 결과 확인 후, 만약 iOS/Android 한쪽 품질이 현저히 낮으면 Plan 수정 (예: Android는 Phase 2로 미루기)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-30 | Initial draft | hajin |
