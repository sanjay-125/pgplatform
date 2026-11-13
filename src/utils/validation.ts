export const EMAIL_PATTERN = '[^\\s@]+@[^\\s@]+\\.[^\\s@]+';

export const isValidEmail = (value: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export const isValidIndianPhone = (value: string): boolean =>
  /^[6-9]\d{9}$/.test(value.trim());
