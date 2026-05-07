# i cave 기능 플로우 정리 (2026-05-06 기준)

> 자동 생성 — 코드베이스(`apps/mobile`, `supabase/`)를 스캔해 9개 도메인으로 묶은 플로우 다이어그램. 각 단계 옆 괄호는 구현 위치(컴포넌트/훅/Edge Function/DB).
>
> 표기 규칙
> - `>` : 다음 단계 (좌→우)
> - `v` 후 들여쓴 줄 : 분기/하위 흐름
> - `*` : 미검증 또는 부분 구현 (하단 [Known Gaps](#미구현--알려진-부채-known-gaps) 참조)

---

## 1. 와인 입력 / 셀러 등록 (Cellar Ingest)

```
라벨스캔            >  와인 매칭/검색       >  셀러에 등록            >  팔로워 알림         >  테이스팅노트 작성     >  (외부 SNS 공유 미구현)
(LabelScanSheet,      (useWineMatch,           (AddToCaveSheet,           (collection_           (TastingNoteEditor,
 wine-vision EF)       useWineSearch)           useAddToCave)              notification_          collection_tasting_note)
                                                       v                    triggers)
                                                내픽 설정 가능
                                              (PickPolaroidCard,
                                               useMyPicks, MyPicksSection)
                                                       v
                                                메모리 사진 추가
                                              (MemoryPhotoSheet,
                                               PhotoTagEditor → 와인 태그)
```

## 2. 셀러 발견 / 친구 활동 (Cellar Discovery)

```
셀러 탭 진입       >  내 셀러 보기         >  친구 셀러 추천      >  팔로우/언팔로우    >  친구 활동 스트립    >  알림
(cellar.tsx)       (CellarHeader,           (FeaturedCaveCard,     (FollowButton,        (FriendsActivity-     (notifications.tsx,
                    UserCellarSection)       featured-caves RPC)    useFollow)            Row)                  useNotifications)
                            v
                    Today's Pick Hero
                  (TodaysPickHero, ScreenHeader)
                            v
                    카테고리 칩 + 와인 그리드
                  (CategoryChips, PostGrid)
```

## 3. 모임 개설 / 카드 디자인 (Gathering Authoring)

```
탭 'create' 진입      >  CreateGatheringSheet 오픈  >  카드 템플릿 선택        >  제목/부제 입력        >  커버 이미지 + 누끼*   >  설명/픽업/약속    >  호스트 와인 슬롯    >  유형(분담/BYOB/공짜)  >  장소/일시/인원/가격  >  발행
(create.tsx)          (CreateGatheringSheet)         (CardTemplatePicker —      (GatheringForm)            (GatheringCoverImageField,  (BulletEditor,        (HostWineSlots)        (GatheringTypeSelector)   (GatheringDateTimeRow)   (useCreateGathering
                                                      signature/magazine/cover                              CutoutToggle*)              GatheringAgreement)                                                                                  → gatherings table)
                                                      3 layout)                                              * Do phase 미검증
                                                                v
                                                    라이브 프리뷰
                                                  (GatheringLivePreview,
                                                   CardTemplateHero)
```

## 4. 모임 발견 / 신청 / 운영 (Gathering Lifecycle)

```
gatherings 탭        >  추천 모임 / 파트너 / 사용자별 분리          >  모임 상세       >  신청 (사전 질문)         >  호스트 승인 큐         >  승인된 멤버 = 멤버      >  당일 와인 확정/변경   >  (정산: 에스크로 — 미구현)
(gatherings.tsx)      (RecommendedGatheringsRow,                    (gathering/[id])    (ApplyGatheringSheet,        (PendingApprovals-       (gathering_members,         (ChangeWineRequest-
                       PartnerGatheringsRow,                                              useGatheringMutations)       Section, ApprovalCard,     useGatheringDetail)         Sheet)
                       UserGatheringsRow,                                                                              ApplicantRow)
                       useRecommendedGatherings)                                                                       useGatheringApprovalActions
                                                                                                                       useGatheringApprovals)
```

## 5. Discover (트레바리화)

```
explore 탭        >  시즌 클럽 hero        >  파트너/추천 모임      >  브랜드 바         >  샵 브라우즈 섹션*    >  와인 디테일 시트
(explore.tsx)     (SeasonClubHero)         (DiscoverSection-          (DiscoverBrandBar)   (ShopBrowseSection)     (WineDetailSheet,
                                            Header,                                          * 스마트오더             wine/[id])
                                            EditorGuides-                                    skeleton 단계
                                            Section)
```

## 6. 소셜 (Posts / Comments / Likes / DM / Mentions)

```
포스트 작성        >  포스트 카드        >  좋아요/댓글/대댓글           >  멘션 (@user)         >  DM 1:1
(usePostSubmit,    (PostCard,             (LikeButton, CommentButton,       (MentionText,           (useDMList, useChat,
 LogDrinkSheet,     PostGrid,              CommentSheet, CommentThread,      MentionSuggestions,     useUnreadDM,
 CreateVideo-       PopularPosts,          comment_replies migration)        useMention)             chat/[roomId])
 Preview)           TrendingDrinks)
       v
   비디오 업로드
   (useVideoUpload
    → mux-upload EF
    → mux-status polling
    → mux-playback-token
       signed JWT 2h)
```

## 7. 권한 / 배지 / 진정성 (Authenticity)

```
사용자 가입       >  프로필 셋업           >  활동 누적          >  자동 배지 부여        >  진정성 배지 노출         >  파트너 인증 (오프라인 검증)
(login.tsx,        (EditProfileModal,        (collection,         (useBadgeChecker,        (AuthenticityBadges,        (PartnerBadge,
 expo-secure-       useProfile,               post, gathering      useUserBadges,            BadgeList)                  useIsPartner,
 store)             useUpdatePartner-         counts)              BadgeChecker)                                         EditPartnerProfileSheet,
                    Profile)                                                                                              PartnerHostCard)
```

## 8. AI / 컴퓨터 비전 (Wine Vision)

```
사진 캡처         >  Claude Vision 호출            >  와인 메타데이터 추출         >  사용자 검토/편집           >  매칭 와인 등록
(LabelScanSheet,    (wine-vision Edge Function,       (region/category/varietal)      (LabelReviewForm,             (useWineMatch
 LabelScanStages)    Anthropic API,                                                     LabelScanStages,              → wines/drinks table)
                     vision_calls rate limit                                            useWineLabelScan)
                     10/h per user)
```

## 9. 미디어 / 인프라 (Background)

```
이미지            >  expo-image-manipulator     >  Supabase Storage         >  CDN 노출
                    (resize 1080, jpeg q70)         (post-images bucket,        (cachePolicy:
                                                     storage RLS)                memory-disk)

비디오            >  mux-upload (presigned URL)  >  PUT to Mux               >  mux-status polling   >  mux-playback-token (signed JWT 2h)
                    rate limit 10/h per user        (useVideoUpload)            (asset → playback_id)   (useMuxPlaybackToken)
```

---

## 미구현 / 알려진 부채 (Known Gaps)

| 영역 | 현재 상태 | 비고 |
|------|----------|------|
| 모임 누끼 토글 | Plan/Design/Do 코드 작성 ✓, 시뮬레이터 동작 검증 미완 | `gathering-photo-cutout` PDCA 보류 (Do phase) |
| 모임 에스크로 정산 | DB 스키마 미구현 | `payment_status`, `gathering_members.confirmed` 컬럼 부재 (CLAUDE.md Known Debt) |
| Venues 테이블 (제휴 업장) | 미구현 | 현재 장소는 자유 텍스트 (CLAUDE.md Known Debt) |
| 외부 SNS 공유 | 미구현 | 와인 등록/픽 → SNS 자동 공유 흐름 부재 |
| 샵 스마트오더 | `ShopBrowseSection` skeleton만 존재 | 제품 방향성 (icave_concept_updates) 의 양면 BM 한 축 |
| TanStack Query 도입 | 검토 중 | 58개 hooks 가 manual `useState + useEffect` 패턴 (CLAUDE.md Known Debt) |
| Push 알림 | DB notifications 테이블만 존재 | OS push 통합 (FCM/APNS) 미연결 |
| 댓글 대댓글 깊이 | 1단계만 (00044 마이그레이션) | 다중 깊이 미지원 |

---

## 참고 — 코드베이스 카운트

- 라우트 화면: 11개 (login, 7 tabs, gathering/post/user/wine/cellar/all/chat 등 dynamic)
- 컴포넌트: 96개 (`apps/mobile/components/`)
- 훅: 58개 (`apps/mobile/lib/hooks/`)
- Edge Functions: 4개 (mux-upload, mux-status, mux-playback-token, wine-vision)
- 마이그레이션: 51개 (00001 ~ 00051)
