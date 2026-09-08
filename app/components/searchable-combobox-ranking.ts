export type SearchableComboboxOption = {
  id: string;
  value: string;
  aliases?: readonly string[];
  meta?: string;
  priority?: number;
};

export function normalizeComboboxSearch(value: string) {
  return value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("id-ID")
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

export function filterSearchableComboboxOptions(
  options: readonly SearchableComboboxOption[],
  query: string,
  limit = 8,
) {
  const normalizedQuery = normalizeComboboxSearch(query);

  return options
    .filter((option) => optionRank(option, normalizedQuery) < 5)
    .sort((first, second) => {
      if (!normalizedQuery) {
        const priorityDifference = (first.priority ?? 1_000) - (second.priority ?? 1_000);
        if (priorityDifference !== 0) return priorityDifference;
        return first.value.localeCompare(second.value, "id-ID");
      }

      const firstRank = optionRank(first, normalizedQuery);
      const secondRank = optionRank(second, normalizedQuery);
      if (firstRank !== secondRank) return firstRank - secondRank;
      return first.value.localeCompare(second.value, "id-ID");
    })
    .slice(0, limit);
}

export function findExactSearchableComboboxOption(
  options: readonly SearchableComboboxOption[],
  query: string,
) {
  const normalizedQuery = normalizeComboboxSearch(query);
  if (!normalizedQuery) return undefined;

  return options.find((option) => normalizeComboboxSearch(option.value) === normalizedQuery)
    ?? options.find((option) => option.aliases?.some(
      (alias) => normalizeComboboxSearch(alias) === normalizedQuery,
    ));
}

export function findMatchingSearchableComboboxAlias(
  option: SearchableComboboxOption,
  query: string,
) {
  const normalizedQuery = normalizeComboboxSearch(query);
  if (!normalizedQuery) return null;

  const aliases = option.aliases ?? [];
  return aliases.find((alias) => normalizeComboboxSearch(alias) === normalizedQuery)
    ?? aliases.find((alias) => normalizeComboboxSearch(alias).startsWith(normalizedQuery))
    ?? aliases.find((alias) => normalizeComboboxSearch(alias).includes(normalizedQuery))
    ?? null;
}

function optionRank(option: SearchableComboboxOption, query: string) {
  if (!query) return 0;

  const canonical = normalizeComboboxSearch(option.value);
  const aliases = (option.aliases ?? []).map(normalizeComboboxSearch);
  if (canonical === query) return 0;
  if (aliases.includes(query)) return 1;
  if (canonical.startsWith(query)) return 2;
  if (aliases.some((alias) => alias.startsWith(query))) return 3;
  if (canonical.includes(query) || aliases.some((alias) => alias.includes(query))) return 4;
  return 5;
}
