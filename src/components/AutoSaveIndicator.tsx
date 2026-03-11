import { CheckCircle2, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

export const AutoSaveIndicator = ({ isSaving }: { isSaving: boolean }) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      {isSaving ? (
        <>
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>{t("common.saving")}</span>
        </>
      ) : (
        <>
          <CheckCircle2 className="h-3 w-3" />
          <span>{t("common.saved")}</span>
        </>
      )}
    </div>
  );
};
