import {isLive} from "./config.js";
import {fetchStore,fetchExperiences,fetchExperience,evaluateExperience} from "./api.js";
import {officialStoreLinks} from "./official-contact.js";
import {mountContact,mountExperience,experienceList,experienceDetail,experienceResult,object,string} from "../modern/public-extra.js";

// Preserve the same-origin API client and official link validation. React owns UI state.
mountContact(isLive,async signal=>{
 const store=object(await fetchStore(signal));
 const channels=officialStoreLinks(store);
 const fields=[["Horários",store.openingHours],["Localização",store.address],["Região de atendimento",store.region]];
 return {channels,details:fields.flatMap(([label,value])=>string(value)?[{label,value:string(value)}]:[])};
});
mountExperience(isLive,{
 list:async signal=>experienceList(await fetchExperiences(signal)),
 detail:async(id,signal)=>experienceDetail(await fetchExperience(id,signal),id),
 evaluate:async(id,answers)=>experienceResult(await evaluateExperience(id,answers))
});
