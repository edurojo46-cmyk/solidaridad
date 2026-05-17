-- ============================================================
-- BANCO DE VOLUNTARIOS - Tablas en Supabase (Políticas Abiertas)
-- ============================================================
-- NOTA: Esta app utiliza autenticación local (localStorage) en lugar de
-- Supabase Auth. Por lo tanto, las políticas de seguridad (RLS) deben
-- permitir operaciones sin requerir auth.uid(), delegando la validación
-- de usuario al frontend.
-- ============================================================

-- 1. Habilidades por usuario (una fila por usuario)
CREATE TABLE IF NOT EXISTS habilidades_voluntarios (
    id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    habilidades JSONB NOT NULL DEFAULT '[]',
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id)
);

-- 2. Compromisos (múltiples por usuario)
CREATE TABLE IF NOT EXISTS compromisos_voluntarios (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    cat_id      TEXT NOT NULL,
    descripcion TEXT DEFAULT '',
    hasta       DATE,
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- RLS (Row Level Security)
ALTER TABLE habilidades_voluntarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE compromisos_voluntarios  ENABLE ROW LEVEL SECURITY;

-- Habilidades: Políticas públicas/abiertas
DROP POLICY IF EXISTS "habilidades_select_all" ON habilidades_voluntarios;
DROP POLICY IF EXISTS "habilidades_insert_own" ON habilidades_voluntarios;
DROP POLICY IF EXISTS "habilidades_update_own" ON habilidades_voluntarios;
DROP POLICY IF EXISTS "habilidades_delete_own" ON habilidades_voluntarios;
DROP POLICY IF EXISTS "habilidades_insert_all" ON habilidades_voluntarios;
DROP POLICY IF EXISTS "habilidades_update_all" ON habilidades_voluntarios;
DROP POLICY IF EXISTS "habilidades_delete_all" ON habilidades_voluntarios;

CREATE POLICY "habilidades_select_all" ON habilidades_voluntarios FOR SELECT USING (true);
CREATE POLICY "habilidades_insert_all" ON habilidades_voluntarios FOR INSERT WITH CHECK (true);
CREATE POLICY "habilidades_update_all" ON habilidades_voluntarios FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "habilidades_delete_all" ON habilidades_voluntarios FOR DELETE USING (true);

-- Compromisos: Políticas públicas/abiertas
DROP POLICY IF EXISTS "compromisos_select_all" ON compromisos_voluntarios;
DROP POLICY IF EXISTS "compromisos_insert_own" ON compromisos_voluntarios;
DROP POLICY IF EXISTS "compromisos_delete_own" ON compromisos_voluntarios;
DROP POLICY IF EXISTS "compromisos_insert_all" ON compromisos_voluntarios;
DROP POLICY IF EXISTS "compromisos_delete_all" ON compromisos_voluntarios;

CREATE POLICY "compromisos_select_all" ON compromisos_voluntarios FOR SELECT USING (true);
CREATE POLICY "compromisos_insert_all" ON compromisos_voluntarios FOR INSERT WITH CHECK (true);
CREATE POLICY "compromisos_delete_all" ON compromisos_voluntarios FOR DELETE USING (true);

-- Índices de rendimiento
CREATE INDEX IF NOT EXISTS idx_habilidades_user ON habilidades_voluntarios(user_id);
CREATE INDEX IF NOT EXISTS idx_compromisos_user ON compromisos_voluntarios(user_id);
CREATE INDEX IF NOT EXISTS idx_compromisos_hasta ON compromisos_voluntarios(hasta);
