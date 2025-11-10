-- Allow authenticated users to view teacher profiles
CREATE POLICY "Authenticated users can view teacher profiles"
ON profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM teachers
    WHERE teachers.user_id = profiles.id
  )
);