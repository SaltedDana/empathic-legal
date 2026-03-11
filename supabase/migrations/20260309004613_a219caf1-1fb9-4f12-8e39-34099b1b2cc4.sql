
DROP POLICY IF EXISTS "Service role can insert analyses" ON public.ai_analyses;
DROP POLICY IF EXISTS "Authenticated users can insert analyses" ON public.ai_analyses;

CREATE POLICY "Authenticated users can insert analyses"
ON public.ai_analyses
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);
