-- Agrega la columna 'read' a la tabla messages para eliminar el error 400
-- Ejecutar en Supabase → SQL Editor

ALTER TABLE messages ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT FALSE;

-- Indice para optimizar las consultas de mensajes no leidos
CREATE INDEX IF NOT EXISTS idx_messages_unread 
ON messages (to_id, read) 
WHERE read = FALSE;
