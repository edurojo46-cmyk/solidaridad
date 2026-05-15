-- CREAR TABLA DE BLOQUEOS
CREATE TABLE IF NOT EXISTS public.blocked_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    blocked_id UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, blocked_id)
);

-- HABILITAR SEGURIDAD (RLS)
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

-- POLITICAS DE SEGURIDAD
CREATE POLICY "Users can view their own blocks" 
ON public.blocked_users FOR SELECT 
USING (auth.uid() = user_id OR auth.uid() = blocked_id);

CREATE POLICY "Users can block others" 
ON public.blocked_users FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unblock" 
ON public.blocked_users FOR DELETE 
USING (auth.uid() = user_id);