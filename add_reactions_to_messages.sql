-- Agrega la columna reactions a la tabla messages para permitir emojis
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '{}'::jsonb;

-- Recarga el esquema para que la API REST (PostgREST) reconozca la nueva columna inmediatamente
NOTIFY pgrst, 'reload schema';
