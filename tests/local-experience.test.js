import test from "node:test";
import assert from "node:assert/strict";
import {localQuestions,localProfile,profiles} from "../src/types/local-experience.ts";

test("illustrative quiz returns the dominant family and resolves ties in answer order",()=>{
 assert.equal(localQuestions.length,3);
 for(const question of localQuestions)assert.equal(question.options.length,profiles.length);
 assert.equal(localProfile(["Cítrico","Floral","Floral"]),"Floral");
 assert.equal(localProfile(["Oriental","Floral","Cítrico"]),"Oriental");
 assert.equal(localProfile(["Floral"]),null);
 assert.equal(localProfile(["Floral","Floral","invalid"]),null);
});
