/** Admin presentation only; server is the authority for campaign lifecycle. */
export function promotionStatus(p,now=Date.now()){
 if(p?.closedAt)return "closed";
 const start=Date.parse(p?.startsAt),end=Date.parse(p?.endsAt);
 if(!Number.isFinite(start)||!Number.isFinite(end))return "unknown";
 if(now<start)return "future";
 if(now>=end)return "ended";
 return "active";
}
export function promotionClosePayload(reason){
 if(typeof reason!=="string"||!reason.trim()||reason.trim().length>500)
  throw new Error("Informe uma justificativa de até 500 caracteres.");
 return {reason:reason.trim()};
}
