-- ==========================================
-- SCRIPT: BANCO DE VOLUNTARIOS (Supabase)
-- ==========================================

-- 1. TABLA: HABILIDADES
CREATE TABLE IF NOT EXISTS public.habilidades_voluntarios (
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    habilidades jsonb DEFAULT '[]'::jsonb,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (user_id)
);

-- Habilitar Reglas de Seguridad (RLS) para Habilidades
ALTER TABLE public.habilidades_voluntarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Habilidades_Select"
    ON public.habilidades_voluntarios FOR SELECT
    USING (true);

CREATE POLICY "Habilidades_All"
    ON public.habilidades_voluntarios FOR ALL
    USING (auth.uid() = user_id);


-- 2. TABLA: COMPROMISOS
CREATE TABLE IF NOT EXISTS public.compromisos_voluntarios (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    cat_id text NOT NULL,
    descripcion text,
    hasta date,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Habilitar Reglas de Seguridad (RLS) para Compromisos
ALTER TABLE public.compromisos_voluntarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Compromisos_Select"
    ON public.compromisos_voluntarios FOR SELECT
    USING (true);

CREATE POLICY "Compromisos_All"
    ON public.compromisos_voluntarios FOR ALL
    USING (auth.uid() = user_id);
