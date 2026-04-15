# Cave 서버 실행 매뉴얼

## 기본 실행 (iOS 시뮬레이터)
```
cd /Users/hajin/i-cellar/apps/mobile
npx expo start --ios
```

## 핸드폰에서 보기 (같은 Wi-Fi)
```
cd /Users/hajin/i-cellar/apps/mobile
npx expo start
```
→ QR 코드 나옴 → 핸드폰 카메라로 스캔 → Expo Go에서 열림

## 핸드폰에서 보기 (다른 Wi-Fi / 외부)
```
cd /Users/hajin/i-cellar/apps/mobile
npx expo start --tunnel
```
→ 어디서든 QR 코드로 접속 가능 (Mac이 켜져 있어야 함)

## 서버가 안 열릴 때
```
lsof -ti:8081 | xargs kill -9
```
→ 기존 서버 강제 종료 후 다시 실행

## 시뮬레이터에서 새로고침
- 터미널에서 **r** 키

## 캐시 문제 시
```
npx expo start --ios --clear
```

## GitHub에 저장
```
cd /Users/hajin/i-cellar
git add -A && git commit -m "설명" && git push origin main
```
