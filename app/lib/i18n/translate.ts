import { english } from "./en.ts";
import { messagePatterns } from "./patterns.ts";

export type Language = "id" | "en";

/** Called for interface copy, never for user-authored content or stored values. */
export function translate<T>(value: T, language: Language): T {
  if (language !== "en" || typeof value !== "string") return value;
  if (english[value]) return english[value] as T;
  const pattern = messagePatterns.find(([match]) => match.test(value));
  return (pattern ? value.replace(pattern[0], pattern[1]) : value) as T;
}
