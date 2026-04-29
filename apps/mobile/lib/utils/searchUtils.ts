/**
 * Sanitize user input for PostgREST `.or()` / `.ilike()` filter strings.
 *
 * PostgREST filter syntax uses `,` `(` `)` `.` `:` as structural characters.
 * `%` is a SQL wildcard. `\` can escape. Passing raw user input into
 * `or(\`col.ilike.%${q}%\`)` lets a malicious query reshape the filter.
 *
 * This helper strips the risky characters. For search inputs typed by users,
 * those characters aren't meaningful anyway (names, usernames).
 */
export function sanitizeSearch(input: string): string {
  return input.replace(/[,().:%\\]/g, '').trim();
}
