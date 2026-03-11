import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";

export const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLanguage(language === "he" ? "en" : "he")}
      className="font-medium text-sm"
    >
      {language === "he" ? "EN" : "עב"}
    </Button>
  );
};
