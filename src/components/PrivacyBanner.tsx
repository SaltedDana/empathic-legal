import { Shield } from "lucide-react";
import { useTranslation } from "react-i18next";

export const PrivacyBanner = () => {
  const { t } = useTranslation();

  return (
    <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 flex items-start gap-3 my-6">
      <Shield className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
      <div>
        <h4 className="text-sm font-medium text-amber-900">{t("privacy.title")}</h4>
        <p className="text-sm text-amber-800 mt-1">{t("privacy.description")}</p>
      </div>
    </div>
  );
};
