-- ============================================
-- SOLIDARIDAD - SISTEMA DE COORDINACIÓN DE AYUDA
-- ============================================
-- Ejecutar en Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS ayudas_alerta (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    alerta_id UUID NOT NULL,       -- ID de la alerta_calle
    necesidad TEXT NOT NULL,        -- 'comida', 'agua', 'ropa', 'abrigo', 'medico', 'oracion'
    helper_name TEXT DEFAULT 'Anónimo',
    user_id UUID,
    mensaje TEXT NOT NULL,          -- "Voy a llevar arroz y pan caliente"
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ayudas_alerta ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Ayudas visibles por todos" ON ayudas_alerta;
DROP POLICY IF EXISTS "Cualquiera puede ofrecer ayuda" ON ayudas_alerta;

CREATE POLICY "Ayudas visibles por todos" ON ayudas_alerta FOR SELECT USING (true);
CREATE POLICY "Cualquiera puede ofrecer ayuda" ON ayudas_alerta FOR INSERT WITH CHECK (true);

-- Activar realtime
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE ayudas_alerta;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
