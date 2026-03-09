
DROP POLICY IF EXISTS "System can insert analyses" ON public.ai_analyses;

CREATE POLICY "Service role can insert analyses"
ON public.ai_analyses
FOR INSERT
WITH CHECK (true);
