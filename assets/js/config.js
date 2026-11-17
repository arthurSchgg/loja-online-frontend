/** Only public, non-secret configuration; change mode to "live" for approved staging.
 * Production must not silently fall back to illustrative prices on API failure.
 */
export const CONFIG=Object.freeze({
 mode:"demo",                // "demo" or "live" only
 apiBaseUrl:"/api/v1",       // same-origin recommended; cross-origin public reads only
 allowExternalPublicApi:false
});
export const isLive=CONFIG.mode==="live";
