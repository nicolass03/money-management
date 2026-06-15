import i18n from "@/lib/i18n";

export function tError(key: string): string {
  return i18n.t(`errors:${key}`);
}
