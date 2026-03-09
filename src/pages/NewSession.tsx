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
import { HeartHandshake, ArrowRight, Loader2 } from "lucide-react";
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
      toast({ title: "Sign in required", description: "Please sign in to create a session.", variant: "destructive" });
      navigate("/auth");
      return;
    }

    if (!formData.context.trim()) {
      toast({ title: "Context required", description: "Please describe the agreement.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      // Generate short code via DB function
      const { data: shortCode, error: codeError } = await supabase.rpc("generate_short_code");
      if (codeError) throw codeError;

      // Create session
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

      // Create party A response
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

      // Clear auto-save
      localStorage.removeItem("new-session-form");

      toast({ title: "Session created!", description: `Share code: ${shortCode}` });
      navigate(`/session/${session.id}`);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
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
            Legal Empathy Bridge
          </Link>
          <AutoSaveIndicator isSaving={isSaving} />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {step === "context" ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-serif">Describe the Agreement</CardTitle>
              <CardDescription>
                What kind of agreement is this? What are you trying to accomplish together?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Textarea
                  placeholder="For example: We're starting a business partnership and need to define roles, equity split, and exit terms..."
                  className="min-h-[200px]"
                  value={formData.context}
                  onChange={(e) => updateField("context", e.target.value)}
                />
                <VoiceButton
                  onResult={(text) => appendToField("context", text)}
                  className="absolute bottom-3 right-3"
                />
              </div>
              <Button
                className="w-full"
                onClick={() => setStep("fears")}
                disabled={!formData.context.trim()}
              >
                Continue to Your Concerns
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <PrivacyBanner />

            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-serif">Your Concerns</CardTitle>
                <CardDescription>What are you worried might go wrong?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Textarea
                    placeholder="What keeps you up at night about this agreement?"
                    className="min-h-[120px]"
                    value={formData.concerns}
                    onChange={(e) => updateField("concerns", e.target.value)}
                  />
                  <VoiceButton onResult={(text) => appendToField("concerns", text)} className="absolute bottom-3 right-3" />
                </div>
                <div className="relative">
                  <label className="text-sm font-medium mb-2 block">What do you want to protect yourself from?</label>
                  <Textarea
                    placeholder="Specific protections you want in this agreement..."
                    className="min-h-[120px]"
                    value={formData.protections}
                    onChange={(e) => updateField("protections", e.target.value)}
                  />
                  <VoiceButton onResult={(text) => appendToField("protections", text)} className="absolute bottom-3 right-3" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-serif">Your Priorities</CardTitle>
                <CardDescription>What matters most to you in this agreement?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Textarea
                    placeholder="Your top priorities and non-negotiables..."
                    className="min-h-[120px]"
                    value={formData.priorities}
                    onChange={(e) => updateField("priorities", e.target.value)}
                  />
                  <VoiceButton onResult={(text) => appendToField("priorities", text)} className="absolute bottom-3 right-3" />
                </div>
                <div className="relative">
                  <label className="text-sm font-medium mb-2 block">What outcomes are you hoping for?</label>
                  <Textarea
                    placeholder="Your ideal outcomes from this agreement..."
                    className="min-h-[120px]"
                    value={formData.desired_outcomes}
                    onChange={(e) => updateField("desired_outcomes", e.target.value)}
                  />
                  <VoiceButton onResult={(text) => appendToField("desired_outcomes", text)} className="absolute bottom-3 right-3" />
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setStep("context")} className="flex-1">Back</Button>
              <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1">
                {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</> : "Submit & Get Share Link"}
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default NewSession;
