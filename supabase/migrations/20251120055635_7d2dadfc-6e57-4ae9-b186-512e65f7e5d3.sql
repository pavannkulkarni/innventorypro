-- Add INSERT policy to profiles table to allow users to create their own profile
-- This provides a safety mechanism if the trigger fails
CREATE POLICY "Users can create their own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);