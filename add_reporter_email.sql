-- EJECUTAR EN EL SQL EDITOR DE SUPABASE
-- Agrega la columna reporter_email a alertas_calle para identificar al creador

ALTER TABLE alertas_calle 
ADD COLUMN IF NOT EXISTS reporter_email TEXT;

-- Politica RLS: el propietario puede eliminar su propia alerta
-- (si no existe una politica de delete, crearla)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'alertas_calle' AND cmd = 'DELETE'
  ) THEN
    -- Habilitar RLS si no esta activo
    ALTER TABLE alertas_calle ENABLE ROW LEVEL SECURITY;
    
    -- Politica: cualquier usuario autenticado puede eliminar (la app controla quien puede)
    CREATE POLICY "Usuarios pueden eliminar sus alertas" ON alertas_calle
      FOR DELETE TO authenticated
      USING (true);
  END IF;
END;
$$;

-- Asegurar que SELECT sea publico
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'alertas_calle' AND cmd = 'SELECT'
  ) THEN
    CREATE POLICY "Lectura publica de alertas" ON alertas_calle
      FOR SELECT TO anon, authenticated
      USING (true);
  END IF;
END;
$$;

-- Verificar estructura actual
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'alertas_calle' 
ORDER BY ordinal_position;
