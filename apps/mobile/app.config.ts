// Expo config entry. This file takes precedence over app.json when present
// and lets us run build-time assertions against environment variables.
//
// Why: VISION_MODE='direct' puts EXPO_PUBLIC_ANTHROPIC_API_KEY into the app
// bundle (extractable from an ipa/apk). That's acceptable for local dev but
// must never ship to TestFlight / App Store / Play Store. We fail the build
// loudly when an EAS production profile is detected with the key present.
import type { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const profile = process.env.EAS_BUILD_PROFILE; // set by EAS Build
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
    // Keep the rest of the config from app.json.
  };
};
