-- Drop old update/delete policies if they exist (to be clean)
DROP POLICY IF EXISTS "Users can update their own iglesias" ON iglesias_comunidad;
DROP POLICY IF EXISTS "Users can delete their own iglesias" ON iglesias_comunidad;

-- Create policy for UPDATE
CREATE POLICY "Users can update their own iglesias" 
ON iglesias_comunidad 
FOR UPDATE 
USING (auth.email() = user_email)
WITH CHECK (auth.email() = user_email);

-- Create policy for DELETE
CREATE POLICY "Users can delete their own iglesias" 
ON iglesias_comunidad 
FOR DELETE 
USING (auth.email() = user_email);