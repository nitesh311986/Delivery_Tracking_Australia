import { format, isValid, parseISO } from 'date-fns';

export const safeParseDate = (
  dateInput: string | Date | null | undefined
): Date | null => {
  if (!dateInput) return null;

  if (dateInput instanceof Date) {
    return isValid(dateInput) ? dateInput : null;
  }

  let parsed = parseISO(dateInput);
  if (!isValid(parsed)) {
    parsed = new Date(dateInput);
  }

  return isValid(parsed) ? parsed : null;
};

export const safeFormatDate = (
  dateInput: string | Date | null | undefined,
  formatString: string = 'yyyy-MM-dd',
  fallback: string = '-'
): string => {
  const parsed = safeParseDate(dateInput);
  return parsed ? format(parsed, formatString) : fallback;
};
