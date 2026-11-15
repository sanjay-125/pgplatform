export const EMAIL_PATTERN = '[^\\s@]+@[^\\s@]+\\.[^\\s@]+';

export const isValidEmail = (value: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export const isValidIndianPhone = (value: string): boolean =>
  /^[6-9]\d{9}$/.test(value.trim());

export const formatIndianDate = (dateStr: string | undefined | null): string => {
  if (!dateStr) return '';
  const trimmed = dateStr.trim();
  if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) return trimmed;

  const cleanDateStr = trimmed.slice(0, 10);
  const parts = cleanDateStr.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    const [year, month, day] = parts;
    return `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year}`;
  }

  try {
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    }
  } catch {
    // ignore
  }

  return trimmed;
};

export const formatRentPeriod = (period?: string | null): string => {
  if (!period) return '—';
  const clean = period.trim();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Match YYYY-MM (e.g. 2026-11 -> Nov 2026)
  const yyyyMmMatch = clean.match(/^(\d{4})-(\d{1,2})$/);
  if (yyyyMmMatch) {
    const year = yyyyMmMatch[1];
    const monthIndex = parseInt(yyyyMmMatch[2], 10) - 1;
    if (monthIndex >= 0 && monthIndex < 12) {
      return `${months[monthIndex]} ${year}`;
    }
  }

  // Match MM-YYYY or MM/YYYY (e.g. 11-2026 -> Nov 2026)
  const mmYyyyMatch = clean.match(/^(\d{1,2})[-/](\d{4})$/);
  if (mmYyyyMatch) {
    const monthIndex = parseInt(mmYyyyMatch[1], 10) - 1;
    const year = mmYyyyMatch[2];
    if (monthIndex >= 0 && monthIndex < 12) {
      return `${months[monthIndex]} ${year}`;
    }
  }

  // Fallback to Date parsing if standard date string
  try {
    const d = new Date(clean.length <= 7 && clean.includes('-') ? `${clean}-01` : clean);
    if (!isNaN(d.getTime())) {
      return `${months[d.getMonth()]} ${d.getFullYear()}`;
    }
  } catch {
    // ignore
  }

  return clean;
};
