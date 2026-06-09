export function getVisiblePages(
  currentPage: number,
  totalPages: number,
  windowSize = 2
): (number | "ellipsis")[] {
  if (totalPages <= 1) return [1];

  const pages = new Set<number>([1, totalPages, currentPage]);
  for (let i = 1; i <= windowSize; i += 1) {
    if (currentPage - i >= 1) pages.add(currentPage - i);
    if (currentPage + i <= totalPages) pages.add(currentPage + i);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const result: (number | "ellipsis")[] = [];

  for (let i = 0; i < sorted.length; i += 1) {
    const page = sorted[i];
    const prev = sorted[i - 1];
    if (i > 0 && page - prev > 1) {
      result.push("ellipsis");
    }
    result.push(page);
  }

  return result;
}
