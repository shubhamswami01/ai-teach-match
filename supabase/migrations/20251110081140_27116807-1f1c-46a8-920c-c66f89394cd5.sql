-- Fix profiles table policy - remove conflicting public policy
-- Keep only authenticated access
DROP POLICY IF EXISTS "Public can view limited profile info" ON profiles;

-- Now only authenticated users can view profiles (own or others for messaging)
-- If you need public teacher browsing, create a separate teachers_public view