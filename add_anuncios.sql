-- ============================================
-- SQL SCRIPT PARA CREAR LA TABLA DE ANUNCIOS
-- ============================================

CREATE TABLE IF NOT EXISTS anuncios (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title TEXT NOT NULL,
    description TEXT,
    photo_url TEXT,
    creator_id TEXT,
    creator_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE anuncios ENABLE ROW LEVEL SECURITY;

-- Politicas para que sea abierto:
DROP POLICY IF EXISTS "Anuncios viewable by everyone" ON anuncios;
DROP POLICY IF EXISTS "Anyone can insert anuncios" ON anuncios;

CREATE POLICY "Anuncios viewable by everyone" ON anuncios FOR SELECT USING (true);
CREATE POLICY "Anyone can insert anuncios" ON anuncios FOR INSERT WITH CHECK (true);

-- Agregar a Realtime (opcional)
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE anuncios;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
