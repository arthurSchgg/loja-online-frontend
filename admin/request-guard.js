/** Invalidate stale async results after module, dialog or session changes.
 * It is a UI consistency guard, not a substitute for server-side permissions.
 */
export function createRequestGuard(){
 let revision=0;
 return {
  begin(){return ++revision;},
  invalidate(){revision++;},
  isCurrent(ticket){return Number.isSafeInteger(ticket)&&ticket===revision;}
 };
}
