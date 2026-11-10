/** Administrative account actions. Never stores passwords, email tokens or CSRF. */
export function validateRotation(current, next, confirmation) {
  if (!current || typeof next !== "string" || next.length < 12 || next.length > 128)
    throw new Error("Informe a senha atual e uma nova frase-senha de 12 a 128 caracteres.");
  if (next !== confirmation) throw new Error("A confirmação da nova senha não corresponde.");
  if (next === current) throw new Error("Escolha uma senha diferente da atual.");
  return {currentPassword: current, newPassword: next, confirmPassword: confirmation};
}
export function validateEmailChange(currentPassword, newEmail) {
  const email = String(newEmail || "").trim().toLowerCase();
  if (!currentPassword || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new Error("Informe a senha atual e um endereço de e-mail válido.");
  return {currentPassword, newEmail: email};
}
function status(element, text, isError = false) {
  element.textContent = text;
  element.classList.toggle("error", isError);
}
export function setupSecurityPanel(api, {onPasswordChanged, onSessionExpired} = {}) {
  const passwordForm = document.getElementById("security-password-form");
  const emailForm = document.getElementById("security-email-form");
  if (!passwordForm || !emailForm) return;
  passwordForm.addEventListener("submit", async event => {
    event.preventDefault();
    const button = passwordForm.querySelector("button[type=submit]");
    const feedback = document.getElementById("security-password-status");
    button.disabled = true;
    status(feedback, "Atualizando as credenciais...");
    try {
      const fields = new FormData(passwordForm);
      const payload = validateRotation(
        fields.get("currentPassword"), fields.get("newPassword"), fields.get("confirmPassword"));
      await api.write("POST", "/admin/security/change-password", payload);
      passwordForm.reset();
      status(feedback, "Senha alterada. Todas as sessões foram encerradas; faça login novamente.");
      onPasswordChanged?.();
    } catch (error) {
      // Do not include request payload, password or server response body in the UI.
      status(feedback, error?.message || "Não foi possível alterar a senha.", true);
      if (error?.status === 401) onSessionExpired?.();
    } finally {
      // Failed requests must not leave current/new passwords in form controls.
      passwordForm.querySelectorAll('input[type="password"]').forEach(input => { input.value = ""; });
      button.disabled = false;
    }
  });
  emailForm.addEventListener("submit", async event => {
    event.preventDefault();
    const button = emailForm.querySelector("button[type=submit]");
    const feedback = document.getElementById("security-email-status");
    button.disabled = true;
    status(feedback, "Solicitando confirmação...");
    try {
      const fields = new FormData(emailForm);
      await api.write("POST", "/admin/security/change-email",
        validateEmailChange(fields.get("currentPassword"), fields.get("newEmail")));
      emailForm.reset();
      status(feedback, "Solicitação recebida. Confirme a alteração no novo endereço de e-mail.");
    } catch (error) {
      status(feedback, error?.message || "Não foi possível solicitar a alteração.", true);
      if (error?.status === 401) onSessionExpired?.();
    } finally {
      // Failed requests must not leave current/new passwords in form controls.
      emailForm.querySelectorAll('input[type="password"]').forEach(input => { input.value = ""; });
      button.disabled = false;
    }
  });
}
