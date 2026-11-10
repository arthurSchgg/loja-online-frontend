/** Public recovery endpoints hosted with the ADMIN bundle on the API's HTTPS origin.
 * Tokens are read once from URL, promptly removed from browser history and kept in memory.
 */
import {AdminApi, adminOriginAllowed} from "./api.js";

const api = new AdminApi();
const $ = selector => document.querySelector(selector);
function report(text, error = false) {
  const region = $("#recovery-status");
  region.textContent = text;
  region.classList.toggle("error", error);
}
function validPassword(newPassword, confirmation) {
  if (typeof newPassword !== "string" || newPassword.length < 12 || newPassword.length > 128)
    throw new Error("Informe uma frase-senha de 12 a 128 caracteres.");
  if (newPassword !== confirmation)
    throw new Error("As duas senhas precisam ser iguais.");
  return {newPassword, confirmPassword: confirmation};
}
export {validPassword};
export function extractOneTimeToken(href, replaceUrl) {
  const address = new URL(href);
  const token = address.searchParams.get("token");
  address.searchParams.delete("token");
  if (token) replaceUrl(address.pathname + address.search + address.hash);
  return token;
}
export function initRecovery() {
  const requestForm = $("#request-reset");
  const resetForm = $("#confirm-reset");
  const emailForm = $("#confirm-email");
  const token = extractOneTimeToken(location.href, path => history.replaceState(null, "", path));
  const isEmailChange = location.pathname.endsWith("confirm-email.html");
  requestForm.hidden = !!token || isEmailChange;
  resetForm.hidden = !token || isEmailChange;
  emailForm.hidden = !isEmailChange || !token;
  if (!adminOriginAllowed(location)) {
    requestForm.hidden = resetForm.hidden = emailForm.hidden = true;
    report("Este procedimento exige HTTPS na mesma origem da API.", true);
    return;
  }
  if (isEmailChange && !token) report("Link de confirmação ausente ou inválido.", true);
  const bind = (form, callback) => form.addEventListener("submit", async e => {
    e.preventDefault();
    const button = form.querySelector("button[type=submit]");
    button.disabled = true;
    report("Validando a solicitação...");
    try { await callback(new FormData(form)); form.reset(); }
    catch (error) { report(error?.message || "Não foi possível concluir.", true); }
    finally { button.disabled = false; }
  });
  bind(requestForm, async data => {
    // Neutral response; never disclose whether an account exists.
    await api.postAuth("/auth/password-reset/request",
      {email: String(data.get("email") || "").trim()});
    report("Se o e-mail estiver cadastrado, você receberá instruções de recuperação.");
  });
  bind(resetForm, async data => {
    const payload = validPassword(data.get("newPassword"), data.get("confirmPassword"));
    await api.postAuth("/auth/password-reset/confirm", {...payload, token});
    resetForm.hidden = true;
    report("Senha alterada. Faça login novamente no painel administrativo.");
  });
  bind(emailForm, async () => {
    await api.postAuth("/auth/email-change/confirm", {token});
    emailForm.hidden = true;
    report("Novo endereço confirmado. Faça login novamente para continuar.");
  });
}
if (typeof document !== "undefined") initRecovery();
