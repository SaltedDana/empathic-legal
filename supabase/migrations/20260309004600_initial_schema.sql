-- Enum for session status
CREATE TYPE public.session_status AS ENUM (
  'waiting_for_party_b',
  'waiting_for_party_a',
  'waiting_for_both',
  'both_submitted',
  'analyzed'
);

-- profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- sessions
CREATE TABLE public.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  short_code text NOT NULL UNIQUE,
  context text NOT NULL,
  status public.session_status NOT NULL DEFAULT 'waiting_for_party_b',
  creator_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Party A (creator) can always read their session
CREATE POLICY "Creator can read own session"
  ON public.sessions FOR SELECT
  USING (auth.uid() = creator_user_id);

-- Anyone authenticated can read a session by short_code (for joining)
CREATE POLICY "Authenticated users can read sessions"
  ON public.sessions FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Creator can insert session"
  ON public.sessions FOR INSERT
  WITH CHECK (auth.uid() = creator_user_id);

CREATE POLICY "Creator can update own session"
  ON public.sessions FOR UPDATE
  USING (auth.uid() = creator_user_id);

-- party_responses — private to each author
CREATE TABLE public.party_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  party_role text NOT NULL CHECK (party_role IN ('party_a', 'party_b')),
  concerns text,
  protections text,
  priorities text,
  desired_outcomes text,
  submitted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.party_responses ENABLE ROW LEVEL SECURITY;

-- Each user can only read/write their own response
CREATE POLICY "Users can read own response"
  ON public.party_responses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own response"
  ON public.party_responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own response"
  ON public.party_responses FOR UPDATE
  USING (auth.uid() = user_id);

-- ai_analyses — readable by both parties in the session
CREATE TABLE public.ai_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL UNIQUE REFERENCES public.sessions(id) ON DELETE CASCADE,
  empathic_summary text,
  legal_concepts jsonb,
  bridge_suggestions jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_analyses ENABLE ROW LEVEL SECURITY;

-- Both parties can read the analysis for their session
CREATE POLICY "Session participants can read analysis"
  ON public.ai_analyses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.party_responses pr
      WHERE pr.session_id = ai_analyses.session_id
        AND pr.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = ai_analyses.session_id
        AND s.creator_user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can insert analyses"
  ON public.ai_analyses FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Function to generate a unique 6-char session code
CREATE OR REPLACE FUNCTION public.generate_short_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text;
  exists boolean;
BEGIN
  LOOP
    code := '';
    FOR i IN 1..6 LOOP
      code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    SELECT COUNT(*) > 0 INTO exists FROM public.sessions WHERE short_code = code;
    EXIT WHEN NOT exists;
  END LOOP;
  RETURN code;
END;
$$;
