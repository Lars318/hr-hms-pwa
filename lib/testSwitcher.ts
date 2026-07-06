/**
 * Test-brukerbytter (impersonering) er kun tilgjengelig i ikke-produksjonsmiljø,
 * og kun når den eksplisitt er skrudd på med ENABLE_TEST_SWITCHER=true.
 *
 * Defense-in-depth: selv om noen ved en feil setter ENABLE_TEST_SWITCHER=true i
 * produksjon, blir den blokkert fordi VERCEL_ENV === "production".
 */
export function isTestSwitcherEnabled(): boolean {
  if (process.env.VERCEL_ENV === "production") return false;
  return process.env.ENABLE_TEST_SWITCHER === "true";
}
