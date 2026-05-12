-- ============================================
-- SOLIDARIDAD - ALERTAS PERSONAS EN CALLE
-- ============================================
-- Ejecutar en el SQL Editor de Supabase
-- ============================================

CREATE TABLE IF NOT EXISTS alertas_calle (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    descripcion TEXT,
    necesidades TEXT,          -- agua, comida, ropa, medico, etc.
    reporter_name TEXT,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    direccion TEXT,            -- dirección o referencia escrita por el usuario
    foto_url TEXT,             -- foto en base64 (opcional)
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE alertas_calle ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Alertas visibles por todos" ON alertas_calle;
DROP POLICY IF EXISTS "Cualquiera puede reportar" ON alertas_calle;
DROP POLICY IF EXISTS "Cualquiera puede actualizar alertas" ON alertas_calle;

CREATE POLICY "Alertas visibles por todos" ON alertas_calle FOR SELECT USING (true);
CREATE POLICY "Cualquiera puede reportar" ON alertas_calle FOR INSERT WITH CHECK (true);
CREATE POLICY "Cualquiera puede actualizar alertas" ON alertas_calle FOR UPDATE USING (true) WITH CHECK (true);

-- Activar realtime para notificaciones en tiempo real
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE alertas_calle;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
