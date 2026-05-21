import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe } from "lucide-react";

const languageOptions = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "hi", label: "हिन्दी" },
  { value: "kn", label: "ಕನ್ನಡ" },
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = (value: string) => {
    i18n.changeLanguage(value);
    localStorage.setItem("preferredLanguage", value);
  };

  return (
    <div className="flex items-center gap-2">
      <Globe className="w-4 h-4" />
      <Select value={i18n.language} onValueChange={changeLanguage}>
        <SelectTrigger className="w-32">
          <SelectValue placeholder="Language" />
        </SelectTrigger>
        <SelectContent>
          {languageOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
