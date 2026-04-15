import { useState } from 'react';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;

interface UploadResult {
  playbackId: string;
  uploadId: string;
}

export function useVideoUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  async function uploadVideo(videoUri: string): Promise<UploadResult | null> {
    setUploading(true);
    setProgress(0);

    try {
      // 1. Get upload URL from Edge Function
      const url = `${SUPABASE_URL}/functions/v1/mux-upload`;
      console.log('Requesting upload URL from:', url);
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      console.log('Response status:', res.status);
      const data = await res.json();
      console.log('Response data:', JSON.stringify(data));
      if (!data?.upload_url) throw new Error('Failed to get upload URL: ' + JSON.stringify(data));

      const { upload_url, upload_id } = data;

      setProgress(10);

      // 2. Upload video to Mux
      const response = await fetch(videoUri);
      const blob = await response.blob();

      setProgress(30);

      await fetch(upload_url, {
        method: 'PUT',
        body: blob,
        headers: { 'Content-Type': 'video/mp4' },
      });

      setProgress(70);

      // 3. Wait for processing and get playback ID
      let playbackId: string | null = null;
      let attempts = 0;

      while (!playbackId && attempts < 30) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;

        const statusRes = await fetch(`${SUPABASE_URL}/functions/v1/mux-status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ upload_id }),
        });
        const status = await statusRes.json();

        if (status?.playback_id) {
          playbackId = status.playback_id;
        }

        setProgress(70 + Math.min(attempts * 2, 28));
      }

      setProgress(100);

      if (!playbackId) throw new Error('Video processing timeout');

      return { playbackId, uploadId: upload_id };
    } catch (err: any) {
      console.log('Video upload error:', err.message);
      return null;
    } finally {
      setUploading(false);
    }
  }

  return { uploadVideo, uploading, progress };
}
