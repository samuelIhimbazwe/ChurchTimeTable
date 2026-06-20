export type KeyboardShortcut = {
  keys: string
  label: string
  group: 'Navigation' | 'Panels' | 'Tables'
}

export const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  { keys: 'Ctrl / ⌘ + K', label: 'Open command palette (search & jump)', group: 'Navigation' },
  { keys: '?', label: 'Open help & keyboard shortcuts', group: 'Navigation' },
  { keys: 'Esc', label: 'Close open panel or modal', group: 'Panels' },
  { keys: '↑ ↓', label: 'Navigate command palette results', group: 'Panels' },
  { keys: 'Enter', label: 'Open selected command palette item', group: 'Panels' },
  { keys: '↑ ↓', label: 'Move between table rows (when focused)', group: 'Tables' },
  { keys: 'Enter', label: 'Open focused table row', group: 'Tables' },
  { keys: 'Space', label: 'Select / toggle table row', group: 'Tables' },
]
