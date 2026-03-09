import { Shield } from "lucide-react";

export const PrivacyBanner = () => {
  return (
    <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 flex items-start gap-3 my-6">
      <Shield className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
      <div>
        <h4 className="text-sm font-medium text-amber-900">הפרטיות שלכם מובטחת</h4>
        <p className="text-sm text-amber-800 mt-1">
          המילים והחששות הספציפיים שלכם נשמרים באופן פרטי לחלוטין. הם לא יוצגו לצד השני.
          הבינה המלאכותית שלנו משתמשת במידע זה אך ורק כדי ליצור סיכום ניטרלי ואמפתי ולהציע מושגים משפטיים.
        </p>
      </div>
    </div>
  );
};
