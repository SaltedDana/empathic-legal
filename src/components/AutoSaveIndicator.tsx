import { CheckCircle2, Loader2 } from "lucide-react";

export const AutoSaveIndicator = ({ isSaving }: { isSaving: boolean }) => {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      {isSaving ? (
        <>
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>שומר...</span>
        </>
      ) : (
        <>
          <CheckCircle2 className="h-3 w-3" />
          <span>נשמר</span>
        </>
      )}
    </div>
  );
};
