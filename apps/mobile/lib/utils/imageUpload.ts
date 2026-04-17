import { supabase } from '@/lib/supabase';

export async function uploadImage(uri: string, path: string): Promise<string | null> {
  try {
    const ext = uri.split('.').pop()?.split('?')[0] || 'jpg';
    const fileName = `${path}/${Date.now()}.${ext}`;
    const response = await fetch(uri);
    const arrayBuffer = await response.arrayBuffer();

    const { error } = await supabase.storage
      .from('post-images')
      .upload(fileName, arrayBuffer, {
        contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
        upsert: true,
      });

    if (error) {
      console.log('Upload error:', error.message);
      return null;
    }

    const { data } = supabase.storage.from('post-images').getPublicUrl(fileName);
    return data.publicUrl;
  } catch (err) {
    console.log('Image upload failed:', err);
    return null;
  }
}
