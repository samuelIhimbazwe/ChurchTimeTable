/** Marks controls nested inside clickable table rows so row navigation does not fire. */
export const STOP_ROW_CLICK_ATTR = 'data-stop-row-click'

export const stopRowClickProps = {
  [STOP_ROW_CLICK_ATTR]: true,
} as const

const NESTED_INTERACTIVE = [
  `[${STOP_ROW_CLICK_ATTR}]`,
  'a[href]',
  'button',
  'input',
  'select',
  'textarea',
  '[role="button"]',
  '[role="link"]',
  '[role="checkbox"]',
  '[role="menuitem"]',
  'label',
].join(',')

/** True when the event target is (or is inside) a nested control — skip row-level navigation. */
export function isNestedInteractiveClick(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false
  return !!target.closest(NESTED_INTERACTIVE)
}
