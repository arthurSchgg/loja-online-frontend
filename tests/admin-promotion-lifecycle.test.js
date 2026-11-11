import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {promotionStatus,promotionClosePayload} from "../admin/promotion-lifecycle.js";
const now=Date.parse("2026-11-11T16:00:00Z");
test("promotion states do not present ended or closed campaigns as active",()=>{
 assert.equal(promotionStatus({startsAt:"2026-11-10T00:00:00Z",endsAt:"2026-11-12T00:00:00Z"},now),"active");
 assert.equal(promotionStatus({startsAt:"2026-12-01T00:00:00Z",endsAt:"2026-12-02T00:00:00Z"},now),"future");
 assert.equal(promotionStatus({startsAt:"2026-10-01T00:00:00Z",endsAt:"2026-11-01T00:00:00Z"},now),"ended");
 assert.equal(promotionStatus({closedAt:"2026-11-11T15:00:00Z",startsAt:"2020-01-01T00:00:00Z",endsAt:"2099-01-01T00:00:00Z"},now),"closed");
 assert.equal(promotionStatus({},now),"unknown");
});
test("closure requires a meaningful bounded reason",()=>{
 assert.deepEqual(promotionClosePayload(" Fim da campanha "),{reason:"Fim da campanha"});
 for(const v of ["", " ", "x".repeat(501),null])assert.throws(()=>promotionClosePayload(v));
});
test("admin uses closure endpoint and never physically deletes promotions",()=>{
 const source=readFileSync(new URL("../admin/admin.js",import.meta.url),"utf8");
 assert.match(source,/\/promotions\/"\+p\.id\+"\/close"/);
 assert.doesNotMatch(source,/api\.write\("DELETE","\/admin\/products\/".*promotions/);
});
