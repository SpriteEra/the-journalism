import { Check, Languages } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LANGUAGES } from "../../i18n";
import { IconButton } from "../ui/Button";
import Menu, { MenuItem, MenuLabel } from "../ui/Menu";

/** Interface language (Hindi / English). Only fixed UI text changes — what people write stays as written. */
export default function LanguageSwitch() {
  const { i18n, t } = useTranslation();
  return (
    <Menu trigger={<IconButton label={t("Language")}><Languages className="size-5" /></IconButton>} width="w-44">
      <MenuLabel>{t("Language")}</MenuLabel>
      {LANGUAGES.map((l) => (
        <MenuItem key={l.code} onClick={() => i18n.changeLanguage(l.code)}>
          <span className="flex w-full items-center justify-between gap-2"><span>{l.label}</span>{i18n.language === l.code && <Check className="size-4 text-primary" />}</span>
        </MenuItem>
      ))}
    </Menu>
  );
}
