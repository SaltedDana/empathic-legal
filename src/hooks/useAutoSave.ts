import { useState, useEffect } from 'react';
import { useToast } from "@/components/ui/use-toast";

export const useAutoSave = <T>(key: string, initialValue: T) => {
  const { toast } = useToast();
  
  // Initialize from local storage if available
  const [data, setData] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn('Error reading localStorage', error);
      return initialValue;
    }
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      try {
        setIsSaving(true);
        window.localStorage.setItem(key, JSON.stringify(data));
        setTimeout(() => setIsSaving(false), 500); // UI feedback
      } catch (error) {
        console.error('Error saving to localStorage', error);
        toast({
          title: "Save failed",
          description: "Could not save your progress locally.",
          variant: "destructive"
        });
      }
    }, 1000); // 1s debounce

    return () => clearTimeout(timeoutId);
  }, [data, key, toast]);

  const clearData = () => {
    try {
      window.localStorage.removeItem(key);
      setData(initialValue);
    } catch (error) {
      console.error('Error clearing localStorage', error);
    }
  };

  return { data, setData, isSaving, clearData };
};
