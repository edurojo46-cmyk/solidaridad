-- ============================================
-- SOLIDARIDAD - SUPABASE DATABASE SCHEMA
-- ============================================
-- Ejecutar esto en el SQL Editor de Supabase:
-- https://supabase.com/dashboard/project/sqimiuwnhecspmugmacu/sql/new
-- ============================================

-- 1. PROFILES (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    username TEXT UNIQUE,
    avatar_url TEXT,
    bio TEXT,
    likes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. ROSARIES
CREATE TABLE IF NOT EXISTS rosaries (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    place TEXT NOT NULL,
    address TEXT,
    date DATE NOT NULL,
    time TEXT NOT NULL,
    mystery TEXT NOT NULL,
    intention TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    creator_id UUID REFERENCES profiles(id),
    creator_name TEXT,
    participants INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE rosaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Rosaries are viewable by everyone" ON rosaries FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create rosaries" ON rosaries FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Creators can update own rosaries" ON rosaries FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Creators can delete own rosaries" ON rosaries FOR DELETE USING (auth.uid() = creator_id);

-- 3. ROSARY PARTICIPANTS
CREATE TABLE IF NOT EXISTS rosary_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rosary_id TEXT REFERENCES rosaries(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(rosary_id, user_id)
);

ALTER TABLE rosary_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants viewable by everyone" ON rosary_participants FOR SELECT USING (true);
CREATE POLICY "Users can join rosaries" ON rosary_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave rosaries" ON rosary_participants FOR DELETE USING (auth.uid() = user_id);

-- 4. CENACULOS
CREATE TABLE IF NOT EXISTS cenaculos (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    access TEXT DEFAULT 'private' CHECK (access IN ('private', 'link')),
    color TEXT DEFAULT '#6366f1',
    icon TEXT DEFAULT 'ri-team-fill',
    creator_id UUID REFERENCES profiles(id),
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE cenaculos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cenaculos viewable by members" ON cenaculos FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create cenaculos" ON cenaculos FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Creators can update cenaculos" ON cenaculos FOR UPDATE USING (auth.uid() = creator_id);

-- 5. CENACULO MEMBERS
CREATE TABLE IF NOT EXISTS cenaculo_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cenaculo_id TEXT REFERENCES cenaculos(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    username TEXT,
    name TEXT,
    role TEXT DEFAULT 'miembro' CHECK (role IN ('creador', 'miembro')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(cenaculo_id, username)
);

ALTER TABLE cenaculo_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members viewable by everyone" ON cenaculo_members FOR SELECT USING (true);
CREATE POLICY "Can add members" ON cenaculo_members FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Can remove self" ON cenaculo_members FOR DELETE USING (auth.uid() = user_id);

-- 6. INTENCIONES
CREATE TABLE IF NOT EXISTS intenciones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id),
    text TEXT NOT NULL,
    category TEXT,
    user_name TEXT,
    hearts INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE intenciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public select intenciones" ON intenciones FOR SELECT USING (true);
CREATE POLICY "Public insert intenciones" ON intenciones FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update intenciones" ON intenciones FOR UPDATE USING (true) WITH CHECK (true);

-- 7. MESSAGES
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    from_id UUID REFERENCES profiles(id),
    to_id UUID REFERENCES profiles(id),
    text TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see own messages" ON messages FOR SELECT USING (auth.uid() = from_id OR auth.uid() = to_id);
CREATE POLICY "Users can send messages" ON messages FOR INSERT WITH CHECK (auth.uid() = from_id);
CREATE POLICY "Users can mark as read" ON messages FOR UPDATE USING (auth.uid() = to_id);

-- 8. CONTINUO SLOTS
CREATE TABLE IF NOT EXISTS continuo_slots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date TEXT NOT NULL,
    hour INTEGER NOT NULL,
    user_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE continuo_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Slots viewable by everyone" ON continuo_slots FOR SELECT USING (true);
CREATE POLICY "Anyone can add slots" ON continuo_slots FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can remove slots" ON continuo_slots FOR DELETE USING (true);

-- 9. IGLESIAS COMUNIDAD
CREATE TABLE IF NOT EXISTS iglesias_comunidad (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pais TEXT NOT NULL,
    ciudad TEXT NOT NULL,
    nombre TEXT NOT NULL,
    direccion TEXT,
    horarios TEXT,
    agregado_por TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE iglesias_comunidad ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Iglesias viewable by everyone" ON iglesias_comunidad FOR SELECT USING (true);
CREATE POLICY "Anyone can add iglesias" ON iglesias_comunidad FOR INSERT WITH CHECK (true);

-- 10. HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION increment_participants(row_id TEXT)
RETURNS VOID AS $$
    UPDATE rosaries SET participants = participants + 1 WHERE id = row_id;
$$ LANGUAGE SQL;

CREATE OR REPLACE FUNCTION decrement_participants(row_id TEXT)
RETURNS VOID AS $$
    UPDATE rosaries SET participants = GREATEST(participants - 1, 0) WHERE id = row_id;
$$ LANGUAGE SQL;

-- 11. AUTO-CREATE PROFILE ON SIGNUP
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, email, username)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.email,
        '@' || LOWER(REPLACE(COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)), ' ', '_'))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 12. ENABLE REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE rosaries;
ALTER PUBLICATION supabase_realtime ADD TABLE cenaculo_members;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE intenciones;
