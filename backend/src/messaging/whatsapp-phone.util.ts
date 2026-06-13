/** Normalize member phone to WhatsApp Cloud API `to` field (digits only, no +). */
export function normalizeWhatsAppPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 9) return null;

  if (digits.startsWith('250') && digits.length === 12) {
    return digits;
  }
  if (digits.startsWith('0') && digits.length === 10) {
    return `250${digits.slice(1)}`;
  }
  if (digits.length === 9) {
    return `250${digits}`;
  }

  return digits.length >= 10 ? digits : null;
}
