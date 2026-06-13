/** Split family approve from treasurer verify (SoD). Legacy one-step when `TREASURY_VERIFY_LEGACY=true`. */
export function isTreasuryVerifySplitEnabled(): boolean {
  return process.env.TREASURY_VERIFY_LEGACY !== 'true';
}
