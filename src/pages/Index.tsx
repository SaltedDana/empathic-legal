import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Star, StarDivider } from "@/components/Star";

const Index = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <img src="/logo-empathic-legal.png" alt={t("common.appName")} className="h-10" />
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Button variant="ghost" asChild>
              <Link to="/auth">{t("common.signIn")}</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-24 md:py-32 max-w-[560px] animate-calm-in">
        <div className="text-center space-y-8">
          <Star size={20} className="text-primary mx-auto" />

          <h1 className="font-serif text-[32px] md:text-[36px] leading-[1.25] text-foreground">
            {t("index.heroTitle")}{" "}
            <span className="text-primary">{t("index.heroTitleSuffix")}</span>
          </h1>

          <p className="text-base text-muted-foreground max-w-md mx-auto">
            {t("index.heroDescription")}
          </p>

          <div className="pt-4 flex flex-col items-center gap-4">
            <Button
              size="lg"
              className="px-8 h-12 text-base rounded-xl"
              onClick={() => navigate("/new")}
            >
              {t("index.startNewAgreement")}
            </Button>
            <Link
              to="/auth"
              className="text-sm text-ink-soft hover:text-primary hover:underline underline-offset-4 transition"
            >
              {t("common.signIn")}
            </Link>
          </div>
        </div>

        <StarDivider />

        <div className="space-y-8 text-center max-w-md mx-auto">
          <div>
            <p className="label-eyebrow mb-2">01</p>
            <h3 className="font-serif text-xl mb-1">{t("index.step1Title")}</h3>
            <p className="text-sm text-muted-foreground">{t("index.step1Desc")}</p>
          </div>
          <div>
            <p className="label-eyebrow mb-2">02</p>
            <h3 className="font-serif text-xl mb-1">{t("index.step2Title")}</h3>
            <p className="text-sm text-muted-foreground">{t("index.step2Desc")}</p>
          </div>
          <div>
            <p className="label-eyebrow mb-2">03</p>
            <h3 className="font-serif text-xl mb-1">{t("index.step3Title")}</h3>
            <p className="text-sm text-muted-foreground">{t("index.step3Desc")}</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
