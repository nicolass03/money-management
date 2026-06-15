import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";

interface TagInputProps {
  id: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function TagInput({
  id,
  name = "tags",
  value,
  onChange,
  placeholder,
}: TagInputProps) {
  const { t } = useTranslation("common");

  return (
    <div>
      <label htmlFor={id} className="mb-2 block font-mono text-xs text-muted">
        {t("labelTags")}
      </label>
      <Input
        id={id}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? t("tagsPlaceholder")}
        required
      />
      <p className="mt-1 font-mono text-xs text-muted">
        {t("tagsHint")}
      </p>
    </div>
  );
}

export function TagList({ tags }: { tags: string[] }) {
  const { t } = useTranslation("common");

  if (tags.length === 0) {
    return <span className="font-mono text-xs text-muted">{t("untagged")}</span>;
  }

  return (
    <span className="font-mono text-xs text-muted">
      {tags.join(", ")}
    </span>
  );
}
