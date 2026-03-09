import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Shield, HeartHandshake, Scale } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="font-serif text-2xl font-bold flex items-center gap-2 text-primary">
            <HeartHandshake className="h-6 w-6" />
            Legal Empathy Bridge
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="container mx-auto px-4 py-16 md:py-24 max-w-5xl">
        <div className="text-center max-w-3xl mx-auto space-y-6 mb-16">
          <h1 className="text-5xl md:text-6xl font-serif font-bold text-foreground tracking-tight">
            Build agreements without the <span className="text-amber-600">confrontation</span>
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            A two-party agreement tool where you privately share your concerns. 
            Our AI translates them into empathic language and suggests relevant legal protections for both sides.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Button size="lg" className="w-full sm:w-auto text-lg h-14 px-8" onClick={() => navigate("/new")}>
              Start New Agreement
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* How it works */}
        <div className="grid md:grid-cols-3 gap-8 mt-24">
          <Card className="border-none shadow-md bg-secondary/50">
            <CardContent className="pt-6 text-center space-y-4">
              <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">1. Share Privately</h3>
              <p className="text-muted-foreground">
                Express your fears, needs, and priorities safely. Your exact words are never shown to the other party.
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-none shadow-md bg-secondary/50">
            <CardContent className="pt-6 text-center space-y-4">
              <div className="mx-auto bg-amber-100 w-12 h-12 rounded-full flex items-center justify-center">
                <HeartHandshake className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="font-semibold text-lg">2. AI Translation</h3>
              <p className="text-muted-foreground">
                Our AI analyzes both sides and creates a neutral, empathic summary that validates both perspectives.
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-secondary/50">
            <CardContent className="pt-6 text-center space-y-4">
              <div className="mx-auto bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center">
                <Scale className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-lg">3. Legal Concepts</h3>
              <p className="text-muted-foreground">
                Get suggested clauses and protections to include in your final contract to address everyone's needs.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Index;
