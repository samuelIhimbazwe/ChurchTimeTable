/** Set before programmatic tour navigation so pathname changes do not end the tour. */
export const tourProgrammaticNavRef = { current: false }

export function markTourProgrammaticNav() {
  tourProgrammaticNavRef.current = true
}
