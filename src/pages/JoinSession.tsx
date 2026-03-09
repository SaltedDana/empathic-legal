import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAutoSave } from "@/hooks/useAutoSave";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { VoiceButton } from "@/components/VoiceButton";
import { PrivacyBanner } from "@/components/PrivacyBanner";
import { AutoSaveIndicator } from "@/components/AutoSaveIndicator";
import { HeartHandshake, Loader2 } from "lucide-react";
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
  const { data: formData, setData: setFormData, isSaving } = useAutoSave<ResponseForm>(`join-session-${code}`, defaultForm);
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      if (!code) return;
      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .eq("short_code", code.toUpperCase())
        .single();

      if (error || !data) {
        toast({ title: "הפעלה לא נמצאה", description: "הקישור הזה עשוי להיות לא תקין.", variant: "destructive" });
        navigate("/");
        return;
      }
      setSession(data);
      setIsLoading(false);
    };
    fetchSession();
  }, [code, navigate, toast]);

  const updateField = (field: keyof ResponseForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const appendToField = (field: keyof ResponseForm, text: string) => {
    setFormData(prev => ({ ...prev, [field]: prev[field] + text }));
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: "נדרשת התחברות", description: "אנא התחברו כדי לשלוח את התגובה שלכם.", variant: "destructive" });
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
      toast({ title: "נשלח!", description: "שני הצדדים שלחו. מייצר ניתוח..." });
      navigate(`/session/${session.id}`);
    } catch (error: any) {
      toast({ title: "שגיאה", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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

      <main className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
        <Card className="bg-secondary/30">
          <CardHeader>
            <CardTitle className="text-xl font-serif">הקשר ההסכם</CardTitle>
            <CardDescription>הצד השני תיאר את ההסכם כך:</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-foreground whitespace-pre-wrap">{session?.context}</p>
          </CardContent>
        </Card>

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
                placeholder="הגנות ספציפיות שאתם רוצים..."
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
            <CardDescription>מה הכי חשוב לכם?</CardDescription>
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
                placeholder="התוצאות האידיאליות שלכם..."
                className="min-h-[120px]"
                value={formData.desired_outcomes}
                onChange={(e) => updateField("desired_outcomes", e.target.value)}
              />
              <VoiceButton onResult={(text) => appendToField("desired_outcomes", text)} className="absolute bottom-3 left-3" />
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full h-12 text-lg">
          {isSubmitting ? <><Loader2 className="ml-2 h-4 w-4 animate-spin" />שולח...</> : "שליחת התגובה שלי"}
        </Button>
      </main>
    </div>
  );
};

export default JoinSession;
