/** Pagination state moves only after a successful API response.
 * A failed fetch keeps the current index available for a user-triggered retry.
 */
export function createPaginator(fetchPage) {
  if (typeof fetchPage !== "function") throw new TypeError("Uma função de busca é obrigatória.");
  let page = 0;
  let hasNext = true;
  return {
    get page() { return page; },
    get hasNext() { return hasNext; },
    async next() {
      if (!hasNext) return {items: [], hasNext: false};
      const result = await fetchPage(page);
      if (!result || !Array.isArray(result.items) || typeof result.hasNext !== "boolean")
        throw new TypeError("Página inválida retornada pela API.");
      page++;
      hasNext = result.hasNext;
      return result;
    }
  };
}
