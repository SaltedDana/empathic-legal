import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAutoSave } from "@/hooks/useAutoSave";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { VoiceButton } from "@/components/VoiceButton";
import { PrivacyBanner } from "@/components/PrivacyBanner";
import { AutoSaveIndicator } from "@/components/AutoSaveIndicator";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Loader2 } from "lucide-react";
import { Star } from "@/components/Star";
import { useToast } from "@/components/ui/use-toast";

interface ResponseForm {
  concerns: string;
  protections: string;
  priorities: string;
  desired_outcomes: string;
}

const defaultForm: ResponseForm = {
  concerns: "",
  protections: "",
  priorities: "",
  desired_outcomes: "",
};

const JoinSession = () => {
  const { code } = useParams<{ code: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { data: formData, setData: setFormData, isSaving } = useAutoSave<ResponseForm>(`join-session-${code}`, defaultForm);
  const [session, setSession] = useState<any>(null);
  const [inviterName, setInviterName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [joinStep, setJoinStep] = useState<"welcome" | "context" | "fears">("welcome");

  useEffect(() => {
    const fetchSession = async () => {
      if (!code) return;
      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .eq("short_code", code.toUpperCase())
        .single();

      if (error || !data) {
        toast({ title: t("joinSession.sessionNotFound"), description: t("joinSession.linkMayBeInvalid"), variant: "destructive" });
        navigate("/");
        return;
      }
      setSession(data);

      // Try to fetch the inviter's display name
      if (data.creator_user_id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("user_id", data.creator_user_id)
          .single();
        if (profile?.display_name) setInviterName(profile.display_name);
      }

      setIsLoading(false);
    };
    fetchSession();
  }, [code, navigate, toast, t]);

  const updateField = (field: keyof ResponseForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const appendToField = (field: keyof ResponseForm, text: string) => {
    setFormData(prev => ({ ...prev, [field]: prev[field] + text }));
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: t("joinSession.signInRequired"), description: t("joinSession.signInToSubmit"), variant: "destructive" });
      navigate("/auth");
      return;
    }

    if (!session) return;

    setIsSubmitting(true);
    try {
      const { error: responseError } = await supabase
        .from("party_responses")
        .insert({
          session_id: session.id,
          user_id: user.id,
          party_role: "party_b",
          concerns: formData.concerns,
          protections: formData.protections,
          priorities: formData.priorities,
          desired_outcomes: formData.desired_outcomes,
          submitted: true,
        });

      if (responseError) throw responseError;

      await supabase
        .from("sessions")
        .update({ status: "both_submitted" })
        .eq("id", session.id);

      localStorage.removeItem(`join-session-${code}`);
      toast({ title: t("joinSession.submitted"), description: t("joinSession.bothSubmitted") });
      navigate(`/session/${session.id}`);
    } catch (error: any) {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Star size={24} className="text-primary" spinning />
      </div>
    );
  }

  const welcomeTitle = inviterName
    ? t("joinSession.welcomeTitle", { name: inviterName })
    : t("joinSession.welcomeTitleFallback");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img src="/logo-empathic-legal.png" alt={t("common.appName")} className="h-10" />
          </Link>
          <div className="flex items-center gap-2">
            <AutoSaveIndicator isSaving={isSaving} />
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-[560px] space-y-8 animate-calm-in">

        {/* ── Welcome screen ── */}
        {joinStep === "welcome" && (
          <Card>
            <CardContent className="pt-10 pb-10 space-y-8 text-center">
              <Star size={20} className="text-primary mx-auto" />
              <div className="space-y-3">
                <h1 className="text-[28px] font-serif max-w-md mx-auto">{welcomeTitle}</h1>
                <p className="text-muted-foreground max-w-md mx-auto">{t("joinSession.welcomeSubtitle")}</p>
              </div>

              <div className="text-start space-y-4 max-w-sm mx-auto pt-2">
                <div className="flex items-start gap-3">
                  <Star size={10} className="text-ink-soft mt-2 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{t("joinSession.welcomeFeature1Title")}</p>
                    <p className="text-xs text-muted-foreground">{t("joinSession.welcomeFeature1Desc")}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Star size={10} className="text-ink-soft mt-2 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{t("joinSession.welcomeFeature2Title")}</p>
                    <p className="text-xs text-muted-foreground">{t("joinSession.welcomeFeature2Desc")}</p>
                  </div>
                </div>
              </div>

              <Button size="lg" className="w-full sm:w-auto px-10" onClick={() => setJoinStep("context")}>
                {t("joinSession.welcomeCta")}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ── Step 1: Agreement context ── */}
        {joinStep === "context" && (
          <Card>
            <CardHeader>
              <p className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-1">{t("joinSession.stepLabel")}</p>
              <CardTitle className="text-2xl font-serif">{t("joinSession.yourSideTitle")}</CardTitle>
              <CardDescription>{t("joinSession.yourSideSubtitle")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-secondary/30 rounded-lg p-4">
                <p className="text-xs font-semibold text-muted-foreground mb-1">{t("joinSession.agreementContext")}</p>
                <p className="text-sm whitespace-pre-wrap">{session?.context}</p>
              </div>
              <p className="text-xs text-muted-foreground">{t("joinSession.otherPartyDescribed")}</p>
              <div className="relative">
                <Textarea
                  placeholder={t("joinSession.concernsPlaceholder")}
                  className="min-h-[120px]"
                  value={formData.concerns}
                  onChange={(e) => updateField("concerns", e.target.value)}
                />
                <VoiceButton onResult={(text) => appendToField("concerns", text)} className="absolute bottom-3 end-3" />
              </div>
              <div className="flex gap-4 pt-2">
                <Button variant="outline" onClick={() => setJoinStep("welcome")} className="flex-1">{t("common.back")}</Button>
                <Button className="flex-1" onClick={() => setJoinStep("fears")} disabled={!formData.concerns.trim()}>
                  {t("joinSession.welcomeCta")}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Step 2: Private feelings ── */}
        {joinStep === "fears" && (
          <>
            <PrivacyBanner />

            <Card>
              <CardHeader>
                <p className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-1">{t("joinSession.step2Label")}</p>
                <CardTitle className="text-2xl font-serif">{t("joinSession.yourConcerns")}</CardTitle>
                <CardDescription>{t("joinSession.concernsSubtitle")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">

                {/* Worries */}
                <div className="space-y-1">
                  <label className="text-sm font-semibold block">{t("joinSession.concernsLabel")}</label>
                  <p className="text-xs text-muted-foreground">{t("joinSession.concernsHint")}</p>
                  <div className="relative mt-1">
                    <Textarea
                      placeholder={t("joinSession.concernsPlaceholder")}
                      className="min-h-[110px]"
                      value={formData.protections}
                      onChange={(e) => updateField("protections", e.target.value)}
                    />
                    <VoiceButton onResult={(text) => appendToField("protections", text)} className="absolute bottom-3 end-3" />
                  </div>
                </div>

                {/* Safety */}
                <div className="space-y-1">
                  <label className="text-sm font-semibold block">{t("joinSession.protectLabel")}</label>
                  <div className="relative mt-1">
                    <Textarea
                      placeholder={t("joinSession.protectionsPlaceholder")}
                      className="min-h-[110px]"
                      value={formData.desired_outcomes}
                      onChange={(e) => updateField("desired_outcomes", e.target.value)}
                    />
                    <VoiceButton onResult={(text) => appendToField("desired_outcomes", text)} className="absolute bottom-3 end-3" />
                  </div>
                </div>

                {/* Ideal outcome */}
                <div className="space-y-1">
                  <label className="text-sm font-semibold block">{t("joinSession.outcomesLabel")}</label>
                  <div className="relative mt-1">
                    <Textarea
                      placeholder={t("joinSession.outcomesPlaceholder")}
                      className="min-h-[110px]"
                      value={formData.priorities}
                      onChange={(e) => updateField("priorities", e.target.value)}
                    />
                    <VoiceButton onResult={(text) => appendToField("priorities", text)} className="absolute bottom-3 end-3" />
                  </div>
                </div>

                {/* Hesitation (optional) */}
                <div className="space-y-1">
                  <label className="text-sm font-semibold block">
                    {t("joinSession.hesitationLabel")}
                    <span className="text-xs font-normal text-muted-foreground ms-2">({t("common.optional")})</span>
                  </label>
                  <p className="text-xs text-muted-foreground">{t("joinSession.hesitationHint")}</p>
                  <div className="relative mt-1">
                    <Textarea
                      placeholder={t("joinSession.hesitationPlaceholder")}
                      className="min-h-[90px]"
                      value={formData.concerns}
                      onChange={(e) => updateField("concerns", e.target.value)}
                    />
                    <VoiceButton onResult={(text) => appendToField("concerns", text)} className="absolute bottom-3 end-3" />
                  </div>
                </div>

              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setJoinStep("context")} className="flex-1">{t("common.back")}</Button>
              <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1 h-12 text-base">
                {isSubmitting
                  ? <><Loader2 className="me-2 h-4 w-4 animate-spin" />{t("joinSession.submitting")}</>
                  : t("joinSession.submitResponse")}
              </Button>
            </div>
          </>
        )}

      </main>
    </div>
  );
};

export default JoinSession;
