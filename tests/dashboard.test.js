import test from "node:test";
import assert from "node:assert/strict";
import {summarizeProducts} from "../admin/owner-tools.js";
test("dashboard counts pending prices, low stock and current effective discounts",()=>{
 assert.deepEqual(summarizeProducts([{stockQuantity:0,price:null,priceStatus:"ON_REQUEST"},{stockQuantity:4,price:100,effectivePrice:80},{stockQuantity:3,price:50,effectivePrice:50}]),{total:3,low:2,pending:1,promotions:1});
});
