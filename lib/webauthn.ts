export function getRpConfig(requestUrl: string) {
  const url = new URL(requestUrl);
  const rpID = url.hostname;
  const rpName = "Truls HR";
  const origin = url.origin;
  return { rpID, rpName, origin };
}

export const CHALLENGE_COOKIE = "webauthn_challenge";
export const CHALLENGE_TTL_MS = 60_000;
