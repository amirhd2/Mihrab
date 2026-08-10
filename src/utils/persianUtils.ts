const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
const ENGLISH_DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

/**
 * Converts English numbers/digits in a string or number to Persian digits
 */
export function toPersianDigits(input: string | number | undefined | null): string {
  if (input === undefined || input === null) return '';
  const str = String(input);
  return str.replace(/\d/g, (d) => PERSIAN_DIGITS[parseInt(d, 10)] || d);
}

/**
 * Converts Persian digits back to standard English digits
 */
export function toEnglishDigits(input: string): string {
  if (!input) return '';
  let str = input;
  for (let i = 0; i < 10; i++) {
    const reg = new RegExp(PERSIAN_DIGITS[i], 'g');
    str = str.replace(reg, ENGLISH_DIGITS[i]);
  }
  return str;
}

/**
 * Formats a number with commas and converts to Persian digits (e.g., 10000 => ۱۰,۰۰۰)
 */
export function formatPersianNumber(num: number): string {
  const formatted = new Intl.NumberFormat('fa-IR').format(num);
  return formatted;
}
