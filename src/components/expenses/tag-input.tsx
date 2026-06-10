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
  placeholder = "food, transport",
}: TagInputProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block font-mono text-xs text-muted">
        tags:
      </label>
      <Input
        id={id}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required
      />
      <p className="mt-1 font-mono text-xs text-muted">
        comma-separated, e.g. food, groceries
      </p>
    </div>
  );
}

export function TagList({ tags }: { tags: string[] }) {
  if (tags.length === 0) {
    return <span className="font-mono text-xs text-muted">untagged</span>;
  }

  return (
    <span className="font-mono text-xs text-muted">
      {tags.join(", ")}
    </span>
  );
}
