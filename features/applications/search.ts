import { z } from "zod";
export const isEmailSearch = (value: string) =>
  z.email().safeParse(value).success;
// Keep database and synthetic preview matching aligned with Convex's word tokenizer.
export function searchWords(value: string) {
  return value.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
}
export function applicantSearchText(row: {
  reference: string;
  data: { firstName: string; lastName: string; email: string };
}) {
  return `${row.reference} ${row.data.firstName} ${row.data.lastName} ${row.data.email}`;
}
export function applicantSearchMatches(
  row: Parameters<typeof applicantSearchText>[0],
  search: string,
) {
  if (isEmailSearch(search))
    return row.data.email.toLowerCase() === search.toLowerCase();
  const words = searchWords(applicantSearchText(row));
  const terms = searchWords(search);
  return terms.every((term, index) =>
    words.some((word) =>
      index === terms.length - 1 ? word.startsWith(term) : word === term,
    ),
  );
}
