const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

(async () => {
  try {
    await client.connect();

    await client.query(`
      INSERT INTO storage.buckets (id, name, public)
      VALUES ('post-images', 'post-images', true)
      ON CONFLICT (id) DO NOTHING;
    `);

    // Drop and recreate policies to avoid conflicts
    await client.query(`DROP POLICY IF EXISTS "public_read_post_images" ON storage.objects;`);
    await client.query(`
      CREATE POLICY "public_read_post_images"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'post-images');
    `);

    await client.query(`DROP POLICY IF EXISTS "auth_upload_post_images" ON storage.objects;`);
    await client.query(`
      CREATE POLICY "auth_upload_post_images"
      ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'post-images' AND auth.uid() IS NOT NULL);
    `);

    console.log('Bucket and policies created successfully');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
})();
