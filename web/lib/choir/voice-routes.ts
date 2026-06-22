export const VOICE_ROUTE_TAILS = ['voice-sections'] as const;

export function voiceRouteTailFromPath(pathname: string): string | null {
  for (const tail of VOICE_ROUTE_TAILS) {
    if (pathname === `/choir/${tail}` || pathname === `/choir/${tail}/`) {
      return tail;
    }
    const match = pathname.match(new RegExp(`^/choir/[^/]+/${tail}(?:/|$)`));
    if (match) return tail;
  }
  return null;
}

export function isVoiceRoutePath(pathname: string): boolean {
  return voiceRouteTailFromPath(pathname) != null;
}
