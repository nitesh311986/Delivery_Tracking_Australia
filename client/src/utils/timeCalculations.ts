export function toMinutes(time: string): number | null {
  const [h, m] = time.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
}

export function diffMinutes(start: string, end: string): number | null {
  const s = toMinutes(start);
  const e = toMinutes(end);
  if (s === null || e === null) return null;
  return e - s;
}

export function formatDuration(totalMinutes: number): string {
  const abs = Math.abs(totalMinutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  if (h > 0 && m > 0) {
    return `${h} hr${h > 1 ? 's' : ''} ${m} min${m > 1 ? 's' : ''}`;
  }
  if (h > 0) {
    return `${h} hr${h > 1 ? 's' : ''}`;
  }
  return `${m} min${m > 1 ? 's' : ''}`;
}

export function computeBreakEndTime(startTime: string, minutesToAdd: number): string {
  if (!startTime || !minutesToAdd) return '';
  const [hours, minutes] = startTime.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return '';
  const date = new Date();
  date.setHours(hours, minutes + minutesToAdd, 0, 0);
  return date.toTimeString().slice(0, 5);
}

export function computeTravelTime(startTime: string, firstArrivalTime: string): string | null {
  const minutes = diffMinutes(startTime, firstArrivalTime);
  return minutes !== null ? formatDuration(minutes) : null;
}

export function formatBreakInterval(
  startTime: string | undefined | null,
  durationMinutes: number | undefined | null,
  endTime: string | undefined | null
): string {
  if (!startTime || !endTime) return '';
  const duration = durationMinutes ? ` (${formatDuration(durationMinutes)})` : '';
  return `${startTime} - ${endTime}${duration}`;
}
