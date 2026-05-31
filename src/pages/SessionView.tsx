import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Star, StarDivider } from "@/components/Star";
import { Copy, Check } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const SessionView = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
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
        <Star size={24} className="text-primary" spinning />
      </div>
    );
  }

  const isWaiting = session?.status === "waiting_for_party_b" || session?.status === "waiting_for_both";
  const isBothSubmitted = session?.status === "both_submitted";
  const isAnalyzed = session?.status === "analyzed" && analysis;

  const locale = i18n.language === "he" ? "he-IL" : "en-GB";
  const createdAt = analysis?.created_at
    ? new Date(analysis.created_at).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" })
    : "";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img src="/logo-empathic-legal.png" alt={t("common.appName")} className="h-10" />
          </Link>
          <LanguageSwitcher />
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-[720px] animate-calm-in">
        {/* ─────────── Waiting state ─────────── */}
        {isWaiting && (
          <div className="text-center space-y-8 py-8">
            <Star size={20} className="text-primary mx-auto" spinning />
            <div className="space-y-3">
              <h1 className="font-serif text-[28px]">{t("sessionView.waitingTitle")}</h1>
              <p className="text-muted-foreground max-w-md mx-auto">{t("sessionView.waitingDescription")}</p>
            </div>

            <div className="max-w-md mx-auto space-y-3">
              <p className="label-eyebrow">{t("sessionView.linkCopied") /* short code label */}</p>
              <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-3">
                <code className="font-serif text-2xl tracking-wider text-foreground flex-1 text-start">
                  {session?.short_code}
                </code>
                <Button variant="outline" size="sm" onClick={copyShareLink} className="rounded-lg">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-ink-soft text-start break-all">
                {window.location.origin}/s/{session?.short_code}
              </p>
            </div>

            <p className="text-sm text-ink-soft max-w-md mx-auto">{t("sessionView.waitingNote")}</p>
          </div>
        )}

        {/* ─────────── Both submitted — trigger analysis ─────────── */}
        {isBothSubmitted && !analysis && (
          <div className="text-center space-y-8 py-8">
            {isAnalyzing ? (
              <>
                <Star size={20} className="text-primary mx-auto" spinning />
                <h1 className="font-serif text-[28px] max-w-md mx-auto">
                  {t("sessionView.analyzing")}
                </h1>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {t(`sessionView.loadingMsg${loadingMsgIdx}`)}
                </p>
              </>
            ) : (
              <>
                <Star size={20} className="text-primary mx-auto" />
                <div className="space-y-3">
                  <h1 className="font-serif text-[28px]">{t("sessionView.bothSubmittedTitle")}</h1>
                  <p className="text-muted-foreground max-w-md mx-auto">{t("sessionView.bothSubmittedDesc")}</p>
                </div>
                <Button onClick={triggerAnalysis} size="lg" className="px-8 h-12 rounded-xl">
                  {t("sessionView.generateAnalysis")}
                </Button>
              </>
            )}
          </div>
        )}

        {/* ─────────── Results — printed letter ─────────── */}
        {isAnalyzed && (
          <article className="space-y-2">
            {/* Header — letterhead */}
            <header className="text-center pb-2">
              <p className="label-eyebrow mb-2">{t("sessionView.empathicAnalysisTitle")}</p>
              {createdAt && <p className="text-xs text-ink-soft">{createdAt}</p>}
            </header>

            <StarDivider className="my-8" />

            {/* Common ground — the prose */}
            <section className="space-y-4">
              <h2 className="font-serif text-xl text-center">{t("sessionView.empathicSummary")}</h2>
              <p className="font-serif text-[19px] leading-[1.75] text-foreground whitespace-pre-wrap">
                {analysis.empathic_summary}
              </p>
            </section>

            {analysis.legal_concepts && (
              <>
                <StarDivider />
                <section className="space-y-6">
                  <h2 className="font-serif text-xl text-center">{t("sessionView.legalConcepts")}</h2>
                  <div className="space-y-5">
                    {(analysis.legal_concepts as any[]).map((concept: any, i: number) => (
                      <div key={i} className="bg-card border border-border rounded-xl p-5">
                        <p className="label-eyebrow mb-2">{concept.concept}</p>
                        <p className="text-sm leading-relaxed text-muted-foreground">{concept.explanation}</p>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}

            {analysis.bridge_suggestions && (
              <>
                <StarDivider />
                <section className="space-y-6">
                  <h2 className="font-serif text-xl text-center">{t("sessionView.bridgeSuggestions")}</h2>
                  <div className="space-y-4">
                    {(analysis.bridge_suggestions as string[]).map((suggestion: string, i: number) => (
                      <div key={i} className="bg-card border border-border rounded-xl p-5">
                        <p className="font-serif text-[17px] leading-[1.65] text-foreground">{suggestion}</p>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}

            <StarDivider />

            <footer className="text-center space-y-6 pt-2">
              <p className="text-sm text-ink-soft max-w-md mx-auto italic">
                {t("sessionView.nextStep")}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <Button variant="outline" className="rounded-xl" asChild>
                  <Link to="/new">{t("sessionView.startNewAgreement")}</Link>
                </Button>
                <Button variant="ghost" className="rounded-xl" asChild>
                  <Link to="/">{t("common.home")}</Link>
                </Button>
              </div>
            </footer>
          </article>
        )}
      </main>
    </div>
  );
};

export default SessionView;
