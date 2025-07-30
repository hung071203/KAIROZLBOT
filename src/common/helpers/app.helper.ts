export function parseDate(date: string | Date | null | undefined): Date | null {
  if (date instanceof Date) {
    return date;
  } else if (typeof date === "string") {
    const parsed = new Date(date);
    return isNaN(parsed.getTime()) ? null : parsed;
  } else {
    return null;
  }
}

