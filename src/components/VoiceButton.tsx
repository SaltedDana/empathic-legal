import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSpeechToText } from "@/hooks/useSpeechToText";

export const VoiceButton = ({ 
  onResult, 
  className 
}: { 
  onResult: (text: string) => void;
  className?: string;
}) => {
  const { isListening, isSupported, toggleListening } = useSpeechToText(onResult);

  if (!isSupported) return null;

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className={cn(
        "rounded-full transition-all duration-300",
        isListening ? "bg-red-100 text-red-600 border-red-200 hover:bg-red-200 animate-pulse" : "text-muted-foreground",
        className
      )}
      onClick={toggleListening}
      title={isListening ? "Stop listening" : "Start voice input"}
    >
      {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
    </Button>
  );
};
