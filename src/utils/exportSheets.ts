export async function exportToGoogleSheets(
  rows: (string | number)[][],
  title: string,
): Promise<string | null> {
  const tsv = rows
    .map((r) => r.map((c) => String(c ?? '').replace(/\t/g, ' ')).join('\t'))
    .join('\n');
  try {
    await navigator.clipboard.writeText(tsv);
  } catch {
    return null;
  }
  return `https://docs.google.com/spreadsheets/create?title=${encodeURIComponent('Clarisix — ' + title)}`;
}
