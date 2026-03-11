import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
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
import { ArrowRight, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface FormData {
  context: string;
  concerns: string;
  protections: string;
  priorities: string;
  desired_outcomes: string;
}

const defaultForm: FormData = {
  context: "",
  concerns: "",
  protections: "",
  priorities: "",
  desired_outcomes: "",
};

const NewSession = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { data: formData, setData: setFormData, isSaving } = useAutoSave<FormData>("new-session-form", defaultForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<"context" | "fears">("context");

  const updateField = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const appendToField = (field: keyof FormData, text: string) => {
    setFormData(prev => ({ ...prev, [field]: prev[field] + text }));
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: t("newSession.signInRequired"), description: t("newSession.signInToCreate"), variant: "destructive" });
      navigate("/auth");
      return;
    }

    if (!formData.context.trim()) {
      toast({ title: t("newSession.contextRequired"), description: t("newSession.pleaseDescribe"), variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: shortCode, error: codeError } = await supabase.rpc("generate_short_code");
      if (codeError) throw codeError;

      const { data: session, error: sessionError } = await supabase
        .from("sessions")
        .insert({
          context: formData.context,
          short_code: shortCode,
          creator_user_id: user.id,
          status: "waiting_for_party_b",
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      const { error: responseError } = await supabase
        .from("party_responses")
        .insert({
          session_id: session.id,
          user_id: user.id,
          party_role: "party_a",
          concerns: formData.concerns,
          protections: formData.protections,
          priorities: formData.priorities,
          desired_outcomes: formData.desired_outcomes,
          submitted: true,
        });

      if (responseError) throw responseError;

      localStorage.removeItem("new-session-form");

      toast({ title: t("newSession.sessionCreated"), description: t("newSession.shareCode", { code: shortCode }) });
      navigate(`/session/${session.id}`);
    } catch (error: any) {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

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

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {step === "context" ? (
          <Card>
            <CardHeader>
              <p className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-1">{t("newSession.stepLabel")}</p>
              <CardTitle className="text-2xl font-serif">{t("newSession.describeAgreement")}</CardTitle>
              <CardDescription>{t("newSession.describeQuestion")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Textarea
                  placeholder={t("newSession.contextPlaceholder")}
                  className="min-h-[160px]"
                  value={formData.context}
                  onChange={(e) => updateField("context", e.target.value)}
                />
                <VoiceButton
                  onResult={(text) => appendToField("context", text)}
                  className="absolute bottom-3 end-3"
                />
              </div>
              <Button
                className="w-full"
                onClick={() => setStep("fears")}
                disabled={!formData.context.trim()}
              >
                {t("newSession.continueToConcerns")}
                <ArrowRight className="ms-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <PrivacyBanner />

            <Card>
              <CardHeader>
                <p className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-1">{t("newSession.step2Label")}</p>
                <CardTitle className="text-2xl font-serif">{t("newSession.yourConcerns")}</CardTitle>
                <CardDescription>{t("newSession.concernsSubtitle")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">

                {/* Worries */}
                <div className="space-y-1">
                  <label className="text-sm font-semibold block">{t("newSession.concernsLabel")}</label>
                  <p className="text-xs text-muted-foreground">{t("newSession.concernsHint")}</p>
                  <div className="relative mt-1">
                    <Textarea
                      placeholder={t("newSession.concernsPlaceholder")}
                      className="min-h-[110px]"
                      value={formData.concerns}
                      onChange={(e) => updateField("concerns", e.target.value)}
                    />
                    <VoiceButton onResult={(text) => appendToField("concerns", text)} className="absolute bottom-3 end-3" />
                  </div>
                </div>

                {/* Safety / protection */}
                <div className="space-y-1">
                  <label className="text-sm font-semibold block">{t("newSession.protectLabel")}</label>
                  <p className="text-xs text-muted-foreground">{t("newSession.protectHint")}</p>
                  <div className="relative mt-1">
                    <Textarea
                      placeholder={t("newSession.protectionsPlaceholder")}
                      className="min-h-[110px]"
                      value={formData.protections}
                      onChange={(e) => updateField("protections", e.target.value)}
                    />
                    <VoiceButton onResult={(text) => appendToField("protections", text)} className="absolute bottom-3 end-3" />
                  </div>
                </div>

                {/* Ideal outcome */}
                <div className="space-y-1">
                  <label className="text-sm font-semibold block">{t("newSession.outcomesLabel")}</label>
                  <p className="text-xs text-muted-foreground">{t("newSession.outcomesHint")}</p>
                  <div className="relative mt-1">
                    <Textarea
                      placeholder={t("newSession.outcomesPlaceholder")}
                      className="min-h-[110px]"
                      value={formData.desired_outcomes}
                      onChange={(e) => updateField("desired_outcomes", e.target.value)}
                    />
                    <VoiceButton onResult={(text) => appendToField("desired_outcomes", text)} className="absolute bottom-3 end-3" />
                  </div>
                </div>

                {/* Hesitation (optional) */}
                <div className="space-y-1">
                  <label className="text-sm font-semibold block">
                    {t("newSession.hesitationLabel")}
                    <span className="text-xs font-normal text-muted-foreground ms-2">({t("common.optional")})</span>
                  </label>
                  <p className="text-xs text-muted-foreground">{t("newSession.hesitationHint")}</p>
                  <div className="relative mt-1">
                    <Textarea
                      placeholder={t("newSession.hesitationPlaceholder")}
                      className="min-h-[90px]"
                      value={formData.priorities}
                      onChange={(e) => updateField("priorities", e.target.value)}
                    />
                    <VoiceButton onResult={(text) => appendToField("priorities", text)} className="absolute bottom-3 end-3" />
                  </div>
                </div>

              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setStep("context")} className="flex-1">{t("common.back")}</Button>
              <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1">
                {isSubmitting
                  ? <><Loader2 className="me-2 h-4 w-4 animate-spin" />{t("newSession.submitting")}</>
                  : t("newSession.submitAndShare")}
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default NewSession;
