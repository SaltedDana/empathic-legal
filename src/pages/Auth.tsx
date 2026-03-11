import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { HeartHandshake, Mail } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useTranslation();

  // Redirect if already logged in
  if (user) {
    navigate("/");
    return null;
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast({ title: t("auth.checkEmail"), description: t("auth.confirmationSent") });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/");
      }
    } catch (error: any) {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="font-serif text-2xl font-bold flex items-center gap-2 text-primary">
            <HeartHandshake className="h-6 w-6" />
            {t("common.appName")}
          </Link>
          <LanguageSwitcher />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-serif">
              {isSignUp ? t("auth.createAccount") : t("auth.signInTitle")}
            </CardTitle>
            <CardDescription>
              {isSignUp ? t("auth.signUpDescription") : t("auth.signInDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder={t("auth.emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder={t("auth.passwordPlaceholder")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                <Mail className="me-2 h-4 w-4" />
                {isLoading ? t("common.loading") : isSignUp ? t("common.signUp") : t("common.signIn")}
              </Button>
            </form>

            <Separator />

            <p className="text-center text-sm text-muted-foreground">
              {isSignUp ? t("auth.alreadyHaveAccount") : t("auth.dontHaveAccount")}{" "}
              <button onClick={() => setIsSignUp(!isSignUp)} className="text-primary underline">
                {isSignUp ? t("common.signIn") : t("common.signUp")}
              </button>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Auth;
