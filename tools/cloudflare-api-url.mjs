/** Validate a public, external API address for Cloudflare Pages builds. */
export function validatePublicApiBaseUrl(raw) {
  if (typeof raw !== "string" || !raw.trim()) {
    throw new Error("Defina API_BASE_URL com uma URL HTTPS pública terminada em /api/v1.");
  }
  let url;
  try { url = new URL(raw.trim()); }
  catch { throw new Error("API_BASE_URL precisa ser URL HTTPS absoluta."); }
  if (url.protocol !== "https:" || !url.hostname || url.username || url.password ||
      url.search || url.hash || url.pathname !== "/api/v1") {
    throw new Error("API_BASE_URL deve ser HTTPS sem credenciais, query ou fragmento e terminar em /api/v1.");
  }
  const host = url.hostname.toLowerCase();
  if (host === "localhost" || host === "0.0.0.0" || host.endsWith(".localhost") ||
      host.endsWith(".local") || host.endsWith(".internal") ||
      /^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host) || host === "[::1]") {
    throw new Error("API_BASE_URL precisa apontar para um serviço público, não para localhost/rede privada.");
  }
  return url.toString();
}
