import test from "node:test";
import assert from "node:assert/strict";
import {validatePublicApiBaseUrl} from "../tools/cloudflare-api-url.mjs";

test("aceita endereço HTTPS público da API", () => {
  assert.equal(validatePublicApiBaseUrl("https://lojinha-preview.onrender.com/api/v1"),
    "https://lojinha-preview.onrender.com/api/v1");
});
test("rejeita API sem TLS ou path incorreto", () => {
  for (const value of ["", "/api/v1", "http://exemplo.com/api/v1",
    "https://exemplo.com/", "https://exemplo.com/api/v1/admin",
    "https://usuario:senha@exemplo.com/api/v1",
    "https://exemplo.com/api/v1?token=123", "https://exemplo.com/api/v1#frag",
    "https://localhost/api/v1", "https://127.0.0.1/api/v1",
    "https://192.168.0.10/api/v1"]) {
    assert.throws(() => validatePublicApiBaseUrl(value), value);
  }
});
