-- Trigger to automatically create clinic and user profile on signup
-- This ensures new registrations appear in the Super Admin dashboard

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER AS $$
DECLARE
  v_clinic_id UUID;
  v_clinic_name TEXT;
  v_full_name TEXT;
  v_role TEXT;
  v_slug TEXT;
BEGIN
  -- Extract metadata from auth.users
  v_clinic_name := NEW.raw_user_meta_data->>'clinic_name';
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'admin');

  -- Only process if clinic_name is provided (new clinic signup)
  IF v_clinic_name IS NOT NULL AND v_clinic_name != '' THEN
    -- Generate slug from clinic name
    v_slug := lower(regexp_replace(v_clinic_name, '[^a-zA-Z0-9]+', '-', 'g'));
    v_slug := trim(both '-' from v_slug);
    
    -- Make slug unique if it already exists
    IF EXISTS (SELECT 1 FROM public.clinics WHERE slug = v_slug) THEN
      v_slug := v_slug || '-' || substring(NEW.id::text from 1 for 8);
    END IF;

    -- Create the clinic with 'pending' status (awaiting Super Admin approval)
    INSERT INTO public.clinics (
      name,
      slug,
      owner_id,
      email,
      status,
      plan,
      created_at,
      updated_at
    ) VALUES (
      v_clinic_name,
      v_slug,
      NEW.id,
      NEW.email,
      'pending',  -- New clinics start as pending
      'free',     -- Default plan
      NOW(),
      NOW()
    ) RETURNING id INTO v_clinic_id;

    -- Create user profile linked to the new clinic
    INSERT INTO public.users (
      id,
      clinic_id,
      email,
      full_name,
      role,
      status,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      v_clinic_id,
      NEW.email,
      v_full_name,
      v_role,
      'active',  -- User is active but clinic is pending
      NOW(),
      NOW()
    );

    -- Log the signup activity
    INSERT INTO public.activities (
      clinic_id,
      user_id,
      activity_type,
      title,
      description,
      created_at
    ) VALUES (
      v_clinic_id,
      NEW.id,
      'clinic_signup',
      'New Clinic Registration',
      'Clinic "' || v_clinic_name || '" registered and awaiting approval',
      NOW()
    );

  ELSE
    -- If no clinic_name, this might be a user being added to an existing clinic
    -- Just create the user profile without a clinic
    INSERT INTO public.users (
      id,
      email,
      full_name,
      role,
      status,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      NEW.email,
      v_full_name,
      v_role,
      'active',
      NOW(),
      NOW()
    ) ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_signup();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
