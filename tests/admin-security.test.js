import test from "node:test";
import assert from "node:assert/strict";
import {AdminApi, AdminApiError} from "../admin/api.js";
import {validateRotation, validateEmailChange} from "../admin/security.js";
import {extractOneTimeToken, validPassword} from "../admin/recovery.js";

test("password rotation checks 12–128 characters and confirmation", () => {
  const good = validateRotation("current-secret-phrase", "another very long phrase", "another very long phrase");
  assert.equal(good.currentPassword, "current-secret-phrase");
  assert.equal(good.newPassword, good.confirmPassword);
  assert.throws(() => validateRotation("old", "short", "short"));
  assert.throws(() => validateRotation("old", "a".repeat(129), "a".repeat(129)));
  assert.throws(() => validateRotation("old", "long unique new password", "different new password"));
  assert.throws(() => validateRotation("same long phrase", "same long phrase", "same long phrase"));
});
test("email change validates address and password without storing them", () => {
  assert.deepEqual(validateEmailChange("secret", "  OWNER@EXAMPLE.COM "),
    {currentPassword: "secret", newEmail: "owner@example.com"});
  assert.throws(() => validateEmailChange("", "owner@example.com"));
  assert.throws(() => validateEmailChange("secret", "not-email"));
  assert.throws(() => validateEmailChange("secret", "a".repeat(255) + "@example.com"));
});
test("one-time reset token is scrubbed from URL before using it", () => {
  const visited = [];
  const token = extractOneTimeToken("https://shop.example/reset-password.html?token=PRIVATE_VALUE&lang=pt#help",
    uri => visited.push(uri));
  assert.equal(token, "PRIVATE_VALUE");
  assert.deepEqual(visited, ["/reset-password.html?lang=pt#help"]);
  assert.equal(extractOneTimeToken("https://shop.example/reset-password.html?lang=pt", () => assert.fail()), null);
});
test("recovery password confirmation requires a long matching phrase", () => {
  assert.deepEqual(validPassword("twelve chars and more", "twelve chars and more"),
    {newPassword:"twelve chars and more", confirmPassword:"twelve chars and more"});
  assert.throws(() => validPassword("short", "short"));
  assert.throws(() => validPassword("long enough phrase", "other enough phrase"));
});
test("public recovery endpoints require in-memory CSRF and same-origin cookies", async () => {
  const calls = [];
  const api = new AdminApi(async (path, options) => {
    calls.push({path,options});
    if (path.endsWith("/csrf")) return {ok:true,status:200,json:async()=>({headerName:"X-CSRF-TOKEN",token:"test-token"})};
    return {ok:true,status:204,json:async()=>null};
  });
  await api.postAuth("/auth/password-reset/confirm", {token:"test",newPassword:"long passphrase example",confirmPassword:"long passphrase example"});
  assert.equal(calls[0].path, "/api/v1/auth/csrf");
  assert.equal(calls[1].path, "/api/v1/auth/password-reset/confirm");
  assert.equal(calls[1].options.credentials, "same-origin");
  assert.equal(calls[1].options.headers["X-CSRF-TOKEN"], "test-token");
  assert.match(calls[1].options.body,/long passphrase example/);
  await assert.rejects(() => api.postAuth("/admin/brands",{}), AdminApiError);
});
test("recovery errors do not reveal server responses", async () => {
  const api = new AdminApi(async path => path.endsWith("/csrf")?
    {ok:true,status:200,json:async()=>({headerName:"X-CSRF-TOKEN",token:"x"})}:
    {ok:false,status:429,json:async()=>({internalToken:"do-not-show"})});
  await assert.rejects(
    ()=>api.postAuth("/auth/password-reset/request",{email:"owner@example.com"}),
    error=>error.status===429&&!error.message.includes("do-not-show"));
});
