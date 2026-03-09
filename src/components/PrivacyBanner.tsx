import { Shield } from "lucide-react";

export const PrivacyBanner = () => {
  return (
    <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 flex items-start gap-3 my-6">
      <Shield className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
      <div>
        <h4 className="text-sm font-medium text-amber-900">Your privacy is guaranteed</h4>
        <p className="text-sm text-amber-800 mt-1">
          Your specific words and concerns are kept entirely private. They will not be shown to the other party. 
          Our AI uses this information solely to create a neutral, empathic summary and suggest legal concepts.
        </p>
      </div>
    </div>
  );
};
