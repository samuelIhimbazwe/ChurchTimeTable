const protectedSegments = ["/dashboard"];

export function isProtectedPath(pathname: string) {
  return protectedSegments.some((segment) => pathname.includes(segment));
}
