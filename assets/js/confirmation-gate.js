/** Prevent an outdated confirmation response from replacing the current dialog state.
 * Each new item, customization change, or dialog close invalidates older requests.
 */
export function createConfirmationGate(){
 let revision=0;
 return {
  begin(){return ++revision;},
  invalidate(){revision++;},
  isCurrent(token){return Number.isSafeInteger(token)&&token===revision;}
 };
}
