-- ============================================================
-- SOLIDARIDAD: Bucket "chat-media" para imágenes y videos del chat
-- Ejecutar en Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Crear el bucket (si no existe)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'chat-media',
    'chat-media',
    true,                          -- público para que las URLs funcionen sin auth
    20971520,                      -- 20 MB límite por archivo
    ARRAY[
        'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
        'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 20971520,
    allowed_mime_types = ARRAY[
        'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
        'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'
    ];

-- 2. Política: usuarios autenticados pueden subir a su propia carpeta (fromId/toId/...)
DROP POLICY IF EXISTS "chat_media_upload" ON storage.objects;
CREATE POLICY "chat_media_upload" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'chat-media'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- 3. Política: lectura pública (las imágenes se muestran sin autenticación)
DROP POLICY IF EXISTS "chat_media_public_read" ON storage.objects;
CREATE POLICY "chat_media_public_read" ON storage.objects
    FOR SELECT TO public
    USING (bucket_id = 'chat-media');

-- 4. Política: el owner puede borrar sus propios archivos
DROP POLICY IF EXISTS "chat_media_delete_own" ON storage.objects;
CREATE POLICY "chat_media_delete_own" ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id = 'chat-media'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- 5. Agregar columnas media_url y media_type a la tabla messages (si no existen)
ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_type TEXT CHECK (media_type IN ('image', 'video', NULL));

-- ============================================================
-- LISTO. Verificar en Storage > chat-media que el bucket existe.
-- ============================================================
