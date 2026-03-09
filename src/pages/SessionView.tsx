import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { HeartHandshake, Copy, Loader2, Scale, Lightbulb, Check } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const SessionView = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [session, setSession] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [copied, setCopied] = useState(false);

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

        // Check for existing analysis
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
    try {
      const { data, error } = await supabase.functions.invoke("analyze-session", {
        body: { session_id: id },
      });

      if (error) throw error;
      setAnalysis(data);
      setSession((prev: any) => ({ ...prev, status: "analyzed" }));
      toast({ title: "Analysis complete!", description: "The empathic summary is ready." });
    } catch (error: any) {
      toast({ title: "Analysis failed", description: error.message, variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyShareLink = () => {
    if (!session) return;
    const link = `${window.location.origin}/s/${session.short_code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Link copied!", description: link });
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
        <div className="container mx-auto px-4 h-16 flex items-center">
          <Link to="/" className="font-serif text-2xl font-bold flex items-center gap-2 text-primary">
            <HeartHandshake className="h-6 w-6" />
            Legal Empathy Bridge
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
        {/* Waiting state */}
        {isWaiting && (
          <Card className="text-center">
            <CardHeader>
              <CardTitle className="text-2xl font-serif">Waiting for the other party</CardTitle>
              <CardDescription>
                Share this link with the other party so they can submit their perspective.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-secondary rounded-lg p-4 flex items-center justify-between gap-2">
                <code className="text-sm font-mono flex-1 text-left truncate">
                  {window.location.origin}/s/{session?.short_code}
                </code>
                <Button variant="outline" size="sm" onClick={copyShareLink}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                You'll be able to view the AI analysis once both parties have submitted.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Both submitted - trigger analysis */}
        {isBothSubmitted && !analysis && (
          <Card className="text-center">
            <CardHeader>
              <CardTitle className="text-2xl font-serif">Both parties have submitted!</CardTitle>
              <CardDescription>Ready to generate the empathic analysis.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={triggerAnalysis} disabled={isAnalyzing} size="lg">
                {isAnalyzing ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing...</>
                ) : (
                  "Generate Empathic Analysis"
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {isAnalyzed && (
          <>
            <div className="text-center space-y-2 mb-8">
              <h1 className="text-3xl font-serif font-bold">Empathic Analysis</h1>
              <p className="text-muted-foreground text-sm">
                This summary represents both perspectives in neutral language. Your specific words remain private.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-serif">
                  <HeartHandshake className="h-5 w-5 text-primary" />
                  Empathic Summary
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
                    Relevant Legal Concepts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(analysis.legal_concepts as any[]).map((concept: any, i: number) => (
                      <div key={i} className="border-l-2 border-primary/30 pl-4">
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
                    Bridge Building Suggestions
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

            <div className="flex gap-4">
              <Button variant="outline" className="flex-1" asChild>
                <Link to="/new">Start New Agreement</Link>
              </Button>
              <Button variant="outline" className="flex-1" asChild>
                <Link to="/">Home</Link>
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default SessionView;
