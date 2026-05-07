import { requireNativeModule } from 'expo-modules-core';

interface SubjectExtractorNativeModule {
  isSupported(): boolean;
  extractSubject(uri: string): Promise<string | null>;
}

// Lookup is wrapped because the native side is absent in:
//  - Expo Go (no custom native code)
//  - web build
//  - dev client without `expo prebuild` having been run for this module yet
// In all those cases we want the app to keep running with the cutout feature
// silently disabled, not crash on bundle load. The wrapper layer
// (lib/native/subjectExtractor.ts) already treats `isSupported()=false` as
// "feature off, use original image".
const fallback: SubjectExtractorNativeModule = {
  isSupported: () => false,
  extractSubject: async () => null,
};

let mod: SubjectExtractorNativeModule;
try {
  mod = requireNativeModule<SubjectExtractorNativeModule>('SubjectExtractor');
} catch {
  mod = fallback;
}

export default mod;
