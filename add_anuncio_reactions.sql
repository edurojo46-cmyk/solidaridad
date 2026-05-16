-- =================================================
-- TABLA: anuncio_reactions (reacciones en tiempo real)
-- Ejecutar en Supabase SQL Editor
-- =================================================

CREATE TABLE IF NOT EXISTS anuncio_reactions (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    anuncio_id  TEXT        NOT NULL,
    emoji       TEXT        NOT NULL,
    count       INTEGER     NOT NULL DEFAULT 0,
    updated_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (anuncio_id, emoji)
);

-- Función para incrementar atómicamente
CREATE OR REPLACE FUNCTION increment_reaction(p_anuncio_id TEXT, p_emoji TEXT)
RETURNS INTEGER AS $$
DECLARE v_count INTEGER;
BEGIN
    INSERT INTO anuncio_reactions (anuncio_id, emoji, count, updated_at)
    VALUES (p_anuncio_id, p_emoji, 1, NOW())
    ON CONFLICT (anuncio_id, emoji)
    DO UPDATE SET count = anuncio_reactions.count + 1, updated_at = NOW()
    RETURNING count INTO v_count;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS abierto para lectura y escritura pública
ALTER TABLE anuncio_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Reactions viewable by everyone" ON anuncio_reactions;
DROP POLICY IF EXISTS "Anyone can react"               ON anuncio_reactions;
DROP POLICY IF EXISTS "Anyone can update reactions"    ON anuncio_reactions;

CREATE POLICY "Reactions viewable by everyone" ON anuncio_reactions FOR SELECT USING (true);
CREATE POLICY "Anyone can react"               ON anuncio_reactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update reactions"    ON anuncio_reactions FOR UPDATE USING (true);

-- Habilitar Realtime para esta tabla
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE anuncio_reactions;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
-- Agregar al final de add_anuncio_reactions.sql
-- Función para decrementar atómicamente (para quitar reacción)
CREATE OR REPLACE FUNCTION decrement_reaction(p_anuncio_id TEXT, p_emoji TEXT)
RETURNS INTEGER AS $$
DECLARE v_count INTEGER;
BEGIN
    UPDATE anuncio_reactions
    SET count = GREATEST(0, count - 1), updated_at = NOW()
    WHERE anuncio_id = p_anuncio_id AND emoji = p_emoji
    RETURNING count INTO v_count;
    RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
