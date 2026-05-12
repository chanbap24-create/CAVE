// Expo config — CAVE v2 with Pretendard 9-weight + Noto Serif KR font loading.
import type { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const profile = process.env.EAS_BUILD_PROFILE;
  const hasDirectKey = !!process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;

  if (profile === 'production' && hasDirectKey) {
    throw new Error(
      '[build guard] EXPO_PUBLIC_ANTHROPIC_API_KEY must not be set in the ' +
      'production build. The key would ship in the app bundle. ' +
      'Flip lib/constants/wineVision.ts::VISION_MODE to "claude" and route ' +
      'through the wine-vision Edge Function instead.',
    );
  }

  return {
    ...(config as ExpoConfig),
    plugins: [
      ...(((config as ExpoConfig).plugins) ?? []),
      [
        'expo-font',
        {
          fonts: [
            './assets/fonts/Pretendard-Thin.otf',
            './assets/fonts/Pretendard-ExtraLight.otf',
            './assets/fonts/Pretendard-Light.otf',
            './assets/fonts/Pretendard-Regular.otf',
            './assets/fonts/Pretendard-Medium.otf',
            './assets/fonts/Pretendard-SemiBold.otf',
            './assets/fonts/Pretendard-Bold.otf',
            './assets/fonts/Pretendard-ExtraBold.otf',
            './assets/fonts/Pretendard-Black.otf',
            './assets/fonts/NotoSerifKR-Black.otf',
          ],
        },
      ],
    ],
  };
};
