import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Copy, Loader2, Scale, Lightbulb, Check } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const SessionView = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [session, setSession] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const loadingTickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const LOADING_MSG_COUNT = 6;

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      const { data: sessionData } = await supabase
        .from("sessions")
        .select("*")
        .eq("id", id)
        .single();

      if (sessionData) {
        setSession(sessionData);

        const { data: analysisData } = await supabase
          .from("ai_analyses")
          .select("*")
          .eq("session_id", id)
          .single();

        if (analysisData) {
          setAnalysis(analysisData);
        }
      }
      setIsLoading(false);
    };
    fetchData();
  }, [id]);

  const triggerAnalysis = async () => {
    if (!id) return;
    setIsAnalyzing(true);
    setLoadingMsgIdx(0);
    loadingTickRef.current = setInterval(() => {
      setLoadingMsgIdx(prev => (prev + 1) % LOADING_MSG_COUNT);
    }, 1900);

    try {
      const { data, error } = await supabase.functions.invoke("analyze-session", {
        body: { session_id: id },
      });

      if (error) throw error;
      setAnalysis(data);
      setSession((prev: any) => ({ ...prev, status: "analyzed" }));
      toast({ title: t("sessionView.analysisComplete"), description: t("sessionView.summaryReady") });
    } catch (error: any) {
      toast({ title: t("sessionView.analysisFailed"), description: error.message, variant: "destructive" });
    } finally {
      if (loadingTickRef.current) clearInterval(loadingTickRef.current);
      setIsAnalyzing(false);
    }
  };

  const copyShareLink = () => {
    if (!session) return;
    const link = `${window.location.origin}/s/${session.short_code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: t("sessionView.linkCopied"), description: link });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isWaiting = session?.status === "waiting_for_party_b" || session?.status === "waiting_for_both";
  const isBothSubmitted = session?.status === "both_submitted";
  const isAnalyzed = session?.status === "analyzed" && analysis;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img src="/logo-empathic-legal.png" alt={t("common.appName")} className="h-10" />
          </Link>
          <LanguageSwitcher />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
        {/* Waiting state */}
        {isWaiting && (
          <Card className="text-center">
            <CardHeader>
              <CardTitle className="text-2xl font-serif">{t("sessionView.waitingTitle")}</CardTitle>
              <CardDescription>{t("sessionView.waitingDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-secondary rounded-lg p-4 flex items-center justify-between gap-2">
                <code className="text-sm font-mono flex-1 text-start truncate">
                  {window.location.origin}/s/{session?.short_code}
                </code>
                <Button variant="outline" size="sm" onClick={copyShareLink}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">{t("sessionView.waitingNote")}</p>
            </CardContent>
          </Card>
        )}

        {/* Both submitted - trigger analysis */}
        {isBothSubmitted && !analysis && (
          <Card className="text-center">
            <CardHeader>
              <CardTitle className="text-2xl font-serif">{t("sessionView.bothSubmittedTitle")}</CardTitle>
              <CardDescription>{t("sessionView.bothSubmittedDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={triggerAnalysis} disabled={isAnalyzing} size="lg" className="px-10">
                {isAnalyzing ? (
                  <><Loader2 className="me-2 h-4 w-4 animate-spin" />{t("sessionView.analyzing")}</>
                ) : (
                  t("sessionView.generateAnalysis")
                )}
              </Button>
              {isAnalyzing && (
                <p className="text-sm text-muted-foreground animate-pulse">
                  {t(`sessionView.loadingMsg${loadingMsgIdx}`)}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {isAnalyzed && (
          <>
            <div className="text-center space-y-2 mb-8">
              <h1 className="text-3xl font-serif font-bold">{t("sessionView.empathicAnalysisTitle")}</h1>
              <p className="text-muted-foreground text-sm">{t("sessionView.analysisDescription")}</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-serif">
                  <HeartHandshake className="h-5 w-5 text-primary" />
                  {t("sessionView.empathicSummary")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground leading-relaxed whitespace-pre-wrap">{analysis.empathic_summary}</p>
              </CardContent>
            </Card>

            {analysis.legal_concepts && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl font-serif">
                    <Scale className="h-5 w-5 text-primary" />
                    {t("sessionView.legalConcepts")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(analysis.legal_concepts as any[]).map((concept: any, i: number) => (
                      <div key={i} className="border-s-2 border-primary/30 ps-4">
                        <h4 className="font-semibold">{concept.concept}</h4>
                        <p className="text-muted-foreground text-sm mt-1">{concept.explanation}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {analysis.bridge_suggestions && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl font-serif">
                    <Lightbulb className="h-5 w-5 text-primary" />
                    {t("sessionView.bridgeSuggestions")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {(analysis.bridge_suggestions as string[]).map((suggestion: string, i: number) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center text-sm shrink-0">
                          {i + 1}
                        </span>
                        <p className="text-foreground">{suggestion}</p>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Next step guidance */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-900">
              <strong>Next step: </strong>{t("sessionView.nextStep")}
            </div>

            <div className="flex gap-4">
              <Button variant="outline" className="flex-1" asChild>
                <Link to="/new">{t("sessionView.startNewAgreement")}</Link>
              </Button>
              <Button variant="outline" className="flex-1" asChild>
                <Link to="/">{t("common.home")}</Link>
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default SessionView;
