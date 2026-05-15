-- EJECUTAR ESTO EN EL SQL EDITOR DE SUPABASE
-- Esto habilita el tiempo real para la tabla de mensajes

-- 1. Asegurar que la tabla estÃ© en la publicaciÃ³n de tiempo real
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- 2. Asegurar que enviemos todos los datos en cada actualizaciÃ³n (Identity Full)
-- Esto es CRÃƒÂ TICO para que los filtros de ID y las reacciones lleguen completas
ALTER TABLE messages REPLICA IDENTITY FULL;

-- 3. Dar permisos de lectura a anon/authenticated para el canal de realtime (por si acaso)
GRANT SELECT ON messages TO anon;
GRANT SELECT ON messages TO authenticated;
