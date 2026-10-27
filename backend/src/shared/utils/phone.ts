// Normalise a phone number for duplicate checks, so "024 555 0133",
// "0245550133" and "+233 24 555 0133" all become "233245550133".
// Local Ghana numbers (0 + 9 digits) get the 233 country code.
export function phoneKey(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (/^0\d{9}$/.test(digits)) return `233${digits.slice(1)}`;
  if (digits.startsWith('00')) return digits.slice(2);
  return digits;
}
