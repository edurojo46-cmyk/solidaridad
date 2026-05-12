DROP POLICY IF EXISTS "Users can update their own iglesias" ON iglesias_comunidad;
DROP POLICY IF EXISTS "Users can delete their own iglesias" ON iglesias_comunidad;

CREATE POLICY "Anyone can update iglesias" ON iglesias_comunidad FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete iglesias" ON iglesias_comunidad FOR DELETE USING (true);