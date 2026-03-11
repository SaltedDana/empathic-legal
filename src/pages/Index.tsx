import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Lock, Heart, Scale } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const Index = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <img src="/logo-empathic-legal.png" alt={t("common.appName")} className="h-10" />
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Button variant="ghost" asChild>
              <Link to="/auth">{t("common.signIn")}</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="container mx-auto px-4 py-16 md:py-24 max-w-5xl">
        <div className="text-center max-w-3xl mx-auto space-y-6 mb-16">
          <div className="text-6xl mb-2">🤝</div>
          <h1 className="text-5xl md:text-6xl font-serif font-bold text-foreground tracking-tight">
            {t("index.heroTitle")}<br />
            <span className="text-amber-600">{t("index.heroTitleSuffix")}</span>
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            {t("index.heroDescription")}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Button size="lg" className="w-full sm:w-auto text-lg h-14 px-8" onClick={() => navigate("/new")}>
              {t("index.startNewAgreement")}
            </Button>
          </div>
        </div>

        {/* How it works */}
        <div className="grid md:grid-cols-3 gap-8 mt-24">
          <Card className="border-none shadow-md bg-secondary/50">
            <CardContent className="pt-6 text-center space-y-4">
              <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">{t("index.step1Title")}</h3>
              <p className="text-muted-foreground">{t("index.step1Desc")}</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-secondary/50">
            <CardContent className="pt-6 text-center space-y-4">
              <div className="mx-auto bg-amber-100 w-12 h-12 rounded-full flex items-center justify-center">
                <Heart className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="font-semibold text-lg">{t("index.step2Title")}</h3>
              <p className="text-muted-foreground">{t("index.step2Desc")}</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-secondary/50">
            <CardContent className="pt-6 text-center space-y-4">
              <div className="mx-auto bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center">
                <Scale className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-lg">{t("index.step3Title")}</h3>
              <p className="text-muted-foreground">{t("index.step3Desc")}</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Index;
