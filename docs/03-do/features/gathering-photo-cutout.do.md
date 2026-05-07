---
template: do
version: 1.0
feature: gathering-photo-cutout
date: 2026-04-30
author: hajin
project: i-cellar
status: In Progress
---

# 모임 커버 이미지 자동 누끼 (gathering-photo-cutout) Implementation Guide

> **Summary**: Expo Module(iOS VisionKit + Android ML Kit) + wrapper + `GatheringCoverImageField` 토글 통합. EAS dev build 1회 필요.
>
> **Project**: i-cellar (Expo SDK 54)
> **Author**: hajin
> **Date**: 2026-04-30
> **Status**: In Progress
> **Design Doc**: [`gathering-photo-cutout.design.md`](../../02-design/features/gathering-photo-cutout.design.md)

---

## 1. Pre-Implementation Checklist

- [x] Plan reviewed: `docs/01-plan/features/gathering-photo-cutout.plan.md`
- [x] Design reviewed: `docs/02-design/features/gathering-photo-cutout.design.md`
- [x] CLAUDE.md Development Rules 숙지 (단순함, 모듈화, 200줄, 매직넘버)
- [ ] iOS 17 단말 1대 + ML Kit 지원 Android 1대 확보 (수동 QA용)
- [ ] EAS account에 dev build 가능 (혹은 로컬 prebuild + Xcode/Android Studio)

---

## 2. Implementation Order (9 Steps)

### Step 1 — PoC (선택, 1~2시간)

> Native module 만들기 전에 각 platform API가 실제로 우리 케이스에 동작하는지 단독 검증.

**iOS**: 빈 SwiftUI playground 또는 임시 viewController 에서:
- `ImageAnalyzer` + `ImageAnalysisInteraction` 으로 subject lifting 호출
- `ph://` URI vs file URI 둘 다 동작하는지 확인 (Design 9의 미확인 항목)
- 1080×1080 와인병 사진 처리 시간 측정

**Android**: Empty Activity 에서:
- `SubjectSegmenter.getClient()` → `process(InputImage)` → mask 적용 → PNG 인코딩
- 첫 호출 시 모델 다운로드 시간 측정

**나가지 않으면 (skip 결정 시)**: Step 2부터 시작. 단, Step 3/4 끝난 후 EAS dev build 결과로 한 번에 검증해야 함 (실패 시 디버깅 비용 큼).

### Step 2 — Expo Module 스캐폴드

```bash
cd apps/mobile
npx create-expo-module --local subject-extractor
```

생성 결과:
```
apps/mobile/modules/subject-extractor/
  expo-module.config.json
  ios/SubjectExtractorModule.swift
  android/src/main/java/expo/modules/subjectextractor/SubjectExtractorModule.kt
  src/index.ts
  src/SubjectExtractorModule.ts
```

`expo-module.config.json` 확인 후 git에 커밋. 이후 작업은 이 스캐폴드 위에서.

### Step 3 — iOS native (`SubjectExtractorModule.swift`)

```swift
import ExpoModulesCore
import VisionKit
import UIKit

public class SubjectExtractorModule: Module {
  public func definition() -> ModuleDefinition {
    Name("SubjectExtractor")

    Function("isSupported") { () -> Bool in
      if #available(iOS 17, *) { return true }
      return false
    }

    AsyncFunction("extractSubject") { (uri: String) async throws -> String? in
      guard #available(iOS 17, *) else { return nil }
      // 1. uri → UIImage 로드 (ph:// 와 file:// 분기)
      // 2. ImageAnalyzer + ImageAnalysisInteraction 으로 subject 추출
      // 3. 결과 UIImage → PNG 데이터
      // 4. NSTemporaryDirectory()/subject-{hash}.png 저장
      // 5. file:// URI 반환
      return resultUri
    }
  }
}
```

**주의**:
- `Info.plist` 에 `NSPhotoLibraryUsageDescription` 이미 있음 (expo-image-picker 가 처리)
- `ImageAnalysisInteraction.subject` 는 UIView attach 필요 — headless 호출 패턴 PoC에서 검증
- `ph://` URI는 `PHImageManager` 로 변환

### Step 4 — Android native (`SubjectExtractorModule.kt`)

```kotlin
package expo.modules.subjectextractor

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import com.google.mlkit.vision.segmentation.subject.SubjectSegmentation
import com.google.mlkit.vision.segmentation.subject.SubjectSegmenterOptions
// ...

class SubjectExtractorModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("SubjectExtractor")

    Function("isSupported") {
      android.os.Build.VERSION.SDK_INT >= 24  // ML Kit 요구사항
    }

    AsyncFunction("extractSubject") { uri: String, promise: Promise ->
      // 1. uri → Bitmap
      // 2. SubjectSegmenter 로 mask 추출
      // 3. mask 를 alpha 채널에 적용한 Bitmap 생성
      // 4. context.cacheDir/subject-{hash}.png 로 저장
      // 5. file:// URI promise.resolve
    }
  }
}
```

`build.gradle` 의존성:
```gradle
dependencies {
  implementation 'com.google.mlkit:segmentation-subject:16.0.0-beta1'  // 버전은 빌드 시점 최신 확인
}
```

### Step 5 — Wrapper TS (`apps/mobile/lib/native/subjectExtractor.ts`)

```typescript
import SubjectExtractor from '@/modules/subject-extractor';

const TIMEOUT_MS = 5000;
const CACHE_MAX = 20;

const cache = new Map<string, string>(); // uri → cutout uri (LRU)

export function isSubjectExtractionSupported(): boolean {
  try { return SubjectExtractor.isSupported(); }
  catch { return false; }
}

export async function extractSubject(uri: string): Promise<string | null> {
  const cached = cache.get(uri);
  if (cached) {
    cache.delete(uri); cache.set(uri, cached); // LRU touch
    return cached;
  }
  if (!isSubjectExtractionSupported()) return null;

  try {
    const result = await Promise.race([
      SubjectExtractor.extractSubject(uri),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), TIMEOUT_MS)),
    ]);
    if (result) {
      cache.set(uri, result);
      if (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value);
    }
    return result;
  } catch (err) {
    if (__DEV__) console.log('[subjectExtractor] failed:', err);
    return null;
  }
}
```

### Step 6 — `useCutoutImage` hook + `CutoutToggle` sub-component

**`apps/mobile/lib/hooks/useCutoutImage.ts`** (~50 lines):
- 입력: `originalUri: string | null`, `enabled: boolean` (layout-aware)
- 상태 머신: empty / idle / processing / ready / unsupported
- `extractSubject` 호출 + 결과 캐싱

**`apps/mobile/components/CutoutToggle.tsx`** (~40 lines):
- 토글 + 상태별 hint 텍스트만 렌더 (presentational)

### Step 7 — `GatheringCoverImageField` 리팩터

기존 ~70줄 파일에 토글 + 상태 머신 흡수. ~150줄 예상.

```typescript
interface Props {
  value: string | null;
  onChange: (uri: string | null) => void;
  /** 카드 layout — 'cover' 면 토글 disabled */
  cardLayout: CardLayoutVariant;
}
```

내부 흐름:
1. `pick()` → `originalUri` set
2. `useCutoutImage(originalUri, cardLayout !== 'cover')` 가 cutout 처리
3. 토글 ON + cutout ready → `onChange(cutoutUri)`, 그 외 → `onChange(originalUri)`
4. cardLayout 변경 시 hook이 자동 재계산

### Step 8 — `GatheringForm` 연결

```typescript
// cardTemplate 키에서 layout 추출
const layout = CARD_TEMPLATES.find(t => t.key === value.cardTemplate)?.layout ?? 'signature';

<GatheringCoverImageField
  value={value.coverImageUri}
  onChange={uri => set('coverImageUri', uri)}
  cardLayout={layout}
/>
```

### Step 9 — 수동 QA + CLAUDE.md 1줄 추가

| 단말 | OS | 테스트 |
|------|-----|--------|
| iPhone 15 (예) | iOS 17+ | 3 layout × 토글 ON/OFF |
| iPhone X (예) | iOS 16 | 토글 미노출 확인, 원본 업로드 정상 |
| Pixel 7 (예) | Android 14 | ML Kit 3 layout × 토글 |
| 구형 Android (예) | Android 9 | 토글 미노출 확인 |

CLAUDE.md `## Architecture` 섹션에 추가:
```
- **Native modules**: `apps/mobile/modules/<name>/` (Expo Module 표준), wrapper는 `apps/mobile/lib/native/<name>.ts`. 첫 사례: `subject-extractor` (와인 사진 자동 누끼).
```

---

## 3. EAS Dev Build (사용자 트리거 필수)

Step 2 완료 후, native 코드 검증 전에:

```bash
cd apps/mobile
eas build --profile development --platform ios
eas build --profile development --platform android
```

또는 로컬:
```bash
npx expo prebuild --clean
npx expo run:ios
npx expo run:android
```

> **주의**: native module 추가 후 첫 빌드는 평소보다 길 수 있음 (ML Kit 모델 의존성 fetch 등). 빌드 실패 시 prebuild log 와 `ios/Podfile.lock` / `android/build.gradle` 충돌 우선 확인.

---

## 4. 새 의존성

| Package | Where | Note |
|---------|-------|------|
| `com.google.mlkit:segmentation-subject` | Android Gradle | 비공개 native 의존성 — package.json X |
| (iOS) `VisionKit` | 시스템 프레임워크 | 추가 설치 X |

JS 측 추가 패키지 없음. Expo Module이 자체적으로 native와 bridge.

---

## 5. Things to Avoid

- [ ] `expo-image-manipulator` 로 PNG 후처리 시 알파 채널 손실 가능 — 결과 PNG는 그대로 업로드 (압축은 native 단에서)
- [ ] `extractSubject` 결과를 form state 에 저장 (메모리 폭증) — 반드시 cacheDirectory file URI만 보관
- [ ] iOS에서 `ImageAnalysisInteraction` 을 보이지 않는 view에 attach 안 하면 동작 안 할 수 있음 — PoC 검증
- [ ] Android ML Kit 첫 호출 시 silently 모델 다운로드 — 로딩 인디케이터 필수
- [ ] 누끼 결과 PNG를 두 개 보관 (원본 + 누끼) — 1개만 업로드

---

## 6. 진행 시 체크포인트

| Step | 완료 후 검증 |
|------|------------|
| Step 2 | `expo prebuild` 가 native 디렉토리에 모듈 포함하는지 확인 |
| Step 3-4 끝 | EAS dev build 1회 — 컴파일 통과만 확인 |
| Step 5 | `tsc` 통과 (신규 에러 0) |
| Step 6-7 | dev build에서 모임 개설 화면 진입 → picker 정상 |
| Step 8 | layout 변경 시 토글 가용성 동적 변화 확인 |
| Step 9 | 4종 단말 매트릭스 모두 통과 |

---

## 7. Post-Implementation

- [ ] `/pdca analyze gathering-photo-cutout` 으로 Gap 분석
- [ ] Match Rate < 90% 시 `/pdca iterate`
- [ ] >= 90% 시 `/simplify` → `/pdca report`

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-30 | Initial Do guide | hajin |
