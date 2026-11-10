/** IDs arriving from API/query strings must be numeric before HTML interpolation.
 * Never trust identifiers just because surrounding DTO fields look well-formed.
 */
export function safeNumericId(raw){
 if(typeof raw!=="number"&&typeof raw!=="string")return null;
 if(typeof raw==="string"&&!/^[1-9][0-9]*$/.test(raw))return null;
 const id=Number(raw);
 return Number.isSafeInteger(id)&&id>0?id:null;
}
