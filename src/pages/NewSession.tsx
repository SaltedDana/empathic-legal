import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAutoSave } from "@/hooks/useAutoSave";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { VoiceButton } from "@/components/VoiceButton";
import { PrivacyBanner } from "@/components/PrivacyBanner";
import { AutoSaveIndicator } from "@/components/AutoSaveIndicator";
import { HeartHandshake, ArrowLeft, Loader2 } from "lucide-react";
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
      toast({ title: "נדרשת התחברות", description: "אנא התחברו כדי ליצור הפעלה.", variant: "destructive" });
      navigate("/auth");
      return;
    }

    if (!formData.context.trim()) {
      toast({ title: "נדרש הקשר", description: "אנא תארו את ההסכם.", variant: "destructive" });
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

      toast({ title: "ההפעלה נוצרה!", description: `קוד שיתוף: ${shortCode}` });
      navigate(`/session/${session.id}`);
    } catch (error: any) {
      toast({ title: "שגיאה", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="font-serif text-2xl font-bold flex items-center gap-2 text-primary">
            <HeartHandshake className="h-6 w-6" />
            גשר אמפתיה משפטי
          </Link>
          <AutoSaveIndicator isSaving={isSaving} />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {step === "context" ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-serif">תארו את ההסכם</CardTitle>
              <CardDescription>
                איזה סוג הסכם זה? מה אתם מנסים להשיג יחד?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Textarea
                  placeholder="לדוגמה: אנחנו מתחילים שותפות עסקית וצריכים להגדיר תפקידים, חלוקת הון ותנאי יציאה..."
                  className="min-h-[200px]"
                  value={formData.context}
                  onChange={(e) => updateField("context", e.target.value)}
                />
                <VoiceButton
                  onResult={(text) => appendToField("context", text)}
                  className="absolute bottom-3 left-3"
                />
              </div>
              <Button
                className="w-full"
                onClick={() => setStep("fears")}
                disabled={!formData.context.trim()}
              >
                המשיכו לחששות שלכם
                <ArrowLeft className="mr-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <PrivacyBanner />

            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-serif">החששות שלכם</CardTitle>
                <CardDescription>ממה אתם חוששים שעלול להשתבש?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Textarea
                    placeholder="מה מדאיג אתכם לגבי ההסכם הזה?"
                    className="min-h-[120px]"
                    value={formData.concerns}
                    onChange={(e) => updateField("concerns", e.target.value)}
                  />
                  <VoiceButton onResult={(text) => appendToField("concerns", text)} className="absolute bottom-3 left-3" />
                </div>
                <div className="relative">
                  <label className="text-sm font-medium mb-2 block">ממה אתם רוצים להגן על עצמכם?</label>
                  <Textarea
                    placeholder="הגנות ספציפיות שאתם רוצים בהסכם..."
                    className="min-h-[120px]"
                    value={formData.protections}
                    onChange={(e) => updateField("protections", e.target.value)}
                  />
                  <VoiceButton onResult={(text) => appendToField("protections", text)} className="absolute bottom-3 left-3" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-serif">העדיפויות שלכם</CardTitle>
                <CardDescription>מה הכי חשוב לכם בהסכם הזה?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Textarea
                    placeholder="העדיפויות העליונות והדברים שאינם ניתנים למשא ומתן..."
                    className="min-h-[120px]"
                    value={formData.priorities}
                    onChange={(e) => updateField("priorities", e.target.value)}
                  />
                  <VoiceButton onResult={(text) => appendToField("priorities", text)} className="absolute bottom-3 left-3" />
                </div>
                <div className="relative">
                  <label className="text-sm font-medium mb-2 block">לאילו תוצאות אתם מקווים?</label>
                  <Textarea
                    placeholder="התוצאות האידיאליות שלכם מההסכם..."
                    className="min-h-[120px]"
                    value={formData.desired_outcomes}
                    onChange={(e) => updateField("desired_outcomes", e.target.value)}
                  />
                  <VoiceButton onResult={(text) => appendToField("desired_outcomes", text)} className="absolute bottom-3 left-3" />
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setStep("context")} className="flex-1">חזרה</Button>
              <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1">
                {isSubmitting ? <><Loader2 className="ml-2 h-4 w-4 animate-spin" />שולח...</> : "שליחה וקבלת קישור שיתוף"}
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default NewSession;
