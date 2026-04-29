import { useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { uploadImage } from '@/lib/utils/imageUpload';

export interface PartnerProfileInput {
  bio: string;
  career: string;
  specialties: string[];
  /** 새 사진 로컬 URI 또는 기존 URL 그대로 또는 null (제거) */
  photoUri: string | null;
  currentPhotoUrl: string | null;
}

export interface PartnerProfileUpdateResult {
  ok: boolean;
  error?: string;
}

const SPEC_MAX_COUNT = 8;
const SPEC_MAX_CHAR = 30;
const BIO_MAX = 2000;
const CAREER_MAX = 3000;

/**
 * 파트너 소개 필드 (bio/career/specialties/photo) 업데이트.
 * 사진은 새 로컬 URI 면 storage 업로드 후 URL 저장. 기존 URL 그대로면 변경 X.
 *
 * is_partner / partner_label 은 별도 (관리자 SQL) 이므로 여기서 안 건드림.
 */
export function useUpdatePartnerProfile() {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);

  async function save(input: PartnerProfileInput): Promise<PartnerProfileUpdateResult> {
    if (!user) return { ok: false, error: 'Not signed in' };

    // application 측 검증 (CHECK constraint 보강)
    if (input.bio.length > BIO_MAX) return { ok: false, error: `소개는 ${BIO_MAX}자 이하` };
    if (input.career.length > CAREER_MAX) return { ok: false, error: `경력은 ${CAREER_MAX}자 이하` };
    if (input.specialties.length > SPEC_MAX_COUNT) {
      return { ok: false, error: `전문분야는 최대 ${SPEC_MAX_COUNT}개` };
    }
    if (input.specialties.some(s => s.length > SPEC_MAX_CHAR)) {
      return { ok: false, error: `전문분야 태그는 ${SPEC_MAX_CHAR}자 이하` };
    }

    setSaving(true);
    try {
      let photoUrl: string | null = input.currentPhotoUrl;
      if (input.photoUri && input.photoUri !== input.currentPhotoUrl) {
        const uploaded = await uploadImage(input.photoUri, user.id);
        if (uploaded) photoUrl = uploaded;
      } else if (input.photoUri === null) {
        photoUrl = null; // 명시적 제거
      }

      // 빈 문자열은 NULL 로 정규화
      const norm = (v: string) => (v.trim().length === 0 ? null : v.trim());
      const cleanedSpecs = input.specialties.map(s => s.trim()).filter(Boolean);

      const { error } = await supabase
        .from('profiles')
        .update({
          partner_bio: norm(input.bio),
          partner_career: norm(input.career),
          partner_specialties: cleanedSpecs.length === 0 ? null : cleanedSpecs,
          partner_photo_url: photoUrl,
        })
        .eq('id', user.id);
      if (error) {
        Alert.alert('저장 실패', error.message);
        return { ok: false, error: error.message };
      }
      return { ok: true };
    } finally {
      setSaving(false);
    }
  }

  return { save, saving };
}
